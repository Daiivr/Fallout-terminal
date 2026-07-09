"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_SOURCE_URL = `https://www.${["fallout", "builds.com"].join("")}/fo76/events/`;
const DEFAULT_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const DEFAULT_FETCH_TIMEOUT_MS = 18000;
const DEFAULT_FALLBACK_PATH = path.resolve(__dirname, "..", "..", "data", "fo76-events-fallback.json");
const USER_AGENT = "FalloutCodex/1.0 (FO76 calendar relay)";

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function decodeHtml(value = "") {
  return String(value)
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAttributes(tag = "") {
  const attributes = {};
  const attrRegex = /([a-zA-Z:-]+)\s*=\s*"([^"]*)"/g;
  let match;
  while ((match = attrRegex.exec(tag)) !== null) {
    attributes[String(match[1] || "").toLowerCase()] = decodeHtml(match[2] || "");
  }
  return attributes;
}

function addUtcDays(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function buildSlug(value = "") {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function normalizeColor(value = "") {
  const color = decodeHtml(value);
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/i.test(color)) {
    return color;
  }
  return "";
}

function stripTags(value = "") {
  return decodeHtml(String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " "));
}

function cleanEventInfoDescription(value = "") {
  return stripTags(value)
    .replace(/\s*Check\s+our\b[\s\S]*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeEventInfoKey(value = "") {
  let text = decodeHtml(value)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\bfallout\s*76\b/gi, "")
    .replace(/\bfo76\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  text = text
    .replace(/^the\s+hunt\s+for\s+the\s+treasure\s+hunter$/, "treasure hunter")
    .replace(/^hunt\s+for\s+the\s+treasure\s+hunter$/, "treasure hunter")
    .replace(/^fasnacht\s+(?:day|event)$/, "fasnacht")
    .replace(/^the\s+mothman\s+equinox$/, "mothman equinox")
    .replace(/\s+event$/i, "");

  return text
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseFo76EventInfo(html = "") {
  const sourceHtml = String(html || "");
  const details = [];

  const seasonalStart = sourceHtml.indexOf("id=\"seasonal-events\"");
  const weekendStart = sourceHtml.indexOf("id=\"weekend-events\"");
  const publicStart = sourceHtml.indexOf("id=\"public-events\"");
  const seasonalHtml = seasonalStart >= 0 && weekendStart > seasonalStart
    ? sourceHtml.slice(seasonalStart, weekendStart)
    : "";
  const weekendHtml = weekendStart >= 0
    ? sourceHtml.slice(weekendStart, publicStart > weekendStart ? publicStart : undefined)
    : "";

  const seasonalIntro = seasonalHtml
    ? Array.from(seasonalHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
      .slice(0, 3)
      .map((match) => stripTags(match[1]))
      .filter(Boolean)
    : [];

  const cardRegex = /<div class="bg-light rounded-lg mb-4 wp-block-media-text[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
  let cardMatch;
  while ((cardMatch = cardRegex.exec(seasonalHtml)) !== null) {
    const block = cardMatch[0];
    const title = stripTags(block.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1] || "");
    const description = cleanEventInfoDescription(block.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] || "");
    if (!title || !description) {
      continue;
    }
    const imageTag = block.match(/<img\b[^>]*>/i)?.[0] || "";
    const imageAttrs = extractAttributes(imageTag);
    details.push({
      key: normalizeEventInfoKey(title),
      type: "seasonal",
      title,
      description,
      image: imageAttrs.src || "",
      imageAlt: imageAttrs.alt || title
    });
  }

  const weekendIntro = weekendHtml
    ? Array.from(weekendHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
      .slice(0, 2)
      .map((match) => stripTags(match[1]))
      .filter(Boolean)
    : [];

  const liRegex = /<li\b[^>]*>\s*<strong>([\s\S]*?)<\/strong>\s*:\s*([\s\S]*?)<\/li>/gi;
  let liMatch;
  while ((liMatch = liRegex.exec(weekendHtml)) !== null) {
    const title = stripTags(liMatch[1]);
    const description = cleanEventInfoDescription(liMatch[2]);
    if (!title || !description) {
      continue;
    }
    details.push({
      key: normalizeEventInfoKey(title),
      type: "weekend",
      title,
      description,
      image: "",
      imageAlt: title
    });
  }

  return {
    seasonalIntro,
    weekendIntro,
    details
  };
}

function parseFo76EventsCalendar(html = "", { sourceUrl = DEFAULT_SOURCE_URL } = {}) {
  const sourceHtml = String(html || "");
  const eventInfo = parseFo76EventInfo(sourceHtml);
  const eventInfoByKey = new Map(eventInfo.details.map((detail) => [detail.key, detail]));
  const dayRegex = /<div\b(?=[^>]*\bdata-day="(\d{4}-\d{2}-\d{2})")[^>]*>/g;
  const dayStarts = [];
  let dayMatch;

  while ((dayMatch = dayRegex.exec(sourceHtml)) !== null) {
    dayStarts.push({
      date: dayMatch[1],
      index: dayMatch.index
    });
  }

  if (!dayStarts.length) {
    throw new Error("FO76 calendar days were not found.");
  }

  const eventIndex = new Map();
  const days = [];

  for (let index = 0; index < dayStarts.length; index += 1) {
    const day = dayStarts[index];
    const nextDayIndex = index + 1 < dayStarts.length ? dayStarts[index + 1].index : sourceHtml.indexOf("</figure>", day.index);
    const dayBlock = sourceHtml.slice(day.index, nextDayIndex > day.index ? nextDayIndex : undefined);
    const titleTags = [];
    const titleRegex = /<div\b(?=[^>]*\btitle=")[^>]*>/g;
    let titleMatch;

    while ((titleMatch = titleRegex.exec(dayBlock)) !== null) {
      titleTags.push({
        tag: titleMatch[0],
        index: titleMatch.index
      });
    }

    const dayEvents = [];
    const seenKeys = new Set();

    for (let titleIndex = 0; titleIndex < titleTags.length; titleIndex += 1) {
      const current = titleTags[titleIndex];
      const attrs = extractAttributes(current.tag);
      const title = decodeHtml(attrs.title || "");
      if (!title || title === "--") {
        continue;
      }

      const style = attrs.style || "";
      const color = normalizeColor(style.match(/background-color\s*:\s*([^;]+)/i)?.[1] || "");
      const segmentEnd = titleIndex + 1 < titleTags.length ? titleTags[titleIndex + 1].index : dayBlock.length;
      const eventSegment = dayBlock.slice(current.index, segmentEnd);
      const href = decodeHtml(eventSegment.match(/<a\b[^>]*\bhref="([^"]+)"/i)?.[1] || "");
      const image = decodeHtml(eventSegment.match(/<img\b[^>]*\bsrc="([^"]+)"/i)?.[1] || "");
      const alt = decodeHtml(eventSegment.match(/<img\b[^>]*\balt="([^"]+)"/i)?.[1] || "");
      const key = `${title}|${color}`;

      if (seenKeys.has(key)) {
        continue;
      }
      seenKeys.add(key);

      if (!eventIndex.has(key)) {
        eventIndex.set(key, {
          title,
          color,
          href: "",
          image: "",
          alt: "",
          dates: []
        });
      }

      const eventEntry = eventIndex.get(key);
      if (href && !eventEntry.href) {
        eventEntry.href = href;
      }
      if (image && !eventEntry.image) {
        eventEntry.image = image;
      }
      if (alt && !eventEntry.alt) {
        eventEntry.alt = alt;
      }
      eventEntry.dates.push(day.date);

      dayEvents.push({
        key,
        title,
        color,
        href,
        image,
        alt
      });
    }

    days.push({
      date: day.date,
      events: dayEvents
    });
  }

  const events = [];
  for (const [key, entry] of eventIndex.entries()) {
    const dates = Array.from(new Set(entry.dates)).sort();
    let startDate = dates[0];
    let previousDate = dates[0];
    let rangeIndex = 0;

    for (let index = 1; index <= dates.length; index += 1) {
      const currentDate = dates[index];
      if (currentDate && currentDate === addUtcDays(previousDate, 1)) {
        previousDate = currentDate;
        continue;
      }

      const baseSlug = buildSlug(`${entry.title}-${entry.color}`) || "event";
      const detail = eventInfoByKey.get(normalizeEventInfoKey(entry.title)) || null;
      events.push({
        id: `${baseSlug}-${startDate}${rangeIndex ? `-${rangeIndex + 1}` : ""}`,
        key,
        title: entry.title,
        startDate,
        endDate: previousDate,
        color: entry.color,
        sourceUrl: entry.href || sourceUrl,
        image: entry.image,
        imageAlt: entry.alt || entry.title,
        detailKey: detail?.key || "",
        detailType: detail?.type || ""
      });

      rangeIndex += 1;
      startDate = currentDate;
      previousDate = currentDate;
    }
  }

  const eventLookup = new Map(events.map((event) => [`${event.key}|${event.startDate}|${event.endDate}`, event]));
  const normalizedDays = days.map((day) => {
    const entries = day.events.map((event) => {
      const range = events.find((candidate) => (
        candidate.key === event.key
        && candidate.startDate <= day.date
        && candidate.endDate >= day.date
      ));
      return range ? {
        id: range.id,
        title: range.title,
        color: range.color,
        sourceUrl: range.sourceUrl,
        isStart: range.startDate === day.date,
        isEnd: range.endDate === day.date
      } : null;
    }).filter(Boolean);

    return {
      date: day.date,
      events: entries
    };
  });

  void eventLookup;

  return {
    source: "Community calendar",
    sourceUrl,
    fetchedAt: new Date().toISOString(),
    range: {
      startDate: normalizedDays[0]?.date || "",
      endDate: normalizedDays[normalizedDays.length - 1]?.date || ""
    },
    days: normalizedDays,
    events: events.sort((a, b) => (
      a.startDate.localeCompare(b.startDate)
      || a.title.localeCompare(b.title)
      || a.endDate.localeCompare(b.endDate)
    )),
    eventInfo
  };
}

async function fetchText(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "accept": "text/html,application/xhtml+xml",
        "user-agent": USER_AGENT
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function readCache(cachePath) {
  try {
    const raw = fs.readFileSync(cachePath, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.days) && Array.isArray(parsed.events)) {
      return parsed;
    }
  } catch {
    // Missing or invalid cache can be rebuilt.
  }
  return null;
}

function readBundledFallback(fallbackPath = DEFAULT_FALLBACK_PATH) {
  return readCache(fallbackPath);
}

function writeCache(cachePath, payload) {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  const tempPath = `${cachePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, cachePath);
}

async function fetchFo76EventsCalendar({
  storageDir,
  force = false,
  sourceUrl = process.env.FO76_EVENTS_SOURCE_URL || DEFAULT_SOURCE_URL,
  ttlMs = parsePositiveInteger(process.env.FO76_EVENTS_CACHE_TTL_MS, DEFAULT_CACHE_TTL_MS),
  timeoutMs = parsePositiveInteger(process.env.FO76_EVENTS_FETCH_TIMEOUT_MS, DEFAULT_FETCH_TIMEOUT_MS),
  fallbackPath = process.env.FO76_EVENTS_FALLBACK_PATH || DEFAULT_FALLBACK_PATH
} = {}) {
  const cachePath = path.join(storageDir || process.cwd(), "fo76-events-cache.json");
  const cached = readCache(cachePath);
  const cachedAtMs = Date.parse(String(cached?.fetchedAt || ""));
  const cachedHasEventInfo = Array.isArray(cached?.eventInfo?.details) && cached.eventInfo.details.length > 0;
  const cacheFresh = cached && cachedHasEventInfo && Number.isFinite(cachedAtMs) && Date.now() - cachedAtMs < ttlMs;

  if (!force && cacheFresh) {
    return {
      ...cached,
      cached: true
    };
  }

  try {
    const html = await fetchText(sourceUrl, timeoutMs);
    const payload = parseFo76EventsCalendar(html, { sourceUrl });
    writeCache(cachePath, payload);
    return {
      ...payload,
      cached: false
    };
  } catch (error) {
    if (cached) {
      return {
        ...cached,
        cached: true,
        stale: true,
        error: "Live event calendar sync failed; serving cached data."
      };
    }

    const fallback = readBundledFallback(fallbackPath);
    if (fallback) {
      return {
        ...fallback,
        cached: true,
        stale: true,
        error: "Live event calendar sync failed; serving bundled fallback data."
      };
    }

    throw error;
  }
}

module.exports = {
  fetchFo76EventsCalendar,
  parseFo76EventsCalendar,
  parseFo76EventInfo
};
