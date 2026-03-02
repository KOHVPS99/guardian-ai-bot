// events/roleCreate.js
const antiNuke = require("../systems/antiNuke");

module.exports = {
  name: "roleCreate",
  async execute(client, role) {
    if (!role.guild) return;
    await antiNuke.handleRoleCreate(client, role);
  },
};
