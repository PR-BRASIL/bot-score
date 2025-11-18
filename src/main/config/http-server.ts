import express from "express";
import type { ClientWithCommands } from "./app";
import { env } from "./env";
import { logger } from "../../utils/logger";
import { registerDiscordLinkRoutes } from "../routes/discord-link-routes";

let serverStarted = false;

export const startHttpServer = (client: ClientWithCommands): void => {
  if (serverStarted) return;

  const app = express();
  app.use(express.json());

  registerDiscordLinkRoutes(app, client);

  app.listen(env.port, () => {
    serverStarted = true;
    logger.info(`HTTP server rodando na porta ${env.port}`);
  });
};
