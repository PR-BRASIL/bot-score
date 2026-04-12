import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
} from "discord.js";
import { SlashCommandBuilder } from "discord.js";
import { makeGetUserInformationCommand } from "../factories/get-user-information";
import { makeGetClanInformationCommand } from "../factories/get-clan-information";
import { GetUserInformationCommand } from "../../presentation/commands/get-user-information";
import { GetClanInformationCommand } from "../../presentation/commands/get-clan-information";
import { makeTopPlayersCommand } from "../factories/top-players";
import { makeSeasonTopPlayersCommand } from "../factories/season-top-players";
import { makeManageFavoriteMapsCommand } from "../factories/manage-favorite-maps";
import { ManageFavoriteMapsCommand } from "../../presentation/commands/manage-favorite-maps";
import { makeRemoveFavoriteMapCommand } from "../factories/remove-favorite-map";
import { RemoveFavoriteMapCommand } from "../../presentation/commands/remove-favorite-map";
import { makeClanAdminCommand } from "../factories/clan-admin";
import { ClanAdminCommand } from "../../presentation/commands/clan-admin";

export const slashCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("stats")
      .setDescription("get user information")
      .addStringOption((option) =>
        option
          .setName("hash-or-name")
          .setDescription("Nome ou hash (digite para sugestões)")
          .setRequired(true)
          .setAutocomplete(true)
      ),
    execute: async (interaction: ChatInputCommandInteraction) => {
      await makeGetUserInformationCommand().execute(interaction);
    },
    autocomplete: async (interaction: AutocompleteInteraction) => {
      await GetUserInformationCommand.handleAutocomplete(interaction);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("clanstats")
      .setDescription("Informações detalhadas de um clã")
      .addStringOption((option) =>
        option
          .setName("clan-name")
          .setDescription("Nome do clã (digite para sugestões)")
          .setRequired(true)
          .setAutocomplete(true)
      ),
    execute: async (interaction: ChatInputCommandInteraction) => {
      await makeGetClanInformationCommand().execute(interaction);
    },
    autocomplete: async (interaction: AutocompleteInteraction) => {
      await GetClanInformationCommand.handleAutocomplete(interaction);
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
          .setDescription("Mapa a remover (formato: Mapa - Modo)")
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
  {
    data: new SlashCommandBuilder()
      .setName("clan-admin")
      .setDescription("Gerencia líderes, administradores e membros do clã")
      .addSubcommand((sub) =>
        sub
          .setName("set-leader")
          .setDescription(
            "Define um líder do clã (apenas super administradores do bot)"
          )
          .addStringOption((option) =>
            option
              .setName("clan-name")
              .setDescription("Clã (use as sugestões ao digitar)")
              .setRequired(true)
              .setAutocomplete(true)
          )
          .addStringOption((option) =>
            option
              .setName("membro")
              .setDescription("Membro (nome/hash — sugestões após escolher o clã)")
              .setRequired(true)
              .setAutocomplete(true)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName("add-admin")
          .setDescription("Adiciona um administrador (apenas líderes do clã)")
          .addStringOption((option) =>
            option
              .setName("clan-name")
              .setDescription("Seus clãs como líder ou admin (sugestões)")
              .setRequired(true)
              .setAutocomplete(true)
          )
          .addStringOption((option) =>
            option
              .setName("membro")
              .setDescription("Membro (nome/hash — sugestões após escolher o clã)")
              .setRequired(true)
              .setAutocomplete(true)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName("remove-admin")
          .setDescription("Remove um administrador (apenas líderes do clã)")
          .addStringOption((option) =>
            option
              .setName("clan-name")
              .setDescription("Seus clãs como líder (sugestões)")
              .setRequired(true)
              .setAutocomplete(true)
          )
          .addStringOption((option) =>
            option
              .setName("membro")
              .setDescription("Admin a remover (sugestões após escolher o clã)")
              .setRequired(true)
              .setAutocomplete(true)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName("remove-member")
          .setDescription("Remove um membro do clã no banco de dados")
          .addStringOption((option) =>
            option
              .setName("clan-name")
              .setDescription("Seus clãs como líder ou admin (sugestões)")
              .setRequired(true)
              .setAutocomplete(true)
          )
          .addStringOption((option) =>
            option
              .setName("membro")
              .setDescription("Membro (sugestões após escolher o clã)")
              .setRequired(true)
              .setAutocomplete(true)
          )
      ),
    execute: async (interaction: ChatInputCommandInteraction) => {
      await makeClanAdminCommand().execute(interaction);
    },
    autocomplete: async (interaction: AutocompleteInteraction) => {
      await ClanAdminCommand.handleAutocomplete(interaction);
    },
  },
];
