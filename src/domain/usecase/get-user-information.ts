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
  rounds: number;
  hash: string;
  updatedAt?: Date;
  discordUserId?: string;
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
  points: number;
  members: User[];
  /** Discord user IDs definidos como líderes do clã (comando /clan-admin). */
  leaderDiscordIds?: string[];
  /** Hashes de jogadores líderes (podem ainda não ter Discord vinculado). */
  leaderHashes?: string[];
}

export interface GetTopClans {
  getTopClans(limit: number): Promise<Clan[]>;
  getClanByName(clanName: string): Promise<Clan | null>;
  findSimilarClans(clanName: string, limit?: number): Promise<Clan[]>;
}
