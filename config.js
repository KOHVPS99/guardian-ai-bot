// config.js
module.exports = {
  // Put your log channel ID here (create a #bot-logs channel and copy its ID)
  LOG_CHANNEL_ID: "PUT_LOG_CHANNEL_ID_HERE",

  // Whitelist (optional): user IDs or role IDs that bypass automod
  WHITELIST_USERS: [],
  WHITELIST_ROLES: [],

  COOLDOWNS_MS: {
    ask: 10_000,
    image: 20_000,
  },

  SPAM: {
    windowMs: 5_000,
    maxMsgs: 6,              // >6 msgs in 5 sec => timeout
    repeatMax: 3,            // repeating same msg 3+ times quickly => timeout
    mentionMax: 8,           // too many mentions => timeout
    linkMax: 4,              // too many links => timeout
    timeoutMs: 60_000,       // 1 min timeout
  },

  RAID: {
    windowMs: 10_000,
    maxJoins: 6,             // 6+ joins in 10 sec => lockdown
    minAccountAgeMs: 2 * 24 * 60 * 60 * 1000, // 2 days (used as signal in logs)
  },

  NUKE: {
    windowMs: 12_000,
    maxActions: 5,           // 5+ channel/role create/delete by same executor in 12 sec => nuke
    timeoutMs: 10 * 60_000,  // 10 min timeout for executor (if possible)
  },

  AI: {
    chatModel: "gpt-4o-mini",
    imageModel: "gpt-image-1",
    moderationModel: "omni-moderation-latest",
    maxTokens: 350,
  },
};
