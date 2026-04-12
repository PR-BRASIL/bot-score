import type { Document, ObjectId } from "mongodb";
import { mongoHelper } from "../helpers/mongo-helper";
import { MongoGetUserInformationRepository } from "./get-user-information-repository";

export interface ClanManagementDocument {
  _id: ObjectId;
  name: string;
  membersHash: string[];
  leaderDiscordIds?: string[];
  adminDiscordIds?: string[];
  leaderHashes?: string[];
  adminHashes?: string[];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Após vincular Discord: reflete ids nas coleções de clã e limpa cache. */
export async function syncClanDiscordIdsAfterUserLinks(
  playerHash: string,
  discordUserId: string
): Promise<void> {
  const clanCollection = await mongoHelper.getCollection("clan");
  await clanCollection.updateMany(
    { leaderHashes: playerHash },
    { $addToSet: { leaderDiscordIds: discordUserId } } as Document
  );
  await clanCollection.updateMany(
    { adminHashes: playerHash },
    { $addToSet: { adminDiscordIds: discordUserId } } as Document
  );
  const repo = new MongoGetUserInformationRepository();
  repo.clearCache();
}

export class MongoClanManagementRepository {
  constructor(private readonly onMutate: () => void) {}

  /** Clãs onde o jogador é líder (Discord e/ou hash no jogo). */
  async findClansWhereUserIsLeader(
    discordUserId: string,
    playerHash: string | null,
    nameSearch: string,
    limit: number
  ): Promise<{ name: string }[]> {
    const clanCollection = await mongoHelper.getCollection("clan");
    const orConditions: Record<string, unknown>[] = [
      { leaderDiscordIds: discordUserId },
    ];
    if (playerHash) {
      orConditions.push({ leaderHashes: playerHash });
    }
    const filter: Record<string, unknown> = { $or: orConditions };
    if (nameSearch.trim()) {
      filter.name = {
        $regex: escapeRegex(nameSearch.trim()),
        $options: "i",
      };
    }
    const docs = await clanCollection
      .find(filter, { projection: { name: 1 } })
      .sort({ points: -1 })
      .limit(limit)
      .toArray();
    return docs.map((d: { name: string }) => ({ name: d.name }));
  }

  /** Clãs onde o jogador é líder ou admin (para autocomplete). */
  async findClansModeratedByPlayer(
    discordUserId: string,
    playerHash: string | null,
    nameSearch: string,
    limit: number
  ): Promise<{ name: string }[]> {
    const clanCollection = await mongoHelper.getCollection("clan");
    const orConditions: Record<string, unknown>[] = [
      { leaderDiscordIds: discordUserId },
      { adminDiscordIds: discordUserId },
    ];
    if (playerHash) {
      orConditions.push({ leaderHashes: playerHash });
      orConditions.push({ adminHashes: playerHash });
    }
    const filter: Record<string, unknown> = { $or: orConditions };
    if (nameSearch.trim()) {
      filter.name = {
        $regex: escapeRegex(nameSearch.trim()),
        $options: "i",
      };
    }
    const docs = await clanCollection
      .find(filter, { projection: { name: 1 } })
      .sort({ points: -1 })
      .limit(limit)
      .toArray();
    return docs.map((d: { name: string }) => ({ name: d.name }));
  }

  /** Lista de clãs para super admin (set-leader). */
  async findClansForSuperAdminAutocomplete(
    nameSearch: string,
    limit: number
  ): Promise<{ name: string }[]> {
    const clanCollection = await mongoHelper.getCollection("clan");
    const filter = nameSearch.trim()
      ? { name: { $regex: escapeRegex(nameSearch.trim()), $options: "i" } }
      : {};
    const docs = await clanCollection
      .find(filter, { projection: { name: 1 } })
      .sort({ points: -1 })
      .limit(limit)
      .toArray();
    return docs.map((d: { name: string }) => ({ name: d.name }));
  }

  async findClanDocument(
    clanName: string
  ): Promise<ClanManagementDocument | null> {
    const clanCollection = await mongoHelper.getCollection("clan");
    const escaped = escapeRegex(clanName.trim());
    const doc = await clanCollection.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${escaped}$`, "i") } },
        { name: { $regex: new RegExp(escaped, "i") } },
      ],
    });
    return doc as ClanManagementDocument | null;
  }

  async addLeaderByPlayerHash(
    clanName: string,
    playerHash: string
  ): Promise<{ ok: true; displayName?: string } | { ok: false; message: string }> {
    const clan = await this.findClanDocument(clanName);
    if (!clan) {
      return { ok: false, message: "Clã não encontrado." };
    }
    if (!clan.membersHash?.includes(playerHash)) {
      return {
        ok: false,
        message: "Este jogador não está na lista de membros deste clã.",
      };
    }

    const userCollection = await mongoHelper.getCollection("user");
    const gameUser = await userCollection.findOne<{ discordUserId?: string; name?: string }>(
      { hash: playerHash },
      { projection: { discordUserId: 1, name: 1 } }
    );

    const clanCollection = await mongoHelper.getCollection("clan");
    const addToSet: Record<string, string> = { leaderHashes: playerHash };
    if (gameUser?.discordUserId) {
      addToSet.leaderDiscordIds = gameUser.discordUserId;
    }
    await clanCollection.updateOne({ _id: clan._id }, { $addToSet: addToSet });
    this.onMutate();
    return { ok: true, displayName: gameUser?.name };
  }

  async addAdminByPlayerHash(
    clanName: string,
    playerHash: string
  ): Promise<{ ok: true; displayName?: string } | { ok: false; message: string }> {
    const clan = await this.findClanDocument(clanName);
    if (!clan) {
      return { ok: false, message: "Clã não encontrado." };
    }
    if (!clan.membersHash?.includes(playerHash)) {
      return {
        ok: false,
        message: "Este jogador não está na lista de membros deste clã.",
      };
    }

    const userCollection = await mongoHelper.getCollection("user");
    const gameUser = await userCollection.findOne<{ discordUserId?: string; name?: string }>(
      { hash: playerHash },
      { projection: { discordUserId: 1, name: 1 } }
    );

    const clanCollection = await mongoHelper.getCollection("clan");
    const addToSet: Record<string, string> = { adminHashes: playerHash };
    if (gameUser?.discordUserId) {
      addToSet.adminDiscordIds = gameUser.discordUserId;
    }
    await clanCollection.updateOne({ _id: clan._id }, { $addToSet: addToSet });
    this.onMutate();
    return { ok: true, displayName: gameUser?.name };
  }

  async removeAdminByPlayerHash(
    clanName: string,
    playerHash: string
  ): Promise<{ ok: true } | { ok: false; message: string }> {
    const clan = await this.findClanDocument(clanName);
    if (!clan) {
      return { ok: false, message: "Clã não encontrado." };
    }
    const adminsH = clan.adminHashes ?? [];
    if (!adminsH.includes(playerHash)) {
      return {
        ok: false,
        message: "Este jogador não é administrador deste clã.",
      };
    }

    const userCollection = await mongoHelper.getCollection("user");
    const gameUser = await userCollection.findOne<{ discordUserId?: string }>(
      { hash: playerHash },
      { projection: { discordUserId: 1 } }
    );

    const clanCollection = await mongoHelper.getCollection("clan");
    const pull: Record<string, string> = { adminHashes: playerHash };
    if (gameUser?.discordUserId) {
      pull.adminDiscordIds = gameUser.discordUserId;
    }
    await clanCollection.updateOne({ _id: clan._id }, { $pull: pull });
    this.onMutate();
    return { ok: true };
  }

  async removeMemberByHash(
    clanName: string,
    memberHash: string
  ): Promise<{ ok: true } | { ok: false; message: string }> {
    const clan = await this.findClanDocument(clanName);
    if (!clan) {
      return { ok: false, message: "Clã não encontrado." };
    }
    if (!clan.membersHash?.includes(memberHash)) {
      return {
        ok: false,
        message: "Este jogador não faz parte deste clã (hash não encontrado).",
      };
    }

    const userCollection = await mongoHelper.getCollection("user");
    const memberUser = await userCollection.findOne<{ discordUserId?: string }>(
      { hash: memberHash },
      { projection: { discordUserId: 1 } }
    );

    const clanCollection = await mongoHelper.getCollection("clan");
    const pullDiscord = memberUser?.discordUserId;

    const pull: Record<string, string> = {
      membersHash: memberHash,
      leaderHashes: memberHash,
      adminHashes: memberHash,
    };
    if (pullDiscord) {
      pull.leaderDiscordIds = pullDiscord;
      pull.adminDiscordIds = pullDiscord;
    }

    await clanCollection.updateOne({ _id: clan._id }, { $pull: pull });
    this.onMutate();
    return { ok: true };
  }
}
