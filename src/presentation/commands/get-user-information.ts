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
      await interaction.reply("Usuário não encontrado!");
      return;
    }

    interaction.reply({ embeds: [await this.makeEmbed(interaction, data)] });
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
          `✨ Pontos contabilizados apenas de partidas no **Reality Brasil**`
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
          name: "🔫 Eliminações",
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
      )
      .setFooter({
        text: `📊 Progresso: ${await new GetPatentProgress().get(
          userData.score
        )}`,
      });

    return embed;
  }
}
