import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
} from "discord.js";
import { SlashCommandBuilder } from "discord.js";
import { makeGetUserInformationCommand } from "../factories/get-user-information";
import { makeGetClanInformationCommand } from "../factories/get-clan-information";
import { makeTopPlayersCommand } from "../factories/top-players";
import { makeSeasonTopPlayersCommand } from "../factories/season-top-players";
import { makeManageFavoriteMapsCommand } from "../factories/manage-favorite-maps";
import { ManageFavoriteMapsCommand } from "../../presentation/commands/manage-favorite-maps";
import { makeRemoveFavoriteMapCommand } from "../factories/remove-favorite-map";
import { RemoveFavoriteMapCommand } from "../../presentation/commands/remove-favorite-map";

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
      .setName("ranking")
      .setDescription("Mostra o ranking geral de jogadores com paginação")
      .addIntegerOption((option) =>
        option
          .setName("limit")
          .setDescription(
            "Número máximo de jogadores para mostrar (padrão: 500)"
          )
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("buscar")
          .setDescription("Buscar um nome específico no ranking")
          .setRequired(false)
      ),
    execute: async (interaction: ChatInputCommandInteraction) => {
      await makeTopPlayersCommand().execute(interaction);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("season")
      .setDescription("Mostra o ranking mensal de jogadores com paginação")
      .addIntegerOption((option) =>
        option
          .setName("limit")
          .setDescription(
            "Número máximo de jogadores para mostrar (padrão: 500)"
          )
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("buscar")
          .setDescription("Buscar um nome específico no ranking mensal")
          .setRequired(false)
      ),
    execute: async (interaction: ChatInputCommandInteraction) => {
      await makeSeasonTopPlayersCommand().execute(interaction);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("favoritos")
      .setDescription("Adiciona um mapa aos favoritos")
      .addStringOption((option) =>
        option
          .setName("mapa")
          .setDescription("Nome do mapa")
          .setRequired(true)
          .setAutocomplete(true)
      )
      .addStringOption((option) =>
        option
          .setName("modo")
          .setDescription("Modo de jogo")
          .setRequired(true)
          .setAutocomplete(true)
      )
      .addStringOption((option) =>
        option
          .setName("layout")
          .setDescription("Layout do mapa")
          .setRequired(true)
          .setAutocomplete(true)
      ),
    execute: async (interaction: ChatInputCommandInteraction) => {
      await makeManageFavoriteMapsCommand().execute(interaction);
    },
    autocomplete: async (interaction: AutocompleteInteraction) => {
      await ManageFavoriteMapsCommand.handleAutocomplete(interaction);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("remover-favorito")
      .setDescription("Remove um mapa dos favoritos")
      .addStringOption((option) =>
        option
          .setName("mapa")
          .setDescription("Mapa a remover (formato: Mapa - Modo - Layout)")
          .setRequired(true)
          .setAutocomplete(true)
      ),
    execute: async (interaction: ChatInputCommandInteraction) => {
      await makeRemoveFavoriteMapCommand().execute(interaction);
    },
    autocomplete: async (interaction: AutocompleteInteraction) => {
      await RemoveFavoriteMapCommand.handleAutocomplete(interaction);
    },
  },
];
