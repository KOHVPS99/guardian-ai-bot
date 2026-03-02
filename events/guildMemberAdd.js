// events/guildMemberAdd.js
const antiRaid = require("../systems/antiRaid");

module.exports = {
  name: "guildMemberAdd",
  async execute(client, member) {
    await antiRaid(member);
  },
};
