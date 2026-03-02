// commands/image.js
const { SlashCommandBuilder } = require("discord.js");
const { checkCooldown } = require("../systems/cooldowns");
const { isFlagged } = require("../systems/moderation");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("image")
    .setDescription("Generate a safe image (NO NSFW).")
    .addStringOption((opt) =>
      opt.setName("prompt").setDescription("Describe the image (safe only).").setRequired(true)
    ),

  async execute(client, interaction) {
    const cfg = client.ctx.config;
    const prompt = interaction.options.getString("prompt", true);

    // Block in NSFW channels
    if (interaction.channel?.nsfw) {
      return interaction.reply({
        content: "❌ Image generation is disabled in NSFW channels.",
        ephemeral: true,
      });
    }

    // Cooldown
    const cd = checkCooldown(interaction.user.id, "image", cfg.COOLDOWNS_MS.image);
    if (!cd.ok) {
      return interaction.reply({
        content: `⏳ Slow down. Try again in ${Math.ceil(cd.remainingMs / 1000)}s.`,
        ephemeral: true,
      });
    }

    // Moderate prompt
    const mod = await isFlagged(client, prompt);
    if (mod.flagged) {
      return interaction.reply({ content: "❌ That prompt is not allowed.", ephemeral: true });
    }

    await interaction.deferReply();

    // Add explicit SFW instruction inside prompt
    const safePrompt = `Family-friendly, SFW only. No nudity, no sexual content. Prompt: ${prompt}`;

    const result = await client.openai.images.generate({
      model: cfg.AI.imageModel,
      prompt: safePrompt,
      size: "1024x1024",
    });

    const b64 = result?.data?.[0]?.b64_json;
    if (!b64) {
      return interaction.editReply("❌ Failed to generate image.");
    }

    const buffer = Buffer.from(b64, "base64");
    await interaction.editReply({
      files: [{ attachment: buffer, name: "image.png" }],
    });
  },
};
