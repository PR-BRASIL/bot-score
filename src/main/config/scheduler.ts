import { Client } from "discord.js";
import cron from "node-cron";
import { TopPlayersPodium } from "../../presentation/events/top-players-podium";
import { TopClansPodium } from "../../presentation/events/top-clans-podium";
import { MonthlyTopPlayersPodium } from "../../presentation/events/monthly-top-players-podium";
import { MongoGetUserInformationRepository } from "../../infra/db/mongodb/repositories/get-user-information-repository";
import { env } from "./env";
import { mongoHelper } from "../../infra/db/mongodb/helpers/mongo-helper";
import { TextChannel, EmbedBuilder } from "discord.js";

export function scheduleTopPlayersPodium(client: Client): void {
  const getUserInformation = new MongoGetUserInformationRepository();
  const podium = new TopPlayersPodium(getUserInformation);

  const run = async () => {
    console.log("Updating top players podium...");
    try {
      await podium.updatePodium(client);
    } catch (err) {
      console.error("Failed to update top players podium", err);
    }
  };

  // Roda na inicialização e a cada 10 minutos
  void run();
  cron.schedule("*/10 * * * *", run);
}

export function scheduleTopClansPodium(client: Client): void {
  const getUserInformation = new MongoGetUserInformationRepository();
  const podium = new TopClansPodium(getUserInformation);

  // every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    console.log("Updating top clans podium...");
    await podium.updatePodium(client);
  });
}

export function scheduleMonthlyTopPlayers(client: Client): void {
  const monthly = new MonthlyTopPlayersPodium();

  // Atualiza o pódio mensal a cada 10 minutos */10 * * * *
  cron.schedule("*/10 * * * *", async () => {
    console.log("Updating monthly top players podium...");
    await monthly.updatePodium(client);
  });

  // Reset mensal: 06:00 do dia 1 de cada mês
  cron.schedule("0 6 1 * *", async () => {
    console.log("Monthly season reset: preparing season end announcement...");
    // Pega o mês anterior, já que o reset acontece no início do novo mês
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const seasonLabel = lastMonth.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });

    // Busca Top 3 antes de limpar a coleção
    let top3: Array<{ name: string; score: number }> = [];
    try {
      const collection = await mongoHelper.getCollection("monthly_user");
      const docs = await collection
        .find({})
        .sort({ score: -1 })
        .limit(3)
        .toArray();
      top3 = docs.map((d: any) => ({
        name: d.name,
        score: Number(d.score || 0),
      }));
    } catch (err) {
      console.error("Failed to read monthly_user for podium", err);
    }

    // Envia anúncio do fim da temporada com Top 3
    const channel = client.channels.cache.get(
      env.monthlySeasonEndChannelId as string,
    ) as TextChannel | undefined;
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setAuthor({
          name: "Reality Brasil",
          iconURL: channel.guild.iconURL() || undefined,
        })
        .setTitle(`🏁 Fim da Temporada Mensal — ${seasonLabel}`)
        .setDescription(
          "A temporada mensal foi encerrada e as pontuações foram resetadas.\n" +
            "Parabéns aos campeões! A nova temporada já começou — boa sorte!",
        )
        .setImage(
          "https://media.discordapp.net/attachments/1162222580644708372/1274439425354371072/Capa_GitBook.png?ex=67df05b4&is=67ddb434&hm=e7f9eb86c1d74c0e1de0414f3dab11023f0820ea8431edfe0812e5afe80de930&=&format=webp&quality=lossless",
        )
        .setTimestamp();

      if (top3.length > 0) {
        const [first, second, third] = top3;
        if (first) {
          embed.addFields({
            name: `<a:first:1353055748262989867> 1º — ${first.name}`,
            value: `> ⭐ **Pontos:** ${first.score.toLocaleString(
              "pt-BR",
            )}\n> ㅤ`,
            inline: true,
          });
        }
        if (second) {
          embed.addFields({
            name: `🥈 2º — ${second.name}`,
            value: `> ⭐ **Pontos:** ${second.score.toLocaleString(
              "pt-BR",
            )}\n> ㅤ`,
            inline: true,
          });
        }
        if (third) {
          embed.addFields({
            name: `🥉 3º — ${third.name}`,
            value: `> ⭐ **Pontos:** ${third.score.toLocaleString(
              "pt-BR",
            )}\n> ㅤ`,
            inline: true,
          });
        }
      }

      await channel.send({ embeds: [embed] });
    }

    console.log("Monthly season reset: clearing monthly_user collection...");
    try {
      const collection = await mongoHelper.getCollection("monthly_user");
      await collection.deleteMany({});
    } catch (err) {
      console.error("Failed to clear monthly_user collection", err);
    }

    // Reseta o messageId da instância ativa para que a próxima atualização crie uma nova mensagem
    monthly.resetMessageId();
    console.log("Monthly season reset completed. New season starts now!");
  });
}
