import {
  type ChatInputCommandInteraction,
  type AutocompleteInteraction,
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
const LAYOUTS = ["Inf", "Alt", "Std", "Lrg"] as const;

export class ManageFavoriteMapsCommand implements Command {
  public async execute(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const discordId = interaction.user.id;
    const action = interaction.options.getString("acao", true);
    const mapName = interaction.options.getString("mapa", true);
    const mode = interaction.options.getString(
      "modo",
      true
    ) as FavoriteMap["mode"];
    const layout = interaction.options.getString(
      "layout",
      true
    ) as FavoriteMap["layout"];

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

    // Validar layout
    if (!LAYOUTS.includes(layout)) {
      await interaction.editReply({
        content: "❌ Layout inválido! Por favor, escolha um layout válido.",
      });
      return;
    }

    const userCollection = await mongoHelper.getCollection<User>("user");
    const user = await userCollection.findOne({ discordUserId: discordId });

    if (!user) {
      await interaction.editReply({
        content:
          "❌ Usuário não encontrado! Você precisa estar vinculado ao sistema.",
      });
      return;
    }

    const favoriteMap: FavoriteMap = {
      name: mapName,
      mode,
      layout,
    };

    if (action === "adicionar") {
      const favoriteMaps = user.favoriteMaps || [];

      // Verificar se já existe
      const exists = favoriteMaps.some(
        (map) =>
          map.name === favoriteMap.name &&
          map.mode === favoriteMap.mode &&
          map.layout === favoriteMap.layout
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
        content: `✅ Mapa **${mapName}** (${mode} - ${layout}) adicionado aos favoritos!`,
      });
    } else if (action === "remover") {
      const favoriteMaps = user.favoriteMaps || [];

      const index = favoriteMaps.findIndex(
        (map) =>
          map.name === favoriteMap.name &&
          map.mode === favoriteMap.mode &&
          map.layout === favoriteMap.layout
      );

      if (index === -1) {
        await interaction.editReply({
          content: "❌ Este mapa não está na sua lista de favoritos!",
        });
        return;
      }

      favoriteMaps.splice(index, 1);
      await userCollection.updateOne(
        { discordUserId: discordId },
        { $set: { favoriteMaps } }
      );

      await interaction.editReply({
        content: `✅ Mapa **${mapName}** (${mode} - ${layout}) removido dos favoritos!`,
      });
    }
  }

  public static async handleAutocomplete(
    interaction: AutocompleteInteraction
  ): Promise<void> {
    const focusedOption = interaction.options.getFocused(true);
    const discordId = interaction.user.id;
    const action = interaction.options.getString("acao");

    if (focusedOption.name === "mapa") {
      const userCollection = await mongoHelper.getCollection<User>("user");
      const user = await userCollection.findOne({ discordUserId: discordId });

      const favoriteMaps = user?.favoriteMaps || [];
      const addedMapNames = new Set(favoriteMaps.map((map) => map.name));

      let availableMaps: string[];

      if (action === "remover") {
        // Para remover, mostrar apenas os mapas já adicionados
        availableMaps = Array.from(addedMapNames);
      } else {
        // Para adicionar, filtrar mapas já adicionados
        availableMaps = AVAILABLE_MAPS.filter((map) => !addedMapNames.has(map));
      }

      const searchValue = focusedOption.value.toLowerCase();
      const filtered = availableMaps
        .filter((map) => map.toLowerCase().includes(searchValue))
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
    } else if (focusedOption.name === "layout") {
      const searchValue = focusedOption.value.toLowerCase();
      const filtered = LAYOUTS.filter((layout) =>
        layout.toLowerCase().includes(searchValue)
      )
        .slice(0, 25)
        .map((layout) => ({
          name: layout,
          value: layout,
        }));

      await interaction.respond(filtered);
    }
  }
}
