// systems/moderation.js
async function isFlagged(client, text) {
  const cfg = client.ctx.config;
  if (!text || !text.trim()) return { flagged: false };

  try {
    const res = await client.openai.moderations.create({
      model: cfg.AI.moderationModel,
      input: text,
    });

    const flagged = Boolean(res?.results?.[0]?.flagged);
    return { flagged, raw: res?.results?.[0] };
  } catch (e) {
    // If moderation API fails, be safe-ish: do NOT hard-block everything.
    console.error("moderation error:", e);
    return { flagged: false, error: true };
  }
}

module.exports = { isFlagged };
