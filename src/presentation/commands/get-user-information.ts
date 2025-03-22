import { EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../protocols/command";
import type {
  GetUserInformation,
  GetUserInformationOutput,
} from "../../domain/usecase/get-user-information";
import { getPatent } from "../../utils/patents";
import { GetPatentProgress } from "../../utils/getPatentProgress";
import { calculateTotalOnlineTime } from "../../utils/calculate-time-util";

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
    const embed = new EmbedBuilder()
      .setColor(0x1abc9c)
      .setAuthor({
        name: "📊 Status do Jogador",
        iconURL: interaction.guild.iconURL(),
      })
      .setThumbnail(interaction.guild.iconURL())
      .setTitle(
        `🎮 ${userData.name} ・ 🏅 **${await getPatent(userData.score)}**`
      )
      .setDescription(
        `📋 Informações detalhadas do jogador **${userData.name}**\n` +
          `✨ Pontos contabilizados apenas de partidas no **Reality Brasil**\n` +
          `⚡ **DICA:** Jogue entre 7h e 14h para ganhar o **DOBRO** de pontuação!`
      )
      .addFields(
        {
          name: "⭐ Pontuação Total",
          value: `\`${userData.score.toLocaleString()}\``,
          inline: false,
        },
        {
          name: "🤝 Trabalho em Equipe",
          value: `\`${userData.teamWorkScore.toLocaleString()}\``,
          inline: false,
        },
        {
          name: "🎯 Eliminações",
          value: `\`${userData.kills.toLocaleString()}\``,
          inline: false,
        },
        {
          name: "💀 Mortes",
          value: `\`${userData.deaths.toLocaleString()}\``,
          inline: false,
        },
        {
          name: "🏆 Posição no Ranking",
          value: `#\`${userData.rank.toLocaleString()}\``,
          inline: false,
        }
      );

    const timeOnline = calculateTotalOnlineTime(userData.totalTime || 0);
    embed.addFields({
      name: "⏱️ Tempo Total Online",
      value: `\`${timeOnline}\``,
      inline: false,
    });

    embed.setFooter({
      text: `📊 Progresso: ${await new GetPatentProgress().get(
        userData.score
      )}`,
    });

    return embed;
  }
}
