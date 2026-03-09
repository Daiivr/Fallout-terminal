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
const NOT_FOUND_PAGE = path.join(SITE_ROOT, "404.html");
const configuredStorageDir = String(process.env.STORAGE_DIR || "").trim();
const STORAGE_DIR = configuredStorageDir
  ? path.resolve(configuredStorageDir)
  : path.resolve(__dirname, "..", "storage");
const UPLOAD_DIR = path.join(STORAGE_DIR, "uploads");
const METADATA_PATH = path.join(STORAGE_DIR, "files-metadata.json");
const ACCESS_REQUESTS_PATH = path.join(STORAGE_DIR, "access-requests.json");
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
const ACCESS_REQUEST_MAX_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
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

const SESSION_TTL_SECONDS = parsePositiveInteger(process.env.SESSION_TTL_SECONDS, DEFAULT_SESSION_TTL_SECONDS);
const SMTP_PORT = parsePositiveInteger(SMTP_PORT_RAW, 587);
const SMTP_SECURE = parseBoolean(SMTP_SECURE_RAW, SMTP_PORT === 465);
const SMTP_TLS_REJECT_UNAUTHORIZED = parseBoolean(SMTP_TLS_REJECT_UNAUTHORIZED_RAW, true);
const ACCESS_REQUEST_COOLDOWN_MS = parsePositiveInteger(ACCESS_REQUEST_COOLDOWN_MS_RAW, 15 * 60 * 1000);
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
const FILE_DESCRIPTION_MAX_CHARS = 500;
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
if (!fs.existsSync(METADATA_PATH)) {
  fs.writeFileSync(METADATA_PATH, "[]\n", "utf8");
}
if (!fs.existsSync(ACCESS_REQUESTS_PATH)) {
  fs.writeFileSync(ACCESS_REQUESTS_PATH, "[]\n", "utf8");
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
  const uploadedAt = String(entry.uploadedAt || "").trim();
  const updatedAt = String(entry.updatedAt || "").trim();
  const imageStoredName = String(entry.imageStoredName || "").trim();
  const imageMimeType = String(entry.imageMimeType || "").trim();
  const hasImage = Boolean(imageStoredName);
  const imageName = hasImage ? (sanitizeDisplayFilename(entry.imageName || "image") || "image") : "";
  const imageSize = hasImage ? Math.max(0, Number(entry.imageSize) || 0) : 0;

  return {
    id: id.toLowerCase(),
    storedName,
    name,
    displayName: sanitizeFileDisplayName(entry.displayName),
    mimeType,
    size: Number.isFinite(size) && size >= 0 ? size : 0,
    description: sanitizeFileDescription(entry.description),
    group: sanitizeFileGroup(entry.group),
    uploadedAt: uploadedAt || new Date(0).toISOString(),
    updatedAt: updatedAt || uploadedAt || "",
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
    uploadedAt: normalized.uploadedAt,
    updatedAt: normalized.updatedAt || normalized.uploadedAt,
    description: normalized.description,
    group: normalized.group,
    uploader: normalized.uploader || normalized.uploaderDiscordId || "",
    imageUrl,
    imageName: normalized.imageName,
    hasImage: Boolean(imageUrl)
  };
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

function buildAccessRequestEmailContent({ user, requestEntry, req }) {
  const identity = resolveAccessRequestIdentity(user, requestEntry);
  const safeNick = escapeHtml(identity.nick);
  const safeUsername = escapeHtml(identity.username);
  const safeEmail = escapeHtml(identity.email);
  const safeReason = escapeHtml(identity.reason);
  const safeReasonHtml = safeReason ? safeReason.replace(/\n/g, "<br />") : "";
  const safeDiscordId = escapeHtml(identity.discordId);
  const safeAccountAge = escapeHtml(identity.accountAge);
  const safeRequestTime = escapeHtml(identity.requestTime);
  const baseUrl = getRequestBaseUrl(req);
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
  const approveButtonStyle = approveLink
    ? "display:inline-block;padding:9px 14px;border:1px solid rgba(139,255,139,0.5);border-radius:9px;background:rgba(0,0,0,0.34);color:#d8ffd8;text-decoration:none;letter-spacing:.05em;text-transform:uppercase;"
    : "display:inline-block;padding:9px 14px;border:1px solid rgba(139,255,139,0.22);border-radius:9px;background:rgba(0,0,0,0.24);color:#7fb07f;text-decoration:none;letter-spacing:.05em;text-transform:uppercase;pointer-events:none;";
  const declineButtonStyle = declineLink
    ? "display:inline-block;padding:9px 14px;border:1px solid rgba(255,120,120,0.54);border-radius:9px;background:rgba(0,0,0,0.34);color:#ffc2c2;text-decoration:none;letter-spacing:.05em;text-transform:uppercase;"
    : "display:inline-block;padding:9px 14px;border:1px solid rgba(255,120,120,0.24);border-radius:9px;background:rgba(0,0,0,0.24);color:#c08a8a;text-decoration:none;letter-spacing:.05em;text-transform:uppercase;pointer-events:none;";

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

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#060a06;color:#c7f7c7;font-family:Consolas,'Courier New',monospace;">
    <div style="max-width:620px;margin:0 auto;border:1px solid rgba(139,255,139,0.34);border-radius:14px;overflow:hidden;background:linear-gradient(to bottom,rgba(139,255,139,0.08),rgba(0,0,0,0.42)),rgba(0,0,0,0.44);box-shadow:0 0 0 1px rgba(0,0,0,.48) inset,0 18px 60px rgba(0,0,0,.58);">
      <div style="padding:12px 16px;background:linear-gradient(to right,rgba(139,255,139,0.22),rgba(0,0,0,0));border-bottom:1px solid rgba(139,255,139,0.28);">
        <span style="display:inline-block;padding:3px 8px;border:1px solid rgba(255,225,122,0.48);border-radius:999px;font-size:11px;letter-spacing:.08em;color:#ffefaf;text-transform:uppercase;">Access Review Required</span>
        <p style="margin:10px 0 0;font-size:16px;letter-spacing:.06em;color:#fff4cb;text-transform:uppercase;">Fallout Codex - New Access Request</p>
      </div>
      <div style="padding:16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);color:#97cf97;font-size:12px;text-transform:uppercase;letter-spacing:.06em;">Nick</td><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);text-align:right;font-size:15px;color:#d8ffd8;">${safeNick}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);color:#97cf97;font-size:12px;text-transform:uppercase;letter-spacing:.06em;">Username</td><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);text-align:right;font-size:15px;color:#d8ffd8;">${safeUsername}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);color:#97cf97;font-size:12px;text-transform:uppercase;letter-spacing:.06em;">Email</td><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);text-align:right;font-size:15px;color:#d8ffd8;">${safeEmail}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);color:#97cf97;font-size:12px;text-transform:uppercase;letter-spacing:.06em;">Discord ID</td><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);text-align:right;font-family:Consolas,Menlo,monospace;font-size:14px;color:#d8ffd8;">${safeDiscordId}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);color:#97cf97;font-size:12px;text-transform:uppercase;letter-spacing:.06em;">Account Age</td><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);text-align:right;font-size:15px;color:#d8ffd8;">${safeAccountAge}</td></tr>
          <tr><td style="padding:10px 0;color:#97cf97;font-size:12px;text-transform:uppercase;letter-spacing:.06em;">Request Time (UTC)</td><td style="padding:10px 0;text-align:right;font-family:Consolas,Menlo,monospace;font-size:14px;color:#d8ffd8;">${safeRequestTime}</td></tr>
        </table>
        <div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,225,122,0.24);">
          <p style="margin:0 0 10px;color:#ffefaf;font-size:12px;letter-spacing:.06em;text-transform:uppercase;">Admin Decision Actions</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <a href="${safeApproveHref}" style="${approveButtonStyle}">Approve</a>
            <a href="${safeDeclineHref}" style="${declineButtonStyle}">Decline</a>
          </div>
          <p style="margin:10px 0 0;font-size:12px;color:#9ccf9c;">Decision link expires: ${escapeHtml(decisionExpiresAtLabel)}</p>
          <p style="margin:6px 0 0;font-size:12px;color:#9ccf9c;">If no action is taken before expiration, this request is auto-declined.</p>
          <div style="margin-top:12px;padding:10px;border:1px solid rgba(255,225,122,0.24);border-radius:10px;background:rgba(0,0,0,0.28);">
            <p style="margin:0;color:#ffefaf;font-size:11px;letter-spacing:.06em;text-transform:uppercase;">Access Reason</p>
            <p style="margin:7px 0 0;color:#d8ffd8;font-size:13px;line-height:1.4;white-space:pre-wrap;word-break:break-word;">${safeReasonHtml || "Not provided"}</p>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;

  return {
    subject,
    text,
    html
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

  const safeNick = escapeHtml(identity.nick);
  const safeUsername = escapeHtml(identity.username);
  const safeEmail = escapeHtml(identity.email);
  const safeDiscordId = escapeHtml(identity.discordId);
  const safeRequestId = escapeHtml(String(accessRequestState?.requestId || "Unknown"));
  const safeAccountAge = escapeHtml(identity.accountAge);
  const safeRequestTime = escapeHtml(formatUtcTimestamp(accessRequestState?.requestedAt || ""));
  const safeDecisionTime = escapeHtml(formatUtcTimestamp(accessRequestState?.decidedAt || ""));
  const safeDisclaimerDecisionTime = escapeHtml(formatUtcTimestamp(accessRequestState?.disclaimerDecidedAt || ""));
  const safeOriginalReason = escapeHtml(sanitizeAccessRequestReason(accessRequestState?.reason || ""));
  const safeOriginalReasonHtml = safeOriginalReason ? safeOriginalReason.replace(/\n/g, "<br />") : "";
  const safeExplanation = escapeHtml(sanitizedExplanation);
  const safeExplanationHtml = safeExplanation ? safeExplanation.replace(/\n/g, "<br />") : "";
  const baseUrl = getRequestBaseUrl(req);
  const returnUrl = baseUrl ? `${baseUrl}/#files` : "/#files";
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
  const reapproveButtonStyle = reapproveLink
    ? "display:inline-block;padding:9px 14px;border:1px solid rgba(139,255,139,0.5);border-radius:9px;background:rgba(0,0,0,0.34);color:#d8ffd8;text-decoration:none;letter-spacing:.05em;text-transform:uppercase;"
    : "display:inline-block;padding:9px 14px;border:1px solid rgba(139,255,139,0.22);border-radius:9px;background:rgba(0,0,0,0.24);color:#7fb07f;text-decoration:none;letter-spacing:.05em;text-transform:uppercase;pointer-events:none;";
  const declineButtonStyle = declineLink
    ? "display:inline-block;padding:9px 14px;border:1px solid rgba(255,120,120,0.54);border-radius:9px;background:rgba(0,0,0,0.34);color:#ffc2c2;text-decoration:none;letter-spacing:.05em;text-transform:uppercase;"
    : "display:inline-block;padding:9px 14px;border:1px solid rgba(255,120,120,0.24);border-radius:9px;background:rgba(0,0,0,0.24);color:#c08a8a;text-decoration:none;letter-spacing:.05em;text-transform:uppercase;pointer-events:none;";

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

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#060a06;color:#c7f7c7;font-family:Consolas,'Courier New',monospace;">
    <div style="max-width:620px;margin:0 auto;border:1px solid rgba(139,255,139,0.34);border-radius:14px;overflow:hidden;background:linear-gradient(to bottom,rgba(139,255,139,0.08),rgba(0,0,0,0.42)),rgba(0,0,0,0.44);box-shadow:0 0 0 1px rgba(0,0,0,.48) inset,0 18px 60px rgba(0,0,0,.58);">
      <div style="padding:12px 16px;background:linear-gradient(to right,rgba(255,225,122,0.22),rgba(0,0,0,0));border-bottom:1px solid rgba(255,225,122,0.28);">
        <span style="display:inline-block;padding:3px 8px;border:1px solid rgba(255,225,122,0.48);border-radius:999px;font-size:11px;letter-spacing:.08em;color:#ffefaf;text-transform:uppercase;">Reevaluation Request</span>
        <p style="margin:10px 0 0;font-size:16px;letter-spacing:.06em;color:#fff4cb;text-transform:uppercase;">Disclaimer Reevaluation Submission</p>
      </div>
      <div style="padding:16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);color:#97cf97;font-size:12px;text-transform:uppercase;letter-spacing:.06em;">Nick</td><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);text-align:right;font-size:15px;color:#d8ffd8;">${safeNick}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);color:#97cf97;font-size:12px;text-transform:uppercase;letter-spacing:.06em;">Username</td><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);text-align:right;font-size:15px;color:#d8ffd8;">${safeUsername}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);color:#97cf97;font-size:12px;text-transform:uppercase;letter-spacing:.06em;">Email</td><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);text-align:right;font-size:15px;color:#d8ffd8;">${safeEmail}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);color:#97cf97;font-size:12px;text-transform:uppercase;letter-spacing:.06em;">Discord ID</td><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);text-align:right;font-family:Consolas,Menlo,monospace;font-size:14px;color:#d8ffd8;">${safeDiscordId}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);color:#97cf97;font-size:12px;text-transform:uppercase;letter-spacing:.06em;">Account Age</td><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);text-align:right;font-size:15px;color:#d8ffd8;">${safeAccountAge}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);color:#97cf97;font-size:12px;text-transform:uppercase;letter-spacing:.06em;">Request ID</td><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);text-align:right;font-family:Consolas,Menlo,monospace;font-size:14px;color:#d8ffd8;">${safeRequestId}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);color:#97cf97;font-size:12px;text-transform:uppercase;letter-spacing:.06em;">Request Submitted (UTC)</td><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);text-align:right;font-family:Consolas,Menlo,monospace;font-size:14px;color:#d8ffd8;">${safeRequestTime}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);color:#97cf97;font-size:12px;text-transform:uppercase;letter-spacing:.06em;">Approved (UTC)</td><td style="padding:10px 0;border-bottom:1px solid rgba(139,255,139,0.2);text-align:right;font-family:Consolas,Menlo,monospace;font-size:14px;color:#d8ffd8;">${safeDecisionTime}</td></tr>
          <tr><td style="padding:10px 0;color:#97cf97;font-size:12px;text-transform:uppercase;letter-spacing:.06em;">Disclaimer Declined (UTC)</td><td style="padding:10px 0;text-align:right;font-family:Consolas,Menlo,monospace;font-size:14px;color:#d8ffd8;">${safeDisclaimerDecisionTime}</td></tr>
        </table>
        <div style="margin-top:12px;padding:10px;border:1px solid rgba(255,225,122,0.24);border-radius:10px;background:rgba(0,0,0,0.28);">
          <p style="margin:0;color:#ffefaf;font-size:11px;letter-spacing:.06em;text-transform:uppercase;">Original Access Reason</p>
          <p style="margin:7px 0 0;color:#d8ffd8;font-size:13px;line-height:1.4;white-space:pre-wrap;word-break:break-word;">${safeOriginalReasonHtml || "Not provided"}</p>
        </div>
        <div style="margin-top:12px;padding:10px;border:1px solid rgba(255,225,122,0.32);border-radius:10px;background:rgba(0,0,0,0.28);">
          <p style="margin:0;color:#ffefaf;font-size:11px;letter-spacing:.06em;text-transform:uppercase;">User Reevaluation Explanation</p>
          <p style="margin:7px 0 0;color:#d8ffd8;font-size:13px;line-height:1.4;white-space:pre-wrap;word-break:break-word;">${safeExplanationHtml || "Not provided"}</p>
        </div>
        <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,225,122,0.24);">
          <p style="margin:0 0 10px;color:#ffefaf;font-size:12px;letter-spacing:.06em;text-transform:uppercase;">Admin Reevaluation Actions</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <a href="${safeReapproveHref}" style="${reapproveButtonStyle}">Re-approve</a>
            <a href="${safeDeclineHref}" style="${declineButtonStyle}">Decline</a>
          </div>
          <p style="margin:10px 0 0;font-size:12px;color:#9ccf9c;">Decision link expires: ${escapeHtml(decisionExpiresAtLabel)}</p>
        </div>
        <div style="margin-top:14px;text-align:right;">
          <a href="${escapeHtml(returnUrl)}" style="display:inline-block;padding:9px 14px;border:1px solid rgba(139,255,139,0.5);border-radius:9px;background:rgba(0,0,0,0.34);color:#d8ffd8;text-decoration:none;letter-spacing:.05em;text-transform:uppercase;">Open Fallout Codex</a>
        </div>
      </div>
    </div>
  </body>
</html>`;

  return {
    subject,
    text,
    html
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

const upload = multer({
  storage: uploadStorage,
  limits: {
    files: 2
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

app.post("/auth/discord", (req, res) => {
  if (!oauthConfigured()) {
    res.status(500).json({ error: "Discord OAuth is not configured on the server." });
    return;
  }

  const oauthState = crypto.randomBytes(24).toString("hex");
  const popupMode = parseBooleanQueryFlag(req.query?.popup) || parseBooleanQueryFlag(req.body?.popup);
  req.session.oauthState = oauthState;
  req.session.oauthPopupMode = popupMode ? "1" : "";
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
    res.redirect("/#files");
    return;
  }

  const code = String(req.query.code || "").trim();
  const returnedState = String(req.query.state || "").trim();
  const expectedState = String(req.session.oauthState || "").trim();
  const popupMode = String(req.session.oauthPopupMode || "").trim() === "1";
  delete req.session.oauthState;
  delete req.session.oauthPopupMode;

  if (!code || !returnedState || returnedState !== expectedState) {
    if (popupMode) {
      sendDiscordPopupCallbackResponse(res, false);
      return;
    }
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
      username: formatDiscordUsername(userPayload),
      discordProfile: buildDiscordProfileForSession(userPayload)
    };

    req.session.save((error) => {
      if (error) {
        if (popupMode) {
          sendDiscordPopupCallbackResponse(res, false);
          return;
        }
        res.redirect("/#files");
        return;
      }
      if (popupMode) {
        sendDiscordPopupCallbackResponse(res, true);
        return;
      }
      res.redirect("/#files");
    });
  } catch (error) {
    console.error("[oauth] callback error:", error);
    if (popupMode) {
      sendDiscordPopupCallbackResponse(res, false);
      return;
    }
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
    description,
    group,
    uploadedAt: now,
    updatedAt: now,
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
  const removeImage = parseBoolean(req.body?.removeImage, false);
  const imageMimeType = uploadedImage
    ? String(uploadedImage.mimetype || "application/octet-stream").trim()
    : "";

  if (uploadedImage && !/^image\//i.test(imageMimeType)) {
    cleanupUploadedImage();
    res.status(400).json({ error: "Image upload must be a valid image file" });
    return;
  }

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
});

app.delete("/api/files/:id", requireAdmin, (req, res) => {
  const fileId = String(req.params.id || "").trim().toLowerCase();
  if (!FILE_ID_PATTERN.test(fileId)) {
    res.status(400).json({ error: "Invalid file id" });
    return;
  }

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

  const imageStoredName = String(entry.imageStoredName || "").trim();
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

  const safeImageName = sanitizeDisplayFilename(entry.imageName || `${entry.name || "image"}.png`) || "image.png";
  const quotedImageName = safeImageName.replace(/"/g, "");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Disposition", `inline; filename="${quotedImageName}"`);
  res.type(entry.imageMimeType || "application/octet-stream");
  res.sendFile(storedPath);
});

app.get("/api/files/:id/download", requireAuthorized, (req, res) => {
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

  const storedPath = resolveUploadStoredPath(entry.storedName);
  if (!storedPath) {
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
          price: Number.isFinite(Number(item?.price)) ? Number(item.price) : null,
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

app.use(express.static(SITE_ROOT));

app.get("/", (_req, res) => {
  res.sendFile(path.join(SITE_ROOT, "index.html"));
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

  const server = app.listen(PORT, () => {
    console.log(`[server] Fallout Codex listening on http://localhost:${PORT}`);
    console.log(`[server] Static root: ${SITE_ROOT}`);
    console.log(`[server] Storage directory: ${STORAGE_DIR}`);
    console.log(`[server] Metadata file: ${METADATA_PATH}`);
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
