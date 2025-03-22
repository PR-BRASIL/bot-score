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
  totalTime?: number;
}

export interface GetUserInformation {
  get(params: { nameOrHash: string }): Promise<GetUserInformationOutput | null>;
}

export interface GetTopPlayers {
  getTopPlayers(limit: number): Promise<User[]>;
}

export interface Clan {
  name: string;
  memberCount: number;
  totalScore: number;
  totalTeamWorkScore: number;
  totalKills: number;
  totalDeaths: number;
  totalTimeOnline: number;
  members: User[];
}

export interface GetTopClans {
  getTopClans(limit: number): Promise<Clan[]>;
}
