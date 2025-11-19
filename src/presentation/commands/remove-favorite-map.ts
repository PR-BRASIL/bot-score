import {
  type ChatInputCommandInteraction,
  type AutocompleteInteraction,
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

    // Parsear a combinação "Mapa - Modo - Layout"
    const parts = mapCombination.split(" - ");
    if (parts.length !== 3) {
      await interaction.editReply({
        content: "❌ Formato inválido! Use o formato: Mapa - Modo - Layout",
      });
      return;
    }

    const [mapName, mode, layout] = parts;

    const userCollection = await mongoHelper.getCollection<User>("user");
    const user = await userCollection.findOne({ discordUserId: discordId });

    if (!user) {
      await interaction.editReply({
        content:
          "❌ Usuário não encontrado! Você precisa estar vinculado ao sistema.",
      });
      return;
    }

    const favoriteMaps = user.favoriteMaps || [];

    const index = favoriteMaps.findIndex(
      (map) =>
        map.name === mapName && map.mode === mode && map.layout === layout
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

  public static async handleAutocomplete(
    interaction: AutocompleteInteraction
  ): Promise<void> {
    const focusedOption = interaction.options.getFocused(true);
    const discordId = interaction.user.id;

    if (focusedOption.name === "mapa") {
      const userCollection = await mongoHelper.getCollection<User>("user");
      const user = await userCollection.findOne({ discordUserId: discordId });
      const favoriteMaps = user?.favoriteMaps || [];

      // Criar combinações no formato "Mapa - Modo - Layout"
      const combinations = favoriteMaps.map(
        (map) => `${map.name} - ${map.mode} - ${map.layout}`
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
