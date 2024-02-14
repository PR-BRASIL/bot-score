import type {
  GetUserInformation,
  GetUserInformationInput,
  GetUserInformationOutput,
} from "../../domain/usecase/get-user-information";
import type { GetUserInformationRepository } from "../protocols/get-user-information-repository";

export class DbGetUserInformation implements GetUserInformation {
  public constructor(
    private readonly getUserInformationRepository: GetUserInformationRepository
  ) {}

  public async get(
    data: GetUserInformationInput
  ): Promise<GetUserInformationOutput> {
    return this.getUserInformationRepository.get(data);
  }
}
