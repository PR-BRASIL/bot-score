import { Client } from "discord.js";
import { PatentsInfo } from "../../presentation/events/patents-info";

/**
 * Agenda eventos que executam apenas uma vez na inicialização do bot
 * @param client Cliente do Discord
 */
export function setupOneTimeEvents(client: Client): void {
  // Display patents info
  showPatentsInfo(client);
}

/**
 * Exibe informações sobre todas as patentes
 * @param client Cliente do Discord
 */
async function showPatentsInfo(client: Client): Promise<void> {
  console.log("Exibindo informações sobre patentes...");
  const patentsInfo = new PatentsInfo();
  await patentsInfo.displayPatentsInfo(client);
}
