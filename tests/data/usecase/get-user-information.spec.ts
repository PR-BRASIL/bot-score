import { GetUserInformationRepositoryInput } from "../../../src/data/protocols/get-user-information-repository";
import { DbGetUserInformation } from "../../../src/data/usecase/get-user-information";
import { GetUserInformationInput } from "../../../src/domain/usecase/get-user-information";

const makeSut = () => {
  const getUserInformationRepository = {
    get: jest.fn().mockReturnValue({
      name: "fake-name",
      teamWorkScore: 0,
      kills: 0,
      deaths: 0,
      score: 0,
    }),
  };
  const sut = new DbGetUserInformation(getUserInformationRepository);

  return {
    sut,
    getUserInformationRepository,
  };
};

const fakeData: GetUserInformationRepositoryInput = {
  nameOrHash: "name-or-hash",
};

describe("GetUserInformation Database", () => {
  test("should call getUserInformationRepository with correct values", async () => {
    const { sut, getUserInformationRepository } = makeSut();

    await sut.get(fakeData);

    expect(getUserInformationRepository.get).toHaveBeenCalledWith(fakeData);
  });
});
