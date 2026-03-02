// systems/logger.js
module.exports = {
  async log(client, guild, message) {
    try {
      const { LOG_CHANNEL_ID } = client.ctx.config;
      if (!LOG_CHANNEL_ID || LOG_CHANNEL_ID.includes("PUT_")) return;

      const ch = guild.channels.cache.get(LOG_CHANNEL_ID);
      if (!ch) return;

      await ch.send(message);
    } catch (e) {
      // don't crash bot because of logging
      console.error("logger.log error:", e);
    }
  },
};
