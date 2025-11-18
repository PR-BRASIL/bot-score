import type { ObjectId } from "mongodb";

export interface User {
  _id: string | ObjectId;
  name: string;
  ip: string;
  teamWorkScore: number;
  hash: string;
  kills: number;
  deaths: number;
  score: number;
  totalTime: number;
  rounds: number;
  updatedAt?: Date;
  discordUserId?: string;
}
