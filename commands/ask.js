const { SlashCommandBuilder } = require("discord.js");
const { checkCooldown } = require("../systems/cooldowns");
const { isFlagged } = require("../systems/moderation");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask the AI (family-friendly).")
    .addStringOption(opt =>
      opt.setName("question")
        .setDescription("What do you want to ask?")
        .setRequired(true)
    ),

  async execute(client, interaction) {
    const cfg = client.ctx.config;
    const question = interaction.options.getString("question", true);

    // IMMEDIATE defer (CRITICAL)
    await interaction.deferReply();

    try {
      const cd = checkCooldown(interaction.user.id, "ask", cfg.COOLDOWNS_MS.ask);
      if (!cd.ok) {
        return interaction.editReply(
          `⏳ Slow down. Try again in ${Math.ceil(cd.remainingMs / 1000)}s.`
        );
      }

      const mod = await isFlagged(client, question);
      if (mod.flagged) {
        return interaction.editReply("❌ That request is not allowed.");
      }

      const response = await client.openai.chat.completions.create({
        model: cfg.AI.chatModel,
        messages: [
          {
            role: "system",
            content: "You are a family-friendly Discord assistant. No NSFW content."
          },
          {
            role: "user",
            content: question
          }
        ],
        max_tokens: cfg.AI.maxTokens,
      });

      const text =
        response?.choices?.[0]?.message?.content || "No response.";

      await interaction.editReply(text.slice(0, 1900));

    } catch (err) {
      console.error("ASK ERROR:", err);
      await interaction.editReply("❌ AI error occurred.");
    }
  },
};
