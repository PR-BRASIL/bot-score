import { DbGetUserInformation } from "../../data/usecase/get-user-information";
import { GetUserInformationCommand } from "../../presentation/commands/get-user-information";
import { MongoSaveUserDataRepository } from "../../infra/db/mongodb/repositories/get-user-data-repository";

export const makeGetUserInformationCommand = () => {
  const getUserRepository = new MongoSaveUserDataRepository();
  const dbGetUserInformation = new DbGetUserInformation(getUserRepository);
  const command = new GetUserInformationCommand(dbGetUserInformation);
  return command;
};
