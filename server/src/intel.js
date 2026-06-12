"use strict";

const fs = require("fs");
const path = require("path");

const PROXY_BASE = "https://api.codetabs.com/v1/proxy/?quest=";
const SOURCE_URLS = {
  silo: [
    "https://r.jina.ai/http://nukacrypt.com/",
    "https://r.jina.ai/http://www.nukacrypt.com/",
    "https://nukacrypt.com/"
  ],
  minerva: [
    "https://r.jina.ai/http://www.whereisminerva.com/",
    "https://r.jina.ai/http://whereisminerva.com/"
  ],
  minervaInfoApi: [
    "https://whereisminerva.info/controller/controller.php"
  ]
};
const NUKACRYPT_GRAPHQL_URL = "https://api.nukacrypt.com/graphql";
const STEAM_APP_ID = 1151340;
const STEAM_CURRENT_PLAYERS_URL = `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${STEAM_APP_ID}`;
const STEAMCHARTS_APP_URL = `https://steamcharts.com/app/${STEAM_APP_ID}`;
const STEAMCHARTS_HISTORY_URL = `${STEAMCHARTS_APP_URL}/chart-data.json`;
const NUKAKNIGHTS_HOME_URL = "https://nukaknights.com/en/";
const NUKAKNIGHTS_AJAX_HOME_URL = "https://nukaknights.com/ajax/home.html";
const NUKAKNIGHTS_CACHE_PATH = process.env.NUKAKNIGHTS_CACHE_PATH
  ? path.resolve(String(process.env.NUKAKNIGHTS_CACHE_PATH))
  : path.resolve(__dirname, "..", "storage", "nukaknights-intel-cache.json");
const NUKAKNIGHTS_READABLE_URLS = [
  "https://r.jina.ai/https://nukaknights.com/ajax/home.html",
  "https://r.jina.ai/https://nukaknights.com/en/"
];
const PLAYER_COUNTS_CACHE_TTL_MS = 60 * 1000;
const NUKAKNIGHTS_CACHE_TTL_MS = 5 * 60 * 1000;
const NUKAKNIGHTS_FAILURE_COOLDOWN_MS = 60 * 1000;
const NUKAKNIGHTS_STALE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const NUKAKNIGHTS_REFRESH_WAIT_BUDGET_MS = 1400;
const NUKAKNIGHTS_SOURCE_TIMEOUT_MS = 4500;
// Readable mirrors render the page remotely and routinely take ~20s to respond.
const NUKAKNIGHTS_MIRROR_TIMEOUT_MS = 25000;
const SILO_RESET_DAY_UTC = 4;
const SILO_FINGERPRINT_VERSION = 3;

const FALLBACK_MINERVA_ANCHOR_DATE_UTC = Date.UTC(2026, 1, 16);
const MS_DAY = 24 * 60 * 60 * 1000;
const MS_WEEK = 7 * MS_DAY;
const CYCLE_WEEKS = 24;
const MINERVA_FALLBACK_EVENT_START_GAP_DAYS = [7, 7, 10, 11];
const MINERVA_FALLBACK_EVENT_ACTIVE_DAYS = [2, 2, 2, 4];
const MINERVA_FALLBACK_EVENT_SEARCH_LIMIT = CYCLE_WEEKS * 32;
const WIKI_BASE = "https://fallout.fandom.com";
const MINERVA_INFO_REMOTE_IMAGE_BASE = "https://whereisminerva.info/assets/images";
const MINERVA_LOCATION_MAP_BY_LOCATION = {
  Foundation: `${MINERVA_INFO_REMOTE_IMAGE_BASE}/minerva_foundation.png`,
  Crater: `${MINERVA_INFO_REMOTE_IMAGE_BASE}/minerva_crater.png`,
  "Fort Atlas": `${MINERVA_INFO_REMOTE_IMAGE_BASE}/minerva_atlas.png`,
  "The Whitespring": `${MINERVA_INFO_REMOTE_IMAGE_BASE}/minerva_whitespring.jpg`
};
const CYCLE_LOCATIONS = ["Foundation", "Crater", "Fort Atlas", "The Whitespring"];

let cachedMinervaLists = null;
let cachedPlayerCounts = {
  value: null,
  fetchedAt: 0,
  promise: null
};
let cachedNukaKnightsIntel = {
  value: null,
  fetchedAt: 0,
  promise: null,
  lastFailureAt: 0
};

function proxied(url) {
  return `${PROXY_BASE}${encodeURIComponent(url)}`;
}

function normalizeWikiUrl(url) {
  const value = String(url || "").trim();
  if (!value) {
    return "";
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${WIKI_BASE}${value}`;
  }

  return `${WIKI_BASE}/${value.replace(/^\/+/, "")}`;
}

function normalizePlanName(name) {
  return String(name || "")
    .replace(/^Plan:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeLocation(value) {
  const normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return "--";
  }
  if (normalized === "foundation") {
    return "Foundation";
  }
  if (normalized === "crater") {
    return "Crater";
  }
  if (normalized === "fort atlas" || normalized === "atlas") {
    return "Fort Atlas";
  }
  if (normalized === "the whitespring" || normalized === "whitespring") {
    return "The Whitespring";
  }
  return String(value || "").trim() || "--";
}

function parseOptionalPrice(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === "string" && !value.trim()) {
    return null;
  }

  const price = Number(value);
  return Number.isFinite(price) ? price : null;
}

function parseIntegerText(value) {
  const digits = String(value ?? "")
    .replace(/,/g, "")
    .replace(/[^\d-]/g, "")
    .trim();

  if (!digits) {
    return null;
  }

  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_match, code) => {
      const parsed = Number(code);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => {
      const parsed = Number.parseInt(code, 16);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : "";
    })
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function htmlToReadableLines(html) {
  const text = String(html || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "\n")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|section|article|header|footer|h[1-6]|li|ul|ol|tr|td|th)>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n* ")
    .replace(/<[^>]+>/g, " ");

  return decodeHtmlEntities(text)
    .replace(/\u00A0/g, " ")
    .split(/\r?\n/)
    .map((line) => line
      .replace(/\*\*/g, "")
      .replace(/^#{1,6}\s+/, "")
      .replace(/\s+/g, " ")
      .trim())
    .filter(Boolean);
}

function cleanNukaChallengeName(value) {
  return String(value || "")
    .replace(/1ˢᵗ/g, "1st")
    .replace(/\s+Tips\b.*$/i, "")
    .replace(/\s+#{1,6}\s+.*$/i, "")
    .replace(/\s+\(\s*/g, " (")
    .replace(/\s*\)\s*/g, ")")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNukaChallengeItems(sectionLines = []) {
  const items = [];
  const scorePattern = /^(?:100|250|300|500|1000|1500|2000)$/;

  for (let index = 0; index < sectionLines.length; index += 1) {
    const line = String(sectionLines[index] || "").trim();
    const isStandaloneBullet = line === "*";
    const isInlineBullet = /^\*\s+/.test(line);
    if (!isStandaloneBullet && !isInlineBullet) {
      continue;
    }

    const nameLine = isStandaloneBullet
      ? String(sectionLines[index + 1] || "").trim()
      : line.replace(/^\*\s+/, "").trim();
    if (!nameLine || nameLine === "*" || /^Tips$/i.test(nameLine)) {
      continue;
    }

    const segment = [];
    const nextStartIndex = isStandaloneBullet ? index + 2 : index + 1;
    for (let nextIndex = nextStartIndex; nextIndex < sectionLines.length; nextIndex += 1) {
      const nextLine = String(sectionLines[nextIndex] || "").trim();
      if (nextLine === "*" || /^\*\s+/.test(nextLine)) {
        break;
      }
      segment.push(nextLine);
    }

    const scoreCandidates = [nameLine, ...segment]
      .map((candidate) => candidate.replace(/,/g, "").trim())
      .flatMap((candidate) => candidate.match(/\b(?:100|250|300|500|1000|1500|2000)\b/g) || [])
      .filter((candidate) => scorePattern.test(candidate));
    const score = scoreCandidates.length
      ? Number(scoreCandidates[scoreCandidates.length - 1])
      : null;

    items.push({
      name: cleanNukaChallengeName(nameLine.replace(/\s+\b(?:100|250|300|500|1000|1500|2000)\b\s*$/i, "")),
      score,
      hasTips: /\bTips\b/i.test(nameLine) || segment.some((candidate) => /^Tips$/i.test(candidate))
    });
  }

  return items.filter((item) => item.name);
}

function parseNukaChallengeSection(lines, startIndex, endIndex) {
  if (startIndex < 0 || endIndex <= startIndex) {
    return {
      endsIn: "",
      provider: "",
      items: []
    };
  }

  const sectionLines = lines.slice(startIndex + 1, endIndex);
  const navIndex = sectionLines.findIndex((line) => /\b(Zurück|Weiter)\b|\[(Back|Next)\]/i.test(line));
  const usefulLines = navIndex >= 0 ? sectionLines.slice(0, navIndex) : sectionLines;
  const endsIn = usefulLines.find((line) => /^Ends in\b/i.test(line)) || "";
  const providerLine = usefulLines.find((line) => /^Provided by\b/i.test(line)) || "";

  return {
    endsIn,
    provider: providerLine.replace(/^Provided by\s*/i, "").trim(),
    items: parseNukaChallengeItems(usefulLines)
  };
}

function parseNukaDailyOps(lines, startIndex, endIndex) {
  if (startIndex < 0 || endIndex <= startIndex) {
    return {
      since: "",
      timezone: "",
      mode: "",
      mutation: "",
      groupMutation: "",
      location: "",
      enemy: "",
      rewardsUrl: "https://nukaknights.com/articles/all-about-the-daily-ops.html"
    };
  }

  const sectionLines = lines.slice(startIndex + 1, endIndex);
  const sinceLine = sectionLines.find((line) => /^since\b/i.test(line)) || "";
  const timezoneLine = sectionLines.find((line) => /America\/New_York/i.test(line)) || "";
  const details = sectionLines.filter((line) => (
    line
    && !/^Daily Ops$/i.test(line)
    && !/^since\b/i.test(line)
    && !/America\/New_York/i.test(line)
    && !/Daily Ops:\s*All Rewards/i.test(line)
    && !/^\[?Daily Ops:\s*All Rewards/i.test(line)
    && !/current daily ops details will be available here soon/i.test(line)
  ));
  const hasSecondaryMutation = /^\+\s*/.test(details[3] || "");
  const groupMutation = hasSecondaryMutation
    ? `${details[2] || ""} ${details[3] || ""}`.trim()
    : details[2] || "";
  const locationIndex = hasSecondaryMutation ? 4 : 3;

  return {
    since: sinceLine.replace(/\s*America\/New_York\s*$/i, "").trim(),
    timezone: timezoneLine.match(/America\/New_York/i)?.[0] || sinceLine.match(/America\/New_York/i)?.[0] || "",
    mode: details[0] || "",
    mutation: details[1] || "",
    groupMutation,
    location: details[locationIndex] || "",
    enemy: details[locationIndex + 1] || "",
    rewardsUrl: "https://nukaknights.com/articles/all-about-the-daily-ops.html"
  };
}

function hasNukaDailyOpsDetails(dailyOps = {}) {
  return Boolean(
    String(dailyOps.mode || "").trim()
    || String(dailyOps.mutation || "").trim()
    || String(dailyOps.groupMutation || "").trim()
    || String(dailyOps.location || "").trim()
    || String(dailyOps.enemy || "").trim()
  );
}

function countNukaChallengeItems(section = {}) {
  return Array.isArray(section.items) ? section.items.length : 0;
}

function scoreNukaKnightsIntelPayload(payload = {}) {
  const dailyCount = countNukaChallengeItems(payload.dailyChallenges);
  const weeklyCount = countNukaChallengeItems(payload.weeklyChallenges);
  return (
    (hasNukaDailyOpsDetails(payload.dailyOps) ? 1000 : 0)
    + (dailyCount * 40)
    + (weeklyCount * 30)
    + (payload.dailyChallenges?.endsIn ? 8 : 0)
    + (payload.weeklyChallenges?.endsIn ? 8 : 0)
    + (payload.dailyOps?.since ? 4 : 0)
  );
}

function hasUsableNukaKnightsIntelPayload(payload = {}) {
  return Boolean(
    hasNukaDailyOpsDetails(payload.dailyOps)
    || countNukaChallengeItems(payload.dailyChallenges) > 0
    || countNukaChallengeItems(payload.weeklyChallenges) > 0
  );
}

function setCachedNukaKnightsIntel(payload = {}, fetchedAt = Date.now()) {
  if (!hasUsableNukaKnightsIntelPayload(payload)) {
    return;
  }
  cachedNukaKnightsIntel.value = payload;
  cachedNukaKnightsIntel.fetchedAt = fetchedAt;
}

function readCachedNukaKnightsIntelFromDisk() {
  try {
    if (!fs.existsSync(NUKAKNIGHTS_CACHE_PATH)) {
      return null;
    }
    const cached = JSON.parse(fs.readFileSync(NUKAKNIGHTS_CACHE_PATH, "utf8"));
    const fetchedAt = Number(cached?.fetchedAt || 0);
    if (!Number.isFinite(fetchedAt) || Date.now() - fetchedAt > NUKAKNIGHTS_STALE_CACHE_TTL_MS) {
      return null;
    }
    const payload = cached?.payload && typeof cached.payload === "object" ? cached.payload : null;
    if (!hasUsableNukaKnightsIntelPayload(payload)) {
      return null;
    }
    setCachedNukaKnightsIntel(payload, fetchedAt);
    return { payload, fetchedAt };
  } catch {
    return null;
  }
}

function writeCachedNukaKnightsIntelToDisk(payload = {}, fetchedAt = Date.now()) {
  try {
    if (!hasUsableNukaKnightsIntelPayload(payload)) {
      return;
    }
    fs.mkdirSync(path.dirname(NUKAKNIGHTS_CACHE_PATH), { recursive: true });
    fs.writeFileSync(
      NUKAKNIGHTS_CACHE_PATH,
      JSON.stringify({ fetchedAt, payload }, null, 2),
      "utf8"
    );
  } catch {
    // Disk cache is an optimization; failing to write it should not break intel.
  }
}

function getCachedNukaKnightsIntel() {
  if (cachedNukaKnightsIntel.value) {
    return {
      payload: cachedNukaKnightsIntel.value,
      fetchedAt: cachedNukaKnightsIntel.fetchedAt
    };
  }
  return readCachedNukaKnightsIntelFromDisk();
}

function parseNukaKnightsIntel(html) {
  const lines = htmlToReadableLines(html);
  const dailyOpsIndex = (() => {
    let foundIndex = -1;
    for (let index = 0; index < lines.length; index += 1) {
      if (
        String(lines[index] || "").trim().toLowerCase() === "daily ops"
        && /^since\b/i.test(lines[index + 1] || "")
      ) {
        foundIndex = index;
      }
    }
    return foundIndex;
  })();
  const dailyChallengesIndex = lines.findIndex((line, index) => (
    index > dailyOpsIndex && line === "Daily Challenges"
  ));
  const weeklyChallengesIndex = lines.findIndex((line, index) => (
    index > Math.max(dailyChallengesIndex, dailyOpsIndex) && line === "Weekly Challenges"
  ));
  const dailyOpsEndIndex = dailyChallengesIndex >= 0
    ? dailyChallengesIndex
    : (weeklyChallengesIndex >= 0 ? weeklyChallengesIndex : lines.length);
  const weeklyEndIndex = (() => {
    if (weeklyChallengesIndex < 0) {
      return lines.length;
    }
    const navIndex = lines.findIndex((line, index) => (
      index > weeklyChallengesIndex && /\b(Zurück|Weiter)\b|\[(Back|Next)\]/i.test(line)
    ));
    return navIndex >= 0 ? navIndex + 1 : lines.length;
  })();

  const parsed = {
    fetchedAt: new Date().toISOString(),
    source: NUKAKNIGHTS_HOME_URL,
    dailyOps: parseNukaDailyOps(lines, dailyOpsIndex, dailyOpsEndIndex),
    dailyChallenges: parseNukaChallengeSection(lines, dailyChallengesIndex, weeklyChallengesIndex),
    weeklyChallenges: parseNukaChallengeSection(lines, weeklyChallengesIndex, weeklyEndIndex)
  };

  const hasOps = hasNukaDailyOpsDetails(parsed.dailyOps);
  const hasDaily = parsed.dailyChallenges.items.length > 0;
  const hasWeekly = parsed.weeklyChallenges.items.length > 0;
  if (!hasOps && !hasDaily && !hasWeekly) {
    throw new Error("Unable to parse NukaKnights daily intel.");
  }

  return parsed;
}

function inferListNumber(items, lists) {
  if (!Array.isArray(items) || !items.length || !Array.isArray(lists) || !lists.length) {
    return null;
  }

  const itemNames = new Set(items.map((item) => normalizePlanName(item.name)));
  let bestScore = 0;
  let bestListNumber = null;

  for (const list of lists) {
    const inventory = Array.isArray(list?.Inventory) ? list.Inventory : [];
    const score = inventory.reduce((sum, entry) => {
      return sum + (itemNames.has(normalizePlanName(entry?.Name)) ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestListNumber = Number(list?.ListNumber);
    }
  }

  const threshold = Math.min(3, itemNames.size);
  return bestScore >= threshold ? bestListNumber : null;
}

function extractTimeZoneParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
  const parts = formatter.formatToParts(date);
  const byType = Object.create(null);

  for (const part of parts) {
    if (part.type !== "literal") {
      byType[part.type] = part.value;
    }
  }

  return {
    year: Number(byType.year),
    month: Number(byType.month),
    day: Number(byType.day),
    hour: Number(byType.hour),
    minute: Number(byType.minute),
    second: Number(byType.second || "0")
  };
}

function buildEasternDate(year, month, day, hour, minute) {
  const timeZone = "America/New_York";
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let index = 0; index < 4; index += 1) {
    const actual = extractTimeZoneParts(new Date(utcMs), timeZone);
    const targetMs = Date.UTC(year, month - 1, day, hour, minute, 0);
    const actualMs = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second
    );
    const diff = targetMs - actualMs;
    if (!diff) {
      return new Date(utcMs);
    }
    utcMs += diff;
  }

  return new Date(utcMs);
}

function shiftEasternDateByDays(date, dayOffset = 0) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = extractTimeZoneParts(date, "America/New_York");
  const shiftedDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + Number(dayOffset || 0), 0, 0, 0));
  return buildEasternDate(
    shiftedDate.getUTCFullYear(),
    shiftedDate.getUTCMonth() + 1,
    shiftedDate.getUTCDate(),
    parts.hour,
    parts.minute
  );
}

function parseBethesdaRawDateTime(raw) {
  const value = String(raw || "").trim();
  if (!value) {
    return null;
  }

  const match = value.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})\s*([AP]M)$/i);
  if (!match) {
    return null;
  }

  const [year, month, day] = match[1].split("-").map((part) => Number(part));
  const [hourText, minuteText] = match[2].split(":");
  let hour = Number(hourText);
  const minute = Number(minuteText);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hour < 12) {
    hour += 12;
  }
  if (meridiem === "AM" && hour === 12) {
    hour = 0;
  }

  return buildEasternDate(year, month, day, hour, minute);
}

function parseMinervaInfoApiDateAt18(dateValue) {
  const normalized = String(dateValue || "").trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  return buildEasternDate(Number(match[1]), Number(match[2]), Number(match[3]), 12, 0);
}

function parseMinervaInfoApi(payload, lists = []) {
  const itemsRaw = Array.isArray(payload?.data?.items) ? payload.data.items : [];
  if (!itemsRaw.length) {
    return null;
  }

  const firstItem = itemsRaw[0];
  let location = normalizeLocation(firstItem?.location_name || "");
  let eventStart = parseMinervaInfoApiDateAt18(firstItem?.date_start);
  let eventEnd = parseMinervaInfoApiDateAt18(firstItem?.date_end);
  const saleType = Number(firstItem?.Type_list);
  if (saleType === 1 && eventEnd instanceof Date && !Number.isNaN(eventEnd.getTime())) {
    eventEnd = shiftEasternDateByDays(eventEnd, -1);
  }
  const now = new Date();
  let active = Boolean(eventStart && eventEnd && now >= eventStart && now < eventEnd);
  const remoteImageName = String(firstItem?.location_img || "").trim();
  let locationMapImage = remoteImageName
    ? `${MINERVA_INFO_REMOTE_IMAGE_BASE}/${remoteImageName}`
    : (MINERVA_LOCATION_MAP_BY_LOCATION[location] || "");

  let items = itemsRaw
    .map((item) => {
      const price = parseOptionalPrice(item?.gold);
      return {
        name: String(item?.item || "").trim() || "--",
        price: Number.isFinite(price) ? price : null,
        url: normalizeWikiUrl(item?.wiki_url || "")
      };
    })
    .filter((item) => item.name && item.name !== "--");

  let listNumber = Number(firstItem?.id_list);
  if (!Number.isFinite(listNumber) || listNumber < 1) {
    listNumber = inferListNumber(items, lists);
  }

  if (!active && eventEnd instanceof Date && !Number.isNaN(eventEnd.getTime()) && now >= eventEnd) {
    const nextEvent = resolveFallbackMinervaEventWindow(now);
    if (nextEvent && !nextEvent.active) {
      location = nextEvent.location;
      eventStart = nextEvent.eventStart;
      eventEnd = nextEvent.eventEnd;
      listNumber = nextEvent.listNumber;
      locationMapImage = MINERVA_LOCATION_MAP_BY_LOCATION[location] || "";
      const nextListData = lists.find((entry) => Number(entry?.ListNumber) === listNumber);
      const nextInventory = Array.isArray(nextListData?.Inventory) ? nextListData.Inventory : [];
      items = nextInventory.map((item) => ({
        name: String(item?.Name || "").trim() || "--",
        price: parseOptionalPrice(item?.Price),
        url: normalizeWikiUrl(item?.WikiUrl || "")
      }));
    }
  }

  return {
    location,
    listNumber,
    active,
    nextChange: null,
    eventStart,
    eventEnd,
    items,
    source: "minerva-info-api",
    locationMapImage
  };
}

function parseMinervaLive(text, lists = []) {
  const statusLine = text.match(/She is[^\n]+/i)?.[0]?.trim() || "";
  const locationRaw = statusLine.match(/(Foundation|Crater|Fort Atlas|(?:The\s+)?Whitespring)/i)?.[1] || "";
  const location = normalizeLocation(locationRaw);
  const active = statusLine ? !/not available/i.test(statusLine) : false;
  const nextChange = text.match(/At\s+([0-9]{4}-[0-9]{2}-[0-9]{2}\s+[0-9:]{1,5}\s*[AP]M)\s+Bethesda Time/i)?.[1] || null;

  const itemRegex = /\[!\[Image\s+\d+\]\([^)]+\)\s+([^!\n]+?)\s+!\[Image\s+\d+\]\([^)]+\)\s+(\d{2,5})\]\((https?:\/\/[^)\s]+)\)/gi;
  const seen = new Set();
  const items = [];
  let match;

  while ((match = itemRegex.exec(text)) !== null) {
    let name = match[1].trim();
    if (!/^Plan:\s*/i.test(name)) {
      name = `Plan: ${name}`;
    }

    const price = Number(match[2]);
    const url = match[3];
    const key = `${name}|${price}`;

    if (!seen.has(key)) {
      seen.add(key);
      items.push({ name, price, url });
    }
  }

  return {
    location,
    listNumber: inferListNumber(items, lists),
    active,
    nextChange,
    eventStart: null,
    eventEnd: null,
    items,
    source: "whereisminerva",
    locationMapImage: MINERVA_LOCATION_MAP_BY_LOCATION[location] || ""
  };
}

function mod(value, base) {
  return ((value % base) + base) % base;
}

function buildFallbackCycleDate(weekNumber, dayOffset = 0) {
  const shifted = new Date(FALLBACK_MINERVA_ANCHOR_DATE_UTC);
  shifted.setUTCDate(shifted.getUTCDate() + weekNumber * 7 + dayOffset);
  return buildEasternDate(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
    12,
    0
  );
}

function buildFallbackMinervaEventByIndex(eventIndex, eventStart) {
  const normalizedIndex = Math.max(0, Number(eventIndex) || 0);
  const phase = mod(normalizedIndex, 4);
  const safeStart = eventStart instanceof Date && !Number.isNaN(eventStart.getTime())
    ? eventStart
    : buildFallbackCycleDate(0);
  const eventEnd = shiftEasternDateByDays(safeStart, MINERVA_FALLBACK_EVENT_ACTIVE_DAYS[phase]);

  return {
    eventIndex: normalizedIndex,
    listNumber: mod(normalizedIndex, CYCLE_WEEKS) + 1,
    location: CYCLE_LOCATIONS[phase],
    eventStart: safeStart,
    eventEnd,
    phase
  };
}

function nextFallbackMinervaEventStart(eventStart, eventIndex) {
  const safeStart = eventStart instanceof Date && !Number.isNaN(eventStart.getTime())
    ? eventStart
    : buildFallbackCycleDate(0);
  const phase = mod(Number(eventIndex) || 0, 4);
  return shiftEasternDateByDays(safeStart, MINERVA_FALLBACK_EVENT_START_GAP_DAYS[phase]);
}

function resolveFallbackMinervaEventWindow(now = new Date()) {
  let eventIndex = 0;
  let eventStart = buildFallbackCycleDate(0);

  for (let guard = 0; guard < MINERVA_FALLBACK_EVENT_SEARCH_LIMIT; guard += 1) {
    const currentEvent = buildFallbackMinervaEventByIndex(eventIndex, eventStart);
    const nextStart = nextFallbackMinervaEventStart(eventStart, eventIndex);

    if (!(nextStart instanceof Date) || Number.isNaN(nextStart.getTime())) {
      return {
        ...currentEvent,
        active: now >= currentEvent.eventStart && now < currentEvent.eventEnd
      };
    }

    if (now < currentEvent.eventStart) {
      return {
        ...currentEvent,
        active: false
      };
    }

    if (now < currentEvent.eventEnd) {
      return {
        ...currentEvent,
        active: true
      };
    }

    if (now < nextStart) {
      const nextEvent = buildFallbackMinervaEventByIndex(eventIndex + 1, nextStart);
      return {
        ...nextEvent,
        active: false
      };
    }

    eventIndex += 1;
    eventStart = nextStart;
  }

  const fallbackEvent = buildFallbackMinervaEventByIndex(eventIndex, eventStart);
  return {
    ...fallbackEvent,
    active: now >= fallbackEvent.eventStart && now < fallbackEvent.eventEnd
  };
}

function resolveFallbackWeekNumber(now = new Date()) {
  const anchorStart = buildFallbackCycleDate(0);
  let weekNumber = Math.floor((now.getTime() - anchorStart.getTime()) / MS_WEEK);

  while (now < buildFallbackCycleDate(weekNumber)) {
    weekNumber -= 1;
  }
  while (now >= buildFallbackCycleDate(weekNumber + 1)) {
    weekNumber += 1;
  }

  return weekNumber;
}

function cycleForWeek(weekNumber) {
  const cycleIndex = mod(weekNumber, CYCLE_WEEKS);
  const listNumber = cycleIndex + 1;
  const phase = cycleIndex % 4;
  const location = CYCLE_LOCATIONS[phase];

  const weekStart = buildFallbackCycleDate(weekNumber);
  let eventStart = weekStart;
  let eventEnd;

  if (phase === 3) {
    eventStart = buildFallbackCycleDate(weekNumber, 3);
    eventEnd = buildFallbackCycleDate(weekNumber, 7);
  } else {
    eventEnd = buildFallbackCycleDate(weekNumber, 2);
  }

  return {
    listNumber,
    location,
    eventStart,
    eventEnd
  };
}

function buildFallbackMinerva(lists = []) {
  const cycle = resolveFallbackMinervaEventWindow(new Date());

  const listData = lists.find((entry) => Number(entry?.ListNumber) === cycle.listNumber);
  const inventory = Array.isArray(listData?.Inventory) ? listData.Inventory : [];
  const items = inventory.map((item) => ({
    name: String(item?.Name || "").trim() || "--",
    price: parseOptionalPrice(item?.Price),
    url: normalizeWikiUrl(item?.WikiUrl || "")
  }));

  return {
    location: cycle.location,
    listNumber: cycle.listNumber,
    active: Boolean(cycle.active),
    nextChange: null,
    eventStart: cycle.eventStart,
    eventEnd: cycle.eventEnd,
    items,
    source: "fallback",
    locationMapImage: MINERVA_LOCATION_MAP_BY_LOCATION[cycle.location] || ""
  };
}

async function fetchTextWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: "no-store"
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchTextFromCandidates(candidates, timeoutMs = 20000) {
  let lastError = new Error("No source candidates configured.");

  for (const candidate of candidates) {
    const variants = candidate.startsWith(PROXY_BASE) ? [candidate] : [candidate, proxied(candidate)];
    for (const url of variants) {
      try {
        const text = await fetchTextWithTimeout(url, {}, timeoutMs);
        return { text, source: candidate };
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError;
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 20000) {
  const text = await fetchTextWithTimeout(url, options, timeoutMs);
  return JSON.parse(String(text || "").replace(/^\uFEFF/, ""));
}

async function fetchOfficialSteamCurrentPlayers() {
  const payload = await fetchJsonWithTimeout(
    STEAM_CURRENT_PLAYERS_URL,
    {
      headers: {
        accept: "application/json"
      }
    },
    12000
  );

  const playerCount = parseIntegerText(payload?.response?.player_count);
  if (playerCount == null) {
    throw new Error("Steam player count response did not include a current player count.");
  }

  return playerCount;
}

function normalizeSteamChartsHistoryPoints(payload) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((point) => {
      const timestampMs = Array.isArray(point) ? Number(point[0]) : NaN;
      const playerCount = Array.isArray(point) ? parseIntegerText(point[1]) : null;
      if (!Number.isFinite(timestampMs) || playerCount == null || playerCount < 0) {
        return null;
      }
      return [Math.round(timestampMs), playerCount];
    })
    .filter(Boolean)
    .sort((left, right) => left[0] - right[0]);
}

function buildSteamChartsHistorySummary(history = []) {
  if (!Array.isArray(history) || !history.length) {
    return {
      playersNow: null,
      peak24h: null,
      peakAllTime: null,
      capturedAt: null
    };
  }

  const latestPoint = history[history.length - 1];
  const latestTimestampMs = latestPoint[0];
  const recentCutoffMs = latestTimestampMs - MS_DAY;
  const last24h = history.filter((point) => point[0] >= recentCutoffMs);

  return {
    playersNow: latestPoint[1],
    peak24h: (last24h.length ? last24h : history).reduce((maxValue, point) => Math.max(maxValue, point[1]), 0),
    peakAllTime: history.reduce((maxValue, point) => Math.max(maxValue, point[1]), 0),
    capturedAt: new Date(latestTimestampMs).toISOString()
  };
}

async function fetchSteamChartsHistory() {
  const payload = await fetchJsonWithTimeout(
    STEAMCHARTS_HISTORY_URL,
    {
      headers: {
        accept: "application/json,text/plain,*/*"
      }
    },
    15000
  );

  const history = normalizeSteamChartsHistoryPoints(payload);
  if (history.length < 2) {
    throw new Error("SteamCharts history response did not contain enough telemetry points.");
  }

  return history;
}

function buildPlayerCountsResponse(payload, { includeHistory = false } = {}) {
  if (includeHistory) {
    return payload;
  }

  const response = { ...payload };
  delete response.history;
  return response;
}

async function fetchPlayerCounts({ force = false, includeHistory = false } = {}) {
  const now = Date.now();
  if (!force && cachedPlayerCounts.value && now - cachedPlayerCounts.fetchedAt < PLAYER_COUNTS_CACHE_TTL_MS) {
    return buildPlayerCountsResponse(cachedPlayerCounts.value, { includeHistory });
  }

  if (cachedPlayerCounts.promise) {
    return cachedPlayerCounts.promise.then((payload) => buildPlayerCountsResponse(payload, { includeHistory }));
  }

  cachedPlayerCounts.promise = (async () => {
    const fetchedAt = new Date().toISOString();
    const [officialCurrentResult, historyResult] = await Promise.allSettled([
      fetchOfficialSteamCurrentPlayers(),
      fetchSteamChartsHistory()
    ]);

    const officialCurrent = officialCurrentResult.status === "fulfilled"
      ? officialCurrentResult.value
      : null;
    const history = historyResult.status === "fulfilled"
      ? historyResult.value
      : null;
    const historySummary = history ? buildSteamChartsHistorySummary(history) : null;

    if (officialCurrent == null && !historySummary) {
      throw new Error("Unable to fetch Steam player telemetry right now.");
    }

    const payload = {
      appId: STEAM_APP_ID,
      scope: "steam_pc",
      playersNow: officialCurrent ?? historySummary?.playersNow ?? null,
      peak24h: historySummary?.peak24h ?? null,
      peakAllTime: historySummary?.peakAllTime ?? null,
      partial: !(officialCurrent != null && historySummary),
      fetchedAt,
      capturedAt: historySummary?.capturedAt || fetchedAt,
      source: {
        current: officialCurrent != null ? STEAM_CURRENT_PLAYERS_URL : "",
        history: history ? STEAMCHARTS_HISTORY_URL : "",
        peaks: history ? STEAMCHARTS_APP_URL : ""
      },
      history: history || []
    };

    cachedPlayerCounts.value = payload;
    cachedPlayerCounts.fetchedAt = Date.now();
    return payload;
  })().finally(() => {
    cachedPlayerCounts.promise = null;
  });

  return cachedPlayerCounts.promise.then((payload) => buildPlayerCountsResponse(payload, { includeHistory }));
}

function isNukaKnightsIntelComplete(payload = {}) {
  return Boolean(
    hasNukaDailyOpsDetails(payload.dailyOps)
    && countNukaChallengeItems(payload.dailyChallenges) > 0
    && countNukaChallengeItems(payload.weeklyChallenges) > 0
  );
}

async function fetchNukaKnightsCandidate(url, timeoutMs = NUKAKNIGHTS_SOURCE_TIMEOUT_MS) {
  const html = await fetchTextWithTimeout(
    url,
    {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        pragma: "no-cache",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
      }
    },
    timeoutMs
  );
  const parsed = parseNukaKnightsIntel(html);
  parsed.source = url;
  return parsed;
}

async function refreshNukaKnightsIntel() {
  // The AJAX fragment carries all three sections, so one request usually suffices;
  // the full page and readable mirrors are only hit when it fails or comes back partial.
  const candidateTiers = [
    [{ url: NUKAKNIGHTS_AJAX_HOME_URL, timeoutMs: NUKAKNIGHTS_SOURCE_TIMEOUT_MS }],
    [
      { url: NUKAKNIGHTS_HOME_URL, timeoutMs: NUKAKNIGHTS_SOURCE_TIMEOUT_MS },
      ...NUKAKNIGHTS_READABLE_URLS.map((url) => ({ url, timeoutMs: NUKAKNIGHTS_MIRROR_TIMEOUT_MS }))
    ]
  ];
  let lastError = new Error("No NukaKnights source candidates configured.");
  let bestPayload = null;
  let bestScore = -1;

  for (const tier of candidateTiers) {
    const settled = await Promise.allSettled(tier.map((candidate) => fetchNukaKnightsCandidate(candidate.url, candidate.timeoutMs)));

    for (const result of settled) {
      if (result.status !== "fulfilled") {
        lastError = result.reason || lastError;
        continue;
      }

      const score = scoreNukaKnightsIntelPayload(result.value);
      if (score > bestScore) {
        bestPayload = result.value;
        bestScore = score;
      }
    }

    if (bestPayload && isNukaKnightsIntelComplete(bestPayload)) {
      break;
    }
  }

  if (!bestPayload) {
    cachedNukaKnightsIntel.lastFailureAt = Date.now();
    throw lastError;
  }

  const fetchedAt = Date.now();
  cachedNukaKnightsIntel.lastFailureAt = 0;
  setCachedNukaKnightsIntel(bestPayload, fetchedAt);
  writeCachedNukaKnightsIntelToDisk(bestPayload, fetchedAt);
  return bestPayload;
}

function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out waiting for fresh NukaKnights intel.")), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function fetchNukaKnightsIntel({ force = false } = {}) {
  const now = Date.now();
  const cached = getCachedNukaKnightsIntel();
  if (!force && cached && now - cached.fetchedAt < NUKAKNIGHTS_CACHE_TTL_MS) {
    return cached.payload;
  }

  if (!cachedNukaKnightsIntel.promise) {
    const coolingDown = !force
      && cachedNukaKnightsIntel.lastFailureAt
      && now - cachedNukaKnightsIntel.lastFailureAt < NUKAKNIGHTS_FAILURE_COOLDOWN_MS;
    if (coolingDown) {
      if (cached) {
        return cached.payload;
      }
      throw new Error("NukaKnights intel sources are unavailable; retrying shortly.");
    }
    cachedNukaKnightsIntel.promise = refreshNukaKnightsIntel().finally(() => {
      cachedNukaKnightsIntel.promise = null;
    });
  }

  if (cached) {
    try {
      return await withTimeout(cachedNukaKnightsIntel.promise, NUKAKNIGHTS_REFRESH_WAIT_BUDGET_MS);
    } catch {
      return cached.payload;
    }
  }

  return cachedNukaKnightsIntel.promise;
}

async function fetchMinervaInfoData(lists = []) {
  const dateValue = new Date().toISOString().slice(0, 10);
  const directUrl = SOURCE_URLS.minervaInfoApi[0];
  const body = new URLSearchParams({
    accion: "getLista",
    fecha: dateValue
  }).toString();
  const options = {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
    body
  };

  const candidates = [directUrl, proxied(directUrl)];
  for (const url of candidates) {
    try {
      const text = await fetchTextWithTimeout(url, options, 12000);
      const parsed = JSON.parse(String(text || "").replace(/^\uFEFF/, ""));
      const data = parseMinervaInfoApi(parsed, lists);
      if (data) {
        return data;
      }
    } catch (error) {
      // Continue to the next candidate.
    }
  }

  return null;
}

function extractSiloCode(text, label, stopLabels) {
  const upper = text.toUpperCase();
  const start = upper.indexOf(label);
  if (start === -1) {
    return null;
  }

  const afterStart = text.slice(start + label.length);
  let sectionEnd = afterStart.length;

  for (const stopLabel of stopLabels) {
    const index = afterStart.toUpperCase().indexOf(stopLabel);
    if (index >= 0 && index < sectionEnd) {
      sectionEnd = index;
    }
  }

  const block = afterStart.slice(0, sectionEnd);
  return block.match(/\b(\d{8})\b/)?.[1] || null;
}

function parseSiloResetCountdown(text) {
  const match = String(text || "").match(/Resets\s+in:\s*(\d+)d\s*(\d+)h\s*(\d+)m(?:\s*(\d+)s)?/i);
  if (!match) {
    return null;
  }

  return {
    days: Number(match[1]),
    hours: Number(match[2]),
    minutes: Number(match[3]),
    seconds: Number(match[4] || 0)
  };
}

function countdownToUtc(countdown, baseMs = Date.now()) {
  if (!countdown) {
    return null;
  }

  const totalMs = (((countdown.days * 24 + countdown.hours) * 60 + countdown.minutes) * 60 + countdown.seconds) * 1000;
  return new Date(baseMs + totalMs);
}

function nextSiloResetUtc(now = new Date()) {
  const reset = new Date(now);
  const daysUntilReset = ((SILO_RESET_DAY_UTC + 7 - now.getUTCDay()) % 7) || 7;
  reset.setUTCDate(now.getUTCDate() + daysUntilReset);
  reset.setUTCHours(0, 0, 0, 0);
  if (reset <= now) {
    reset.setUTCDate(reset.getUTCDate() + 7);
  }
  return reset;
}

function nextSiloResetUtcFromSinceEpoch(sinceEpoch, now = new Date()) {
  const baseSeconds = Number(sinceEpoch);
  if (!Number.isFinite(baseSeconds) || baseSeconds <= 0) {
    return null;
  }

  const cycleMs = 7 * 24 * 60 * 60 * 1000;
  let targetMs = baseSeconds * 1000;
  const nowMs = now.getTime();

  while (targetMs <= nowMs) {
    targetMs += cycleMs;
  }

  return new Date(targetMs);
}

function parseSiloData(text) {
  const normalized = String(text || "").replace(/\u00A0/g, " ");

  return {
    codes: {
      Alpha: extractSiloCode(normalized, "ALPHA", ["BRAVO", "CHARLIE"]),
      Bravo: extractSiloCode(normalized, "BRAVO", ["CHARLIE"]),
      Charlie: extractSiloCode(normalized, "CHARLIE", ["RESETS IN", "RECENT NEWS", "NUKE CODES VALID", "CART", "VIEW ALL RESULTS"])
    },
    resetCountdown: parseSiloResetCountdown(normalized),
    isExpired: /Expired\s*-\s*Please\s+wait\s+for\s+the\s+codes\s+to\s+be\s+updated/i.test(normalized)
  };
}

function loadMinervaLists(siteRoot) {
  if (cachedMinervaLists) {
    return cachedMinervaLists;
  }

  const listsPath = path.join(siteRoot, "data", "minerva-lists.json");
  const raw = fs.readFileSync(listsPath, "utf8").replace(/^\uFEFF/, "");
  const parsed = JSON.parse(raw);
  cachedMinervaLists = Array.isArray(parsed) ? parsed : [];
  return cachedMinervaLists;
}

function mapArchiveMinervaItem(entry) {
  return {
    name: String(entry?.Name || "").trim() || "--",
    price: parseOptionalPrice(entry?.Price),
    url: normalizeWikiUrl(entry?.WikiUrl || "")
  };
}

function mergeMinervaArchiveItems(data, lists = []) {
  const liveData = data && typeof data === "object" ? data : {};
  if (!Array.isArray(lists) || !lists.length) {
    return liveData;
  }

  let listNumber = Number(liveData?.listNumber);
  if (!Number.isFinite(listNumber) || listNumber < 1) {
    listNumber = inferListNumber(liveData?.items || [], lists);
  }

  const listData = lists.find((entry) => Number(entry?.ListNumber) === listNumber);
  const inventory = Array.isArray(listData?.Inventory) ? listData.Inventory : [];
  if (!inventory.length) {
    return {
      ...liveData,
      listNumber
    };
  }

  return {
    ...liveData,
    listNumber,
    items: inventory.map((entry) => mapArchiveMinervaItem(entry)),
    archiveSource: "local_lists"
  };
}

async function fetchSiloIntel() {
  try {
    const text = await fetchTextWithTimeout(NUKACRYPT_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        query: "query { nukeCodes { alpha bravo charlie sinceEpoch } }"
      })
    }, 12000);
    const parsed = JSON.parse(String(text || "").replace(/^\uFEFF/, ""));
    const rawCodes = parsed?.data?.nukeCodes;
    const resetTargetUtc = nextSiloResetUtcFromSinceEpoch(rawCodes?.sinceEpoch) || nextSiloResetUtc();
    const codes = {
      Alpha: typeof rawCodes?.alpha === "string" ? rawCodes.alpha.trim() : null,
      Bravo: typeof rawCodes?.bravo === "string" ? rawCodes.bravo.trim() : null,
      Charlie: typeof rawCodes?.charlie === "string" ? rawCodes.charlie.trim() : null
    };
    if (Object.values(codes).some(Boolean)) {
      return {
        codes,
        isExpired: false,
        resetTargetUtc,
        source: "https://nukacrypt.com/"
      };
    }
  } catch (_error) {
    // Fall back to scraping if the API is unavailable.
  }

  let lastError = new Error("Unable to resolve silo codes from upstream response.");

  for (const candidate of SOURCE_URLS.silo) {
    const variants = candidate.startsWith(PROXY_BASE) ? [candidate] : [candidate, proxied(candidate)];
    for (const url of variants) {
      try {
        const text = await fetchTextWithTimeout(url, {}, 25000);
        const parsed = parseSiloData(text);
        const hasAtLeastOne = Object.values(parsed.codes).some(Boolean);
        if (!hasAtLeastOne) {
          lastError = new Error("Unable to resolve silo codes from upstream response.");
          continue;
        }

        return {
          codes: parsed.codes,
          isExpired: parsed.isExpired,
          resetTargetUtc: countdownToUtc(parsed.resetCountdown) || nextSiloResetUtc(),
          source: candidate
        };
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError;
}

async function fetchMinervaIntel(siteRoot) {
  const lists = loadMinervaLists(siteRoot);
  const liveInfo = await fetchMinervaInfoData(lists);
  if (liveInfo) {
    return mergeMinervaArchiveItems(liveInfo, lists);
  }

  try {
    const { text, source } = await fetchTextFromCandidates(SOURCE_URLS.minerva, 25000);
    const liveParsed = parseMinervaLive(text, lists);
    if (Array.isArray(liveParsed.items) && liveParsed.items.length) {
      return mergeMinervaArchiveItems({
        ...liveParsed,
        source
      }, lists);
    }
  } catch (error) {
    // Fall through to deterministic list rotation fallback.
  }

  return buildFallbackMinerva(lists);
}

function serializeSiloFingerprint(data) {
  return JSON.stringify({
    version: SILO_FINGERPRINT_VERSION,
    codes: data?.codes || null,
    isExpired: Boolean(data?.isExpired)
  });
}

function serializeMinervaFingerprint(data) {
  return JSON.stringify({
    location: data?.location || "--",
    listNumber: Number.isFinite(Number(data?.listNumber)) ? Number(data.listNumber) : null,
    active: Boolean(data?.active),
    nextChange: data?.nextChange || null,
    eventStart: data?.eventStart instanceof Date ? data.eventStart.toISOString() : null,
    eventEnd: data?.eventEnd instanceof Date ? data.eventEnd.toISOString() : null,
    items: Array.isArray(data?.items)
      ? data.items.map((item) => ({
        name: item?.name || "",
        price: parseOptionalPrice(item?.price),
        url: item?.url || ""
      }))
      : []
  });
}

async function fetchCurrentIntel(options = {}) {
  const siteRoot = path.resolve(String(options.siteRoot || path.join(__dirname, "..", "..")));
  const [silo, minerva] = await Promise.all([
    fetchSiloIntel(),
    fetchMinervaIntel(siteRoot)
  ]);

  return {
    silo,
    siloFingerprint: serializeSiloFingerprint(silo),
    minerva,
    minervaFingerprint: serializeMinervaFingerprint(minerva)
  };
}

module.exports = {
  fetchMinervaIntel,
  fetchNukaKnightsIntel,
  fetchPlayerCounts,
  fetchSiloIntel,
  fetchCurrentIntel,
  parseNukaKnightsIntel,
  parseBethesdaRawDateTime
};
