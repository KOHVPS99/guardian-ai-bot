// systems/whitelist.js
function isWhitelisted(member, config) {
  if (!member) return false;
  if (config.WHITELIST_USERS?.includes(member.id)) return true;

  const roleIds = config.WHITELIST_ROLES || [];
  if (roleIds.length > 0 && member.roles?.cache) {
    for (const rid of roleIds) {
      if (member.roles.cache.has(rid)) return true;
    }
  }
  return false;
}

module.exports = { isWhitelisted };
