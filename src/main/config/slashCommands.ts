import type { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "discord.js";

export const slashCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("userinformation")
      .setDescription("get user information"),
    async execute(interaction: ChatInputCommandInteraction) {
      await interaction.reply("test");
    },
  },
];
