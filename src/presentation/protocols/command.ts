import type { ChatInputCommandInteraction } from "discord.js";

export interface Command {
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
