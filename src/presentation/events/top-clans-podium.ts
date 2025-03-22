import { Client, TextChannel, EmbedBuilder } from "discord.js";
import type { GetTopClans } from "../../domain/usecase/get-user-information";
import { env } from "../../main/config/env";

export class TopClansPodium {
  private readonly getTopClans: GetTopClans;
  private messageId: string | null = null;

  public constructor(getTopClans: GetTopClans) {
    this.getTopClans = getTopClans;
  }

  public async updatePodium(client: Client): Promise<void> {
    const channel = client.channels.cache.get(
      env.topClansPodiumChannelId
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

    const topClans = await this.getTopClans.getTopClans(6);
    if (!topClans || topClans.length === 0) {
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setAuthor({
        name: "Reality Brasil",
        iconURL: channel.guild.iconURL() || undefined,
      })
      .setTitle("🏆 Top 6 Melhores Clãs")
      .setDescription(
        "Ranking dos melhores clãs do Reality Brasil!\n" +
          "⚡ **DICA PARA CLÃS:** Incentive seus membros a jogar entre 7h e 14h para ganhar o **DOBRO** de pontuação!\n" +
          "Utilize o comando `/stats` para ver as informações de um jogador específico.\n" +
          "Utilize o comando `/clastats` para ver as informações de um clã específico."
      )
      .setThumbnail(channel.guild.iconURL() || null)
      .setTimestamp()
      .setImage(
        "https://media.discordapp.net/attachments/1162222580644708372/1274439425354371072/Capa_GitBook.png?ex=67df05b4&is=67ddb434&hm=e7f9eb86c1d74c0e1de0414f3dab11023f0820ea8431edfe0812e5afe80de930&=&format=webp&quality=lossless"
      );

    // Top 3 clãs com formatação especial
    const [first, second, third, ...rest] = topClans;

    if (first) {
      const kdRatio =
        first.totalDeaths > 0
          ? (first.totalKills / first.totalDeaths).toFixed(2)
          : first.totalKills.toFixed(2);
      embed.addFields({
        name: `👑 1º Lugar - ${first.name}`,
        value: `> 👥 **Membros:** ${first.memberCount.toLocaleString(
          "pt-BR"
        )}\n> ⭐ **Score Total:** ${first.totalScore.toLocaleString(
          "pt-BR"
        )}\n> 🤝 **Teamwork Total:** ${first.totalTeamWorkScore.toLocaleString(
          "pt-BR"
        )}\n> 🎯 **K/D Total:** ${first.totalKills.toLocaleString(
          "pt-BR"
        )} / ${first.totalDeaths.toLocaleString("pt-BR")} (${kdRatio})`,
        inline: false,
      });
    }

    if (second) {
      const kdRatio =
        second.totalDeaths > 0
          ? (second.totalKills / second.totalDeaths).toFixed(2)
          : second.totalKills.toFixed(2);
      embed.addFields({
        name: `🥈 2º Lugar - ${second.name}`,
        value: `> 👥 **Membros:** ${second.memberCount.toLocaleString(
          "pt-BR"
        )}\n> ⭐ **Score Total:** ${second.totalScore.toLocaleString(
          "pt-BR"
        )}\n> 🤝 **Teamwork Total:** ${second.totalTeamWorkScore.toLocaleString(
          "pt-BR"
        )}\n> 🎯 **K/D Total:** ${second.totalKills.toLocaleString(
          "pt-BR"
        )} / ${second.totalDeaths.toLocaleString("pt-BR")} (${kdRatio})`,
        inline: false,
      });
    }

    if (third) {
      const kdRatio =
        third.totalDeaths > 0
          ? (third.totalKills / third.totalDeaths).toFixed(2)
          : third.totalKills.toFixed(2);
      embed.addFields({
        name: `🥉 3º Lugar - ${third.name}`,
        value: `> 👥 **Membros:** ${third.memberCount.toLocaleString(
          "pt-BR"
        )}\n> ⭐ **Score Total:** ${third.totalScore.toLocaleString(
          "pt-BR"
        )}\n> 🤝 **Teamwork Total:** ${third.totalTeamWorkScore.toLocaleString(
          "pt-BR"
        )}\n> 🎯 **K/D Total:** ${third.totalKills.toLocaleString(
          "pt-BR"
        )} / ${third.totalDeaths.toLocaleString("pt-BR")} (${kdRatio})`,
        inline: false,
      });
    }

    for (const [index, clan] of rest.entries()) {
      const position = index + 4; // Começa do 4º lugar
      const kdRatio =
        clan.totalDeaths > 0
          ? (clan.totalKills / clan.totalDeaths).toFixed(2)
          : clan.totalKills.toFixed(2);
      embed.addFields({
        name: `${position}º Lugar - ${clan.name}`,
        value: `> 👥 **Membros:** ${clan.memberCount.toLocaleString(
          "pt-BR"
        )}\n> ⭐ **Score Total:** ${clan.totalScore.toLocaleString(
          "pt-BR"
        )}\n> 🤝 **Teamwork Total:** ${clan.totalTeamWorkScore.toLocaleString(
          "pt-BR"
        )}\n> 🎯 **K/D Total:** ${clan.totalKills.toLocaleString(
          "pt-BR"
        )} / ${clan.totalDeaths.toLocaleString("pt-BR")} (${kdRatio})`,
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
