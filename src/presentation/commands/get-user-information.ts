import {
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type GuildMember,
} from "discord.js";
import type { Command } from "../protocols/command";
import type {
  GetUserInformation,
  GetUserInformationOutput,
} from "../../domain/usecase/get-user-information";
import { getPatent } from "../../utils/patents";
import { GetPatentProgress } from "../../utils/getPatentProgress";
import { mongoHelper } from "../../infra/db/mongodb/helpers/mongo-helper";
import type { User } from "../../domain/models/user";

export class GetUserInformationCommand implements Command {
  public constructor(
    private readonly getUserInformationRepository: GetUserInformation
  ) {}

  public async execute(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    // Acknowledge the interaction immediately
    await interaction.deferReply({ ephemeral: true });

    const data = await this.getUserInformationRepository.get({
      nameOrHash: interaction.options.getString("hash-or-name"),
    });

    if (!data) {
      await interaction.editReply({
        content: "Usuário não encontrado!",
      });
      return;
    }

    await interaction.editReply({
      embeds: [await this.makeEmbed(interaction, data)],
    });
  }

  private async makeEmbed(
    interaction: ChatInputCommandInteraction,
    userData: GetUserInformationOutput
  ) {
    const allowedRoleIds = new Set([
      "1149794247634079775",
      "1149794265346621640",
      "1149794262091829329",
      "1149794269675139174",
    ]);
    const member = interaction.member as GuildMember | null;
    const hasAllowedRole = !!member?.roles?.cache?.some((role) =>
      allowedRoleIds.has(role.id)
    );
    const userPatent = await getPatent(userData.score);
    const patent = userPatent.split(" <");
    const progress = await new GetPatentProgress().get(userData.score);
    const kdRatio =
      userData.deaths > 0
        ? (userData.kills / userData.deaths).toFixed(2)
        : userData.kills.toFixed(2);

    const lastPlayed = userData.updatedAt
      ? new Date(userData.updatedAt).toLocaleDateString("pt-BR")
      : "N/A";

    // Ranking mensal (se o jogador estiver na coleção mensal)
    let monthlyRankingLine = "";
    try {
      const monthlyCollection = await mongoHelper.getCollection("monthly_user");
      const monthlyUser = await monthlyCollection.findOne<User>({
        hash: userData.hash,
      });

      if (monthlyUser) {
        const monthlyPlayers = await monthlyCollection
          .find<User>({})
          .sort({ score: -1 })
          .toArray();

        const monthlyRank =
          monthlyPlayers.findIndex(
            (player) => player.hash === monthlyUser.hash
          ) + 1;

        if (monthlyRank > 0) {
          monthlyRankingLine =
            `> \n` +
            `> 🏅 **Ranking Mensal:** #${monthlyRank.toLocaleString(
              "pt-BR"
            )} com **${Number(monthlyUser.score || 0).toLocaleString(
              "pt-BR"
            )}** pontos\n` +
            `> ㅤ`;
        }
      }
    } catch {
      // Se der erro ao buscar ranking mensal, apenas não mostra essa informação
    }

    const embed = new EmbedBuilder()
      .setColor(0x1abc9c)
      .setAuthor({
        name: "Reality Brasil",
        iconURL: interaction.guild.iconURL(),
      })
      .setThumbnail(interaction.guild.iconURL())
      .setTitle(`${userData.name}`)
      .setDescription(
        `📋 Informações detalhadas do jogador **${userData.name}**\n` +
          `✨ Pontos contabilizados apenas de partidas no **Reality Brasil**\n` +
          `🏆 **Ranking:** #${userData.rank.toLocaleString(
            "pt-BR"
          )} com **${userData.score.toLocaleString("pt-BR")}** pontos\n` +
          `⚡ **DICA:** Jogue entre 7h e 14h para ganhar o **DOBRO** de pontuação!`
      )
      .addFields({
        name: "📊 Patente Atual",
        value: `> \n> **<${patent[1] || ""} ${patent[0]}**\n> ㅤ`,
        inline: false,
      });

    if (monthlyRankingLine) {
      embed.addFields({
        name: "📅 Temporada Mensal",
        value: monthlyRankingLine,
        inline: false,
      });
    }

    const statsValue =
      `> \n` +
      `> ⭐ **Score:** ${userData.score.toLocaleString("pt-BR")} pontos\n` +
      `> 🎮 **Partidas:** ${(userData.rounds || 0).toLocaleString(
        "pt-BR"
      )}\n` +
      `> 🤝 **Teamwork:** ${userData.teamWorkScore.toLocaleString(
        "pt-BR"
      )}\n` +
      `> 🎯 **K/D:** ${userData.kills.toLocaleString(
        "pt-BR"
      )} / ${userData.deaths.toLocaleString("pt-BR")} (${kdRatio})\n` +
      `> 🏆 **Posição no Ranking:** #${userData.rank.toLocaleString(
        "pt-BR"
      )}\n` +
      `> 📅 **Último jogo:** ${lastPlayed}\n`;

    const discordMention = userData.discordUserId
      ? `> 💬 **Discord:** <@${userData.discordUserId}>\n`
      : "";

    embed.addFields({
      name: "📈 Estatísticas",
      value: statsValue + discordMention + `> \n` + `> ${progress}`,
      inline: false,
    });

    if (hasAllowedRole) {
      embed.addFields({
        name: "🔐 Hash do Jogador",
        value: `> \n> ${userData.hash}\n> ㅤ`,
        inline: false,
      });
    }

    embed.setFooter({
      text: `Reality Brasil ・ Atualizado em ${new Date().toLocaleDateString(
        "pt-BR"
      )}`,
    });

    return embed;
  }
}
