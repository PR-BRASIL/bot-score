import {
  type ChatInputCommandInteraction,
  type AutocompleteInteraction,
  EmbedBuilder,
} from "discord.js";
import type { Command } from "../protocols/command";
import { mongoHelper } from "../../infra/db/mongodb/helpers/mongo-helper";
import type { User, FavoriteMap } from "../../domain/models/user";

// Lista hard-coded de mapas do site mapgallery.realitymod.com (82 mapas)
const AVAILABLE_MAPS = [
  "Al Basrah",
  "Andromeda",
  "Asad Khal",
  "Adak - BETA",
  "Ascheberg",
  "Assault on Grozny",
  "Assault on Mestia",
  "Bamyan",
  "Battle of Debrecen",
  "Battle of Ia Drang",
  "Battle of Kerch",
  "Beirut",
  "Belyaevo",
  "Black Gold",
  "Brecourt Assault",
  "Burning Sands",
  "Carentan",
  "Charlies Point",
  "Deagle5",
  "Donbas",
  "Dovre",
  "Dovre Winter",
  "Dragon Fly",
  "Fallujah West",
  "Fields of Kassel",
  "Fools Road",
  "Gaza",
  "Goose Green",
  "Grostok",
  "Hades Peak",
  "Hill 488",
  "Iron Ridge",
  "Kafr Halab",
  "Karbala",
  "Kashan Desert",
  "Khamisiyah",
  "Kokan",
  "Korbach Offensive - BETA",
  "Korengal Valley",
  "Kozelsk",
  "Krivaja Valley",
  "Kunar Province - BETA",
  "Lashkar Valley",
  "Masirah",
  "Merville",
  "Musa Qala - BETA",
  "Muttrah City",
  "Nuijamaa",
  "Omaha Beach",
  "Operation Barracuda",
  "Operation Bobcat",
  "Operation Brunswick",
  "Operation Falcon",
  "Operation Marlin",
  "Operation Soul Rebel",
  "Operation Thunder - BETA",
  "Outpost",
  "Pavlovsk Bay",
  "Ramiel",
  "Ras el Masri",
  "Reichswald",
  "Road to Damascus - BETA",
  "Route E-106",
  "Rzhev",
  "Saaremaa",
  "Sahel",
  "Sbeneh Outskirts",
  "Shahadah",
  "Shijia Valley",
  "Shipment",
  "Silent Eagle",
  "Stalingrad",
  "Stalingrad Summer",
  "Tad Sae Offensive",
  "The Falklands",
  "Ulyanovsk",
  "Vadso City",
  "Vung Ro",
  "Wanda Shan",
  "Xiangshan",
  "Yamalia",
  "Zakho - BETA",
];

const MODES = ["AAS", "Insurgency", "Skirmish", "Gungame"] as const;

export class ManageFavoriteMapsCommand implements Command {
  public async execute(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const discordId = interaction.user.id;
    const mapName = interaction.options.getString("mapa", true);
    const mode = interaction.options.getString(
      "modo",
      true
    ) as FavoriteMap["mode"];

    // Validar se o mapa existe na lista
    if (!AVAILABLE_MAPS.includes(mapName)) {
      await interaction.editReply({
        content: "❌ Mapa inválido! Por favor, escolha um mapa da lista.",
      });
      return;
    }

    // Validar modo
    if (!MODES.includes(mode)) {
      await interaction.editReply({
        content: "❌ Modo inválido! Por favor, escolha um modo válido.",
      });
      return;
    }

    const userCollection = await mongoHelper.getCollection<User>("user");
    const user = await userCollection.findOne({ discordUserId: discordId });

    if (!user) {
      const discordUser = interaction.user;
      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle("❌ Conta não vinculada")
        .setDescription(
          "Para usar esta funcionalidade, você precisa vincular sua conta do Discord ao jogo."
        )
        .addFields({
          name: "📋 Como vincular sua conta",
          value:
            `1️⃣ Entre no servidor **Reality Brasil** no Project Reality\n` +
            `2️⃣ No chat do jogo, execute o comando:\n` +
            `   \`\`\`!link-discord ${discordUser.username}\`\`\`\n` +
            `3️⃣ Aguarde a confirmação de vinculação\n` +
            `4️⃣ Volte para o Discord e confirme a vinculação`,
          inline: false,
        })
        .addFields({
          name: "✨ Após vincular",
          value:
            "Você terá acesso a todas as funcionalidades de favoritos e poderá gerenciar seus mapas preferidos! 🎮",
          inline: false,
        })
        .setFooter({
          text: "Reality Brasil • Sistema de Favoritos",
          iconURL: interaction.guild?.iconURL() || undefined,
        })
        .setTimestamp();

      await interaction.editReply({
        embeds: [embed],
      });
      return;
    }

    const favoriteMap: FavoriteMap = {
      name: mapName,
      mode,
    };

    const favoriteMaps = user.favoriteMaps || [];

    // Verificar se já existe
    const exists = favoriteMaps.some(
      (map) => map.name === favoriteMap.name && map.mode === favoriteMap.mode
    );

    if (exists) {
      await interaction.editReply({
        content: "❌ Este mapa já está na sua lista de favoritos!",
      });
      return;
    }

    favoriteMaps.push(favoriteMap);
    await userCollection.updateOne(
      { discordUserId: discordId },
      { $set: { favoriteMaps } }
    );

    await interaction.editReply({
      content: `✅ Mapa **${mapName}** (${mode}) adicionado aos favoritos!`,
    });
  }

  public static async handleAutocomplete(
    interaction: AutocompleteInteraction
  ): Promise<void> {
    const focusedOption = interaction.options.getFocused(true);

    if (focusedOption.name === "mapa") {
      // Mostrar todos os mapas disponíveis
      const searchValue = focusedOption.value.toLowerCase();
      const filtered = AVAILABLE_MAPS.filter((map) =>
        map.toLowerCase().includes(searchValue)
      )
        .slice(0, 25)
        .map((map) => ({
          name: map,
          value: map,
        }));

      await interaction.respond(filtered);
    } else if (focusedOption.name === "modo") {
      const searchValue = focusedOption.value.toLowerCase();
      const filtered = MODES.filter((mode) =>
        mode.toLowerCase().includes(searchValue)
      )
        .slice(0, 25)
        .map((mode) => ({
          name: mode,
          value: mode,
        }));

      await interaction.respond(filtered);
    }
  }
}
