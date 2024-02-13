import type { ChatInputCommandInteraction } from "discord.js";
import { Events } from "discord.js";
import type { ClientWithCommands } from "./app";
import { logger } from "../../utils/logger";

export const makeInteractionEvents = (client: ClientWithCommands) => {
  client.on(
    Events.InteractionCreate,
    async (interaction: ChatInputCommandInteraction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = (interaction.client as ClientWithCommands).commands.get(
        interaction.commandName
      );

      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`
        );
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        logger.error(error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "There was an error while executing this command!",
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
          });
        }
      }
    }
  );
};
