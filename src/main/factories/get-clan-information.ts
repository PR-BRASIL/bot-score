import { GetClanInformationCommand } from "../../presentation/commands/get-clan-information";
import { MongoGetUserInformationRepository } from "../../infra/db/mongodb/repositories/get-user-information-repository";

export const makeGetClanInformationCommand = () => {
  const getUserInformationRepository = new MongoGetUserInformationRepository();
  return new GetClanInformationCommand(getUserInformationRepository);
};
