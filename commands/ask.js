// commands/ask.js
const { SlashCommandBuilder } = require("discord.js");
const { checkCooldown } = require("../systems/cooldowns");
const { isFlagged } = require("../systems/moderation");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask the AI (family-friendly).")
    .addStringOption((opt) =>
      opt.setName("question").setDescription("What do you want to ask?").setRequired(true)
    ),

  async execute(client, interaction) {
    const cfg = client.ctx.config;
    const question = interaction.options.getString("question", true);

    // Cooldown
    const cd = checkCooldown(interaction.user.id, "ask", cfg.COOLDOWNS_MS.ask);
    if (!cd.ok) {
      return interaction.reply({
        content: `⏳ Slow down. Try again in ${Math.ceil(cd.remainingMs / 1000)}s.`,
        ephemeral: true,
      });
    }

    // Moderate user prompt
    const mod = await isFlagged(client, question);
    if (mod.flagged) {
      return interaction.reply({ content: "❌ That request is not allowed.", ephemeral: true });
    }

    await interaction.deferReply();

    const system = [
      "You are a family-friendly Discord assistant.",
      "No NSFW, sexual, explicit, or adult content.",
      "Be helpful, short, and safe.",
    ].join(" ");

    const resp = await client.openai.chat.completions.create({
      model: cfg.AI.chatModel,
      messages: [
        { role: "system", content: system },
        { role: "user", content: question },
      ],
      max_tokens: cfg.AI.maxTokens,
    });

    const text = resp?.choices?.[0]?.message?.content?.trim() || "No response.";
    await interaction.editReply(text.slice(0, 1900));
  },
};
