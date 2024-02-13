import { Client, Collection, GatewayIntentBits } from "discord.js";
import { env } from "./env";
import { io } from "socket.io-client";
interface ClientWithCommands extends Client {
  commands: Collection<string, any>;
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
}) as ClientWithCommands;

client.commands = new Collection();

export const clientSocket = io(env.apiUrl);

export { client };
