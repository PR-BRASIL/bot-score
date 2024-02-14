import { EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../protocols/command";
import type {
  GetUserInformation,
  GetUserInformationOutput,
} from "../../domain/usecase/get-user-information";
import { getPatent } from "../../domain/models/patents";

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
          name: ":shield: Patente",
          value: getPatent(userData.score),
          inline: true,
        },
        {
          name: ":military_medal: Score",
          value: `${userData.score}`,
          inline: true,
        },
        {
          name: ":military_helmet: TeamWorkScore",
          value: `${userData.teamWorkScore}`,
          inline: true,
        },
        {
          name: ":cocktail: Kills",
          value: `${userData.kills}`,
          inline: true,
        },
        {
          name: ":skull_crossbones: Deaths",
          value: `${userData.deaths}`,
          inline: true,
        }
      )
      .setFooter({
        text: "Next level: 	[▋▋▋▋▋▋                                 ] (not implemented)",
      });

    return embed;
  }
}
