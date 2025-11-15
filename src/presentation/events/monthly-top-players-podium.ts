import { Client, TextChannel, EmbedBuilder, Channel } from "discord.js";
import { mongoHelper } from "../../infra/db/mongodb/helpers/mongo-helper";
import { env } from "../../main/config/env";
import type { User } from "../../domain/models/user";

export class MonthlyTopPlayersPodium {
  private messageId: string | null = null;

  public async updatePodium(client: Client): Promise<void> {
    let channel =
      (client.channels.cache.get(env.monthlyTopPlayersChannelId as string) as
        | TextChannel
        | undefined) || null;
    if (!channel) {
      try {
        const fetched = await client.channels.fetch(
          env.monthlyTopPlayersChannelId as string
        );
        channel = fetched as Channel | null as TextChannel | null;
      } catch {
        channel = null;
      }
    }
    if (!channel) return;

    let message;
    if (this.messageId) {
      try {
        message = await channel.messages.fetch(this.messageId);
      } catch {
        this.messageId = null;
      }
    }

    const collection = await mongoHelper.getCollection("monthly_user");
    const topPlayers = await collection
      .find<User>({})
      .sort({ score: -1 })
      .limit(25)
      .toArray();
    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setAuthor({
        name: "Reality Brasil",
        iconURL: channel.guild.iconURL() || undefined,
      })
      .setTitle("🏅 Top 25 Mensal - Pontos")
      .setThumbnail(channel.guild.iconURL() || null)
      .setImage(
        "https://media.discordapp.net/attachments/1162222580644708372/1274439425354371072/Capa_GitBook.png?ex=67df05b4&is=67ddb434&hm=e7f9eb86c1d74c0e1de0414f3dab11023f0820ea8431edfe0812e5afe80de930&=&format=webp&quality=lossless"
      )
      .setTimestamp();

    if (!topPlayers || topPlayers.length === 0) {
      embed.setDescription(
        "Ranking mensal com pontuação.\n" +
          "Nenhum jogador pontuou ainda nesta temporada. Volte em breve!"
      );
    } else {
      // Exibir de baixo para cima, como nos outros pódios
      topPlayers.reverse();
      embed.setDescription(
        "Ranking mensal com pontuação.\n" +
          "Use este ranking para acompanhar a temporada vigente.\n" +
          "⚡ Dica: jogue entre 7h e 14h para pontuar mais!"
      );

      // Jogadores 25 ao 4
      const restPlayers = topPlayers.slice(0, -3);
      for (const [index, player] of restPlayers.entries()) {
        const position = topPlayers.length - index;
        embed.addFields({
          name: `• ${position}º — ${player.name}`,
          value: `> ⭐ **Pontos:** ${Number(player.score || 0).toLocaleString(
            "pt-BR"
          )}\n> ㅤ`,
          inline: false,
        });
      }

      // Top 3 com destaque
      const [third, second, first] = topPlayers.slice(-3);
      if (third) {
        embed.addFields({
          name: `🥉 3º — ${third.name}`,
          value: `> ⭐ **Pontos:** ${Number(third.score || 0).toLocaleString(
            "pt-BR"
          )}\n> ㅤ`,
          inline: false,
        });
      }
      if (second) {
        embed.addFields({
          name: `🥈 2º — ${second.name}`,
          value: `> ⭐ **Pontos:** ${Number(second.score || 0).toLocaleString(
            "pt-BR"
          )}\n> ㅤ`,
          inline: false,
        });
      }
      if (first) {
        embed.addFields({
          name: `<a:first:1353055748262989867> 1º — ${first.name}`,
          value: `> ⭐ **Pontos:** ${Number(first.score || 0).toLocaleString(
            "pt-BR"
          )}\n> ㅤ`,
          inline: false,
        });
      }
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
