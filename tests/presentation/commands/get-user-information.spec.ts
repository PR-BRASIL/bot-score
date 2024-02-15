import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { GetUserInformationInput } from "../../../src/domain/usecase/get-user-information";
import { GetUserInformationCommand } from "../../../src/presentation/commands/get-user-information";
jest.mock("../../../src/utils/patents", () => ({
  getPatent: () => jest.fn(),
}));
jest.mock("discord.js", () => ({
  EmbedBuilder: jest.fn().mockImplementation(() => ({
    setColor: jest.fn().mockReturnThis(),
    setAuthor: jest.fn().mockReturnThis(),
    setThumbnail: jest.fn().mockReturnThis(),
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    addFields: jest.fn().mockReturnThis(),
    setFooter: jest.fn().mockReturnThis(),
  })),
}));

const makeSut = () => {
  const getUserInformationRepository = {
    get: jest.fn().mockReturnValue({
      name: "fake-name",
    }),
  };
  const sut = new GetUserInformationCommand(getUserInformationRepository);

  return {
    sut,
    getUserInformationRepository,
  };
};

const fakeData: any = {
  options: {
    getString: jest.fn().mockReturnValue("hash-or-name"),
  },
  reply: jest.fn(),
  guild: {
    iconURL: jest.fn().mockReturnValue("icon-url"),
  },
} as unknown as ChatInputCommandInteraction;

describe("GetUserInformation Command", () => {
  afterEach(() => jest.clearAllMocks());

  test("should call getUserInformationRepository with correct values", async () => {
    const { sut, getUserInformationRepository } = makeSut();

    await sut.execute(fakeData);

    expect(getUserInformationRepository.get).toHaveBeenCalledWith({
      nameOrHash: fakeData.options.getString("hash-or-name"),
    });
  });

  test("should call reply with correct options", async () => {
    const { sut } = makeSut();

    await sut.execute(fakeData);

    expect(fakeData.reply).toHaveBeenCalled();
  });
});
