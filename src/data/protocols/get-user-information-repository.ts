export interface GetUserInformationRepositoryInput {
  nameOrHash: string;
}

export interface GetUserInformationRepositoryOutput {
  name: string;
  teamWorkScore: number;
  kills: number;
  deaths: number;
  score: number;
}

export interface GetUserInformationRepository {
  get: (
    data: GetUserInformationRepositoryInput
  ) => Promise<GetUserInformationRepositoryOutput>;
}