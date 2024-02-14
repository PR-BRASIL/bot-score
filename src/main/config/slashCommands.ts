import type { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "discord.js";
import { makeGetUserInformationCommand } from "../factories/get-user-information";

export const slashCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("stats")
      .setDescription("get user information")
      .addStringOption((option) =>
        option
          .setName("hash-or-name")
          .setDescription("Indentificador do player")
          .setRequired(true)
      ),
    execute: async (interaction: ChatInputCommandInteraction) => {
      interaction.reply(interaction.options.getString("hash-or-name"));
      // await makeGetUserInformationCommand().execute(interaction);
    },
  },
];
