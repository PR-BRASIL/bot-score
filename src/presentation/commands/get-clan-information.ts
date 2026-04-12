import {
  EmbedBuilder,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import type { Command } from "../protocols/command";
import type {
  GetTopClans,
  Clan,
} from "../../domain/usecase/get-user-information";
import { calculateTotalOnlineTime } from "../../utils/calculate-time-util";
import { MongoClanManagementRepository } from "../../infra/db/mongodb/repositories/clan-management-repository";

const CLAN_AUTOCOMPLETE_NAME_MAX = 100;
const CLAN_AUTOCOMPLETE_VALUE_MAX = 100;
const CLAN_AUTOCOMPLETE_LIMIT = 25;

export class GetClanInformationCommand implements Command {
  public constructor(private readonly getTopClansRepository: GetTopClans) {}

  private readonly membersPerPage = 5;

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

    // Paginação
    let currentPage = 0;
    const totalPages = Math.max(
      1,
      Math.ceil(clan.members.length / this.membersPerPage)
    );

    const embed = this.makeEmbed(
      interaction,
      clan,
      clanRank,
      currentPage,
      totalPages
    );
    const row = this.createButtons(currentPage, totalPages);

    const response = await interaction.editReply({
      embeds: [embed],
      components: totalPages > 1 ? [row] : [],
    });

    if (totalPages <= 1) return;

    // Coletor de interações dos botões
    const collector = (
      await interaction.fetchReply()
    ).createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000, // 5 minutos
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({
          content: "Você não pode usar estes botões.",
          ephemeral: true,
        });
        return;
      }

      if (i.customId === "first") currentPage = 0;
      if (i.customId === "previous") currentPage = Math.max(0, currentPage - 1);
      if (i.customId === "next")
        currentPage = Math.min(totalPages - 1, currentPage + 1);
      if (i.customId === "last") currentPage = totalPages - 1;

      const updatedEmbed = this.makeEmbed(
        interaction,
        clan,
        clanRank,
        currentPage,
        totalPages
      );
      const updatedRow = this.createButtons(currentPage, totalPages);

      await i.update({
        embeds: [updatedEmbed],
        components: [updatedRow],
      });
    });

    collector.on("end", async () => {
      await interaction.editReply({ components: [] }).catch(() => {});
    });
  }

  private createButtons(currentPage: number, totalPages: number) {
    const first = new ButtonBuilder()
      .setCustomId("first")
      .setLabel("⏮️ Primeiro")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 0);

    const prev = new ButtonBuilder()
      .setCustomId("previous")
      .setLabel("◀️ Anterior")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === 0);

    const next = new ButtonBuilder()
      .setCustomId("next")
      .setLabel("Próximo ▶️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage >= totalPages - 1);

    const last = new ButtonBuilder()
      .setCustomId("last")
      .setLabel("Último ⏭️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage >= totalPages - 1);

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      first,
      prev,
      next,
      last
    );
  }

  private makeEmbed(
    interaction: ChatInputCommandInteraction,
    clan: Clan,
    clanRank: number,
    currentPage: number,
    totalPages: number
  ) {
    const kdRatio =
      clan.totalDeaths > 0
        ? (clan.totalKills / clan.totalDeaths).toFixed(2)
        : clan.totalKills.toFixed(2);

    // Ordenar membros por score (decrescente)
    const sortedMembers = [...clan.members].sort((a, b) => b.score - a.score);

    // Paginar membros
    const start = currentPage * this.membersPerPage;
    const membersToShow = sortedMembers.slice(
      start,
      start + this.membersPerPage
    );

    // Criar string formatada com os membros do clã (mais bonitinho)
    let membersString = "";
    for (const [index, member] of membersToShow.entries()) {
      const position = start + index + 1;
      const lastPlayed = member.updatedAt
        ? new Date(member.updatedAt).toLocaleDateString("pt-BR")
        : "N/A";

      const medal =
        position === 1
          ? "🥇"
          : position === 2
          ? "🥈"
          : position === 3
          ? "🥉"
          : `#${position}`;

      const kdRatio =
        member.deaths > 0
          ? (member.kills / member.deaths).toFixed(2)
          : member.kills.toFixed(2);

      // Layout mais compacto para respeitar o limite de 1024 caracteres
      const memberLine = `${medal} **${
        member.name
      }**\n⭐ ${member.score.toLocaleString(
        "pt-BR"
      )} • 🎯 ${kdRatio} • 📅 ${lastPlayed}\n\n`;

      // Verificar se adicionar este membro não excederia o limite
      if (membersString.length + memberLine.length > 950) {
        membersString += `\n*...mais ${
          membersToShow.length - index
        } membros na próxima página*`;
        break;
      }

      membersString += memberLine;
    }

    const totalTimeOnline = calculateTotalOnlineTime(clan.totalTimeOnline);

    const leaderIdsConfigured = (clan.leaderDiscordIds ?? []).filter(
      (id): id is string => typeof id === "string" && id.length > 0
    );
    const leaderHashesConfigured = (clan.leaderHashes ?? []).filter(
      (h): h is string => typeof h === "string" && h.length > 0
    );

    const linesFromDiscord = leaderIdsConfigured.map((discordId) => {
      const member = clan.members.find((m) => m.discordUserId === discordId);
      if (member) {
        return `👑 **${member.name}** · <@${discordId}>`;
      }
      return `👑 <@${discordId}>`;
    });

    const linesFromHashOnly = leaderHashesConfigured
      .filter((hash) => {
        const member = clan.members.find((m) => m.hash === hash);
        if (member?.discordUserId) {
          return !leaderIdsConfigured.includes(member.discordUserId);
        }
        return true;
      })
      .map((hash) => {
        const member = clan.members.find((m) => m.hash === hash);
        if (member) {
          return `👑 **${member.name}** _(sem Discord vinculado — após vincular, poderá usar os comandos de líder)_`;
        }
        return `👑 _hash ${hash.slice(0, 8)}…_ _(fora da lista de membros carregada)_`;
      });

    const leadershipLines = [...linesFromDiscord, ...linesFromHashOnly];
    const leadershipField =
      leadershipLines.length > 0
        ? {
            name: "👑 Liderança do clã",
            value: leadershipLines.join("\n"),
            inline: false as const,
          }
        : null;

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
          `⚡ **DICA PARA CLÃS:** Incentive seus membros a jogar entre 7h e 14h para ganhar o **DOBRO** de pontuação!\n` +
          `📄 Página ${currentPage + 1}/${totalPages}`
      );

    if (leadershipField) {
      embed.addFields(leadershipField);
    }

    embed
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
          `> ⏱️ **Tempo Online:** ${totalTimeOnline}`,
        inline: false,
      })
      .addFields({
        name: `👥 Membros (${clan.totalScore.toLocaleString("pt-BR")} pts)`,
        value: membersString || "*Nenhum membro encontrado*",
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

  public static async handleAutocomplete(
    interaction: AutocompleteInteraction
  ): Promise<void> {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== "clan-name") {
      await interaction.respond([]);
      return;
    }
    if (!focused.value.trim()) {
      await interaction.respond([]);
      return;
    }

    const clanMgmt = new MongoClanManagementRepository(() => {});
    const rows = await clanMgmt.findClansForSuperAdminAutocomplete(
      focused.value.trim(),
      CLAN_AUTOCOMPLETE_LIMIT
    );

    await interaction.respond(
      rows.map((r) => {
        let name = r.name;
        if (name.length > CLAN_AUTOCOMPLETE_NAME_MAX) {
          name = name.slice(0, CLAN_AUTOCOMPLETE_NAME_MAX - 1) + "…";
        }
        let value = r.name;
        if (value.length > CLAN_AUTOCOMPLETE_VALUE_MAX) {
          value = value.slice(0, CLAN_AUTOCOMPLETE_VALUE_MAX);
        }
        return { name, value };
      })
    );
  }
}
