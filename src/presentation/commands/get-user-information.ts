import { EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../protocols/command";
import type {
  GetUserInformation,
  GetUserInformationOutput,
} from "../../domain/usecase/get-user-information";

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

    interaction.reply({ embeds: [this.makeEmbed(interaction, data)] });
  }

  private makeEmbed(
    interaction: ChatInputCommandInteraction,
    userData: GetUserInformationOutput
  ) {
    const embed = new EmbedBuilder()
      .setColor(0x00)
      .setAuthor({
        name: "B.E Stats",
        iconURL: interaction.guild.iconURL(),
      })
      .setThumbnail(interaction.guild.iconURL())
      .setTitle(userData.name)
      .setDescription(
        `Aqui será listado algumas informações do jogador ${userData.name}\nOs pontos contabilizados são apenas de partidas no **Brasil Evolution**!`
      )
      .addFields(
        {
          name: "Score",
          value: `${userData.score}`,
          inline: true,
        },
        {
          name: "TeamWorkScore",
          value: `${userData.teamWorkScore}`,
          inline: true,
        },
        {
          name: "Kills",
          value: `${userData.kills}`,
          inline: true,
        },
        {
          name: "Deaths",
          value: `${userData.deaths}`,
          inline: true,
        }
      );

    return embed;
  }
}
