// systems/antiSpam.js
const { isWhitelisted } = require("./whitelist");
const logger = require("./logger");

const userMsgTimes = new Map();   // userId -> [timestamps]
const userLastMsgs = new Map();   // userId -> [{content, ts}, ...]

function countLinks(text) {
  return (text.match(/https?:\/\/\S+/gi) || []).length;
}
function countMentions(message) {
  const userMentions = message.mentions?.users?.size || 0;
  const roleMentions = message.mentions?.roles?.size || 0;
  const everyoneHere = message.mentions?.everyone ? 1 : 0;
  return userMentions + roleMentions + everyoneHere;
}

async function punish(message, reason, timeoutMs) {
  try { await message.delete().catch(() => {}); } catch {}

  if (!message.member?.moderatable) return;

  await message.member.timeout(timeoutMs, reason).catch(() => {});
  await logger.log(
    message.client,
    message.guild,
    `🚫 **Anti-Spam**: timed out <@${message.author.id}> for **${Math.round(timeoutMs / 1000)}s** | reason: **${reason}** | in <#${message.channel.id}>`
  );
}

module.exports = async function antiSpam(message) {
  const cfg = message.client.ctx.config;
  if (!message.guild || message.author.bot) return;
  if (!message.member) return;

  if (isWhitelisted(message.member, cfg)) return;

  const now = Date.now();
  const uid = message.author.id;

  // timestamps window
  const arr = userMsgTimes.get(uid) || [];
  arr.push(now);
  const recent = arr.filter((t) => now - t <= cfg.SPAM.windowMs);
  userMsgTimes.set(uid, recent);

  if (recent.length > cfg.SPAM.maxMsgs) {
    return punish(message, "Message flooding", cfg.SPAM.timeoutMs);
  }

  // repeated messages check
  const last = userLastMsgs.get(uid) || [];
  last.push({ content: message.content?.trim() || "", ts: now });
  const recentLast = last.filter((x) => now - x.ts <= cfg.SPAM.windowMs).slice(-8);
  userLastMsgs.set(uid, recentLast);

  const content = (message.content || "").trim().toLowerCase();
  if (content) {
    const repeats = recentLast.filter((x) => x.content.toLowerCase() === content).length;
    if (repeats >= cfg.SPAM.repeatMax) {
      return punish(message, "Repeated messages", cfg.SPAM.timeoutMs);
    }
  }

  // mentions
  const mentions = countMentions(message);
  if (mentions >= cfg.SPAM.mentionMax) {
    return punish(message, "Mention spam", cfg.SPAM.timeoutMs);
  }

  // links
  const links = countLinks(message.content || "");
  if (links >= cfg.SPAM.linkMax) {
    return punish(message, "Link spam", cfg.SPAM.timeoutMs);
  }
};
