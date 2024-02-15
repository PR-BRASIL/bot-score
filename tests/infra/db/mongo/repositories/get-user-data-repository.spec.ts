import { MongoSaveUserDataRepository } from "../../../../../src/infra/db/mongodb/repositories/get-user-data-repository";
import { mongoHelper } from "../../../../../src/infra/db/mongodb/helpers/mongo-helper";
import { Collection, Document, ObjectId } from "mongodb";
import { User } from "../../../../../src/domain/models/user";

const makeSut = () => {
  const sut = new MongoSaveUserDataRepository();

  return {
    sut,
  };
};

const fakeUsers = [
  {
    name: "williancc1557",
    ip: "11.11.11.111",
    teamWorkScore: 159,
    hash: "34feb10c8f184946976acb714899b6bd",
    kills: 36,
    deaths: 70,
    score: 261,
  },
  {
    name: "demolidor",
    ip: "111.111.111.11",
    teamWorkScore: -61,
    hash: "73283f1161034cc1b582a084f2091768",
    kills: 0,
    deaths: 1,
    score: 1,
  },
  {
    name: "demolidor12345",
    ip: "111.111.111.11",
    teamWorkScore: -61,
    hash: "73283f1161034aa1b582a084f2091768",
    kills: 0,
    deaths: 1,
    score: 1,
  },
];

describe("MongoGetUserDataRepository", () => {
  let userCollection: Collection<Document>;

  const getUserRank = async (user: User): Promise<number> => {
    const result = await userCollection
      .find({})
      .sort({
        score: -1,
      })
      .toArray();

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    return result.findIndex((a) => a.hash == user.hash) + 1;
  };

  beforeAll(async () => {
    await mongoHelper.connect();
    userCollection = await mongoHelper.getCollection("user");
    await userCollection.insertMany(fakeUsers);
  });

  afterAll(async () => {
    await userCollection.deleteMany({});
    await mongoHelper.disconnect();
  });

  test("should return user if name is correct", async () => {
    const { sut } = makeSut();

    const data = await sut.get({
      nameOrHash: "williancc1557",
    });

    const rank = await getUserRank(fakeUsers[0] as User);
    expect(data).toStrictEqual({
      ...fakeUsers[0],
      rank,
    });
  });

  test("should return user if hash is correct", async () => {
    const { sut } = makeSut();

    const data = await sut.get({
      nameOrHash: "34feb10c8f184946976acb714899b6bd",
    });

    const rank = await getUserRank(fakeUsers[0] as User);
    expect(data).toStrictEqual({
      ...fakeUsers[0],
      rank,
    });
  });

  test("should return null if hash is incorrect", async () => {
    const { sut } = makeSut();

    const data = await sut.get({
      nameOrHash: "invalid_hash",
    });

    expect(data).not.toBeTruthy();
  });

  test("should return user if name is close of correct", async () => {
    const { sut } = makeSut();

    const data = await sut.get({
      nameOrHash: "will",
    });

    const rank = await getUserRank(fakeUsers[0] as User);
    expect(data).toStrictEqual({
      ...fakeUsers[0],
      rank,
    });
  });

  test("should return user if the name is the same as provided", async () => {
    const { sut } = makeSut();

    const data = await sut.get({
      nameOrHash: "demolidor",
    });

    const rank = await getUserRank(fakeUsers[1] as User);
    expect(data).toStrictEqual({
      ...fakeUsers[1],
      rank,
    });
  });
});
