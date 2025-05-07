import { TopPlayersCommand } from "../../presentation/commands/top-players";
import { MongoGetUserInformationRepository } from "../../infra/db/mongodb/repositories/get-user-information-repository";

export const makeTopPlayersCommand = () => {
  const getUserRepository = new MongoGetUserInformationRepository();
  const command = new TopPlayersCommand(getUserRepository);
  return command;
};
