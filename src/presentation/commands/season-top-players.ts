import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ComponentType,
} from "discord.js";
import type { Command } from "../protocols/command";
import { mongoHelper } from "../../infra/db/mongodb/helpers/mongo-helper";
import type { User } from "../../domain/models/user";
import { getPatent } from "../../utils/patents";
import { GetPatentProgress } from "../../utils/getPatentProgress";

export class SeasonTopPlayersCommand implements Command {
  private readonly playersPerPage = 6;

  public async execute(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const limit = interaction.options.getInteger("limit") || 500;
    const searchTerm = interaction.options.getString("buscar");

    const collection = await mongoHelper.getCollection("monthly_user");
    const topPlayers = await collection
      .find<User>({})
      .sort({ score: -1 })
      .limit(limit)
      .toArray();

    if (!topPlayers || topPlayers.length === 0) {
      await interaction.editReply({
        content:
          "Não foi possível encontrar jogadores no ranking mensal! Talvez a temporada tenha acabado ou ainda não tenha ninguém pontuando.",
      });
      return;
    }

    let currentPage = 0;
    const totalPages = Math.ceil(topPlayers.length / this.playersPerPage);

    let foundPlayerIndex = -1;
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      foundPlayerIndex = topPlayers.findIndex((player) =>
        player.name.toLowerCase().includes(lowerSearchTerm)
      );

      if (foundPlayerIndex !== -1) {
        currentPage = Math.floor(foundPlayerIndex / this.playersPerPage);
      } else {
        await interaction.editReply({
          content: `Jogador com nome "${searchTerm}" não encontrado no ranking mensal!`,
        });
        return;
      }
    }

    const embed = await this.createEmbed(
      topPlayers,
      currentPage,
      foundPlayerIndex
    );

    const row = this.createButtons(currentPage, totalPages);

    const response = await interaction.editReply({
      embeds: [embed],
      components: [row],
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000,
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({
          content: "Você não pode usar estes botões.",
          ephemeral: true,
        });
        return;
      }

      if (i.customId === "previous") {
        currentPage = Math.max(0, currentPage - 1);
      } else if (i.customId === "next") {
        currentPage = Math.min(totalPages - 1, currentPage + 1);
      } else if (i.customId === "first") {
        currentPage = 0;
      } else if (i.customId === "last") {
        currentPage = totalPages - 1;
      }

      const updatedEmbed = await this.createEmbed(
        topPlayers,
        currentPage,
        foundPlayerIndex
      );
      const updatedRow = this.createButtons(currentPage, totalPages);

      await i.update({
        embeds: [updatedEmbed],
        components: [updatedRow],
      });
    });

    collector.on("end", async () => {
      await interaction
        .editReply({
          components: [],
        })
        .catch(() => {});
    });
  }

  private createButtons(currentPage: number, totalPages: number) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("first")
        .setLabel("⏮️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 0),
      new ButtonBuilder()
        .setCustomId("previous")
        .setLabel("◀️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 0),
      new ButtonBuilder()
        .setCustomId("page")
        .setLabel(`${currentPage + 1}/${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("▶️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === totalPages - 1),
      new ButtonBuilder()
        .setCustomId("last")
        .setLabel("⏭️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === totalPages - 1)
    );

    return row;
  }

  private async createEmbed(
    topPlayers: User[],
    currentPage: number,
    highlightPlayerIndex: number = -1
  ) {
    const startIndex = currentPage * this.playersPerPage;
    const endIndex = Math.min(
      startIndex + this.playersPerPage,
      topPlayers.length
    );
    const playersOnPage = topPlayers.slice(startIndex, endIndex);

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setAuthor({
        name: "Reality Brasil",
      })
      .setTitle("🏅 Temporada Mensal - Top Jogadores")
      .setDescription(
        "Ranking dos jogadores da temporada mensal do Reality Brasil, ordenados por pontuação!\n" +
          "📅 Apenas partidas da temporada vigente contam para este ranking.\n" +
          "⚡ **DICA:** Jogue entre 7h e 14h para ganhar o **DOBRO** de pontuação!\n" +
          "Utilize o comando `/stats` para ver as informações detalhadas de um jogador."
      )
      .setTimestamp();

    for (let i = 0; i < playersOnPage.length; i++) {
      const player = playersOnPage[i];
      const position = startIndex + i + 1;
      const patent = (await getPatent(player.score)).split(" <");
      const progress =
        "**" + (await new GetPatentProgress().get(player.score)) + "**";

      const isHighlighted = startIndex + i === highlightPlayerIndex;

      let positionDisplay = `${position}º Lugar`;
      if (position === 1)
        positionDisplay = "<a:first:1353055748262989867> 1º Lugar";
      else if (position === 2) positionDisplay = "🥈 2º Lugar";
      else if (position === 3) positionDisplay = "🥉 3º Lugar";

      if (isHighlighted) {
        positionDisplay = `🔍 ${positionDisplay}`;
      }

      const kdRatio =
        player.deaths > 0
          ? (player.kills / player.deaths).toFixed(2)
          : player.kills.toFixed(2);

      const fieldValue = isHighlighted
        ? `> \n> **<${patent[1] || ""} ${patent[0]}**\n> \n` +
          `> **🔍 JOGADOR ENCONTRADO 🔍**\n` +
          `> ⭐ **Score Mensal:** ${player.score.toLocaleString(
            "pt-BR"
          )} pontos\n` +
          `> 🎮 **Partidas:** ${(player.rounds || 0).toLocaleString(
            "pt-BR"
          )}\n` +
          `> 🤝 **Teamwork:** ${player.teamWorkScore.toLocaleString(
            "pt-BR"
          )}\n` +
          `> 🎯 **K/D:** ${player.kills.toLocaleString(
            "pt-BR"
          )} / ${player.deaths.toLocaleString("pt-BR")} (${kdRatio})\n` +
          `> **${progress}**`
        : `> \n> **<${patent[1] || ""} ${patent[0]}**\n> \n` +
          `> ⭐ **Score Mensal:** ${player.score.toLocaleString(
            "pt-BR"
          )} pontos\n` +
          `> 🎮 **Partidas:** ${(player.rounds || 0).toLocaleString(
            "pt-BR"
          )}\n` +
          `> 🤝 **Teamwork:** ${player.teamWorkScore.toLocaleString(
            "pt-BR"
          )}\n` +
          `> 🎯 **K/D:** ${player.kills.toLocaleString(
            "pt-BR"
          )} / ${player.deaths.toLocaleString("pt-BR")} (${kdRatio})\n` +
          `> **${progress}**`;

      embed.addFields({
        name: `${positionDisplay} - ${
          player.name
        } (${player.score.toLocaleString("pt-BR")} pts)`,
        value: fieldValue,
        inline: false,
      });
    }

    embed.setFooter({
      text: `Reality Brasil • Página ${currentPage + 1}/${Math.ceil(
        topPlayers.length / this.playersPerPage
      )} • ${new Date().toLocaleDateString("pt-BR")}`,
    });

    return embed;
  }
}


