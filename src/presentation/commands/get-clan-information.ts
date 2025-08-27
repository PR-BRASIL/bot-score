import { EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../protocols/command";
import type {
  GetTopClans,
  Clan,
} from "../../domain/usecase/get-user-information";
import { extractClanName } from "../../utils/clanUtils";
import { calculateTotalOnlineTime } from "../../utils/calculate-time-util";

export class GetClanInformationCommand implements Command {
  public constructor(private readonly getTopClansRepository: GetTopClans) {}

  public async execute(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const clanNameParam = interaction.options.getString("clan-name");

    if (!clanNameParam) {
      await interaction.editReply({
        content: "Por favor, informe o nome do clã!",
      });
      return;
    }

    // 🚀 OTIMIZAÇÃO: Buscar clã específico diretamente
    let clan = await this.getTopClansRepository.getClanByName(clanNameParam);

    // Se não encontrou o clã exato, buscar clãs similares
    if (!clan) {
      const similarClans = await this.getTopClansRepository.findSimilarClans(
        clanNameParam,
        5
      );

      if (similarClans.length === 1) {
        // Se houver apenas um resultado similar, buscar os dados completos
        clan = await this.getTopClansRepository.getClanByName(
          similarClans[0].name
        );
      } else if (similarClans.length > 1) {
        // Se houver múltiplos resultados, mostrar sugestões
        const clanList = similarClans
          .map((c) => `• **${c.name}** (${c.memberCount} membros)`)
          .join("\n");

        await interaction.editReply({
          content: `Encontrei ${similarClans.length} clãs que correspondem à sua pesquisa. Por favor, seja mais específico:\n${clanList}`,
        });
        return;
      }
    }

    if (!clan) {
      await interaction.editReply({
        content: `Nenhum clã encontrado com "${clanNameParam}". Verifique se o nome está correto. Apenas listamos os melhores 25 clãs.`,
      });
      return;
    }

    // 🚀 OTIMIZAÇÃO: Só buscar ranking quando realmente precisar
    const allClans = await this.getTopClansRepository.getTopClans(25);
    const clanRank = allClans.findIndex((c) => c.name === clan.name) + 1;

    await interaction.editReply({
      embeds: [this.makeEmbed(interaction, clan, clanRank)],
    });
  }

  private makeEmbed(
    interaction: ChatInputCommandInteraction,
    clan: Clan,
    clanRank: number
  ) {
    const kdRatio =
      clan.totalDeaths > 0
        ? (clan.totalKills / clan.totalDeaths).toFixed(2)
        : clan.totalKills.toFixed(2);

    // Calcular tempo total online do clã
    const totalTimeOnline = calculateTotalOnlineTime(clan.totalTimeOnline);

    // Ordenar membros por score (decrescente)
    const sortedMembers = [...clan.members].sort((a, b) => b.score - a.score);

    // Limitar a quantidade de membros exibidos para evitar exceder o limite do Discord
    const membersToShow = sortedMembers.slice(0, 10);

    // Criar string formatada com os membros do clã
    let membersString = "";
    for (const [index, member] of membersToShow.entries()) {
      const lastPlayed = member.updatedAt
        ? new Date(member.updatedAt).toLocaleDateString("pt-BR")
        : "N/A";

      membersString += `> **${index + 1}.** ${
        member.name
      } - **${member.score.toLocaleString("pt-BR")}** pontos\n`;
      membersString += `> └── 📅 Último jogo: ${lastPlayed}\n`;
    }

    // Se houver mais membros que não couberam na lista
    if (sortedMembers.length > 10) {
      membersString += `> \n> *...e mais ${sortedMembers.length - 10} membros*`;
    }

    const embed = new EmbedBuilder()
      .setColor(0x1abc9c)
      .setAuthor({
        name: "Reality Brasil",
        iconURL: interaction.guild.iconURL(),
      })
      .setThumbnail(interaction.guild.iconURL())
      .setTitle(`Clã ${clan.name}`)
      .setDescription(
        `📋 Informações detalhadas do clã **${clan.name}**\n` +
          `✨ Pontos contabilizados apenas de partidas no **Reality Brasil**\n` +
          `🏆 **Ranking:** #${clanRank.toLocaleString(
            "pt-BR"
          )} com **${clan.points.toLocaleString("pt-BR")}** pontos\n` +
          `⚡ **DICA PARA CLÃS:** Incentive seus membros a jogar entre 7h e 14h para ganhar o **DOBRO** de pontuação!`
      )
      .addFields({
        name: "📈 Estatísticas do Clã",
        value:
          `> \n` +
          `> 👥 **Membros:** ${clan.memberCount.toLocaleString("pt-BR")}\n` +
          `> ⭐ **Pontuação do Clã:** ${clan.points.toLocaleString(
            "pt-BR"
          )} pontos\n` +
          `> 🤝 **Teamwork Total:** ${clan.totalTeamWorkScore.toLocaleString(
            "pt-BR"
          )}\n` +
          `> 🎯 **K/D Total:** ${clan.totalKills.toLocaleString(
            "pt-BR"
          )} / ${clan.totalDeaths.toLocaleString("pt-BR")} (${kdRatio})\n` +
          `> 🏆 **Posição no Ranking:** #${clanRank.toLocaleString("pt-BR")}`,
        inline: false,
      })
      .addFields({
        name: `👥 Membros do Clã (${clan.totalScore.toLocaleString(
          "pt-BR"
        )} pontos)`,
        value: membersString || "> *Nenhum membro encontrado*",
        inline: false,
      });

    embed.setFooter({
      text: `Reality Brasil ・ Atualizado em ${new Date().toLocaleDateString(
        "pt-BR"
      )} ⚡ Otimizado`,
      iconURL: interaction.guild.iconURL(),
    });

    return embed;
  }
}
