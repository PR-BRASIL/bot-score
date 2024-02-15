import { GetUserInformationRepositoryOutput } from "../../../../../src/data/protocols/get-user-information-repository";
import { MongoSaveUserDataRepository } from "../../../../../src/infra/db/mongodb/repositories/get-user-data-repository";
import { mongoHelper } from "../../../../../src/infra/db/mongodb/helpers/mongo-helper";
import { Collection, Document } from "mongodb";

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
    teamWorkScore: { $numberInt: "159" },
    hash: "34feb10c8f184946976acb714899b6bd",
    kills: { $numberInt: "36" },
    deaths: { $numberInt: "70" },
    score: { $numberInt: "261" },
  },
  {
    name: "demolidor",
    ip: "111.111.111.11",
    teamWorkScore: { $numberInt: "-61" },
    hash: "73283f1161034cc1b582a084f2091768",
    kills: { $numberInt: "0" },
    deaths: { $numberInt: "1" },
    score: { $numberInt: "1" },
  },
  {
    name: "demolidor12345",
    ip: "111.111.111.11",
    teamWorkScore: { $numberInt: "-61" },
    hash: "73283f1161034aa1b582a084f2091768",
    kills: { $numberInt: "0" },
    deaths: { $numberInt: "1" },
    score: { $numberInt: "1" },
  },
];

describe("MongoGetUserDataRepository", () => {
  let userCollection: Collection<Document>;
  beforeAll(async () => {
    await mongoHelper.connect();
    userCollection = await mongoHelper.getCollection("user");
    await userCollection.insertMany(fakeUsers);
  });

  afterAll(async () => {
    await mongoHelper.disconnect();
  });

  test("should return user if name is correct", async () => {
    const { sut } = makeSut();

    const data = await sut.get({
      nameOrHash: "williancc1557",
    });

    expect(data).toStrictEqual(fakeUsers[0]);
  });

  test("should return user if hash is correct", async () => {
    const { sut } = makeSut();

    const data = await sut.get({
      nameOrHash: "34feb10c8f184946976acb714899b6bd",
    });

    expect(data).toStrictEqual(fakeUsers[0]);
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

    expect(data).toStrictEqual(fakeUsers[0]);
  });

  test("should return user if the name is the same as provided", async () => {
    const { sut } = makeSut();

    const data = await sut.get({
      nameOrHash: "demolidor",
    });

    expect(data).toStrictEqual(fakeUsers[1]);
  });
});
