"use strict";

const express = require("express");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "..", ".env")
});

const { createDiscordIntelBot } = require("./discordIntelBot");

const configuredStorageDir = String(process.env.STORAGE_DIR || "").trim();
const storageDir = configuredStorageDir
  ? path.resolve(configuredStorageDir)
  : path.resolve(__dirname, "..", "storage");
const BOT_ADMIN_API_TOKEN = String(process.env.BOT_ADMIN_API_TOKEN || "").trim();
const BOT_ADMIN_API_HOST = String(process.env.BOT_ADMIN_API_HOST || "127.0.0.1").trim() || "127.0.0.1";

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const BOT_ADMIN_API_PORT = parsePositiveInteger(process.env.BOT_ADMIN_API_PORT, 3101);

const bot = createDiscordIntelBot({
  siteRoot: path.resolve(__dirname, "..", ".."),
  storageDir,
  publicBaseUrl: String(process.env.PUBLIC_BASE_URL || "").trim(),
  log: console
});

function sendBotAdminApiError(res, error) {
  const status = Number.isFinite(Number(error?.status)) ? Number(error.status) : 500;
  res.status(status >= 400 && status < 600 ? status : 500).json({
    error: String(error?.message || "Bot admin request failed.")
  });
}

function startBotAdminApi() {
  if (!BOT_ADMIN_API_TOKEN) {
    console.warn("[discord-bot] BOT_ADMIN_API_TOKEN is not set. Bot admin API is disabled.");
    return null;
  }

  const app = express();
  app.disable("x-powered-by");
  app.use(express.json());
  app.use((req, res, next) => {
    const authHeader = String(req.headers.authorization || "").trim();
    const expectedHeader = `Bearer ${BOT_ADMIN_API_TOKEN}`;
    if (authHeader !== expectedHeader) {
      res.status(401).json({ error: "Bot admin token required." });
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      ready: bot.isReady()
    });
  });

  app.get("/admin/bot/overview", async (_req, res) => {
    try {
      const payload = await bot.getAdminSnapshot();
      res.json(payload);
    } catch (error) {
      sendBotAdminApiError(res, error);
    }
  });

  app.post("/admin/bot/commands/sync", async (_req, res) => {
    try {
      const payload = await bot.syncCommands();
      res.json(payload);
    } catch (error) {
      sendBotAdminApiError(res, error);
    }
  });

  app.post("/admin/bot/guilds/:guildId/welcome", async (req, res) => {
    try {
      const payload = await bot.sendWelcomeToGuild(req.params.guildId);
      res.json(payload);
    } catch (error) {
      sendBotAdminApiError(res, error);
    }
  });

  app.post("/admin/bot/guilds/:guildId/test-post", async (req, res) => {
    try {
      const payload = await bot.sendCurrentIntelToGuild(req.params.guildId);
      res.json(payload);
    } catch (error) {
      sendBotAdminApiError(res, error);
    }
  });

  app.post("/admin/bot/guilds/:guildId/leave", async (req, res) => {
    try {
      const payload = await bot.leaveGuild(req.params.guildId);
      res.json(payload);
    } catch (error) {
      sendBotAdminApiError(res, error);
    }
  });

  const server = app.listen(BOT_ADMIN_API_PORT, BOT_ADMIN_API_HOST, () => {
    console.log(`[discord-bot] Bot admin API listening on http://${BOT_ADMIN_API_HOST}:${BOT_ADMIN_API_PORT}`);
  });

  return server;
}

async function startBot() {
  if (!bot.isEnabled()) {
    console.error("[discord-bot] Bot worker is disabled. Set DISCORD_BOT_TOKEN and DISCORD_BOT_CLIENT_ID.");
    process.exit(1);
    return;
  }

  await bot.start();
  const adminServer = startBotAdminApi();

  const shutdown = async (signal) => {
    console.log(`[discord-bot] ${signal} received, shutting down...`);
    try {
      if (adminServer) {
        await new Promise((resolve, reject) => {
          adminServer.close((error) => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
        });
      }
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
