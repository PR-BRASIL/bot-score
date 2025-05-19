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

    const clansData = await clanCollection.find({}).toArray();
    const clans: Clan[] = [];

    for (const clanData of clansData) {
      const members = await this.collection
        .find<User>({ hash: { $in: clanData.membersHash } })
        .toArray();

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

      clans.push({
        name: clanData.name,
        memberCount: members.length,
        points: clanData.points || 0,
        totalScore,
        totalTeamWorkScore,
        totalKills,
        totalDeaths,
        totalTimeOnline,
        members,
      });
    }

    // Sort clans by points (descending)
    clans.sort((a, b) => b.points - a.points);

    // Limit the number of clans returned
    return clans.slice(0, limit);
  }
}
