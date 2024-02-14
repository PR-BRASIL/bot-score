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
    console.log(interaction);

    const data = await this.getUserInformationRepository.get({
      nameOrHash: interaction.options.getString("hash-or-name"),
    });

    interaction.reply({ embeds: [this.makeEmbed(interaction, data)] });
  }

  private makeEmbed(
    interaction: ChatInputCommandInteraction,
    userData: GetUserInformationOutput
  ) {
    const embed = new EmbedBuilder().setColor(0x00).setAuthor({
      name: userData.name,
    });

    return embed;
  }
}
