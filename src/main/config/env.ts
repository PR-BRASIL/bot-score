/* eslint-disable @typescript-eslint/no-magic-numbers */
import { config } from "dotenv";

config();

export const env = {
  token: process.env.TOKEN,
  port: process.env.PORT || 7070,
  apiUrl: process.env.API_URL || "http://localhost:8080",
  mongoUrl: process.env.MONGO_URL || "mongodb://0.0.0.0:27017/database",
  clientId: process.env.CLIENT_ID || "1207068522430205952",
};
