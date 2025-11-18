import type { ButtonInteraction } from "discord.js";
import { discordLinkService, DiscordLinkError } from "../services/discord-link-service";
import { logger } from "../../utils/logger";

const isDiscordLinkInteraction = (customId: string) =>
  customId?.startsWith("discord-link:");

export const handleDiscordLinkButton = async (
  interaction: ButtonInteraction
) => {
  if (!isDiscordLinkInteraction(interaction.customId)) {
    return;
  }

  const [, action, requestId] = interaction.customId.split(":");

  if (!action || !requestId) {
    await interaction.reply({
      content: "Interação inválida.",
      ephemeral: true,
    });
    return;
  }

  try {
    await interaction.deferReply({ ephemeral: true });

    if (action === "confirm") {
      const result = await discordLinkService.confirmLinkRequest(
        requestId,
        interaction.user.id
      );

      await interaction.editReply({
        content: `✅ Vínculo confirmado com o jogador **${result.playerName}**.`,
      });
    } else if (action === "cancel") {
      const result = await discordLinkService.cancelLinkRequest(
        requestId,
        interaction.user.id
      );

      await interaction.editReply({
        content: `🔒 Solicitação cancelada. O jogador **${result.playerName}** não foi vinculado.`,
      });
    } else {
      await interaction.editReply({
        content: "Ação desconhecida.",
      });
    }

    await interaction.message.edit({ components: [] });
  } catch (error) {
    if (error instanceof DiscordLinkError) {
      await interaction.editReply({ content: error.message });
      return;
    }

    logger.error(error);
    await interaction.editReply({
      content: "Ocorreu um erro ao processar sua solicitação.",
    });
  }
};

