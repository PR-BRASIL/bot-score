import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Interaction,
} from "discord.js";
import { Events } from "discord.js";
import type { ClientWithCommands } from "./app";
import { logger } from "../../utils/logger";
import { handleDiscordLinkButton } from "../../presentation/interactions/discord-link-interaction-handler";

export const makeInteractionEvents = (client: ClientWithCommands) => {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (interaction.isButton()) {
      await handleDiscordLinkButton(interaction as ButtonInteraction);
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const chatInteraction = interaction as ChatInputCommandInteraction;

    const command = (
      chatInteraction.client as ClientWithCommands
    ).commands.get(chatInteraction.commandName);

    if (!command) {
      console.error(
        `No command matching ${chatInteraction.commandName} was found.`
      );
      return;
    }

    try {
      await command.execute(chatInteraction);
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
        if (chatInteraction.replied || chatInteraction.deferred) {
          await chatInteraction.followUp({
            content:
              "Ocorreu um erro ao executar este comando! Por favor, tente novamente.",
            ephemeral: true,
          });
        } else {
          await chatInteraction.reply({
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
  });
};
