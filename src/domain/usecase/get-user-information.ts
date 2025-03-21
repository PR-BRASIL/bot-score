import { User } from "../models/user";

export interface GetUserInformationInput {
  nameOrHash: string;
}

export interface GetUserInformationOutput {
  name: string;
  teamWorkScore: number;
  kills: number;
  deaths: number;
  score: number;
  rank: number;
}

export interface GetUserInformation {
  get(params: { nameOrHash: string }): Promise<GetUserInformationOutput | null>;
}

export interface GetTopPlayers {
  getTopPlayers(limit: number): Promise<User[]>;
}
