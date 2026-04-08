import { constants as fsConstants } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

const ROOT = process.cwd();
const LISTS_PATH = resolve(ROOT, "data", "minerva-lists.json");
const OUTPUT_PATH = resolve(ROOT, "data", "minerva-detail-fallback.json");
const OUTPUT_JS_PATH = resolve(ROOT, "data", "minerva-detail-fallback.js");
const DETAIL_IMAGE_DIR = resolve(ROOT, "assets", "images", "minerva-detail");

const WIKI_BASE = "https://fallout.fandom.com";
const WIKI_API_EN = `${WIKI_BASE}/api.php`;
const WIKI_API_ES = `${WIKI_BASE}/es/api.php`;
const GOOGLE_TRANSLATE_BASE = "https://translate.googleapis.com/translate_a/single";
const DEFAULT_LOCAL_IMAGE = "assets/images/minerva-plan-fallback.png";
const LOCAL_DETAIL_IMAGE_BASE = "assets/images/minerva-detail";
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

const IMAGE_FIELD_CANDIDATES = ["image", "icon"];
const TITLE_TOKEN_STOP_WORDS = new Set([
  "the",
  "fallout",
  "plan",
  "item",
  "for",
  "and",
  "with"
]);

const WHERE_IS_MINERVA_GENERIC_PLAN_IMAGE_NAMES = new Set([
  "plan_general",
  "plan_general_mod",
  "plan_general_workshop"
]);

const CANONICAL_GENERIC_PLAN_FILES = {
  plan_general: "FO76 Plan equipment.png",
  plan_general_mod: "FO76 Item mod.png",
  plan_general_workshop: "FO76 Plan CAMP.png"
};

const IRRELEVANT_UNLOCK_LINK_PATTERNS = [
  /^(?:CAMP|C\.A\.M\.P\.)$/i,
  /^Workshop \(Fallout 76\)$/i,
  /workbench/i,
  /^Form ID$/i,
  /^Editor ID$/i,
  /^Purveyor Murmrgh$/i,
  /^Fallout 76 legendary effects$/i,
  /^Fallout 76 events$/i,
  /^Fallout 76 weapon mods$/i,
  /^Weapons?$/i,
  /^Armor$/i,
  /^Mod$/i
];

const GENERIC_IMAGE_FILE_PATTERNS = [
  /(?:^|[_\s-])icon(?:$|[_\s-])/i,
  /(?:^|[_\s-])caps(?:$|[_\s-])/i,
  /gold/i,
  /weight/i,
  /notrade/i,
  /ratio/i,
  /overlay/i,
  /(?:^|[_\s-])ui(?:$|[_\s-])/i,
  /iconwheel/i,
  /vault[_\s-]*boy/i,
  /item[_\s-]*mod/i,
  /mbox/i,
  /gametitle/i,
  /stub/i,
  /unused/i
];

const LOW_VALUE_IMAGE_FILE_PATTERNS = [
  /paint/i,
  /skin/i,
  /atx/i,
  /score/i
];

function isLikelyPlanImage(fileName) {
  if (!fileName) {
    return false;
  }
  return /plan/i.test(fileName) && !/(icon|caps|gold|weight|notrade|wiki\.png)/i.test(fileName);
}

function parseInfoboxImageFile(wikitext, images = []) {
  const imageField = String(wikitext || "").match(/^\|\s*image\s*=\s*(.+)$/im)?.[1] || "";
  const extracted = imageField
    .replace(/\[\[(?:File|Image):([^|\]]+)(?:\|[^\]]*)?\]\]/i, "$1")
    .replace(/_/g, " ")
    .trim();
  if (extracted) {
    return extracted;
  }

  const candidates = Array.isArray(images) ? images : [];
  return candidates.find(isLikelyPlanImage) || candidates[0] || "";
}

function extractInfoboxFieldFile(wikitext, fieldName) {
  const field = String(fieldName || "").trim();
  if (!field) {
    return "";
  }

  const value = String(wikitext || "").match(new RegExp(`^\\|\\s*${escapeRegExp(field)}\\s*=\\s*(.+)$`, "im"))?.[1] || "";
  return value
    .replace(/\[\[(?:File|Image):([^|\]]+)(?:\|[^\]]*)?\]\]/i, "$1")
    .replace(/_/g, " ")
    .trim();
}

function normalizeImageCandidateName(value) {
  return String(value || "")
    .replace(/^file:/i, "")
    .replace(/_/g, " ")
    .trim();
}

function tokenizeWikiTitle(value) {
  return sanitizeLocalImageName(String(value || ""))
    .split("_")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !TITLE_TOKEN_STOP_WORDS.has(token));
}

function isGenericImageFile(fileName) {
  const value = String(fileName || "").trim();
  return GENERIC_IMAGE_FILE_PATTERNS.some((pattern) => pattern.test(value));
}

function isLowValueImageFile(fileName) {
  const value = String(fileName || "").trim();
  return LOW_VALUE_IMAGE_FILE_PATTERNS.some((pattern) => pattern.test(value));
}

function scoreImageFileForPage(fileName, pageTitle = "", { isInfobox = false, order = 0, directUnlockFile = false } = {}) {
  const normalizedFileName = sanitizeLocalImageName(fileName);
  const fileTokens = normalizedFileName.split("_").filter(Boolean);
  const titleTokens = tokenizeWikiTitle(pageTitle);

  let score = directUnlockFile ? 260 : isInfobox ? 90 : 45;
  score -= Math.max(0, order) * 2;

  if (isGenericImageFile(fileName)) {
    score -= 160;
  }
  if (isLowValueImageFile(fileName)) {
    score -= 55;
  }
  if (/plan/i.test(fileName) && !directUnlockFile) {
    score -= 35;
  }
  if (/^fo76|^f76/i.test(normalizedFileName)) {
    score += 12;
  }

  for (const token of titleTokens) {
    if (fileTokens.includes(token)) {
      score += 28;
      continue;
    }
    if (normalizedFileName.includes(token)) {
      score += 16;
    }
  }

  return score;
}

function selectBestImageCandidate(candidates = [], pageTitle = "") {
  const seen = new Set();
  let best = null;

  for (const candidate of Array.isArray(candidates) ? candidates : []) {
    const fileName = normalizeImageCandidateName(candidate?.fileName || "");
    if (!fileName) {
      continue;
    }

    const cacheKey = fileName.toLowerCase();
    if (seen.has(cacheKey)) {
      continue;
    }
    seen.add(cacheKey);

    const score = scoreImageFileForPage(fileName, pageTitle, {
      isInfobox: Boolean(candidate?.isInfobox),
      order: Number(candidate?.order || 0),
      directUnlockFile: Boolean(candidate?.directUnlockFile)
    });

    if (!best || score > best.score) {
      best = {
        fileName,
        score
      };
    }
  }

  return best;
}

function selectBestItemImageFile(pageTitle, wikitext, images = []) {
  const candidates = [];
  let order = 0;

  for (const fieldName of IMAGE_FIELD_CANDIDATES) {
    const fileName = extractInfoboxFieldFile(wikitext, fieldName);
    if (fileName) {
      candidates.push({
        fileName,
        isInfobox: true,
        order
      });
      order += 1;
    }
  }

  for (const fileName of Array.isArray(images) ? images : []) {
    candidates.push({
      fileName,
      isInfobox: false,
      order
    });
    order += 1;
  }

  return selectBestImageCandidate(candidates, pageTitle);
}

function extractUnlockImageFileCandidates(sectionText) {
  const matches = [];
  const pattern = /\[\[(?:File|Image):([^|\]]+)/gi;
  let match;

  while ((match = pattern.exec(String(sectionText || ""))) !== null) {
    const fileName = normalizeImageCandidateName(match[1]);
    if (fileName) {
      matches.push(fileName);
    }
  }

  return [...new Set(matches)];
}

function isRelevantUnlockLinkTarget(target) {
  const value = String(target || "").trim();
  if (!value) {
    return false;
  }

  if (/^(?:File|Image|Category|Template|Help|User):/i.test(value)) {
    return false;
  }

  return !IRRELEVANT_UNLOCK_LINK_PATTERNS.some((pattern) => pattern.test(value));
}

function extractUnlockLinkCandidates(sectionText) {
  const matches = [];
  const pattern = /\[\[([^|\]#]+)(?:#[^|\]]+)?(?:\|[^\]]+)?\]\]/gi;
  let match;

  while ((match = pattern.exec(String(sectionText || ""))) !== null) {
    const title = String(match[1] || "").trim();
    if (!isRelevantUnlockLinkTarget(title)) {
      continue;
    }
    matches.push(normalizeWikiTitle(title));
  }

  return [...new Set(matches)];
}

function deriveUnlockedSubjectTitle(sourceTitle) {
  return normalizeWikiTitle(String(sourceTitle || "").replace(/^Plan:_?/i, ""));
}

function shouldUsePlanStyleArt(imageName) {
  return WHERE_IS_MINERVA_GENERIC_PLAN_IMAGE_NAMES.has(String(imageName || "").trim().toLowerCase());
}

async function resolveCanonicalPlanStyleArt(imageName, fallbackFileName, imageCache) {
  const normalized = String(imageName || "").trim().toLowerCase();
  const canonicalFileName = CANONICAL_GENERIC_PLAN_FILES[normalized] || fallbackFileName || "";
  return resolveLocalDetailImageUrl(canonicalFileName, imageCache, "en");
}

function buildWikiTitleVariants(title) {
  const variants = [];

  const pushVariant = (value) => {
    const normalized = normalizeWikiTitle(value);
    if (!normalized || variants.includes(normalized)) {
      return;
    }
    variants.push(normalized);
  };

  const normalized = normalizeWikiTitle(title);
  pushVariant(normalized);
  pushVariant(normalized.replace(/_\([^)]*\)$/i, ""));

  return variants;
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

async function fileExists(targetPath) {
  try {
    await access(targetPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function sanitizeLocalImageName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function contentTypeToImageExtension(contentType) {
  const normalized = String(contentType || "").trim().toLowerCase();
  if (normalized.includes("image/webp")) {
    return ".webp";
  }
  if (normalized.includes("image/png")) {
    return ".png";
  }
  if (normalized.includes("image/jpeg") || normalized.includes("image/jpg")) {
    return ".jpg";
  }
  if (normalized.includes("image/avif")) {
    return ".avif";
  }
  if (normalized.includes("image/gif")) {
    return ".gif";
  }
  return "";
}

function buildLocalDetailImagePath(fileName, contentType = "") {
  const normalized = String(fileName || "")
    .replace(/^file:/i, "")
    .trim();
  const extension = contentTypeToImageExtension(contentType) || extname(normalized).toLowerCase() || ".png";
  const safeBase = sanitizeLocalImageName(normalized) || "minerva_detail";
  return `${LOCAL_DETAIL_IMAGE_BASE}/${safeBase}${extension}`;
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

async function fetchImageBuffer(url, timeoutMs = REQUEST_TIMEOUT_MS) {
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

    const contentType = String(response.headers.get("content-type") || "").trim().toLowerCase();
    if (!contentType.startsWith("image/")) {
      throw new Error(`Unexpected content type: ${contentType || "unknown"}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length) {
      throw new Error("Received empty image payload.");
    }

    return {
      buffer,
      contentType
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWikiParse(apiBase, title) {
  const page = normalizeWikiTitle(title);
  if (!page) {
    return {
      wikitext: "",
      images: []
    };
  }
  const url = `${apiBase}?action=parse&page=${encodeURIComponent(page)}&prop=wikitext|images&format=json&formatversion=2&origin=*`;
  const data = await fetchJsonWithTimeout(url);
  if (data?.error || !data?.parse?.wikitext) {
    throw new Error(data?.error?.info || "Missing parse payload.");
  }
  return {
    wikitext: String(data.parse.wikitext || ""),
    images: Array.isArray(data?.parse?.images) ? data.parse.images : []
  };
}

async function resolveWikiImageMeta(fileName, lang = "en") {
  const normalized = String(fileName || "")
    .replace(/^file:/i, "")
    .trim();
  if (!normalized) {
    return null;
  }

  const apiBase = lang === "es" ? WIKI_API_ES : WIKI_API_EN;
  const title = `File:${normalized}`;
  const url = `${apiBase}?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|size&format=json&formatversion=2&origin=*`;
  const data = await fetchJsonWithTimeout(url);
  const pages = Array.isArray(data?.query?.pages) ? data.query.pages : [];
  const page = pages.find((entry) => Array.isArray(entry?.imageinfo) && entry.imageinfo.length) || null;
  const imageInfo = page?.imageinfo?.[0] || null;
  const remoteUrl = String(imageInfo?.url || "").trim();
  if (!remoteUrl) {
    return null;
  }

  return {
    fileName: String(page?.title || normalized).replace(/^File:/i, "").trim() || normalized,
    remoteUrl,
    width: Number(imageInfo?.width || 0),
    height: Number(imageInfo?.height || 0)
  };
}

async function resolveLocalDetailImageUrl(fileName, imageCache, lang = "en") {
  const normalized = String(fileName || "")
    .replace(/^file:/i, "")
    .trim();
  if (!normalized) {
    return "";
  }

  const cacheKey = normalized.toLowerCase();
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  const pending = (async () => {
    try {
      const imageMeta = await resolveWikiImageMeta(normalized, lang);
      if (!imageMeta?.remoteUrl) {
        return "";
      }

      const image = await fetchImageBuffer(imageMeta.remoteUrl);
      const localPath = buildLocalDetailImagePath(imageMeta.fileName || normalized, image.contentType);
      const absolutePath = resolve(ROOT, localPath);
      if (await fileExists(absolutePath)) {
        return localPath;
      }

      await writeFile(absolutePath, image.buffer);
      return localPath;
    } catch {
      return "";
    }
  })();

  imageCache.set(cacheKey, pending);
  return pending;
}

async function resolveBestImageForPageTitle(pageTitle, pageImageCache) {
  const normalizedTitle = normalizeWikiTitle(pageTitle);
  if (!normalizedTitle) {
    return null;
  }

  const cacheKey = normalizedTitle.toLowerCase();
  if (pageImageCache.has(cacheKey)) {
    return pageImageCache.get(cacheKey);
  }

  const pending = (async () => {
    try {
      const pageParse = await fetchWikiParse(WIKI_API_EN, normalizedTitle);
      return selectBestItemImageFile(normalizedTitle, pageParse.wikitext, pageParse.images);
    } catch {
      return null;
    }
  })();

  pageImageCache.set(cacheKey, pending);
  return pending;
}

async function resolvePreferredItemImageUrl(sourceTitle, unlocksSection, planImageFile, imageCache, pageImageCache) {
  const planSubjectTitle = deriveUnlockedSubjectTitle(sourceTitle);
  const fileCandidates = extractUnlockImageFileCandidates(unlocksSection);
  const pageCandidates = [];

  for (const rawTitle of extractUnlockLinkCandidates(unlocksSection)) {
    for (const variant of buildWikiTitleVariants(rawTitle)) {
      if (!pageCandidates.includes(variant)) {
        pageCandidates.push(variant);
      }
    }
  }

  if (planSubjectTitle) {
    for (const variant of buildWikiTitleVariants(planSubjectTitle)) {
      if (!pageCandidates.includes(variant)) {
        pageCandidates.push(variant);
      }
    }
  }

  let best = null;

  for (let index = 0; index < fileCandidates.length; index += 1) {
    const fileName = fileCandidates[index];
    const score = scoreImageFileForPage(fileName, planSubjectTitle || sourceTitle, {
      directUnlockFile: true,
      order: index
    });

    if (best && score <= best.score) {
      continue;
    }

    const localUrl = await resolveLocalDetailImageUrl(fileName, imageCache, "en");
    if (!localUrl) {
      continue;
    }

    best = {
      localUrl,
      score
    };
  }

  for (let index = 0; index < pageCandidates.length; index += 1) {
    const pageTitle = pageCandidates[index];
    const bestImage = await resolveBestImageForPageTitle(pageTitle, pageImageCache);
    if (!bestImage?.fileName) {
      continue;
    }

    const score = bestImage.score + 120 - (index * 4);
    if (best && score <= best.score) {
      continue;
    }

    const localUrl = await resolveLocalDetailImageUrl(bestImage.fileName, imageCache, "en");
    if (!localUrl) {
      continue;
    }

    best = {
      localUrl,
      score
    };
  }

  if (best?.localUrl) {
    return best.localUrl;
  }

  if (planImageFile) {
    return resolveLocalDetailImageUrl(planImageFile, imageCache, "en");
  }

  return "";
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

async function processItem(item, imageCache = new Map(), pageImageCache = new Map()) {
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

  let enParse = {
    wikitext: "",
    images: []
  };
  try {
    enParse = await fetchWikiParse(WIKI_API_EN, sourceTitle);
  } catch {
    enParse = {
      wikitext: "",
      images: []
    };
  }
  const enDetail = buildDetailFromWikitext(enParse.wikitext, "en");
  const unlocksSection = extractFirstWikiSection(enParse.wikitext, SECTION_TITLES.en.unlocks);
  const planImageFile = parseInfoboxImageFile(enParse.wikitext, enParse.images);
  const prefersPlanStyleArt = shouldUsePlanStyleArt(item.imageName);
  const preferredLocalImageUrl = prefersPlanStyleArt
    ? (await resolveCanonicalPlanStyleArt(item.imageName, planImageFile, imageCache))
    : (await resolvePreferredItemImageUrl(
      sourceTitle,
      unlocksSection,
      planImageFile,
      imageCache,
      pageImageCache
    ));

  let esTitle = "";
  try {
    esTitle = await resolveSpanishTitle(sourceTitle);
  } catch {
    esTitle = "";
  }

  let esWikitext = "";
  if (esTitle) {
    try {
      const esParse = await fetchWikiParse(WIKI_API_ES, esTitle);
      esWikitext = esParse.wikitext;
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
      imageUrl: preferredLocalImageUrl || DEFAULT_LOCAL_IMAGE,
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
  await mkdir(DETAIL_IMAGE_DIR, { recursive: true });

  const listJson = await readFile(LISTS_PATH, "utf8");
  const lists = JSON.parse(String(listJson).replace(/^\uFEFF/, ""));
  const imageCache = new Map();
  const pageImageCache = new Map();

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
          url: wikiUrl,
          imageName: String(entry.ImageName || "").trim()
        });
      }
    }
  }

  const itemArray = [...uniqueItems.values()];
  let completed = 0;
  const processed = await runWithConcurrency(itemArray, CONCURRENCY, async (item) => {
    const result = await processItem(item, imageCache, pageImageCache);
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
    source: "fallout.fandom.com + translate.googleapis.com + local hi-res detail images",
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
