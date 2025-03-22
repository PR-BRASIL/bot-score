import { Client, TextChannel, EmbedBuilder } from "discord.js";
import { Patent } from "../../domain/models/patent";
import { env } from "../../main/config/env";
import { mongoHelper } from "../../infra/db/mongodb/helpers/mongo-helper";

export class PatentsInfo {
  private messageId: string | null = null;

  public async displayPatentsInfo(client: Client): Promise<void> {
    const channel = client.channels.cache.get(
      env.patentsInfoChannelId
    ) as TextChannel;
    if (!channel) {
      console.log("Canal de patentes não encontrado.");
      return;
    }

    let message;
    if (this.messageId) {
      try {
        message = await channel.messages.fetch(this.messageId);
      } catch (error) {
        this.messageId = null;
      }
    }

    // Buscar todas as patentes no banco de dados
    const collection = await mongoHelper.getCollection("patents");
    const patents = await collection.find<Patent>({}).toArray();

    if (!patents || patents.length === 0) {
      console.log("Nenhuma patente encontrada.");
      return;
    }

    // Ordenar patentes por pontuação necessária (crescente)
    const sortedPatents = patents.sort((a, b) => a.score - b.score);

    // Criar a embed
    const embed = new EmbedBuilder()
      .setColor(0x1abc9c)
      .setAuthor({
        name: "Reality Brasil",
        iconURL: channel.guild.iconURL() || undefined,
      })
      .setTitle("🏆 Sistema de Patentes")
      .setDescription(
        "```diff\n+ Conheça todas as patentes disponíveis no Reality Brasil!\n+ Continue jogando para subir no ranking e alcançar patentes mais altas.\n```"
      )
      .setThumbnail("https://i.imgur.com/3ZQZQ9M.png")
      .setTimestamp()
      .setImage(
        "https://media.discordapp.net/attachments/1162222580644708372/1274439425354371072/Capa_GitBook.png?ex=67df05b4&is=67ddb434&hm=e7f9eb86c1d74c0e1de0414f3dab11023f0820ea8431edfe0812e5afe80de930&=&format=webp&quality=lossless"
      );

    // Agrupar patentes por tipo (se existir) ou adicionar todas em sequência
    const patentsByType = new Map<string, Patent[]>();

    for (const patent of sortedPatents) {
      const type = patent.type || "Padrão";
      if (!patentsByType.has(type)) {
        patentsByType.set(type, []);
      }
      patentsByType.get(type)!.push(patent);
    }

    // Adicionar cada grupo de patentes à embed
    for (const [type, typedPatents] of patentsByType.entries()) {
      // Criar uma string formatada com as patentes
      let patentsText = "";

      for (let i = 0; i < typedPatents.length; i++) {
        const patent = typedPatents[i];
        const nextPatent = typedPatents[i + 1];

        if (nextPatent) {
          patentsText += `**${
            patent.text
          }** - ${patent.score.toLocaleString()} a ${(
            nextPatent.score - 1
          ).toLocaleString()} pontos\n`;
        } else {
          patentsText += `**${
            patent.text
          }** - ${patent.score.toLocaleString()}+ pontos\n`;
        }
      }

      embed.addFields({
        name: `📈 Patentes ${type}`,
        value: `${patentsText}`,
        inline: false,
      });
    }

    // Adicionar campo com orientações
    embed.addFields({
      name: "🚀 Como subir de patente?",
      value:
        "```diff\n+ Jogue no servidor Reality Brasil\n+ Cada kill, assistência e objetivo concluído aumenta seu score\n+ Acompanhe seu progresso com /stats\n```",
      inline: false,
    });

    embed.setFooter({
      text: `Reality Brasil ・ Atualizado em ${new Date().toLocaleDateString(
        "pt-BR"
      )}`,
      iconURL: channel.guild.iconURL() || undefined,
    });

    // Enviar ou atualizar a mensagem
    if (message) {
      await message.edit({ embeds: [embed] });
      return;
    }

    const newMessage = await channel.send({ embeds: [embed] });
    this.messageId = newMessage.id;
  }
}
