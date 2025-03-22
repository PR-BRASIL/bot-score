import {
  Client,
  TextChannel,
  EmbedBuilder,
  RESTJSONErrorCodes,
} from "discord.js";
import type { GetTopPlayers } from "../../domain/usecase/get-user-information";
import { env } from "../../main/config/env";
import { getPatent } from "../../utils/patents";
import { GetPatentProgress } from "../../utils/getPatentProgress";
import { calculateTotalOnlineTime } from "../../utils/calculate-time-util";

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
      return;
    }

    let message;
    if (this.messageId) {
      try {
        message = await channel.messages.fetch(this.messageId);
      } catch (error) {
        this.messageId = null;
      }
    }

    const topPlayers = await this.getTopPlayers.getTopPlayers(6);
    if (!topPlayers || topPlayers.length === 0) {
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setAuthor({
        name: "Reality Brasil",
        iconURL: channel.guild.iconURL() || undefined,
      })
      .setTitle("🏆 Top 6 Melhores Jogadores")
      .setDescription(
        "Ranking dos melhores jogadores do Reality Brasil!\n" +
          "⚡ **DICA:** Jogue entre 7h e 14h para ganhar o **DOBRO** de pontuação!\n" +
          "Utilize o comando `/stats` para ver as informações de um jogador específico."
      )
      .setThumbnail(channel.guild.iconURL() || null)
      .setTimestamp()
      .setImage(
        "https://media.discordapp.net/attachments/1162222580644708372/1274439425354371072/Capa_GitBook.png?ex=67df05b4&is=67ddb434&hm=e7f9eb86c1d74c0e1de0414f3dab11023f0820ea8431edfe0812e5afe80de930&=&format=webp&quality=lossless"
      );

    // Top 3 players with special formatting
    const [first, second, third, ...rest] = topPlayers;

    if (first) {
      const firstPatent = await getPatent(first.score);
      const progress = await new GetPatentProgress().get(first.score);
      const timeOnline = calculateTotalOnlineTime(first.totalTime || 0);
      embed.addFields({
        name: `👑 1º Lugar - ${first.name} ・ **${firstPatent}**`,
        value: `> Score: **${first.score}**\n> Teamwork: **${first.teamWorkScore}**\n> K/D: **${first.kills}/${first.deaths}**\n> ⏱️ Tempo Online: **${timeOnline}**\n> ${progress}`,
        inline: false,
      });
    }

    if (second) {
      const secondPatent = await getPatent(second.score);
      const timeOnline = calculateTotalOnlineTime(second.totalTime || 0);
      embed.addFields({
        name: `🥈 2º Lugar - ${second.name} ・ **${secondPatent}**`,
        value: `> Score: **${second.score}**\n> Teamwork: **${second.teamWorkScore}**\n> K/D: **${second.kills}/${second.deaths}**\n> ⏱️ Tempo Online: **${timeOnline}**`,
        inline: false,
      });
    }

    if (third) {
      const thirdPatent = await getPatent(third.score);
      const timeOnline = calculateTotalOnlineTime(third.totalTime || 0);
      embed.addFields({
        name: `🥉 3º Lugar - ${third.name} ・ **${thirdPatent}**`,
        value: `> Score: **${third.score}**\n> Teamwork: **${third.teamWorkScore}**\n> K/D: **${third.kills}/${third.deaths}**\n> ⏱️ Tempo Online: **${timeOnline}**`,
        inline: false,
      });
    }

    for (const player of rest) {
      const patent = await getPatent(player.score);
      const timeOnline = calculateTotalOnlineTime(player.totalTime || 0);
      embed.addFields({
        name: `${player.name} ・ **${patent}**`,
        value: `> Score: **${player.score}**\n> Teamwork: **${player.teamWorkScore}**\n> K/D: **${player.kills}/${player.deaths}**\n> ⏱️ Tempo Online: **${timeOnline}**`,
        inline: false,
      });
    }

    embed.setFooter({
      text: `Reality Brasil ・ ${new Date().toLocaleDateString("pt-BR")}`,
      iconURL: channel.guild.iconURL() || undefined,
    });

    if (message) {
      await message.edit({ embeds: [embed] });
      return;
    }
    const newMessage = await channel.send({ embeds: [embed] });
    this.messageId = newMessage.id;
  }
}
