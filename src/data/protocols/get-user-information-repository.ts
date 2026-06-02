export interface GetUserInformationRepositoryInput {
  nameOrHash: string;
}

export interface GetUserInformationRepositoryOutput {
  _id?: import("mongodb").ObjectId | string;
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

export interface GetUserInformationRepository {
  get: (
    data: GetUserInformationRepositoryInput
  ) => Promise<GetUserInformationRepositoryOutput>;
}
