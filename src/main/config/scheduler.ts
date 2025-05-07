import { Client } from "discord.js";
import cron from "node-cron";
import { TopPlayersPodium } from "../../presentation/events/top-players-podium";
import { TopClansPodium } from "../../presentation/events/top-clans-podium";
import { MongoGetUserInformationRepository } from "../../infra/db/mongodb/repositories/get-user-information-repository";
import { env } from "./env";

export function scheduleTopPlayersPodium(client: Client): void {
  const getUserInformation = new MongoGetUserInformationRepository();
  const podium = new TopPlayersPodium(getUserInformation);

  // every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    console.log("Updating top players podium...");
    await podium.updatePodium(client);
  });
}

export function scheduleTopClansPodium(client: Client): void {
  const getUserInformation = new MongoGetUserInformationRepository();
  const podium = new TopClansPodium(getUserInformation);

  // every 10 minutes
  cron.schedule("*/10 * * * * *", async () => {
    console.log("Updating top clans podium...");
    await podium.updatePodium(client);
  });
}
