import type { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "discord.js";

export const makeCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("user information")
      .setDescription("get user information"),
    method: async (interaction: ChatInputCommandInteraction) => {
      await interaction.reply("test");
    },
  },
];
