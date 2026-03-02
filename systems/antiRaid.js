// systems/antiRaid.js
const logger = require("./logger");

const joinTimes = new Map(); // guildId -> [timestamps]

async function lockdownGuild(guild, client, reason) {
  const cfg = client.ctx.config;
  const current = client.ctx.lockdowns.get(guild.id);
  if (current?.active) return;

  client.ctx.lockdowns.set(guild.id, { active: true, since: Date.now(), reason });

  await logger.log(client, guild, `🔒 **LOCKDOWN ENABLED** | reason: **${reason}**`);

  // Apply @everyone send-message deny across all text channels
  const everyoneRole = guild.roles.everyone;
  const channels = guild.channels.cache.filter(
    (c) => c.isTextBased && c.isTextBased()
  );

  for (const [, ch] of channels) {
    try {
      await ch.permissionOverwrites.edit(everyoneRole, {
        SendMessages: false,
        AddReactions: false,
        CreatePublicThreads: false,
        CreatePrivateThreads: false,
        SendMessagesInThreads: false,
      }).catch(() => {});
    } catch {}
  }
}

module.exports = async function antiRaid(member) {
  const client = member.client;
  const cfg = client.ctx.config;

  const guildId = member.guild.id;
  const now = Date.now();

  const arr = joinTimes.get(guildId) || [];
  arr.push(now);
  const recent = arr.filter((t) => now - t <= cfg.RAID.windowMs);
  joinTimes.set(guildId, recent);

  // Log brand new accounts as signal (not auto-punish)
  const accountAge = now - member.user.createdTimestamp;
  if (accountAge < cfg.RAID.minAccountAgeMs) {
    await logger.log(
      client,
      member.guild,
      `🧾 **New account joined**: <@${member.id}> | account age: **${Math.round(accountAge / (60 * 60 * 1000))}h**`
    );
  }

  if (recent.length >= cfg.RAID.maxJoins) {
    await lockdownGuild(member.guild, client, `Raid join spike: ${recent.length} joins / ${cfg.RAID.windowMs / 1000}s`);
  }
};
