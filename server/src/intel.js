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
const SILO_RESET_DAY_UTC = 4;
const SILO_FINGERPRINT_VERSION = 3;

const FALLBACK_MINERVA_ANCHOR_DATE_UTC = Date.UTC(2026, 1, 16);
const MS_DAY = 24 * 60 * 60 * 1000;
const MS_WEEK = 7 * MS_DAY;
const CYCLE_WEEKS = 24;
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
  const location = normalizeLocation(firstItem?.location_name || "");
  const eventStart = parseMinervaInfoApiDateAt18(firstItem?.date_start);
  const eventEnd = parseMinervaInfoApiDateAt18(firstItem?.date_end);
  const now = new Date();
  const active = Boolean(eventStart && eventEnd && now >= eventStart && now <= eventEnd);
  const remoteImageName = String(firstItem?.location_img || "").trim();
  const locationMapImage = remoteImageName
    ? `${MINERVA_INFO_REMOTE_IMAGE_BASE}/${remoteImageName}`
    : (MINERVA_LOCATION_MAP_BY_LOCATION[location] || "");

  const items = itemsRaw
    .map((item) => {
      const price = Number(item?.gold);
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
  const now = new Date();
  const currentWeek = resolveFallbackWeekNumber(now);
  let cycle = cycleForWeek(currentWeek);
  const active = now >= cycle.eventStart && now < cycle.eventEnd;

  if (!active && now >= cycle.eventEnd) {
    cycle = cycleForWeek(currentWeek + 1);
  }

  const listData = lists.find((entry) => Number(entry?.ListNumber) === cycle.listNumber);
  const inventory = Array.isArray(listData?.Inventory) ? listData.Inventory : [];
  const items = inventory.map((item) => ({
    name: String(item?.Name || "").trim() || "--",
    price: Number(item?.Price),
    url: normalizeWikiUrl(item?.WikiUrl || "")
  }));

  return {
    location: cycle.location,
    listNumber: cycle.listNumber,
    active,
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
    return liveInfo;
  }

  try {
    const { text, source } = await fetchTextFromCandidates(SOURCE_URLS.minerva, 25000);
    const liveParsed = parseMinervaLive(text, lists);
    if (Array.isArray(liveParsed.items) && liveParsed.items.length) {
      return {
        ...liveParsed,
        source
      };
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
        price: Number.isFinite(Number(item?.price)) ? Number(item.price) : null,
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
  fetchSiloIntel,
  fetchCurrentIntel,
  parseBethesdaRawDateTime
};
