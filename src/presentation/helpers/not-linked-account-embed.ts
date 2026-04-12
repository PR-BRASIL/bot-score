import { EmbedBuilder, type User } from "discord.js";

export function buildNotLinkedAccountEmbed(
  discordUser: User,
  footerText: string,
  afterLinkBenefit: string,
  guildIconUrl?: string | null
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle("❌ Conta não vinculada")
    .setDescription(
      "Para usar esta funcionalidade, você precisa vincular sua conta do Discord ao jogo."
    )
    .addFields({
      name: "📋 Como vincular sua conta",
      value:
        `1️⃣ Entre no servidor **Reality Brasil** no Project Reality\n` +
        `2️⃣ No chat do jogo, execute o comando:\n` +
        `   \`\`\`!link-discord ${discordUser.username}\`\`\`\n` +
        `3️⃣ Aguarde a confirmação de vinculação\n` +
        `4️⃣ Volte para o Discord e confirme a vinculação`,
      inline: false,
    })
    .addFields({
      name: "✨ Após vincular",
      value: afterLinkBenefit,
      inline: false,
    })
    .setFooter({
      text: footerText,
      iconURL: guildIconUrl || undefined,
    })
    .setTimestamp();
}
