import { Collection, MongoClient } from "mongodb";
import {
  GetUserInformation,
  GetUserInformationOutput,
  GetTopPlayers,
  GetTopClans,
  Clan,
} from "../../../../domain/usecase/get-user-information";
import { User } from "../../../../domain/models/user";
import { mongoHelper } from "../helpers/mongo-helper";
import { extractClanName } from "../../../../utils/clanUtils";

export class MongoGetUserInformationRepository
  implements GetTopPlayers, GetTopClans
{
  private collection: Collection;
  private clanCache: Map<string, { data: Clan[]; timestamp: number }> =
    new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  private readonly MAX_CACHE_ENTRIES = 50; // Máximo de entradas no cache

  async getTopPlayers(limit: number): Promise<User[]> {
    this.collection = await mongoHelper.getCollection("user");
    return await this.collection
      .find<User>({})
      .sort({ score: -1 })
      .limit(limit)
      .toArray();
  }

  // Método otimizado para buscar clã específico por nome
  async getClanByName(clanName: string): Promise<Clan | null> {
    const cacheKey = `clan_${clanName.toLowerCase()}`;
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      return cached[0] || null;
    }

    this.collection = await mongoHelper.getCollection("user");
    const clanCollection = await mongoHelper.getCollection("clan");

    // Busca exata primeiro, depois por similaridade
    const clanData = await clanCollection.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${clanName}$`, "i") } }, // Busca exata
        { name: { $regex: new RegExp(clanName, "i") } }, // Busca por similaridade
      ],
    });

    if (!clanData) return null;

    // Busca otimizada dos membros com projeção
    const members = await this.collection
      .find<User>({ hash: { $in: clanData.membersHash } })
      .project({
        name: 1,
        score: 1,
        teamWorkScore: 1,
        kills: 1,
        deaths: 1,
        totalTime: 1,
        updatedAt: 1,
        hash: 1,
      })
      .toArray();

    const clan = this.buildClanObject(clanData, members as User[]);

    // Cache o resultado
    this.setCachedData(cacheKey, [clan]);

    return clan;
  }

  // Método otimizado para buscar múltiplos clãs com agregação
  async getTopClans(limit: number): Promise<Clan[]> {
    const cacheKey = `top_clans_${limit}`;
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      return cached;
    }

    this.collection = await mongoHelper.getCollection("user");
    const clanCollection = await mongoHelper.getCollection("clan");

    // Usar agregação para otimizar a consulta
    const pipeline = [
      {
        $lookup: {
          from: "user",
          localField: "membersHash",
          foreignField: "hash",
          as: "members",
          pipeline: [
            {
              $project: {
                name: 1,
                score: 1,
                teamWorkScore: 1,
                kills: 1,
                deaths: 1,
                totalTime: 1,
                updatedAt: 1,
                hash: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          memberCount: { $size: "$members" },
          totalScore: { $sum: "$members.score" },
          totalTeamWorkScore: { $sum: "$members.teamWorkScore" },
          totalKills: { $sum: "$members.kills" },
          totalDeaths: { $sum: "$members.deaths" },
          totalTimeOnline: { $sum: "$members.totalTime" },
        },
      },
      {
        $sort: { points: -1 },
      },
      {
        $limit: limit,
      },
    ];

    const clansData = await clanCollection.aggregate(pipeline).toArray();

    const clans: Clan[] = clansData.map((clanData) => ({
      name: clanData.name,
      memberCount: clanData.memberCount,
      points: clanData.points || 0,
      totalScore: clanData.totalScore || 0,
      totalTeamWorkScore: clanData.totalTeamWorkScore || 0,
      totalKills: clanData.totalKills || 0,
      totalDeaths: clanData.totalDeaths || 0,
      totalTimeOnline: clanData.totalTimeOnline || 0,
      members: (clanData.members || []) as User[],
    }));

    // Cache o resultado
    this.setCachedData(cacheKey, clans);

    return clans;
  }

  // Método para buscar clãs similares de forma otimizada
  async findSimilarClans(clanName: string, limit: number = 5): Promise<Clan[]> {
    const cacheKey = `similar_${clanName.toLowerCase()}_${limit}`;
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      return cached;
    }

    const clanCollection = await mongoHelper.getCollection("clan");

    const clansData = await clanCollection
      .find({
        name: { $regex: new RegExp(clanName, "i") },
      })
      .limit(limit)
      .toArray();

    if (!clansData.length) return [];

    // Buscar apenas informações básicas para a lista de sugestões
    const clans: Clan[] = clansData.map((clanData) => ({
      name: clanData.name,
      memberCount: clanData.membersHash?.length || 0,
      points: clanData.points || 0,
      totalScore: 0,
      totalTeamWorkScore: 0,
      totalKills: 0,
      totalDeaths: 0,
      totalTimeOnline: 0,
      members: [],
    }));

    // Cache o resultado
    this.setCachedData(cacheKey, clans);

    return clans;
  }

  private buildClanObject(clanData: any, members: User[]): Clan {
    const totalScore = members.reduce((sum, user) => sum + user.score, 0);
    const totalTeamWorkScore = members.reduce(
      (sum, user) => sum + user.teamWorkScore,
      0
    );
    const totalKills = members.reduce((sum, user) => sum + user.kills, 0);
    const totalDeaths = members.reduce((sum, user) => sum + user.deaths, 0);
    const totalTimeOnline = members.reduce(
      (sum, user) => sum + (user.totalTime || 0),
      0
    );

    return {
      name: clanData.name,
      memberCount: members.length,
      points: clanData.points || 0,
      totalScore,
      totalTeamWorkScore,
      totalKills,
      totalDeaths,
      totalTimeOnline,
      members,
    };
  }

  // Métodos de cache otimizados
  private getCachedData(key: string): Clan[] | null {
    this.cleanupExpiredCache();

    const cached = this.clanCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    if (cached) {
      this.clanCache.delete(key);
    }

    return null;
  }

  private setCachedData(key: string, data: Clan[]): void {
    // Limitar o número de entradas no cache
    if (this.clanCache.size >= this.MAX_CACHE_ENTRIES) {
      const oldestKey = this.clanCache.keys().next().value;
      this.clanCache.delete(oldestKey);
    }

    this.clanCache.set(key, { data, timestamp: Date.now() });
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.clanCache) {
      if (now - entry.timestamp >= this.CACHE_TTL) {
        this.clanCache.delete(key);
      }
    }
  }

  // Método para limpar cache quando necessário
  clearCache(): void {
    this.clanCache.clear();
  }
}
