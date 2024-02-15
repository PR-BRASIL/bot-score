import type { Collection } from "mongodb";
import type {
  GetUserInformationRepository,
  GetUserInformationRepositoryInput,
  GetUserInformationRepositoryOutput,
} from "../../../../data/protocols/get-user-information-repository";
import type { User } from "../../../../domain/models/user";
import { mongoHelper } from "../helpers/mongo-helper";

export class MongoSaveUserDataRepository
  implements GetUserInformationRepository
{
  private collection: Collection;

  public async get(
    data: GetUserInformationRepositoryInput
  ): Promise<GetUserInformationRepositoryOutput> {
    this.collection = await mongoHelper.getCollection("user");

    const regex = new RegExp(data.nameOrHash, "i");
    const users = await this.collection
      .find<User>({
        name: regex,
      })
      .toArray();

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    if (users.length == 1) return this.makeReturnData(users[0]);

    const findUser = users.find((a) => data.nameOrHash == a.name);
    if (findUser) return this.makeReturnData(findUser);

    const user = await this.collection.findOne<User>({
      hash: data.nameOrHash,
    });

    if (user) return this.makeReturnData(user);
  }

  private async makeReturnData(
    user: User
  ): Promise<GetUserInformationRepositoryOutput> {
    return {
      ...user,
      rank: await this.getUserRank(user),
    };
  }

  private async getUserRank(user: User): Promise<number> {
    const result = await this.collection
      .find({})
      .sort({
        score: -1,
      })
      .toArray();

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    return result.findIndex((a) => a.hash == user.hash) + 1;
  }
}
