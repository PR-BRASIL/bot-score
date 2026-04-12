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

    const topClans = await this.getTopClans.getTopClans(25);
    if (!topClans || topClans.length === 0) {
      return;
    }

    topClans.reverse();

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setAuthor({
        name: "Reality Brasil",
        iconURL: channel.guild.iconURL() || undefined,
      })
      .setTitle("🏆 Top 25 Melhores Clãs")
      .setDescription(
        "Ranking dos melhores clãs do Reality Brasil!\n" +
          "⚡ **DICA PARA CLÃS:** Incentive seus membros a jogar entre 7h e 14h para ganhar o **DOBRO** de pontuação!\n" +
          "Utilize o comando `/stats` para ver as informações de um jogador específico.\n" +
          "Utilize o comando `/clanstats` para ver as informações de um clã específico."
      )
      .setTimestamp()
      .setImage(
        "https://media.discordapp.net/attachments/1162222580644708372/1274439425354371072/Capa_GitBook.png?ex=67df05b4&is=67ddb434&hm=e7f9eb86c1d74c0e1de0414f3dab11023f0820ea8431edfe0812e5afe80de930&=&format=webp&quality=lossless"
      );

    // Top 3 clãs com formatação especial
    const rest = topClans.slice(0, -3);

    for (const [index, clan] of rest.entries()) {
      const position = 25 - index; // Começa do 4º lugar
      const kdRatio =
        clan.totalDeaths > 0
          ? (clan.totalKills / clan.totalDeaths).toFixed(2)
          : clan.totalKills.toFixed(2);

      // Find the most recent activity date from clan members
      const mostRecentActivity = clan.members
        .filter((member) => member.updatedAt)
        .map((member) => new Date(member.updatedAt!))
        .sort((a, b) => b.getTime() - a.getTime())[0];

      const lastActivity = mostRecentActivity
        ? mostRecentActivity.toLocaleDateString("pt-BR")
        : "N/A";

      embed.addFields({
        name: `${position}º Lugar - ${clan.name}`,
        value: `> 👥 **Membros:** ${clan.memberCount.toLocaleString(
          "pt-BR"
        )}\n> ⭐ **Pontuação do Clã:** ${clan.points.toLocaleString(
          "pt-BR"
        )}\n> 🤝 **Teamwork Total:** ${clan.totalTeamWorkScore.toLocaleString(
          "pt-BR"
        )}\n> 🎯 **K/D Total:** ${clan.totalKills.toLocaleString(
          "pt-BR"
        )} / ${clan.totalDeaths.toLocaleString(
          "pt-BR"
        )} (${kdRatio})\n> 📅 **Última atividade:** ${lastActivity}`,
        inline: false,
      });
    }

    const [third, second, first] = topClans.slice(-3);

    if (third) {
      const kdRatio =
        third.totalDeaths > 0
          ? (third.totalKills / third.totalDeaths).toFixed(2)
          : third.totalKills.toFixed(2);

      const mostRecentActivity = third.members
        .filter((member) => member.updatedAt)
        .map((member) => new Date(member.updatedAt!))
        .sort((a, b) => b.getTime() - a.getTime())[0];

      const lastActivity = mostRecentActivity
        ? mostRecentActivity.toLocaleDateString("pt-BR")
        : "N/A";

      embed.addFields({
        name: `🥉 3º Lugar - ${third.name}`,
        value: `> 👥 **Membros:** ${third.memberCount.toLocaleString(
          "pt-BR"
        )}\n> ⭐ **Pontuação do Clã:** ${third.points.toLocaleString(
          "pt-BR"
        )}\n> 🤝 **Teamwork Total:** ${third.totalTeamWorkScore.toLocaleString(
          "pt-BR"
        )}\n> 🎯 **K/D Total:** ${third.totalKills.toLocaleString(
          "pt-BR"
        )} / ${third.totalDeaths.toLocaleString(
          "pt-BR"
        )} (${kdRatio})\n> 📅 **Última atividade:** ${lastActivity}`,
        inline: false,
      });
    }

    if (second) {
      const kdRatio =
        second.totalDeaths > 0
          ? (second.totalKills / second.totalDeaths).toFixed(2)
          : second.totalKills.toFixed(2);

      const mostRecentActivity = second.members
        .filter((member) => member.updatedAt)
        .map((member) => new Date(member.updatedAt!))
        .sort((a, b) => b.getTime() - a.getTime())[0];

      const lastActivity = mostRecentActivity
        ? mostRecentActivity.toLocaleDateString("pt-BR")
        : "N/A";

      embed.addFields({
        name: `🥈 2º Lugar - ${second.name}`,
        value: `> 👥 **Membros:** ${second.memberCount.toLocaleString(
          "pt-BR"
        )}\n> ⭐ **Pontuação do Clã:** ${second.points.toLocaleString(
          "pt-BR"
        )}\n> 🤝 **Teamwork Total:** ${second.totalTeamWorkScore.toLocaleString(
          "pt-BR"
        )}\n> 🎯 **K/D Total:** ${second.totalKills.toLocaleString(
          "pt-BR"
        )} / ${second.totalDeaths.toLocaleString(
          "pt-BR"
        )} (${kdRatio})\n> 📅 **Última atividade:** ${lastActivity}`,
        inline: false,
      });
    }

    if (first) {
      const kdRatio =
        first.totalDeaths > 0
          ? (first.totalKills / first.totalDeaths).toFixed(2)
          : first.totalKills.toFixed(2);

      const mostRecentActivity = first.members
        .filter((member) => member.updatedAt)
        .map((member) => new Date(member.updatedAt!))
        .sort((a, b) => b.getTime() - a.getTime())[0];

      const lastActivity = mostRecentActivity
        ? mostRecentActivity.toLocaleDateString("pt-BR")
        : "N/A";

      embed.addFields({
        name: `👑 1º Lugar - ${first.name}`,
        value: `> 👥 **Membros:** ${first.memberCount.toLocaleString(
          "pt-BR"
        )}\n> ⭐ **Pontuação do Clã:** ${first.points.toLocaleString(
          "pt-BR"
        )}\n> 🤝 **Teamwork Total:** ${first.totalTeamWorkScore.toLocaleString(
          "pt-BR"
        )}\n> 🎯 **K/D Total:** ${first.totalKills.toLocaleString(
          "pt-BR"
        )} / ${first.totalDeaths.toLocaleString(
          "pt-BR"
        )} (${kdRatio})\n> 📅 **Última atividade:** ${lastActivity}`,
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
