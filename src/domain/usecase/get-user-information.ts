export interface GetUserInformationInput {
  nameOrHash: string;
}

export interface GetUserInformationOutput {
  name: string;
  teamWorkScore: number;
  kills: number;
  deaths: number;
  score: number;
}

export interface GetUserInformation {
  get: (data: GetUserInformationInput) => Promise<GetUserInformationOutput>;
}
