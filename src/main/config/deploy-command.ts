import { REST, Routes } from "discord.js";
import { slashCommands } from "./slashCommands";
import { env } from "./env";
import { logger } from "../../utils/logger";

export const deployCommand = async () => {
  const commands = slashCommands.map((a) => a.data);

  const rest = new REST().setToken(env.token);
  const clientId = "1207068522430205952";
  const guildId = "1201252603191906466";
  const data = await rest
    .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
    .catch((err) => {
      logger.error(err);
    });

  logger.debug(
    `Successfully reloaded ${(data as []).length} application (/) commands.`
  );
};
