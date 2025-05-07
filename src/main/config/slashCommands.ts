import type { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "discord.js";
import { makeGetUserInformationCommand } from "../factories/get-user-information";
import { makeGetClanInformationCommand } from "../factories/get-clan-information";
import { makeTopPlayersCommand } from "../factories/top-players";

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
      await makeGetUserInformationCommand().execute(interaction);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("clastats")
      .setDescription("Informações detalhadas de um clã")
      .addStringOption((option) =>
        option
          .setName("clan-name")
          .setDescription("Nome do clã")
          .setRequired(true)
      ),
    execute: async (interaction: ChatInputCommandInteraction) => {
      await makeGetClanInformationCommand().execute(interaction);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("top")
      .setDescription("Mostra o ranking de jogadores com paginação")
      .addIntegerOption((option) =>
        option
          .setName("limit")
          .setDescription(
            "Número máximo de jogadores para mostrar (padrão: 25)"
          )
          .setRequired(false)
      ),
    execute: async (interaction: ChatInputCommandInteraction) => {
      await makeTopPlayersCommand().execute(interaction);
    },
  },
];
