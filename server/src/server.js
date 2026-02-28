"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");
const multer = require("multer");

require("dotenv").config({
  path: path.resolve(__dirname, "..", ".env")
});

const app = express();
app.set("trust proxy", 1);

const SITE_ROOT = path.resolve(__dirname, "..", "..");
const configuredStorageDir = String(process.env.STORAGE_DIR || "").trim();
const STORAGE_DIR = configuredStorageDir
  ? path.resolve(configuredStorageDir)
  : path.resolve(__dirname, "..", "storage");
const UPLOAD_DIR = path.join(STORAGE_DIR, "uploads");
const METADATA_PATH = path.join(STORAGE_DIR, "files-metadata.json");
const PORT = Number(process.env.PORT || 3000);
const NODE_ENV = String(process.env.NODE_ENV || "development").trim() || "development";
const SESSION_SECRET = String(process.env.SESSION_SECRET || "").trim() || "replace-me-in-production";
const DISCORD_CLIENT_ID = String(process.env.DISCORD_CLIENT_ID || "").trim();
const DISCORD_CLIENT_SECRET = String(process.env.DISCORD_CLIENT_SECRET || "").trim();
const DISCORD_REDIRECT_URI = String(process.env.DISCORD_REDIRECT_URI || "").trim();
const ADMIN_DISCORD_ID = String(process.env.ADMIN_DISCORD_ID || "271701484922601472").trim();
const SESSION_COOKIE_NAME = "fallout_codex_sid";

function parseDiscordIdList(raw) {
  return String(raw || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isDiscordId(value) {
  return /^\d{6,32}$/.test(String(value || ""));
}

const ALLOWED_DISCORD_IDS = new Set(
  parseDiscordIdList(process.env.ALLOWED_DISCORD_IDS).filter((id) => isDiscordId(id))
);
if (isDiscordId(ADMIN_DISCORD_ID)) {
  ALLOWED_DISCORD_IDS.add(ADMIN_DISCORD_ID);
}

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(METADATA_PATH)) {
  fs.writeFileSync(METADATA_PATH, "[]\n", "utf8");
}

function readMetadataStore() {
  try {
    const raw = fs.readFileSync(METADATA_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("[metadata] read error:", error);
    return [];
  }
}

function writeMetadataStore(entries) {
  const tempPath = `${METADATA_PATH}.tmp`;
  const payload = JSON.stringify(entries, null, 2);
  fs.writeFileSync(tempPath, `${payload}\n`, "utf8");
  fs.renameSync(tempPath, METADATA_PATH);
}

function sanitizeDisplayFilename(input) {
  const baseName = path.basename(String(input || ""));
  const cleaned = baseName
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "";
  }

  return cleaned.slice(0, 180);
}

function isValidOriginalFilename(input) {
  const raw = String(input || "");
  if (!raw.trim()) {
    return false;
  }
  if (raw.includes("\0")) {
    return false;
  }
  return Boolean(sanitizeDisplayFilename(raw));
}

function buildStoredFilename(originalName) {
  const safeOriginal = sanitizeDisplayFilename(originalName) || "file.bin";
  const extension = path.extname(safeOriginal).replace(/[^.\w-]/g, "").slice(0, 20).toLowerCase();
  const stem = path.basename(safeOriginal, extension).replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 40) || "file";
  const id = crypto.randomUUID();
  return `${Date.now()}-${id}-${stem}${extension}`;
}

function formatDiscordUsername(userPayload) {
  const globalName = String(userPayload?.global_name || "").trim();
  if (globalName) {
    return globalName;
  }

  const username = String(userPayload?.username || "").trim();
  const discriminator = String(userPayload?.discriminator || "").trim();
  if (username && discriminator && discriminator !== "0") {
    return `${username}#${discriminator}`;
  }
  return username || "UNKNOWN";
}

function getSessionUser(req) {
  const user = req.session?.user;
  if (!user || typeof user !== "object") {
    return null;
  }

  const discordId = String(user.discordId || "").trim();
  if (!isDiscordId(discordId)) {
    return null;
  }

  return {
    discordId,
    username: String(user.username || "").trim() || "UNKNOWN"
  };
}

function isAdmin(user) {
  return Boolean(user && user.discordId === ADMIN_DISCORD_ID);
}

function isAuthorized(user) {
  return Boolean(user && (isAdmin(user) || ALLOWED_DISCORD_IDS.has(user.discordId)));
}

function buildMePayload(req) {
  const user = getSessionUser(req);
  if (!user) {
    return {
      loggedIn: false,
      discordId: "",
      username: "",
      isAdmin: false,
      isAuthorized: false
    };
  }

  return {
    loggedIn: true,
    discordId: user.discordId,
    username: user.username,
    isAdmin: isAdmin(user),
    isAuthorized: isAuthorized(user)
  };
}

function requireAuthorized(req, res, next) {
  const user = getSessionUser(req);
  if (!isAuthorized(user)) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }
  req.currentUser = user;
  next();
}

function requireAdmin(req, res, next) {
  const user = getSessionUser(req);
  if (!isAdmin(user)) {
    res.status(403).json({ error: "Admin privileges required" });
    return;
  }
  req.currentUser = user;
  next();
}

function oauthConfigured() {
  return Boolean(DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET && DISCORD_REDIRECT_URI);
}

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, UPLOAD_DIR);
  },
  filename: (_req, file, callback) => {
    callback(null, buildStoredFilename(file.originalname));
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    files: 1
  }
});

function uploadSingleFile(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "File exceeds size limit" });
      return;
    }

    if (error instanceof multer.MulterError) {
      res.status(400).json({ error: "Invalid upload payload" });
      return;
    }

    res.status(500).json({ error: "Upload failed" });
  });
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  name: SESSION_COOKIE_NAME,
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.get("/api/me", (req, res) => {
  res.json(buildMePayload(req));
});

app.post("/auth/discord", (req, res) => {
  if (!oauthConfigured()) {
    res.status(500).json({ error: "Discord OAuth is not configured on the server." });
    return;
  }

  const oauthState = crypto.randomBytes(24).toString("hex");
  req.session.oauthState = oauthState;

  const query = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    response_type: "code",
    redirect_uri: DISCORD_REDIRECT_URI,
    scope: "identify",
    state: oauthState
  });
  const redirectUrl = `https://discord.com/oauth2/authorize?${query.toString()}`;

  req.session.save((error) => {
    if (error) {
      res.status(500).json({ error: "Unable to start OAuth session." });
      return;
    }
    res.redirect(redirectUrl);
  });
});

app.get("/auth/discord/callback", async (req, res) => {
  if (!oauthConfigured()) {
    res.redirect("/#files");
    return;
  }

  const code = String(req.query.code || "").trim();
  const returnedState = String(req.query.state || "").trim();
  const expectedState = String(req.session.oauthState || "").trim();
  delete req.session.oauthState;

  if (!code || !returnedState || returnedState !== expectedState) {
    res.redirect("/#files");
    return;
  }

  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: DISCORD_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Discord token exchange failed (${tokenResponse.status})`);
    }

    const tokenPayload = await tokenResponse.json();
    const accessToken = String(tokenPayload.access_token || "");
    if (!accessToken) {
      throw new Error("Missing Discord access token");
    }

    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    if (!userResponse.ok) {
      throw new Error(`Discord identity fetch failed (${userResponse.status})`);
    }

    const userPayload = await userResponse.json();
    const discordId = String(userPayload.id || "").trim();
    if (!isDiscordId(discordId)) {
      throw new Error("Invalid Discord user ID received");
    }

    req.session.user = {
      discordId,
      username: formatDiscordUsername(userPayload)
    };

    req.session.save((error) => {
      if (error) {
        res.redirect("/#files");
        return;
      }
      res.redirect("/#files");
    });
  } catch (error) {
    console.error("[oauth] callback error:", error);
    res.redirect("/#files");
  }
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      res.status(500).json({ error: "Unable to clear session" });
      return;
    }
    res.clearCookie(SESSION_COOKIE_NAME);
    res.json({ ok: true });
  });
});

app.get("/api/files", requireAuthorized, (_req, res) => {
  const files = readMetadataStore()
    .sort((a, b) => String(b.uploadedAt || "").localeCompare(String(a.uploadedAt || "")))
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      mimeType: entry.mimeType,
      size: Number(entry.size) || 0,
      uploadedAt: entry.uploadedAt,
      description: entry.description || "",
      uploader: entry.uploader || entry.uploaderDiscordId || ""
    }));

  res.json({ files });
});

app.post("/api/files/upload", requireAdmin, uploadSingleFile, (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const uploadPath = req.file.path;
  const originalName = String(req.file.originalname || "");
  const safeOriginalName = sanitizeDisplayFilename(originalName);
  const description = String(req.body.description || "").trim().slice(0, 500);

  if (!isValidOriginalFilename(originalName) || !safeOriginalName) {
    if (uploadPath) {
      fs.unlink(uploadPath, () => {});
    }
    res.status(400).json({ error: "Invalid filename" });
    return;
  }

  if (!Number.isFinite(req.file.size) || req.file.size <= 0) {
    if (uploadPath) {
      fs.unlink(uploadPath, () => {});
    }
    res.status(400).json({ error: "Empty uploads are not allowed" });
    return;
  }

  const uploadId = crypto.randomUUID();
  const now = new Date().toISOString();
  const user = req.currentUser;

  const entry = {
    id: uploadId,
    storedName: req.file.filename,
    name: safeOriginalName,
    mimeType: String(req.file.mimetype || "application/octet-stream"),
    size: req.file.size,
    description,
    uploadedAt: now,
    uploaderDiscordId: user.discordId,
    uploader: user.username
  };

  try {
    const entries = readMetadataStore();
    entries.push(entry);
    writeMetadataStore(entries);
  } catch (error) {
    if (uploadPath) {
      fs.unlink(uploadPath, () => {});
    }
    console.error("[files] metadata write error:", error);
    res.status(500).json({ error: "Unable to store file metadata" });
    return;
  }

  res.status(201).json({
    ok: true,
    file: {
      id: entry.id,
      name: entry.name,
      mimeType: entry.mimeType,
      size: entry.size,
      uploadedAt: entry.uploadedAt,
      description: entry.description,
      uploader: entry.uploader
    }
  });
});

app.delete("/api/files/:id", requireAdmin, (req, res) => {
  const fileId = String(req.params.id || "").trim();
  if (!/^[a-f0-9-]{36}$/i.test(fileId)) {
    res.status(400).json({ error: "Invalid file id" });
    return;
  }

  const entries = readMetadataStore();
  const index = entries.findIndex((entry) => entry.id === fileId);
  if (index < 0) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  const [entry] = entries.splice(index, 1);
  writeMetadataStore(entries);

  const storedPath = path.resolve(UPLOAD_DIR, String(entry.storedName || ""));
  if (storedPath.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) {
    fs.unlink(storedPath, () => {});
  }

  res.json({ ok: true });
});

app.get("/api/files/:id/download", requireAuthorized, (req, res) => {
  const fileId = String(req.params.id || "").trim();
  if (!/^[a-f0-9-]{36}$/i.test(fileId)) {
    res.status(400).json({ error: "Invalid file id" });
    return;
  }

  const entry = readMetadataStore().find((item) => item.id === fileId);
  if (!entry) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  const storedPath = path.resolve(UPLOAD_DIR, String(entry.storedName || ""));
  const uploadsRoot = path.resolve(UPLOAD_DIR) + path.sep;
  if (!storedPath.startsWith(uploadsRoot)) {
    res.status(400).json({ error: "Invalid storage path" });
    return;
  }

  if (!fs.existsSync(storedPath)) {
    res.status(404).json({ error: "File blob not found" });
    return;
  }

  res.setHeader("Cache-Control", "no-store");
  res.type(entry.mimeType || "application/octet-stream");
  res.download(storedPath, entry.name);
});

app.use(express.static(SITE_ROOT));

app.get("/", (_req, res) => {
  res.sendFile(path.join(SITE_ROOT, "index.html"));
});

app.listen(PORT, () => {
  console.log(`[server] Fallout Codex listening on http://localhost:${PORT}`);
  console.log(`[server] Static root: ${SITE_ROOT}`);
  console.log(`[server] Storage directory: ${STORAGE_DIR}`);
  console.log(`[server] Metadata file: ${METADATA_PATH}`);
  console.log("[session] Store: MemoryStore");
  if (!oauthConfigured()) {
    console.warn("[server] Discord OAuth env vars missing: DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI");
  }
  if (SESSION_SECRET === "replace-me-in-production") {
    console.warn("[server] SESSION_SECRET is using the default fallback. Set SESSION_SECRET in production.");
  }
});
