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
      const patent = firstPatent.split(" <");
      embed.addFields({
        name: `👑 1º Lugar - ${first.name}`,
        value: `> \n> **<${patent[1] || ""} ${
          patent[0]
        }**\n> \n> ⭐ **Score:** ${first.score.toLocaleString(
          "pt-BR"
        )}\n> 🤝 **Teamwork:** ${first.teamWorkScore.toLocaleString(
          "pt-BR"
        )}\n> 🎯 **K/D:** ${first.kills} / ${first.deaths} (${(
          first.kills / first.deaths
        ).toFixed(2)})\n> ${progress}`,
        inline: false,
      });
    }

    if (second) {
      const secondPatent = await getPatent(second.score);
      const patent = secondPatent.split(" <");
      const progress = await new GetPatentProgress().get(second.score);
      embed.addFields({
        name: `🥈 2º Lugar - ${second.name}`,
        value: `> \n> **<${patent[1] || ""} ${
          patent[0]
        }**\n> \n> ⭐ **Score:** ${second.score.toLocaleString(
          "pt-BR"
        )}\n> 🤝 **Teamwork:** ${second.teamWorkScore.toLocaleString(
          "pt-BR"
        )}\n> 🎯 **K/D:** ${second.kills} / ${second.deaths} (${(
          second.kills / second.deaths
        ).toFixed(2)})\n> ${progress}`,
        inline: false,
      });
    }

    if (third) {
      const thirdPatent = await getPatent(third.score);
      const patent = thirdPatent.split(" <");
      const progress = await new GetPatentProgress().get(third.score);
      embed.addFields({
        name: `🥉 3º Lugar - ${third.name}`,
        value: `> \n> **<${patent[1] || ""} ${
          patent[0]
        }**\n> \n> ⭐ **Score:** ${third.score.toLocaleString(
          "pt-BR"
        )}\n> 🤝 **Teamwork:** ${third.teamWorkScore.toLocaleString(
          "pt-BR"
        )}\n> 🎯 **K/D:** ${third.kills} / ${third.deaths} (${(
          third.kills / third.deaths
        ).toFixed(2)})\n> ${progress}`,
        inline: false,
      });
    }

    for (const [index, player] of rest.entries()) {
      const position = index + 4; // Começa do 4º lugar
      const patent = (await getPatent(player.score)).split(" <");
      embed.addFields({
        name: `${position}º Lugar - ${player.name}`,
        value: `> \n> **<${patent[1]} ${
          patent[0]
        }**\n> \n> ⭐ **Score:** ${player.score.toLocaleString(
          "pt-BR"
        )}\n> 🤝 **Teamwork:** ${player.teamWorkScore.toLocaleString(
          "pt-BR"
        )}\n> 🎯 **K/D:** ${player.kills} / ${player.deaths} (${(
          player.kills / player.deaths
        ).toFixed(2)})`,
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
