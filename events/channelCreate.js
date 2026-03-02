// events/channelCreate.js
const antiNuke = require("../systems/antiNuke");

module.exports = {
  name: "channelCreate",
  async execute(client, channel) {
    if (!channel.guild) return;
    await antiNuke.handleChannelCreate(client, channel);
  },
};
