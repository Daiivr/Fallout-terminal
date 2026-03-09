"use strict";

const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "..", ".env")
});

const { createDiscordIntelBot } = require("./discordIntelBot");

const configuredStorageDir = String(process.env.STORAGE_DIR || "").trim();
const storageDir = configuredStorageDir
  ? path.resolve(configuredStorageDir)
  : path.resolve(__dirname, "..", "storage");

const bot = createDiscordIntelBot({
  siteRoot: path.resolve(__dirname, "..", ".."),
  storageDir,
  publicBaseUrl: String(process.env.PUBLIC_BASE_URL || "").trim(),
  log: console
});

async function startBot() {
  if (!bot.isEnabled()) {
    console.error("[discord-bot] Bot worker is disabled. Set DISCORD_BOT_TOKEN and DISCORD_BOT_CLIENT_ID.");
    process.exit(1);
    return;
  }

  await bot.start();

  const shutdown = async (signal) => {
    console.log(`[discord-bot] ${signal} received, shutting down...`);
    try {
      await bot.stop();
      process.exit(0);
    } catch (error) {
      console.error("[discord-bot] Shutdown failed.");
      console.error(error);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

startBot().catch((error) => {
  console.error("[discord-bot] Startup failed.");
  console.error(error);
  process.exit(1);
});
