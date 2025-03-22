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
          "Utilize o comando `/stats` para ver as informações de um jogador específico."
      )
      .setThumbnail(channel.guild.iconURL() || null)
      .setTimestamp()
      .setImage(
        "https://media.discordapp.net/attachments/1162222580644708372/1274439425354371072/Capa_GitBook.png?ex=67df05b4&is=67ddb434&hm=e7f9eb86c1d74c0e1de0414f3dab11023f0820ea8431edfe0812e5afe80de930&=&format=webp&quality=lossless"
      );

    // Top 3 clãs com formatação especial
    const [first, second, third, ...rest] = topClans;

    if (first) {
      embed.addFields({
        name: `👑 1º Lugar - ${first.name}`,
        value: `> 👥 Membros: **${first.memberCount}**\n> ⭐ Score Total: **${first.totalScore}**\n> 🤝 Teamwork Total: **${first.totalTeamWorkScore}**\n> 🎯 K/D Total: **${first.totalKills}/${first.totalDeaths}**`,
        inline: false,
      });
    }

    if (second) {
      embed.addFields({
        name: `🥈 2º Lugar - ${second.name}`,
        value: `> 👥 Membros: **${second.memberCount}**\n> ⭐ Score Total: **${second.totalScore}**\n> 🤝 Teamwork Total: **${second.totalTeamWorkScore}**\n> 🎯 K/D Total: **${second.totalKills}/${second.totalDeaths}**`,
        inline: false,
      });
    }

    if (third) {
      embed.addFields({
        name: `🥉 3º Lugar - ${third.name}`,
        value: `> 👥 Membros: **${third.memberCount}**\n> ⭐ Score Total: **${third.totalScore}**\n> 🤝 Teamwork Total: **${third.totalTeamWorkScore}**\n> 🎯 K/D Total: **${third.totalKills}/${third.totalDeaths}**`,
        inline: false,
      });
    }

    for (const clan of rest) {
      embed.addFields({
        name: `${clan.name}`,
        value: `> 👥 Membros: **${clan.memberCount}**\n> ⭐ Score Total: **${clan.totalScore}**\n> 🤝 Teamwork Total: **${clan.totalTeamWorkScore}**\n> 🎯 K/D Total: **${clan.totalKills}/${clan.totalDeaths}**`,
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
