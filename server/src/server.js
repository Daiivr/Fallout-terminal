"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");
const { createClient } = require("redis");
const { RedisStore } = require("connect-redis");
const multer = require("multer");
const nodemailer = require("nodemailer");
const { fetchMinervaIntel, fetchSiloIntel } = require("./intel");

const app = express();
app.set("trust proxy", 1);

const SITE_ROOT = path.resolve(__dirname, "..", "..");
const INDEX_PAGE = path.join(SITE_ROOT, "index.html");
const NOT_FOUND_PAGE = path.join(SITE_ROOT, "404.html");
const configuredStorageDir = String(process.env.STORAGE_DIR || "").trim();
const STORAGE_DIR = configuredStorageDir
  ? path.resolve(configuredStorageDir)
  : path.resolve(__dirname, "..", "storage");
const UPLOAD_DIR = path.join(STORAGE_DIR, "uploads");
const TEMP_SHARE_UPLOAD_DIR = path.join(STORAGE_DIR, "temp-share-uploads");
const METADATA_PATH = path.join(STORAGE_DIR, "files-metadata.json");
const TEMP_SHARES_PATH = path.join(STORAGE_DIR, "temp-shares.json");
const EXHAUSTED_SLUGS_PATH = path.join(STORAGE_DIR, "exhausted-slugs.json");
const ACCESS_REQUESTS_PATH = path.join(STORAGE_DIR, "access-requests.json");
const VISIT_COUNTER_PATH = path.join(STORAGE_DIR, "visit-counter.json");
const PORT = Number(process.env.PORT || 3000);
const NODE_ENV = String(process.env.NODE_ENV || "development").trim() || "development";
const SESSION_SECRET = String(process.env.SESSION_SECRET || "").trim() || "replace-me-in-production";
const DISCORD_CLIENT_ID = String(process.env.DISCORD_CLIENT_ID || "").trim();
const DISCORD_CLIENT_SECRET = String(process.env.DISCORD_CLIENT_SECRET || "").trim();
const DISCORD_REDIRECT_URI = String(process.env.DISCORD_REDIRECT_URI || "").trim();
const ADMIN_DISCORD_ID = String(process.env.ADMIN_DISCORD_ID || "271701484922601472").trim();
const SESSION_COOKIE_NAME = "fallout_codex_sid";
const REDIS_URL = String(process.env.REDIS_URL || "").trim();
const SESSION_REDIS_PREFIX = String(process.env.SESSION_REDIS_PREFIX || "fallout_codex:sess:").trim() || "fallout_codex:sess:";
const SESSION_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;
const DEFAULT_SESSION_TTL_SECONDS = Math.floor(SESSION_COOKIE_MAX_AGE_MS / 1000);
const DISCORD_EPOCH_MS = 1420070400000;
const ACCESS_REQUEST_EMAIL_TO = String(process.env.ACCESS_REQUEST_EMAIL_TO || "dai@daivr.dev").trim() || "dai@daivr.dev";
const SMTP_HOST = String(process.env.SMTP_HOST || "").trim();
const SMTP_PORT_RAW = String(process.env.SMTP_PORT || "").trim();
const SMTP_SECURE_RAW = String(process.env.SMTP_SECURE || "").trim();
const SMTP_USER = String(process.env.SMTP_USER || "").trim();
const SMTP_PASS = String(process.env.SMTP_PASS || "").trim();
const SMTP_FROM = String(process.env.SMTP_FROM || "").trim();
const SMTP_TLS_REJECT_UNAUTHORIZED_RAW = String(process.env.SMTP_TLS_REJECT_UNAUTHORIZED || "").trim();
const ACCESS_REQUEST_COOLDOWN_MS_RAW = String(process.env.ACCESS_REQUEST_COOLDOWN_MS || "").trim();
const ACCESS_REQUEST_DECISION_TTL_MS_RAW = String(process.env.ACCESS_REQUEST_DECISION_TTL_MS || "").trim();
const ACCESS_REQUEST_REAPPLY_COOLDOWN_MS_RAW = String(process.env.ACCESS_REQUEST_REAPPLY_COOLDOWN_MS || "").trim();
const ACCESS_REQUEST_TOKEN_SECRET = String(process.env.ACCESS_REQUEST_TOKEN_SECRET || "").trim() || SESSION_SECRET;
const PUBLIC_BASE_URL = String(process.env.PUBLIC_BASE_URL || "").trim();
const BOT_INVITE_LINK = String(process.env.BOT_INVITE_LINK || "").trim();
const BOT_ADMIN_API_URL_RAW = String(process.env.BOT_ADMIN_API_URL || "").trim();
const BOT_ADMIN_API_HOST = String(process.env.BOT_ADMIN_API_HOST || "127.0.0.1").trim() || "127.0.0.1";
const BOT_ADMIN_API_PORT_RAW = String(process.env.BOT_ADMIN_API_PORT || "").trim();
const BOT_ADMIN_API_TOKEN = String(process.env.BOT_ADMIN_API_TOKEN || "").trim();
const TEMP_SHARE_MAX_FILE_BYTES_RAW = String(process.env.TEMP_SHARE_MAX_FILE_BYTES || "").trim();
const TEMP_SHARE_RETENTION_MAX_HOURS_RAW = String(process.env.TEMP_SHARE_RETENTION_MAX_HOURS || "").trim();
const TEMP_SHARE_TEXT_PREVIEW_MAX_BYTES_RAW = String(process.env.TEMP_SHARE_TEXT_PREVIEW_MAX_BYTES || "").trim();
const TEMP_SHARE_VT_TICK_MS_RAW = String(process.env.TEMP_SHARE_VT_TICK_MS || "").trim();
const TEMP_SHARE_CLEANUP_INTERVAL_MS_RAW = String(process.env.TEMP_SHARE_CLEANUP_INTERVAL_MS || "").trim();
const VT_API_KEY = String(process.env.VT_API_KEY || process.env.VIRUSTOTAL_API_KEY || "").trim();
const ACCESS_REQUEST_MAX_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;
const DEFAULT_AUTH_RETURN_TO = "/#files";
const DEFAULT_SHARE_PREVIEW_IMAGE_PATH = "/assets/images/image.png";
const FILE_SHARE_ROUTE_PREFIX = "/share/";
const FILE_SHARE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FILE_SHARE_META_MAX_CHARS = 260;
const FILE_SHARE_META_SUMMARY_MAX_CHARS = 120;
const FILE_SHARE_META_EXCERPT_MAX_CHARS = 150;
const TEMP_SHARE_ROUTE_PREFIX = "/drops/";
const TEMP_SHARE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TEMP_SHARE_VIRUS_STATUS = Object.freeze({
  UNAVAILABLE: "unavailable",
  QUEUED: "queued",
  PENDING: "pending",
  CLEAN: "clean",
  FLAGGED: "flagged",
  ERROR: "error",
  SKIPPED: "skipped"
});
const VT_API_BASE_URL = "https://www.virustotal.com/api/v3";
const INDEX_HTML_TEMPLATE = fs.readFileSync(INDEX_PAGE, "utf8");

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function parseOptionalPositiveInteger(value, fallback = 0) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return fallback;
  }
  return parsePositiveInteger(normalized, fallback);
}

function parseBoolean(value, fallback = false) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }
  if (normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on") {
    return true;
  }
  if (normalized === "0" || normalized === "false" || normalized === "no" || normalized === "off") {
    return false;
  }
  return fallback;
}

function sanitizeHttpBaseUrl(raw) {
  const normalized = String(raw || "").trim().replace(/\/+$/, "");
  if (!normalized) {
    return "";
  }
  return /^https?:\/\//i.test(normalized) ? normalized : "";
}

function sanitizeAuthReturnTo(raw, fallback = DEFAULT_AUTH_RETURN_TO) {
  const value = String(raw || "").trim();
  if (!value) {
    return fallback;
  }

  try {
    const parsed = new URL(value, "http://fallout-codex.local");
    if (parsed.origin !== "http://fallout-codex.local") {
      return fallback;
    }

    const pathname = String(parsed.pathname || "").trim();
    if (!pathname || !pathname.startsWith("/") || pathname.startsWith("//")) {
      return fallback;
    }

    return `${pathname}${parsed.search}${parsed.hash}` || fallback;
  } catch {
    return fallback;
  }
}

const SESSION_TTL_SECONDS = parsePositiveInteger(process.env.SESSION_TTL_SECONDS, DEFAULT_SESSION_TTL_SECONDS);
const SMTP_PORT = parsePositiveInteger(SMTP_PORT_RAW, 587);
const SMTP_SECURE = parseBoolean(SMTP_SECURE_RAW, SMTP_PORT === 465);
const SMTP_TLS_REJECT_UNAUTHORIZED = parseBoolean(SMTP_TLS_REJECT_UNAUTHORIZED_RAW, true);
const BOT_ADMIN_API_PORT = parsePositiveInteger(BOT_ADMIN_API_PORT_RAW, 3101);
const BOT_ADMIN_API_URL = sanitizeHttpBaseUrl(BOT_ADMIN_API_URL_RAW)
  || (BOT_ADMIN_API_TOKEN ? `http://${BOT_ADMIN_API_HOST}:${BOT_ADMIN_API_PORT}` : "");
const ACCESS_REQUEST_COOLDOWN_MS = parsePositiveInteger(ACCESS_REQUEST_COOLDOWN_MS_RAW, 15 * 60 * 1000);
const TEMP_SHARE_MAX_FILE_BYTES = parsePositiveInteger(TEMP_SHARE_MAX_FILE_BYTES_RAW, 600 * 1024 * 1024);
const TEMP_SHARE_VT_DIRECT_UPLOAD_MAX_FILE_BYTES = 32 * 1024 * 1024;
const TEMP_SHARE_RETENTION_MAX_HOURS = parsePositiveInteger(TEMP_SHARE_RETENTION_MAX_HOURS_RAW, 24 * 7);
const TEMP_SHARE_TEXT_PREVIEW_MAX_BYTES = parsePositiveInteger(TEMP_SHARE_TEXT_PREVIEW_MAX_BYTES_RAW, 256 * 1024);
const TEMP_SHARE_VT_TICK_MS = parsePositiveInteger(TEMP_SHARE_VT_TICK_MS_RAW, 20 * 1000);
const TEMP_SHARE_CLEANUP_INTERVAL_MS = parsePositiveInteger(TEMP_SHARE_CLEANUP_INTERVAL_MS_RAW, 60 * 1000);
const ACCESS_REQUEST_DECISION_TTL_MS = Math.min(
  parsePositiveInteger(ACCESS_REQUEST_DECISION_TTL_MS_RAW, ACCESS_REQUEST_MAX_WINDOW_MS),
  ACCESS_REQUEST_MAX_WINDOW_MS
);
const ACCESS_REQUEST_REAPPLY_COOLDOWN_MS = parsePositiveInteger(
  ACCESS_REQUEST_REAPPLY_COOLDOWN_MS_RAW,
  7 * 24 * 60 * 60 * 1000
);
const ACCESS_REQUEST_REASON_MAX_CHARS = 1200;
const FILES_DISCLAIMER_REEVALUATION_MAX_CHARS = ACCESS_REQUEST_REASON_MAX_CHARS;
const FILE_DESCRIPTION_MAX_CHARS = 900;
const FILE_GROUP_MAX_CHARS = 80;
const FILE_DISPLAY_NAME_MAX_CHARS = 180;
const FILE_ID_PATTERN = /^[a-f0-9-]{36}$/i;
const ACCESS_REQUEST_COOLDOWN_BY_DISCORD_ID = new Map();
const ACCESS_REQUEST_STATUS = Object.freeze({
  NONE: "none",
  PENDING: "pending",
  APPROVED: "approved",
  DECLINED: "declined"
});
const ACCESS_REQUEST_DECISION_ACTIONS = new Set(["approve", "decline"]);
const ACCESS_DISCLAIMER_DECISION = Object.freeze({
  NONE: "none",
  ACCEPTED: "accepted",
  DECLINED: "declined"
});

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
fs.mkdirSync(TEMP_SHARE_UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(METADATA_PATH)) {
  fs.writeFileSync(METADATA_PATH, "[]\n", "utf8");
}
if (!fs.existsSync(TEMP_SHARES_PATH)) {
  fs.writeFileSync(TEMP_SHARES_PATH, "[]\n", "utf8");
}
if (!fs.existsSync(EXHAUSTED_SLUGS_PATH)) {
  fs.writeFileSync(EXHAUSTED_SLUGS_PATH, "{}\n", "utf8");
}
if (!fs.existsSync(ACCESS_REQUESTS_PATH)) {
  fs.writeFileSync(ACCESS_REQUESTS_PATH, "[]\n", "utf8");
}
if (!fs.existsSync(VISIT_COUNTER_PATH)) {
  fs.writeFileSync(VISIT_COUNTER_PATH, '{\n  "totalVisits": 0,\n  "updatedAt": ""\n}\n', "utf8");
}

function readMetadataStore() {
  try {
    const raw = fs.readFileSync(METADATA_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const entries = [];
    for (const entry of parsed) {
      const normalized = normalizeMetadataFileEntry(entry);
      if (normalized) {
        entries.push(normalized);
      }
    }
    return entries;
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

const activeFileMutationIds = new Set();

function tryLockFileMutation(fileId) {
  const normalizedFileId = String(fileId || "").trim().toLowerCase();
  if (!normalizedFileId || activeFileMutationIds.has(normalizedFileId)) {
    return false;
  }
  activeFileMutationIds.add(normalizedFileId);
  return true;
}

function unlockFileMutation(fileId) {
  const normalizedFileId = String(fileId || "").trim().toLowerCase();
  if (!normalizedFileId) {
    return;
  }
  activeFileMutationIds.delete(normalizedFileId);
}

function normalizeVisitCounterStore(entry) {
  const totalVisits = Number.parseInt(String(entry?.totalVisits ?? 0), 10);
  const updatedAt = String(entry?.updatedAt || "").trim();

  return {
    totalVisits: Number.isFinite(totalVisits) && totalVisits > 0 ? totalVisits : 0,
    updatedAt
  };
}

function readVisitCounterStore() {
  try {
    const raw = fs.readFileSync(VISIT_COUNTER_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return normalizeVisitCounterStore(parsed);
  } catch (error) {
    console.error("[visits] read error:", error);
    return {
      totalVisits: 0,
      updatedAt: ""
    };
  }
}

function writeVisitCounterStore(entry) {
  const normalized = normalizeVisitCounterStore(entry);
  const tempPath = `${VISIT_COUNTER_PATH}.tmp`;
  const payload = JSON.stringify(normalized, null, 2);
  fs.writeFileSync(tempPath, `${payload}\n`, "utf8");
  fs.renameSync(tempPath, VISIT_COUNTER_PATH);
  return normalized;
}

function registerSiteVisit(req) {
  const currentCounter = readVisitCounterStore();
  if (!req.session || req.session.siteVisitRegistered === true) {
    return {
      totalVisits: currentCounter.totalVisits,
      counted: false,
      updatedAt: currentCounter.updatedAt
    };
  }

  const nextCounter = writeVisitCounterStore({
    totalVisits: currentCounter.totalVisits + 1,
    updatedAt: new Date().toISOString()
  });
  req.session.siteVisitRegistered = true;

  return {
    totalVisits: nextCounter.totalVisits,
    counted: true,
    updatedAt: nextCounter.updatedAt
  };
}

function normalizeAccessRequestStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === ACCESS_REQUEST_STATUS.PENDING) {
    return ACCESS_REQUEST_STATUS.PENDING;
  }
  if (normalized === ACCESS_REQUEST_STATUS.APPROVED) {
    return ACCESS_REQUEST_STATUS.APPROVED;
  }
  if (normalized === ACCESS_REQUEST_STATUS.DECLINED) {
    return ACCESS_REQUEST_STATUS.DECLINED;
  }
  return ACCESS_REQUEST_STATUS.NONE;
}

function normalizeAccessDisclaimerDecision(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === ACCESS_DISCLAIMER_DECISION.ACCEPTED) {
    return ACCESS_DISCLAIMER_DECISION.ACCEPTED;
  }
  if (normalized === ACCESS_DISCLAIMER_DECISION.DECLINED) {
    return ACCESS_DISCLAIMER_DECISION.DECLINED;
  }
  return ACCESS_DISCLAIMER_DECISION.NONE;
}

function isAccessRequestDisclaimerReevaluationPending(entry) {
  if (!entry || typeof entry !== "object") {
    return false;
  }
  const status = normalizeAccessRequestStatus(entry.status);
  const disclaimerDecision = normalizeAccessDisclaimerDecision(entry.disclaimerDecision);
  const pendingRequestedAt = String(entry.disclaimerReevaluationRequestedAt || "").trim();
  return status === ACCESS_REQUEST_STATUS.APPROVED
    && disclaimerDecision === ACCESS_DISCLAIMER_DECISION.DECLINED
    && Boolean(pendingRequestedAt);
}

function sanitizeAccessRequestReason(value) {
  const raw = String(value || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!raw) {
    return "";
  }
  return raw.slice(0, ACCESS_REQUEST_REASON_MAX_CHARS);
}

function sanitizeAccessRequestEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const discordId = String(entry.discordId || "").trim();
  if (!isDiscordId(discordId)) {
    return null;
  }

  const status = normalizeAccessRequestStatus(entry.status);
  const requestId = /^[a-f0-9-]{36}$/i.test(String(entry.requestId || "").trim())
    ? String(entry.requestId || "").trim().toLowerCase()
    : "";
  const disclaimerDecisionRaw = normalizeAccessDisclaimerDecision(entry.disclaimerDecision);
  const disclaimerDecision = status === ACCESS_REQUEST_STATUS.APPROVED
    ? disclaimerDecisionRaw
    : ACCESS_DISCLAIMER_DECISION.NONE;
  const disclaimerDecidedAt = disclaimerDecision !== ACCESS_DISCLAIMER_DECISION.NONE
    ? String(entry.disclaimerDecidedAt || "").trim()
    : "";
  const declineReason = status === ACCESS_REQUEST_STATUS.DECLINED
    ? sanitizeAccessRequestReason(entry.declineReason)
    : "";
  const disclaimerReevaluationRequestedAt = status === ACCESS_REQUEST_STATUS.APPROVED
    && disclaimerDecision === ACCESS_DISCLAIMER_DECISION.DECLINED
    ? String(entry.disclaimerReevaluationRequestedAt || "").trim()
    : "";

  return {
    requestId: requestId || crypto.randomUUID(),
    discordId,
    nick: String(entry.nick || "").trim().slice(0, 120),
    username: String(entry.username || "").trim().slice(0, 120),
    email: String(entry.email || "").trim().slice(0, 200),
    reason: sanitizeAccessRequestReason(entry.reason),
    declineReason,
    status: status === ACCESS_REQUEST_STATUS.NONE ? ACCESS_REQUEST_STATUS.PENDING : status,
    requestedAt: String(entry.requestedAt || "").trim(),
    decidedAt: String(entry.decidedAt || "").trim(),
    disclaimerDecision,
    disclaimerDecidedAt,
    disclaimerReevaluationRequestedAt
  };
}

function readAccessRequestStore() {
  try {
    const raw = fs.readFileSync(ACCESS_REQUESTS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const sanitized = [];
    for (const entry of parsed) {
      const normalized = sanitizeAccessRequestEntry(entry);
      if (normalized) {
        sanitized.push(normalized);
      }
    }

    if (expireStalePendingAccessRequests(sanitized)) {
      writeAccessRequestStore(sanitized);
    }
    return sanitized;
  } catch (error) {
    console.error("[access-requests] read error:", error);
    return [];
  }
}

function writeAccessRequestStore(entries) {
  const tempPath = `${ACCESS_REQUESTS_PATH}.tmp`;
  const payload = JSON.stringify(entries, null, 2);
  fs.writeFileSync(tempPath, `${payload}\n`, "utf8");
  fs.renameSync(tempPath, ACCESS_REQUESTS_PATH);
}

function getAccessRequestPendingExpiresAtMs(accessRequestState = null) {
  const resolved = accessRequestState && typeof accessRequestState === "object" ? accessRequestState : null;
  if (!resolved || normalizeAccessRequestStatus(resolved.status) !== ACCESS_REQUEST_STATUS.PENDING) {
    return 0;
  }

  const requestedAtMs = Date.parse(String(resolved.requestedAt || "").trim());
  if (!Number.isFinite(requestedAtMs) || requestedAtMs <= 0) {
    return 0;
  }
  return requestedAtMs + ACCESS_REQUEST_DECISION_TTL_MS;
}

function expireStalePendingAccessRequests(entries) {
  if (!Array.isArray(entries) || !entries.length) {
    return false;
  }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  let didChange = false;

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (!entry || normalizeAccessRequestStatus(entry.status) !== ACCESS_REQUEST_STATUS.PENDING) {
      continue;
    }

    const expiresAtMs = getAccessRequestPendingExpiresAtMs(entry);
    if (Number.isFinite(expiresAtMs) && expiresAtMs > 0 && nowMs <= expiresAtMs) {
      continue;
    }

    const updatedEntry = sanitizeAccessRequestEntry({
      ...entry,
      status: ACCESS_REQUEST_STATUS.DECLINED,
      decidedAt: nowIso
    });
    if (!updatedEntry) {
      continue;
    }
    entries[index] = updatedEntry;
    didChange = true;
  }

  return didChange;
}

function getAccessRequestState(discordId) {
  const normalizedId = String(discordId || "").trim();
  if (!isDiscordId(normalizedId)) {
    return {
      discordId: "",
      status: ACCESS_REQUEST_STATUS.NONE,
      disclaimerDecision: ACCESS_DISCLAIMER_DECISION.NONE,
      disclaimerDecidedAt: "",
      disclaimerReevaluationRequestedAt: "",
      requestId: "",
      requestedAt: "",
      decidedAt: "",
      nick: "",
      username: "",
      email: "",
      reason: "",
      declineReason: ""
    };
  }

  const entry = readAccessRequestStore().find((item) => item.discordId === normalizedId) || null;
  if (!entry) {
    return {
      discordId: normalizedId,
      status: ACCESS_REQUEST_STATUS.NONE,
      disclaimerDecision: ACCESS_DISCLAIMER_DECISION.NONE,
      disclaimerDecidedAt: "",
      disclaimerReevaluationRequestedAt: "",
      requestId: "",
      requestedAt: "",
      decidedAt: "",
      nick: "",
      username: "",
      email: "",
      reason: "",
      declineReason: ""
    };
  }

  return {
    discordId: normalizedId,
    status: normalizeAccessRequestStatus(entry.status),
    disclaimerDecision: normalizeAccessDisclaimerDecision(entry.disclaimerDecision),
    disclaimerDecidedAt: String(entry.disclaimerDecidedAt || ""),
    disclaimerReevaluationRequestedAt: String(entry.disclaimerReevaluationRequestedAt || ""),
    requestId: String(entry.requestId || ""),
    requestedAt: String(entry.requestedAt || ""),
    decidedAt: String(entry.decidedAt || ""),
    nick: String(entry.nick || ""),
    username: String(entry.username || ""),
    email: String(entry.email || ""),
    reason: sanitizeAccessRequestReason(entry.reason),
    declineReason: sanitizeAccessRequestReason(entry.declineReason)
  };
}

function getAccessRequestEntryByRequestId(requestId) {
  const normalizedRequestId = String(requestId || "").trim().toLowerCase();
  if (!/^[a-f0-9-]{36}$/i.test(normalizedRequestId)) {
    return null;
  }

  return readAccessRequestStore().find((entry) => entry.requestId === normalizedRequestId) || null;
}

function getAccessRequestReapplyAtMs(accessRequestState = null) {
  const resolved = accessRequestState && typeof accessRequestState === "object" ? accessRequestState : null;
  if (!resolved || normalizeAccessRequestStatus(resolved.status) !== ACCESS_REQUEST_STATUS.DECLINED) {
    return 0;
  }

  const decidedAtMs = Date.parse(String(resolved.decidedAt || "").trim());
  if (!Number.isFinite(decidedAtMs) || decidedAtMs <= 0) {
    return 0;
  }

  return decidedAtMs + ACCESS_REQUEST_REAPPLY_COOLDOWN_MS;
}

function getAccessRequestReapplyAtIso(accessRequestState = null) {
  const reapplyAtMs = getAccessRequestReapplyAtMs(accessRequestState);
  if (!Number.isFinite(reapplyAtMs) || reapplyAtMs <= 0) {
    return "";
  }
  return new Date(reapplyAtMs).toISOString();
}

function getAccessRequestReapplyRemainingMs(accessRequestState = null) {
  const reapplyAtMs = getAccessRequestReapplyAtMs(accessRequestState);
  if (!Number.isFinite(reapplyAtMs) || reapplyAtMs <= 0) {
    return 0;
  }
  return Math.max(0, reapplyAtMs - Date.now());
}

function createPendingAccessRequestEntry(user, reason) {
  const profile = user && user.discordProfile && typeof user.discordProfile === "object" ? user.discordProfile : null;
  const nowIso = new Date().toISOString();
  return {
    requestId: crypto.randomUUID(),
    discordId: user.discordId,
    nick: String(profile?.global_name || user.username || "").trim().slice(0, 120),
    username: String(profile?.username || user.username || "").trim().slice(0, 120),
    email: String(profile?.email || "").trim().slice(0, 200),
    reason: sanitizeAccessRequestReason(reason),
    declineReason: "",
    status: ACCESS_REQUEST_STATUS.PENDING,
    requestedAt: nowIso,
    decidedAt: "",
    disclaimerDecision: ACCESS_DISCLAIMER_DECISION.NONE,
    disclaimerDecidedAt: "",
    disclaimerReevaluationRequestedAt: ""
  };
}

function upsertAccessRequestEntry(nextEntry) {
  const entries = readAccessRequestStore();
  const existingIndex = entries.findIndex((entry) => entry.discordId === nextEntry.discordId);
  if (existingIndex >= 0) {
    entries[existingIndex] = nextEntry;
  } else {
    entries.push(nextEntry);
  }
  writeAccessRequestStore(entries);
}

function applyAccessRequestDecision(requestId, action, { declineReason = "" } = {}) {
  const normalizedRequestId = String(requestId || "").trim().toLowerCase();
  const normalizedAction = String(action || "").trim().toLowerCase();
  const normalizedDeclineReason = sanitizeAccessRequestReason(declineReason);
  if (!/^[a-f0-9-]{36}$/i.test(normalizedRequestId) || !ACCESS_REQUEST_DECISION_ACTIONS.has(normalizedAction)) {
    return { ok: false, reason: "invalid" };
  }

  const entries = readAccessRequestStore();
  const index = entries.findIndex((entry) => entry.requestId === normalizedRequestId);
  if (index < 0) {
    return { ok: false, reason: "not_found" };
  }

  const entry = entries[index];
  const currentStatus = normalizeAccessRequestStatus(entry.status);
  const isPendingReevaluation = isAccessRequestDisclaimerReevaluationPending(entry);
  if (currentStatus !== ACCESS_REQUEST_STATUS.PENDING) {
    if (isPendingReevaluation) {
      const reevaluationDecision = applyAccessRequestReevaluationDecisionByDiscordId(
        entry.discordId,
        normalizedAction,
        { declineReason: normalizedDeclineReason }
      );
      if (!reevaluationDecision.ok) {
        return {
          ok: false,
          reason: reevaluationDecision.reason || "invalid",
          entry: reevaluationDecision.entry || entry
        };
      }
      return {
        ok: true,
        entry: reevaluationDecision.entry || null
      };
    }
    return {
      ok: false,
      reason: "already_decided",
      entry
    };
  }

  const nextEntry = sanitizeAccessRequestEntry({
    ...entry,
    status: normalizedAction === "approve" ? ACCESS_REQUEST_STATUS.APPROVED : ACCESS_REQUEST_STATUS.DECLINED,
    decidedAt: new Date().toISOString(),
    declineReason: normalizedAction === "decline" ? normalizedDeclineReason : "",
    disclaimerDecision: ACCESS_DISCLAIMER_DECISION.NONE,
    disclaimerDecidedAt: "",
    disclaimerReevaluationRequestedAt: ""
  });
  if (!nextEntry) {
    return { ok: false, reason: "invalid" };
  }
  entries[index] = nextEntry;
  writeAccessRequestStore(entries);
  return {
    ok: true,
    entry: entries[index]
  };
}

function updateAccessRequestStatusByDiscordId(discordId, nextStatus, { allowedCurrentStatuses = null, declineReason = "" } = {}) {
  const normalizedDiscordId = String(discordId || "").trim();
  const normalizedNextStatus = normalizeAccessRequestStatus(nextStatus);
  if (!isDiscordId(normalizedDiscordId) || normalizedNextStatus === ACCESS_REQUEST_STATUS.NONE) {
    return { ok: false, reason: "invalid" };
  }

  const entries = readAccessRequestStore();
  const index = entries.findIndex((entry) => entry.discordId === normalizedDiscordId);
  if (index < 0) {
    return { ok: false, reason: "not_found" };
  }

  const currentEntry = entries[index];
  const currentStatus = normalizeAccessRequestStatus(currentEntry.status);
  if (allowedCurrentStatuses instanceof Set && !allowedCurrentStatuses.has(currentStatus)) {
    return {
      ok: false,
      reason: "status_mismatch",
      entry: currentEntry
    };
  }
  if (currentStatus === normalizedNextStatus) {
    return {
      ok: false,
      reason: "already_set",
      entry: currentEntry
    };
  }

  const nowIso = new Date().toISOString();
  const updatedEntry = sanitizeAccessRequestEntry({
    ...currentEntry,
    status: normalizedNextStatus,
    requestedAt: String(currentEntry.requestedAt || nowIso).trim() || nowIso,
    decidedAt: normalizedNextStatus === ACCESS_REQUEST_STATUS.PENDING ? "" : nowIso,
    declineReason: normalizedNextStatus === ACCESS_REQUEST_STATUS.DECLINED
      ? sanitizeAccessRequestReason(declineReason)
      : "",
    disclaimerDecision: ACCESS_DISCLAIMER_DECISION.NONE,
    disclaimerDecidedAt: "",
    disclaimerReevaluationRequestedAt: ""
  });

  if (!updatedEntry) {
    return { ok: false, reason: "invalid" };
  }

  entries[index] = updatedEntry;
  writeAccessRequestStore(entries);

  return {
    ok: true,
    entry: updatedEntry
  };
}

function clearDeclinedAccessRequestForReapply(discordId) {
  const normalizedDiscordId = String(discordId || "").trim();
  if (!isDiscordId(normalizedDiscordId)) {
    return { ok: false, reason: "invalid" };
  }

  const entries = readAccessRequestStore();
  const index = entries.findIndex((entry) => entry.discordId === normalizedDiscordId);
  if (index < 0) {
    return { ok: false, reason: "not_found" };
  }

  const entry = entries[index];
  const currentStatus = normalizeAccessRequestStatus(entry.status);
  const currentDisclaimerDecision = normalizeAccessDisclaimerDecision(entry.disclaimerDecision);
  const declinedByDisclaimer = currentStatus === ACCESS_REQUEST_STATUS.APPROVED
    && currentDisclaimerDecision === ACCESS_DISCLAIMER_DECISION.DECLINED;

  if (currentStatus !== ACCESS_REQUEST_STATUS.DECLINED && !declinedByDisclaimer) {
    return {
      ok: false,
      reason: "status_mismatch",
      entry
    };
  }

  if (declinedByDisclaimer) {
    const updatedEntry = sanitizeAccessRequestEntry({
      ...entry,
      disclaimerDecision: ACCESS_DISCLAIMER_DECISION.NONE,
      disclaimerDecidedAt: "",
      disclaimerReevaluationRequestedAt: ""
    });
    if (!updatedEntry) {
      return { ok: false, reason: "invalid" };
    }
    entries[index] = updatedEntry;
    writeAccessRequestStore(entries);
    return {
      ok: true,
      entry: updatedEntry
    };
  }

  entries.splice(index, 1);
  writeAccessRequestStore(entries);
  return {
    ok: true,
    entry
  };
}

function setAccessRequestDisclaimerDecisionByDiscordId(discordId, decision) {
  const normalizedDiscordId = String(discordId || "").trim();
  const normalizedDecision = normalizeAccessDisclaimerDecision(decision);
  if (!isDiscordId(normalizedDiscordId) || normalizedDecision === ACCESS_DISCLAIMER_DECISION.NONE) {
    return { ok: false, reason: "invalid" };
  }

  const entries = readAccessRequestStore();
  const index = entries.findIndex((entry) => entry.discordId === normalizedDiscordId);
  if (index < 0) {
    return { ok: false, reason: "not_found" };
  }

  const currentEntry = entries[index];
  const currentStatus = normalizeAccessRequestStatus(currentEntry.status);
  if (currentStatus !== ACCESS_REQUEST_STATUS.APPROVED) {
    return {
      ok: false,
      reason: "status_mismatch",
      entry: currentEntry
    };
  }

  const currentDecision = normalizeAccessDisclaimerDecision(currentEntry.disclaimerDecision);
  if (currentDecision === ACCESS_DISCLAIMER_DECISION.DECLINED && normalizedDecision === ACCESS_DISCLAIMER_DECISION.ACCEPTED) {
    return {
      ok: false,
      reason: "locked_declined",
      entry: currentEntry
    };
  }
  if (currentDecision === normalizedDecision) {
    return {
      ok: true,
      entry: currentEntry
    };
  }

  const updatedEntry = sanitizeAccessRequestEntry({
    ...currentEntry,
    disclaimerDecision: normalizedDecision,
    disclaimerDecidedAt: new Date().toISOString(),
    disclaimerReevaluationRequestedAt: ""
  });
  if (!updatedEntry) {
    return { ok: false, reason: "invalid" };
  }

  entries[index] = updatedEntry;
  writeAccessRequestStore(entries);
  return {
    ok: true,
    entry: updatedEntry
  };
}

function applyAccessRequestReevaluationDecisionByDiscordId(discordId, action, { declineReason = "" } = {}) {
  const normalizedDiscordId = String(discordId || "").trim();
  const normalizedAction = String(action || "").trim().toLowerCase();
  const normalizedDeclineReason = sanitizeAccessRequestReason(declineReason);
  if (!isDiscordId(normalizedDiscordId) || !ACCESS_REQUEST_DECISION_ACTIONS.has(normalizedAction)) {
    return { ok: false, reason: "invalid" };
  }

  const entries = readAccessRequestStore();
  const index = entries.findIndex((entry) => entry.discordId === normalizedDiscordId);
  if (index < 0) {
    return { ok: false, reason: "not_found" };
  }

  const entry = entries[index];
  const currentStatus = normalizeAccessRequestStatus(entry.status);
  const currentDisclaimerDecision = normalizeAccessDisclaimerDecision(entry.disclaimerDecision);
  const pendingRequestedAt = String(entry.disclaimerReevaluationRequestedAt || "").trim();
  if (
    currentStatus !== ACCESS_REQUEST_STATUS.APPROVED
    || currentDisclaimerDecision !== ACCESS_DISCLAIMER_DECISION.DECLINED
    || !pendingRequestedAt
  ) {
    return {
      ok: false,
      reason: "state_mismatch",
      entry
    };
  }

  let nextEntry = null;
  if (normalizedAction === "approve") {
    nextEntry = sanitizeAccessRequestEntry({
      ...entry,
      disclaimerDecision: ACCESS_DISCLAIMER_DECISION.NONE,
      disclaimerDecidedAt: "",
      disclaimerReevaluationRequestedAt: ""
    });
  } else {
    const nowIso = new Date().toISOString();
    nextEntry = sanitizeAccessRequestEntry({
      ...entry,
      status: ACCESS_REQUEST_STATUS.DECLINED,
      decidedAt: nowIso,
      declineReason: normalizedDeclineReason,
      disclaimerDecision: ACCESS_DISCLAIMER_DECISION.NONE,
      disclaimerDecidedAt: "",
      disclaimerReevaluationRequestedAt: ""
    });
  }

  if (!nextEntry) {
    return { ok: false, reason: "invalid" };
  }

  entries[index] = nextEntry;
  writeAccessRequestStore(entries);
  return {
    ok: true,
    entry: nextEntry
  };
}

function markAccessRequestDisclaimerReevaluationPendingByDiscordId(discordId) {
  const normalizedDiscordId = String(discordId || "").trim();
  if (!isDiscordId(normalizedDiscordId)) {
    return { ok: false, reason: "invalid" };
  }

  const entries = readAccessRequestStore();
  const index = entries.findIndex((entry) => entry.discordId === normalizedDiscordId);
  if (index < 0) {
    return { ok: false, reason: "not_found" };
  }

  const entry = entries[index];
  const currentStatus = normalizeAccessRequestStatus(entry.status);
  const currentDisclaimerDecision = normalizeAccessDisclaimerDecision(entry.disclaimerDecision);
  if (currentStatus !== ACCESS_REQUEST_STATUS.APPROVED || currentDisclaimerDecision !== ACCESS_DISCLAIMER_DECISION.DECLINED) {
    return {
      ok: false,
      reason: "state_mismatch",
      entry
    };
  }

  const pendingRequestedAt = String(entry.disclaimerReevaluationRequestedAt || "").trim();
  if (pendingRequestedAt) {
    return {
      ok: false,
      reason: "already_pending",
      entry
    };
  }

  const updatedEntry = sanitizeAccessRequestEntry({
    ...entry,
    disclaimerReevaluationRequestedAt: new Date().toISOString()
  });
  if (!updatedEntry) {
    return { ok: false, reason: "invalid" };
  }

  entries[index] = updatedEntry;
  writeAccessRequestStore(entries);
  return {
    ok: true,
    entry: updatedEntry
  };
}

function clearAccessRequestDisclaimerReevaluationPendingByDiscordId(discordId) {
  const normalizedDiscordId = String(discordId || "").trim();
  if (!isDiscordId(normalizedDiscordId)) {
    return { ok: false, reason: "invalid" };
  }

  const entries = readAccessRequestStore();
  const index = entries.findIndex((entry) => entry.discordId === normalizedDiscordId);
  if (index < 0) {
    return { ok: false, reason: "not_found" };
  }

  const entry = entries[index];
  const pendingRequestedAt = String(entry.disclaimerReevaluationRequestedAt || "").trim();
  if (!pendingRequestedAt) {
    return {
      ok: true,
      entry
    };
  }

  const updatedEntry = sanitizeAccessRequestEntry({
    ...entry,
    disclaimerReevaluationRequestedAt: ""
  });
  if (!updatedEntry) {
    return { ok: false, reason: "invalid" };
  }

  entries[index] = updatedEntry;
  writeAccessRequestStore(entries);
  return {
    ok: true,
    entry: updatedEntry
  };
}

function getAccessRequestAdminEntries() {
  const requestEntries = readAccessRequestStore().map((entry) => {
    const status = normalizeAccessRequestStatus(entry.status);
    const disclaimerDecision = normalizeAccessDisclaimerDecision(entry.disclaimerDecision);
    const reevaluationPending = isAccessRequestDisclaimerReevaluationPending(entry);
    const declinedByDisclaimer = status === ACCESS_REQUEST_STATUS.APPROVED
      && disclaimerDecision === ACCESS_DISCLAIMER_DECISION.DECLINED;
    const rawDeclineReason = sanitizeAccessRequestReason(entry.declineReason);
    const effectiveStatus = reevaluationPending
      ? ACCESS_REQUEST_STATUS.PENDING
      : (declinedByDisclaimer ? ACCESS_REQUEST_STATUS.DECLINED : status);
    const effectiveReason = reevaluationPending
      ? "Pending reevaluation: user declined required disclaimer."
      : (declinedByDisclaimer
          ? "Declined by user: required disclaimer was not accepted."
          : sanitizeAccessRequestReason(entry.reason));
    const effectiveDeclineReason = reevaluationPending
      ? ""
      : (declinedByDisclaimer
          ? "Declined by user: required disclaimer was not accepted."
          : rawDeclineReason);
    const effectiveRequestedAt = reevaluationPending
      ? String(entry.disclaimerReevaluationRequestedAt || entry.requestedAt || "")
      : String(entry.requestedAt || "");
    const effectiveDecidedAt = reevaluationPending
      ? ""
      : (declinedByDisclaimer
          ? String(entry.disclaimerDecidedAt || entry.decidedAt || "")
          : String(entry.decidedAt || ""));
    return {
      requestId: String(entry.requestId || ""),
      discordId: String(entry.discordId || ""),
      nick: String(entry.nick || ""),
      username: String(entry.username || ""),
      email: String(entry.email || ""),
      reason: effectiveReason,
      declineReason: effectiveDeclineReason,
      status: effectiveStatus,
      requestedAt: effectiveRequestedAt,
      decidedAt: effectiveDecidedAt,
      source: "request",
      canApprove: effectiveStatus === ACCESS_REQUEST_STATUS.PENDING,
      canDecline: effectiveStatus === ACCESS_REQUEST_STATUS.PENDING,
      canUnauthorize: effectiveStatus === ACCESS_REQUEST_STATUS.APPROVED,
      canAllowReapply: effectiveStatus === ACCESS_REQUEST_STATUS.DECLINED
    };
  });

  const seenDiscordIds = new Set(requestEntries.map((entry) => entry.discordId));
  const staticAllowlistEntries = [];
  for (const discordId of ALLOWED_DISCORD_IDS) {
    if (!isDiscordId(discordId) || discordId === ADMIN_DISCORD_ID || seenDiscordIds.has(discordId)) {
      continue;
    }
    staticAllowlistEntries.push({
      requestId: "",
      discordId,
      nick: "",
      username: "",
      email: "",
      reason: "",
      declineReason: "",
      status: ACCESS_REQUEST_STATUS.APPROVED,
      requestedAt: "",
      decidedAt: "",
      source: "allowlist",
      canApprove: false,
      canDecline: false,
      canUnauthorize: false,
      canAllowReapply: false
    });
  }

  const statusOrder = {
    [ACCESS_REQUEST_STATUS.PENDING]: 0,
    [ACCESS_REQUEST_STATUS.APPROVED]: 1,
    [ACCESS_REQUEST_STATUS.DECLINED]: 2,
    [ACCESS_REQUEST_STATUS.NONE]: 3
  };

  const allEntries = [...requestEntries, ...staticAllowlistEntries];
  allEntries.sort((left, right) => {
    const leftStatus = normalizeAccessRequestStatus(left.status);
    const rightStatus = normalizeAccessRequestStatus(right.status);
    const leftRank = Number.isFinite(statusOrder[leftStatus]) ? statusOrder[leftStatus] : 9;
    const rightRank = Number.isFinite(statusOrder[rightStatus]) ? statusOrder[rightStatus] : 9;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    const leftSourceRank = left.source === "request" ? 0 : 1;
    const rightSourceRank = right.source === "request" ? 0 : 1;
    if (leftSourceRank !== rightSourceRank) {
      return leftSourceRank - rightSourceRank;
    }

    const leftTimeMs = Date.parse(String(left.requestedAt || "")) || 0;
    const rightTimeMs = Date.parse(String(right.requestedAt || "")) || 0;
    if (leftTimeMs !== rightTimeMs) {
      return rightTimeMs - leftTimeMs;
    }

    return String(left.discordId || "").localeCompare(String(right.discordId || ""));
  });

  return allEntries;
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

function sanitizeFileDescription(value) {
  const raw = String(value || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!raw) {
    return "";
  }
  return raw.slice(0, FILE_DESCRIPTION_MAX_CHARS);
}

function sanitizeFileGroup(value) {
  const raw = String(value || "")
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) {
    return "";
  }
  return raw.slice(0, FILE_GROUP_MAX_CHARS);
}

function sanitizeFileDisplayName(value) {
  const raw = String(value || "")
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) {
    return "";
  }
  return sanitizeDisplayFilename(raw).slice(0, FILE_DISPLAY_NAME_MAX_CHARS);
}

function resolveTempShareStoredPath(storedName) {
  const normalizedName = String(storedName || "").trim();
  if (!normalizedName) {
    return "";
  }
  const resolvedPath = path.resolve(TEMP_SHARE_UPLOAD_DIR, normalizedName);
  const uploadsRoot = path.resolve(TEMP_SHARE_UPLOAD_DIR) + path.sep;
  if (!resolvedPath.startsWith(uploadsRoot)) {
    return "";
  }
  return resolvedPath;
}

function deleteStoredTempShareUpload(storedName) {
  const resolvedPath = resolveTempShareStoredPath(storedName);
  if (!resolvedPath) {
    return;
  }
  fs.unlink(resolvedPath, () => {});
}

function normalizeTempShareVirusStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (
    normalized === TEMP_SHARE_VIRUS_STATUS.QUEUED
    || normalized === TEMP_SHARE_VIRUS_STATUS.PENDING
    || normalized === TEMP_SHARE_VIRUS_STATUS.CLEAN
    || normalized === TEMP_SHARE_VIRUS_STATUS.FLAGGED
    || normalized === TEMP_SHARE_VIRUS_STATUS.ERROR
    || normalized === TEMP_SHARE_VIRUS_STATUS.SKIPPED
  ) {
    return normalized;
  }
  return TEMP_SHARE_VIRUS_STATUS.UNAVAILABLE;
}

function normalizeTempShareVirusStats(stats) {
  const source = stats && typeof stats === "object" ? stats : {};
  const normalizeCount = (value) => {
    const parsed = Number.parseInt(String(value ?? 0), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  return {
    harmless: normalizeCount(source.harmless),
    malicious: normalizeCount(source.malicious),
    suspicious: normalizeCount(source.suspicious),
    undetected: normalizeCount(source.undetected),
    timeout: normalizeCount(source.timeout),
    failure: normalizeCount(source.failure),
    "type-unsupported": normalizeCount(source["type-unsupported"] ?? source.typeUnsupported),
    "confirmed-timeout": normalizeCount(source["confirmed-timeout"] ?? source.confirmedTimeout)
  };
}

function buildVirusTotalPermalink(sha256) {
  const normalized = String(sha256 || "").trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    return "";
  }
  return `https://www.virustotal.com/gui/file/${normalized}`;
}

function normalizeTempShareEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const id = String(entry.id || "").trim().toLowerCase();
  const storedName = String(entry.storedName || "").trim();
  const name = sanitizeDisplayFilename(entry.name || entry.originalName || "");
  if (!FILE_ID_PATTERN.test(id) || !storedName || !name) {
    return null;
  }

  const mimeType = String(entry.mimeType || "application/octet-stream").trim() || "application/octet-stream";
  const size = Number(entry.size);
  const maxDownloads = parseOptionalPositiveInteger(entry.maxDownloads, 0);
  const downloadCount = parseOptionalPositiveInteger(entry.downloadCount, 0);
  const uploadedAt = String(entry.uploadedAt || "").trim() || new Date(0).toISOString();
  const updatedAt = String(entry.updatedAt || "").trim() || uploadedAt;
  const expiresAtRaw = String(entry.expiresAt || "").trim();
  const expiresAtMs = Date.parse(expiresAtRaw);
  const expiresAt = Number.isFinite(expiresAtMs) && expiresAtMs > 0
    ? new Date(expiresAtMs).toISOString()
    : "";
  const virusTotalSource = entry.virusTotal && typeof entry.virusTotal === "object" ? entry.virusTotal : {};
  const sha256 = String(virusTotalSource.sha256 || "").trim().toLowerCase();
  const langRaw = String(entry.lang || "").trim().toLowerCase();
  const lang = langRaw === "es" ? "es" : "en";

  return {
    id,
    storedName,
    name,
    displayName: sanitizeFileDisplayName(entry.displayName),
    mimeType,
    size: Number.isFinite(size) && size >= 0 ? size : 0,
    description: sanitizeFileDescription(entry.description),
    maxDownloads,
    downloadCount,
    uploadedAt,
    updatedAt,
    expiresAt,
    lang,
    uploaderDiscordId: String(entry.uploaderDiscordId || "").trim(),
    uploader: String(entry.uploader || "").trim(),
    virusTotal: {
      status: normalizeTempShareVirusStatus(virusTotalSource.status),
      sha256: /^[a-f0-9]{64}$/.test(sha256) ? sha256 : "",
      analysisId: String(virusTotalSource.analysisId || "").trim(),
      permalink: buildVirusTotalPermalink(sha256),
      stats: normalizeTempShareVirusStats(virusTotalSource.stats),
      lastCheckedAt: String(virusTotalSource.lastCheckedAt || "").trim(),
      completedAt: String(virusTotalSource.completedAt || "").trim(),
      lastError: String(virusTotalSource.lastError || "").trim().slice(0, 320)
    }
  };
}

function writeTempShareStore(entries) {
  const tempPath = `${TEMP_SHARES_PATH}.tmp`;
  const payload = JSON.stringify(entries, null, 2);
  fs.writeFileSync(tempPath, `${payload}\n`, "utf8");
  fs.renameSync(tempPath, TEMP_SHARES_PATH);
}

function readTempShareStore() {
  try {
    const raw = fs.readFileSync(TEMP_SHARES_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((entry) => normalizeTempShareEntry(entry))
      .filter(Boolean);
  } catch (error) {
    console.error("[temp-shares] read error:", error);
    return [];
  }
}

function normalizeTempShareSlugValue(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function isValidTempShareSlug(value) {
  return TEMP_SHARE_SLUG_PATTERN.test(String(value || "").trim());
}

function stripTempShareExtension(name) {
  const value = String(name || "").trim();
  if (!value) {
    return "";
  }
  const dotIndex = value.lastIndexOf(".");
  if (dotIndex <= 0) {
    return value;
  }
  return value.slice(0, dotIndex);
}

function buildTempShareSlug(entry) {
  const normalized = normalizeTempShareEntry(entry);
  if (!normalized) {
    return "";
  }
  const stableName = stripTempShareExtension(normalized.displayName || normalized.name) || "shared-drop";
  const slugBase = normalizeTempShareSlugValue(stableName) || "shared-drop";
  const shortId = normalized.id.replace(/-/g, "").slice(0, 8);
  return shortId ? `${slugBase}-${shortId}` : slugBase;
}

function hasTempShareExpired(entry, nowMs = Date.now()) {
  const expiresAtMs = Date.parse(String(entry?.expiresAt || "").trim());
  return Number.isFinite(expiresAtMs) && expiresAtMs > 0 && nowMs >= expiresAtMs;
}

function isTempShareExhausted(entry) {
  const maxDownloads = parseOptionalPositiveInteger(entry?.maxDownloads, 0);
  if (maxDownloads <= 0) {
    return false;
  }
  return parseOptionalPositiveInteger(entry?.downloadCount, 0) >= maxDownloads;
}

function isTempShareActive(entry, nowMs = Date.now()) {
  const normalized = normalizeTempShareEntry(entry);
  if (!normalized) {
    return false;
  }
  return !hasTempShareExpired(normalized, nowMs) && !isTempShareExhausted(normalized);
}

function getTempShareRemainingDownloads(entry) {
  const normalized = normalizeTempShareEntry(entry);
  if (!normalized) {
    return 0;
  }
  if (normalized.maxDownloads <= 0) {
    return 0;
  }
  return Math.max(0, normalized.maxDownloads - normalized.downloadCount);
}

function purgeInactiveTempShares(entries) {
  const sourceEntries = Array.isArray(entries) ? entries : [];
  const nowMs = Date.now();
  const nextEntries = [];
  let didChange = false;

  for (const entry of sourceEntries) {
    const normalized = normalizeTempShareEntry(entry);
    if (!normalized) {
      didChange = true;
      continue;
    }
    if (!isTempShareActive(normalized, nowMs)) {
      deleteStoredTempShareUpload(normalized.storedName);
      didChange = true;
      continue;
    }
    nextEntries.push(normalized);
  }

  return {
    entries: nextEntries,
    didChange
  };
}

function getActiveTempShareEntries() {
  const currentEntries = readTempShareStore();
  const result = purgeInactiveTempShares(currentEntries);
  if (result.didChange) {
    writeTempShareStore(result.entries);
  }
  return result.entries;
}

const activeTempShareMutationIds = new Set();
let activeTempShareCreateLock = false;

const exhaustedTempShareSlugs = new Map();

function readExhaustedSlugs() {
  try {
    const raw = fs.readFileSync(EXHAUSTED_SLUGS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeExhaustedSlugs(slugs) {
  try {
    const tempPath = `${EXHAUSTED_SLUGS_PATH}.tmp`;
    fs.writeFileSync(tempPath, `${JSON.stringify(slugs, null, 2)}\n`, "utf8");
    fs.renameSync(tempPath, EXHAUSTED_SLUGS_PATH);
  } catch (err) {
    console.error("[temp-shares] Failed to write exhausted slugs:", err);
  }
}

function recordExhaustedTempShareSlug(slug, lang) {
  const normalized = String(slug || "").trim();
  if (!normalized) return;
  const validLang = String(lang || "").trim() === "es" ? "es" : "en";
  const now = Date.now();
  exhaustedTempShareSlugs.set(normalized, { ts: now, lang: validLang });
  try {
    const slugs = readExhaustedSlugs();
    const cutoff = now - 7 * 24 * 60 * 60 * 1000;
    for (const k of Object.keys(slugs)) {
      const v = slugs[k];
      const ts = typeof v === "object" ? v.ts : v;
      if (typeof ts !== "number" || ts < cutoff) delete slugs[k];
    }
    slugs[normalized] = { ts: now, lang: validLang };
    writeExhaustedSlugs(slugs);
  } catch (err) {
    console.error("[temp-shares] Failed to record exhausted slug:", err);
  }
}

function isExhaustedTempShareSlug(slug) {
  const normalized = String(slug || "").trim();
  if (!normalized) return false;
  if (exhaustedTempShareSlugs.has(normalized)) return true;
  try {
    const slugs = readExhaustedSlugs();
    const v = slugs[normalized];
    if (v !== undefined && v !== null) {
      const ts = typeof v === "object" ? v.ts : v;
      const storedLang = typeof v === "object" ? (v.lang || "en") : "en";
      exhaustedTempShareSlugs.set(normalized, { ts: typeof ts === "number" ? ts : Date.now(), lang: storedLang });
      return true;
    }
  } catch {}
  return false;
}

function getExhaustedSlugLang(slug) {
  const normalized = String(slug || "").trim();
  if (!normalized) return "en";
  const mem = exhaustedTempShareSlugs.get(normalized);
  if (mem) return (typeof mem === "object" ? mem.lang : null) || "en";
  try {
    const slugs = readExhaustedSlugs();
    const v = slugs[normalized];
    if (v && typeof v === "object") return v.lang || "en";
  } catch {}
  return "en";
}

function tryLockTempShareMutation(shareId) {
  const normalizedShareId = String(shareId || "").trim().toLowerCase();
  if (!normalizedShareId || activeTempShareMutationIds.has(normalizedShareId)) {
    return false;
  }
  activeTempShareMutationIds.add(normalizedShareId);
  return true;
}

function unlockTempShareMutation(shareId) {
  const normalizedShareId = String(shareId || "").trim().toLowerCase();
  if (!normalizedShareId) {
    return;
  }
  activeTempShareMutationIds.delete(normalizedShareId);
}

function tryLockTempShareCreate() {
  if (activeTempShareCreateLock) {
    return false;
  }
  activeTempShareCreateLock = true;
  return true;
}

function unlockTempShareCreate() {
  activeTempShareCreateLock = false;
}

function buildTempShareListEntry(entry) {
  const normalized = normalizeTempShareEntry(entry);
  if (!normalized) {
    return null;
  }

  const slug = buildTempShareSlug(normalized);
  return {
    id: normalized.id,
    slug,
    sharePath: `${TEMP_SHARE_ROUTE_PREFIX}${encodeURIComponent(slug)}`,
    name: normalized.name,
    displayName: normalized.displayName || normalized.name,
    mimeType: normalized.mimeType,
    size: normalized.size,
    description: normalized.description,
    uploadedAt: normalized.uploadedAt,
    updatedAt: normalized.updatedAt,
    expiresAt: normalized.expiresAt,
    maxDownloads: normalized.maxDownloads,
    downloadCount: normalized.downloadCount,
    remainingDownloads: getTempShareRemainingDownloads(normalized),
    uploader: normalized.uploader || normalized.uploaderDiscordId || "",
    virusTotal: normalized.virusTotal
  };
}

function resolveTempShareFileTypeLabel(entry) {
  const normalized = normalizeTempShareEntry(entry);
  if (!normalized) {
    return "FILE";
  }

  for (const candidateName of [normalized.displayName, normalized.name]) {
    const extension = path.extname(String(candidateName || "")).replace(/^\./, "").trim();
    if (extension) {
      return extension.toUpperCase();
    }
  }

  const mimeType = String(normalized.mimeType || "").trim().toLowerCase();
  if (!mimeType || mimeType === "application/octet-stream") {
    return "FILE";
  }
  const [topLevelType] = mimeType.split("/");
  return (topLevelType || mimeType).toUpperCase();
}

function normalizeMetadataFileEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const id = String(entry.id || "").trim();
  const storedName = String(entry.storedName || "").trim();
  const name = sanitizeDisplayFilename(entry.name || entry.originalName || "");
  if (!FILE_ID_PATTERN.test(id) || !storedName || !name) {
    return null;
  }

  const mimeType = String(entry.mimeType || "application/octet-stream").trim() || "application/octet-stream";
  const size = Number(entry.size);
  const downloadCount = Number(entry.downloadCount);
  const uploadedAt = String(entry.uploadedAt || "").trim();
  const updatedAt = String(entry.updatedAt || "").trim();
  const contentUpdatedAt = String(entry.contentUpdatedAt || "").trim();
  const imageStoredName = String(entry.imageStoredName || "").trim();
  const imageMimeType = String(entry.imageMimeType || "").trim();
  const hasImage = Boolean(imageStoredName);
  const imageName = hasImage ? (sanitizeDisplayFilename(entry.imageName || "image") || "image") : "";
  const imageSize = hasImage ? Math.max(0, Number(entry.imageSize) || 0) : 0;
  const outdated = parseBoolean(entry.outdated ?? entry.isOutdated, false);
  const caution = parseBoolean(entry.caution ?? entry.hasCaution, false);

  return {
    id: id.toLowerCase(),
    storedName,
    name,
    displayName: sanitizeFileDisplayName(entry.displayName),
    mimeType,
    size: Number.isFinite(size) && size >= 0 ? size : 0,
    downloadCount: Number.isFinite(downloadCount) && downloadCount > 0 ? Math.floor(downloadCount) : 0,
    outdated,
    caution,
    description: sanitizeFileDescription(entry.description),
    group: sanitizeFileGroup(entry.group),
    uploadedAt: uploadedAt || new Date(0).toISOString(),
    updatedAt: updatedAt || uploadedAt || "",
    contentUpdatedAt: contentUpdatedAt || uploadedAt || "",
    uploaderDiscordId: String(entry.uploaderDiscordId || "").trim(),
    uploader: String(entry.uploader || "").trim(),
    imageStoredName: hasImage ? imageStoredName : "",
    imageMimeType: hasImage ? (imageMimeType || "application/octet-stream") : "",
    imageName,
    imageSize
  };
}

function resolveUploadStoredPath(storedName) {
  const normalizedName = String(storedName || "").trim();
  if (!normalizedName) {
    return "";
  }
  const resolvedPath = path.resolve(UPLOAD_DIR, normalizedName);
  const uploadsRoot = path.resolve(UPLOAD_DIR) + path.sep;
  if (!resolvedPath.startsWith(uploadsRoot)) {
    return "";
  }
  return resolvedPath;
}

function deleteStoredUpload(storedName) {
  const resolvedPath = resolveUploadStoredPath(storedName);
  if (!resolvedPath) {
    return;
  }
  fs.unlink(resolvedPath, () => {});
}

function buildFileListEntry(entry) {
  const normalized = normalizeMetadataFileEntry(entry);
  if (!normalized) {
    return null;
  }

  const imageUrl = normalized.imageStoredName
    ? `/api/files/${encodeURIComponent(normalized.id)}/image`
    : "";

  return {
    id: normalized.id,
    name: normalized.name,
    displayName: normalized.displayName || normalized.name,
    mimeType: normalized.mimeType,
    size: normalized.size,
    downloadCount: normalized.downloadCount,
    outdated: normalized.outdated,
    caution: normalized.caution,
    uploadedAt: normalized.uploadedAt,
    updatedAt: normalized.updatedAt || normalized.uploadedAt,
    contentUpdatedAt: normalized.contentUpdatedAt || normalized.uploadedAt,
    description: normalized.description,
    group: normalized.group,
    uploader: normalized.uploader || normalized.uploaderDiscordId || "",
    imageUrl,
    imageName: normalized.imageName,
    hasImage: Boolean(imageUrl)
  };
}

function normalizeFileShareSlugValue(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function isValidFileShareSlug(value) {
  return FILE_SHARE_SLUG_PATTERN.test(String(value || "").trim());
}

function stripFileShareExtension(name) {
  const value = String(name || "").trim();
  if (!value) {
    return "";
  }
  const dotIndex = value.lastIndexOf(".");
  if (dotIndex <= 0) {
    return value;
  }
  return value.slice(0, dotIndex);
}

function buildFileShareSlug(entry) {
  const normalized = normalizeMetadataFileEntry(entry);
  if (!normalized) {
    return "";
  }

  const stableName = stripFileShareExtension(normalized.name) || normalized.displayName || normalized.name;
  const slugBase = normalizeFileShareSlugValue(stableName) || "shared-file";
  const shortId = normalized.id.replace(/-/g, "").slice(0, 8);
  return shortId ? `${slugBase}-${shortId}` : slugBase;
}

function resolveSharedFileEntryBySlug(shareSlug) {
  const normalizedSlug = normalizeFileShareSlugValue(shareSlug);
  if (!isValidFileShareSlug(normalizedSlug)) {
    return null;
  }

  return readMetadataStore().find((entry) => buildFileShareSlug(entry) === normalizedSlug) || null;
}

function getFileShareDisplayName(entry) {
  const normalized = normalizeMetadataFileEntry(entry);
  if (!normalized) {
    return "Shared File";
  }
  return normalized.displayName || normalized.name || "Shared File";
}

function stripFileDescriptionForMeta(value) {
  return String(value || "")
    .replace(/\[(?:\/)?[a-z]+\]/gi, " ")
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateMetaText(value, maxChars = FILE_SHARE_META_MAX_CHARS) {
  const normalized = String(value || "").trim();
  if (!normalized || normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

function formatFileSizeForMeta(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size < 0) {
    return "";
  }
  if (size < 1024) {
    return `${Math.round(size)} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let value = size / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = value >= 10 ? 0 : 1;
  return `${value.toFixed(precision).replace(/\.0$/, "")} ${units[unitIndex]}`;
}

function resolveFileTypeForMeta(entry) {
  const normalized = normalizeMetadataFileEntry(entry);
  if (!normalized) {
    return "FILE";
  }

  for (const candidateName of [normalized.displayName, normalized.name]) {
    const extension = path.extname(String(candidateName || "")).replace(/^\./, "").trim();
    if (extension) {
      return extension.toUpperCase();
    }
  }

  const mimeType = String(normalized.mimeType || "").trim().toLowerCase();
  if (!mimeType || mimeType === "application/octet-stream") {
    return "FILE";
  }

  const friendlyMimeTypeLabels = {
    "application/x-msdownload": "EXE",
    "application/x-msdos-program": "EXE",
    "application/vnd.microsoft.portable-executable": "EXE",
    "application/zip": "ZIP",
    "application/x-zip-compressed": "ZIP",
    "application/x-rar-compressed": "RAR",
    "application/vnd.rar": "RAR",
    "application/x-7z-compressed": "7Z",
    "application/pdf": "PDF",
    "text/plain": "TXT",
    "text/csv": "CSV",
    "application/json": "JSON"
  };
  if (friendlyMimeTypeLabels[mimeType]) {
    return friendlyMimeTypeLabels[mimeType];
  }

  const [topLevelType] = mimeType.split("/");
  if (topLevelType === "image") {
    return "IMAGE";
  }
  if (topLevelType === "video") {
    return "VIDEO";
  }
  if (topLevelType === "audio") {
    return "AUDIO";
  }

  return mimeType.toUpperCase();
}

function formatFileMetaDate(value) {
  const timestamp = Date.parse(String(value || "").trim());
  if (!Number.isFinite(timestamp)) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(timestamp));
}

function buildSharedFileMetaTitle(entry) {
  const normalized = normalizeMetadataFileEntry(entry);
  if (!normalized) {
    return "Fallout Codex | Pip-Boy Terminal";
  }

  const statusPrefix = normalized.outdated
    ? "[OUTDATED] "
    : (normalized.caution ? "[WARNING] " : "");
  const title = `${statusPrefix}${getFileShareDisplayName(normalized)} | Fallout Codex File`;
  return truncateMetaText(title, 120);
}

function buildSharedFileMetaDescription(entry) {
  const normalized = normalizeMetadataFileEntry(entry);
  if (!normalized) {
    return "Shared Fallout Codex file.";
  }

  const summaryParts = [];
  const fileType = resolveFileTypeForMeta(normalized);
  const sizeLabel = formatFileSizeForMeta(normalized.size);
  const uploadedLabel = formatFileMetaDate(normalized.uploadedAt);
  const updatedLabel = formatFileMetaDate(normalized.contentUpdatedAt || normalized.updatedAt || normalized.uploadedAt);

  if (fileType) {
    summaryParts.push(fileType);
  }
  if (sizeLabel) {
    summaryParts.push(sizeLabel);
  }
  if (uploadedLabel && updatedLabel && uploadedLabel !== updatedLabel) {
    summaryParts.push(`Uploaded ${uploadedLabel}`);
    summaryParts.push(`Updated ${updatedLabel}`);
  } else if (updatedLabel) {
    summaryParts.push(`Uploaded/Updated ${updatedLabel}`);
  } else if (uploadedLabel) {
    summaryParts.push(`Uploaded ${uploadedLabel}`);
  }

  const summary = truncateMetaText(summaryParts.join(" - "), FILE_SHARE_META_SUMMARY_MAX_CHARS);
  return summary || "Shared Fallout Codex file.";
}

function buildFileSharePath(shareSlug) {
  const normalizedSlug = normalizeFileShareSlugValue(shareSlug);
  if (!isValidFileShareSlug(normalizedSlug)) {
    return FILE_SHARE_ROUTE_PREFIX;
  }
  return `${FILE_SHARE_ROUTE_PREFIX}${encodeURIComponent(normalizedSlug)}`;
}

function buildAbsoluteSiteUrl(req, pathname) {
  const baseUrl = getRequestBaseUrl(req);
  if (!baseUrl) {
    return "";
  }

  try {
    return new URL(String(pathname || "/"), `${baseUrl}/`).toString();
  } catch {
    return "";
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceOrInsertHeadTag(html, pattern, replacement) {
  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }
  return html.replace(/<\/head>/i, `${replacement}\n</head>`);
}

function upsertHeadMetaByName(html, name, content) {
  const tag = `  <meta name="${escapeHtml(name)}" content="${escapeHtml(content)}" />`;
  const pattern = new RegExp(`\\s*<meta\\b[^>]*\\bname=["']${escapeRegExp(name)}["'][^>]*>`, "i");
  return replaceOrInsertHeadTag(html, pattern, tag);
}

function upsertHeadMetaByProperty(html, property, content) {
  const tag = `  <meta property="${escapeHtml(property)}" content="${escapeHtml(content)}" />`;
  const pattern = new RegExp(`\\s*<meta\\b[^>]*\\bproperty=["']${escapeRegExp(property)}["'][^>]*>`, "i");
  return replaceOrInsertHeadTag(html, pattern, tag);
}

function removeHeadMetaByProperty(html, property) {
  const pattern = new RegExp(`\\s*<meta\\b[^>]*\\bproperty=["']${escapeRegExp(property)}["'][^>]*>`, "ig");
  return html.replace(pattern, "");
}

function upsertCanonicalLink(html, href) {
  const tag = `  <link rel="canonical" href="${escapeHtml(href)}" />`;
  const pattern = /<link\b[^>]*\brel=["']canonical["'][^>]*>/i;
  return replaceOrInsertHeadTag(html, pattern, tag);
}

function upsertDocumentTitle(html, title) {
  const tag = `  <title>${escapeHtml(title)}</title>`;
  return replaceOrInsertHeadTag(html, /<title>[\s\S]*?<\/title>/i, tag);
}

function buildSharedFilePreviewImageUrl(req, entry, shareSlug) {
  const normalized = normalizeMetadataFileEntry(entry);
  if (!normalized) {
    return buildAbsoluteSiteUrl(req, DEFAULT_SHARE_PREVIEW_IMAGE_PATH);
  }

  const imagePath = normalized.imageStoredName
    ? `${buildFileSharePath(shareSlug)}/image`
    : DEFAULT_SHARE_PREVIEW_IMAGE_PATH;
  return buildAbsoluteSiteUrl(req, imagePath);
}

function renderSharedFilePage(entry, req) {
  const normalized = normalizeMetadataFileEntry(entry);
  if (!normalized) {
    return INDEX_HTML_TEMPLATE;
  }

  const shareSlug = buildFileShareSlug(normalized);
  const shareUrl = buildAbsoluteSiteUrl(req, buildFileSharePath(shareSlug));
  const previewImageUrl = buildSharedFilePreviewImageUrl(req, normalized, shareSlug);
  const previewImageMimeType = normalized.imageStoredName
    ? (String(normalized.imageMimeType || "").trim() || "application/octet-stream")
    : "image/png";
  const previewImageAlt = `${getFileShareDisplayName(normalized)} preview`;
  const title = buildSharedFileMetaTitle(normalized);
  const description = buildSharedFileMetaDescription(normalized);

  let html = INDEX_HTML_TEMPLATE;
  html = upsertDocumentTitle(html, title);
  html = upsertHeadMetaByName(html, "description", description);
  html = upsertHeadMetaByProperty(html, "og:title", title);
  html = upsertHeadMetaByProperty(html, "og:description", description);
  html = upsertHeadMetaByProperty(html, "og:type", "website");
  if (shareUrl) {
    html = upsertHeadMetaByProperty(html, "og:url", shareUrl);
    html = upsertCanonicalLink(html, shareUrl);
  }
  if (previewImageUrl) {
    html = upsertHeadMetaByProperty(html, "og:image", previewImageUrl);
    if (previewImageUrl.startsWith("https://")) {
      html = upsertHeadMetaByProperty(html, "og:image:secure_url", previewImageUrl);
    } else {
      html = removeHeadMetaByProperty(html, "og:image:secure_url");
    }
    html = upsertHeadMetaByProperty(html, "og:image:type", previewImageMimeType);
    html = upsertHeadMetaByProperty(html, "og:image:alt", previewImageAlt);
    html = upsertHeadMetaByName(html, "twitter:image", previewImageUrl);
  }
  html = removeHeadMetaByProperty(html, "og:image:width");
  html = removeHeadMetaByProperty(html, "og:image:height");
  html = upsertHeadMetaByName(html, "twitter:card", "summary_large_image");
  html = upsertHeadMetaByName(html, "twitter:title", title);
  html = upsertHeadMetaByName(html, "twitter:description", description);
  html = upsertHeadMetaByName(html, "robots", "noindex");
  return html;
}

function sendStoredFileImage(res, entry) {
  const normalized = normalizeMetadataFileEntry(entry);
  if (!normalized) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  const imageStoredName = String(normalized.imageStoredName || "").trim();
  if (!imageStoredName) {
    res.status(404).json({ error: "Image not found" });
    return;
  }

  const storedPath = resolveUploadStoredPath(imageStoredName);
  if (!storedPath) {
    res.status(400).json({ error: "Invalid storage path" });
    return;
  }
  if (!fs.existsSync(storedPath)) {
    res.status(404).json({ error: "Image blob not found" });
    return;
  }

  const safeImageName = sanitizeDisplayFilename(normalized.imageName || `${normalized.name || "image"}.png`) || "image.png";
  const quotedImageName = safeImageName.replace(/"/g, "");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Disposition", `inline; filename="${quotedImageName}"`);
  res.type(normalized.imageMimeType || "application/octet-stream");
  res.sendFile(storedPath);
}

function getTempShareById(shareId) {
  const normalizedShareId = String(shareId || "").trim().toLowerCase();
  if (!FILE_ID_PATTERN.test(normalizedShareId)) {
    return null;
  }
  return getActiveTempShareEntries().find((entry) => entry.id === normalizedShareId) || null;
}

function resolveTempShareBySlug(shareSlug) {
  const normalizedSlug = normalizeTempShareSlugValue(shareSlug);
  if (!isValidTempShareSlug(normalizedSlug)) {
    return null;
  }
  return getActiveTempShareEntries().find((entry) => buildTempShareSlug(entry) === normalizedSlug) || null;
}

function updateTempShareEntryById(shareId, updater) {
  const normalizedShareId = String(shareId || "").trim().toLowerCase();
  if (!FILE_ID_PATTERN.test(normalizedShareId)) {
    return { ok: false, reason: "invalid_id" };
  }
  if (typeof updater !== "function") {
    return { ok: false, reason: "invalid_updater" };
  }
  if (!tryLockTempShareMutation(normalizedShareId)) {
    return { ok: false, reason: "busy" };
  }

  try {
    const entries = getActiveTempShareEntries();
    const index = entries.findIndex((entry) => entry.id === normalizedShareId);
    if (index < 0) {
      return { ok: false, reason: "not_found" };
    }

    const currentEntry = entries[index];
    const nextEntryCandidate = updater(currentEntry);
    if (nextEntryCandidate == null) {
      entries.splice(index, 1);
      writeTempShareStore(entries);
      deleteStoredTempShareUpload(currentEntry.storedName);
      return { ok: true, removed: true, entry: currentEntry };
    }

    const normalizedNextEntry = normalizeTempShareEntry(nextEntryCandidate);
    if (!normalizedNextEntry) {
      return { ok: false, reason: "invalid_entry" };
    }

    entries[index] = normalizedNextEntry;
    writeTempShareStore(entries);
    return {
      ok: true,
      removed: false,
      entry: normalizedNextEntry,
      previous: currentEntry
    };
  } finally {
    unlockTempShareMutation(normalizedShareId);
  }
}

function deleteTempShareById(shareId) {
  return updateTempShareEntryById(shareId, () => null);
}

async function computeFileSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", (chunk) => {
      hash.update(chunk);
    });
    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });
  });
}

function virusTotalConfigured() {
  return Boolean(VT_API_KEY);
}

async function requestVirusTotal(targetPath, options = {}) {
  if (!virusTotalConfigured()) {
    const error = new Error("VirusTotal is not configured on the server.");
    error.status = 503;
    throw error;
  }

  const targetUrl = /^https?:\/\//i.test(String(targetPath || ""))
    ? String(targetPath || "")
    : `${VT_API_BASE_URL}${String(targetPath || "")}`;

  const headers = {
    "x-apikey": VT_API_KEY,
    Accept: "application/json",
    ...(options.headers && typeof options.headers === "object" ? options.headers : {})
  };
  const requestOptions = {
    method: String(options.method || "GET").trim().toUpperCase() || "GET",
    headers,
    cache: "no-store"
  };
  if (Object.prototype.hasOwnProperty.call(options, "body")) {
    requestOptions.body = options.body;
  }

  let response;
  try {
    response = await fetch(targetUrl, requestOptions);
  } catch (error) {
    const nextError = new Error("VirusTotal is unreachable right now.");
    nextError.status = 502;
    nextError.cause = error;
    throw nextError;
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = new Error(
      payload?.error?.message
      || payload?.error
      || payload?.message
      || `VirusTotal HTTP ${response.status}`
    );
    error.status = response.status;
    throw error;
  }

  return payload || {};
}

function buildTempShareVirusStateFromStats(stats, overrides = {}) {
  const normalizedStats = normalizeTempShareVirusStats(stats);
  const flaggedCount = normalizedStats.malicious + normalizedStats.suspicious;
  const completedAt = new Date().toISOString();
  return {
    status: flaggedCount > 0 ? TEMP_SHARE_VIRUS_STATUS.FLAGGED : TEMP_SHARE_VIRUS_STATUS.CLEAN,
    stats: normalizedStats,
    lastCheckedAt: completedAt,
    completedAt,
    lastError: "",
    ...overrides
  };
}

async function submitTempShareVirusTotalUpload(entry) {
  const storedPath = resolveTempShareStoredPath(entry.storedName);
  if (!storedPath || !fs.existsSync(storedPath)) {
    return updateTempShareEntryById(entry.id, (currentEntry) => ({
      ...currentEntry,
      virusTotal: {
        ...currentEntry.virusTotal,
        status: TEMP_SHARE_VIRUS_STATUS.ERROR,
        lastCheckedAt: new Date().toISOString(),
        lastError: "Stored file could not be found for scanning."
      }
    }));
  }

  const sha256 = String(entry.virusTotal?.sha256 || "").trim().toLowerCase();
  if (sha256) {
    try {
      const fileReport = await requestVirusTotal(`/files/${encodeURIComponent(sha256)}`);
      const stats = fileReport?.data?.attributes?.last_analysis_stats;
      if (stats && typeof stats === "object") {
        return updateTempShareEntryById(entry.id, (currentEntry) => ({
          ...currentEntry,
          virusTotal: {
            ...currentEntry.virusTotal,
            sha256,
            permalink: buildVirusTotalPermalink(sha256),
            ...buildTempShareVirusStateFromStats(stats)
          }
        }));
      }
    } catch (error) {
      if (Number(error?.status) !== 404) {
        const recoverable = Number(error?.status) === 429 || Number(error?.status) >= 500;
        return updateTempShareEntryById(entry.id, (currentEntry) => ({
          ...currentEntry,
          virusTotal: {
            ...currentEntry.virusTotal,
            status: recoverable ? TEMP_SHARE_VIRUS_STATUS.QUEUED : TEMP_SHARE_VIRUS_STATUS.ERROR,
            lastCheckedAt: new Date().toISOString(),
            lastError: String(error?.message || "VirusTotal lookup failed.")
          }
        }));
      }
    }
  }

  try {
    const formData = new FormData();
    const fileBlob = typeof fs.openAsBlob === "function"
      ? await fs.openAsBlob(storedPath, { type: entry.mimeType || "application/octet-stream" })
      : new Blob(
          [await fs.promises.readFile(storedPath)],
          { type: entry.mimeType || "application/octet-stream" }
        );
    formData.append(
      "file",
      fileBlob,
      entry.name
    );

    const uploadTarget = entry.size > TEMP_SHARE_VT_DIRECT_UPLOAD_MAX_FILE_BYTES
      ? String((await requestVirusTotal("/files/upload_url"))?.data || "").trim()
      : "/files";
    if (!uploadTarget) {
      throw new Error("VirusTotal did not return an upload URL.");
    }

    const payload = await requestVirusTotal(uploadTarget, {
      method: "POST",
      body: formData
    });
    const analysisId = String(payload?.data?.id || "").trim();
    if (!analysisId) {
      throw new Error("VirusTotal did not return an analysis id.");
    }

    return updateTempShareEntryById(entry.id, (currentEntry) => ({
      ...currentEntry,
      virusTotal: {
        ...currentEntry.virusTotal,
        status: TEMP_SHARE_VIRUS_STATUS.PENDING,
        analysisId,
        lastCheckedAt: new Date().toISOString(),
        lastError: ""
      }
    }));
  } catch (error) {
    const recoverable = Number(error?.status) === 429 || Number(error?.status) >= 500;
    return updateTempShareEntryById(entry.id, (currentEntry) => ({
      ...currentEntry,
      virusTotal: {
        ...currentEntry.virusTotal,
        status: recoverable ? TEMP_SHARE_VIRUS_STATUS.QUEUED : TEMP_SHARE_VIRUS_STATUS.ERROR,
        lastCheckedAt: new Date().toISOString(),
        lastError: String(error?.message || "VirusTotal upload failed.")
      }
    }));
  }
}

async function pollTempShareVirusTotalAnalysis(entry) {
  const analysisId = String(entry?.virusTotal?.analysisId || "").trim();
  if (!analysisId) {
    return updateTempShareEntryById(entry.id, (currentEntry) => ({
      ...currentEntry,
      virusTotal: {
        ...currentEntry.virusTotal,
        status: TEMP_SHARE_VIRUS_STATUS.ERROR,
        lastCheckedAt: new Date().toISOString(),
        lastError: "VirusTotal analysis id is missing."
      }
    }));
  }

  try {
    const payload = await requestVirusTotal(`/analyses/${encodeURIComponent(analysisId)}`);
    const attributes = payload?.data?.attributes && typeof payload.data.attributes === "object"
      ? payload.data.attributes
      : {};
    const status = String(attributes.status || "").trim().toLowerCase();
    const stats = attributes.stats;

    if (status === "completed" && stats && typeof stats === "object") {
      return updateTempShareEntryById(entry.id, (currentEntry) => ({
        ...currentEntry,
        virusTotal: {
          ...currentEntry.virusTotal,
          ...buildTempShareVirusStateFromStats(stats, {
            analysisId: "",
            sha256: currentEntry.virusTotal.sha256,
            permalink: buildVirusTotalPermalink(currentEntry.virusTotal.sha256)
          })
        }
      }));
    }

    return updateTempShareEntryById(entry.id, (currentEntry) => ({
      ...currentEntry,
      virusTotal: {
        ...currentEntry.virusTotal,
        status: TEMP_SHARE_VIRUS_STATUS.PENDING,
        lastCheckedAt: new Date().toISOString(),
        lastError: ""
      }
    }));
  } catch (error) {
    const recoverable = Number(error?.status) === 429 || Number(error?.status) >= 500;
    return updateTempShareEntryById(entry.id, (currentEntry) => ({
      ...currentEntry,
      virusTotal: {
        ...currentEntry.virusTotal,
        status: recoverable ? TEMP_SHARE_VIRUS_STATUS.PENDING : TEMP_SHARE_VIRUS_STATUS.ERROR,
        lastCheckedAt: new Date().toISOString(),
        lastError: String(error?.message || "VirusTotal analysis lookup failed.")
      }
    }));
  }
}

let tempShareVirusWorkerBusy = false;

async function tickTempShareVirusScans() {
  if (!virusTotalConfigured() || tempShareVirusWorkerBusy) {
    return;
  }

  const activeEntries = getActiveTempShareEntries();
  const nextEntry = activeEntries.find((entry) => {
    const status = normalizeTempShareVirusStatus(entry?.virusTotal?.status);
    return status === TEMP_SHARE_VIRUS_STATUS.QUEUED || status === TEMP_SHARE_VIRUS_STATUS.PENDING;
  });
  if (!nextEntry) {
    return;
  }

  tempShareVirusWorkerBusy = true;
  try {
    if (normalizeTempShareVirusStatus(nextEntry.virusTotal.status) === TEMP_SHARE_VIRUS_STATUS.QUEUED) {
      await submitTempShareVirusTotalUpload(nextEntry);
      return;
    }
    await pollTempShareVirusTotalAnalysis(nextEntry);
  } finally {
    tempShareVirusWorkerBusy = false;
  }
}

function getTempSharePublicPath(entry) {
  const slug = buildTempShareSlug(entry);
  return slug ? `${TEMP_SHARE_ROUTE_PREFIX}${encodeURIComponent(slug)}` : TEMP_SHARE_ROUTE_PREFIX;
}

function resolveTempSharePreviewKind(entry) {
  const normalized = normalizeTempShareEntry(entry);
  if (!normalized) {
    return "";
  }

  const mimeType = String(normalized.mimeType || "").trim().toLowerCase();
  if (/^image\/(?:png|jpeg|gif|webp|bmp|avif|x-icon|vnd\.microsoft\.icon)$/i.test(mimeType)) {
    return "image";
  }
  if (/^audio\//i.test(mimeType)) {
    return "audio";
  }
  if (/^video\//i.test(mimeType)) {
    return "video";
  }
  if (mimeType === "application/pdf") {
    return "pdf";
  }
  if (
    /^text\//i.test(mimeType)
    || mimeType === "application/json"
    || mimeType === "application/xml"
    || mimeType === "text/xml"
  ) {
    return "text";
  }
  if (mimeType === "application/zip" || mimeType === "application/x-zip-compressed") {
    return "zip";
  }
  if (
    mimeType === "application/vnd.rar"
    || mimeType === "application/x-rar-compressed"
    || mimeType === "application/x-rar"
  ) {
    return "rar";
  }
  const ext = String(normalized.name || "").toLowerCase().trim().split(".").pop();
  if (ext === "rar") return "rar";
  if (ext === "zip") return "zip";
  return "";
}

const MAX_ZIP_LIST_ENTRIES = 300;

async function listZipContents(filePath) {
  const EOCD_SIG = 0x06054b50;
  const CD_SIG = 0x02014b50;
  const EOCD_SIZE = 22;
  const MAX_SEARCH = Math.min(EOCD_SIZE + 65535, 1 << 20);

  let fd;
  try {
    fd = await fs.promises.open(filePath, "r");
    const { size } = await fd.stat();
    if (size < EOCD_SIZE) {
      return null;
    }

    const searchLen = Math.min(MAX_SEARCH, size);
    const tail = Buffer.allocUnsafe(searchLen);
    await fd.read(tail, 0, searchLen, size - searchLen);

    let eocdPos = -1;
    for (let i = tail.length - EOCD_SIZE; i >= 0; i--) {
      if (tail.readUInt32LE(i) === EOCD_SIG) {
        eocdPos = i;
        break;
      }
    }
    if (eocdPos < 0) {
      return null;
    }

    const cdEntryCount = tail.readUInt16LE(eocdPos + 10);
    const cdSize = tail.readUInt32LE(eocdPos + 12);
    const cdOffset = tail.readUInt32LE(eocdPos + 16);

    if (cdOffset + cdSize > size || cdSize > 32 * 1024 * 1024) {
      return null;
    }

    const cd = Buffer.allocUnsafe(cdSize);
    await fd.read(cd, 0, cdSize, cdOffset);

    const entries = [];
    let pos = 0;
    for (let i = 0; i < cdEntryCount && pos + 46 <= cd.length; i++) {
      if (cd.readUInt32LE(pos) !== CD_SIG) {
        break;
      }
      const uncompressedSize = cd.readUInt32LE(pos + 24);
      const nameLen = cd.readUInt16LE(pos + 28);
      const extraLen = cd.readUInt16LE(pos + 30);
      const commentLen = cd.readUInt16LE(pos + 32);
      const name = cd.slice(pos + 46, pos + 46 + nameLen).toString("utf8");
      if (!name.endsWith("/")) {
        entries.push({ name, size: uncompressedSize });
      }
      pos += 46 + nameLen + extraLen + commentLen;
      if (entries.length >= MAX_ZIP_LIST_ENTRIES) {
        break;
      }
    }

    return { entries, totalCount: cdEntryCount };
  } catch {
    return null;
  } finally {
    try {
      await fd?.close();
    } catch {}
  }
}

const MAX_RAR_LIST_ENTRIES = 300;

async function listRarContents(filePath) {
  let fd;
  try {
    fd = await fs.promises.open(filePath, "r");
    const { size } = await fd.stat();
    if (size < 8) return null;

    const sigBuf = Buffer.allocUnsafe(8);
    await fd.read(sigBuf, 0, 8, 0);

    const RAR4_SIG = Buffer.from([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00]);
    const RAR5_SIG = Buffer.from([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00]);

    const isRar5 = sigBuf.slice(0, 8).equals(RAR5_SIG);
    const isRar4 = !isRar5 && sigBuf.slice(0, 7).equals(RAR4_SIG);
    if (!isRar4 && !isRar5) return null;

    const entries = [];
    let totalCount = 0;

    if (isRar4) {
      // RAR4: fixed-size block headers at offset 7
      // Block header: CRC(2) Type(1) Flags(2) Size(2) [AddSize(4) if flags&0x8000]
      // File header type: 0x74
      // File block: after base header: PackSize(4) UnpSize(4) HostOS(1) CRC(4) DateTime(4) UnpVer(1) Method(1) NameLen(2) Attr(4) [HiPack(4) HiUnp(4) if flags&0x100]
      const CHUNK = 65536;
      const buf = Buffer.allocUnsafe(CHUNK);
      let pos = 7;

      while (pos + 7 <= size) {
        const headerBuf = Buffer.allocUnsafe(11);
        const { bytesRead: hRead } = await fd.read(headerBuf, 0, 11, pos);
        if (hRead < 7) break;

        const type = headerBuf[2];
        const flags = headerBuf.readUInt16LE(3);
        const headSize = headerBuf.readUInt16LE(5);
        if (headSize < 7) break;

        let addSize = 0;
        if ((flags & 0x8000) && hRead >= 11) {
          addSize = headerBuf.readUInt32LE(7);
        }

        if (type === 0x74 && headSize >= 32) {
          // File header
          const fhBuf = Buffer.allocUnsafe(headSize);
          const { bytesRead: fhRead } = await fd.read(fhBuf, 0, headSize, pos);
          if (fhRead < 32) break;

          let unpSize = fhBuf.readUInt32LE(10);
          const nameLen = fhBuf.readUInt16LE(26);
          const fileFlags = fhBuf.readUInt16LE(3);
          let dataOffset = 32;

          if ((fileFlags & 0x100) && fhRead >= 36) {
            // High parts of pack/unpack size
            const hiUnp = fhBuf.readUInt32LE(dataOffset + 4);
            unpSize = (BigInt(hiUnp) * 0x100000000n + BigInt(unpSize));
            dataOffset += 8;
          }

          const nameEnd = Math.min(dataOffset + nameLen, fhRead);
          const name = fhBuf.slice(dataOffset, nameEnd).toString("latin1");
          const isDir = (fileFlags & 0x20) !== 0 || name.endsWith("\\") || name.endsWith("/");

          if (!isDir) {
            totalCount++;
            if (entries.length < MAX_RAR_LIST_ENTRIES) {
              entries.push({ name: name.replace(/\\/g, "/"), size: Number(unpSize) });
            }
          }
        } else if (type === 0x73 && headSize === 13) {
          // Archive header — skip
        } else if (type === 0x7b) {
          // End of archive
          break;
        }

        const blockTotal = headSize + addSize;
        if (blockTotal <= 0) break;
        pos += blockTotal;
      }
    } else {
      // RAR5: vint-based block headers at offset 8
      // Vint: 7 bits per byte, LSB first, high bit = continuation
      function readVint(buf, offset) {
        let value = 0n;
        let shift = 0n;
        let i = offset;
        while (i < buf.length) {
          const byte = buf[i++];
          value |= BigInt(byte & 0x7f) << shift;
          shift += 7n;
          if (!(byte & 0x80)) break;
          if (shift >= 63n) break;
        }
        return { value, next: i };
      }

      const HEADER_BUF_SIZE = 256;
      let pos = 8;

      while (pos < size) {
        const hBuf = Buffer.allocUnsafe(HEADER_BUF_SIZE);
        const { bytesRead } = await fd.read(hBuf, 0, HEADER_BUF_SIZE, pos);
        if (bytesRead < 4) break;

        // Header CRC32 (4 bytes) then vint header_size, vint header_type, vint flags
        let cur = 4;
        const hsz = readVint(hBuf, cur);
        cur = hsz.next;
        const htype = readVint(hBuf, cur);
        cur = htype.next;
        const hflags = readVint(hBuf, cur);
        cur = hflags.next;

        const headerSize = Number(hsz.value);
        const headerType = Number(htype.value);
        const headerFlags = Number(hflags.value);

        if (headerSize <= 0 || headerSize > 4 * 1024 * 1024) break;

        // Read the full block header so we can parse extra_area_size and data_size.
        // RAR5 HEADER_FLAGS common bits:
        //   0x0001 = extra area present  → extra_area_size vint follows HEADER_FLAGS
        //   0x0002 = data area present   → data_area_size vint follows (after extra_area_size if 0x0001)
        // These two optional vints always come immediately after HEADER_FLAGS (in that order),
        // before any block-type-specific fields.
        const fullHdr = Buffer.allocUnsafe(Math.min(hsz.next + headerSize + 16, size - pos));
        const { bytesRead: fhRead } = await fd.read(fullHdr, 0, fullHdr.length, pos);

        let c = cur; // points to first byte after HEADER_FLAGS within fullHdr
        let extraAreaSize = 0n;
        let dataSize = 0n;

        if (headerFlags & 0x0001) {
          const esz = readVint(fullHdr, c);
          extraAreaSize = esz.value;
          c = esz.next;
        }
        if (headerFlags & 0x0002) {
          const dsz = readVint(fullHdr, c);
          dataSize = dsz.value;
          c = dsz.next;
        }

        // Block type 5 = end of archive
        if (headerType === 5) break;

        // Block type 2 = file block
        if (headerType === 2) {
          // c now points to the first type-specific field: FILE_FLAGS
          const ff = readVint(fullHdr, c); c = ff.next;
          const fileFlags = Number(ff.value);
          const us = readVint(fullHdr, c); c = us.next;
          const unpSize = us.value;
          const at = readVint(fullHdr, c); c = at.next;
          if (fileFlags & 0x002) c += 4; // mtime
          if (fileFlags & 0x004) c += 4; // file CRC32
          const ci = readVint(fullHdr, c); c = ci.next; // compression info
          const ho = readVint(fullHdr, c); c = ho.next; // host OS
          const nl = readVint(fullHdr, c); c = nl.next; // name length
          const nameLen = Number(nl.value);
          const nameEnd = Math.min(c + nameLen, fhRead);
          const name = fullHdr.slice(c, nameEnd).toString("utf8");
          const isDir = (fileFlags & 0x0001) !== 0;

          if (!isDir && name) {
            totalCount++;
            if (entries.length < MAX_RAR_LIST_ENTRIES) {
              entries.push({ name, size: Number(unpSize) });
            }
          }
        }

        const blockTotal = hsz.next + headerSize + Number(dataSize);
        if (blockTotal <= 0) break;
        pos += blockTotal;
      }
    }

    if (entries.length === 0 && totalCount === 0) return null;
    return { entries, totalCount };
  } catch {
    return null;
  } finally {
    try { await fd?.close(); } catch {}
  }
}

async function readTempShareTextPreview(entry) {
  const normalized = normalizeTempShareEntry(entry);
  if (!normalized) {
    return { text: "", truncated: false };
  }

  const storedPath = resolveTempShareStoredPath(normalized.storedName);
  if (!storedPath || !fs.existsSync(storedPath)) {
    return { text: "", truncated: false };
  }

  const fileHandle = await fs.promises.open(storedPath, "r");
  try {
    const buffer = Buffer.alloc(TEMP_SHARE_TEXT_PREVIEW_MAX_BYTES + 1);
    const { bytesRead } = await fileHandle.read(buffer, 0, buffer.length, 0);
    const slice = buffer.subarray(0, Math.min(bytesRead, TEMP_SHARE_TEXT_PREVIEW_MAX_BYTES));
    return {
      text: slice.toString("utf8"),
      truncated: bytesRead > TEMP_SHARE_TEXT_PREVIEW_MAX_BYTES
    };
  } finally {
    await fileHandle.close();
  }
}

function formatTempSharePublicDate(value) {
  const timestamp = Date.parse(String(value || "").trim());
  if (!Number.isFinite(timestamp)) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(timestamp));
}

function buildTempShareVirusBadge(entry) {
  const status = normalizeTempShareVirusStatus(entry?.virusTotal?.status);
  const stats = normalizeTempShareVirusStats(entry?.virusTotal?.stats);
  const detected = stats.malicious + stats.suspicious;

  if (status === TEMP_SHARE_VIRUS_STATUS.CLEAN) {
    return {
      kind: "safe",
      title: "VT SAFE",
      body: `${detected} detections reported`
    };
  }
  if (status === TEMP_SHARE_VIRUS_STATUS.FLAGGED) {
    return {
      kind: "flagged",
      title: "VT FLAGGED",
      body: `${detected} detections reported`
    };
  }
  if (status === TEMP_SHARE_VIRUS_STATUS.PENDING || status === TEMP_SHARE_VIRUS_STATUS.QUEUED) {
    return {
      kind: "pending",
      title: "VT SCANNING",
      body: "Analysis in progress"
    };
  }
  if (status === TEMP_SHARE_VIRUS_STATUS.ERROR) {
    return {
      kind: "error",
      title: "VT ERROR",
      body: "Scan status unavailable"
    };
  }
  if (status === TEMP_SHARE_VIRUS_STATUS.SKIPPED) {
    return {
      kind: "muted",
      title: "VT SKIPPED",
      body: "Scan skipped"
    };
  }
  return {
    kind: "muted",
    title: "VT UNCHECKED",
    body: "Not scanned"
  };
}

// ── i18n strings for public-facing drop pages ──────────────────────────────
const DROP_I18N = {
  en: {
    htmlLang: "en",
    badge: "TEMPORARY SHARE",
    kicker: "PUBLIC FILE DROP",
    labelFileType: "FILE TYPE",
    labelFileSize: "FILE SIZE",
    labelUploaded: "UPLOADED",
    labelExpires: "EXPIRES",
    labelDownloads: "DOWNLOADS",
    labelVt: "VIRUSTOTAL",
    btnVtReport: "OPEN VT REPORT",
    btnDownload: "DOWNLOAD FILE",
    btnOpenTab: "OPEN IN TAB",
    downloadLimitOnly: "Download limit only",
    expired: "Expired",
    downloadsUsedSuffix: " used",
    vtNote: "VirusTotal badges describe scan results, not a guarantee of safety. If anything looks off, treat the file with caution.",
    noPreviewMsg: "No preview available for this file type.",
    noPreviewHint: "Use the download button to access the file.",
    previewTruncated: "[preview truncated]",
    archiveContents: "ARCHIVE CONTENTS",
    zipUnreadable: "ZIP contents could not be read.",
    rarUnreadable: "RAR contents could not be read.",
    zipColName: "Name",
    zipColSize: "Size",
    zipCount: (n) => `${n} ${n === 1 ? "file" : "files"}`,
    zipTruncated: (shown, total) => `Showing ${shown} of ${total} entries`,
    unavailTitle: "Temporary Share Unavailable",
    unavailStatusLabel: "LINK OFFLINE",
    unavailMessage: "This temporary share is missing or has expired.",
    unavailBusyMessage: "This temporary share is missing, expired, or has already reached its download limit.",
    unavailFileMissingTitle: "Temporary Share File Missing",
    unavailFileMissingStatus: "FILE REMOVED",
    unavailFileMissingMessage: "The share record still existed, but the stored file could not be found anymore.",
    unavailErrorTitle: "Temporary Share Error",
    unavailErrorStatus: "RENDER FAILURE",
    unavailErrorMessage: "The share exists, but the preview page could not be rendered right now.",
    limitEyebrow: "DOWNLOAD LIMIT REACHED",
    limitTitle: "Download Limit Reached",
    limitMessage: "This file has reached its maximum number of allowed downloads and is no longer available for download.",
    limitHintLabel: "What to do",
    limitHint: "If you still need access to this file, please contact whoever shared this link with you and ask them to create a new share."
  },
  es: {
    htmlLang: "es",
    badge: "ENLACE TEMPORAL",
    kicker: "ARCHIVO PÚBLICO",
    labelFileType: "TIPO DE ARCHIVO",
    labelFileSize: "TAMAÑO",
    labelUploaded: "SUBIDO",
    labelExpires: "EXPIRA",
    labelDownloads: "DESCARGAS",
    labelVt: "VIRUSTOTAL",
    btnVtReport: "VER REPORTE VT",
    btnDownload: "DESCARGAR ARCHIVO",
    btnOpenTab: "ABRIR EN PESTAÑA",
    downloadLimitOnly: "Solo límite de descargas",
    expired: "Expirado",
    downloadsUsedSuffix: " usadas",
    vtNote: "Los badges de VirusTotal muestran los resultados del análisis, no garantizan la seguridad del archivo. Si algo parece sospechoso, procede con precaución.",
    noPreviewMsg: "No hay vista previa disponible para este tipo de archivo.",
    noPreviewHint: "Usa el botón de descarga para acceder al archivo.",
    previewTruncated: "[vista previa recortada]",
    archiveContents: "CONTENIDO DEL ARCHIVO",
    zipUnreadable: "No se pudo leer el contenido del ZIP.",
    rarUnreadable: "No se pudo leer el contenido del RAR.",
    zipColName: "Nombre",
    zipColSize: "Tamaño",
    zipCount: (n) => `${n} ${n === 1 ? "archivo" : "archivos"}`,
    zipTruncated: (shown, total) => `Mostrando ${shown} de ${total} entradas`,
    unavailTitle: "Enlace temporal no disponible",
    unavailStatusLabel: "ENLACE OFFLINE",
    unavailMessage: "Este enlace temporal no existe o ha expirado.",
    unavailBusyMessage: "Este enlace temporal no existe, ha expirado o ya alcanzó su límite de descargas.",
    unavailFileMissingTitle: "Archivo temporal no encontrado",
    unavailFileMissingStatus: "ARCHIVO ELIMINADO",
    unavailFileMissingMessage: "El registro del enlace existía, pero el archivo almacenado ya no se puede encontrar.",
    unavailErrorTitle: "Error en el enlace temporal",
    unavailErrorStatus: "ERROR DE RENDERIZADO",
    unavailErrorMessage: "El enlace existe, pero no se pudo generar la página de vista previa en este momento.",
    limitEyebrow: "LÍMITE DE DESCARGAS ALCANZADO",
    limitTitle: "Límite de Descargas Alcanzado",
    limitMessage: "Este archivo alcanzó el número máximo de descargas permitidas y ya no está disponible.",
    limitHintLabel: "¿Qué hacer?",
    limitHint: "Si aún necesitas acceso a este archivo, contacta a quien te compartió el enlace y pídele que cree un nuevo envío."
  }
};

function getDropI18n(lang) {
  return DROP_I18N[lang] || DROP_I18N.en;
}

async function renderTempSharePublicPage(entry, req) {
  const normalized = normalizeTempShareEntry(entry);
  if (!normalized) {
    return "";
  }

  const t = getDropI18n(normalized.lang);
  const previewKind = resolveTempSharePreviewKind(normalized);
  const publicPath = getTempSharePublicPath(normalized);
  const contentPath = `${publicPath}/content`;
  const downloadPath = `${publicPath}/download`;
  const absolutePageUrl = buildAbsoluteSiteUrl(req, publicPath);
  const absolutePreviewImageUrl = previewKind === "image"
    ? buildAbsoluteSiteUrl(req, contentPath)
    : buildAbsoluteSiteUrl(req, DEFAULT_SHARE_PREVIEW_IMAGE_PATH);
  const title = `${normalized.displayName || normalized.name} | Fallout Codex Drop`;
  const descriptionSource = stripFileDescriptionForMeta(normalized.description)
    || `${resolveTempShareFileTypeLabel(normalized)} • ${formatFileSizeForMeta(normalized.size)} • Temporary share`;
  const description = truncateMetaText(descriptionSource, 160);
  const virusBadge = buildTempShareVirusBadge(normalized);
  const vtLink = String(normalized.virusTotal?.permalink || "").trim();

  const isPending = virusBadge.kind === "pending";
  const statusApiPath = `${publicPath}/status`;

  let previewMarkup = `<div class="drop-preview-empty"><span class="drop-preview-empty-icon">&#9632;</span><span>${escapeHtml(t.noPreviewMsg)}</span><span class="drop-preview-empty-hint">${escapeHtml(t.noPreviewHint)}</span></div>`;
  if (previewKind === "image") {
    previewMarkup = `<img class="drop-preview-media" src="${escapeHtml(contentPath)}" alt="${escapeHtml(normalized.displayName || normalized.name)}" loading="lazy" decoding="async" />`;
  } else if (previewKind === "audio") {
    previewMarkup = `<audio class="drop-preview-audio" controls preload="metadata" src="${escapeHtml(contentPath)}"></audio>`;
  } else if (previewKind === "video") {
    previewMarkup = `<video class="drop-preview-video" controls preload="metadata" src="${escapeHtml(contentPath)}"></video>`;
  } else if (previewKind === "pdf") {
    previewMarkup = `<iframe class="drop-preview-frame" src="${escapeHtml(contentPath)}" title="${escapeHtml(normalized.displayName || normalized.name)} preview"></iframe>`;
  } else if (previewKind === "text") {
    const preview = await readTempShareTextPreview(normalized);
    previewMarkup = `<pre class="drop-preview-text">${escapeHtml(preview.text)}${preview.truncated ? `\n\n${escapeHtml(t.previewTruncated)}` : ""}</pre>`;
  } else if (previewKind === "zip") {
    const storedPath = resolveTempShareStoredPath(normalized.storedName);
    const zipData = storedPath ? await listZipContents(storedPath) : null;
    if (zipData && zipData.entries.length > 0) {
      const rows = zipData.entries.map((e) => {
        const parts = e.name.split("/");
        const depth = parts.length - 1;
        const displayName = parts[parts.length - 1];
        const indent = Math.min(depth * 16, 64);
        const ext = displayName.includes(".") ? displayName.split(".").pop().toLowerCase() : "";
        return `<tr><td class="zip-name" style="--zip-depth-indent:${indent}px"><div class="zip-name-wrap"><span class="zip-ext" data-ext="${escapeHtml(ext)}">${escapeHtml(ext.toUpperCase() || "FILE")}</span><span class="zip-name-label">${escapeHtml(displayName)}</span></div></td><td class="zip-size">${escapeHtml(formatFileSizeForMeta(e.size) || "0 B")}</td></tr>`;
      }).join("");
      const truncNote = zipData.totalCount > MAX_ZIP_LIST_ENTRIES
        ? `<p class="zip-truncated">${escapeHtml(t.zipTruncated(MAX_ZIP_LIST_ENTRIES, zipData.totalCount))}</p>`
        : "";
      previewMarkup = `<div class="drop-preview-zip"><div class="zip-header"><span class="zip-header-label">${escapeHtml(t.archiveContents)}</span><span class="zip-header-count">${escapeHtml(t.zipCount(zipData.entries.length))}</span></div><div class="zip-scroll"><table class="zip-table"><thead><tr><th>${escapeHtml(t.zipColName)}</th><th>${escapeHtml(t.zipColSize)}</th></tr></thead><tbody>${rows}</tbody></table></div>${truncNote}</div>`;
    } else {
      previewMarkup = `<div class="drop-preview-empty"><span class="drop-preview-empty-icon">&#9632;</span><span>${escapeHtml(t.zipUnreadable)}</span></div>`;
    }
  } else if (previewKind === "rar") {
    const storedPath = resolveTempShareStoredPath(normalized.storedName);
    const rarData = storedPath ? await listRarContents(storedPath) : null;
    if (rarData && rarData.entries.length > 0) {
      const rows = rarData.entries.map((e) => {
        const parts = e.name.split("/");
        const depth = parts.length - 1;
        const displayName = parts[parts.length - 1];
        const indent = Math.min(depth * 16, 64);
        const ext = displayName.includes(".") ? displayName.split(".").pop().toLowerCase() : "";
        return `<tr><td class="zip-name" style="--zip-depth-indent:${indent}px"><div class="zip-name-wrap"><span class="zip-ext" data-ext="${escapeHtml(ext)}">${escapeHtml(ext.toUpperCase() || "FILE")}</span><span class="zip-name-label">${escapeHtml(displayName)}</span></div></td><td class="zip-size">${escapeHtml(formatFileSizeForMeta(e.size) || "0 B")}</td></tr>`;
      }).join("");
      const truncNote = rarData.totalCount > MAX_RAR_LIST_ENTRIES
        ? `<p class="zip-truncated">${escapeHtml(t.zipTruncated(MAX_RAR_LIST_ENTRIES, rarData.totalCount))}</p>`
        : "";
      previewMarkup = `<div class="drop-preview-zip"><div class="zip-header"><span class="zip-header-label">${escapeHtml(t.archiveContents)}</span><span class="zip-header-count">${escapeHtml(t.zipCount(rarData.entries.length))}</span></div><div class="zip-scroll"><table class="zip-table"><thead><tr><th>${escapeHtml(t.zipColName)}</th><th>${escapeHtml(t.zipColSize)}</th></tr></thead><tbody>${rows}</tbody></table></div>${truncNote}</div>`;
    } else {
      previewMarkup = `<div class="drop-preview-empty"><span class="drop-preview-empty-icon">&#9632;</span><span>${escapeHtml(t.rarUnreadable)}</span></div>`;
    }
  }

  return `<!doctype html>
<html lang="${escapeHtml(t.htmlLang)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="noindex" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  ${absolutePageUrl ? `<meta property="og:url" content="${escapeHtml(absolutePageUrl)}" />` : ""}
  ${absolutePreviewImageUrl ? `<meta property="og:image" content="${escapeHtml(absolutePreviewImageUrl)}" />` : ""}
  <link rel="icon" type="image/svg+xml" href="/assets/icons/drop-share-favicon.svg?v=2" />
  <link rel="shortcut icon" href="/assets/icons/drop-share-favicon.svg?v=2" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />
  <style>
    :root {
      color-scheme: dark;
      --bg: #060e08;
      --panel: rgba(9, 19, 11, 0.92);
      --panel-inner: rgba(5, 11, 7, 0.88);
      --line: rgba(123, 255, 160, 0.2);
      --line-strong: rgba(123, 255, 160, 0.34);
      --text: #cfffda;
      --muted: rgba(199, 255, 215, 0.64);
      --accent: #7dff96;
      --accent-dim: rgba(125, 255, 150, 0.72);
      --warn: #ffd27d;
      --danger: #ff8a8a;
      --shadow: 0 32px 80px rgba(0, 0, 0, 0.52), 0 2px 8px rgba(0,0,0,0.28);
      --font: "Share Tech Mono", "Courier New", monospace;
      --radius: 16px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      font-family: var(--font);
      font-size: 14px;
      background: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
    }
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      background:
        radial-gradient(ellipse 80% 50% at 50% -10%, rgba(90,255,130,0.13), transparent),
        repeating-linear-gradient(180deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 4px);
      mix-blend-mode: screen;
    }
    .drop-topbar {
      position: relative;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px clamp(16px, 4vw, 40px);
      border-bottom: 1px solid var(--line);
      background: rgba(4, 9, 5, 0.82);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    .drop-topbar-brand {
      display: grid;
      gap: 2px;
    }
    .drop-topbar-kicker {
      color: var(--muted);
      font-size: 0.68rem;
      letter-spacing: 0.28em;
    }
    .drop-topbar-name {
      color: var(--accent);
      font-size: 0.9rem;
      letter-spacing: 0.12em;
    }
    .drop-topbar-badge {
      padding: 6px 14px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(6, 14, 8, 0.82);
      color: var(--muted);
      font-size: 0.72rem;
      letter-spacing: 0.18em;
    }
    main {
      position: relative;
      z-index: 1;
      flex: 1;
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
      padding: 28px 0 56px;
      display: grid;
      gap: 20px;
      align-content: start;
    }
    .drop-card {
      background: var(--panel);
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
      border-radius: var(--radius);
      padding: clamp(18px, 3vw, 28px);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }
    .drop-head {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
      padding-bottom: 18px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--line);
    }
    .drop-head-info { min-width: 0; flex: 1; }
    .drop-kicker {
      color: var(--accent-dim);
      font-size: 0.72rem;
      letter-spacing: 0.36em;
      margin-bottom: 8px;
    }
    .drop-title {
      font-size: clamp(1.5rem, 4vw, 2.4rem);
      line-height: 1.05;
      color: #e8ffee;
      word-break: break-word;
    }
    .drop-description {
      margin-top: 10px;
      color: var(--muted);
      max-width: 64ch;
      line-height: 1.6;
      font-size: 0.9rem;
    }
    .drop-virus {
      flex-shrink: 0;
      min-width: 190px;
      max-width: 260px;
      padding: 14px 18px;
      border-radius: 14px;
      border: 1px solid var(--line);
      background: var(--panel-inner);
      text-align: right;
      transition: border-color 0.4s ease, box-shadow 0.4s ease;
    }
    .drop-virus.is-safe {
      border-color: rgba(125, 255, 150, 0.52);
      box-shadow: 0 0 28px rgba(125,255,150,0.08);
    }
    .drop-virus.is-safe .drop-virus-title { color: var(--accent); }
    .drop-virus.is-flagged {
      border-color: rgba(255, 100, 100, 0.52);
      box-shadow: 0 0 28px rgba(255,100,100,0.1);
    }
    .drop-virus.is-flagged .drop-virus-title { color: var(--danger); }
    .drop-virus.is-pending {
      border-color: rgba(255, 210, 125, 0.44);
      animation: vtPulse 2.4s ease-in-out infinite;
    }
    .drop-virus.is-pending .drop-virus-title { color: var(--warn); }
    .drop-virus.is-error .drop-virus-title { color: #ffbdbd; }
    .drop-virus.is-muted .drop-virus-title { color: var(--muted); }
    @keyframes vtPulse {
      0%, 100% { box-shadow: 0 0 0 rgba(255,210,125,0); }
      50% { box-shadow: 0 0 22px rgba(255,210,125,0.18); }
    }
    .drop-virus-title {
      display: block;
      font-size: 0.98rem;
      letter-spacing: 0.2em;
    }
    .drop-virus-body {
      display: block;
      margin-top: 5px;
      font-size: 0.76rem;
      color: var(--muted);
      letter-spacing: 0.06em;
    }
    .drop-virus-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      margin-right: 6px;
      vertical-align: middle;
      position: relative;
      top: -1px;
    }
    .is-pending .drop-virus-dot {
      animation: dotBlink 1.2s step-start infinite;
    }
    @keyframes dotBlink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.2; }
    }
    .drop-grid {
      display: grid;
      gap: 18px;
      grid-template-columns: minmax(0, 1.55fr) minmax(270px, 0.9fr);
    }
    .drop-preview {
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(2, 5, 3, 0.72);
      border: 1px solid var(--line);
      border-radius: 14px;
      overflow: hidden;
    }
    .drop-preview-media,
    .drop-preview-video,
    .drop-preview-frame {
      display: block;
      width: 100%;
      min-height: 400px;
      max-height: 70vh;
      border: 0;
      background: #010302;
      object-fit: contain;
    }
    .drop-preview-audio {
      width: min(480px, calc(100% - 32px));
    }
    .drop-preview-text {
      width: 100%;
      padding: 22px;
      color: var(--text);
      font: inherit;
      font-size: 0.86rem;
      line-height: 1.6;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      align-self: flex-start;
    }
    .drop-preview-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 40px 24px;
      color: var(--muted);
      text-align: center;
    }
    .drop-preview-empty-icon {
      font-size: 2rem;
      opacity: 0.3;
      display: block;
    }
    .drop-preview-empty-hint {
      font-size: 0.8rem;
      opacity: 0.7;
    }
    .drop-preview-zip {
      width: 100%;
      align-self: stretch;
      display: flex;
      flex-direction: column;
    }
    .zip-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      border-bottom: 1px solid var(--line);
      background: rgba(6, 14, 8, 0.62);
    }
    .zip-header-label {
      color: var(--accent-dim);
      font-size: 0.72rem;
      letter-spacing: 0.26em;
    }
    .zip-header-count {
      color: var(--muted);
      font-size: 0.76rem;
    }
    .zip-scroll {
      flex: 1;
      position: relative;
      overflow-y: auto;
      max-height: 520px;
    }
    .zip-scroll::-webkit-scrollbar { width: 6px; }
    .zip-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
    .zip-scroll::-webkit-scrollbar-thumb { background: rgba(123,255,160,0.22); border-radius: 3px; }
    .zip-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
    }
    .zip-table thead th {
      padding: 8px 12px;
      text-align: left;
      color: var(--muted);
      font-size: 0.72rem;
      letter-spacing: 0.18em;
      border-bottom: 1px solid var(--line);
      position: sticky;
      top: 0;
      z-index: 3;
      background: rgba(5, 12, 7, 0.995);
      box-shadow: 0 1px 0 rgba(123,255,160,0.16);
    }
    .zip-table thead th:last-child { text-align: right; }
    .zip-table tbody tr { border-bottom: 1px solid rgba(123,255,160,0.06); transition: background 0.1s; }
    .zip-table tbody tr:last-child { border-bottom: 0; }
    .zip-table tbody tr:hover { background: rgba(123,255,160,0.04); }
    .zip-name {
      color: var(--text);
      max-width: 380px;
      padding: 9px 12px;
      overflow: hidden;
    }
    .zip-name-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .zip-name-label {
      display: block;
      min-width: 0;
      flex: 1 1 auto;
      padding-left: var(--zip-depth-indent, 0px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .zip-size { color: var(--muted); text-align: right; padding: 9px 12px; white-space: nowrap; }
    .zip-ext {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      min-width: 52px;
      padding: 1px 5px;
      border-radius: 4px;
      border: 1px solid rgba(123,255,160,0.18);
      background: rgba(6,14,8,0.72);
      color: var(--accent-dim);
      font-size: 0.66rem;
      letter-spacing: 0.08em;
      vertical-align: middle;
    }
    .zip-truncated {
      padding: 8px 16px;
      font-size: 0.76rem;
      color: var(--muted);
      border-top: 1px solid var(--line);
      text-align: center;
    }
    .drop-meta {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .drop-meta-row {
      display: grid;
      gap: 4px;
      padding: 11px 14px;
      border-radius: 12px;
      background: var(--panel-inner);
      border: 1px solid var(--line);
    }
    .drop-meta-label {
      color: var(--muted);
      font-size: 0.7rem;
      letter-spacing: 0.2em;
    }
    .drop-meta-value {
      font-size: 0.95rem;
      line-height: 1.35;
      overflow-wrap: anywhere;
      color: #e2ffea;
    }
    .drop-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 4px;
    }
    .drop-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      padding: 0 20px;
      border-radius: 10px;
      border: 1px solid rgba(123,255,160,0.26);
      color: var(--accent);
      text-decoration: none;
      background: rgba(8, 18, 10, 0.88);
      letter-spacing: 0.14em;
      font: inherit;
      font-size: 0.86rem;
      cursor: pointer;
      transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
    }
    .drop-btn:hover {
      border-color: rgba(123,255,160,0.48);
      background: rgba(10, 24, 13, 0.96);
      box-shadow: 0 0 18px rgba(123,255,160,0.08);
    }
    .drop-btn.is-primary {
      background: linear-gradient(180deg, rgba(100,255,130,0.18), rgba(50,160,80,0.08));
      border-color: rgba(123,255,160,0.38);
      color: #b0ffbf;
    }
    .drop-btn.is-primary:hover {
      background: linear-gradient(180deg, rgba(100,255,130,0.26), rgba(50,160,80,0.14));
      border-color: rgba(123,255,160,0.54);
    }
    .drop-footer-note {
      margin-top: 10px;
      color: var(--muted);
      font-size: 0.75rem;
      line-height: 1.55;
      opacity: 0.8;
    }
    @media (max-width: 860px) {
      .drop-grid { grid-template-columns: minmax(0, 1fr); }
      .drop-virus { min-width: 0; width: 100%; max-width: none; text-align: left; }
      .drop-preview { min-height: 280px; }
      .drop-preview-media, .drop-preview-video, .drop-preview-frame { min-height: 280px; }
    }
    @media (max-width: 560px) {
      .drop-topbar { flex-direction: column; align-items: flex-start; gap: 10px; }
    }
  </style>
</head>
<body>
  <header class="drop-topbar">
    <div class="drop-topbar-brand">
      <span class="drop-topbar-kicker">ROBCO INDUSTRIES (TM) TERMLINK</span>
      <span class="drop-topbar-name">FALLOUT CODEX // SECURE DROP</span>
    </div>
    <span class="drop-topbar-badge">${escapeHtml(t.badge)}</span>
  </header>
  <main>
    <article class="drop-card">
      <div class="drop-head">
        <div class="drop-head-info">
          <p class="drop-kicker">${escapeHtml(t.kicker)}</p>
          <h1 class="drop-title">${escapeHtml(normalized.displayName || normalized.name)}</h1>
          ${normalized.description ? `<p class="drop-description">${escapeHtml(normalized.description)}</p>` : ""}
        </div>
        <div id="vtBadge" class="drop-virus is-${escapeHtml(virusBadge.kind)}">
          <span class="drop-virus-title"><span class="drop-virus-dot"></span>${escapeHtml(virusBadge.title)}</span>
          <span class="drop-virus-body">${escapeHtml(virusBadge.body)}</span>
        </div>
      </div>
      <div class="drop-grid">
        <section class="drop-preview">
          ${previewMarkup}
        </section>
        <aside class="drop-meta">
          <div class="drop-meta-row">
            <span class="drop-meta-label">${escapeHtml(t.labelFileType)}</span>
            <span class="drop-meta-value">${escapeHtml(resolveTempShareFileTypeLabel(normalized))}</span>
          </div>
          <div class="drop-meta-row">
            <span class="drop-meta-label">${escapeHtml(t.labelFileSize)}</span>
            <span class="drop-meta-value">${escapeHtml(formatFileSizeForMeta(normalized.size) || "--")}</span>
          </div>
          <div class="drop-meta-row">
            <span class="drop-meta-label">${escapeHtml(t.labelUploaded)}</span>
            <span class="drop-meta-value">${escapeHtml(formatTempSharePublicDate(normalized.uploadedAt))} UTC</span>
          </div>
          <div class="drop-meta-row">
            <span class="drop-meta-label">${escapeHtml(t.labelExpires)}</span>
            <span class="drop-meta-value" id="expiresValue">${normalized.expiresAt ? `${escapeHtml(formatTempSharePublicDate(normalized.expiresAt))} UTC` : escapeHtml(t.downloadLimitOnly)}</span>
          </div>
          <div class="drop-meta-row">
            <span class="drop-meta-label">${escapeHtml(t.labelDownloads)}</span>
            <span class="drop-meta-value" id="downloadsValue">${normalized.maxDownloads > 0 ? `${normalized.downloadCount}/${normalized.maxDownloads}` : `${normalized.downloadCount}${escapeHtml(t.downloadsUsedSuffix)}`}</span>
          </div>
          <div id="vtRow" class="drop-meta-row" ${!vtLink ? 'style="display:none"' : ""}>
            <span class="drop-meta-label">${escapeHtml(t.labelVt)}</span>
            <span class="drop-meta-value"><a id="vtLink" class="drop-btn" href="${escapeHtml(vtLink || "#")}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.btnVtReport)}</a></span>
          </div>
          <div class="drop-actions">
            <a class="drop-btn is-primary" href="${escapeHtml(downloadPath)}" id="downloadBtn">${escapeHtml(t.btnDownload)}</a>
            ${previewKind && previewKind !== "text" && previewKind !== "zip" && previewKind !== "rar" ? `<a class="drop-btn" href="${escapeHtml(contentPath)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.btnOpenTab)}</a>` : ""}
          </div>
          <p class="drop-footer-note">${escapeHtml(t.vtNote)}</p>
        </aside>
      </div>
    </article>
  </main>
  <script>
    (function() {
      var statusUrl = ${JSON.stringify(statusApiPath)};
      var expiresAtMs = ${normalized.expiresAt ? JSON.stringify(new Date(normalized.expiresAt).getTime()) : "0"};
      var maxDownloads = ${JSON.stringify(normalized.maxDownloads)};
      var I18N_EXPIRED = ${JSON.stringify(t.expired)};
      var I18N_USED_SUFFIX = ${JSON.stringify(t.downloadsUsedSuffix)};

      var badge = document.getElementById("vtBadge");
      var vtRow = document.getElementById("vtRow");
      var vtLinkEl = document.getElementById("vtLink");
      var expiresEl = document.getElementById("expiresValue");
      var downloadsEl = document.getElementById("downloadsValue");
      var downloadBtn = document.getElementById("downloadBtn");
      var kindMap = { safe: "is-safe", flagged: "is-flagged", pending: "is-pending", error: "is-error", muted: "is-muted" };
      var allKinds = Object.values(kindMap);
      var vtPending = ${JSON.stringify(isPending)};
      var vtTries = 0;
      var maxVtTries = 40;
      var reloading = false;

      var channel = null;
      try {
        channel = new BroadcastChannel("drop-status:" + statusUrl);
        channel.onmessage = function(ev) {
          if (!ev.data) return;
          if (ev.data.type === "exhausted") {
            goToLimitReached();
          } else if (ev.data.type === "gone") {
            triggerReload();
          } else if (ev.data.type === "count" && downloadsEl && typeof ev.data.count === "number") {
            downloadsEl.textContent = formatDownloads(ev.data.count, maxDownloads);
            if (maxDownloads > 0 && ev.data.count >= maxDownloads) goToLimitReached();
          }
        };
      } catch (e) {}

      function broadcast(msg) {
        if (channel) { try { channel.postMessage(msg); } catch (e) {} }
      }

      function goToLimitReached() {
        if (reloading) return;
        reloading = true;
        broadcast({ type: "exhausted" });
        window.location.reload();
      }

      function triggerReload() {
        if (reloading) return;
        reloading = true;
        broadcast({ type: "gone" });
        window.location.reload();
      }

      function formatCountdown(ms) {
        if (ms <= 0) return I18N_EXPIRED;
        var s = Math.floor(ms / 1000);
        var m = Math.floor(s / 60); s %= 60;
        var h = Math.floor(m / 60); m %= 60;
        var d = Math.floor(h / 24); h %= 24;
        if (d > 0) return d + "d " + h + "h " + m + "m";
        if (h > 0) return h + "h " + m + "m " + s + "s";
        if (m > 0) return m + "m " + s + "s";
        return s + "s";
      }

      function formatDownloads(count, max) {
        return max > 0 ? count + "/" + max : count + I18N_USED_SUFFIX;
      }

      function updateExpires() {
        if (!expiresAtMs || !expiresEl) return;
        var remaining = expiresAtMs - Date.now();
        var countdown = formatCountdown(remaining);
        expiresEl.textContent = countdown === I18N_EXPIRED ? I18N_EXPIRED : expiresEl.dataset.utc + " UTC (" + countdown + ")";
      }

      if (expiresAtMs && expiresEl) {
        expiresEl.dataset.utc = expiresEl.textContent.replace(/ UTC$/, "");
        updateExpires();
        setInterval(updateExpires, 1000);
      }

      function pollStatus() {
        if (reloading) return;
        fetch(statusUrl, { cache: "no-store" }).then(function(r) {
          if (r.status === 410) {
            goToLimitReached();
            return null;
          }
          if (!r.ok) {
            triggerReload();
            return null;
          }
          return r.json();
        }).then(function(data) {
          if (!data || reloading) return;

          if (data.badge && badge) {
            var b = data.badge;
            allKinds.forEach(function(k) { badge.classList.remove(k); });
            badge.classList.add(kindMap[b.kind] || "is-muted");
            var titleEl = badge.querySelector(".drop-virus-title");
            var bodyEl = badge.querySelector(".drop-virus-body");
            if (titleEl) titleEl.innerHTML = '<span class="drop-virus-dot"></span>' + b.title;
            if (bodyEl) bodyEl.textContent = b.body;
            if (b.permalink) {
              if (vtRow) vtRow.style.display = "";
              if (vtLinkEl) vtLinkEl.href = b.permalink;
            }
            if (b.kind === "pending" && vtPending && vtTries < maxVtTries) {
              vtTries++;
              setTimeout(pollStatus, 5000);
            }
          }

          if (downloadsEl && typeof data.downloadCount === "number") {
            downloadsEl.textContent = formatDownloads(data.downloadCount, maxDownloads);
            broadcast({ type: "count", count: data.downloadCount });
          }

          if (maxDownloads > 0 && typeof data.downloadCount === "number" && data.downloadCount >= maxDownloads) {
            goToLimitReached();
          }
        }).catch(function() {});
      }

      if (vtPending) {
        setTimeout(pollStatus, 5000);
      }

      if (downloadBtn) {
        downloadBtn.addEventListener("click", function() {
          [500, 1500, 3000, 5000, 8000, 12000].forEach(function(t) {
            setTimeout(pollStatus, t);
          });
        });
      }

      setInterval(pollStatus, 10000);
    })();
  </script>
</body>
</html>`;
}

function renderTempShareUnavailablePage({ title, message, statusLabel, lang = "en" }) {
  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="robots" content="noindex" />
  <link rel="icon" type="image/svg+xml" href="/assets/icons/drop-share-unavailable-favicon.svg?v=2" />
  <link rel="shortcut icon" href="/assets/icons/drop-share-unavailable-favicon.svg?v=2" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />
  <style>
    :root {
      color-scheme: dark;
      --bg: #060e08;
      --panel: rgba(9, 17, 11, 0.94);
      --line: rgba(255, 100, 100, 0.22);
      --line-strong: rgba(255, 100, 100, 0.38);
      --text: #cfffda;
      --muted: rgba(199, 255, 215, 0.58);
      --danger: #ff8a8a;
      --danger-dim: rgba(255, 138, 138, 0.72);
      --accent: #7dff96;
      --font: "Share Tech Mono", "Courier New", monospace;
      --radius: 18px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      font-family: var(--font);
      font-size: 14px;
      background: var(--bg);
      color: var(--text);
      display: grid;
      place-items: center;
      padding: 24px;
    }
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      background:
        radial-gradient(ellipse 70% 45% at 50% 0%, rgba(255, 80, 80, 0.11), transparent),
        repeating-linear-gradient(180deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 4px);
      mix-blend-mode: screen;
    }
    .card {
      position: relative;
      z-index: 1;
      width: min(580px, 100%);
      padding: clamp(24px, 4vw, 36px);
      border-radius: var(--radius);
      border: 1px solid var(--line-strong);
      background: var(--panel);
      box-shadow:
        0 0 0 1px rgba(0,0,0,0.5) inset,
        0 32px 80px rgba(0,0,0,0.54),
        0 0 40px rgba(255,80,80,0.05);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }
    .card-topbar {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 22px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--line);
    }
    .card-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1px solid var(--line-strong);
      background: rgba(255,80,80,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .card-icon svg {
      width: 18px;
      height: 18px;
      fill: none;
      stroke: var(--danger);
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .card-meta { min-width: 0; }
    .card-eyebrow {
      color: var(--danger-dim);
      font-size: 0.68rem;
      letter-spacing: 0.3em;
      text-transform: uppercase;
    }
    .card-brand {
      color: var(--muted);
      font-size: 0.72rem;
      letter-spacing: 0.14em;
      margin-top: 2px;
    }
    h1 {
      font-size: clamp(1.35rem, 3.5vw, 1.9rem);
      letter-spacing: 0.06em;
      line-height: 1.15;
      color: #ffe8e8;
      margin-bottom: 14px;
    }
    .message {
      color: var(--muted);
      line-height: 1.65;
      font-size: 0.9rem;
    }
    .card-footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--line);
      color: rgba(199,255,215,0.38);
      font-size: 0.72rem;
      letter-spacing: 0.1em;
    }
  </style>
</head>
<body>
  <article class="card">
    <div class="card-topbar">
      <div class="card-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div class="card-meta">
        <div class="card-eyebrow">${escapeHtml(statusLabel)}</div>
        <div class="card-brand">FALLOUT CODEX // SECURE DROP</div>
      </div>
    </div>
    <h1>${escapeHtml(title)}</h1>
    <p class="message">${escapeHtml(message)}</p>
    <div class="card-footer">ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL</div>
  </article>
</body>
</html>`;
}

function renderTempShareLimitReachedPage(lang) {
  const t = getDropI18n(lang);
  return `<!doctype html>
<html lang="${escapeHtml(t.htmlLang)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(t.limitTitle)}</title>
  <meta name="robots" content="noindex" />
  <link rel="icon" type="image/svg+xml" href="/assets/icons/drop-share-limit-favicon.svg?v=2" />
  <link rel="shortcut icon" href="/assets/icons/drop-share-limit-favicon.svg?v=2" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />
  <style>
    :root {
      color-scheme: dark;
      --bg: #080a04;
      --panel: rgba(12, 14, 6, 0.96);
      --line: rgba(210, 160, 60, 0.22);
      --line-strong: rgba(210, 160, 60, 0.38);
      --text: #fff8dc;
      --muted: rgba(255, 240, 180, 0.58);
      --amber: #ffc94a;
      --amber-dim: rgba(255, 200, 80, 0.72);
      --accent: #ffe066;
      --font: "Share Tech Mono", "Courier New", monospace;
      --radius: 18px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      font-family: var(--font);
      font-size: 14px;
      background: var(--bg);
      color: var(--text);
      display: grid;
      place-items: center;
      padding: 24px;
    }
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      background:
        radial-gradient(ellipse 70% 45% at 50% 0%, rgba(210, 150, 30, 0.11), transparent),
        repeating-linear-gradient(180deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 4px);
      mix-blend-mode: screen;
    }
    .card {
      position: relative;
      z-index: 1;
      width: min(600px, 100%);
      padding: clamp(24px, 4vw, 36px);
      border-radius: var(--radius);
      border: 1px solid var(--line-strong);
      background: var(--panel);
      box-shadow:
        0 0 0 1px rgba(0,0,0,0.5) inset,
        0 32px 80px rgba(0,0,0,0.54),
        0 0 40px rgba(200,140,20,0.07);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }
    .card-topbar {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 22px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--line);
    }
    .card-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1px solid var(--line-strong);
      background: rgba(210,150,20,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .card-icon svg {
      width: 18px;
      height: 18px;
      fill: none;
      stroke: var(--amber);
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .card-meta { min-width: 0; }
    .card-eyebrow {
      color: var(--amber-dim);
      font-size: 0.68rem;
      letter-spacing: 0.3em;
      text-transform: uppercase;
    }
    .card-brand {
      color: var(--muted);
      font-size: 0.72rem;
      letter-spacing: 0.14em;
      margin-top: 2px;
    }
    h1 {
      font-size: clamp(1.3rem, 3.5vw, 1.8rem);
      letter-spacing: 0.06em;
      line-height: 1.15;
      color: var(--accent);
      margin-bottom: 14px;
    }
    .message {
      color: var(--muted);
      line-height: 1.65;
      font-size: 0.9rem;
    }
    .hint-box {
      margin-top: 20px;
      padding: 14px 16px;
      border-radius: 10px;
      border: 1px solid rgba(210,160,60,0.2);
      background: rgba(210,150,20,0.06);
    }
    .hint-box p {
      color: rgba(255,230,140,0.75);
      font-size: 0.84rem;
      line-height: 1.6;
    }
    .hint-label {
      display: block;
      font-size: 0.66rem;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--amber-dim);
      margin-bottom: 6px;
    }
    .card-footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--line);
      color: rgba(255,230,140,0.28);
      font-size: 0.72rem;
      letter-spacing: 0.1em;
    }
  </style>
</head>
<body>
  <article class="card">
    <div class="card-topbar">
      <div class="card-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2L2 19h20L12 2z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div class="card-meta">
        <div class="card-eyebrow">${escapeHtml(t.limitEyebrow)}</div>
        <div class="card-brand">FALLOUT CODEX // SECURE DROP</div>
      </div>
    </div>
    <h1>${escapeHtml(t.limitTitle)}</h1>
    <p class="message">${escapeHtml(t.limitMessage)}</p>
    <div class="hint-box">
      <span class="hint-label">${escapeHtml(t.limitHintLabel)}</span>
      <p>${escapeHtml(t.limitHint)}</p>
    </div>
    <div class="card-footer">ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL</div>
  </article>
</body>
</html>`;
}

function sendTempSharePreviewContent(res, entry) {
  const normalized = normalizeTempShareEntry(entry);
  if (!normalized) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  const previewKind = resolveTempSharePreviewKind(normalized);
  if (!previewKind || previewKind === "text") {
    res.status(404).json({ error: "Preview is not available for this file type" });
    return;
  }

  const storedPath = resolveTempShareStoredPath(normalized.storedName);
  if (!storedPath || !fs.existsSync(storedPath)) {
    res.status(404).json({ error: "File blob not found" });
    return;
  }

  const safeName = sanitizeDisplayFilename(normalized.name || "file.bin") || "file.bin";
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Disposition", `inline; filename="${safeName.replace(/"/g, "")}"`);
  res.type(normalized.mimeType || "application/octet-stream");
  res.sendFile(storedPath);
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

function buildDiscordProfileForSession(userPayload) {
  if (!userPayload || typeof userPayload !== "object") {
    return null;
  }

  try {
    return JSON.parse(JSON.stringify(userPayload));
  } catch {
    return null;
  }
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
    username: String(user.username || "").trim() || "UNKNOWN",
    discordProfile: user.discordProfile && typeof user.discordProfile === "object" ? user.discordProfile : null
  };
}

function isAdmin(user) {
  return Boolean(user && user.discordId === ADMIN_DISCORD_ID);
}

function isAccessRequestDisclaimerAccepted(accessRequestState = null) {
  return normalizeAccessDisclaimerDecision(accessRequestState?.disclaimerDecision) === ACCESS_DISCLAIMER_DECISION.ACCEPTED;
}

function isDisclaimerAcceptanceRequired(user, accessRequestState = null) {
  if (!user || isAdmin(user) || ALLOWED_DISCORD_IDS.has(user.discordId)) {
    return false;
  }

  const resolvedAccessState = accessRequestState || getAccessRequestState(user.discordId);
  const status = normalizeAccessRequestStatus(resolvedAccessState?.status);
  if (status !== ACCESS_REQUEST_STATUS.APPROVED) {
    return false;
  }
  return !isAccessRequestDisclaimerAccepted(resolvedAccessState);
}

function isAuthorized(user, accessRequestState = null) {
  if (!user) {
    return false;
  }
  if (isAdmin(user) || ALLOWED_DISCORD_IDS.has(user.discordId)) {
    return true;
  }

  const resolvedAccessState = accessRequestState || getAccessRequestState(user.discordId);
  const status = normalizeAccessRequestStatus(resolvedAccessState.status);
  if (status !== ACCESS_REQUEST_STATUS.APPROVED) {
    return false;
  }
  return isAccessRequestDisclaimerAccepted(resolvedAccessState);
}

function buildMePayload(req) {
  const user = getSessionUser(req);
  if (!user) {
    return {
      loggedIn: false,
      discordId: "",
      username: "",
      isAdmin: false,
      isAuthorized: false,
      accessRequestStatus: ACCESS_REQUEST_STATUS.NONE,
      accessRequestRequestedAt: "",
      accessRequestDecidedAt: "",
      accessRequestReapplyAt: "",
      accessRequestDeclineReason: "",
      accessDisclaimerDecision: ACCESS_DISCLAIMER_DECISION.NONE,
      accessDisclaimerDecidedAt: "",
      accessDisclaimerReevaluationRequestedAt: "",
      disclaimerRequired: false
    };
  }

  const accessRequestState = getAccessRequestState(user.discordId);
  const disclaimerRequired = isDisclaimerAcceptanceRequired(user, accessRequestState);

  return {
    loggedIn: true,
    discordId: user.discordId,
    username: user.username,
    isAdmin: isAdmin(user),
    isAuthorized: isAuthorized(user, accessRequestState),
    accessRequestStatus: accessRequestState.status,
    accessRequestRequestedAt: accessRequestState.requestedAt,
    accessRequestDecidedAt: accessRequestState.decidedAt,
    accessRequestReapplyAt: getAccessRequestReapplyAtIso(accessRequestState),
    accessRequestDeclineReason: sanitizeAccessRequestReason(accessRequestState.declineReason),
    accessDisclaimerDecision: normalizeAccessDisclaimerDecision(accessRequestState.disclaimerDecision),
    accessDisclaimerDecidedAt: String(accessRequestState.disclaimerDecidedAt || ""),
    accessDisclaimerReevaluationRequestedAt: String(accessRequestState.disclaimerReevaluationRequestedAt || ""),
    disclaimerRequired
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

function botAdminApiConfigured() {
  return Boolean(BOT_ADMIN_API_URL && BOT_ADMIN_API_TOKEN);
}

async function requestBotAdminApi(pathname, options = {}) {
  if (!botAdminApiConfigured()) {
    const error = new Error("Bot admin service is not configured on the server.");
    error.status = 503;
    throw error;
  }

  const targetUrl = new URL(pathname, `${BOT_ADMIN_API_URL}/`);
  const method = String(options.method || "GET").trim().toUpperCase() || "GET";
  const headers = {
    Authorization: `Bearer ${BOT_ADMIN_API_TOKEN}`,
    Accept: "application/json",
    ...(options.headers && typeof options.headers === "object" ? options.headers : {})
  };
  const requestOptions = {
    method,
    headers,
    cache: "no-store"
  };

  if (Object.prototype.hasOwnProperty.call(options, "body")) {
    requestOptions.body = options.body;
  }

  let response;
  try {
    response = await fetch(targetUrl, requestOptions);
  } catch (error) {
    const nextError = new Error("Bot admin service is unreachable.");
    nextError.status = 502;
    nextError.cause = error;
    throw nextError;
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = new Error(payload?.error || payload?.message || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return payload || {};
}

function sendBotAdminProxyError(res, error) {
  const status = Number.isFinite(Number(error?.status)) ? Number(error.status) : 500;
  res.status(status >= 400 && status < 600 ? status : 500).json({
    error: String(error?.message || "Bot admin request failed.")
  });
}

async function getBotAdminOverview() {
  return requestBotAdminApi("/admin/bot/overview");
}

async function syncBotAdminCommands() {
  return requestBotAdminApi("/admin/bot/commands/sync", {
    method: "POST"
  });
}

async function sendBotAdminWelcome(guildId) {
  return requestBotAdminApi(`/admin/bot/guilds/${encodeURIComponent(guildId)}/welcome`, {
    method: "POST"
  });
}

async function sendBotAdminTestPost(guildId) {
  return requestBotAdminApi(`/admin/bot/guilds/${encodeURIComponent(guildId)}/test-post`, {
    method: "POST"
  });
}

async function leaveBotAdminGuild(guildId) {
  return requestBotAdminApi(`/admin/bot/guilds/${encodeURIComponent(guildId)}/leave`, {
    method: "POST"
  });
}

function oauthConfigured() {
  return Boolean(DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET && DISCORD_REDIRECT_URI);
}

function parseBooleanQueryFlag(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function buildDiscordAuthorizeUrl(oauthState) {
  const query = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    response_type: "code",
    redirect_uri: DISCORD_REDIRECT_URI,
    scope: "identify email",
    state: oauthState
  });
  return `https://discord.com/oauth2/authorize?${query.toString()}`;
}

function sendDiscordPopupCallbackResponse(res, ok) {
  const payload = JSON.stringify({
    type: "fallout-codex:discord-auth",
    ok: Boolean(ok)
  });

  res
    .status(200)
    .type("html")
    .send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Discord Login</title>
</head>
<body>
  <script>
    (function () {
      var payload = ${payload};
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, window.location.origin);
        }
      } catch (_error) {}
      try {
        window.close();
      } catch (_error) {}
      setTimeout(function () {
        document.body.textContent = payload.ok
          ? "Login complete. You can close this window."
          : "Login failed. Please return to the previous window.";
      }, 120);
    })();
  </script>
</body>
</html>`);
}

function mailConfigured() {
  return Boolean(SMTP_HOST && SMTP_FROM && ACCESS_REQUEST_EMAIL_TO);
}

const mailTransport = mailConfigured()
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      tls: {
        rejectUnauthorized: SMTP_TLS_REJECT_UNAUTHORIZED
      },
      auth: SMTP_USER && SMTP_PASS
        ? {
            user: SMTP_USER,
            pass: SMTP_PASS
          }
        : undefined
    })
  : null;

function getAccessRequestCooldownRemainingMs(discordId) {
  const key = String(discordId || "").trim();
  if (!key) {
    return 0;
  }

  const lastSentAtMs = Number(ACCESS_REQUEST_COOLDOWN_BY_DISCORD_ID.get(key));
  if (!Number.isFinite(lastSentAtMs)) {
    return 0;
  }

  const elapsedMs = Date.now() - lastSentAtMs;
  if (elapsedMs < 0 || elapsedMs >= ACCESS_REQUEST_COOLDOWN_MS) {
    ACCESS_REQUEST_COOLDOWN_BY_DISCORD_ID.delete(key);
    return 0;
  }
  return ACCESS_REQUEST_COOLDOWN_MS - elapsedMs;
}

function markAccessRequestSent(discordId) {
  const key = String(discordId || "").trim();
  if (!key) {
    return;
  }
  ACCESS_REQUEST_COOLDOWN_BY_DISCORD_ID.set(key, Date.now());
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getDiscordAccountCreatedAt(discordId) {
  const rawId = String(discordId || "").trim();
  if (!isDiscordId(rawId)) {
    return null;
  }

  try {
    const snowflake = BigInt(rawId);
    const timestampMs = Number((snowflake >> 22n) + BigInt(DISCORD_EPOCH_MS));
    if (!Number.isFinite(timestampMs) || timestampMs <= 0) {
      return null;
    }
    const createdAt = new Date(timestampMs);
    if (Number.isNaN(createdAt.getTime())) {
      return null;
    }
    return createdAt;
  } catch {
    return null;
  }
}

function formatDiscordAccountAge(createdAt) {
  if (!(createdAt instanceof Date) || Number.isNaN(createdAt.getTime())) {
    return "Unknown";
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const nowMs = Date.now();
  const diffMs = Math.max(0, nowMs - createdAt.getTime());
  const totalDays = Math.floor(diffMs / dayMs);
  const years = Math.floor(totalDays / 365);
  const remainingAfterYears = totalDays % 365;
  const months = Math.floor(remainingAfterYears / 30);
  const days = remainingAfterYears % 30;

  const parts = [];
  if (years > 0) {
    parts.push(`${years} year${years === 1 ? "" : "s"}`);
  }
  if (months > 0) {
    parts.push(`${months} month${months === 1 ? "" : "s"}`);
  }
  if (days > 0 || !parts.length) {
    parts.push(`${days} day${days === 1 ? "" : "s"}`);
  }
  return parts.slice(0, 2).join(", ");
}

function formatUtcTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  try {
    const formatted = new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    })
      .format(date)
      .replace(/\bam\b/g, "AM")
      .replace(/\bpm\b/g, "PM");
    return `${formatted} UTC`;
  } catch {
    return date.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
  }
}

function resolveAccessRequestIdentity(user, requestEntry = null) {
  const profile = user.discordProfile && typeof user.discordProfile === "object" ? user.discordProfile : null;
  const nick = String(profile?.global_name || "").trim() || String(user.username || "").trim() || "Unknown";
  const username = String(profile?.username || "").trim() || String(user.username || "").trim() || "unknown";
  const email = String(requestEntry?.email || profile?.email || "").trim() || "Not available";
  const reason = sanitizeAccessRequestReason(requestEntry?.reason);
  const accountCreatedAt = getDiscordAccountCreatedAt(user.discordId);
  const requestTimeRaw = String(requestEntry?.requestedAt || "").trim() || new Date().toISOString();

  return {
    nick,
    username,
    email,
    reason,
    discordId: String(user.discordId || "").trim() || "Unknown",
    accountAge: formatDiscordAccountAge(accountCreatedAt),
    requestTime: formatUtcTimestamp(requestTimeRaw)
  };
}

function resolveDiscordDefaultAvatarIndex(user) {
  const profile = user?.discordProfile && typeof user.discordProfile === "object" ? user.discordProfile : null;
  const discriminator = String(profile?.discriminator || "").trim();
  if (discriminator && discriminator !== "0") {
    const legacyIndex = Number.parseInt(discriminator, 10);
    if (Number.isFinite(legacyIndex)) {
      return Math.abs(legacyIndex) % 5;
    }
  }

  const discordId = String(user?.discordId || "").trim();
  if (!/^\d+$/.test(discordId)) {
    return 0;
  }

  try {
    return Number((BigInt(discordId) >> 22n) % 6n);
  } catch {
    return 0;
  }
}

function resolveDiscordAvatarUrl(user, size = 128) {
  const profile = user?.discordProfile && typeof user.discordProfile === "object" ? user.discordProfile : null;
  const discordId = String(user?.discordId || "").trim();
  const safeSize = Math.max(32, Math.min(512, Number(size) || 128));
  const avatarHash = String(profile?.avatar || "").trim();
  if (discordId && avatarHash) {
    const format = avatarHash.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${format}?size=${safeSize}`;
  }

  const index = resolveDiscordDefaultAvatarIndex(user);
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

function getRequestBaseUrl(req) {
  const configuredBaseUrl = String(PUBLIC_BASE_URL || "").trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  const forwardedProto = String(req.get("x-forwarded-proto") || "").trim().split(",")[0].trim();
  const protocol = forwardedProto || String(req.protocol || "http");
  const forwardedHost = String(req.get("x-forwarded-host") || "").trim().split(",")[0].trim();
  const host = forwardedHost || String(req.get("host") || "").trim();
  if (!host) {
    return "";
  }
  return `${protocol}://${host}`.replace(/\/+$/, "");
}

function signAccessRequestDecisionToken(requestId, action, expiresAtMs) {
  const payload = `${requestId}:${action}:${expiresAtMs}`;
  return crypto.createHmac("sha256", ACCESS_REQUEST_TOKEN_SECRET).update(payload).digest("hex");
}

function verifyAccessRequestDecisionToken(requestId, action, expiresAtMs, providedToken) {
  const expectedToken = signAccessRequestDecisionToken(requestId, action, expiresAtMs);
  const provided = Buffer.from(String(providedToken || ""), "utf8");
  const expected = Buffer.from(expectedToken, "utf8");
  if (provided.length !== expected.length) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(provided, expected);
  } catch {
    return false;
  }
}

function buildAccessRequestDecisionLink({ baseUrl, requestId, action, expiresAtMs }) {
  const query = new URLSearchParams({
    rid: requestId,
    action,
    exp: String(expiresAtMs),
    token: signAccessRequestDecisionToken(requestId, action, expiresAtMs)
  });
  return `${baseUrl}/admin/access-requests/decision?${query.toString()}`;
}

function signAccessRequestReevaluationDecisionToken(discordId, action, expiresAtMs) {
  const payload = `reeval:${discordId}:${action}:${expiresAtMs}`;
  return crypto.createHmac("sha256", ACCESS_REQUEST_TOKEN_SECRET).update(payload).digest("hex");
}

function verifyAccessRequestReevaluationDecisionToken(discordId, action, expiresAtMs, providedToken) {
  const expectedToken = signAccessRequestReevaluationDecisionToken(discordId, action, expiresAtMs);
  const provided = Buffer.from(String(providedToken || ""), "utf8");
  const expected = Buffer.from(expectedToken, "utf8");
  if (provided.length !== expected.length) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(provided, expected);
  } catch {
    return false;
  }
}

function buildAccessRequestReevaluationDecisionLink({ baseUrl, discordId, action, expiresAtMs }) {
  const query = new URLSearchParams({
    did: discordId,
    action,
    exp: String(expiresAtMs),
    token: signAccessRequestReevaluationDecisionToken(discordId, action, expiresAtMs)
  });
  return `${baseUrl}/admin/access-requests/reevaluation-decision?${query.toString()}`;
}

function buildAccessRequestDecisionPage({
  title,
  statusLabel,
  message,
  accent = "#8bff8b",
  baseUrl = "",
  entry = null
}) {
  const safeTitle = escapeHtml(title);
  const safeStatus = escapeHtml(statusLabel);
  const safeMessage = escapeHtml(message);
  const safeUser = escapeHtml(String(entry?.username || entry?.discordId || "Unknown"));
  const safeId = escapeHtml(String(entry?.discordId || "Unknown"));
  const safeRequestedAt = escapeHtml(formatUtcTimestamp(entry?.requestedAt || ""));
  const safeDecidedAt = escapeHtml(formatUtcTimestamp(entry?.decidedAt || ""));
  const safeReason = escapeHtml(sanitizeAccessRequestReason(entry?.reason || ""));
  const safeDeclineReason = escapeHtml(sanitizeAccessRequestReason(entry?.declineReason || ""));
  const reasonRow = safeReason
    ? `<div class="row"><span>Reason</span><span style="white-space:pre-wrap;">${safeReason}</span></div>`
    : "";
  const declineReasonRow = safeDeclineReason
    ? `<div class="row"><span>Decline Reason</span><span style="white-space:pre-wrap;">${safeDeclineReason}</span></div>`
    : "";
  const returnUrl = baseUrl ? `${baseUrl}/#files` : "/#files";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        padding: 24px;
        display: grid;
        place-items: center;
        background:
          radial-gradient(120% 120% at 100% 0%, rgba(255, 225, 122, 0.14), rgba(0, 0, 0, 0) 56%),
          radial-gradient(110% 120% at 0% 100%, rgba(139, 255, 139, 0.12), rgba(0, 0, 0, 0) 58%),
          #060a06;
        color: #c7f7c7;
        font-family: "Consolas", "Courier New", monospace;
      }
      .card {
        width: min(760px, 100%);
        border: 1px solid rgba(139, 255, 139, 0.34);
        border-radius: 14px;
        padding: 18px;
        background:
          linear-gradient(to bottom, rgba(139, 255, 139, 0.08), rgba(0, 0, 0, 0.4)),
          rgba(0, 0, 0, 0.46);
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5) inset, 0 18px 60px rgba(0, 0, 0, 0.6);
      }
      .chip {
        display: inline-block;
        padding: 4px 9px;
        border: 1px solid ${accent};
        border-radius: 999px;
        color: ${accent};
        background: rgba(0, 0, 0, 0.35);
        font-size: 12px;
        letter-spacing: .06em;
        text-transform: uppercase;
      }
      h1 {
        margin: 12px 0 6px;
        font-size: clamp(1.08rem, 2vw, 1.38rem);
        letter-spacing: .08em;
        text-transform: uppercase;
        color: #fff4cb;
      }
      p {
        margin: 0;
        line-height: 1.45;
        color: #b4eab4;
      }
      .grid {
        margin-top: 14px;
        display: grid;
        gap: 8px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 8px 10px;
        border: 1px solid rgba(139, 255, 139, 0.22);
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.3);
      }
      .row span:first-child {
        color: #97cf97;
        text-transform: uppercase;
        letter-spacing: .05em;
        font-size: 12px;
      }
      .row span:last-child {
        color: #d8ffd8;
        text-align: right;
      }
      .actions {
        margin-top: 14px;
        display: flex;
        justify-content: flex-end;
      }
      .btn {
        border: 1px solid rgba(139, 255, 139, 0.48);
        border-radius: 9px;
        padding: 9px 12px;
        text-decoration: none;
        color: #d8ffd8;
        background: rgba(0, 0, 0, 0.35);
      }
    </style>
  </head>
  <body>
    <section class="card">
      <span class="chip">${safeStatus}</span>
      <h1>${safeTitle}</h1>
      <p>${safeMessage}</p>
      <div class="grid">
        <div class="row"><span>User</span><span>${safeUser}</span></div>
        <div class="row"><span>Discord ID</span><span>${safeId}</span></div>
        ${reasonRow}
        ${declineReasonRow}
        <div class="row"><span>Requested (UTC)</span><span>${safeRequestedAt}</span></div>
        <div class="row"><span>Decided (UTC)</span><span>${safeDecidedAt}</span></div>
      </div>
      <div class="actions">
        <a class="btn" href="${escapeHtml(returnUrl)}">Open Fallout Codex</a>
      </div>
    </section>
  </body>
</html>`;
}

function buildFalloutEmailButtonStyle({ tone = "neutral", enabled = true } = {}) {
  const palettes = {
    approve: {
      border: enabled ? "rgba(139,255,139,0.52)" : "rgba(139,255,139,0.22)",
      text: enabled ? "#dcffcf" : "#7ea87b",
      glow: enabled ? "rgba(139,255,139,0.18)" : "rgba(0,0,0,0)"
    },
    decline: {
      border: enabled ? "rgba(255,133,133,0.58)" : "rgba(255,133,133,0.24)",
      text: enabled ? "#ffd0d0" : "#c38b8b",
      glow: enabled ? "rgba(255,133,133,0.16)" : "rgba(0,0,0,0)"
    },
    neutral: {
      border: enabled ? "rgba(255,225,122,0.46)" : "rgba(255,225,122,0.22)",
      text: enabled ? "#fff1bd" : "#bba874",
      glow: enabled ? "rgba(255,225,122,0.14)" : "rgba(0,0,0,0)"
    }
  };

  const palette = palettes[tone] || palettes.neutral;
  return [
    "display:inline-block",
    "padding:12px 16px",
    "border-radius:12px",
    `border:1px solid ${palette.border}`,
    `color:${palette.text}`,
    "background:linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.18)),rgba(6,10,6,0.84)",
    `box-shadow:inset 0 0 0 1px rgba(0,0,0,0.35), 0 0 24px ${palette.glow}`,
    "text-decoration:none",
    "text-transform:uppercase",
    "letter-spacing:.12em",
    "font-size:12px",
    "font-weight:700",
    "font-family:Consolas,'Courier New',monospace",
    enabled ? "" : "pointer-events:none"
  ].filter(Boolean).join(";");
}

function buildFalloutEmailCardsGrid(cards = []) {
  const safeCards = Array.isArray(cards) ? cards.filter(Boolean) : [];
  if (!safeCards.length) {
    return "";
  }

  const rows = [];
  for (let index = 0; index < safeCards.length; index += 2) {
    const left = safeCards[index];
    const right = safeCards[index + 1] || null;
    const renderCell = (card) => {
      if (!card) {
        return "<td width=\"50%\" style=\"padding:0 0 12px 10px;vertical-align:top;\">&nbsp;</td>";
      }
      return `<td width="50%" style="padding:0 ${card === left ? "10px 12px 0" : "0 0 12px 10px"};vertical-align:top;">
        <div style="min-height:94px;padding:12px 14px;border:1px solid rgba(139,255,139,0.2);border-radius:16px;background:linear-gradient(140deg,rgba(255,225,122,0.08),rgba(255,225,122,0.01) 34%,rgba(0,0,0,0.18)),rgba(8,12,8,0.84);box-shadow:inset 0 0 0 1px rgba(0,0,0,0.42),0 10px 24px rgba(0,0,0,0.18);">
          <div style="margin:0 0 8px;color:#ffe88d;font-size:11px;letter-spacing:.22em;text-transform:uppercase;">${card.label}</div>
          <div style="color:#e6ffd7;font-size:${card.mono ? "15px" : "16px"};line-height:1.45;${card.mono ? "font-family:Consolas,'Courier New',monospace;" : ""}white-space:pre-wrap;word-break:break-word;">${card.value}</div>
        </div>
      </td>`;
    };

    rows.push(`<tr>${renderCell(left)}${renderCell(right)}</tr>`);
  }

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;">${rows.join("")}</table>`;
}

function buildFalloutEmailPanel({ kicker, title = "", bodyHtml = "", accent = "green" } = {}) {
  const accentColor = accent === "amber" ? "#ffefaf" : "#d8ffd8";
  const borderColor = accent === "amber" ? "rgba(255,225,122,0.28)" : "rgba(139,255,139,0.24)";
  const glow = accent === "amber" ? "rgba(255,225,122,0.08)" : "rgba(139,255,139,0.08)";
  return `<div style="margin-top:14px;padding:14px 16px;border:1px solid ${borderColor};border-radius:16px;background:linear-gradient(135deg,${glow},rgba(0,0,0,0) 48%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.2)),rgba(8,12,8,0.8);box-shadow:inset 0 0 0 1px rgba(0,0,0,0.4),0 14px 28px rgba(0,0,0,0.16);">
    <div style="margin:0 0 8px;color:#ffe88d;font-size:11px;letter-spacing:.22em;text-transform:uppercase;">${kicker}</div>
    ${title ? `<div style="margin:0 0 10px;color:${accentColor};font-size:18px;line-height:1.2;letter-spacing:.06em;text-transform:uppercase;">${title}</div>` : ""}
    <div style="color:#d8ffd8;font-size:14px;line-height:1.55;white-space:pre-wrap;word-break:break-word;">${bodyHtml}</div>
  </div>`;
}

function buildFalloutEmailDiscordProfileCard({ user, identity, metaRows = [] } = {}) {
  const safeAvatarUrl = escapeHtml(resolveDiscordAvatarUrl(user, 160));
  const safeDisplayName = escapeHtml(identity?.nick || "Unknown");
  const safeUsername = escapeHtml(identity?.username || "unknown");
  const safeDiscordId = escapeHtml(identity?.discordId || "Unknown");
  const safeAccountAge = escapeHtml(identity?.accountAge || "Unknown");
  const rows = Array.isArray(metaRows) ? metaRows.filter(Boolean) : [];
  const renderedRows = rows.map((row) => {
    const label = escapeHtml(String(row.label || "").trim());
    const value = String(row.value || "").trim();
    if (!label || !value) {
      return "";
    }
    return `<tr>
      <td style="padding:9px 0;border-top:1px solid rgba(255,255,255,0.06);color:#a8b3cf;font-size:11px;letter-spacing:.16em;text-transform:uppercase;">${label}</td>
      <td style="padding:9px 0 9px 12px;border-top:1px solid rgba(255,255,255,0.06);color:#f1f5ff;font-size:13px;line-height:1.45;text-align:right;word-break:break-word;">${escapeHtml(value)}</td>
    </tr>`;
  }).join("");

  return `<div style="margin-bottom:16px;border:1px solid rgba(129,150,255,0.22);border-radius:18px;overflow:hidden;background:linear-gradient(180deg,rgba(88,101,242,0.08),rgba(0,0,0,0.08) 38%,rgba(8,10,16,0.96)),#101320;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.03),0 18px 34px rgba(0,0,0,0.22);">
    <div style="height:74px;background:
      radial-gradient(320px 140px at 0% 0%, rgba(88,101,242,0.36), rgba(88,101,242,0.02) 56%),
      linear-gradient(135deg, rgba(88,101,242,0.34), rgba(35,39,52,0.92) 58%, rgba(10,12,18,0.98));"></div>
    <div style="padding:0 18px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:90px;vertical-align:top;padding-right:14px;">
            <img src="${safeAvatarUrl}" alt="" width="80" height="80" style="display:block;width:80px;height:80px;margin-top:-38px;border-radius:50%;border:6px solid #101320;background:#101320;box-shadow:0 0 0 1px rgba(255,255,255,0.08);" />
          </td>
          <td style="vertical-align:top;padding-top:12px;">
            <div style="color:#ffffff;font-size:21px;line-height:1.2;font-weight:700;">${safeDisplayName}</div>
            <div style="margin-top:4px;color:#b9c0d4;font-size:13px;line-height:1.4;">@${safeUsername}</div>
            <div style="margin-top:10px;">
              <span style="display:inline-block;margin:0 8px 8px 0;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,0.06);color:#d8def1;font-size:11px;letter-spacing:.12em;text-transform:uppercase;">Account Age: ${safeAccountAge}</span>
              <span style="display:inline-block;margin:0 8px 8px 0;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,0.06);color:#d8def1;font-size:11px;letter-spacing:.12em;text-transform:uppercase;">ID: ${safeDiscordId}</span>
            </div>
          </td>
        </tr>
      </table>
      ${renderedRows ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:12px;border-collapse:collapse;">${renderedRows}</table>` : ""}
    </div>
  </div>`;
}

function buildFalloutEmailShell({
  preheader = "",
  badge = "",
  headerEyebrow = "",
  title = "",
  lead = "",
  accent = "green",
  cardsHtml = "",
  sectionsHtml = "",
  actionsTitle = "",
  actionsHtml = "",
  footerNote = "",
  footerActionHtml = ""
} = {}) {
  const accentLine = accent === "amber" ? "rgba(255,225,122,0.34)" : "rgba(139,255,139,0.34)";
  const badgeBorder = accent === "amber" ? "rgba(255,225,122,0.48)" : "rgba(139,255,139,0.44)";
  const badgeText = accent === "amber" ? "#fff1bd" : "#dcffcf";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#070803;color:#d8ffd8;font-family:Consolas,'Courier New',monospace;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preheader}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse;background:
      radial-gradient(1200px 700px at 100% 0%, rgba(255,225,122,0.12), rgba(0,0,0,0) 54%),
      radial-gradient(1000px 700px at 0% 100%, rgba(139,255,139,0.10), rgba(0,0,0,0) 58%),
      #070803;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:720px;width:100%;border-collapse:separate;border-spacing:0;border:1px solid ${accentLine};border-radius:20px;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.2)),rgba(7,10,7,0.92);box-shadow:0 0 0 1px rgba(0,0,0,0.45) inset,0 20px 60px rgba(0,0,0,0.62);">
            <tr>
              <td style="padding:0;">
                <div style="height:6px;background:
                  linear-gradient(90deg,rgba(139,255,139,0.34),rgba(255,225,122,0.24) 45%,rgba(0,0,0,0) 100%);"></div>
                <div style="padding:16px 18px;border-bottom:1px solid ${accentLine};background:
                  linear-gradient(90deg,rgba(255,225,122,0.16),rgba(255,225,122,0.02) 45%,rgba(0,0,0,0) 70%),
                  linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.15));">
                <div style="margin:0 0 10px;color:#97cf97;font-size:11px;letter-spacing:.24em;text-transform:uppercase;">${headerEyebrow}</div>
                <span style="display:inline-block;padding:5px 10px;border:1px solid ${badgeBorder};border-radius:999px;color:${badgeText};background:rgba(0,0,0,0.32);font-size:11px;letter-spacing:.12em;text-transform:uppercase;">${badge}</span>
                <div style="margin:14px 0 8px;color:#fff3ca;font-size:22px;line-height:1.2;letter-spacing:.08em;text-transform:uppercase;">${title}</div>
                <div style="color:#cfeecf;font-size:14px;line-height:1.6;">${lead}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px;">
                ${cardsHtml}
                ${sectionsHtml}
                <div style="margin-top:16px;padding:14px 16px;border:1px solid rgba(255,225,122,0.24);border-radius:16px;background:linear-gradient(180deg,rgba(255,225,122,0.05),rgba(0,0,0,0.16)),rgba(8,12,8,0.82);box-shadow:inset 0 0 0 1px rgba(0,0,0,0.4);">
                  <div style="margin:0 0 10px;color:#ffe88d;font-size:11px;letter-spacing:.22em;text-transform:uppercase;">${actionsTitle}</div>
                  <div style="font-size:0;line-height:0;">${actionsHtml}</div>
                  ${footerNote ? `<div style="margin-top:12px;color:#a7d7a7;font-size:12px;line-height:1.5;">${footerNote}</div>` : ""}
                </div>
                ${footerActionHtml ? `<div style="margin-top:14px;text-align:right;">${footerActionHtml}</div>` : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildAccessRequestEmailContent({ user, requestEntry, req }) {
  const identity = resolveAccessRequestIdentity(user, requestEntry);
  const safeReason = escapeHtml(identity.reason);
  const safeReasonHtml = safeReason ? safeReason.replace(/\n/g, "<br />") : "";
  const baseUrl = getRequestBaseUrl(req);
  const returnUrl = baseUrl ? `${baseUrl}/#files` : "";
  const requestedAtMs = Date.parse(String(requestEntry?.requestedAt || "").trim());
  const decisionWindowStartMs = Number.isFinite(requestedAtMs) && requestedAtMs > 0 ? requestedAtMs : Date.now();
  const decisionExpiresAtMs = decisionWindowStartMs + ACCESS_REQUEST_DECISION_TTL_MS;
  const decisionExpiresAtLabel = formatUtcTimestamp(decisionExpiresAtMs);
  const approveLink = baseUrl
    ? buildAccessRequestDecisionLink({
        baseUrl,
        requestId: requestEntry.requestId,
        action: "approve",
        expiresAtMs: decisionExpiresAtMs
      })
    : "";
  const declineLink = baseUrl
    ? buildAccessRequestDecisionLink({
        baseUrl,
        requestId: requestEntry.requestId,
        action: "decline",
        expiresAtMs: decisionExpiresAtMs
      })
    : "";
  const safeApproveHref = escapeHtml(approveLink || "#");
  const safeDeclineHref = escapeHtml(declineLink || "#");
  const safeRequestId = escapeHtml(String(requestEntry?.requestId || "Unknown"));
  const cardsHtml = [
    buildFalloutEmailDiscordProfileCard({
      user,
      identity,
      metaRows: [
        { label: "Linked Mail", value: identity.email },
        { label: "Request Logged (UTC)", value: identity.requestTime }
      ]
    }),
    buildFalloutEmailCardsGrid([
      {
        label: escapeHtml("Request ID"),
        value: safeRequestId,
        mono: true
      },
      {
        label: escapeHtml("Review Window Ends"),
        value: escapeHtml(decisionExpiresAtLabel),
        mono: true
      }
    ])
  ].join("");
  const sectionsHtml = [
    buildFalloutEmailPanel({
      kicker: escapeHtml("Filed Purpose"),
      title: escapeHtml("Requested Archive Access"),
      bodyHtml: safeReasonHtml || "No access reason was provided.",
      accent: "amber"
    }),
    buildFalloutEmailPanel({
      kicker: escapeHtml("Relay Notes"),
      title: escapeHtml("Operational Summary"),
      bodyHtml: [
        "A new clearance request has been intercepted from the restricted archive intake relay.",
        `Decision links expire at <strong>${escapeHtml(decisionExpiresAtLabel)}</strong>.`,
        baseUrl
          ? "If no action is taken before expiration, this request is automatically declined."
          : "Direct action links are unavailable because PUBLIC_BASE_URL is not configured on the server."
      ].join("<br /><br />"),
      accent: "green"
    })
  ].join("");
  const actionsHtml = [
    `<a href="${safeApproveHref}" style="${buildFalloutEmailButtonStyle({ tone: "approve", enabled: Boolean(approveLink) })};margin:0 10px 10px 0;">Approve Clearance</a>`,
    `<a href="${safeDeclineHref}" style="${buildFalloutEmailButtonStyle({ tone: "decline", enabled: Boolean(declineLink) })};margin:0 10px 10px 0;">Decline Request</a>`,
    returnUrl
      ? `<a href="${escapeHtml(returnUrl)}" style="${buildFalloutEmailButtonStyle({ tone: "neutral", enabled: true })};margin:0 10px 10px 0;">Open Fallout Codex</a>`
      : ""
  ].join("");
  const footerNote = baseUrl
    ? "Use the command buttons above to decide the request directly from the relay message."
    : "Set PUBLIC_BASE_URL to a public origin if you want clickable decision links inside admin email alerts.";

  const subject = `[Fallout Codex] Access Review Required - ${identity.username} (${identity.discordId})`;
  const text = [
    "FALLOUT CODEX - ACCESS REVIEW REQUIRED",
    "",
    `Nick: ${identity.nick}`,
    `Username: ${identity.username}`,
    `Email: ${identity.email}`,
    `Discord ID: ${identity.discordId}`,
    `Account Age: ${identity.accountAge}`,
    `Request Time (UTC): ${identity.requestTime}`,
    "",
    `Approve: ${approveLink || "Unavailable (set PUBLIC_BASE_URL or use a public host)"}`,
    `Decline: ${declineLink || "Unavailable (set PUBLIC_BASE_URL or use a public host)"}`,
    `Decision link expires: ${decisionExpiresAtLabel}`,
    "If no action is taken before expiration, this application is auto-declined.",
    "",
    "Reason:",
    identity.reason || "Not provided"
  ].join("\n");

  return {
    subject,
    text,
    html: buildFalloutEmailShell({
      preheader: escapeHtml(`New access request from ${identity.username} is waiting for review.`),
      badge: escapeHtml("Access Review Required"),
      headerEyebrow: escapeHtml("Fallout Codex // Secure File Intake"),
      title: escapeHtml("New Clearance Request"),
      lead: "A new visitor has requested access to the restricted archive. Review the identity relay, inspect the stated purpose, and issue a command before the review window closes.",
      accent: "green",
      cardsHtml,
      sectionsHtml,
      actionsTitle: escapeHtml("Command Actions"),
      actionsHtml,
      footerNote
    })
  };
}

async function sendAccessRequestEmail({ user, requestEntry, req }) {
  if (!mailTransport) {
    throw new Error("Mail transport is not configured");
  }

  const content = buildAccessRequestEmailContent({
    user,
    requestEntry,
    req
  });
  await mailTransport.sendMail({
    from: SMTP_FROM,
    to: ACCESS_REQUEST_EMAIL_TO,
    subject: content.subject,
    text: content.text,
    html: content.html
  });
}

function buildDisclaimerReevaluationEmailContent({ user, accessRequestState, explanation, req }) {
  const sanitizedExplanation = sanitizeAccessRequestReason(explanation);
  const identity = resolveAccessRequestIdentity(user, {
    email: accessRequestState?.email || "",
    reason: sanitizedExplanation,
    requestedAt: accessRequestState?.requestedAt || ""
  });

  const safeRequestId = escapeHtml(String(accessRequestState?.requestId || "Unknown"));
  const safeOriginalReason = escapeHtml(sanitizeAccessRequestReason(accessRequestState?.reason || ""));
  const safeOriginalReasonHtml = safeOriginalReason ? safeOriginalReason.replace(/\n/g, "<br />") : "";
  const safeExplanation = escapeHtml(sanitizedExplanation);
  const safeExplanationHtml = safeExplanation ? safeExplanation.replace(/\n/g, "<br />") : "";
  const baseUrl = getRequestBaseUrl(req);
  const returnUrl = baseUrl ? `${baseUrl}/#files` : "";
  const decisionExpiresAtMs = Date.now() + ACCESS_REQUEST_DECISION_TTL_MS;
  const decisionExpiresAtLabel = formatUtcTimestamp(decisionExpiresAtMs);
  const reapproveLink = baseUrl
    ? buildAccessRequestReevaluationDecisionLink({
        baseUrl,
        discordId: String(accessRequestState?.discordId || user?.discordId || "").trim(),
        action: "approve",
        expiresAtMs: decisionExpiresAtMs
      })
    : "";
  const declineLink = baseUrl
    ? buildAccessRequestReevaluationDecisionLink({
        baseUrl,
        discordId: String(accessRequestState?.discordId || user?.discordId || "").trim(),
        action: "decline",
        expiresAtMs: decisionExpiresAtMs
      })
    : "";
  const safeReapproveHref = escapeHtml(reapproveLink || "#");
  const safeDeclineHref = escapeHtml(declineLink || "#");
  const cardsHtml = [
    buildFalloutEmailDiscordProfileCard({
      user,
      identity,
      metaRows: [
        { label: "Linked Mail", value: identity.email },
        { label: "Request ID", value: String(accessRequestState?.requestId || "Unknown") }
      ]
    }),
    buildFalloutEmailCardsGrid([
      {
        label: escapeHtml("Request Submitted (UTC)"),
        value: escapeHtml(formatUtcTimestamp(accessRequestState?.requestedAt || "")),
        mono: true
      },
      {
        label: escapeHtml("Previously Approved (UTC)"),
        value: escapeHtml(formatUtcTimestamp(accessRequestState?.decidedAt || "")),
        mono: true
      },
      {
        label: escapeHtml("Disclaimer Declined (UTC)"),
        value: escapeHtml(formatUtcTimestamp(accessRequestState?.disclaimerDecidedAt || "")),
        mono: true
      },
      {
        label: escapeHtml("Review Window Ends"),
        value: escapeHtml(decisionExpiresAtLabel),
        mono: true
      }
    ])
  ].join("");
  const sectionsHtml = [
    buildFalloutEmailPanel({
      kicker: escapeHtml("Original Filing"),
      title: escapeHtml("Access Request Reason"),
      bodyHtml: safeOriginalReasonHtml || "No original access reason was recorded.",
      accent: "green"
    }),
    buildFalloutEmailPanel({
      kicker: escapeHtml("Reevaluation Statement"),
      title: escapeHtml("User Follow-up Explanation"),
      bodyHtml: safeExplanationHtml || "No reevaluation explanation was provided.",
      accent: "amber"
    }),
    buildFalloutEmailPanel({
      kicker: escapeHtml("Relay Notes"),
      title: escapeHtml("Appeal Summary"),
      bodyHtml: [
        "This user was previously approved for archive access but declined the disclaimer gate.",
        `The renewed decision window closes at <strong>${escapeHtml(decisionExpiresAtLabel)}</strong>.`,
        baseUrl
          ? "Use the action controls below to restore access or leave the rejection in place."
          : "Direct action links are unavailable because PUBLIC_BASE_URL is not configured on the server."
      ].join("<br /><br />"),
      accent: "green"
    })
  ].join("");
  const actionsHtml = [
    `<a href="${safeReapproveHref}" style="${buildFalloutEmailButtonStyle({ tone: "approve", enabled: Boolean(reapproveLink) })};margin:0 10px 10px 0;">Restore Access</a>`,
    `<a href="${safeDeclineHref}" style="${buildFalloutEmailButtonStyle({ tone: "decline", enabled: Boolean(declineLink) })};margin:0 10px 10px 0;">Keep Declined</a>`,
    returnUrl
      ? `<a href="${escapeHtml(returnUrl)}" style="${buildFalloutEmailButtonStyle({ tone: "neutral", enabled: true })};margin:0 10px 10px 0;">Open Fallout Codex</a>`
      : ""
  ].join("");
  const footerNote = baseUrl
    ? "The appeal can be resolved directly from this email while the signed links remain valid."
    : "Set PUBLIC_BASE_URL to a public origin if you want clickable appeal decision links inside admin email alerts.";

  const subject = `[Fallout Codex] Disclaimer Reevaluation Request - ${identity.username} (${identity.discordId})`;
  const text = [
    "FALLOUT CODEX - DISCLAIMER REEVALUATION REQUEST",
    "",
    `Nick: ${identity.nick}`,
    `Username: ${identity.username}`,
    `Email: ${identity.email}`,
    `Discord ID: ${identity.discordId}`,
    `Account Age: ${identity.accountAge}`,
    `Request ID: ${accessRequestState?.requestId || "Unknown"}`,
    `Request Submitted (UTC): ${formatUtcTimestamp(accessRequestState?.requestedAt || "")}`,
    `Application Approved (UTC): ${formatUtcTimestamp(accessRequestState?.decidedAt || "")}`,
    `Disclaimer Declined (UTC): ${formatUtcTimestamp(accessRequestState?.disclaimerDecidedAt || "")}`,
    "",
    "Original Access Reason:",
    sanitizeAccessRequestReason(accessRequestState?.reason || "") || "Not provided",
    "",
    "User Reevaluation Explanation:",
    sanitizedExplanation || "Not provided",
    "",
    `Re-approve: ${reapproveLink || "Unavailable (set PUBLIC_BASE_URL or use a public host)"}`,
    `Decline: ${declineLink || "Unavailable (set PUBLIC_BASE_URL or use a public host)"}`,
    `Decision link expires: ${decisionExpiresAtLabel}`
  ].join("\n");

  return {
    subject,
    text,
    html: buildFalloutEmailShell({
      preheader: escapeHtml(`Disclaimer reevaluation request received from ${identity.username}.`),
      badge: escapeHtml("Reevaluation Request"),
      headerEyebrow: escapeHtml("Fallout Codex // Disclaimer Appeal Relay"),
      title: escapeHtml("Disclaimer Appeal Received"),
      lead: "An approved archive user declined the disclaimer gate and submitted a follow-up explanation. Review the original request reason and the appeal statement before restoring archive access.",
      accent: "amber",
      cardsHtml,
      sectionsHtml,
      actionsTitle: escapeHtml("Appeal Commands"),
      actionsHtml,
      footerNote
    })
  };
}

async function sendDisclaimerReevaluationEmail({ user, accessRequestState, explanation, req }) {
  if (!mailTransport) {
    throw new Error("Mail transport is not configured");
  }

  const content = buildDisclaimerReevaluationEmailContent({
    user,
    accessRequestState,
    explanation,
    req
  });
  await mailTransport.sendMail({
    from: SMTP_FROM,
    to: ACCESS_REQUEST_EMAIL_TO,
    subject: content.subject,
    text: content.text,
    html: content.html
  });
}

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, UPLOAD_DIR);
  },
  filename: (_req, file, callback) => {
    callback(null, buildStoredFilename(file.originalname));
  }
});

const tempShareUploadStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, TEMP_SHARE_UPLOAD_DIR);
  },
  filename: (_req, file, callback) => {
    callback(null, buildStoredFilename(file.originalname));
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    files: 2
  }
});

const tempShareUpload = multer({
  storage: tempShareUploadStorage,
  limits: {
    files: 1,
    fileSize: TEMP_SHARE_MAX_FILE_BYTES
  }
});

function handleUploadError(error, res) {
  if (!error) {
    return false;
  }

  if (error.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ error: "File exceeds size limit" });
    return true;
  }

  if (error instanceof multer.MulterError) {
    res.status(400).json({ error: "Invalid upload payload" });
    return true;
  }

  res.status(500).json({ error: "Upload failed" });
  return true;
}

function uploadFileWithOptionalImage(req, res, next) {
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "image", maxCount: 1 }
  ])(req, res, (error) => {
    if (handleUploadError(error, res)) {
      return;
    }
    next();
  });
}

function uploadFileOnly(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (handleUploadError(error, res)) {
      return;
    }
    next();
  });
}

function uploadFileMetadataUpdate(req, res, next) {
  upload.fields([
    { name: "image", maxCount: 1 }
  ])(req, res, (error) => {
    if (handleUploadError(error, res)) {
      return;
    }
    next();
  });
}

function uploadTempShareFile(req, res, next) {
  tempShareUpload.single("file")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }
    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: `File exceeds the ${Math.round(TEMP_SHARE_MAX_FILE_BYTES / (1024 * 1024))} MB limit.` });
      return;
    }
    if (error instanceof multer.MulterError) {
      res.status(400).json({ error: "Invalid temporary share upload payload" });
      return;
    }
    res.status(500).json({ error: "Temporary share upload failed" });
  });
}

function ensureTempShareUploadSlotAvailable(_req, res, next) {
  if (getActiveTempShareEntries().length > 0) {
    res.status(409).json({ error: "Delete the current temporary share before uploading another file." });
    return;
  }
  next();
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let redisClient = null;
let sessionStore = null;
let sessionStoreLabel = "MemoryStore";

if (REDIS_URL) {
  redisClient = createClient({
    url: REDIS_URL
  });
  redisClient.on("error", (error) => {
    const message = error && error.message ? error.message : String(error || "Unknown Redis error");
    console.error("[redis] client error:", message);
  });
  sessionStore = new RedisStore({
    client: redisClient,
    prefix: SESSION_REDIS_PREFIX,
    ttl: SESSION_TTL_SECONDS
  });
  sessionStoreLabel = `Redis (${SESSION_REDIS_PREFIX})`;
}

const sessionOptions = {
  name: SESSION_COOKIE_NAME,
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: NODE_ENV === "production",
    maxAge: SESSION_COOKIE_MAX_AGE_MS
  }
};

if (sessionStore) {
  sessionOptions.store = sessionStore;
}

app.use(session(sessionOptions));

app.get("/api/me", (req, res) => {
  res.json(buildMePayload(req));
});

app.get("/admin/access-requests/decision", (req, res) => {
  const requestId = String(req.query.rid || "").trim().toLowerCase();
  const action = String(req.query.action || "").trim().toLowerCase();
  const expRaw = String(req.query.exp || "").trim();
  const token = String(req.query.token || "").trim();
  const declineReason = sanitizeAccessRequestReason(String(req.query.reason || ""));
  const baseUrl = getRequestBaseUrl(req);

  const invalidResponse = (statusCode, title, statusLabel, message, entry = null, accent = "#ff9a9a") => {
    res.status(statusCode).send(
      buildAccessRequestDecisionPage({
        title,
        statusLabel,
        message,
        accent,
        baseUrl,
        entry
      })
    );
  };

  if (!/^[a-f0-9-]{36}$/i.test(requestId) || !ACCESS_REQUEST_DECISION_ACTIONS.has(action) || !expRaw || !token) {
    invalidResponse(400, "Invalid Decision Link", "Invalid Request", "The decision link is malformed or incomplete.");
    return;
  }

  const expiresAtMs = Number.parseInt(expRaw, 10);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= 0) {
    invalidResponse(400, "Invalid Decision Link", "Invalid Expiration", "The decision link expiration is invalid.");
    return;
  }

  const storedEntry = getAccessRequestEntryByRequestId(requestId);

  if (Date.now() > expiresAtMs) {
    const currentStatus = normalizeAccessRequestStatus(storedEntry?.status);
    if (currentStatus === ACCESS_REQUEST_STATUS.APPROVED || currentStatus === ACCESS_REQUEST_STATUS.DECLINED) {
      const alreadyApproved = currentStatus === ACCESS_REQUEST_STATUS.APPROVED;
      invalidResponse(
        200,
        "Decision Already Recorded",
        alreadyApproved ? "Already Approved" : "Already Declined",
        `This request was already marked as ${currentStatus.toUpperCase()}.`,
        storedEntry,
        alreadyApproved ? "#8bff8b" : "#ffb3b3"
      );
      return;
    }
    invalidResponse(
      410,
      "Decision Link Expired",
      "Expired",
      "This decision link expired after 2 days. The pending application was auto-declined.",
      storedEntry
    );
    return;
  }

  if (!verifyAccessRequestDecisionToken(requestId, action, expiresAtMs, token)) {
    invalidResponse(403, "Decision Link Rejected", "Forbidden", "Token verification failed for this decision link.");
    return;
  }

  const decision = applyAccessRequestDecision(requestId, action, {
    declineReason: action === "decline" ? declineReason : ""
  });
  if (!decision.ok && decision.reason === "not_found") {
    invalidResponse(404, "Request Not Found", "Missing", "No matching access request was found for this decision link.");
    return;
  }
  if (!decision.ok && decision.reason === "already_decided") {
    const entry = decision.entry || null;
    const currentStatus = normalizeAccessRequestStatus(entry?.status);
    const statusLabel = currentStatus === ACCESS_REQUEST_STATUS.APPROVED ? "Already Approved" : "Already Declined";
    const accent = currentStatus === ACCESS_REQUEST_STATUS.APPROVED ? "#8bff8b" : "#ffb3b3";
    invalidResponse(
      200,
      "Decision Already Recorded",
      statusLabel,
      `This request was already marked as ${currentStatus.toUpperCase()}.`,
      entry,
      accent
    );
    return;
  }
  if (!decision.ok) {
    invalidResponse(400, "Unable To Process Decision", "Invalid", "The decision request could not be processed.");
    return;
  }

  const entry = decision.entry;
  const finalStatus = normalizeAccessRequestStatus(entry?.status);
  const approved = finalStatus === ACCESS_REQUEST_STATUS.APPROVED;
  res.status(200).send(
    buildAccessRequestDecisionPage({
      title: approved ? "Application Approved" : "Application Declined",
      statusLabel: approved ? "Approved" : "Declined",
      message: approved
        ? "Access has been granted. On next login, this user will be authorized."
        : "Access has been denied. On next login, this user will see a declined status.",
      accent: approved ? "#8bff8b" : "#ffb3b3",
      baseUrl,
      entry
    })
  );
});

app.get("/admin/access-requests/reevaluation-decision", (req, res) => {
  const discordId = String(req.query.did || "").trim();
  const action = String(req.query.action || "").trim().toLowerCase();
  const expRaw = String(req.query.exp || "").trim();
  const token = String(req.query.token || "").trim();
  const declineReason = sanitizeAccessRequestReason(String(req.query.reason || ""));
  const baseUrl = getRequestBaseUrl(req);

  const invalidResponse = (statusCode, title, statusLabel, message, entry = null, accent = "#ff9a9a") => {
    res.status(statusCode).send(
      buildAccessRequestDecisionPage({
        title,
        statusLabel,
        message,
        accent,
        baseUrl,
        entry
      })
    );
  };

  if (!isDiscordId(discordId) || !ACCESS_REQUEST_DECISION_ACTIONS.has(action) || !expRaw || !token) {
    invalidResponse(400, "Invalid Reevaluation Link", "Invalid Request", "The reevaluation link is malformed or incomplete.");
    return;
  }

  const expiresAtMs = Number.parseInt(expRaw, 10);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= 0) {
    invalidResponse(400, "Invalid Reevaluation Link", "Invalid Expiration", "The reevaluation link expiration is invalid.");
    return;
  }

  const currentState = getAccessRequestState(discordId);
  const currentStatus = normalizeAccessRequestStatus(currentState.status);
  const currentDisclaimerDecision = normalizeAccessDisclaimerDecision(currentState.disclaimerDecision);

  const resolvedApproved = currentStatus === ACCESS_REQUEST_STATUS.APPROVED
    && currentDisclaimerDecision === ACCESS_DISCLAIMER_DECISION.NONE;
  const resolvedDeclined = currentStatus === ACCESS_REQUEST_STATUS.DECLINED;
  if (Date.now() > expiresAtMs) {
    if (resolvedApproved || resolvedDeclined) {
      invalidResponse(
        200,
        "Reevaluation Already Processed",
        resolvedApproved ? "Already Re-approved" : "Already Declined",
        resolvedApproved
          ? "This reevaluation request was already marked as RE-APPROVED."
          : "This reevaluation request was already marked as DECLINED.",
        currentState,
        resolvedApproved ? "#8bff8b" : "#ffb3b3"
      );
      return;
    }
    invalidResponse(410, "Reevaluation Link Expired", "Expired", "This reevaluation decision link has expired.");
    return;
  }

  if (!verifyAccessRequestReevaluationDecisionToken(discordId, action, expiresAtMs, token)) {
    invalidResponse(403, "Reevaluation Link Rejected", "Forbidden", "Token verification failed for this reevaluation link.");
    return;
  }

  const decision = applyAccessRequestReevaluationDecisionByDiscordId(discordId, action, {
    declineReason: action === "decline" ? declineReason : ""
  });
  if (!decision.ok && decision.reason === "not_found") {
    invalidResponse(404, "Request Not Found", "Missing", "No matching access request entry was found.");
    return;
  }
  if (!decision.ok && decision.reason === "state_mismatch") {
    const entry = decision.entry || null;
    const entryStatus = normalizeAccessRequestStatus(entry?.status);
    const entryDisclaimer = normalizeAccessDisclaimerDecision(entry?.disclaimerDecision);
    const alreadyReapproved = entryStatus === ACCESS_REQUEST_STATUS.APPROVED
      && entryDisclaimer === ACCESS_DISCLAIMER_DECISION.NONE;
    const alreadyDeclined = entryStatus === ACCESS_REQUEST_STATUS.DECLINED;
    if (alreadyReapproved || alreadyDeclined) {
      invalidResponse(
        200,
        "Reevaluation Already Processed",
        alreadyReapproved ? "Already Re-approved" : "Already Declined",
        alreadyReapproved
          ? "This reevaluation request was already marked as RE-APPROVED."
          : "This reevaluation request was already marked as DECLINED.",
        entry,
        alreadyReapproved ? "#8bff8b" : "#ffb3b3"
      );
      return;
    }
    invalidResponse(409, "Reevaluation Not Applicable", "State Mismatch", "This account is not currently waiting on a disclaimer reevaluation.", entry);
    return;
  }
  if (!decision.ok) {
    invalidResponse(400, "Unable To Process Reevaluation", "Invalid", "The reevaluation decision could not be processed.");
    return;
  }

  const entry = decision.entry || null;
  const approved = action === "approve";
  res.status(200).send(
    buildAccessRequestDecisionPage({
      title: approved ? "Reevaluation Re-approved" : "Reevaluation Declined",
      statusLabel: approved ? "Re-approved" : "Declined",
      message: approved
        ? "Disclaimer state was reset. The user must accept the disclaimer again on next login."
        : "Application is now declined. User must reapply after admin unlocks reapply.",
      accent: approved ? "#8bff8b" : "#ffb3b3",
      baseUrl,
      entry
    })
  );
});

app.post("/api/files/access-request", async (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Login required" });
    return;
  }
  const reasonRaw = String(req.body?.reason || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!reasonRaw) {
    res.status(400).json({ error: "Access reason is required." });
    return;
  }
  if (reasonRaw.length > ACCESS_REQUEST_REASON_MAX_CHARS) {
    res.status(400).json({ error: `Access reason exceeds ${ACCESS_REQUEST_REASON_MAX_CHARS} characters.` });
    return;
  }
  const reason = sanitizeAccessRequestReason(reasonRaw);

  const accessRequestState = getAccessRequestState(user.discordId);
  if (isAuthorized(user, accessRequestState)) {
    res.status(409).json({ error: "Account is already authorized" });
    return;
  }
  if (accessRequestState.status === ACCESS_REQUEST_STATUS.APPROVED) {
    res.status(409).json({ error: "Account is already approved" });
    return;
  }
  if (accessRequestState.status === ACCESS_REQUEST_STATUS.PENDING) {
    res.status(429).json({ error: "An access request is already pending review." });
    return;
  }
  if (accessRequestState.status === ACCESS_REQUEST_STATUS.DECLINED) {
    const reapplyRemainingMs = getAccessRequestReapplyRemainingMs(accessRequestState);
    if (reapplyRemainingMs > 0) {
      const retrySeconds = Math.ceil(reapplyRemainingMs / 1000);
      const reapplyAtIso = getAccessRequestReapplyAtIso(accessRequestState);
      res.status(429).json({
        error: "Application was declined. Reapply after the cooldown expires.",
        retryAfterMs: reapplyRemainingMs,
        retryAfterSeconds: retrySeconds,
        reapplyAt: reapplyAtIso
      });
      return;
    }
  }
  if (!mailTransport) {
    res.status(503).json({ error: "Access request email service is not configured" });
    return;
  }

  const cooldownRemainingMs = getAccessRequestCooldownRemainingMs(user.discordId);
  if (cooldownRemainingMs > 0) {
    const retrySeconds = Math.ceil(cooldownRemainingMs / 1000);
    res.status(429).json({ error: `Request recently sent. Try again in ${retrySeconds}s.` });
    return;
  }

  try {
    const requestEntry = createPendingAccessRequestEntry(user, reason);
    await sendAccessRequestEmail({
      user,
      requestEntry,
      req
    });
    upsertAccessRequestEntry(requestEntry);
    markAccessRequestSent(user.discordId);
    res.json({ ok: true });
  } catch (error) {
    console.error("[access-request] email send error:", error);
    res.status(500).json({ error: "Unable to send access request email" });
  }
});

app.post("/api/files/disclaimer-decision", (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Login required" });
    return;
  }
  if (isAdmin(user) || ALLOWED_DISCORD_IDS.has(user.discordId)) {
    res.status(409).json({ error: "Disclaimer decision is not required for this account." });
    return;
  }

  const decisionRaw = String(req.body?.decision || "").trim().toLowerCase();
  const decision = normalizeAccessDisclaimerDecision(decisionRaw);
  if (decision !== ACCESS_DISCLAIMER_DECISION.ACCEPTED && decision !== ACCESS_DISCLAIMER_DECISION.DECLINED) {
    res.status(400).json({ error: "Invalid disclaimer decision." });
    return;
  }

  const accessRequestState = getAccessRequestState(user.discordId);
  if (normalizeAccessRequestStatus(accessRequestState.status) !== ACCESS_REQUEST_STATUS.APPROVED) {
    res.status(409).json({ error: "Only approved applications can submit disclaimer decisions." });
    return;
  }

  const result = setAccessRequestDisclaimerDecisionByDiscordId(user.discordId, decision);
  if (!result.ok && result.reason === "not_found") {
    res.status(404).json({ error: "Access request entry not found." });
    return;
  }
  if (!result.ok && result.reason === "status_mismatch") {
    res.status(409).json({ error: "Only approved applications can submit disclaimer decisions." });
    return;
  }
  if (!result.ok && result.reason === "locked_declined") {
    res.status(409).json({ error: "Disclaimer was declined. Contact support to request reevaluation." });
    return;
  }
  if (!result.ok) {
    res.status(400).json({ error: "Unable to save disclaimer decision." });
    return;
  }

  res.json({
    ok: true,
    decision: normalizeAccessDisclaimerDecision(result.entry?.disclaimerDecision),
    decidedAt: String(result.entry?.disclaimerDecidedAt || ""),
    me: buildMePayload(req)
  });
});

app.post("/api/files/disclaimer-reevaluation", async (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Login required" });
    return;
  }
  if (!mailTransport) {
    res.status(503).json({ error: "Access request email service is not configured" });
    return;
  }
  if (isAdmin(user) || ALLOWED_DISCORD_IDS.has(user.discordId)) {
    res.status(409).json({ error: "Reevaluation request is not required for this account." });
    return;
  }

  const accessRequestState = getAccessRequestState(user.discordId);
  if (normalizeAccessRequestStatus(accessRequestState.status) !== ACCESS_REQUEST_STATUS.APPROVED) {
    res.status(409).json({ error: "Only approved applications can submit reevaluation requests." });
    return;
  }
  if (normalizeAccessDisclaimerDecision(accessRequestState.disclaimerDecision) !== ACCESS_DISCLAIMER_DECISION.DECLINED) {
    res.status(409).json({ error: "Reevaluation requests are only available after declining the disclaimer." });
    return;
  }

  const explanationRaw = String(req.body?.explanation || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!explanationRaw) {
    res.status(400).json({ error: "A reevaluation explanation is required." });
    return;
  }
  if (explanationRaw.length > FILES_DISCLAIMER_REEVALUATION_MAX_CHARS) {
    res.status(400).json({
      error: `Reevaluation explanation exceeds ${FILES_DISCLAIMER_REEVALUATION_MAX_CHARS} characters.`
    });
    return;
  }

  const explanation = sanitizeAccessRequestReason(explanationRaw);

  const pendingResult = markAccessRequestDisclaimerReevaluationPendingByDiscordId(user.discordId);
  if (!pendingResult.ok && pendingResult.reason === "not_found") {
    res.status(404).json({ error: "Access request entry not found." });
    return;
  }
  if (!pendingResult.ok && pendingResult.reason === "state_mismatch") {
    res.status(409).json({ error: "Reevaluation requests are only available after declining the disclaimer." });
    return;
  }
  if (!pendingResult.ok && pendingResult.reason === "already_pending") {
    res.status(429).json({ error: "A reevaluation request is already pending review." });
    return;
  }
  if (!pendingResult.ok) {
    res.status(400).json({ error: "Unable to start reevaluation request." });
    return;
  }

  try {
    await sendDisclaimerReevaluationEmail({
      user,
      accessRequestState: pendingResult.entry || accessRequestState,
      explanation,
      req
    });
    res.json({ ok: true });
  } catch (error) {
    clearAccessRequestDisclaimerReevaluationPendingByDiscordId(user.discordId);
    console.error("[disclaimer-reevaluation] email send error:", error);
    res.status(500).json({ error: "Unable to send reevaluation request email" });
  }
});

app.get("/api/files/access-requests", requireAdmin, (_req, res) => {
  res.json({
    entries: getAccessRequestAdminEntries()
  });
});

app.post("/api/files/access-requests/:requestId/decision", requireAdmin, (req, res) => {
  const requestId = String(req.params.requestId || "").trim().toLowerCase();
  const action = String(req.body?.action || "").trim().toLowerCase();
  const declineReasonRaw = String(req.body?.declineReason || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
  if (action === "decline" && declineReasonRaw.length > ACCESS_REQUEST_REASON_MAX_CHARS) {
    res.status(400).json({ error: `Decline reason exceeds ${ACCESS_REQUEST_REASON_MAX_CHARS} characters.` });
    return;
  }
  const declineReason = action === "decline" ? sanitizeAccessRequestReason(declineReasonRaw) : "";
  if (!/^[a-f0-9-]{36}$/i.test(requestId)) {
    res.status(400).json({ error: "Invalid request id" });
    return;
  }
  if (!ACCESS_REQUEST_DECISION_ACTIONS.has(action)) {
    res.status(400).json({ error: "Invalid decision action" });
    return;
  }

  const decision = applyAccessRequestDecision(requestId, action, {
    declineReason
  });
  if (!decision.ok && decision.reason === "not_found") {
    res.status(404).json({ error: "Access request not found" });
    return;
  }
  if (!decision.ok && decision.reason === "already_decided") {
    const status = normalizeAccessRequestStatus(decision.entry?.status);
    const statusLabel = status === ACCESS_REQUEST_STATUS.APPROVED ? "approved" : "declined";
    res.status(409).json({ error: `This request was already ${statusLabel}.` });
    return;
  }
  if (!decision.ok) {
    res.status(400).json({ error: "Unable to process request decision" });
    return;
  }

  res.json({
    ok: true,
    entry: decision.entry
  });
});

app.post("/api/files/access-requests/:discordId/unauthorize", requireAdmin, (req, res) => {
  const discordId = String(req.params.discordId || "").trim();
  if (!isDiscordId(discordId)) {
    res.status(400).json({ error: "Invalid Discord ID" });
    return;
  }
  if (discordId === ADMIN_DISCORD_ID) {
    res.status(400).json({ error: "Admin account cannot be unauthorized" });
    return;
  }
  if (ALLOWED_DISCORD_IDS.has(discordId)) {
    res.status(409).json({
      error: "This user is authorized via ALLOWED_DISCORD_IDS and cannot be unauthorized from the admin panel."
    });
    return;
  }

  const result = updateAccessRequestStatusByDiscordId(discordId, ACCESS_REQUEST_STATUS.DECLINED, {
    allowedCurrentStatuses: new Set([ACCESS_REQUEST_STATUS.APPROVED])
  });

  if (!result.ok && result.reason === "not_found") {
    res.status(404).json({ error: "Access request entry not found for this Discord ID" });
    return;
  }
  if (!result.ok && result.reason === "status_mismatch") {
    const currentStatus = normalizeAccessRequestStatus(result.entry?.status);
    if (currentStatus === ACCESS_REQUEST_STATUS.PENDING) {
      res.status(409).json({ error: "This request is still pending. Use deny for pending applications." });
      return;
    }
    if (currentStatus === ACCESS_REQUEST_STATUS.DECLINED) {
      res.status(409).json({ error: "This user is already unauthorized." });
      return;
    }
    res.status(409).json({ error: "Only approved users can be unauthorized." });
    return;
  }
  if (!result.ok && result.reason === "already_set") {
    res.status(409).json({ error: "This user is already unauthorized." });
    return;
  }
  if (!result.ok) {
    res.status(400).json({ error: "Unable to unauthorize this user" });
    return;
  }

  res.json({
    ok: true,
    entry: result.entry
  });
});

app.post("/api/files/access-requests/:discordId/allow-reapply", requireAdmin, (req, res) => {
  const discordId = String(req.params.discordId || "").trim();
  if (!isDiscordId(discordId)) {
    res.status(400).json({ error: "Invalid Discord ID" });
    return;
  }

  const result = clearDeclinedAccessRequestForReapply(discordId);
  if (!result.ok && result.reason === "not_found") {
    res.status(404).json({ error: "Access request entry not found for this Discord ID" });
    return;
  }
  if (!result.ok && result.reason === "status_mismatch") {
    const currentStatus = normalizeAccessRequestStatus(result.entry?.status);
    const disclaimerDecision = normalizeAccessDisclaimerDecision(result.entry?.disclaimerDecision);
    if (currentStatus === ACCESS_REQUEST_STATUS.PENDING) {
      res.status(409).json({ error: "This application is pending. Use approve or deny instead." });
      return;
    }
    if (currentStatus === ACCESS_REQUEST_STATUS.APPROVED) {
      if (disclaimerDecision === ACCESS_DISCLAIMER_DECISION.DECLINED) {
        res.status(409).json({
          error: "This account is waiting on disclaimer reevaluation. Use allow reapply to reset disclaimer acceptance."
        });
        return;
      }
      res.status(409).json({ error: "This user is approved. Use unauthorize to revoke access." });
      return;
    }
    res.status(409).json({ error: "Only declined applications can be unlocked for reapply." });
    return;
  }
  if (!result.ok) {
    res.status(400).json({ error: "Unable to allow reapply for this user" });
    return;
  }

  res.json({
    ok: true,
    entry: result.entry
  });
});

app.get("/api/admin/bot/overview", requireAdmin, async (_req, res) => {
  try {
    const payload = await getBotAdminOverview();
    res.json({
      ...payload,
      inviteLink: BOT_INVITE_LINK || payload?.inviteLink || ""
    });
  } catch (error) {
    sendBotAdminProxyError(res, error);
  }
});

app.post("/api/admin/bot/commands/sync", requireAdmin, async (_req, res) => {
  try {
    const payload = await syncBotAdminCommands();
    res.json(payload);
  } catch (error) {
    sendBotAdminProxyError(res, error);
  }
});

app.post("/api/admin/bot/guilds/:guildId/welcome", requireAdmin, async (req, res) => {
  try {
    const payload = await sendBotAdminWelcome(req.params.guildId);
    res.json(payload);
  } catch (error) {
    sendBotAdminProxyError(res, error);
  }
});

app.post("/api/admin/bot/guilds/:guildId/test-post", requireAdmin, async (req, res) => {
  try {
    const payload = await sendBotAdminTestPost(req.params.guildId);
    res.json(payload);
  } catch (error) {
    sendBotAdminProxyError(res, error);
  }
});

app.post("/api/admin/bot/guilds/:guildId/leave", requireAdmin, async (req, res) => {
  try {
    const payload = await leaveBotAdminGuild(req.params.guildId);
    res.json(payload);
  } catch (error) {
    sendBotAdminProxyError(res, error);
  }
});

app.post("/auth/discord", (req, res) => {
  if (!oauthConfigured()) {
    res.status(500).json({ error: "Discord OAuth is not configured on the server." });
    return;
  }

  const oauthState = crypto.randomBytes(24).toString("hex");
  const popupMode = parseBooleanQueryFlag(req.query?.popup) || parseBooleanQueryFlag(req.body?.popup);
  const returnTo = sanitizeAuthReturnTo(req.body?.returnTo || req.query?.returnTo);
  req.session.oauthState = oauthState;
  req.session.oauthPopupMode = popupMode ? "1" : "";
  req.session.oauthReturnTo = returnTo;
  const redirectUrl = buildDiscordAuthorizeUrl(oauthState);

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
    res.redirect(DEFAULT_AUTH_RETURN_TO);
    return;
  }

  const code = String(req.query.code || "").trim();
  const returnedState = String(req.query.state || "").trim();
  const expectedState = String(req.session.oauthState || "").trim();
  const popupMode = String(req.session.oauthPopupMode || "").trim() === "1";
  const returnTo = sanitizeAuthReturnTo(req.session.oauthReturnTo);
  delete req.session.oauthState;
  delete req.session.oauthPopupMode;
  delete req.session.oauthReturnTo;

  if (!code || !returnedState || returnedState !== expectedState) {
    if (popupMode) {
      sendDiscordPopupCallbackResponse(res, false);
      return;
    }
    res.redirect(returnTo);
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
      username: formatDiscordUsername(userPayload),
      discordProfile: buildDiscordProfileForSession(userPayload)
    };

    req.session.save((error) => {
      if (error) {
        if (popupMode) {
          sendDiscordPopupCallbackResponse(res, false);
          return;
        }
        res.redirect(returnTo);
        return;
      }
      if (popupMode) {
        sendDiscordPopupCallbackResponse(res, true);
        return;
      }
      res.redirect(returnTo);
    });
  } catch (error) {
    console.error("[oauth] callback error:", error);
    if (popupMode) {
      sendDiscordPopupCallbackResponse(res, false);
      return;
    }
    res.redirect(returnTo);
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
    .map((entry) => buildFileListEntry(entry))
    .filter(Boolean);

  res.json({ files });
});

app.post("/api/files/upload", requireAdmin, uploadFileWithOptionalImage, (req, res) => {
  const uploadedFile = Array.isArray(req.files?.file) ? req.files.file[0] : null;
  const uploadedImage = Array.isArray(req.files?.image) ? req.files.image[0] : null;

  const cleanupUploads = () => {
    if (uploadedFile?.filename) {
      deleteStoredUpload(uploadedFile.filename);
    } else if (uploadedFile?.path) {
      fs.unlink(uploadedFile.path, () => {});
    }
    if (uploadedImage?.filename) {
      deleteStoredUpload(uploadedImage.filename);
    } else if (uploadedImage?.path) {
      fs.unlink(uploadedImage.path, () => {});
    }
  };

  if (!uploadedFile) {
    cleanupUploads();
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const originalName = String(uploadedFile.originalname || "");
  const safeOriginalName = sanitizeDisplayFilename(originalName);
  const displayName = sanitizeFileDisplayName(req.body.displayName);
  const description = sanitizeFileDescription(req.body.description);
  const group = sanitizeFileGroup(req.body.group);
  const outdated = parseBoolean(req.body.outdated, false);
  const caution = parseBoolean(req.body.caution, false);
  const hasImageUpload = Boolean(uploadedImage);
  const safeImageName = hasImageUpload
    ? (sanitizeDisplayFilename(uploadedImage.originalname || "image") || "image")
    : "";
  const imageMimeType = hasImageUpload
    ? String(uploadedImage.mimetype || "application/octet-stream").trim()
    : "";

  if (!isValidOriginalFilename(originalName) || !safeOriginalName) {
    cleanupUploads();
    res.status(400).json({ error: "Invalid filename" });
    return;
  }

  if (!Number.isFinite(uploadedFile.size) || uploadedFile.size <= 0) {
    cleanupUploads();
    res.status(400).json({ error: "Empty uploads are not allowed" });
    return;
  }

  if (hasImageUpload && !/^image\//i.test(imageMimeType)) {
    cleanupUploads();
    res.status(400).json({ error: "Image upload must be a valid image file" });
    return;
  }

  const uploadId = crypto.randomUUID();
  const now = new Date().toISOString();
  const user = req.currentUser;

  const entry = {
    id: uploadId,
    storedName: uploadedFile.filename,
    name: safeOriginalName,
    displayName,
    mimeType: String(uploadedFile.mimetype || "application/octet-stream"),
    size: uploadedFile.size,
    downloadCount: 0,
    outdated,
    caution,
    description,
    group,
    uploadedAt: now,
    updatedAt: now,
    contentUpdatedAt: now,
    uploaderDiscordId: user.discordId,
    uploader: user.username,
    imageStoredName: hasImageUpload ? uploadedImage.filename : "",
    imageMimeType: hasImageUpload ? imageMimeType : "",
    imageName: hasImageUpload ? safeImageName : "",
    imageSize: hasImageUpload ? Math.max(0, Number(uploadedImage.size) || 0) : 0
  };

  const normalizedEntry = normalizeMetadataFileEntry(entry);
  if (!normalizedEntry) {
    cleanupUploads();
    res.status(400).json({ error: "Invalid file metadata" });
    return;
  }

  try {
    const entries = readMetadataStore();
    entries.push(normalizedEntry);
    writeMetadataStore(entries);
  } catch (error) {
    cleanupUploads();
    console.error("[files] metadata write error:", error);
    res.status(500).json({ error: "Unable to store file metadata" });
    return;
  }

  const responseFile = buildFileListEntry(normalizedEntry);
  res.status(201).json({
    ok: true,
    file: responseFile
  });
});

app.post("/api/files/:id/replace", requireAdmin, uploadFileOnly, (req, res) => {
  const fileId = String(req.params.id || "").trim().toLowerCase();
  const uploadedFile = req.file || null;
  const cleanupUploadedFile = () => {
    if (uploadedFile?.filename) {
      deleteStoredUpload(uploadedFile.filename);
    } else if (uploadedFile?.path) {
      fs.unlink(uploadedFile.path, () => {});
    }
  };

  if (!FILE_ID_PATTERN.test(fileId)) {
    cleanupUploadedFile();
    res.status(400).json({ error: "Invalid file id" });
    return;
  }

  if (!uploadedFile) {
    cleanupUploadedFile();
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const originalName = String(uploadedFile.originalname || "");
  const safeOriginalName = sanitizeDisplayFilename(originalName);

  if (!Number.isFinite(uploadedFile.size) || uploadedFile.size <= 0) {
    cleanupUploadedFile();
    res.status(400).json({ error: "Empty uploads are not allowed" });
    return;
  }

  if (!isValidOriginalFilename(originalName) || !safeOriginalName) {
    cleanupUploadedFile();
    res.status(400).json({ error: "Invalid filename" });
    return;
  }

  if (!tryLockFileMutation(fileId)) {
    cleanupUploadedFile();
    res.status(409).json({ error: "File update already in progress" });
    return;
  }

  try {
    const entries = readMetadataStore();
    const index = entries.findIndex((entry) => String(entry.id || "").toLowerCase() === fileId);
    if (index < 0) {
      cleanupUploadedFile();
      res.status(404).json({ error: "File not found" });
      return;
    }

    const currentEntry = entries[index];
    const currentStoredName = String(currentEntry.storedName || "").trim();
    const now = new Date().toISOString();
    const nextEntry = {
      ...currentEntry,
      storedName: uploadedFile.filename,
      name: safeOriginalName,
      mimeType: String(uploadedFile.mimetype || "application/octet-stream").trim() || "application/octet-stream",
      size: Math.max(0, Number(uploadedFile.size) || 0),
      updatedAt: now,
      contentUpdatedAt: now
    };

    const normalizedEntry = normalizeMetadataFileEntry(nextEntry);
    if (!normalizedEntry) {
      cleanupUploadedFile();
      res.status(400).json({ error: "Invalid file replacement" });
      return;
    }

    try {
      entries[index] = normalizedEntry;
      writeMetadataStore(entries);
    } catch (error) {
      cleanupUploadedFile();
      console.error("[files] file replace error:", error);
      res.status(500).json({ error: "Unable to replace file" });
      return;
    }

    if (currentStoredName && currentStoredName !== normalizedEntry.storedName) {
      deleteStoredUpload(currentStoredName);
    }

    const responseFile = buildFileListEntry(normalizedEntry);
    res.json({
      ok: true,
      file: responseFile
    });
  } finally {
    unlockFileMutation(fileId);
  }
});

app.patch("/api/files/:id", requireAdmin, uploadFileMetadataUpdate, (req, res) => {
  const fileId = String(req.params.id || "").trim().toLowerCase();
  const uploadedImage = Array.isArray(req.files?.image) ? req.files.image[0] : null;
  const cleanupUploadedImage = () => {
    if (uploadedImage?.filename) {
      deleteStoredUpload(uploadedImage.filename);
    } else if (uploadedImage?.path) {
      fs.unlink(uploadedImage.path, () => {});
    }
  };

  if (!FILE_ID_PATTERN.test(fileId)) {
    cleanupUploadedImage();
    res.status(400).json({ error: "Invalid file id" });
    return;
  }

  const hasDescription = Object.prototype.hasOwnProperty.call(req.body || {}, "description");
  const hasGroup = Object.prototype.hasOwnProperty.call(req.body || {}, "group");
  const hasDisplayName = Object.prototype.hasOwnProperty.call(req.body || {}, "displayName");
  const hasOutdated = Object.prototype.hasOwnProperty.call(req.body || {}, "outdated");
  const hasCaution = Object.prototype.hasOwnProperty.call(req.body || {}, "caution");
  const removeImage = parseBoolean(req.body?.removeImage, false);
  const imageMimeType = uploadedImage
    ? String(uploadedImage.mimetype || "application/octet-stream").trim()
    : "";

  if (uploadedImage && !/^image\//i.test(imageMimeType)) {
    cleanupUploadedImage();
    res.status(400).json({ error: "Image upload must be a valid image file" });
    return;
  }

  if (!tryLockFileMutation(fileId)) {
    cleanupUploadedImage();
    res.status(409).json({ error: "File update already in progress" });
    return;
  }

  try {
    const entries = readMetadataStore();
    const index = entries.findIndex((entry) => String(entry.id || "").toLowerCase() === fileId);
    if (index < 0) {
      cleanupUploadedImage();
      res.status(404).json({ error: "File not found" });
      return;
    }

    const currentEntry = entries[index];
    const currentImageStoredName = String(currentEntry.imageStoredName || "").trim();
    const now = new Date().toISOString();
    const nextEntry = {
      ...currentEntry,
      updatedAt: now
    };

    if (hasDescription) {
      nextEntry.description = sanitizeFileDescription(req.body.description);
    }
    if (hasGroup) {
      nextEntry.group = sanitizeFileGroup(req.body.group);
    }
    if (hasDisplayName) {
      nextEntry.displayName = sanitizeFileDisplayName(req.body.displayName);
    }
    if (hasOutdated) {
      nextEntry.outdated = parseBoolean(req.body.outdated, false);
    }
    if (hasCaution) {
      nextEntry.caution = parseBoolean(req.body.caution, false);
    }

    if (uploadedImage) {
      nextEntry.imageStoredName = uploadedImage.filename;
      nextEntry.imageMimeType = imageMimeType || "application/octet-stream";
      nextEntry.imageName = sanitizeDisplayFilename(uploadedImage.originalname || "image") || "image";
      nextEntry.imageSize = Math.max(0, Number(uploadedImage.size) || 0);
    } else if (removeImage) {
      nextEntry.imageStoredName = "";
      nextEntry.imageMimeType = "";
      nextEntry.imageName = "";
      nextEntry.imageSize = 0;
    }

    const normalizedEntry = normalizeMetadataFileEntry(nextEntry);
    if (!normalizedEntry) {
      cleanupUploadedImage();
      res.status(400).json({ error: "Invalid file metadata update" });
      return;
    }

    try {
      entries[index] = normalizedEntry;
      writeMetadataStore(entries);
    } catch (error) {
      cleanupUploadedImage();
      console.error("[files] metadata update error:", error);
      res.status(500).json({ error: "Unable to update file metadata" });
      return;
    }

    if (uploadedImage && currentImageStoredName && currentImageStoredName !== normalizedEntry.imageStoredName) {
      deleteStoredUpload(currentImageStoredName);
    } else if (!uploadedImage && removeImage && currentImageStoredName) {
      deleteStoredUpload(currentImageStoredName);
    }

    const responseFile = buildFileListEntry(normalizedEntry);
    res.json({
      ok: true,
      file: responseFile
    });
  } finally {
    unlockFileMutation(fileId);
  }
});

app.delete("/api/files/:id", requireAdmin, (req, res) => {
  const fileId = String(req.params.id || "").trim().toLowerCase();
  if (!FILE_ID_PATTERN.test(fileId)) {
    res.status(400).json({ error: "Invalid file id" });
    return;
  }

  if (!tryLockFileMutation(fileId)) {
    res.status(409).json({ error: "File update already in progress" });
    return;
  }

  try {
    const entries = readMetadataStore();
    const index = entries.findIndex((entry) => String(entry.id || "").toLowerCase() === fileId);
    if (index < 0) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const [entry] = entries.splice(index, 1);
    writeMetadataStore(entries);

    deleteStoredUpload(entry.storedName);
    deleteStoredUpload(entry.imageStoredName);

    res.json({ ok: true });
  } finally {
    unlockFileMutation(fileId);
  }
});

app.get("/api/files/:id/image", requireAuthorized, (req, res) => {
  const fileId = String(req.params.id || "").trim().toLowerCase();
  if (!FILE_ID_PATTERN.test(fileId)) {
    res.status(400).json({ error: "Invalid file id" });
    return;
  }

  const entry = readMetadataStore().find((item) => String(item.id || "").toLowerCase() === fileId);
  if (!entry) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  sendStoredFileImage(res, entry);
});

app.get("/api/files/:id/download", requireAuthorized, (req, res) => {
  const fileId = String(req.params.id || "").trim().toLowerCase();
  if (!FILE_ID_PATTERN.test(fileId)) {
    res.status(400).json({ error: "Invalid file id" });
    return;
  }

  const entries = readMetadataStore();
  const index = entries.findIndex((item) => String(item.id || "").toLowerCase() === fileId);
  if (index < 0) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  const entry = entries[index];
  const normalizedEntryForDownload = normalizeMetadataFileEntry(entry);
  if (normalizedEntryForDownload?.outdated) {
    res.status(410).json({ error: "This file is outdated and downloads are blocked." });
    return;
  }

  const storedPath = resolveUploadStoredPath(entry.storedName);
  if (!storedPath) {
    res.status(400).json({ error: "Invalid storage path" });
    return;
  }

  if (!fs.existsSync(storedPath)) {
    res.status(404).json({ error: "File blob not found" });
    return;
  }

  try {
    const normalizedEntry = normalizeMetadataFileEntry({
      ...entry,
      downloadCount: Math.max(0, Number(entry.downloadCount) || 0) + 1
    });
    if (normalizedEntry) {
      entries[index] = normalizedEntry;
      writeMetadataStore(entries);
    }
  } catch (error) {
    console.error("[files] download count update error:", error);
  }

  res.setHeader("Cache-Control", "no-store");
  res.type(entry.mimeType || "application/octet-stream");
  res.download(storedPath, entry.name);
});

app.get("/api/admin/temp-shares", requireAdmin, (req, res) => {
  const entries = getActiveTempShareEntries()
    .sort((left, right) => String(right.uploadedAt || "").localeCompare(String(left.uploadedAt || "")))
    .map((entry) => {
      const payload = buildTempShareListEntry(entry);
      if (!payload) {
        return null;
      }
      return {
        ...payload,
        shareUrl: buildAbsoluteSiteUrl(req, payload.sharePath)
      };
    })
    .filter(Boolean);

  res.setHeader("Cache-Control", "no-store");
  res.json({
    entries,
    virusTotalConfigured: virusTotalConfigured(),
    uploadLimitBytes: TEMP_SHARE_MAX_FILE_BYTES,
    retentionMaxHours: TEMP_SHARE_RETENTION_MAX_HOURS
  });
  void tickTempShareVirusScans();
});

app.post("/api/admin/temp-shares", requireAdmin, ensureTempShareUploadSlotAvailable, uploadTempShareFile, async (req, res) => {
  const uploadedFile = req.file || null;
  const cleanupUpload = () => {
    if (uploadedFile?.filename) {
      deleteStoredTempShareUpload(uploadedFile.filename);
    } else if (uploadedFile?.path) {
      fs.unlink(uploadedFile.path, () => {});
    }
  };

  if (!uploadedFile) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const originalName = String(uploadedFile.originalname || "");
  const safeOriginalName = sanitizeDisplayFilename(originalName);
  const displayName = sanitizeFileDisplayName(req.body.displayName);
  const description = sanitizeFileDescription(req.body.description);
  const langRaw = String(req.body.lang || "").trim().toLowerCase();
  const lang = langRaw === "es" ? "es" : "en";
  const maxDownloads = parseOptionalPositiveInteger(req.body.maxDownloads, 0);
  const expiresInHours = parseOptionalPositiveInteger(req.body.expiresInHours, 0);
  const expiresAtRaw = String(req.body.expiresAt || "").trim();
  const expiresAtMs = expiresAtRaw ? Date.parse(expiresAtRaw) : Number.NaN;
  const hasExplicitExpiresAt = Boolean(expiresAtRaw);

  if (!isValidOriginalFilename(originalName) || !safeOriginalName) {
    cleanupUpload();
    res.status(400).json({ error: "Invalid filename" });
    return;
  }
  if (!Number.isFinite(uploadedFile.size) || uploadedFile.size <= 0) {
    cleanupUpload();
    res.status(400).json({ error: "Empty uploads are not allowed" });
    return;
  }
  if (hasExplicitExpiresAt && !Number.isFinite(expiresAtMs)) {
    cleanupUpload();
    res.status(400).json({ error: "Invalid expiration date." });
    return;
  }
  if (hasExplicitExpiresAt && expiresAtMs <= Date.now()) {
    cleanupUpload();
    res.status(400).json({ error: "Expiration must be in the future." });
    return;
  }
  if (maxDownloads <= 0 && expiresInHours <= 0 && !hasExplicitExpiresAt) {
    cleanupUpload();
    res.status(400).json({ error: "Set a download limit or an expiration time." });
    return;
  }
  if (expiresInHours > TEMP_SHARE_RETENTION_MAX_HOURS) {
    cleanupUpload();
    res.status(400).json({ error: `Expiration cannot exceed ${TEMP_SHARE_RETENTION_MAX_HOURS} hours.` });
    return;
  }
  if (hasExplicitExpiresAt && expiresAtMs - Date.now() > TEMP_SHARE_RETENTION_MAX_HOURS * 60 * 60 * 1000) {
    cleanupUpload();
    res.status(400).json({ error: `Expiration cannot exceed ${TEMP_SHARE_RETENTION_MAX_HOURS} hours.` });
    return;
  }
  if (!tryLockTempShareCreate()) {
    cleanupUpload();
    res.status(409).json({ error: "Another temporary share upload is already in progress." });
    return;
  }

  try {
    const entries = getActiveTempShareEntries();
    if (entries.length > 0) {
      cleanupUpload();
      res.status(409).json({ error: "Delete the current temporary share before uploading another file." });
      return;
    }

    const sha256 = await computeFileSha256(uploadedFile.path);
    const now = new Date().toISOString();
    const expiresAt = hasExplicitExpiresAt
      ? new Date(expiresAtMs).toISOString()
      : expiresInHours > 0
        ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
        : "";
    const entry = normalizeTempShareEntry({
      id: crypto.randomUUID(),
      storedName: uploadedFile.filename,
      name: safeOriginalName,
      displayName,
      mimeType: String(uploadedFile.mimetype || "application/octet-stream").trim() || "application/octet-stream",
      size: uploadedFile.size,
      description,
      lang,
      maxDownloads,
      downloadCount: 0,
      uploadedAt: now,
      updatedAt: now,
      expiresAt,
      uploaderDiscordId: req.currentUser.discordId,
      uploader: req.currentUser.username,
      virusTotal: {
        status: virusTotalConfigured() ? TEMP_SHARE_VIRUS_STATUS.QUEUED : TEMP_SHARE_VIRUS_STATUS.UNAVAILABLE,
        sha256,
        permalink: buildVirusTotalPermalink(sha256),
        stats: {},
        lastCheckedAt: "",
        completedAt: "",
        lastError: virusTotalConfigured() ? "" : "VirusTotal is not configured."
      }
    });

    if (!entry) {
      cleanupUpload();
      res.status(400).json({ error: "Invalid temporary share metadata" });
      return;
    }

    entries.push(entry);
    writeTempShareStore(entries);

    const payload = buildTempShareListEntry(entry);
    res.status(201).json({
      ok: true,
      entry: payload
        ? {
            ...payload,
            shareUrl: buildAbsoluteSiteUrl(req, payload.sharePath)
          }
        : null
    });

    if (virusTotalConfigured()) {
      void tickTempShareVirusScans();
    }
  } catch (error) {
    cleanupUpload();
    console.error("[temp-shares] create error:", error);
    res.status(500).json({ error: "Unable to create temporary share" });
  } finally {
    unlockTempShareCreate();
  }
});

app.delete("/api/admin/temp-shares/:id", requireAdmin, (req, res) => {
  const shareId = String(req.params.id || "").trim().toLowerCase();
  const result = deleteTempShareById(shareId);
  if (!result.ok && result.reason === "invalid_id") {
    res.status(400).json({ error: "Invalid share id" });
    return;
  }
  if (!result.ok && result.reason === "busy") {
    res.status(409).json({ error: "Share update already in progress" });
    return;
  }
  if (!result.ok) {
    res.status(404).json({ error: "Share not found" });
    return;
  }
  res.json({ ok: true });
});

app.get("/api/intel/silo", async (_req, res) => {
  try {
    const silo = await fetchSiloIntel();
    res.setHeader("Cache-Control", "no-store");
    res.json({
      codes: silo.codes || {},
      isExpired: Boolean(silo.isExpired),
      resetTargetUtc: silo.resetTargetUtc instanceof Date ? silo.resetTargetUtc.toISOString() : null,
      source: String(silo.source || "").trim() || "https://nukacrypt.com/"
    });
  } catch (error) {
    console.error("[intel] Failed to fetch silo data for web client.");
    console.error(error);
    res.status(502).json({
      error: "Unable to fetch silo intel"
    });
  }
});

app.get("/api/intel/minerva", async (_req, res) => {
  try {
    const minerva = await fetchMinervaIntel(SITE_ROOT);
    res.setHeader("Cache-Control", "no-store");
    res.json({
      location: String(minerva?.location || "").trim() || "--",
      listNumber: Number.isFinite(Number(minerva?.listNumber)) ? Number(minerva.listNumber) : null,
      active: Boolean(minerva?.active),
      nextChange: String(minerva?.nextChange || "").trim() || null,
      eventStart: minerva?.eventStart instanceof Date ? minerva.eventStart.toISOString() : null,
      eventEnd: minerva?.eventEnd instanceof Date ? minerva.eventEnd.toISOString() : null,
      items: Array.isArray(minerva?.items)
        ? minerva.items.map((item) => ({
          name: String(item?.name || "").trim() || "--",
          price: item?.price == null || (typeof item?.price === "string" && !item.price.trim())
            ? null
            : (Number.isFinite(Number(item.price)) ? Number(item.price) : null),
          url: String(item?.url || "").trim()
        }))
        : [],
      source: String(minerva?.source || "").trim() || "fallback",
      locationMapImage: String(minerva?.locationMapImage || "").trim()
    });
  } catch (error) {
    console.error("[intel] Failed to fetch Minerva data for web client.");
    console.error(error);
    res.status(502).json({
      error: "Unable to fetch Minerva intel"
    });
  }
});

app.get("/api/public-config", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({
    botInviteLink: BOT_INVITE_LINK || ""
  });
});

app.post("/api/visits", (req, res) => {
  const visitCounter = registerSiteVisit(req);
  res.setHeader("Cache-Control", "no-store");
  res.json(visitCounter);
});

app.use(express.static(SITE_ROOT));

app.get("/", (_req, res) => {
  res.sendFile(INDEX_PAGE);
});

app.get("/drops/:shareSlug/status", (req, res) => {
  const entry = resolveTempShareBySlug(req.params.shareSlug);
  if (!entry) {
    const slug = normalizeTempShareSlugValue(req.params.shareSlug);
    res.setHeader("Cache-Control", "no-store");
    res.status(isExhaustedTempShareSlug(slug) ? 410 : 404).json({ error: "Share not found" });
    return;
  }
  const normalized = normalizeTempShareEntry(entry);
  const badge = buildTempShareVirusBadge(normalized);
  const permalink = String(normalized.virusTotal?.permalink || "").trim();
  res.setHeader("Cache-Control", "no-store");
  res.json({
    status: normalized.virusTotal?.status || "unavailable",
    badge: { ...badge, permalink },
    downloadCount: normalized.downloadCount,
    maxDownloads: normalized.maxDownloads,
    expiresAt: normalized.expiresAt || null
  });
});

app.get("/drops/:shareSlug/content", (req, res) => {
  const entry = resolveTempShareBySlug(req.params.shareSlug);
  if (!entry) {
    res.status(404).json({ error: "Share not found" });
    return;
  }
  sendTempSharePreviewContent(res, entry);
});

app.get("/drops/:shareSlug/download", (req, res) => {
  const entry = resolveTempShareBySlug(req.params.shareSlug);
  if (!entry) {
    const slug = normalizeTempShareSlugValue(req.params.shareSlug);
    if (isExhaustedTempShareSlug(slug)) {
      res.status(410).type("html").send(renderTempShareLimitReachedPage(getExhaustedSlugLang(slug)));
      return;
    }
    const tu = getDropI18n("en");
    res
      .status(404)
      .type("html")
      .send(
        renderTempShareUnavailablePage({
          title: tu.unavailTitle,
          statusLabel: tu.unavailStatusLabel,
          message: tu.unavailMessage,
          lang: "en"
        })
      );
    return;
  }

  const shareId = entry.id;
  if (!tryLockTempShareMutation(shareId)) {
    res.status(409).json({ error: "Share is busy. Try again in a moment." });
    return;
  }

  let storedPath = "";
  let responseName = entry.name;
  let responseType = entry.mimeType || "application/octet-stream";
  let deleteAfterSend = false;
  let storedNameToDelete = "";

  try {
    const entries = getActiveTempShareEntries();
    const index = entries.findIndex((candidate) => candidate.id === shareId);
    if (index < 0) {
      unlockTempShareMutation(shareId);
      const te = getDropI18n(entry.lang);
      res
        .status(404)
        .type("html")
        .send(
          renderTempShareUnavailablePage({
            title: te.unavailTitle,
            statusLabel: te.unavailStatusLabel,
            message: te.unavailBusyMessage,
            lang: entry.lang
          })
        );
      return;
    }

    const currentEntry = entries[index];
    storedPath = resolveTempShareStoredPath(currentEntry.storedName);
    if (!storedPath || !fs.existsSync(storedPath)) {
      entries.splice(index, 1);
      writeTempShareStore(entries);
      deleteStoredTempShareUpload(currentEntry.storedName);
      unlockTempShareMutation(shareId);
      const tf = getDropI18n(currentEntry.lang);
      res
        .status(404)
        .type("html")
        .send(
          renderTempShareUnavailablePage({
            title: tf.unavailFileMissingTitle,
            statusLabel: tf.unavailFileMissingStatus,
            message: tf.unavailFileMissingMessage,
            lang: currentEntry.lang
          })
        );
      return;
    }

    responseName = currentEntry.name;
    responseType = currentEntry.mimeType || "application/octet-stream";
    storedNameToDelete = currentEntry.storedName;

    const nextDownloadCount = Math.max(0, Number(currentEntry.downloadCount) || 0) + 1;
    const now = new Date().toISOString();
    const shouldRemoveAfterDownload = currentEntry.maxDownloads > 0 && nextDownloadCount >= currentEntry.maxDownloads;
    deleteAfterSend = shouldRemoveAfterDownload;

    if (shouldRemoveAfterDownload) {
      entries.splice(index, 1);
      recordExhaustedTempShareSlug(buildTempShareSlug(currentEntry), currentEntry.lang);
    } else {
      entries[index] = normalizeTempShareEntry({
        ...currentEntry,
        downloadCount: nextDownloadCount,
        updatedAt: now
      });
    }
    writeTempShareStore(entries);
  } catch (error) {
    unlockTempShareMutation(shareId);
    console.error("[temp-shares] download error:", error);
    res.status(500).json({ error: "Unable to prepare temporary share download" });
    return;
  }

  unlockTempShareMutation(shareId);

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.type(responseType);
  res.download(storedPath, responseName, (error) => {
    if (deleteAfterSend && storedNameToDelete) {
      deleteStoredTempShareUpload(storedNameToDelete);
    }
    if (error && !res.headersSent) {
      res.status(500).json({ error: "Unable to stream temporary share download" });
    }
  });
});

app.get("/drops/:shareSlug", async (req, res) => {
  const entry = resolveTempShareBySlug(req.params.shareSlug);
  if (!entry) {
    const slug = normalizeTempShareSlugValue(req.params.shareSlug);
    if (isExhaustedTempShareSlug(slug)) {
      res.status(410).type("html").send(renderTempShareLimitReachedPage(getExhaustedSlugLang(slug)));
      return;
    }
    const tu = getDropI18n("en");
    res
      .status(404)
      .type("html")
      .send(
        renderTempShareUnavailablePage({
          title: tu.unavailTitle,
          statusLabel: tu.unavailStatusLabel,
          message: tu.unavailMessage,
          lang: "en"
        })
      );
    return;
  }

  try {
    res.setHeader("Cache-Control", "no-store");
    res.type("html");
    res.send(await renderTempSharePublicPage(entry, req));
  } catch (error) {
    console.error("[temp-shares] render error:", error);
    const te = getDropI18n(entry.lang);
    res
      .status(500)
      .type("html")
      .send(
        renderTempShareUnavailablePage({
          title: te.unavailErrorTitle,
          statusLabel: te.unavailErrorStatus,
          message: te.unavailErrorMessage,
          lang: entry.lang
        })
      );
  }
});

app.get("/share/:shareSlug/image", (req, res) => {
  const entry = resolveSharedFileEntryBySlug(req.params.shareSlug);
  if (!entry) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  sendStoredFileImage(res, entry);
});

app.get("/share/:shareSlug", (req, res) => {
  const entry = resolveSharedFileEntryBySlug(req.params.shareSlug);
  if (!entry) {
    res.sendFile(INDEX_PAGE);
    return;
  }

  res.setHeader("Cache-Control", "no-store");
  res.type("html");
  res.send(renderSharedFilePage(entry, req));
});

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.status(404).sendFile(NOT_FOUND_PAGE);
});

async function startServer() {
  if (redisClient) {
    try {
      await redisClient.connect();
    } catch (error) {
      console.error("[session] Failed to connect to Redis using REDIS_URL. Server startup aborted.");
      console.error(error);
      process.exit(1);
      return;
    }
  }

  const tempShareCleanupTimer = setInterval(() => {
    try {
      getActiveTempShareEntries();
    } catch (error) {
      console.error("[temp-shares] cleanup error:", error);
    }
  }, TEMP_SHARE_CLEANUP_INTERVAL_MS);
  tempShareCleanupTimer.unref?.();

  const tempShareVirusTimer = setInterval(() => {
    void tickTempShareVirusScans();
  }, TEMP_SHARE_VT_TICK_MS);
  tempShareVirusTimer.unref?.();
  void tickTempShareVirusScans();

  const server = app.listen(PORT, () => {
    console.log(`[server] Fallout Codex listening on http://localhost:${PORT}`);
    console.log(`[server] Static root: ${SITE_ROOT}`);
    console.log(`[server] Storage directory: ${STORAGE_DIR}`);
    console.log(`[server] Metadata file: ${METADATA_PATH}`);
    console.log(`[temp-shares] Metadata file: ${TEMP_SHARES_PATH}`);
    console.log(`[session] Store: ${sessionStoreLabel}`);
    if (!REDIS_URL && NODE_ENV === "production") {
      console.warn("[session] REDIS_URL is not set. Production is using MemoryStore (not recommended).");
    }
    if (!oauthConfigured()) {
      console.warn("[server] Discord OAuth env vars missing: DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI");
    }
    if (SESSION_SECRET === "replace-me-in-production") {
      console.warn("[server] SESSION_SECRET is using the default fallback. Set SESSION_SECRET in production.");
    }
    if (!mailConfigured()) {
      console.warn("[mail] Access request email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM.");
    }
    if (!virusTotalConfigured()) {
      console.warn("[temp-shares] VirusTotal is not configured. Set VT_API_KEY to enable safety badges for temporary shares.");
    }
    if (botAdminApiConfigured()) {
      console.log(`[bot-admin] Using external bot admin bridge at ${BOT_ADMIN_API_URL}.`);
    } else {
      console.warn("[bot-admin] Bot control has no bot worker bridge. Set BOT_ADMIN_API_URL and BOT_ADMIN_API_TOKEN.");
    }
  });

  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received, shutting down...`);
    if (redisClient && redisClient.isOpen) {
      try {
        await redisClient.quit();
      } catch (error) {
        console.error("[redis] quit error:", error);
      }
    }
    clearInterval(tempShareCleanupTimer);
    clearInterval(tempShareVirusTimer);
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

module.exports = {
  startServer
};
