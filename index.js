// index.js
require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits, Partials, REST, Routes, PermissionsBitField } = require("discord.js");
const OpenAI = require("openai");
const config = require("./config");

if (!process.env.DISCORD_TOKEN || !process.env.OPENAI_API_KEY || !process.env.CLIENT_ID) {
  console.error("❌ Missing env vars. Please set DISCORD_TOKEN, OPENAI_API_KEY, CLIENT_ID in .env");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();

// OpenAI client
client.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Shared systems context
client.ctx = {
  config,
  // global locks/state
  lockdowns: new Map(), // guildId -> { active: boolean, since: number, reason: string }
};

// ---- Load Commands ----
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"));

const slashData = [];
for (const file of commandFiles) {
  const cmd = require(path.join(commandsPath, file));
  if (!cmd?.data?.name || typeof cmd.execute !== "function") {
    console.warn(`⚠️ Skipping invalid command file: ${file}`);
    continue;
  }
  client.commands.set(cmd.data.name, cmd);
  slashData.push(cmd.data.toJSON());
}

// ---- Register Slash Commands (global) ----
async function registerSlashCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  try {
    console.log("🔁 Registering slash commands...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: slashData });
    console.log("✅ Slash commands registered.");
  } catch (err) {
    console.error("❌ Failed to register slash commands:", err);
  }
}

// ---- Load Events ----
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter((f) => f.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (!event?.name || typeof event.execute !== "function") {
    console.warn(`⚠️ Skipping invalid event file: ${file}`);
    continue;
  }

  if (event.once) {
    client.once(event.name, (...args) => event.execute(client, ...args));
  } else {
    client.on(event.name, (...args) => event.execute(client, ...args));
  }
}

client.on("error", (e) => console.error("Client error:", e));
client.on("warn", (w) => console.warn("Client warn:", w));

(async () => {
  await registerSlashCommands();
  await client.login(process.env.DISCORD_TOKEN);
})();
