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

  // every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    console.log("Updating top players podium...");
    await podium.updatePodium(client);
  });
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
  cron.schedule("*/10 * * * * *", async () => {
    console.log("Updating monthly top players podium...");
    await monthly.updatePodium(client);
  });

  // Reset mensal: 00:00 do dia 1 de cada mês
  cron.schedule("0 0 1 * *", async () => {
    console.log("Monthly season reset: dropping monthly_user collection...");
    try {
      const collection = await mongoHelper.getCollection("monthly_user");
      await collection.deleteMany({});
    } catch (err) {
      console.error("Failed to clear monthly_user collection", err);
    }

    // Envia anúncio do fim da temporada
    const channel = client.channels.cache.get(
      env.monthlySeasonEndChannelId as string
    ) as TextChannel | undefined;
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setAuthor({
          name: "Reality Brasil",
          iconURL: channel.guild.iconURL() || undefined,
        })
        .setTitle("🏁 Fim da Temporada Mensal")
        .setDescription(
          "A temporada mensal foi encerrada e as pontuações foram resetadas.\n" +
            "Boa sorte a todos na nova temporada!"
        )
        .setTimestamp();
      await channel.send({ embeds: [embed] });
    }
  });
}
