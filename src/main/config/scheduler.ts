import { Client } from "discord.js";
import cron from "node-cron";
import { TopPlayersPodium } from "../../presentation/events/top-players-podium";
import { MongoGetUserInformationRepository } from "../../infra/db/mongodb/repositories/get-user-information-repository";
export function scheduleTopPlayersPodium(client: Client): void {
  const getUserInformation = new MongoGetUserInformationRepository();
  const podium = new TopPlayersPodium(getUserInformation);

  // every 1 minute
  cron.schedule("* * * * *", async () => {
    console.log("Updating top players podium...");
    await podium.updatePodium(client);
  });
}

// /30
