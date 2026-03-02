// events/roleDelete.js
const antiNuke = require("../systems/antiNuke");

module.exports = {
  name: "roleDelete",
  async execute(client, role) {
    if (!role.guild) return;
    await antiNuke.handleRoleDelete(client, role);
  },
};
