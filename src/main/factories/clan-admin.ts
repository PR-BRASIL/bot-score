import { ClanAdminCommand } from "../../presentation/commands/clan-admin";
import { MongoGetUserInformationRepository } from "../../infra/db/mongodb/repositories/get-user-information-repository";
import { MongoClanManagementRepository } from "../../infra/db/mongodb/repositories/clan-management-repository";
import { env } from "../config/env";

export const makeClanAdminCommand = () => {
  const getUserInformationRepository = new MongoGetUserInformationRepository();
  const clanManagement = new MongoClanManagementRepository(() => {
    getUserInformationRepository.clearCache();
  });
  return new ClanAdminCommand(clanManagement, env.clanSuperAdminDiscordIds);
};
