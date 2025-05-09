import { mongoHelper } from "../infra/db/mongodb/helpers/mongo-helper";
import { logger } from "../utils/logger";
import { client } from "./config/app";
import { env } from "./config/env";
import {
  scheduleTopPlayersPodium,
  scheduleTopClansPodium,
} from "./config/scheduler";
import { setupOneTimeEvents } from "./config/onetime-events";

client.on("ready", async () => {
  let mongoConectionCheck = true;

  await mongoHelper
    .connect(env.mongoUrl)
    .then(() => {
      scheduleTopPlayersPodium(client);
      scheduleTopClansPodium(client);
      setupOneTimeEvents(client);
      logger.info("mongoDB started");
    })
    .catch((err) => {
      logger.error(err);
      mongoConectionCheck = false;
    });

  if (!mongoConectionCheck) return logger.fatal("Error in Mongodb connection");

  logger.info("bot online");
});

client.login(env.token);
