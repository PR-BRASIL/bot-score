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
      .setColor(0x1abc9c)
      .setAuthor({
        name: "Reality Brasil",
        iconURL: channel.guild.iconURL() || undefined,
      })
      .setTitle("🏅 Top 25 Mensal - Pontos")
      .setTimestamp();

    if (!topPlayers || topPlayers.length === 0) {
      embed.setDescription(
        "Ranking mensal com pontuação no estilo CS (sem patentes).\n" +
          "Nenhum jogador pontuou ainda nesta temporada. Volte em breve!"
      );
    } else {
      // Exibir de baixo para cima, como nos outros pódios
      topPlayers.reverse();
      embed.setDescription(
        "Ranking mensal com pontuação no estilo CS (sem patentes).\n" +
          "Use este ranking para acompanhar a temporada vigente."
      );

      // Jogadores 25 ao 4
      const restPlayers = topPlayers.slice(0, -3);
      for (const [index, player] of restPlayers.entries()) {
        const position = topPlayers.length - index;
        embed.addFields({
          name: `${position}º Lugar - ${player.name}`,
          value: `> ⭐ **Pontos:** ${Number(player.score || 0).toLocaleString(
            "pt-BR"
          )}`,
          inline: false,
        });
      }

      // Top 3 com destaque
      const [third, second, first] = topPlayers.slice(-3);
      if (third) {
        embed.addFields({
          name: `🥉 3º Lugar - ${third.name}`,
          value: `> ⭐ **Pontos:** ${Number(third.score || 0).toLocaleString(
            "pt-BR"
          )}`,
          inline: false,
        });
      }
      if (second) {
        embed.addFields({
          name: `🥈 2º Lugar - ${second.name}`,
          value: `> ⭐ **Pontos:** ${Number(second.score || 0).toLocaleString(
            "pt-BR"
          )}`,
          inline: false,
        });
      }
      if (first) {
        embed.addFields({
          name: `<a:first:1353055748262989867> 1º Lugar - ${first.name}`,
          value: `> ⭐ **Pontos:** ${Number(first.score || 0).toLocaleString(
            "pt-BR"
          )}`,
          inline: false,
        });
      }
    }

    if (message) {
      await message.edit({ embeds: [embed] });
      return;
    }
    const newMessage = await channel.send({ embeds: [embed] });
    this.messageId = newMessage.id;
  }
}
