import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ComponentType,
} from "discord.js";
import type { Command } from "../protocols/command";
import type { GetTopPlayers } from "../../domain/usecase/get-user-information";
import { getPatent } from "../../utils/patents";
import { GetPatentProgress } from "../../utils/getPatentProgress";

export class TopPlayersCommand implements Command {
  private readonly playersPerPage = 6;

  public constructor(private readonly getTopPlayersRepository: GetTopPlayers) {}

  public async execute(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    // Get total number of players to show from command options, default to 25
    const limit = interaction.options.getInteger("limit") || 500;
    const searchTerm = interaction.options.getString("buscar");

    // Fetch the top players
    const topPlayers = await this.getTopPlayersRepository.getTopPlayers(limit);

    if (!topPlayers || topPlayers.length === 0) {
      await interaction.reply({
        content: "Não foi possível encontrar jogadores no ranking!",
        ephemeral: true,
      });
      return;
    }

    // Initialize page variables
    let currentPage = 0;
    const totalPages = Math.ceil(topPlayers.length / this.playersPerPage);

    // Store the found player index for highlighting
    let foundPlayerIndex = -1;

    // If search term is provided, find the player and set the page accordingly
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      foundPlayerIndex = topPlayers.findIndex((player) =>
        player.name.toLowerCase().includes(lowerSearchTerm)
      );

      if (foundPlayerIndex !== -1) {
        currentPage = Math.floor(foundPlayerIndex / this.playersPerPage);
      } else {
        await interaction.reply({
          content: `Jogador com nome "${searchTerm}" não encontrado no ranking!`,
          ephemeral: true,
        });
        return;
      }
    }

    // Create the initial embed
    const embed = await this.createEmbed(
      topPlayers,
      currentPage,
      foundPlayerIndex
    );

    // Create navigation buttons
    const row = this.createButtons(currentPage, totalPages);

    // Send the initial message with buttons
    const response = await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true, // Only visible to the command user
    });

    // Create a collector for button interactions
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000, // 5 minutes timeout
    });

    // Handle button interactions
    collector.on("collect", async (i) => {
      // Make sure only the command user can use the buttons
      if (i.user.id !== interaction.user.id) {
        await i.reply({
          content: "Você não pode usar estes botões.",
          ephemeral: true,
        });
        return;
      }

      // Update page based on button pressed
      if (i.customId === "previous") {
        currentPage = Math.max(0, currentPage - 1);
      } else if (i.customId === "next") {
        currentPage = Math.min(totalPages - 1, currentPage + 1);
      } else if (i.customId === "first") {
        currentPage = 0;
      } else if (i.customId === "last") {
        currentPage = totalPages - 1;
      }

      // Update embed and buttons
      const updatedEmbed = await this.createEmbed(
        topPlayers,
        currentPage,
        foundPlayerIndex
      );
      const updatedRow = this.createButtons(currentPage, totalPages);

      // Update the message
      await i.update({
        embeds: [updatedEmbed],
        components: [updatedRow],
      });
    });

    // Handle collector end
    collector.on("end", async () => {
      // Remove buttons when the collector expires
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
    topPlayers: any[],
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
      .setTitle("🏆 Top Players")
      .setDescription(
        "Ranking dos melhores jogadores do Reality Brasil!\n" +
          "⚡ **DICA:** Jogue entre 7h e 14h para ganhar o **DOBRO** de pontuação!\n" +
          "Utilize o comando `/stats` para ver as informações de um jogador específico.\n" +
          "Utilize o comando `/clastats` para ver as informações de um clã específico."
      )
      .setTimestamp();

    for (let i = 0; i < playersOnPage.length; i++) {
      const player = playersOnPage[i];
      const position = startIndex + i + 1;
      const patent = (await getPatent(player.score)).split(" <");
      const progress = await new GetPatentProgress().get(player.score);

      const isHighlighted = startIndex + i === highlightPlayerIndex;

      // Special formatting for top 3 players
      let positionDisplay = `${position}º Lugar`;
      if (position === 1)
        positionDisplay = "<a:first:1353055748262989867> 1º Lugar";
      else if (position === 2) positionDisplay = "🥈 2º Lugar";
      else if (position === 3) positionDisplay = "🥉 3º Lugar";

      // Add search highlight if this is the searched player
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
          `> ⭐ **Score:** ${player.score.toLocaleString("pt-BR")}\n` +
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
          `> ⭐ **Score:** ${player.score.toLocaleString("pt-BR")}\n` +
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
        name: `${positionDisplay} - ${player.name}`,
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
