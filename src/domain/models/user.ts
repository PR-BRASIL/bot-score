export interface User {
  _id: string;
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
}
