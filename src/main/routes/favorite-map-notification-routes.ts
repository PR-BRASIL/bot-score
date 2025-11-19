import type { Application, Request, Response } from "express";
import { Router } from "express";
import { EmbedBuilder } from "discord.js";
import type { ClientWithCommands } from "../config/app";
import { mongoHelper } from "../../infra/db/mongodb/helpers/mongo-helper";
import type { User } from "../../domain/models/user";
import { logger } from "../../utils/logger";

const isClientReady = (client: ClientWithCommands) =>
  typeof (client as ClientWithCommands & { isReady?: () => boolean })
    .isReady === "function"
    ? client.isReady()
    : Boolean(client.readyAt);

export const registerFavoriteMapNotificationRoutes = (
  app: Application,
  client: ClientWithCommands
) => {
  const router = Router();

  router.post(
    "/api/favorite-map/notify",
    async (req: Request, res: Response) => {
      const { name, mode, author } = req.body;

      if (!name || !mode) {
        return res.status(400).json({
          message: "Parâmetros obrigatórios: name e mode",
        });
      }

      if (!isClientReady(client)) {
        return res
          .status(503)
          .json({ message: "Cliente do Discord ainda não está pronto." });
      }

      try {
        const userCollection = await mongoHelper.getCollection<User>("user");

        // Buscar todos os usuários que têm esse mapa favorito
        const usersWithFavoriteMap = await userCollection
          .find({
            discordUserId: { $exists: true, $ne: null },
            favoriteMaps: {
              $elemMatch: {
                name: name,
                mode: mode,
              },
            },
          })
          .toArray();

        if (usersWithFavoriteMap.length === 0) {
          return res.status(200).json({
            message: "Nenhum usuário encontrado com esse mapa favorito.",
            notified: 0,
          });
        }

        let notifiedCount = 0;
        let failedCount = 0;

        // Criar embed de notificação
        const embed = new EmbedBuilder()
          .setColor(0x1abc9c)
          .setTitle("🎮 Mapa Favorito em Jogo!")
          .setDescription(
            `O mapa **${name}** (${mode}) foi setado para ser o proximo mapa!`
          )
          .addFields({
            name: "📋 Detalhes",
            value: `**Mapa:** ${name}\n**Modo:** ${mode}`,
            inline: false,
          })
          .setFooter({
            text: "Reality Brasil • Notificação de Mapas Favoritos",
          })
          .setTimestamp();

        // Adicionar author se fornecido
        if (author) {
          embed.setAuthor({
            name: author,
          });
        }

        // Enviar notificação para cada usuário
        for (const user of usersWithFavoriteMap) {
          if (!user.discordUserId) continue;

          try {
            const discordUser = await client.users.fetch(user.discordUserId);
            await discordUser.send({
              content: `🎯 <@${user.discordUserId}>, um dos seus mapas favoritos está rodando!`,
              embeds: [embed],
            });
            notifiedCount++;
          } catch (error) {
            failedCount++;
            logger.warn(
              `Não foi possível enviar notificação para o usuário ${user.discordUserId}`,
              error
            );
          }
        }

        return res.status(200).json({
          message: "Notificações enviadas com sucesso.",
          notified: notifiedCount,
          failed: failedCount,
          total: usersWithFavoriteMap.length,
        });
      } catch (error) {
        logger.error("Erro ao enviar notificações de mapa favorito:", error);
        return res.status(500).json({
          message: "Erro inesperado ao enviar notificações.",
        });
      }
    }
  );

  app.use(router);
};
