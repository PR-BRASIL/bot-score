import { Collection, MongoClient } from "mongodb";
import {
  GetUserInformation,
  GetUserInformationOutput,
  GetTopPlayers,
} from "../../../../domain/usecase/get-user-information";
import { User } from "../../../../domain/models/user";
import { mongoHelper } from "../helpers/mongo-helper";

export class MongoGetUserInformationRepository implements GetTopPlayers {
  private collection: Collection;

  async getTopPlayers(limit: number): Promise<User[]> {
    this.collection = await mongoHelper.getCollection("user");
    return await this.collection
      .find<User>({})
      .sort({ score: -1 })
      .limit(limit)
      .toArray();
  }
}
