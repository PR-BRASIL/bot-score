import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../protocols/command";
import { mongoHelper } from "../../infra/db/mongodb/helpers/mongo-helper";
import type { User as GameUser } from "../../domain/models/user";
import {
  MongoClanManagementRepository,
  type ClanManagementDocument,
} from "../../infra/db/mongodb/repositories/clan-management-repository";
import { MongoGetUserInformationRepository } from "../../infra/db/mongodb/repositories/get-user-information-repository";
import { extractPlayerName } from "../../utils/clanUtils";
import { buildNotLinkedAccountEmbed } from "../helpers/not-linked-account-embed";
import { env } from "../../main/config/env";

const AUTOCOMPLETE_MAX = 25;
const CHOICE_NAME_MAX = 100;
const CHOICE_VALUE_MAX = 100;

function actorIsClanLeader(
  clanDoc: ClanManagementDocument,
  actorDiscordId: string,
  actorHash: string
): boolean {
  return (
    (clanDoc.leaderDiscordIds ?? []).includes(actorDiscordId) ||
    (clanDoc.leaderHashes ?? []).includes(actorHash)
  );
}

function actorIsClanModerator(
  clanDoc: ClanManagementDocument,
  actorDiscordId: string,
  actorHash: string
): boolean {
  return (
    actorIsClanLeader(clanDoc, actorDiscordId, actorHash) ||
    (clanDoc.adminDiscordIds ?? []).includes(actorDiscordId) ||
    (clanDoc.adminHashes ?? []).includes(actorHash)
  );
}

export class ClanAdminCommand implements Command {
  constructor(
    private readonly clanManagement: MongoClanManagementRepository,
    private readonly clanSuperAdminDiscordIds: readonly string[]
  ) {}

  public async execute(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const sub = interaction.options.getSubcommand(true);

    if (sub === "set-leader") {
      await this.handleSetLeader(interaction);
      return;
    }
    if (sub === "add-admin") {
      await this.handleAddAdmin(interaction);
      return;
    }
    if (sub === "remove-admin") {
      await this.handleRemoveAdmin(interaction);
      return;
    }
    if (sub === "remove-member") {
      await this.handleRemoveMember(interaction);
      return;
    }

    await interaction.editReply({
      content: "❌ Subcomando desconhecido.",
    });
  }

  private async replyNotLinkedExecutor(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    await interaction.editReply({
      embeds: [
        buildNotLinkedAccountEmbed(
          interaction.user,
          "Reality Brasil • Gestão de clã",
          "Você poderá gerenciar administradores e membros do seu clã após vincular sua conta! 🎮",
          interaction.guild?.iconURL()
        ),
      ],
    });
  }

  private async getLinkedGameUser(
    discordUserId: string
  ): Promise<GameUser | null> {
    const userCollection = await mongoHelper.getCollection<GameUser>("user");
    return userCollection.findOne({ discordUserId: discordUserId });
  }

  private async handleSetLeader(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    if (this.clanSuperAdminDiscordIds.length === 0) {
      await interaction.editReply({
        content:
          "❌ Nenhum super administrador de clã configurado. Defina `CLAN_SUPER_ADMIN_DISCORD_IDS` no ambiente do bot.",
      });
      return;
    }

    if (!this.clanSuperAdminDiscordIds.includes(interaction.user.id)) {
      await interaction.editReply({
        content:
          "❌ Você não tem permissão para definir líderes de clã. Apenas super administradores configurados no servidor podem usar este comando.",
      });
      return;
    }

    const clanNameInput = interaction.options.getString("clan-name", true).trim();
    const memberHash = interaction.options.getString("membro", true).trim();

    const clanDoc = await this.clanManagement.findClanDocument(clanNameInput);
    if (!clanDoc) {
      await interaction.editReply({
        content: `❌ Clã não encontrado com o nome informado: **${clanNameInput}**.`,
      });
      return;
    }

    const result = await this.clanManagement.addLeaderByPlayerHash(
      clanDoc.name,
      memberHash
    );
    if (result.ok === false) {
      await interaction.editReply({ content: `❌ ${result.message}` });
      return;
    }

    const nameHint = result.displayName ? `**${result.displayName}**` : "Jogador";
    await interaction.editReply({
      content:
        `✅ ${nameHint} foi definido como **líder** do clã **${clanDoc.name}**.\n` +
        `Quando vincular o Discord ao jogo, passará a poder usar os comandos de líder no bot.`,
    });
  }

  private async handleAddAdmin(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const actor = await this.getLinkedGameUser(interaction.user.id);
    if (!actor) {
      await this.replyNotLinkedExecutor(interaction);
      return;
    }

    const clanNameInput = interaction.options.getString("clan-name", true).trim();
    const memberHash = interaction.options.getString("membro", true).trim();

    const clanDoc = await this.clanManagement.findClanDocument(clanNameInput);
    if (!clanDoc) {
      await interaction.editReply({
        content: `❌ Clã não encontrado com o nome informado: **${clanNameInput}**.`,
      });
      return;
    }

    if (!actorIsClanLeader(clanDoc, interaction.user.id, actor.hash)) {
      await interaction.editReply({
        content:
          "❌ Apenas **líderes** do clã podem adicionar administradores. Peça a um super administrador para te promover a líder.",
      });
      return;
    }

    if (!clanDoc.membersHash?.includes(actor.hash)) {
      await interaction.editReply({
        content:
          "❌ Sua conta vinculada não consta como membro deste clã. Verifique se você está no clã correto no jogo.",
      });
      return;
    }

    const result = await this.clanManagement.addAdminByPlayerHash(
      clanDoc.name,
      memberHash
    );
    if (result.ok === false) {
      await interaction.editReply({ content: `❌ ${result.message}` });
      return;
    }

    const nameHint = result.displayName ? `**${result.displayName}**` : "Jogador";
    await interaction.editReply({
      content:
        `✅ ${nameHint} foi adicionado como **administrador** do clã **${clanDoc.name}**.\n` +
        `Após vincular o Discord (se ainda não vinculou), poderá usar os comandos de admin no bot.`,
    });
  }

  private async handleRemoveAdmin(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const actor = await this.getLinkedGameUser(interaction.user.id);
    if (!actor) {
      await this.replyNotLinkedExecutor(interaction);
      return;
    }

    const clanNameInput = interaction.options.getString("clan-name", true).trim();
    const memberHash = interaction.options.getString("membro", true).trim();

    const clanDoc = await this.clanManagement.findClanDocument(clanNameInput);
    if (!clanDoc) {
      await interaction.editReply({
        content: `❌ Clã não encontrado com o nome informado: **${clanNameInput}**.`,
      });
      return;
    }

    if (!actorIsClanLeader(clanDoc, interaction.user.id, actor.hash)) {
      await interaction.editReply({
        content:
          "❌ Apenas **líderes** do clã podem remover administradores.",
      });
      return;
    }

    if (!clanDoc.membersHash?.includes(actor.hash)) {
      await interaction.editReply({
        content:
          "❌ Sua conta vinculada não consta como membro deste clã. Verifique se você está no clã correto no jogo.",
      });
      return;
    }

    const result = await this.clanManagement.removeAdminByPlayerHash(
      clanDoc.name,
      memberHash
    );
    if (result.ok === false) {
      await interaction.editReply({ content: `❌ ${result.message}` });
      return;
    }

    await interaction.editReply({
      content: `✅ O administrador foi removido do clã **${clanDoc.name}**.`,
    });
  }

  private async handleRemoveMember(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const actor = await this.getLinkedGameUser(interaction.user.id);
    if (!actor) {
      await this.replyNotLinkedExecutor(interaction);
      return;
    }

    const clanNameInput = interaction.options.getString("clan-name", true).trim();
    const memberHash = interaction.options.getString("membro", true).trim();

    const clanDoc = await this.clanManagement.findClanDocument(clanNameInput);
    if (!clanDoc) {
      await interaction.editReply({
        content: `❌ Clã não encontrado com o nome informado: **${clanNameInput}**.`,
      });
      return;
    }

    if (!actorIsClanModerator(clanDoc, interaction.user.id, actor.hash)) {
      await interaction.editReply({
        content:
          "❌ Apenas **líderes** ou **administradores** do clã podem remover membros.",
      });
      return;
    }

    if (!clanDoc.membersHash?.includes(actor.hash)) {
      await interaction.editReply({
        content:
          "❌ Sua conta vinculada não consta como membro deste clã. Você precisa ser membro do clã para usar esta ação.",
      });
      return;
    }

    const result = await this.clanManagement.removeMemberByHash(
      clanDoc.name,
      memberHash
    );
    if (result.ok === false) {
      await interaction.editReply({ content: `❌ ${result.message}` });
      return;
    }

    await interaction.editReply({
      content: `✅ O membro foi removido do clã **${clanDoc.name}** (dados atualizados no banco).`,
    });
  }

  public static async handleAutocomplete(
    interaction: AutocompleteInteraction
  ): Promise<void> {
    const focused = interaction.options.getFocused(true);
    if (!focused.value.trim()) {
      await interaction.respond([]);
      return;
    }

    const subcommand = interaction.options.getSubcommand(false);
    const clanMgmt = new MongoClanManagementRepository(() => {});

    const userCollection = await mongoHelper.getCollection<GameUser>("user");
    const actorGame = await userCollection.findOne(
      { discordUserId: interaction.user.id },
      { projection: { hash: 1 } }
    );
    const actorHash = actorGame?.hash ?? null;

    if (focused.name === "clan-name") {
      if (subcommand === "set-leader") {
        if (
          env.clanSuperAdminDiscordIds.length === 0 ||
          !env.clanSuperAdminDiscordIds.includes(interaction.user.id)
        ) {
          await interaction.respond([]);
          return;
        }
        const rows = await clanMgmt.findClansForSuperAdminAutocomplete(
          focused.value,
          AUTOCOMPLETE_MAX
        );
        await interaction.respond(
          rows.map((r) => {
            let name = r.name;
            if (name.length > CHOICE_NAME_MAX) {
              name = name.slice(0, CHOICE_NAME_MAX - 1) + "…";
            }
            let value = r.name;
            if (value.length > CHOICE_VALUE_MAX) {
              value = value.slice(0, CHOICE_VALUE_MAX);
            }
            return { name, value };
          })
        );
        return;
      }

      if (subcommand === "remove-admin") {
        const rows = await clanMgmt.findClansWhereUserIsLeader(
          interaction.user.id,
          actorHash,
          focused.value,
          AUTOCOMPLETE_MAX
        );
        await interaction.respond(
          rows.map((r) => {
            let name = r.name;
            if (name.length > CHOICE_NAME_MAX) {
              name = name.slice(0, CHOICE_NAME_MAX - 1) + "…";
            }
            let value = r.name;
            if (value.length > CHOICE_VALUE_MAX) {
              value = value.slice(0, CHOICE_VALUE_MAX);
            }
            return { name, value };
          })
        );
        return;
      }

      if (subcommand === "add-admin" || subcommand === "remove-member") {
        const rows = await clanMgmt.findClansModeratedByPlayer(
          interaction.user.id,
          actorHash,
          focused.value,
          AUTOCOMPLETE_MAX
        );
        await interaction.respond(
          rows.map((r) => {
            let name = r.name;
            if (name.length > CHOICE_NAME_MAX) {
              name = name.slice(0, CHOICE_NAME_MAX - 1) + "…";
            }
            let value = r.name;
            if (value.length > CHOICE_VALUE_MAX) {
              value = value.slice(0, CHOICE_VALUE_MAX);
            }
            return { name, value };
          })
        );
        return;
      }

      await interaction.respond([]);
      return;
    }

    if (focused.name === "membro") {
      const clanName = interaction.options.getString("clan-name");
      if (!clanName?.trim()) {
        await interaction.respond([]);
        return;
      }

      const clanDoc = await clanMgmt.findClanDocument(clanName.trim());
      if (!clanDoc) {
        await interaction.respond([]);
        return;
      }

      if (subcommand === "set-leader") {
        if (
          env.clanSuperAdminDiscordIds.length === 0 ||
          !env.clanSuperAdminDiscordIds.includes(interaction.user.id)
        ) {
          await interaction.respond([]);
          return;
        }
      } else if (subcommand === "remove-admin") {
        if (
          !actorHash ||
          !actorIsClanLeader(clanDoc, interaction.user.id, actorHash)
        ) {
          await interaction.respond([]);
          return;
        }
      } else if (subcommand === "add-admin" || subcommand === "remove-member") {
        if (
          !actorHash ||
          !actorIsClanModerator(clanDoc, interaction.user.id, actorHash)
        ) {
          await interaction.respond([]);
          return;
        }
      } else {
        await interaction.respond([]);
        return;
      }

      const repo = new MongoGetUserInformationRepository();
      const clan = await repo.getClanByName(clanDoc.name);
      if (!clan?.members?.length) {
        await interaction.respond([]);
        return;
      }

      let pool = clan.members;
      if (subcommand === "remove-admin") {
        const adminHashes = new Set(clanDoc.adminHashes ?? []);
        const adminDiscord = new Set(clanDoc.adminDiscordIds ?? []);
        pool = clan.members.filter(
          (m) =>
            adminHashes.has(m.hash) ||
            (m.discordUserId != null && adminDiscord.has(m.discordUserId))
        );
        if (pool.length === 0) {
          await interaction.respond([]);
          return;
        }
      }

      const query = focused.value.toLowerCase().trim();
      const matches = pool.filter((m) => {
        const display = extractPlayerName(m.name || "").toLowerCase();
        const hash = (m.hash || "").toLowerCase();
        if (!query) return true;
        return display.includes(query) || hash.includes(query);
      });

      const choices = matches.slice(0, AUTOCOMPLETE_MAX).map((m) => {
        const baseName = extractPlayerName(m.name || "") || m.name || m.hash;
        let name = `${baseName} • ${m.hash}`;
        if (name.length > CHOICE_NAME_MAX) {
          name = name.slice(0, CHOICE_NAME_MAX - 1) + "…";
        }
        let value = m.hash;
        if (value.length > CHOICE_VALUE_MAX) {
          value = value.slice(0, CHOICE_VALUE_MAX);
        }
        return { name, value };
      });

      await interaction.respond(choices);
      return;
    }

    await interaction.respond([]);
  }
}
