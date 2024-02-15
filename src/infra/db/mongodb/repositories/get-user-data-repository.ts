import type {
  GetUserInformationRepository,
  GetUserInformationRepositoryInput,
  GetUserInformationRepositoryOutput,
} from "../../../../data/protocols/get-user-information-repository";
import { mongoHelper } from "../helpers/mongo-helper";

export class MongoSaveUserDataRepository
  implements GetUserInformationRepository
{
  public async get(
    data: GetUserInformationRepositoryInput
  ): Promise<GetUserInformationRepositoryOutput> {
    const collection = await mongoHelper.getCollection("user");

    const regex = new RegExp(data.nameOrHash, "i");
    const users = await collection
      .find<GetUserInformationRepositoryOutput>({
        name: regex,
      })
      .toArray();

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    if (users.length == 1) return users[0];

    const findUser = users.find((a) => data.nameOrHash == a.name);
    if (findUser) return findUser;

    const user = await collection.findOne<GetUserInformationRepositoryOutput>({
      hash: data.nameOrHash,
    });

    if (user) return user;
  }
}
