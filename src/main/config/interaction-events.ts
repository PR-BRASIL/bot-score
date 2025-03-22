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

        // Verificar se o erro é de "Unknown interaction"
        if (error.code === 10062) {
          logger.error(
            "A interação expirou. Certifique-se de usar deferReply para operações que demoram mais de 3 segundos."
          );
          return;
        }

        // Tentar responder à interação se ainda for possível
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              content:
                "Ocorreu um erro ao executar este comando! Por favor, tente novamente.",
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content:
                "Ocorreu um erro ao executar este comando! Por favor, tente novamente.",
              ephemeral: true,
            });
          }
        } catch (replyError) {
          logger.error(
            "Não foi possível responder à interação após o erro:",
            replyError
          );
        }
      }
    }
  );
};
