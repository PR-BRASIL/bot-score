import type { Application, Request, Response } from "express";
import { Router } from "express";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type User as DiscordUser,
} from "discord.js";
import type { ClientWithCommands } from "../config/app";
import { env } from "../config/env";
import {
  DiscordLinkError,
  discordLinkService,
} from "../../presentation/services/discord-link-service";
import { logger } from "../../utils/logger";

const buildComponents = (requestId: string) =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`discord-link:confirm:${requestId}`)
      .setLabel("Confirmar")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`discord-link:cancel:${requestId}`)
      .setLabel("Cancelar")
      .setStyle(ButtonStyle.Secondary)
  );

const buildEmbed = (playerName: string, requestId: string) =>
  new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("Confirme o vínculo com seu jogador")
    .setDescription(
      [
        `Jogador solicitado: **${playerName}**`,
        "",
        "Clique em **Confirmar** para vincular este jogador à sua conta do Discord.",
        "Caso não tenha sido você, clique em **Cancelar**.",
      ].join("\n")
    )
    .setFooter({ text: `ID da solicitação: ${requestId}` });

const isClientReady = (client: ClientWithCommands) =>
  typeof (client as ClientWithCommands & { isReady?: () => boolean })
    .isReady === "function"
    ? client.isReady()
    : Boolean(client.readyAt);

const normalizeDiscordHandle = (handle: string) =>
  handle.replace(/^@/, "").trim().toLowerCase();

const getComparableHandles = (user: DiscordUser) => {
  const handles = [
    user.username,
    user.tag,
    user.globalName ?? undefined,
    user.discriminator && user.discriminator !== "0"
      ? `${user.username}#${user.discriminator}`
      : undefined,
  ];

  return handles
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());
};

const matchesDiscordHandle = (user: DiscordUser, normalizedHandle: string) =>
  getComparableHandles(user).some(
    (candidate) => candidate === normalizedHandle
  );

const parseMention = (value: string) => {
  const match = value.match(/^<@!?(\d+)>$/);
  return match?.[1];
};

const isSnowflake = (value: string) => /^\d{17,20}$/.test(value);

const resolveDiscordUser = async (
  client: ClientWithCommands,
  handle: string
): Promise<DiscordUser | null> => {
  const trimmedHandle = handle?.trim();
  if (!trimmedHandle) {
    return null;
  }

  const mentionId = parseMention(trimmedHandle);
  if (mentionId) {
    try {
      return await client.users.fetch(mentionId);
    } catch (error) {
      logger.warn("Não foi possível buscar usuário pelo mention informado.", {
        mentionId,
        error,
      });
    }
  }

  if (isSnowflake(trimmedHandle)) {
    try {
      return await client.users.fetch(trimmedHandle);
    } catch {
      // continua tentando por nome
    }
  }

  const normalizedHandle = normalizeDiscordHandle(trimmedHandle);
  if (!normalizedHandle) {
    return null;
  }

  const cachedMatch = client.users.cache.find((user) =>
    matchesDiscordHandle(user, normalizedHandle)
  );
  if (cachedMatch) {
    return cachedMatch;
  }

  if (!env.guildId) {
    return null;
  }

  try {
    const guild =
      client.guilds.cache.get(env.guildId) ||
      (await client.guilds.fetch(env.guildId));

    const members = await guild.members.search({
      query: trimmedHandle.slice(0, 32),
      limit: 25,
    });

    const memberMatch =
      members.find((member) =>
        matchesDiscordHandle(member.user, normalizedHandle)
      ) ||
      members.find(
        (member) => member.displayName.toLowerCase() === normalizedHandle
      );

    return memberMatch?.user ?? null;
  } catch (error) {
    logger.error("Erro ao procurar usuário por nome no Discord.", error);
    return null;
  }
};

export const registerDiscordLinkRoutes = (
  app: Application,
  client: ClientWithCommands
) => {
  const router = Router();

  router.get(
    "/api/discord/link/:discordUsername/:playerName",
    async (req: Request, res: Response) => {
      const discordUsername = req.params.discordUsername?.trim();
      const playerName = req.params.playerName;

      if (!discordUsername || !playerName) {
        return res.status(400).json({
          message: "discordUsername e playerName são obrigatórios.",
        });
      }

      if (!isClientReady(client)) {
        return res
          .status(503)
          .json({ message: "Cliente do Discord ainda não está pronto." });
      }

      try {
        const discordUser = await resolveDiscordUser(client, discordUsername);

        if (!discordUser) {
          return res.status(404).json({
            message:
              "Não foi possível localizar o usuário no Discord. Verifique o nome informado.",
          });
        }

        const request = await discordLinkService.createLinkRequest(
          discordUser.id,
          playerName
        );

        try {
          await discordUser.send({
            content: `Olá <@${discordUser.id}>, recebemos um pedido para vincular sua conta ao jogador **${request.playerName}**.`,
            embeds: [buildEmbed(request.playerName, request.requestId)],
            components: [buildComponents(request.requestId)],
          });
        } catch (error) {
          await discordLinkService.markRequestAsFailed(
            request.requestId,
            "Não foi possível enviar DM."
          );
          logger.error(error);
          return res.status(502).json({
            message:
              "Não foi possível enviar a mensagem direta. Verifique se você permite DMs do servidor.",
          });
        }

        return res.status(200).json({
          message:
            "Solicitação enviada via DM. Confirme para concluir o vínculo.",
          requestId: request.requestId,
        });
      } catch (error) {
        if (error instanceof DiscordLinkError) {
          switch (error.type) {
            case "PLAYER_NOT_FOUND":
              return res.status(404).json({ message: error.message });
            case "PLAYER_ALREADY_LINKED":
            case "DISCORD_ALREADY_LINKED":
            case "PENDING_REQUEST_EXISTS":
              return res.status(409).json({ message: error.message });
            default:
              return res.status(400).json({ message: error.message });
          }
        }

        logger.error(error);
        return res
          .status(500)
          .json({ message: "Erro inesperado ao criar a solicitação." });
      }
    }
  );

  router.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use(router);
};
