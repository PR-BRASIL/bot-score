import {
  type ChatInputCommandInteraction,
  type AutocompleteInteraction,
  EmbedBuilder,
} from "discord.js";
import type { Command } from "../protocols/command";
import { mongoHelper } from "../../infra/db/mongodb/helpers/mongo-helper";
import type { User, FavoriteMap } from "../../domain/models/user";

export class RemoveFavoriteMapCommand implements Command {
  public async execute(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const discordId = interaction.user.id;
    const mapCombination = interaction.options.getString("mapa", true);

    // Parsear a combinação "Mapa - Modo"
    // O modo sempre será o último elemento após o split, pois os modos são fixos
    const parts = mapCombination.split(" - ");
    if (parts.length < 2) {
      await interaction.editReply({
        content: "❌ Formato inválido! Use o formato: Mapa - Modo",
      });
      return;
    }

    // O último elemento é sempre o modo
    const mode = parts[parts.length - 1];
    // O nome do mapa é tudo antes do último elemento
    const mapName = parts.slice(0, -1).join(" - ");

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

    const favoriteMaps = user.favoriteMaps || [];

    const index = favoriteMaps.findIndex(
      (map) => map.name === mapName && map.mode === mode
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
      content: `✅ Mapa **${mapName}** (${mode}) removido dos favoritos!`,
    });
  }

  public static async handleAutocomplete(
    interaction: AutocompleteInteraction
  ): Promise<void> {
    const focusedOption = interaction.options.getFocused(true);
    const discordId = interaction.user.id;

    if (!focusedOption.value.trim()) {
      await interaction.respond([]);
      return;
    }

    if (focusedOption.name === "mapa") {
      const userCollection = await mongoHelper.getCollection<User>("user");
      const user = await userCollection.findOne({ discordUserId: discordId });
      const favoriteMaps = user?.favoriteMaps || [];

      // Criar combinações no formato "Mapa - Modo"
      const combinations = favoriteMaps.map(
        (map) => `${map.name} - ${map.mode}`
      );

      const searchValue = focusedOption.value.toLowerCase();
      const filtered = combinations
        .filter((combo) => combo.toLowerCase().includes(searchValue))
        .slice(0, 25)
        .map((combo) => ({
          name: combo,
          value: combo,
        }));

      await interaction.respond(filtered);
    }
  }
}
