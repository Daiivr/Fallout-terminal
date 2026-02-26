import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = process.cwd();
const LISTS_PATH = resolve(ROOT, "data", "minerva-lists.json");
const OUTPUT_PATH = resolve(ROOT, "data", "minerva-detail-fallback.json");
const OUTPUT_JS_PATH = resolve(ROOT, "data", "minerva-detail-fallback.js");

const WIKI_BASE = "https://fallout.fandom.com";
const WIKI_API_EN = `${WIKI_BASE}/api.php`;
const WIKI_API_ES = `${WIKI_BASE}/es/api.php`;
const GOOGLE_TRANSLATE_BASE = "https://translate.googleapis.com/translate_a/single";
const DEFAULT_LOCAL_IMAGE = "assets/images/minerva-plan-fallback.png";
const REQUEST_TIMEOUT_MS = 28000;
const CONCURRENCY = 4;

const SECTION_TITLES = {
  en: {
    locations: ["Locations", "Location"],
    unlocks: ["Unlocks", "Unlock"]
  },
  es: {
    locations: ["Ubicaciones", "Ubicacion", "Lugares", "Lugar", "Locations", "Location"],
    unlocks: ["Desbloquea", "Desbloqueos", "Desbloqueo", "Unlocks", "Unlock"]
  }
};

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

function wikiPageTitleFromUrl(url) {
  try {
    const parsed = new URL(normalizeWikiUrl(url));
    const path = decodeURIComponent(parsed.pathname || "");
    const page = path.replace(/^\/(?:es\/)?wiki\//i, "").trim();
    return page.replace(/\s+/g, "_");
  } catch {
    return "";
  }
}

function minervaDetailKeyFromUrl(url) {
  const title = wikiPageTitleFromUrl(url);
  if (title) {
    return `${WIKI_BASE}/wiki/${title}`.toLowerCase();
  }
  return normalizeWikiUrl(url).toLowerCase();
}

function normalizeWikiTitle(title) {
  return String(title || "")
    .trim()
    .replace(/\s+/g, "_");
}

function buildWikiPageUrl(title, lang = "en") {
  const normalized = normalizeWikiTitle(title);
  if (!normalized) {
    return "";
  }
  const prefix = lang === "es" ? `${WIKI_BASE}/es/wiki/` : `${WIKI_BASE}/wiki/`;
  return `${prefix}${encodeURIComponent(normalized)}`;
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripWikiMarkup(value) {
  return String(value || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{\{[^{}]*\}\}/g, " ")
    .replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g, "$1")
    .replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, "$2")
    .replace(/\[\[(?:File|Image):[^\]]+\]\]/gi, " ")
    .replace(/^\s*[*#;:]+\s*/gm, "")
    .replace(/'''?/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractWikiSection(wikitext, sectionName) {
  if (!wikitext) {
    return "";
  }

  const pattern = new RegExp(`==\\s*${escapeRegExp(sectionName)}\\s*==([\\s\\S]*?)(?=\\n==[^=]|$)`, "i");
  const match = wikitext.match(pattern);
  return match?.[1]?.trim() || "";
}

function extractFirstWikiSection(wikitext, sectionNames = []) {
  for (const sectionName of sectionNames) {
    const section = extractWikiSection(wikitext, sectionName);
    if (section) {
      return section;
    }
  }
  return "";
}

function extractWikiBullets(sectionText) {
  return String(sectionText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[*#]/.test(line))
    .map((line) => stripWikiMarkup(line.replace(/^[*#]+\s*/, "")))
    .filter(Boolean);
}

function sanitizeDetailText(value) {
  let text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) {
    return "";
  }

  const categoryMatch = text.match(/\s(?:Category|Categor(?:i|\u00ED)a|Cat(?:e|\u00E9)gorie|Kategorie):/i);
  if (categoryMatch && typeof categoryMatch.index === "number" && categoryMatch.index > 0) {
    text = text.slice(0, categoryMatch.index).trim();
  }

  const i18nTailMatch = text.match(/\s(?:[a-z]{2,3}(?:-[a-z0-9]+)?):\s*(?:Plan|Plano|Sch(?:e|\u00E9)ma|\u0421\u0445\u0435\u043C\u0430)/i);
  if (i18nTailMatch && typeof i18nTailMatch.index === "number" && i18nTailMatch.index > 0) {
    text = text.slice(0, i18nTailMatch.index).trim();
  }

  return text.replace(/\s+/g, " ").trim();
}

function extractOtherSourcesFromLocations(sectionText) {
  const bulletSources = extractWikiBullets(sectionText)
    .map((line) => {
      const parts = line
        .split(/(?<=[.!?])\s+/)
        .map((part) => part.trim())
        .filter(Boolean)
        .filter((part) => !/\bminerva\b/i.test(part));
      return sanitizeDetailText(parts.join(" ").trim());
    })
    .filter(Boolean);
  if (bulletSources.length) {
    return [...new Set(bulletSources)];
  }

  const fallbackLines = stripWikiMarkup(sectionText)
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/\bminerva\b/i.test(line) && !/^(locations?|ubicaciones?|lugares?)?:?$/i.test(line))
    .map((line) => sanitizeDetailText(line))
    .filter(Boolean);
  return [...new Set(fallbackLines)];
}

function extractUnlocksSummary(sectionText) {
  const bullets = extractWikiBullets(sectionText);
  if (bullets.length) {
    return sanitizeDetailText(bullets.join(" "));
  }

  return sanitizeDetailText(stripWikiMarkup(sectionText)
    .replace(/^(?:unlocks?|desbloquea|desbloqueos?):?\s*/i, "")
    .trim());
}

async function fetchJsonWithTimeout(url, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWikitext(apiBase, title) {
  const page = normalizeWikiTitle(title);
  if (!page) {
    return "";
  }
  const url = `${apiBase}?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json&formatversion=2&origin=*`;
  const data = await fetchJsonWithTimeout(url);
  if (data?.error || !data?.parse?.wikitext) {
    throw new Error(data?.error?.info || "Missing parse payload.");
  }
  return String(data.parse.wikitext || "");
}

async function resolveSpanishTitle(sourceTitle) {
  const normalized = normalizeWikiTitle(sourceTitle);
  if (!normalized) {
    return "";
  }
  const url = `${WIKI_API_EN}?action=query&prop=langlinks&lllang=es&titles=${encodeURIComponent(normalized)}&format=json&formatversion=2&origin=*`;
  const data = await fetchJsonWithTimeout(url);
  const pages = Array.isArray(data?.query?.pages) ? data.query.pages : [];
  const withLink = pages.find((page) => Array.isArray(page?.langlinks) && page.langlinks.length);
  return normalizeWikiTitle(withLink?.langlinks?.[0]?.title || "");
}

const translateCache = new Map();

function parseGoogleTranslateText(payload) {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    return "";
  }

  return payload[0]
    .map((entry) => (Array.isArray(entry) ? String(entry[0] || "") : ""))
    .join("")
    .trim();
}

async function translateText(text, sourceLang, targetLang) {
  const value = String(text || "").trim();
  if (!value || sourceLang === targetLang) {
    return value;
  }

  const cacheKey = `${sourceLang}:${targetLang}:${value}`;
  if (translateCache.has(cacheKey)) {
    return translateCache.get(cacheKey);
  }

  const url = `${GOOGLE_TRANSLATE_BASE}?client=gtx&sl=${encodeURIComponent(sourceLang)}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(value)}`;
  try {
    const payload = await fetchJsonWithTimeout(url, 20000);
    const translated = parseGoogleTranslateText(payload) || value;
    translateCache.set(cacheKey, translated);
    return translated;
  } catch {
    translateCache.set(cacheKey, value);
    return value;
  }
}

function buildDetailFromWikitext(wikitext, lang) {
  const titles = SECTION_TITLES[lang] || SECTION_TITLES.en;
  const locations = extractFirstWikiSection(wikitext, titles.locations);
  const unlocks = extractFirstWikiSection(wikitext, titles.unlocks);

  return {
    whereElse: extractOtherSourcesFromLocations(locations),
    unlocks: extractUnlocksSummary(unlocks)
  };
}

async function normalizeSpanishDetail(esDetail, enDetail) {
  const whereElse = Array.isArray(esDetail.whereElse) ? [...esDetail.whereElse] : [];
  let unlocks = String(esDetail.unlocks || "").trim();

  if (!whereElse.length && enDetail.whereElse.length) {
    const translated = await Promise.all(enDetail.whereElse.map((line) => translateText(line, "en", "es")));
    whereElse.push(...translated.filter(Boolean));
  }
  if (!unlocks && enDetail.unlocks) {
    unlocks = await translateText(enDetail.unlocks, "en", "es");
  }

  return {
    whereElse: [...new Set(whereElse.map((line) => String(line || "").trim()).filter(Boolean))],
    unlocks: String(unlocks || "").trim()
  };
}

async function processItem(item) {
  const wikiUrl = normalizeWikiUrl(item.url);
  const key = minervaDetailKeyFromUrl(wikiUrl);
  const sourceTitle = wikiPageTitleFromUrl(wikiUrl);
  if (!sourceTitle) {
    return {
      key,
      value: {
        name: item.name,
        wikiUrlEn: wikiUrl,
        wikiUrlEs: "",
        imageUrl: DEFAULT_LOCAL_IMAGE,
        en: {
          whereElse: [],
          unlocks: ""
        },
        es: {
          whereElse: [],
          unlocks: ""
        }
      }
    };
  }

  let enWikitext = "";
  try {
    enWikitext = await fetchWikitext(WIKI_API_EN, sourceTitle);
  } catch {
    enWikitext = "";
  }
  const enDetail = buildDetailFromWikitext(enWikitext, "en");

  let esTitle = "";
  try {
    esTitle = await resolveSpanishTitle(sourceTitle);
  } catch {
    esTitle = "";
  }

  let esWikitext = "";
  if (esTitle) {
    try {
      esWikitext = await fetchWikitext(WIKI_API_ES, esTitle);
    } catch {
      esWikitext = "";
    }
  }

  const esRaw = buildDetailFromWikitext(esWikitext, "es");
  const esDetail = await normalizeSpanishDetail(esRaw, enDetail);

  return {
    key,
    value: {
      name: item.name,
      wikiUrlEn: buildWikiPageUrl(sourceTitle, "en") || wikiUrl,
      wikiUrlEs: buildWikiPageUrl(esTitle || sourceTitle, esTitle ? "es" : "en"),
      imageUrl: DEFAULT_LOCAL_IMAGE,
      en: {
        whereElse: enDetail.whereElse,
        unlocks: enDetail.unlocks
      },
      es: {
        whereElse: esDetail.whereElse,
        unlocks: esDetail.unlocks
      }
    }
  };
}

async function runWithConcurrency(items, limit, worker) {
  const queue = [...items];
  const workers = [];
  const results = [];

  for (let index = 0; index < limit; index += 1) {
    workers.push(
      (async () => {
        while (queue.length) {
          const next = queue.shift();
          if (!next) {
            return;
          }
          const result = await worker(next);
          results.push(result);
        }
      })()
    );
  }

  await Promise.all(workers);
  return results;
}

async function main() {
  const listJson = await readFile(LISTS_PATH, "utf8");
  const lists = JSON.parse(String(listJson).replace(/^\uFEFF/, ""));

  const uniqueItems = new Map();
  for (const list of Array.isArray(lists) ? lists : []) {
    const inventory = Array.isArray(list?.Inventory) ? list.Inventory : [];
    for (const entry of inventory) {
      if (!entry?.WikiUrl) {
        continue;
      }
      const wikiUrl = normalizeWikiUrl(entry.WikiUrl);
      if (!wikiUrl) {
        continue;
      }
      const key = wikiUrl.toLowerCase();
      if (!uniqueItems.has(key)) {
        uniqueItems.set(key, {
          name: String(entry.Name || "").trim() || "Unknown plan",
          url: wikiUrl
        });
      }
    }
  }

  const itemArray = [...uniqueItems.values()];
  let completed = 0;
  const processed = await runWithConcurrency(itemArray, CONCURRENCY, async (item) => {
    const result = await processItem(item);
    completed += 1;
    if (completed % 10 === 0 || completed === itemArray.length) {
      console.log(`Processed ${completed}/${itemArray.length}`);
    }
    return result;
  });

  const byKey = {};
  for (const result of processed.sort((a, b) => a.key.localeCompare(b.key))) {
    byKey[result.key] = result.value;
  }

  const payload = {
    generatedAtUtc: new Date().toISOString(),
    source: "fallout.fandom.com + translate.googleapis.com",
    defaultImageUrl: DEFAULT_LOCAL_IMAGE,
    itemCount: Object.keys(byKey).length,
    byKey
  };

  const payloadJson = `${JSON.stringify(payload, null, 2)}\n`;
  await writeFile(OUTPUT_PATH, payloadJson, "utf8");
  await writeFile(OUTPUT_JS_PATH, `window.MINERVA_DETAIL_FALLBACK = ${payloadJson};`, "utf8");
  console.log(`Saved ${OUTPUT_PATH}`);
  console.log(`Saved ${OUTPUT_JS_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
