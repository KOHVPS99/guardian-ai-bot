// systems/cooldowns.js
const cooldowns = new Map(); // key => timestamp

function keyFor(userId, commandName) {
  return `${userId}:${commandName}`;
}

function checkCooldown(userId, commandName, durationMs) {
  const key = keyFor(userId, commandName);
  const now = Date.now();
  const until = cooldowns.get(key);

  if (until && now < until) {
    return { ok: false, remainingMs: until - now };
  }

  cooldowns.set(key, now + durationMs);
  return { ok: true, remainingMs: 0 };
}

module.exports = { checkCooldown };
