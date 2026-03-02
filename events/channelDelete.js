// events/channelDelete.js
const antiNuke = require("../systems/antiNuke");

module.exports = {
  name: "channelDelete",
  async execute(client, channel) {
    if (!channel.guild) return;
    await antiNuke.handleChannelDelete(client, channel);
  },
};
