import { EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../protocols/command";
import type {
  GetUserInformation,
  GetUserInformationOutput,
} from "../../domain/usecase/get-user-information";
import { getPatent } from "../../utils/patents";
import { GetPatentProgress } from "../../utils/getPatentProgress";

export class GetUserInformationCommand implements Command {
  public constructor(
    private readonly getUserInformationRepository: GetUserInformation
  ) {}

  public async execute(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const data = await this.getUserInformationRepository.get({
      nameOrHash: interaction.options.getString("hash-or-name"),
    });

    if (!data) {
      await interaction.reply({
        content: "Usuário não encontrado!",
        ephemeral: true,
      });
      return;
    }

    interaction.reply({
      embeds: [await this.makeEmbed(interaction, data)],
      ephemeral: true,
    });
  }

  private async makeEmbed(
    interaction: ChatInputCommandInteraction,
    userData: GetUserInformationOutput
  ) {
    const userPatent = await getPatent(userData.score);
    const patent = userPatent.split(" <");
    const progress = await new GetPatentProgress().get(userData.score);
    const kdRatio =
      userData.deaths > 0
        ? (userData.kills / userData.deaths).toFixed(2)
        : userData.kills.toFixed(2);

    const embed = new EmbedBuilder()
      .setColor(0x1abc9c)
      .setAuthor({
        name: "Reality Brasil",
        iconURL: interaction.guild.iconURL(),
      })
      .setThumbnail(interaction.guild.iconURL())
      .setTitle(`${userData.name}`)
      .setDescription(
        `📋 Informações detalhadas do jogador **${userData.name}**\n` +
          `✨ Pontos contabilizados apenas de partidas no **Reality Brasil**\n` +
          `⚡ **DICA:** Jogue entre 7h e 14h para ganhar o **DOBRO** de pontuação!`
      )
      .addFields({
        name: "📊 Patente Atual",
        value: `> \n> **<${patent[1] || ""} ${patent[0]}**\n> ㅤ`,
        inline: false,
      })
      .addFields({
        name: "📈 Estatísticas",
        value:
          `> \n` +
          `> ⭐ **Score:** ${userData.score.toLocaleString("pt-BR")}\n` +
          `> 🎮 **Partidas:** ${(userData.rounds || 0).toLocaleString(
            "pt-BR"
          )}\n` +
          `> 🤝 **Teamwork:** ${userData.teamWorkScore.toLocaleString(
            "pt-BR"
          )}\n` +
          `> 🎯 **K/D:** ${userData.kills.toLocaleString(
            "pt-BR"
          )} / ${userData.deaths.toLocaleString("pt-BR")} (${kdRatio})\n` +
          `> 🏆 **Posição no Ranking:** #${userData.rank.toLocaleString(
            "pt-BR"
          )}\n` +
          `> \n` +
          `> ${progress}`,
        inline: false,
      });

    embed.setFooter({
      text: `Reality Brasil ・ Atualizado em ${new Date().toLocaleDateString(
        "pt-BR"
      )}`,
    });

    return embed;
  }
}
