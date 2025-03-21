import { Client, Collection, GatewayIntentBits } from "discord.js";
import { env } from "./env";
import { io } from "socket.io-client";
import { slashCommands } from "./slashCommands";
import { makeInteractionEvents } from "./interaction-events";
import { deployCommand } from "./deploy-command";
export interface ClientWithCommands extends Client {
  commands: Collection<string, any>;
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
}) as ClientWithCommands;

client.commands = new Collection();

for (const command of slashCommands) {
  client.commands.set(command.data.name, command);
}
makeInteractionEvents(client);
deployCommand();

export { client };
