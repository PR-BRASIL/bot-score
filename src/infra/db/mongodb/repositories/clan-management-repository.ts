import type { Document, ObjectId } from "mongodb";
import { mongoHelper } from "../helpers/mongo-helper";
import { MongoGetUserInformationRepository } from "./get-user-information-repository";

const CLAN_NAME_COLLATION = { locale: "pt", strength: 2 } as const;

/** Quantidade máxima de clãs lidos do banco antes de filtrar o texto no autocomplete. */
const CLAN_AUTOCOMPLETE_SCAN_LIMIT = 400;

function sliceClansByNameSubstring(
  docs: { name: string }[],
  nameSearch: string,
  resultLimit: number
): { name: string }[] {
  const q = nameSearch.trim().toLowerCase();
  const filtered = q
    ? docs.filter((d) => d.name.toLowerCase().includes(q))
    : docs;
  return filtered.slice(0, resultLimit);
}

export interface ClanManagementDocument {
  _id: ObjectId;
  name: string;
  membersHash: string[];
  leaderDiscordIds?: string[];
  adminDiscordIds?: string[];
  leaderHashes?: string[];
  adminHashes?: string[];
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
    const docs = await clanCollection
      .find(filter, { projection: { name: 1 } })
      .sort({ points: -1 })
      .limit(CLAN_AUTOCOMPLETE_SCAN_LIMIT)
      .toArray();
    return sliceClansByNameSubstring(
      docs as { name: string }[],
      nameSearch,
      limit
    );
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
    const docs = await clanCollection
      .find(filter, { projection: { name: 1 } })
      .sort({ points: -1 })
      .limit(CLAN_AUTOCOMPLETE_SCAN_LIMIT)
      .toArray();
    return sliceClansByNameSubstring(
      docs as { name: string }[],
      nameSearch,
      limit
    );
  }

  /** Lista de clãs para super admin (set-leader). */
  async findClansForSuperAdminAutocomplete(
    nameSearch: string,
    limit: number
  ): Promise<{ name: string }[]> {
    const clanCollection = await mongoHelper.getCollection("clan");
    const docs = await clanCollection
      .find({}, { projection: { name: 1 } })
      .sort({ points: -1 })
      .limit(CLAN_AUTOCOMPLETE_SCAN_LIMIT)
      .toArray();
    return sliceClansByNameSubstring(
      docs as { name: string }[],
      nameSearch,
      limit
    );
  }

  /** Lista de clãs com pelo menos um membro (autocomplete /clanstats). */
  async findClansWithMembersForAutocomplete(
    nameSearch: string,
    limit: number
  ): Promise<{ name: string }[]> {
    const clanCollection = await mongoHelper.getCollection("clan");
    const hasMembers = {
      $expr: {
        $gt: [{ $size: { $ifNull: ["$membersHash", []] } }, 0],
      },
    };
    const docs = await clanCollection
      .find(hasMembers, { projection: { name: 1 } })
      .sort({ points: -1 })
      .limit(CLAN_AUTOCOMPLETE_SCAN_LIMIT)
      .toArray();
    return sliceClansByNameSubstring(
      docs as { name: string }[],
      nameSearch,
      limit
    );
  }

  async findClanDocument(
    clanName: string
  ): Promise<ClanManagementDocument | null> {
    const clanCollection = await mongoHelper.getCollection("clan");
    const doc = await clanCollection.findOne(
      { name: clanName.trim() },
      { collation: CLAN_NAME_COLLATION }
    );
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
