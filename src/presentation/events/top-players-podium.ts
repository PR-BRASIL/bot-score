import { Client, TextChannel, EmbedBuilder } from "discord.js";
import type { GetTopPlayers } from "../../domain/usecase/get-user-information";
import { env } from "../../main/config/env";
import { getPatent } from "../../utils/patents";
import { GetPatentProgress } from "../../utils/getPatentProgress";

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

    console.log("rodou");

    let message;
    if (this.messageId) {
      try {
        message = await channel.messages.fetch(this.messageId);
      } catch (error) {
        console.error("Message not found, creating a new one:", error);
        this.messageId = null;
      }
    }

    console.log("rodou 2");

    const topPlayers = await this.getTopPlayers.getTopPlayers(20);
    if (!topPlayers || topPlayers.length === 0) {
      console.error("No top players found!");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setAuthor({
        name: "Reality Brasil",
        iconURL: channel.guild.iconURL() || undefined,
      })
      .setTitle("🏆 Top 20 Jogadores")
      .setDescription(
        "Ranking dos melhores jogadores do Reality Brasil!\nAtualizado a cada 30 minutos."
      )
      .setThumbnail(channel.guild.iconURL() || null)
      .setTimestamp();

    // Top 3 players with special formatting
    const [first, second, third, ...rest] = topPlayers;

    console.log("rodou 3");

    if (first) {
      const firstPatent = await getPatent(first.score);
      const progress = await new GetPatentProgress().get(first.score);
      embed.addFields({
        name: `👑 1º Lugar - ${first.name}`,
        value: `> Patente: **${firstPatent}**\n> Score: **${first.score}**\n> TWS: **${first.teamWorkScore}**\n> K/D: **${first.kills}/${first.deaths}**\n> ${progress}`,
        inline: false,
      });
    }

    if (second) {
      const secondPatent = await getPatent(second.score);
      embed.addFields({
        name: `🥈 2º Lugar - ${second.name}`,
        value: `> Patente: **${secondPatent}**\n> Score: **${second.score}**\n> TWS: **${second.teamWorkScore}**\n> K/D: **${second.kills}/${second.deaths}**`,
        inline: false,
      });
    }

    if (third) {
      const thirdPatent = await getPatent(third.score);
      embed.addFields({
        name: `🥉 3º Lugar - ${third.name}`,
        value: `> Patente: **${thirdPatent}**\n> Score: **${third.score}**\n> TWS: **${third.teamWorkScore}**\n> K/D: **${third.kills}/${third.deaths}**`,
        inline: false,
      });
    }

    console.log("rodou 4");

    // Remaining players
    // if (rest.length > 0) {
    //   const restOfPlayers = await Promise.all(
    //     rest.map(async (player, index) => {
    //       const patent = await getPatent(player.score);
    //       return `\`${index + 4}.\` **${player.name}** ・ ${patent}\n> Score: ${
    //         player.score
    //       } ・ TWS: ${player.teamWorkScore} ・ K/D: ${player.kills}/${
    //         player.deaths
    //       }`;
    //     })
    //   );

    //   embed.addFields({
    //     name: "📊 Classificação",
    //     value: restOfPlayers.join("\n"),
    //     inline: false,
    //   });
    // }

    embed.setFooter({
      text: `Reality Brasil ・ ${new Date().toLocaleDateString("pt-BR")}`,
      iconURL: channel.guild.iconURL() || undefined,
    });

    console.log("rodou 5");

    if (message) {
      await message.edit({ embeds: [embed] });
      return;
    }
    const newMessage = await channel.send({ embeds: [embed] });
    this.messageId = newMessage.id;
  }
}
