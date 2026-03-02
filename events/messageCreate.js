// events/messageCreate.js
const antiSpam = require("../systems/antiSpam");
const { isFlagged } = require("../systems/moderation");
const { isWhitelisted } = require("../systems/whitelist");
const logger = require("../systems/logger");

module.exports = {
  name: "messageCreate",
  async execute(client, message) {
    if (!message.guild || message.author.bot) return;

    // Anti-spam first
    await antiSpam(message);

    // Content moderation (no NSFW / unsafe)
    const cfg = client.ctx.config;
    if (!message.member) return;
    if (isWhitelisted(message.member, cfg)) return;

    const text = message.content || "";
    if (!text.trim()) return;

    const mod = await isFlagged(client, text);
    if (mod.flagged) {
      await message.delete().catch(() => {});
      if (message.member.moderatable) {
        await message.member.timeout(cfg.SPAM.timeoutMs, "Inappropriate content").catch(() => {});
      }
      await logger.log(
        client,
        message.guild,
        `🧼 **Moderation**: deleted flagged message from <@${message.author.id}> in <#${message.channel.id}>`
      );
    }
  },
};
