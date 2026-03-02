// systems/antiNuke.js
const { AuditLogEvent } = require("discord.js");
const { isWhitelisted } = require("./whitelist");
const logger = require("./logger");

const executorActions = new Map(); // key: guildId:executorId -> [timestamps]

function pushAction(guildId, executorId, windowMs) {
  const key = `${guildId}:${executorId}`;
  const now = Date.now();
  const arr = executorActions.get(key) || [];
  arr.push(now);
  const recent = arr.filter((t) => now - t <= windowMs);
  executorActions.set(key, recent);
  return recent.length;
}

async function lockdownGuild(guild, client, reason) {
  const current = client.ctx.lockdowns.get(guild.id);
  if (current?.active) return;

  client.ctx.lockdowns.set(guild.id, { active: true, since: Date.now(), reason });

  await logger.log(client, guild, `🔒 **LOCKDOWN ENABLED** | reason: **${reason}**`);

  const everyoneRole = guild.roles.everyone;
  const channels = guild.channels.cache.filter((c) => c.isTextBased && c.isTextBased());

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

async function tryTimeoutExecutor(guild, executorId, client, reason) {
  try {
    const member = await guild.members.fetch(executorId).catch(() => null);
    if (!member) return;
    const cfg = client.ctx.config;

    if (isWhitelisted(member, cfg)) return;

    if (member.moderatable) {
      await member.timeout(cfg.NUKE.timeoutMs, reason).catch(() => {});
      await logger.log(client, guild, `⛔ **Anti-Nuke**: timed out executor <@${executorId}> | reason: **${reason}**`);
    }
  } catch {}
}

async function getExecutorFromAuditLogs(guild, type) {
  try {
    const logs = await guild.fetchAuditLogs({ type, limit: 1 });
    const entry = logs.entries.first();
    if (!entry) return null;

    // Basic freshness check: audit entry must be very recent
    if (Date.now() - entry.createdTimestamp > 10_000) return null;

    return entry.executor?.id || null;
  } catch {
    return null;
  }
}

/**
 * actionName: string for logs
 * auditType: AuditLogEvent.*
 */
async function handleNukeAction(client, guild, actionName, auditType) {
  const cfg = client.ctx.config;

  const executorId = await getExecutorFromAuditLogs(guild, auditType);
  if (!executorId) {
    await logger.log(client, guild, `⚠️ **Anti-Nuke**: ${actionName} detected but executor not found in audit logs.`);
    return;
  }

  const count = pushAction(guild.id, executorId, cfg.NUKE.windowMs);

  await logger.log(
    client,
    guild,
    `🧨 **Anti-Nuke**: ${actionName} by <@${executorId}> | count: **${count}** in ${cfg.NUKE.windowMs / 1000}s`
  );

  if (count >= cfg.NUKE.maxActions) {
    await lockdownGuild(guild, client, `${actionName} spike by <@${executorId}> (${count} actions)`);
    await tryTimeoutExecutor(guild, executorId, client, `Nuke behavior: ${actionName}`);
  }
}

module.exports = {
  handleChannelCreate: (client, channel) =>
    handleNukeAction(client, channel.guild, "Channel created", AuditLogEvent.ChannelCreate),

  handleChannelDelete: (client, channel) =>
    handleNukeAction(client, channel.guild, "Channel deleted", AuditLogEvent.ChannelDelete),

  handleRoleCreate: (client, role) =>
    handleNukeAction(client, role.guild, "Role created", AuditLogEvent.RoleCreate),

  handleRoleDelete: (client, role) =>
    handleNukeAction(client, role.guild, "Role deleted", AuditLogEvent.RoleDelete),
};
