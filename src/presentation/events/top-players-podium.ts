import { Client, TextChannel, EmbedBuilder } from "discord.js";
import type { GetTopPlayers } from "../../domain/usecase/get-user-information";
import { env } from "../../main/config/env";

export class TopPlayersPodium {
  private readonly getTopPlayers: GetTopPlayers;
  private messageId: string | null = null;

  public constructor(getTopPlayers: GetTopPlayers) {
    this.getTopPlayers = getTopPlayers;
  }

  public async updatePodium(client: Client): Promise<void> {
    const channel = client.channels.cache.get(
      env.topPlayersPodiumChannelId
    ) as TextChannel;
    if (!channel) {
      console.error("Channel not found!");
      return;
    }

    let message;
    if (this.messageId) {
      try {
        message = await channel.messages.fetch(this.messageId);
      } catch (error) {
        console.error("Message not found, creating a new one:", error);
        this.messageId = null;
      }
    }

    const topPlayers = await this.getTopPlayers.getTopPlayers(20);
    if (!topPlayers || topPlayers.length === 0) {
      console.error("No top players found!");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("Top 20 Players Podium")
      .setDescription("Here are the top 20 players in Reality Brasil!");

    topPlayers.forEach((player, index) => {
      embed.addFields({
        name: `#${index + 1} ${player.name}`,
        value: `Score: ${player.score} | Rank: #${index + 1}`,
        inline: false,
      });
    });

    if (message) {
      await message.edit({ embeds: [embed] });
    } else {
      const newMessage = await channel.send({ embeds: [embed] });
      this.messageId = newMessage.id;
    }
  }
}
