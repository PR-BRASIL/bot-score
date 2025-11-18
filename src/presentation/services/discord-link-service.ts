import type { Collection, ObjectId } from "mongodb";
import { uid } from "uid";
import { mongoHelper } from "../../infra/db/mongodb/helpers/mongo-helper";
import type { User } from "../../domain/models/user";

type LinkStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "failed"
  | "player_not_found";

interface DiscordLinkRequest {
  _id?: ObjectId;
  requestId: string;
  discordUserId: string;
  playerName: string;
  status: LinkStatus;
  createdAt: Date;
  resolvedAt?: Date;
  reason?: string;
}

type LinkErrorType =
  | "PLAYER_NOT_FOUND"
  | "PLAYER_ALREADY_LINKED"
  | "DISCORD_ALREADY_LINKED"
  | "PENDING_REQUEST_EXISTS"
  | "REQUEST_NOT_FOUND"
  | "REQUEST_ALREADY_HANDLED"
  | "NOT_AUTHORIZED";

export class DiscordLinkError extends Error {
  public readonly type: LinkErrorType;

  public constructor(type: LinkErrorType, message: string) {
    super(message);
    this.type = type;
  }
}

class DiscordLinkService {
  private readonly LINK_COLLECTION = "discord_link_requests";
  private readonly USER_COLLECTION = "user";

  public async createLinkRequest(discordUserId: string, rawPlayerName: string) {
    const playerName = this.normalizePlayerName(rawPlayerName);
    if (!discordUserId || !playerName) {
      throw new DiscordLinkError(
        "PLAYER_NOT_FOUND",
        "Usuário ou jogador inválido."
      );
    }

    const usersCollection = await this.getUsersCollection();
    const linkCollection = await this.getLinkCollection();

    const player = await usersCollection.findOne<User>(
      {
        name: { $regex: new RegExp(`^${this.escapeRegExp(playerName)}$`, "i") },
      },
      { projection: { name: 1, discordUserId: 1 } }
    );

    if (!player) {
      throw new DiscordLinkError(
        "PLAYER_NOT_FOUND",
        "Jogador não foi encontrado."
      );
    }

    if (player.discordUserId && player.discordUserId !== discordUserId) {
      throw new DiscordLinkError(
        "PLAYER_ALREADY_LINKED",
        "Jogador já está vinculado a outro usuário."
      );
    }

    const existingDiscordLink = await usersCollection.findOne<User>({
      discordUserId,
    });

    if (existingDiscordLink && existingDiscordLink.name !== player.name) {
      throw new DiscordLinkError(
        "DISCORD_ALREADY_LINKED",
        `Você já está vinculado ao jogador ${existingDiscordLink.name}.`
      );
    }

    const pendingRequest = await linkCollection.findOne({
      discordUserId,
      playerName: player.name,
      status: "pending",
    });

    if (pendingRequest) {
      throw new DiscordLinkError(
        "PENDING_REQUEST_EXISTS",
        "Já existe uma solicitação pendente para este jogador."
      );
    }

    const request: DiscordLinkRequest = {
      requestId: uid(24),
      discordUserId,
      playerName: player.name,
      status: "pending",
      createdAt: new Date(),
    };

    await linkCollection.insertOne(request);

    return request;
  }

  public async confirmLinkRequest(
    requestId: string,
    discordUserId: string
  ): Promise<{ playerName: string }> {
    const linkCollection = await this.getLinkCollection();
    const usersCollection = await this.getUsersCollection();

    const request = await linkCollection.findOne<DiscordLinkRequest>({
      requestId,
    });

    if (!request) {
      throw new DiscordLinkError(
        "REQUEST_NOT_FOUND",
        "Solicitação não encontrada ou expirada."
      );
    }

    if (request.discordUserId !== discordUserId) {
      throw new DiscordLinkError(
        "NOT_AUTHORIZED",
        "Você não pode confirmar esta solicitação."
      );
    }

    if (request.status !== "pending") {
      throw new DiscordLinkError(
        "REQUEST_ALREADY_HANDLED",
        "Esta solicitação já foi processada."
      );
    }

    const player = await usersCollection.findOne<User>({
      name: request.playerName,
    });

    if (!player) {
      await linkCollection.updateOne(
        { requestId },
        {
          $set: {
            status: "player_not_found",
            resolvedAt: new Date(),
          },
        }
      );
      throw new DiscordLinkError(
        "PLAYER_NOT_FOUND",
        "Não encontramos o jogador informado."
      );
    }

    await usersCollection.updateOne(
      { _id: player._id },
      {
        $set: { discordUserId },
      }
    );

    await linkCollection.updateOne(
      { requestId },
      {
        $set: {
          status: "confirmed",
          resolvedAt: new Date(),
        },
      }
    );

    return { playerName: player.name };
  }

  public async cancelLinkRequest(
    requestId: string,
    discordUserId: string
  ): Promise<{ playerName: string }> {
    const linkCollection = await this.getLinkCollection();
    const request = await linkCollection.findOne<DiscordLinkRequest>({
      requestId,
    });

    if (!request) {
      throw new DiscordLinkError(
        "REQUEST_NOT_FOUND",
        "Solicitação não encontrada ou expirada."
      );
    }

    if (request.discordUserId !== discordUserId) {
      throw new DiscordLinkError(
        "NOT_AUTHORIZED",
        "Você não pode cancelar esta solicitação."
      );
    }

    if (request.status !== "pending") {
      throw new DiscordLinkError(
        "REQUEST_ALREADY_HANDLED",
        "Esta solicitação já foi processada."
      );
    }

    await linkCollection.updateOne(
      { requestId },
      {
        $set: {
          status: "cancelled",
          resolvedAt: new Date(),
        },
      }
    );

    return { playerName: request.playerName };
  }

  public async markRequestAsFailed(
    requestId: string,
    reason: string
  ): Promise<void> {
    const linkCollection = await this.getLinkCollection();
    await linkCollection.updateOne(
      { requestId },
      {
        $set: {
          status: "failed",
          resolvedAt: new Date(),
          reason,
        },
      }
    );
  }

  private normalizePlayerName(playerName: string): string {
    return decodeURIComponent(playerName || "").trim();
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private async getUsersCollection(): Promise<Collection<User>> {
    return mongoHelper.getCollection<User>(this.USER_COLLECTION);
  }

  private async getLinkCollection(): Promise<Collection<DiscordLinkRequest>> {
    return mongoHelper.getCollection<DiscordLinkRequest>(this.LINK_COLLECTION);
  }
}

export const discordLinkService = new DiscordLinkService();
