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

  async getTopPlayers(limit: number): Promise<User[]> {
    this.collection = await mongoHelper.getCollection("user");
    return await this.collection
      .find<User>({})
      .sort({ score: -1 })
      .limit(limit)
      .toArray();
  }

  async getTopClans(limit: number): Promise<Clan[]> {
    this.collection = await mongoHelper.getCollection("user");
    const clanCollection = await mongoHelper.getCollection("clan");

    const users = await this.collection.find<User>({}).toArray();

    // Agrupar usuários por clã
    const clanMap = new Map<string, User[]>();

    for (const user of users) {
      const clanName = extractClanName(user.name);
      if (clanName) {
        if (!clanMap.has(clanName)) {
          clanMap.set(clanName, []);
        }
        clanMap.get(clanName).push(user);
      }
    }

    // Converter map para array de clãs com estatísticas agregadas
    const clans: Clan[] = [];

    for (const [clanName, members] of clanMap.entries()) {
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

      const clan = await clanCollection.findOne({ name: clanName });

      clans.push({
        name: clanName,
        memberCount: members.length,
        points: clan?.points || 0,
        totalScore,
        totalTeamWorkScore,
        totalKills,
        totalDeaths,
        totalTimeOnline,
        members,
      });
    }

    // Ordenar clãs por pontuação total (decrescente)
    clans.sort((a, b) => b.points - a.points);

    // Limitar a quantidade de clãs retornados
    return clans.slice(0, limit);
  }
}
