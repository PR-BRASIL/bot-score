/* eslint-disable @typescript-eslint/no-magic-numbers */
import { config } from "dotenv";

config();

export const env = {
  token: process.env.TOKEN,
  port: process.env.PORT || 7070,
  apiUrl: process.env.API_URL || "http://localhost:8080",
  mongoUrl: process.env.MONGO_URL || "mongodb://0.0.0.0:27017/database",
  clientId: process.env.CLIENT_ID || "1207068522430205952",
  guildId: process.env.GUILD_ID || "1110388609074344017",
  topPlayersPodiumChannelId: process.env.TOP_PLAYERS_PODIUM_CHANNEL_ID,
  topClansPodiumChannelId: process.env.TOP_CLANS_PODIUM_CHANNEL_ID,
  patentsInfoChannelId: process.env.PATENTS_INFO_CHANNEL_ID,
  monthlyTopPlayersChannelId: process.env.MONTHLY_TOP_PLAYERS_CHANNEL_ID,
  monthlySeasonEndChannelId: process.env.MONTHLY_SEASON_END_CHANNEL_ID,
};
