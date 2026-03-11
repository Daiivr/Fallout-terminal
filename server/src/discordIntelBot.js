"use strict";

const fs = require("fs");
const path = require("path");
const {
  ActionRowBuilder,
  ActivityType,
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
  StringSelectMenuBuilder
} = require("discord.js");

const { fetchCurrentIntel, parseBethesdaRawDateTime } = require("./intel");

const FEED_CHOICES = Object.freeze({
  both: ["silos", "minerva"],
  silos: ["silos"],
  minerva: ["minerva"]
});
const INTEL_STATE_FILE = "discord-intel-state.json";
const INTEL_SUBSCRIPTIONS_FILE = "discord-intel-subscriptions.json";
const INTEL_SETTINGS_FILE = "discord-intel-settings.json";
const DEFAULT_POLL_INTERVAL_MS = 5 * 60 * 1000;
const DEFAULT_STATUS_ROTATION_MS = 60 * 1000;
const DEFAULT_GOLD_BULLION_EMOJI = "<:Gold:1480101994520645703>";
const WIKI_BASE = "https://fallout.fandom.com";
const MINERVA_LISTS_FILE = "data/minerva-lists.json";
const MINERVA_DETAIL_FALLBACK_FILE = "data/minerva-detail-fallback.json";
const MINERVA_DETAIL_FALLBACK_IMAGE = "assets/images/minerva-plan-fallback.png";
const MINERVA_ITEM_SELECT_PREFIX = "minerva-item-select";
const WELCOME_LANGUAGE_SELECT_ID = "welcome-language-select";
const LANGUAGE_OPTIONS = new Set(["en", "es"]);
const STATUS_ROTATION_ACTIVITIES = Object.freeze([
  Object.freeze({
    type: ActivityType.Playing,
    name: "Fallout 76",
    label: "Playing Fallout 76"
  }),
  Object.freeze({
    type: ActivityType.Watching,
    name: "Silo Codes",
    label: "Watching Silo Codes"
  }),
  Object.freeze({
    type: ActivityType.Watching,
    name: "Minerva Sales",
    label: "Watching Minerva Sales"
  }),
  Object.freeze({
    type: ActivityType.Listening,
    name: "Appalachia Radio",
    label: "Listening to Appalachia Radio"
  })
]);
let cachedMinervaListsSiteRoot = "";
let cachedMinervaLists = null;
let cachedMinervaDetailFallbackSiteRoot = "";
let cachedMinervaDetailFallback = null;
const STRINGS = Object.freeze({
  en: {
    feed_both: "Both",
    feed_silos: "Silo Codes",
    feed_minerva: "Minerva",
    cmd_subscribed: "Subscribed <#{channelId}> to `{feeds}` intel updates.",
    cmd_unsubscribed: "Removed <#{channelId}> from Fallout Codex intel updates.",
    cmd_no_subscriptions: "No subscribed channels are registered for this server yet. Use `/intel-subscribe` first.",
    cmd_subscriptions_title: "Current Fallout Codex subscriptions:",
    cmd_status_language: "Language: `{language}`",
    cmd_preview_unavailable: "Unable to build a preview embed right now.",
    cmd_failed: "Command failed. Check bot logs and verify the upstream intel sources are reachable.",
    cmd_language_set: "Bot language set to `{language}` for this server.",
    cmd_language_invalid_scope: "This command only works inside a Discord server.",
    welcome_language_admin_only: "You need `Manage Server` to change the bot language for this server.",
    language_name_en: "English",
    language_name_es: "Spanish",
    welcome_author: "Fallout Codex | Server Relay",
    welcome_title: "Fallout Codex Is Online",
    welcome_description: "The relay is now active in **{server}**. Fallout Codex can broadcast silo code rotations, Minerva status updates, and interactive sale intel straight to your Discord server.",
    welcome_overview_label: "What The Bot Does",
    welcome_overview_value: "• Tracks Appalachian silo codes\n• Posts Minerva transit, arrival, and departure updates\n• Lets users inspect Minerva sale items from arrival embeds",
    welcome_setup_label: "Getting Started",
    welcome_setup_value: "Use `/intel-subscribe` to choose a channel and the feed you want.\nUse `/intel-preview` to test the embeds before going live.",
    welcome_commands_label: "Core Commands",
    welcome_commands_value: "`/intel-subscribe`\n`/intel-status`\n`/intel-preview`\n`/intel-language`",
    welcome_links_label: "Intel Links",
    welcome_links_site: "Website",
    welcome_links_silos: "Silos",
    welcome_links_minerva: "Minerva",
    welcome_links_privacy: "Privacy",
    welcome_links_terms: "Terms",
    welcome_language_field_label: "Bot Language",
    welcome_language_field_value: "Current server language: **{language}**",
    welcome_language_placeholder: "Select bot language ({language})",
    welcome_footer: "Server admins can change the bot language below.",
    label_absolute: "Absolute",
    label_relative: "Relative",
    label_unknown: "Unknown",
    label_last_broadcast: "Last broadcast",
    source_label: "Intel Source",
    source_nukacrypt: "NukaCrypt",
    source_minerva_api: "WhereIsMinerva API",
    source_whereisminerva: "WhereIsMinerva",
    source_fallback: "Static rotation fallback",
    silo_author: "Fallout Codex | Nuclear Command",
    silo_title: "Silo Codes Updated",
    silo_description_live: "Fresh launch authorization has been intercepted from the Appalachian silo network.",
    silo_description_expired: "Launch authorization has rolled over. Upstream marks the current codes as expired while the new set propagates.",
    silo_site_alpha: "Site Alpha",
    silo_site_bravo: "Site Bravo",
    silo_site_charlie: "Site Charlie",
    silo_reset_window: "Reset Window",
    silo_status: "Operational Status",
    silo_status_live: "Codes valid",
    silo_status_expired: "Awaiting fresh codes",
    silo_site_name: "Fallout Codex",
    silo_open_terminal: "Open Terminal",
    silo_footer: "Fallout Codex | Appalachian Silo Monitor",
    minerva_author: "Fallout Codex | Minerva Intel",
    minerva_title_arrived: "Minerva Has Arrived",
    minerva_title_transit: "Minerva In Transit",
    minerva_title_departed: "Minerva Has Left Appalachia",
    minerva_description_arrived: "Minerva has arrived at **{location}**. Her sale inventory is live now.",
    minerva_description_transit: "Minerva is in transit. Next confirmed stop: **{location}**.",
    minerva_description_departed: "Minerva has left Appalachia to restock. She returns {returns} with **{list}** at **{location}**.",
    minerva_route_intel: "Route Intel",
    minerva_sale_intel: "Sale Intel",
    minerva_return_window: "Return Window",
    minerva_status: "Status",
    minerva_status_active: "Merchant active",
    minerva_status_transit: "In transit",
    minerva_status_restocking: "Restocking",
    minerva_location: "Location",
    minerva_list: "List Rotation",
    minerva_list_value: "List {number}",
    minerva_arrives: "Arrives",
    minerva_leaves: "Leaves",
    minerva_returns: "Returns",
    minerva_next_change: "Next Change",
    minerva_inventory_stats: "Inventory Stats",
    minerva_item_count: "Items",
    minerva_total_bullion: "Total Bullion",
    minerva_highest_price: "Highest Price",
    minerva_lowest_price: "Lowest Price",
    minerva_inventory: "Inventory",
    minerva_inventory_part: "Inventory {index}",
    minerva_open_terminal: "Open Terminal",
    minerva_footer: "Fallout Codex | Wasteland Broadcast",
    minerva_select_placeholder: "Inspect item {start}-{end}",
    minerva_select_option_desc: "{amount} bullion",
    minerva_detail_open_source: "Open Source Page",
    minerva_detail_where_label: "Where Else To Get It",
    minerva_detail_unlocks_label: "What This Plan Unlocks",
    minerva_detail_no_other_sources: "No additional source found besides Minerva.",
    minerva_detail_no_unlocks: "Unlock information is unavailable.",
    minerva_detail_error: "Unable to load plan details right now.",
    minerva_detail_price: "Price",
    minerva_detail_sale_list: "Sale List"
  },
  es: {
    feed_both: "Ambos",
    feed_silos: "Codigos de silo",
    feed_minerva: "Minerva",
    cmd_subscribed: "Canal <#{channelId}> suscrito a las alertas de `{feeds}`.",
    cmd_unsubscribed: "Se elimino <#{channelId}> de las alertas de Fallout Codex.",
    cmd_no_subscriptions: "Todavia no hay canales suscritos en este servidor. Usa `/intel-subscribe` primero.",
    cmd_subscriptions_title: "Suscripciones actuales de Fallout Codex:",
    cmd_status_language: "Idioma: `{language}`",
    cmd_preview_unavailable: "No se pudo generar la vista previa del embed en este momento.",
    cmd_failed: "El comando fallo. Revisa los logs del bot y verifica que las fuentes esten disponibles.",
    cmd_language_set: "El idioma del bot ahora es `{language}` para este servidor.",
    cmd_language_invalid_scope: "Este comando solo funciona dentro de un servidor de Discord.",
    welcome_language_admin_only: "Necesitas `Administrar servidor` para cambiar el idioma del bot en este servidor.",
    language_name_en: "Ingles",
    language_name_es: "Espanol",
    welcome_author: "Fallout Codex | Relay de Servidor",
    welcome_title: "Fallout Codex Ya Esta En Linea",
    welcome_description: "El relay ya esta activo en **{server}**. Fallout Codex puede emitir rotaciones de codigos de silo, actualizaciones del estado de Minerva e intel interactivo de ventas directo a tu servidor de Discord.",
    welcome_overview_label: "Que Hace El Bot",
    welcome_overview_value: "• Rastrea los codigos de los silos de Appalachia\n• Publica actualizaciones de Minerva en transito, llegada y salida\n• Permite inspeccionar items de venta de Minerva desde los embeds de llegada",
    welcome_setup_label: "Primeros Pasos",
    welcome_setup_value: "Usa `/intel-subscribe` para elegir un canal y el feed que quieres.\nUsa `/intel-preview` para probar los embeds antes de activarlos.",
    welcome_commands_label: "Comandos Principales",
    welcome_commands_value: "`/intel-subscribe`\n`/intel-status`\n`/intel-preview`\n`/intel-language`",
    welcome_links_label: "Enlaces De Intel",
    welcome_links_site: "Sitio",
    welcome_links_silos: "Silos",
    welcome_links_minerva: "Minerva",
    welcome_links_privacy: "Privacidad",
    welcome_links_terms: "Terminos",
    welcome_language_field_label: "Idioma Del Bot",
    welcome_language_field_value: "Idioma actual del servidor: **{language}**",
    welcome_language_placeholder: "Elegir idioma del bot ({language})",
    welcome_footer: "Los administradores del servidor pueden cambiar el idioma abajo.",
    label_absolute: "Absoluto",
    label_relative: "Relativo",
    label_unknown: "Desconocido",
    label_last_broadcast: "Ultima transmision",
    source_label: "Fuente",
    source_nukacrypt: "NukaCrypt",
    source_minerva_api: "API de WhereIsMinerva",
    source_whereisminerva: "WhereIsMinerva",
    source_fallback: "Rotacion estatica de respaldo",
    silo_author: "Fallout Codex | Comando Nuclear",
    silo_title: "Codigos de Silo Actualizados",
    silo_description_live: "Se intercepto una nueva autorizacion de lanzamiento desde la red de silos de Appalachia.",
    silo_description_expired: "La autorizacion de lanzamiento se reinicio. La fuente marca los codigos actuales como expirados mientras llega el nuevo set.",
    silo_site_alpha: "Sitio Alpha",
    silo_site_bravo: "Sitio Bravo",
    silo_site_charlie: "Sitio Charlie",
    silo_reset_window: "Ventana de Reinicio",
    silo_status: "Estado Operativo",
    silo_status_live: "Codigos validos",
    silo_status_expired: "Esperando codigos nuevos",
    silo_site_name: "Fallout Codex",
    silo_open_terminal: "Abrir terminal",
    silo_footer: "Fallout Codex | Monitor de Silos de Appalachia",
    minerva_author: "Fallout Codex | Intel de Minerva",
    minerva_title_arrived: "Minerva Ha Llegado",
    minerva_title_transit: "Minerva En Transito",
    minerva_title_departed: "Minerva Ha Dejado Appalachia",
    minerva_description_arrived: "Minerva ha llegado a **{location}**. Su inventario de venta ya esta disponible.",
    minerva_description_transit: "Minerva esta en transito. La siguiente parada confirmada es **{location}**.",
    minerva_description_departed: "Minerva dejo Appalachia para reabastecerse. Regresa {returns} con **{list}** en **{location}**.",
    minerva_route_intel: "Intel de Ruta",
    minerva_sale_intel: "Intel de Venta",
    minerva_return_window: "Ventana de Regreso",
    minerva_status: "Estado",
    minerva_status_active: "Mercader activa",
    minerva_status_transit: "En transito",
    minerva_status_restocking: "Reabasteciendo",
    minerva_location: "Ubicacion",
    minerva_list: "Rotacion de Lista",
    minerva_list_value: "Lista {number}",
    minerva_arrives: "Llega",
    minerva_leaves: "Se va",
    minerva_returns: "Regresa",
    minerva_next_change: "Proximo Cambio",
    minerva_inventory_stats: "Resumen de Inventario",
    minerva_item_count: "Objetos",
    minerva_total_bullion: "Lingotes Totales",
    minerva_highest_price: "Precio Mas Alto",
    minerva_lowest_price: "Precio Mas Bajo",
    minerva_inventory: "Inventario",
    minerva_inventory_part: "Inventario {index}",
    minerva_open_terminal: "Abrir terminal",
    minerva_footer: "Fallout Codex | Transmision del Yermo",
    minerva_select_placeholder: "Inspeccionar item {start}-{end}",
    minerva_select_option_desc: "{amount} lingotes",
    minerva_detail_open_source: "Abrir Fuente",
    minerva_detail_where_label: "Donde Conseguirlo Ademas",
    minerva_detail_unlocks_label: "Que Desbloquea Este Plano",
    minerva_detail_no_other_sources: "No hay otra fuente ademas de Minerva.",
    minerva_detail_no_unlocks: "No hay informacion de desbloqueo disponible.",
    minerva_detail_error: "No se pudieron cargar los detalles del plano.",
    minerva_detail_price: "Precio",
    minerva_detail_sale_list: "Lista de Venta"
  }
});

function parseBoolean(value, fallback = false) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseDurationMs(value, fallback) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }

  const match = normalized.match(/^(\d+)\s*(ms|milliseconds?|s|sec(?:ond)?s?|m|min(?:ute)?s?|h|hr|hours?)?$/i);
  if (!match) {
    return fallback;
  }

  const amount = Number.parseInt(match[1], 10);
  if (!Number.isFinite(amount) || amount <= 0) {
    return fallback;
  }

  const unit = String(match[2] || "ms").toLowerCase();
  if (unit === "ms" || unit.startsWith("millisecond")) {
    return amount;
  }
  if (unit === "s" || unit.startsWith("sec")) {
    return amount * 1000;
  }
  if (unit === "m" || unit.startsWith("min")) {
    return amount * 60 * 1000;
  }
  if (unit === "h" || unit === "hr" || unit.startsWith("hour")) {
    return amount * 60 * 60 * 1000;
  }

  return fallback;
}

function normalizeLanguage(value, fallback = "en") {
  const normalized = String(value || "").trim().toLowerCase();
  return LANGUAGE_OPTIONS.has(normalized) ? normalized : fallback;
}

function languageFromLocale(value, fallback = "en") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized.startsWith("es")) {
    return "es";
  }
  if (normalized.startsWith("en")) {
    return "en";
  }
  return fallback;
}

function t(lang, key, vars = {}) {
  const dictionary = STRINGS[normalizeLanguage(lang)] || STRINGS.en;
  const template = dictionary[key] || STRINGS.en[key] || key;
  return String(template).replace(/\{(\w+)\}/g, (_match, token) => {
    return Object.prototype.hasOwnProperty.call(vars, token) ? String(vars[token]) : `{${token}}`;
  });
}

function sanitizePublicBaseUrl(raw) {
  const normalized = String(raw || "").trim().replace(/\/+$/, "");
  if (!normalized) {
    return "";
  }
  return /^https?:\/\//i.test(normalized) ? normalized : "";
}

function discoverPublicBaseUrl(siteRoot) {
  const indexPath = path.join(siteRoot, "index.html");
  if (!fs.existsSync(indexPath)) {
    return "";
  }

  try {
    const html = fs.readFileSync(indexPath, "utf8");
    const canonicalMatch = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    const ogUrlMatch = html.match(/<meta\s+[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i);
    return sanitizePublicBaseUrl(canonicalMatch?.[1] || ogUrlMatch?.[1] || "");
  } catch (_error) {
    return "";
  }
}

function chunkLines(lines = [], maxLength = 950) {
  const groups = [];
  let current = [];
  let currentLength = 0;

  for (const line of lines) {
    const safeLine = String(line || "").trim();
    if (!safeLine) {
      continue;
    }

    const extraLength = safeLine.length + (current.length ? 1 : 0);
    if (current.length && currentLength + extraLength > maxLength) {
      groups.push(current);
      current = [safeLine];
      currentLength = safeLine.length;
      continue;
    }

    current.push(safeLine);
    currentLength += extraLength;
  }

  if (current.length) {
    groups.push(current);
  }

  return groups;
}

function formatDiscordDate(date, style = "F") {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "`--`";
  }
  const unix = Math.floor(date.getTime() / 1000);
  return `<t:${unix}:${style}>`;
}

function formatCode(code) {
  const digits = String(code || "").replace(/\D/g, "");
  const match = digits.match(/^(\d{3})(\d{2})(\d{3})$/);
  return match ? `${match[1]} ${match[2]} ${match[3]}` : "--- -- ---";
}

function sumBullion(items = []) {
  return items.reduce((total, item) => {
    const price = Number(item?.price);
    return total + (Number.isFinite(price) ? price : 0);
  }, 0);
}

function buildWebsiteUrl(baseUrl, hash = "") {
  if (!baseUrl) {
    return "";
  }
  return `${baseUrl}/${String(hash || "").replace(/^\/+/, "").replace(/^#?/, "#")}`.replace(/\/#/, "/#");
}

function buildPageUrl(baseUrl, pagePath = "/") {
  if (!baseUrl) {
    return "";
  }

  const normalizedPath = String(pagePath || "/").trim();
  if (!normalizedPath || normalizedPath === "/") {
    return `${baseUrl}/`;
  }

  return `${baseUrl}/${normalizedPath.replace(/^\/+/, "")}`;
}

function buildAssetUrl(baseUrl, assetPath) {
  if (!baseUrl || !assetPath) {
    return "";
  }
  return `${baseUrl}/${String(assetPath).replace(/^\/+/, "")}`;
}

function normalizeEmbedImageUrl(baseUrl, url) {
  const value = String(url || "").trim();
  if (!value) {
    return "";
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return buildAssetUrl(baseUrl, value);
}

function localeForLanguage(lang) {
  return normalizeLanguage(lang) === "es" ? "es-ES" : "en-US";
}

function formatNumber(value, lang) {
  return Number(value || 0).toLocaleString(localeForLanguage(lang));
}

function formatSourceInfo(source, lang) {
  const raw = String(source || "").trim();
  if (!raw) {
    return {
      label: t(lang, "label_unknown"),
      url: ""
    };
  }

  if (/nukacrypt/i.test(raw)) {
    return { label: t(lang, "source_nukacrypt"), url: raw };
  }
  if (/controller\.php/i.test(raw) || /minerva-info-api/i.test(raw)) {
    return { label: t(lang, "source_minerva_api"), url: "https://whereisminerva.info/" };
  }
  if (/whereisminerva/i.test(raw)) {
    return { label: t(lang, "source_whereisminerva"), url: "https://www.whereisminerva.com/" };
  }
  if (/fallback/i.test(raw)) {
    return { label: t(lang, "source_fallback"), url: "" };
  }

  return {
    label: raw,
    url: /^https?:\/\//i.test(raw) ? raw : ""
  };
}

function normalizeMinervaItemName(name) {
  return String(name || "").replace(/^Plan:\s*/i, "").trim() || "--";
}

function truncateForDiscord(value, maxLength = 100) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}\u2026`;
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

function buildWikiPageUrl(title, lang = "en") {
  const normalizedTitle = String(title || "").trim().replace(/\s+/g, "_");
  if (!normalizedTitle) {
    return "";
  }
  const basePath = lang === "es" ? `${WIKI_BASE}/es/wiki/` : `${WIKI_BASE}/wiki/`;
  return `${basePath}${encodeURIComponent(normalizedTitle)}`;
}

function wikiPageTitleFromUrl(url) {
  try {
    const parsed = new URL(normalizeWikiUrl(url));
    const page = decodeURIComponent(parsed.pathname || "").replace(/^\/(?:es\/)?wiki\//i, "").trim();
    return page.replace(/\s+/g, "_");
  } catch (_error) {
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

function minervaDetailKeyCandidatesFromUrl(url) {
  const normalizedUrl = normalizeWikiUrl(url);
  if (!normalizedUrl) {
    return [];
  }

  const keys = new Set();
  keys.add(minervaDetailKeyFromUrl(normalizedUrl));
  keys.add(normalizedUrl.toLowerCase());

  try {
    const parsed = new URL(normalizedUrl);
    const canonicalPath = String(parsed.pathname || "").replace(/^\/es\/wiki\//i, "/wiki/");
    if (canonicalPath) {
      keys.add(`${WIKI_BASE}${canonicalPath}`.toLowerCase());
      const decodedTitle = decodeURIComponent(canonicalPath).replace(/^\/wiki\//i, "").trim().replace(/\s+/g, "_");
      if (decodedTitle) {
        keys.add(`${WIKI_BASE}/wiki/${decodedTitle}`.toLowerCase());
        keys.add(`${WIKI_BASE}/wiki/${encodeURIComponent(decodedTitle)}`.toLowerCase());
      }
    }
  } catch (_error) {
    // Ignore malformed URLs and keep collected candidates.
  }

  return [...keys].filter(Boolean);
}

function sanitizeDetailText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function loadMinervaLists(siteRoot) {
  const normalizedSiteRoot = path.resolve(String(siteRoot || ""));
  if (cachedMinervaLists && cachedMinervaListsSiteRoot === normalizedSiteRoot) {
    return cachedMinervaLists;
  }

  try {
    const filePath = path.join(normalizedSiteRoot, MINERVA_LISTS_FILE);
    const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    const parsed = JSON.parse(raw);
    cachedMinervaLists = Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    cachedMinervaLists = [];
  }

  cachedMinervaListsSiteRoot = normalizedSiteRoot;
  return cachedMinervaLists;
}

function mapArchiveMinervaItem(entry, listNumber) {
  return {
    name: String(entry?.Name || "").trim() || "--",
    price: Number.isFinite(Number(entry?.Price)) ? Number(entry.Price) : null,
    url: normalizeWikiUrl(entry?.WikiUrl || ""),
    listNumber: Number.isFinite(Number(listNumber)) ? Number(listNumber) : null
  };
}

function resolveMinervaArchiveItems(siteRoot, data) {
  const listNumber = Number(data?.listNumber);
  const lists = loadMinervaLists(siteRoot);

  if (Number.isFinite(listNumber) && listNumber > 0) {
    const match = lists.find((entry) => Number(entry?.ListNumber) === listNumber);
    const inventory = Array.isArray(match?.Inventory) ? match.Inventory : [];
    if (inventory.length) {
      return inventory.map((entry) => mapArchiveMinervaItem(entry, listNumber));
    }
  }

  return Array.isArray(data?.items)
    ? data.items.map((item) => ({
      name: String(item?.name || item?.Name || "").trim() || "--",
      price: Number.isFinite(Number(item?.price)) ? Number(item.price) : null,
      url: normalizeWikiUrl(item?.url || item?.WikiUrl || ""),
      listNumber: Number.isFinite(listNumber) ? listNumber : null
    }))
    : [];
}

function loadMinervaDetailFallback(siteRoot) {
  const normalizedSiteRoot = path.resolve(String(siteRoot || ""));
  if (cachedMinervaDetailFallback && cachedMinervaDetailFallbackSiteRoot === normalizedSiteRoot) {
    return cachedMinervaDetailFallback;
  }

  try {
    const filePath = path.join(normalizedSiteRoot, MINERVA_DETAIL_FALLBACK_FILE);
    const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    const parsed = JSON.parse(raw);
    cachedMinervaDetailFallback = {
      byKey: parsed && typeof parsed.byKey === "object" && parsed.byKey ? parsed.byKey : {},
      defaultImageUrl: String(parsed?.defaultImageUrl || MINERVA_DETAIL_FALLBACK_IMAGE).trim() || MINERVA_DETAIL_FALLBACK_IMAGE
    };
  } catch (_error) {
    cachedMinervaDetailFallback = {
      byKey: {},
      defaultImageUrl: MINERVA_DETAIL_FALLBACK_IMAGE
    };
  }

  cachedMinervaDetailFallbackSiteRoot = normalizedSiteRoot;
  return cachedMinervaDetailFallback;
}

function resolveMinervaDetailFallback(siteRoot, item, lang) {
  const fallback = loadMinervaDetailFallback(siteRoot);
  const normalizedUrl = normalizeWikiUrl(item?.url || item?.WikiUrl || item?.wikiUrl || "");
  const entry = minervaDetailKeyCandidatesFromUrl(normalizedUrl)
    .map((key) => fallback.byKey[key])
    .find((candidate) => candidate && typeof candidate === "object");
  const langKey = normalizeLanguage(lang) === "es" ? "es" : "en";

  if (!entry) {
    return {
      wikiUrl: normalizedUrl,
      imageUrl: fallback.defaultImageUrl,
      whereElse: [],
      unlocks: ""
    };
  }

  const localized = entry[langKey] || entry.en || entry.es || {};
  const preferredWikiUrl = langKey === "es"
    ? (entry.wikiUrlEs || entry.wikiUrlEn || normalizedUrl)
    : (entry.wikiUrlEn || entry.wikiUrlEs || normalizedUrl);

  return {
    wikiUrl: normalizeWikiUrl(preferredWikiUrl || normalizedUrl),
    imageUrl: fallback.defaultImageUrl,
    whereElse: Array.isArray(localized.whereElse)
      ? localized.whereElse.map((line) => sanitizeDetailText(line)).filter(Boolean)
      : [],
    unlocks: sanitizeDetailText(localized.unlocks || "")
  };
}

function parseStoredFingerprint(fingerprint) {
  const raw = String(fingerprint || "").trim();
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_error) {
    return null;
  }
}

function asDate(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function resolveMinervaArrivesAt(data) {
  const eventStart = asDate(data?.eventStart);
  if (eventStart) {
    return eventStart;
  }

  if (!data?.active && data?.nextChange) {
    return parseBethesdaRawDateTime(data.nextChange);
  }

  return null;
}

function resolveMinervaLeavesAt(data) {
  const eventEnd = asDate(data?.eventEnd);
  if (eventEnd) {
    return eventEnd;
  }

  if (data?.active && data?.nextChange) {
    return parseBethesdaRawDateTime(data.nextChange);
  }

  return null;
}

function buildMinervaSaleKey(data) {
  if (!data || !data.active) {
    return "";
  }

  const arrival = resolveMinervaArrivesAt(data);
  return JSON.stringify({
    listNumber: Number.isFinite(Number(data?.listNumber)) ? Number(data.listNumber) : null,
    location: String(data?.location || "--").trim() || "--",
    eventStart: arrival ? arrival.toISOString() : null
  });
}

function resolveMinervaBroadcastType(previousData, currentData) {
  if (!currentData || typeof currentData !== "object") {
    return null;
  }

  const previousActive = Boolean(previousData?.active);
  const currentActive = Boolean(currentData?.active);
  const previousSaleKey = buildMinervaSaleKey(previousData);
  const currentSaleKey = buildMinervaSaleKey(currentData);

  if (currentActive && currentSaleKey && currentSaleKey !== previousSaleKey) {
    return "arrival";
  }

  if (previousActive && !currentActive) {
    return "departure";
  }

  return null;
}

function resolveCurrentMinervaEmbedType(data) {
  return data?.active ? "arrival" : "transit";
}

function getMinervaPriceExtremes(items = []) {
  const pricedItems = Array.isArray(items)
    ? items.filter((item) => Number.isFinite(Number(item?.price)))
    : [];

  if (!pricedItems.length) {
    return {
      highest: null,
      lowest: null
    };
  }

  const sorted = [...pricedItems].sort((left, right) => {
    return Number(right.price) - Number(left.price);
  });

  return {
    highest: sorted[0],
    lowest: sorted[sorted.length - 1]
  };
}

function normalizeFeedList(feedValue) {
  return FEED_CHOICES[feedValue] || FEED_CHOICES.both;
}

function normalizeMinervaPreviewMode(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["transit", "arrival", "departure", "all"].includes(normalized)) {
    return normalized;
  }
  return "current";
}

function normalizeSubscriptionEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const channelId = String(entry.channelId || "").trim();
  const guildId = String(entry.guildId || "").trim();
  const allowsEmptyGuildId = guildId === "";
  if (!/^\d{6,32}$/.test(channelId) || (!allowsEmptyGuildId && !/^\d{6,32}$/.test(guildId))) {
    return null;
  }

  const feeds = Array.isArray(entry.feeds)
    ? entry.feeds.filter((feed) => feed === "silos" || feed === "minerva")
    : [];
  if (!feeds.length) {
    return null;
  }

  return {
    guildId,
    channelId,
    channelName: String(entry.channelName || "").trim(),
    feeds: [...new Set(feeds)],
    createdAt: String(entry.createdAt || "").trim() || new Date().toISOString(),
    updatedAt: String(entry.updatedAt || "").trim() || new Date().toISOString(),
    createdById: String(entry.createdById || "").trim(),
    createdByTag: String(entry.createdByTag || "").trim()
  };
}

function normalizeStateEntry(entry) {
  const value = entry && typeof entry === "object" ? entry : {};
  return {
    siloFingerprint: String(value.siloFingerprint || "").trim(),
    minervaFingerprint: String(value.minervaFingerprint || "").trim(),
    updatedAt: String(value.updatedAt || "").trim()
  };
}

function normalizeSettingsEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const guildId = String(entry.guildId || "").trim();
  if (!/^\d{6,32}$/.test(guildId)) {
    return null;
  }

  return {
    guildId,
    language: normalizeLanguage(entry.language, "en"),
    updatedAt: String(entry.updatedAt || "").trim() || new Date().toISOString()
  };
}

function createJsonStore(filePath, normalizeItem, emptyValue) {
  function ensureFile() {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(emptyValue, null, 2) + "\n", "utf8");
    }
  }

  function read() {
    ensureFile();
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(emptyValue)) {
        if (!Array.isArray(parsed)) {
          return [];
        }
        return parsed.map((item) => normalizeItem(item)).filter(Boolean);
      }
      return normalizeItem(parsed);
    } catch (error) {
      return Array.isArray(emptyValue) ? [] : normalizeItem({});
    }
  }

  function write(value) {
    ensureFile();
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(value, null, 2) + "\n", "utf8");
    fs.renameSync(tempPath, filePath);
  }

  return {
    read,
    write
  };
}

function createStatusError(message, status = 500) {
  const error = new Error(String(message || "Bot admin request failed."));
  error.status = Number.isFinite(Number(status)) ? Number(status) : 500;
  return error;
}

function createDiscordIntelBot(options = {}) {
  const siteRoot = path.resolve(String(options.siteRoot || path.join(__dirname, "..", "..")));
  const storageDir = path.resolve(String(options.storageDir || path.join(__dirname, "..", "storage")));
  const log = options.log && typeof options.log === "object" ? options.log : console;
  const observerOnly = options.observerOnly === true;
  const configuredPublicBaseUrl = sanitizePublicBaseUrl(options.publicBaseUrl || process.env.PUBLIC_BASE_URL || "");
  const publicBaseUrl = configuredPublicBaseUrl || discoverPublicBaseUrl(siteRoot);
  const token = String(process.env.DISCORD_BOT_TOKEN || "").trim();
  const applicationId = String(process.env.DISCORD_BOT_CLIENT_ID || process.env.DISCORD_CLIENT_ID || "").trim();
  const inviteLink = String(process.env.BOT_INVITE_LINK || "").trim();
  const developmentGuildId = String(process.env.DISCORD_BOT_GUILD_ID || "").trim();
  const pollIntervalMs = parsePositiveInteger(process.env.DISCORD_INTEL_POLL_INTERVAL_MS, DEFAULT_POLL_INTERVAL_MS);
  const statusRotationIntervalMs = parseDurationMs(
    process.env.DISCORD_BOT_STATUS_ROTATION_INTERVAL,
    DEFAULT_STATUS_ROTATION_MS
  );
  const postOnStartup = parseBoolean(process.env.DISCORD_INTEL_POST_ON_STARTUP, false);
  const defaultLanguage = normalizeLanguage(process.env.DISCORD_BOT_DEFAULT_LANG || "en", "en");
  const goldBullionEmoji = String(process.env.DISCORD_BOT_GOLD_BULLION_EMOJI || DEFAULT_GOLD_BULLION_EMOJI).trim() || DEFAULT_GOLD_BULLION_EMOJI;
  const defaultChannelIds = String(process.env.DISCORD_INTEL_CHANNEL_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => /^\d{6,32}$/.test(value));

  const subscriptionsStore = createJsonStore(
    path.join(storageDir, INTEL_SUBSCRIPTIONS_FILE),
    normalizeSubscriptionEntry,
    []
  );
  const stateStore = createJsonStore(
    path.join(storageDir, INTEL_STATE_FILE),
    normalizeStateEntry,
    {}
  );
  const settingsStore = createJsonStore(
    path.join(storageDir, INTEL_SETTINGS_FILE),
    normalizeSettingsEntry,
    []
  );

  const commands = [
    new SlashCommandBuilder()
      .setName("intel-subscribe")
      .setDescription("Subscribe a channel to Fallout Codex silo code and Minerva updates.")
      .setDescriptionLocalizations({
        "es-ES": "Suscribe un canal a las alertas de codigos de silo y Minerva de Fallout Codex.",
        "es-419": "Suscribe un canal a las alertas de codigos de silo y Minerva de Fallout Codex."
      })
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addChannelOption((option) => option
        .setName("channel")
        .setDescription("The channel that should receive intel updates.")
        .setDescriptionLocalizations({
          "es-ES": "El canal que recibira las alertas.",
          "es-419": "El canal que recibira las alertas."
        })
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true))
      .addStringOption((option) => option
        .setName("feed")
        .setDescription("Which intel feed should be posted.")
        .setDescriptionLocalizations({
          "es-ES": "Que feed de intel debe publicarse.",
          "es-419": "Que feed de intel debe publicarse."
        })
        .addChoices(
          { name: "Both", value: "both" },
          { name: "Silo Codes Only", value: "silos" },
          { name: "Minerva Only", value: "minerva" }
        )
        .setRequired(true)),
    new SlashCommandBuilder()
      .setName("intel-unsubscribe")
      .setDescription("Remove Fallout Codex intel updates from a channel.")
      .setDescriptionLocalizations({
        "es-ES": "Elimina las alertas de Fallout Codex de un canal.",
        "es-419": "Elimina las alertas de Fallout Codex de un canal."
      })
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addChannelOption((option) => option
        .setName("channel")
        .setDescription("The channel to remove from intel updates.")
        .setDescriptionLocalizations({
          "es-ES": "El canal que quieres quitar de las alertas.",
          "es-419": "El canal que quieres quitar de las alertas."
        })
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)),
    new SlashCommandBuilder()
      .setName("intel-status")
      .setDescription("Show the channels in this server that are subscribed to Fallout Codex intel updates.")
      .setDescriptionLocalizations({
        "es-ES": "Muestra los canales de este servidor que estan suscritos a las alertas de Fallout Codex.",
        "es-419": "Muestra los canales de este servidor que estan suscritos a las alertas de Fallout Codex."
      })
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    new SlashCommandBuilder()
      .setName("intel-preview")
      .setDescription("Preview the current Fallout Codex intel embeds.")
      .setDescriptionLocalizations({
        "es-ES": "Muestra una vista previa de los embeds actuales de Fallout Codex.",
        "es-419": "Muestra una vista previa de los embeds actuales de Fallout Codex."
      })
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addStringOption((option) => option
        .setName("feed")
        .setDescription("Which embed to preview.")
        .setDescriptionLocalizations({
          "es-ES": "Que embed quieres previsualizar.",
          "es-419": "Que embed quieres previsualizar."
        })
        .addChoices(
          { name: "Both", value: "both" },
          { name: "Silo Codes", value: "silos" },
          { name: "Minerva", value: "minerva" }
        )
        .setRequired(true))
      .addStringOption((option) => option
        .setName("minerva-state")
        .setDescription("Choose which Minerva state embed to preview.")
        .setDescriptionLocalizations({
          "es-ES": "Elige que estado de Minerva quieres previsualizar.",
          "es-419": "Elige que estado de Minerva quieres previsualizar."
        })
        .addChoices(
          { name: "Current", value: "current" },
          { name: "Transit", value: "transit" },
          { name: "Arrived", value: "arrival" },
          { name: "Departed", value: "departure" },
          { name: "All Minerva States", value: "all" }
        )
        .setRequired(false)),
    new SlashCommandBuilder()
      .setName("intel-language")
      .setDescription("Choose the language used by the bot in this server.")
      .setDescriptionLocalizations({
        "es-ES": "Elige el idioma que usara el bot en este servidor.",
        "es-419": "Elige el idioma que usara el bot en este servidor."
      })
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addStringOption((option) => option
        .setName("language")
        .setDescription("The language the bot should use.")
        .setDescriptionLocalizations({
          "es-ES": "El idioma que debe usar el bot.",
          "es-419": "El idioma que debe usar el bot."
        })
        .addChoices(
          { name: "English", value: "en" },
          { name: "Espanol", value: "es" }
        )
        .setRequired(true))
  ];

  const client = token && applicationId
    ? new Client({ intents: [GatewayIntentBits.Guilds] })
    : null;
  let pollTimer = null;
  let statusRotationTimer = null;
  let activePollPromise = null;
  let started = false;
  let startedAtMs = 0;
  let readyAtMs = 0;
  let statusRotationIndex = 0;
  let activeStatusLabel = "";
  const minervaDetailReplyByUser = new Map();

  function isEnabled() {
    return Boolean(client && token && applicationId);
  }

  function currentStatusRotationLabel() {
    return activeStatusLabel;
  }

  function applyRotatingPresence() {
    if (!client?.user || !STATUS_ROTATION_ACTIVITIES.length) {
      return;
    }

    const entry = STATUS_ROTATION_ACTIVITIES[statusRotationIndex % STATUS_ROTATION_ACTIVITIES.length];
    if (!entry?.name) {
      return;
    }

    activeStatusLabel = String(entry.label || "").trim();
    client.user.setPresence({
      status: "online",
      activities: [{
        type: entry.type,
        name: entry.name
      }]
    });

    statusRotationIndex = (statusRotationIndex + 1) % STATUS_ROTATION_ACTIVITIES.length;
  }

  function clearStatusRotation() {
    if (!statusRotationTimer) {
      return;
    }
    clearInterval(statusRotationTimer);
    statusRotationTimer = null;
  }

  function scheduleStatusRotation() {
    clearStatusRotation();
    statusRotationIndex = 0;
    activeStatusLabel = "";
    applyRotatingPresence();

    if (STATUS_ROTATION_ACTIVITIES.length <= 1) {
      return;
    }

    statusRotationTimer = setInterval(() => {
      applyRotatingPresence();
    }, statusRotationIntervalMs);
    statusRotationTimer.unref?.();
  }

  function readSubscriptions() {
    const entries = subscriptionsStore.read();
    if (!defaultChannelIds.length) {
      return entries;
    }

    const existing = new Set(entries.map((entry) => entry.channelId));
    const merged = [...entries];
    const nowIso = new Date().toISOString();

    for (const channelId of defaultChannelIds) {
      if (existing.has(channelId)) {
        continue;
      }
      merged.push({
        guildId: "",
        channelId,
        channelName: "",
        feeds: ["silos", "minerva"],
        createdAt: nowIso,
        updatedAt: nowIso,
        createdById: "",
        createdByTag: "env"
      });
    }

    return merged;
  }

  function writeSubscriptions(entries) {
    subscriptionsStore.write(entries);
  }

  function readState() {
    return stateStore.read();
  }

  function writeState(nextState) {
    stateStore.write(normalizeStateEntry({
      ...nextState,
      updatedAt: new Date().toISOString()
    }));
  }

  function readSettings() {
    return settingsStore.read();
  }

  function writeSettings(entries) {
    settingsStore.write(entries);
  }

  function isReady() {
    return Boolean(client && typeof client.isReady === "function" && client.isReady());
  }

  function pruneGuildData(guildId) {
    const normalizedGuildId = String(guildId || "").trim();
    if (!normalizedGuildId) {
      return;
    }

    const nextSubscriptions = readSubscriptions().filter((entry) => entry.guildId !== normalizedGuildId);
    const nextSettings = readSettings().filter((entry) => entry.guildId !== normalizedGuildId);
    writeSubscriptions(nextSubscriptions);
    writeSettings(nextSettings);
  }

  function getGuildSubscriptions(guildId) {
    const normalizedGuildId = String(guildId || "").trim();
    if (!normalizedGuildId) {
      return [];
    }
    return readSubscriptions().filter((entry) => entry.guildId === normalizedGuildId);
  }

  async function buildGuildAdminSnapshot(guild) {
    const subscriptions = getGuildSubscriptions(guild?.id);
    const memberCount = Number.isFinite(Number(guild?.memberCount)) ? Number(guild.memberCount) : null;
    const ownerId = String(guild?.ownerId || "").trim();
    const ownerMember = ownerId && guild?.members?.cache?.get
      ? guild.members.cache.get(ownerId) || null
      : null;
    let ownerUser = ownerMember?.user
      || (ownerId && guild?.client?.users?.cache?.get ? guild.client.users.cache.get(ownerId) || null : null);
    let ownerName = String(
      ownerMember?.displayName
      || ownerUser?.globalName
      || ownerUser?.username
      || ""
    ).trim();

    if (!ownerName && ownerId && typeof guild?.fetchOwner === "function") {
      try {
        const fetchedOwner = await guild.fetchOwner();
        ownerUser = fetchedOwner?.user || ownerUser;
        ownerName = String(
          fetchedOwner?.displayName
          || ownerUser?.globalName
          || ownerUser?.username
          || ""
        ).trim();
      } catch {
        ownerName = String(
          ownerMember?.displayName
          || ownerUser?.globalName
          || ownerUser?.username
          || ""
        ).trim();
      }
    }

    return {
      id: String(guild?.id || "").trim(),
      name: String(guild?.name || "").trim() || "Unknown server",
      iconUrl: typeof guild?.iconURL === "function"
        ? (guild.iconURL({ extension: "png", size: 128 }) || "")
        : "",
      ownerId,
      ownerName,
      preferredLocale: String(guild?.preferredLocale || "").trim(),
      joinedAt: guild?.joinedAt instanceof Date ? guild.joinedAt.toISOString() : "",
      memberCount,
      language: getGuildLanguage(guild?.id, defaultLanguage),
      subscriptionCount: subscriptions.length,
      subscriptions: subscriptions.map((entry) => ({
        channelId: String(entry.channelId || "").trim(),
        channelName: String(entry.channelName || "").trim(),
        feeds: Array.isArray(entry.feeds) ? entry.feeds.filter((feed) => feed === "silos" || feed === "minerva") : []
      }))
    };
  }

  async function getAdminSnapshot() {
    if (!isEnabled()) {
      return {
        enabled: false,
        ready: false,
        generatedAt: new Date().toISOString(),
        inviteLink,
        bot: {
          applicationId,
          userId: "",
          username: "",
          tag: "",
          avatarUrl: "",
          defaultLanguage,
          pollIntervalMs,
          statusRotationIntervalMs,
          statusRotationActivities: STATUS_ROTATION_ACTIVITIES.map((entry) => entry.label),
          currentStatus: "",
          postOnStartup,
          startedAt: "",
          readyAt: "",
          uptimeMs: 0,
          publicBaseUrl
        },
        stats: {
          guildCount: 0,
          userCount: 0,
          subscriptionCount: 0,
          orphanSubscriptionCount: 0,
          latencyMs: null
        },
        state: readState(),
        guilds: []
      };
    }

    const subscriptions = readSubscriptions();
    const state = readState();
    const guilds = isReady()
      ? (await Promise.all(
          Array.from(client.guilds.cache.values()).map((guild) => buildGuildAdminSnapshot(guild))
        ))
          .sort((left, right) => {
            const leftMembers = Number.isFinite(Number(left.memberCount)) ? Number(left.memberCount) : -1;
            const rightMembers = Number.isFinite(Number(right.memberCount)) ? Number(right.memberCount) : -1;
            if (rightMembers !== leftMembers) {
              return rightMembers - leftMembers;
            }
            return String(left.name || "").localeCompare(String(right.name || ""), "en", { sensitivity: "base" });
          })
      : [];

    const userCount = guilds.reduce((total, guild) => {
      return total + (Number.isFinite(Number(guild.memberCount)) ? Number(guild.memberCount) : 0);
    }, 0);
    const latencyMs = client?.ws && Number.isFinite(Number(client.ws.ping))
      ? Math.round(Number(client.ws.ping))
      : null;

    return {
      enabled: true,
      ready: isReady(),
      generatedAt: new Date().toISOString(),
      inviteLink,
      bot: {
        applicationId,
        userId: String(client?.user?.id || "").trim(),
        username: String(client?.user?.username || "").trim(),
        tag: String(client?.user?.tag || "").trim(),
        avatarUrl: typeof client?.user?.displayAvatarURL === "function"
          ? (client.user.displayAvatarURL({ extension: "png", size: 128 }) || "")
          : "",
        defaultLanguage,
        pollIntervalMs,
        statusRotationIntervalMs,
        statusRotationActivities: STATUS_ROTATION_ACTIVITIES.map((entry) => entry.label),
        currentStatus: currentStatusRotationLabel(),
        postOnStartup,
        startedAt: startedAtMs ? new Date(startedAtMs).toISOString() : "",
        readyAt: readyAtMs ? new Date(readyAtMs).toISOString() : "",
        uptimeMs: readyAtMs > 0 ? Math.max(0, Date.now() - readyAtMs) : 0,
        publicBaseUrl
      },
      stats: {
        guildCount: guilds.length,
        userCount,
        subscriptionCount: guilds.reduce((total, guild) => total + Number(guild.subscriptionCount || 0), 0),
        orphanSubscriptionCount: subscriptions.filter((entry) => !String(entry.guildId || "").trim()).length,
        latencyMs
      },
      state,
      guilds
    };
  }

  function assertAdminBotReady() {
    if (!isEnabled()) {
      throw createStatusError("Discord bot is disabled.", 503);
    }
    if (!started || !isReady()) {
      throw createStatusError("Discord bot is starting up. Try again in a moment.", 503);
    }
  }

  async function syncCommands() {
    if (!isEnabled()) {
      throw createStatusError("Discord bot is disabled.", 503);
    }
    await registerCommands();
    return {
      ok: true,
      scope: developmentGuildId ? "guild" : "global",
      guildId: developmentGuildId
    };
  }

  async function sendWelcomeToGuild(guildId) {
    assertAdminBotReady();
    const normalizedGuildId = String(guildId || "").trim();
    if (!/^\d{6,32}$/.test(normalizedGuildId)) {
      throw createStatusError("Invalid guild id.", 400);
    }

    const guild = client.guilds.cache.get(normalizedGuildId) || null;
    if (!guild) {
      throw createStatusError("Guild not found.", 404);
    }

    const defaultGuildLanguage = languageFromLocale(guild?.preferredLocale || "", defaultLanguage);
    const lang = ensureGuildLanguage(normalizedGuildId, defaultGuildLanguage);
    const channel = await resolveGuildWelcomeChannel(guild);
    if (!channel) {
      throw createStatusError("No suitable welcome channel was found for this guild.", 409);
    }

    try {
      await channel.send(buildWelcomePayload(guild, lang));
    } catch (error) {
      log.error(`[discord-bot] Failed to post manual welcome embed in guild ${normalizedGuildId}.`);
      log.error(error);
      throw createStatusError("Unable to send a welcome message in this guild right now.", 502);
    }

    return {
      ok: true,
      guildId: normalizedGuildId,
      guildName: String(guild.name || "").trim()
    };
  }

  async function leaveGuild(guildId) {
    assertAdminBotReady();
    const normalizedGuildId = String(guildId || "").trim();
    if (!/^\d{6,32}$/.test(normalizedGuildId)) {
      throw createStatusError("Invalid guild id.", 400);
    }

    const guild = client.guilds.cache.get(normalizedGuildId) || null;
    if (!guild) {
      throw createStatusError("Guild not found.", 404);
    }

    const guildName = String(guild.name || "").trim();
    await guild.leave();
    pruneGuildData(normalizedGuildId);

    return {
      ok: true,
      guildId: normalizedGuildId,
      guildName
    };
  }

  function getGuildLanguage(guildId, fallback = defaultLanguage) {
    const normalizedGuildId = String(guildId || "").trim();
    if (!normalizedGuildId) {
      return fallback;
    }

    const match = readSettings().find((entry) => entry.guildId === normalizedGuildId);
    return match ? normalizeLanguage(match.language, fallback) : fallback;
  }

  function resolveInteractionLanguage(interaction) {
    const guildId = String(interaction?.guildId || "").trim();
    if (guildId) {
      const savedLanguage = getGuildLanguage(guildId, "");
      if (savedLanguage) {
        return normalizeLanguage(savedLanguage, defaultLanguage);
      }
    }

    return languageFromLocale(
      interaction?.locale || interaction?.guildLocale || "",
      defaultLanguage
    );
  }

  function ensureGuildLanguage(guildId, language) {
    const normalizedGuildId = String(guildId || "").trim();
    if (!normalizedGuildId) {
      return normalizeLanguage(language, defaultLanguage);
    }

    const entries = readSettings();
    const index = entries.findIndex((entry) => entry.guildId === normalizedGuildId);
    if (index >= 0) {
      return entries[index].language;
    }

    entries.push({
      guildId: normalizedGuildId,
      language: normalizeLanguage(language, defaultLanguage),
      updatedAt: new Date().toISOString()
    });
    writeSettings(entries);
    return normalizeLanguage(language, defaultLanguage);
  }

  function setGuildLanguage(guildId, language) {
    const normalizedGuildId = String(guildId || "").trim();
    if (!normalizedGuildId) {
      return defaultLanguage;
    }

    const nextLanguage = normalizeLanguage(language, defaultLanguage);
    const entries = readSettings();
    const index = entries.findIndex((entry) => entry.guildId === normalizedGuildId);
    const nextEntry = {
      guildId: normalizedGuildId,
      language: nextLanguage,
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
      entries[index] = nextEntry;
    } else {
      entries.push(nextEntry);
    }
    writeSettings(entries);
    return nextLanguage;
  }

  function feedLabelsForLanguage(feeds, lang) {
    const list = Array.isArray(feeds) ? feeds : [];
    return list.map((feed) => {
      if (feed === "silos") {
        return t(lang, "feed_silos");
      }
      if (feed === "minerva") {
        return t(lang, "feed_minerva");
      }
      return t(lang, "feed_both");
    });
  }

  function formatSourceFieldValue(source, lang) {
    const info = formatSourceInfo(source, lang);
    if (info.url) {
      return `[${info.label}](${info.url})`;
    }
    return `\`${info.label}\``;
  }

  function formatBullionValue(value, lang, { inline = false, code = true } = {}) {
    const prefix = goldBullionEmoji ? `${goldBullionEmoji} ` : "";
    const amount = Number.isFinite(Number(value)) ? formatNumber(value, lang) : t(lang, "label_unknown");
    const formattedAmount = code ? `\`${amount}\`` : `**${amount}**`;
    const formatted = `${prefix}${formattedAmount}`;
    return inline ? formatted : formatted;
  }

  async function registerCommands() {
    const rest = new REST({ version: "10" }).setToken(token);
    const body = commands.map((command) => command.toJSON());

    if (developmentGuildId) {
      await rest.put(Routes.applicationGuildCommands(applicationId, developmentGuildId), { body });
      log.info(`[discord-bot] Registered guild slash commands for ${developmentGuildId}.`);
      return;
    }

    await rest.put(Routes.applicationCommands(applicationId), { body });
    log.info("[discord-bot] Registered global slash commands.");
  }

  function buildSiloEmbed(data, lang) {
    const homeUrl = buildPageUrl(publicBaseUrl, "/");
    const dossierUrl = buildPageUrl(publicBaseUrl, "/silos/");
    const resetTarget = data?.resetTargetUtc instanceof Date ? data.resetTargetUtc : null;
    const openTerminalValue = homeUrl
      ? `[${t(lang, "silo_open_terminal")}](${homeUrl})`
      : `\`${t(lang, "label_unknown")}\``;
    const falloutCodexLink = dossierUrl
      ? `[${t(lang, "silo_site_name")}](${dossierUrl})`
      : `\`${t(lang, "silo_site_name")}\``;
    const embed = new EmbedBuilder()
      .setColor(data?.isExpired ? 0xff7a59 : 0x39ff14)
      .setAuthor({
        name: t(lang, "silo_author"),
        url: homeUrl || undefined
      })
      .setTitle(t(lang, "silo_title"))
      .setDescription(`> ${t(lang, data?.isExpired ? "silo_description_expired" : "silo_description_live")}`)
      .addFields(
        { name: t(lang, "silo_site_alpha"), value: `\`\`\`\n${formatCode(data?.codes?.Alpha)}\n\`\`\``, inline: true },
        { name: t(lang, "silo_site_bravo"), value: `\`\`\`\n${formatCode(data?.codes?.Bravo)}\n\`\`\``, inline: true },
        { name: t(lang, "silo_site_charlie"), value: `\`\`\`\n${formatCode(data?.codes?.Charlie)}\n\`\`\``, inline: true },
        {
          name: t(lang, "silo_reset_window"),
          value: resetTarget
            ? `${t(lang, "label_absolute")}: ${formatDiscordDate(resetTarget, "F")}\n${t(lang, "label_relative")}: ${formatDiscordDate(resetTarget, "R")}`
            : `\`${t(lang, "label_unknown")}\``,
          inline: false
        },
        {
          name: t(lang, "silo_status"),
          value: data?.isExpired ? `\`${t(lang, "silo_status_expired")}\`` : `\`${t(lang, "silo_status_live")}\``,
          inline: true
        },
        {
          name: t(lang, "source_label"),
          value: falloutCodexLink,
          inline: true
        },
        {
          name: t(lang, "silo_open_terminal"),
          value: openTerminalValue,
          inline: true
        }
      )
      .setTimestamp(new Date())
      .setFooter({ text: `${t(lang, "silo_footer")} | ${t(lang, "label_last_broadcast")}` });

    if (homeUrl) {
      embed.setURL(homeUrl);
    }

    return embed;
  }

  function buildMinervaInventoryText(items = [], lang) {
    return items.map((item) => {
      const name = String(item?.name || "").trim() || t(lang, "label_unknown");
      const price = Number(item?.price);
      const priceText = Number.isFinite(price)
        ? formatBullionValue(price, lang, { inline: true, code: false })
        : `**${t(lang, "label_unknown")}**`;
      return `• ${name}\n↳ ${priceText}`;
    }).join("\n\n");
  }

  function buildMinervaEmbed(data, lang, eventType = "current") {
    const dossierUrl = buildPageUrl(publicBaseUrl, `/minerva/?lang=${normalizeLanguage(lang)}`);
    const websiteUrl = buildWebsiteUrl(publicBaseUrl, "#intel");
    const portraitUrl = buildAssetUrl(publicBaseUrl, "assets/images/where-is-minerva.png");
    const routeMapUrl = normalizeEmbedImageUrl(publicBaseUrl, data?.locationMapImage)
      || buildAssetUrl(publicBaseUrl, "assets/images/where-is-minerva.png");
    const displayItems = resolveMinervaArchiveItems(siteRoot, data);
    const totalBullion = sumBullion(displayItems);
    const arrivesAt = resolveMinervaArrivesAt(data);
    const leavesAt = resolveMinervaLeavesAt(data);
    const location = data?.location || "--";
    const itemCount = displayItems.length;
    const listValue = Number.isFinite(Number(data?.listNumber))
      ? t(lang, "minerva_list_value", { number: Number(data.listNumber) })
      : t(lang, "label_unknown");
    const openTerminalValue = websiteUrl
      ? `[${t(lang, "minerva_open_terminal")}](${websiteUrl})`
      : `\`${t(lang, "label_unknown")}\``;
    const falloutCodexLink = dossierUrl
      ? `[${t(lang, "silo_site_name")}](${dossierUrl})`
      : `\`${t(lang, "silo_site_name")}\``;
    const embedType = eventType === "arrival" || eventType === "departure" || eventType === "transit"
      ? eventType
      : resolveCurrentMinervaEmbedType(data);
    const isArrival = embedType === "arrival";
    const isDeparture = embedType === "departure";
    const descriptionKey = isDeparture
      ? "minerva_description_departed"
      : (isArrival ? "minerva_description_arrived" : "minerva_description_transit");
    const titleKey = isDeparture
      ? "minerva_title_departed"
      : (isArrival ? "minerva_title_arrived" : "minerva_title_transit");
    const statusValue = isDeparture
      ? t(lang, "minerva_status_restocking")
      : t(lang, isArrival ? "minerva_status_active" : "minerva_status_transit");
    const returnsAt = arrivesAt;

    const routeIntelLines = [
      `${t(lang, "minerva_status")}: **${statusValue}**`,
      `${t(lang, "minerva_location")}: **${location}**`,
      `${t(lang, "minerva_list")}: **${listValue}**`
    ];
    const fields = [];

    if (isArrival) {
      routeIntelLines.push(
        `${t(lang, "minerva_arrives")}: ${arrivesAt ? formatDiscordDate(arrivesAt, "F") : `\`${t(lang, "label_unknown")}\``}`,
        `${t(lang, "minerva_leaves")}: ${leavesAt ? formatDiscordDate(leavesAt, "F") : `\`${t(lang, "label_unknown")}\``}`
      );
      fields.push({
        name: t(lang, "minerva_sale_intel"),
        value: routeIntelLines.join("\n"),
        inline: false
      });
    } else if (isDeparture) {
      fields.push({
        name: t(lang, "minerva_route_intel"),
        value: routeIntelLines.join("\n"),
        inline: false
      });
      fields.push({
        name: t(lang, "minerva_return_window"),
        value: returnsAt
          ? `${t(lang, "label_absolute")}: ${formatDiscordDate(returnsAt, "F")}\n${t(lang, "label_relative")}: ${formatDiscordDate(returnsAt, "R")}`
          : `\`${t(lang, "label_unknown")}\``,
        inline: false
      });
    } else {
      fields.push({
        name: t(lang, "minerva_route_intel"),
        value: routeIntelLines.join("\n"),
        inline: false
      });
      fields.push({
        name: t(lang, "minerva_arrives"),
        value: returnsAt
          ? `${t(lang, "label_absolute")}: ${formatDiscordDate(returnsAt, "F")}\n${t(lang, "label_relative")}: ${formatDiscordDate(returnsAt, "R")}`
          : `\`${t(lang, "label_unknown")}\``,
        inline: false
      });
    }

    fields.push({
      name: t(lang, "source_label"),
      value: falloutCodexLink,
      inline: true
    });
    fields.push({
      name: t(lang, "minerva_open_terminal"),
      value: openTerminalValue,
      inline: true
    });
    const inventoryText = isArrival ? buildMinervaInventoryText(displayItems, lang) : "";

    const descriptionText = truncateForDiscord(
      isDeparture
        ? [
          `> ${t(lang, descriptionKey, { location, list: listValue, returns: returnsAt ? formatDiscordDate(returnsAt, "R") : `\`${t(lang, "label_unknown")}\`` })}`,
          `> ${t(lang, "minerva_returns")}: ${returnsAt ? formatDiscordDate(returnsAt, "F") : `\`${t(lang, "label_unknown")}\``}`
        ].join("\n")
        : [
          `> ${t(lang, descriptionKey, { location })}`,
          isArrival
            ? `> ${t(lang, "minerva_item_count")}: \`${formatNumber(itemCount, lang)}\` | ${t(lang, "minerva_total_bullion")}: ${formatBullionValue(totalBullion, lang)}`
            : `> ${t(lang, "minerva_arrives")}: ${arrivesAt ? formatDiscordDate(arrivesAt, "R") : `\`${t(lang, "label_unknown")}\``}`,
          isArrival && inventoryText
            ? `\n**${t(lang, "minerva_inventory")}**\n${inventoryText}`
            : ""
        ].join("\n"),
      3900
    );

    const embed = new EmbedBuilder()
      .setColor(isArrival ? 0xf7c948 : (isDeparture ? 0xff8f3f : 0xffb347))
      .setAuthor({
        name: t(lang, "minerva_author"),
        url: dossierUrl || websiteUrl || undefined
      })
      .setTitle(t(lang, titleKey))
      .setDescription(descriptionText)
      .addFields(fields)
      .setTimestamp(new Date())
      .setFooter({ text: `${t(lang, "minerva_footer")} | ${t(lang, "label_last_broadcast")}` });

    if (portraitUrl) {
      embed.setThumbnail(portraitUrl);
    }
    if (routeMapUrl) {
      embed.setImage(routeMapUrl);
    }
    if (dossierUrl || websiteUrl) {
      embed.setURL(dossierUrl || websiteUrl);
    }

    return embed;
  }

  function buildMinervaItemSelectValue(item, listNumber, itemIndex) {
    if (Number.isFinite(Number(listNumber)) && Number.isFinite(Number(itemIndex))) {
      return `list:${Number(listNumber)}:${Number(itemIndex)}`;
    }

    const wikiUrl = normalizeWikiUrl(item?.url || item?.WikiUrl || "");
    const title = wikiPageTitleFromUrl(wikiUrl);
    if (title && `wiki:${title}`.length <= 100) {
      return `wiki:${title}`;
    }

    const fallbackKey = String(item?.name || item?.Name || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "");
    return truncateForDiscord(`name:${fallbackKey || "unknown"}`, 100);
  }

  function buildMinervaItemSelectRows(data, lang, eventType = "current") {
    const embedType = eventType === "current"
      ? resolveCurrentMinervaEmbedType(data)
      : eventType;
    const items = resolveMinervaArchiveItems(siteRoot, data);
    const listNumber = Number(data?.listNumber);
    if (embedType !== "arrival" || !items.length) {
      return [];
    }

    const rows = [];
    for (let index = 0; index < items.length; index += 25) {
      const group = items.slice(index, index + 25);
      const options = group.map((item, groupIndex) => {
        const price = Number(item?.price);
        const itemIndex = index + groupIndex;
        return {
          label: truncateForDiscord(String(item?.name || item?.Name || t(lang, "label_unknown")), 100),
          description: Number.isFinite(price)
            ? truncateForDiscord(t(lang, "minerva_select_option_desc", { amount: formatNumber(price, lang) }), 100)
            : undefined,
          value: buildMinervaItemSelectValue(item, listNumber, itemIndex)
        };
      });

      const menu = new StringSelectMenuBuilder()
        .setCustomId(`${MINERVA_ITEM_SELECT_PREFIX}:${Math.floor(index / 25)}`)
        .setPlaceholder(t(lang, "minerva_select_placeholder", {
          start: index + 1,
          end: index + group.length
        }))
        .addOptions(options);

      rows.push(new ActionRowBuilder().addComponents(menu));
    }

    return rows;
  }

  function buildMessagePayload(snapshot, feedList = ["silos", "minerva"], lang = defaultLanguage, options = {}) {
    const embeds = buildEmbeds(snapshot, feedList, lang, options);
    const components = feedList.includes("minerva") && snapshot?.minerva
      ? buildMinervaItemSelectRows(snapshot.minerva, lang, options.minervaEventType || "current")
      : [];

    return {
      embeds,
      components
    };
  }

  function buildPreviewPayload(snapshot, feedList = ["silos", "minerva"], lang = defaultLanguage, options = {}) {
    const embeds = buildPreviewEmbeds(snapshot, feedList, lang, options);
    const previewMode = normalizeMinervaPreviewMode(options.minervaPreviewMode || "current");
    const components = feedList.includes("minerva") && snapshot?.minerva
      ? buildMinervaItemSelectRows(
        snapshot.minerva,
        lang,
        previewMode === "all"
          ? "arrival"
          : (previewMode === "current" ? resolveCurrentMinervaEmbedType(snapshot?.minerva) : previewMode)
      )
      : [];

    return {
      embeds,
      components
    };
  }

  function findSelectedMinervaOption(interaction, selectedValue) {
    const directOption = Array.isArray(interaction?.component?.options)
      ? interaction.component.options.find((option) => String(option?.value || option?.data?.value || "") === selectedValue)
      : null;
    if (directOption) {
      return directOption;
    }

    const rows = Array.isArray(interaction?.message?.components) ? interaction.message.components : [];
    for (const row of rows) {
      const components = Array.isArray(row?.components) ? row.components : [];
      for (const component of components) {
        const customId = String(component?.customId || component?.data?.custom_id || "");
        if (customId !== interaction.customId) {
          continue;
        }
        const options = Array.isArray(component?.options) ? component.options : [];
        const match = options.find((option) => String(option?.value || option?.data?.value || "") === selectedValue);
        if (match) {
          return match;
        }
      }
    }

    return null;
  }

  function parsePriceFromOptionDescription(option) {
    const description = String(option?.description || option?.data?.description || "").trim();
    const digits = description.replace(/\D/g, "");
    if (!digits) {
      return null;
    }
    const price = Number(digits);
    return Number.isFinite(price) ? price : null;
  }

  function buildMinervaDetailEmbed(item, detail, lang) {
    const planThumbnailUrl = buildAssetUrl(publicBaseUrl, MINERVA_DETAIL_FALLBACK_IMAGE);
    const wikiUrl = normalizeWikiUrl(detail?.wikiUrl || item?.url || item?.WikiUrl || "");
    const itemName = String(item?.name || item?.Name || t(lang, "label_unknown")).trim() || t(lang, "label_unknown");
    const price = Number(item?.price);
    const whereElse = Array.isArray(detail?.whereElse) && detail.whereElse.length
      ? detail.whereElse
      : [t(lang, "minerva_detail_no_other_sources")];
    const unlocks = sanitizeDetailText(detail?.unlocks || "") || t(lang, "minerva_detail_no_unlocks");

    const embed = new EmbedBuilder()
      .setColor(0xf7c948)
      .setTitle(itemName)
      .setDescription(`**${t(lang, "minerva_detail_unlocks_label")}**\n${unlocks}`)
      .addFields(
        {
          name: t(lang, "minerva_detail_price"),
          value: Number.isFinite(price) ? formatBullionValue(price, lang) : `\`${t(lang, "label_unknown")}\``,
          inline: false
        },
        {
          name: t(lang, "minerva_detail_where_label"),
          value: whereElse.map((line) => `- ${line}`).join("\n").slice(0, 1024),
          inline: false
        }
      )
      .setFooter({ text: t(lang, "minerva_footer") });

    if (planThumbnailUrl) {
      embed.setThumbnail(planThumbnailUrl);
    }
    if (wikiUrl) {
      embed.setURL(wikiUrl);
    }

    return embed;
  }

  function buildWelcomeLanguageComponents(lang) {
    const normalizedLang = normalizeLanguage(lang, defaultLanguage);
    const menu = new StringSelectMenuBuilder()
      .setCustomId(WELCOME_LANGUAGE_SELECT_ID)
      .setPlaceholder(t(normalizedLang, "welcome_language_placeholder", {
        language: t(normalizedLang, `language_name_${normalizedLang}`)
      }))
      .addOptions(
        {
          label: t(normalizedLang, "language_name_en"),
          value: "en",
          default: normalizedLang === "en"
        },
        {
          label: t(normalizedLang, "language_name_es"),
          value: "es",
          default: normalizedLang === "es"
        }
      );

    return [new ActionRowBuilder().addComponents(menu)];
  }

  function buildWelcomeEmbed(guild, lang) {
    const normalizedLang = normalizeLanguage(lang, defaultLanguage);
    const guildName = String(guild?.name || "your server").trim() || "your server";
    const siteUrl = buildPageUrl(publicBaseUrl, "/");
    const silosUrl = buildPageUrl(publicBaseUrl, "/silos/");
    const minervaUrl = buildPageUrl(publicBaseUrl, "/minerva/");
    const privacyUrl = buildPageUrl(publicBaseUrl, "/privacy/");
    const termsUrl = buildPageUrl(publicBaseUrl, "/terms/");
    const linkParts = [];

    if (siteUrl) {
      linkParts.push(`[${t(normalizedLang, "welcome_links_site")}](${siteUrl})`);
    }
    if (silosUrl) {
      linkParts.push(`[${t(normalizedLang, "welcome_links_silos")}](${silosUrl})`);
    }
    if (minervaUrl) {
      linkParts.push(`[${t(normalizedLang, "welcome_links_minerva")}](${minervaUrl})`);
    }
    if (privacyUrl) {
      linkParts.push(`[${t(normalizedLang, "welcome_links_privacy")}](${privacyUrl})`);
    }
    if (termsUrl) {
      linkParts.push(`[${t(normalizedLang, "welcome_links_terms")}](${termsUrl})`);
    }

    const embed = new EmbedBuilder()
      .setColor(0x39ff14)
      .setAuthor({
        name: t(normalizedLang, "welcome_author"),
        url: siteUrl || undefined
      })
      .setTitle(t(normalizedLang, "welcome_title"))
      .setDescription(t(normalizedLang, "welcome_description", { server: guildName }))
      .addFields(
        {
          name: t(normalizedLang, "welcome_overview_label"),
          value: t(normalizedLang, "welcome_overview_value"),
          inline: false
        },
        {
          name: t(normalizedLang, "welcome_setup_label"),
          value: t(normalizedLang, "welcome_setup_value"),
          inline: false
        },
        {
          name: t(normalizedLang, "welcome_commands_label"),
          value: t(normalizedLang, "welcome_commands_value"),
          inline: true
        },
        {
          name: t(normalizedLang, "welcome_language_field_label"),
          value: t(normalizedLang, "welcome_language_field_value", {
            language: t(normalizedLang, `language_name_${normalizedLang}`)
          }),
          inline: true
        }
      )
      .setTimestamp(new Date())
      .setFooter({ text: t(normalizedLang, "welcome_footer") });

    if (linkParts.length) {
      embed.addFields({
        name: t(normalizedLang, "welcome_links_label"),
        value: linkParts.join(" • "),
        inline: false
      });
    }

    if (siteUrl) {
      embed.setURL(siteUrl);
    }

    return embed;
  }

  function buildWelcomePayload(guild, lang) {
    return {
      embeds: [buildWelcomeEmbed(guild, lang)],
      components: buildWelcomeLanguageComponents(lang)
    };
  }

  function buildEmbeds(snapshot, feedList = ["silos", "minerva"], lang = defaultLanguage, options = {}) {
    const embeds = [];

    if (feedList.includes("silos") && snapshot?.silo) {
      embeds.push(buildSiloEmbed(snapshot.silo, lang));
    }
    if (feedList.includes("minerva") && snapshot?.minerva) {
      embeds.push(buildMinervaEmbed(snapshot.minerva, lang, options.minervaEventType || "current"));
    }

    return embeds;
  }

  function canSendToGuildChannel(channel) {
    if (!channel || !channel.isTextBased() || channel.isDMBased?.()) {
      return false;
    }

    const permissions = channel.permissionsFor(client.user);
    if (!permissions) {
      return false;
    }

    return permissions.has(PermissionFlagsBits.ViewChannel)
      && permissions.has(PermissionFlagsBits.SendMessages)
      && permissions.has(PermissionFlagsBits.EmbedLinks);
  }

  async function resolveGuildWelcomeChannel(guild) {
    const preferredChannels = [
      guild?.systemChannel || null,
      guild?.rulesChannel || null,
      guild?.publicUpdatesChannel || null
    ].filter(Boolean);

    for (const channel of preferredChannels) {
      if (canSendToGuildChannel(channel)) {
        return channel;
      }
    }

    const channels = await guild.channels.fetch();
    const candidates = [...channels.values()]
      .filter((channel) => channel
        && (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement)
        && canSendToGuildChannel(channel))
      .sort((left, right) => {
        const leftPosition = Number(left?.rawPosition || 0);
        const rightPosition = Number(right?.rawPosition || 0);
        if (leftPosition !== rightPosition) {
          return leftPosition - rightPosition;
        }
        return String(left?.name || "").localeCompare(String(right?.name || ""));
      });

    return candidates[0] || null;
  }

  function buildPreviewEmbeds(snapshot, feedList = ["silos", "minerva"], lang = defaultLanguage, options = {}) {
    const embeds = [];

    if (feedList.includes("silos") && snapshot?.silo) {
      embeds.push(buildSiloEmbed(snapshot.silo, lang));
    }

    if (feedList.includes("minerva") && snapshot?.minerva) {
      const previewMode = normalizeMinervaPreviewMode(options.minervaPreviewMode || "current");
      if (previewMode === "all") {
        embeds.push(buildMinervaEmbed(snapshot.minerva, lang, "transit"));
        embeds.push(buildMinervaEmbed(snapshot.minerva, lang, "arrival"));
        embeds.push(buildMinervaEmbed(snapshot.minerva, lang, "departure"));
      } else {
        const eventType = previewMode === "current"
          ? resolveCurrentMinervaEmbedType(snapshot?.minerva)
          : previewMode;
        embeds.push(buildMinervaEmbed(snapshot.minerva, lang, eventType));
      }
    }

    return embeds;
  }

  async function postEmbedsToSubscription(subscription, payload) {
    const embeds = Array.isArray(payload?.embeds) ? payload.embeds : [];
    const components = Array.isArray(payload?.components) ? payload.components : [];
    if (!client || !embeds.length) {
      return false;
    }

    try {
      const channel = await client.channels.fetch(subscription.channelId);
      if (!channel || !channel.isTextBased()) {
        return false;
      }

      const messagePayload = { embeds };
      if (components.length) {
        messagePayload.components = components;
      }

      await channel.send(messagePayload);
      return true;
    } catch (error) {
      log.error(`[discord-bot] Failed to post intel embed to channel ${subscription.channelId}.`);
      log.error(error);
      return false;
    }
  }

  async function broadcastIntelUpdate(feedType, snapshot, options = {}) {
    const subscriptions = readSubscriptions().filter((entry) => entry.feeds.includes(feedType));
    if (!subscriptions.length) {
      return;
    }

    for (const subscription of subscriptions) {
      const lang = subscription.guildId
        ? getGuildLanguage(subscription.guildId, defaultLanguage)
        : defaultLanguage;
      const payload = buildMessagePayload(snapshot, [feedType], lang, options);
      if (!payload.embeds.length) {
        continue;
      }
      await postEmbedsToSubscription(subscription, payload);
    }
  }

  async function postCurrentIntelToSubscription(subscription, feedList, lang) {
    const snapshot = await fetchCurrentIntel({ siteRoot });
    const payload = buildMessagePayload(snapshot, feedList, lang, {
      minervaEventType: resolveCurrentMinervaEmbedType(snapshot?.minerva)
    });
    if (!payload.embeds.length) {
      return false;
    }
    return postEmbedsToSubscription(subscription, payload);
  }

  async function pollOnce({ hydrateOnly = false } = {}) {
    const snapshot = await fetchCurrentIntel({ siteRoot });
    const previousState = readState();
    const previousMinerva = parseStoredFingerprint(previousState.minervaFingerprint);
    const nextState = {
      siloFingerprint: snapshot.siloFingerprint,
      minervaFingerprint: snapshot.minervaFingerprint
    };

    if (postOnStartup && hydrateOnly) {
      if (snapshot.siloFingerprint) {
        await broadcastIntelUpdate("silos", snapshot);
      }
      if (snapshot.minervaFingerprint) {
        await broadcastIntelUpdate("minerva", snapshot, {
          minervaEventType: resolveCurrentMinervaEmbedType(snapshot?.minerva)
        });
      }
      writeState(nextState);
      return;
    }

    if (hydrateOnly) {
      writeState(nextState);
      return;
    }

    if (previousState.siloFingerprint && previousState.siloFingerprint !== snapshot.siloFingerprint) {
      await broadcastIntelUpdate("silos", snapshot);
    }

    if (previousState.minervaFingerprint && previousState.minervaFingerprint !== snapshot.minervaFingerprint) {
      const minervaEventType = resolveMinervaBroadcastType(previousMinerva, snapshot.minerva);
      if (minervaEventType) {
        await broadcastIntelUpdate("minerva", snapshot, { minervaEventType });
      }
    }

    if (!previousState.siloFingerprint && !previousState.minervaFingerprint) {
      writeState(nextState);
      return;
    }

    writeState(nextState);
  }

  function queuePoll(options = {}) {
    if (!client || activePollPromise) {
      return;
    }

    activePollPromise = pollOnce(options)
      .catch((error) => {
        log.error("[discord-bot] Intel poll failed.");
        log.error(error);
      })
      .finally(() => {
        activePollPromise = null;
      });
  }

  function schedulePolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
    }
    pollTimer = setInterval(() => {
      queuePoll();
    }, pollIntervalMs);
    pollTimer.unref?.();
  }

  async function handleSubscribe(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.options.getChannel("channel", true);
    const feed = interaction.options.getString("feed", true);
    const guildId = String(interaction.guildId || "").trim();
    const lang = resolveInteractionLanguage(interaction);
    const feeds = normalizeFeedList(feed);
    const entries = readSubscriptions();
    const nowIso = new Date().toISOString();
    const index = entries.findIndex((entry) => entry.channelId === channel.id);
    const previousFeeds = index >= 0 && Array.isArray(entries[index]?.feeds)
      ? [...entries[index].feeds]
      : [];

    const nextEntry = {
      guildId,
      channelId: channel.id,
      channelName: "name" in channel ? String(channel.name || "").trim() : "",
      feeds,
      createdAt: index >= 0 ? entries[index].createdAt : nowIso,
      updatedAt: nowIso,
      createdById: interaction.user.id,
      createdByTag: interaction.user.tag || interaction.user.username || ""
    };

    if (index >= 0) {
      entries[index] = nextEntry;
    } else {
      entries.push(nextEntry);
    }
    writeSubscriptions(entries);
    ensureGuildLanguage(guildId, lang);

    await interaction.editReply({
      content: t(lang, "cmd_subscribed", {
        channelId: channel.id,
        feeds: feedLabelsForLanguage(feeds, lang).join(", ")
      })
    });

    const shouldPostInitialSnapshot = index < 0
      || previousFeeds.length !== feeds.length
      || previousFeeds.some((entry, feedIndex) => entry !== feeds[feedIndex]);

    if (shouldPostInitialSnapshot) {
      try {
        await postCurrentIntelToSubscription(nextEntry, feeds, lang);
      } catch (error) {
        log.error(`[discord-bot] Failed to post initial intel snapshot to channel ${channel.id}.`);
        log.error(error);
      }
    }
  }

  async function handleUnsubscribe(interaction) {
    const channel = interaction.options.getChannel("channel", true);
    const lang = resolveInteractionLanguage(interaction);
    const entries = readSubscriptions();
    const nextEntries = entries.filter((entry) => entry.channelId !== channel.id);
    writeSubscriptions(nextEntries);

    await interaction.reply({
      content: t(lang, "cmd_unsubscribed", {
        channelId: channel.id
      }),
      ephemeral: true
    });
  }

  async function handleStatus(interaction) {
    const guildId = String(interaction.guildId || "").trim();
    const lang = resolveInteractionLanguage(interaction);
    const entries = readSubscriptions().filter((entry) => !entry.guildId || entry.guildId === guildId);
    if (!entries.length) {
      await interaction.reply({
        content: t(lang, "cmd_no_subscriptions"),
        ephemeral: true
      });
      return;
    }

    const lines = entries.map((entry) => {
      const feeds = feedLabelsForLanguage(entry.feeds, lang).join(", ");
      return `- <#${entry.channelId}> -> \`${feeds}\``;
    });
    await interaction.reply({
      content: `${t(lang, "cmd_subscriptions_title")}\n${lines.join("\n")}\n${t(lang, "cmd_status_language", {
        language: t(lang, `language_name_${getGuildLanguage(guildId, lang)}`)
      })}`,
      ephemeral: true
    });
  }

  async function handleMinervaItemSelect(interaction) {
    const lang = resolveInteractionLanguage(interaction);
    const userId = String(interaction.user?.id || "").trim();
    const selectedValue = String(interaction.values?.[0] || "").trim();
    const selectedOption = findSelectedMinervaOption(interaction, selectedValue);
    const previousReply = userId ? minervaDetailReplyByUser.get(userId) : null;
    if (previousReply?.token) {
      try {
        await client.rest.delete(Routes.webhookMessage(applicationId, previousReply.token, "@original"));
      } catch (_error) {
        // Ignore expired or already-dismissed ephemeral replies.
      }
      minervaDetailReplyByUser.delete(userId);
    }

    await interaction.deferReply({ ephemeral: true });

    let item = null;
    const listMatch = selectedValue.match(/^list:(\d+):(\d+)$/i);
    if (listMatch) {
      const listNumber = Number(listMatch[1]);
      const itemIndex = Number(listMatch[2]);
      const lists = loadMinervaLists(siteRoot);
      const list = lists.find((entry) => Number(entry?.ListNumber) === listNumber);
      const archiveItem = Array.isArray(list?.Inventory) ? list.Inventory[itemIndex] : null;
      if (archiveItem) {
        item = mapArchiveMinervaItem(archiveItem, listNumber);
      }
    }

    if (!item) {
      item = {
        name: String(selectedOption?.label || selectedOption?.data?.label || t(lang, "label_unknown")).trim() || t(lang, "label_unknown"),
        price: parsePriceFromOptionDescription(selectedOption),
        url: selectedValue.startsWith("wiki:") ? buildWikiPageUrl(selectedValue.slice(5), "en") : "",
        listNumber: null
      };
    }

    const detail = resolveMinervaDetailFallback(siteRoot, item, lang);
    const embed = buildMinervaDetailEmbed(item, detail, lang);
    await interaction.editReply({ embeds: [embed] });

    if (userId) {
      minervaDetailReplyByUser.set(userId, {
        token: interaction.token
      });
    }
  }

  async function handlePreview(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const feed = interaction.options.getString("feed", true);
    const minervaPreviewMode = normalizeMinervaPreviewMode(interaction.options.getString("minerva-state"));
    const lang = resolveInteractionLanguage(interaction);
    const snapshot = await fetchCurrentIntel({ siteRoot });
    const payload = buildPreviewPayload(snapshot, normalizeFeedList(feed), lang, {
      minervaPreviewMode
    });

    if (!payload.embeds.length) {
      await interaction.editReply({ content: t(lang, "cmd_preview_unavailable") });
      return;
    }

    await interaction.editReply(payload);
  }

  async function handleLanguage(interaction) {
    const guildId = String(interaction.guildId || "").trim();
    const requestLanguage = normalizeLanguage(interaction.options.getString("language", true), defaultLanguage);
    const replyLanguage = guildId ? setGuildLanguage(guildId, requestLanguage) : requestLanguage;

    if (!guildId) {
      await interaction.reply({
        content: t(replyLanguage, "cmd_language_invalid_scope"),
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      content: t(replyLanguage, "cmd_language_set", {
        language: t(replyLanguage, `language_name_${replyLanguage}`)
      }),
      ephemeral: true
    });
  }

  async function handleWelcomeLanguageSelect(interaction) {
    const guildId = String(interaction.guildId || "").trim();
    const currentLang = resolveInteractionLanguage(interaction);
    if (!guildId) {
      await interaction.reply({
        content: t(currentLang, "cmd_language_invalid_scope"),
        ephemeral: true
      });
      return;
    }

    if (interaction.memberPermissions && !interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({
        content: t(currentLang, "welcome_language_admin_only"),
        ephemeral: true
      });
      return;
    }

    const selectedLanguage = normalizeLanguage(interaction.values?.[0], defaultLanguage);
    const nextLanguage = setGuildLanguage(guildId, selectedLanguage);
    const payload = buildWelcomePayload(interaction.guild, nextLanguage);
    await interaction.update(payload);
  }

  async function postWelcomeMessage(guild) {
    const guildId = String(guild?.id || "").trim();
    if (!guildId) {
      return;
    }

    const defaultGuildLanguage = languageFromLocale(guild?.preferredLocale || "", defaultLanguage);
    const lang = ensureGuildLanguage(guildId, defaultGuildLanguage);
    const channel = await resolveGuildWelcomeChannel(guild);

    if (!channel) {
      log.warn(`[discord-bot] No suitable welcome channel found for guild ${guildId}.`);
      return;
    }

    try {
      await channel.send(buildWelcomePayload(guild, lang));
    } catch (error) {
      log.error(`[discord-bot] Failed to post welcome embed in guild ${guildId}.`);
      log.error(error);
    }
  }

  async function handleInteraction(interaction) {
    try {
      if (interaction.isStringSelectMenu() && String(interaction.customId || "") === WELCOME_LANGUAGE_SELECT_ID) {
        await handleWelcomeLanguageSelect(interaction);
        return;
      }

      if (interaction.isStringSelectMenu() && String(interaction.customId || "").startsWith(MINERVA_ITEM_SELECT_PREFIX)) {
        await handleMinervaItemSelect(interaction);
        return;
      }

      if (!interaction.isChatInputCommand()) {
        return;
      }

      if (interaction.commandName === "intel-subscribe") {
        await handleSubscribe(interaction);
        return;
      }
      if (interaction.commandName === "intel-unsubscribe") {
        await handleUnsubscribe(interaction);
        return;
      }
      if (interaction.commandName === "intel-status") {
        await handleStatus(interaction);
        return;
      }
      if (interaction.commandName === "intel-preview") {
        await handlePreview(interaction);
        return;
      }
      if (interaction.commandName === "intel-language") {
        await handleLanguage(interaction);
      }
    } catch (error) {
      log.error("[discord-bot] Command handling failed.");
      log.error(error);

      const lang = resolveInteractionLanguage(interaction);

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: t(lang, "cmd_failed") }).catch(() => {});
        return;
      }

      await interaction.reply({
        content: t(lang, "cmd_failed"),
        ephemeral: true
      }).catch(() => {});
    }
  }

  async function start() {
    if (!isEnabled()) {
      if (token || applicationId) {
        log.warn("[discord-bot] Discord intel bot is disabled because DISCORD_BOT_TOKEN or DISCORD_BOT_CLIENT_ID is missing.");
      }
      return {
        enabled: false
      };
    }

    if (started) {
      return {
        enabled: true
      };
    }

    started = true;
    startedAtMs = Date.now();
    if (!observerOnly) {
      client.on("interactionCreate", (interaction) => {
        void handleInteraction(interaction);
      });
      client.on("guildCreate", (guild) => {
        void postWelcomeMessage(guild);
      });
    }
    client.on("guildDelete", (guild) => {
      pruneGuildData(guild?.id);
    });
    client.on("ready", () => {
      readyAtMs = Date.now();
      scheduleStatusRotation();
      log.info(`[discord-bot] Logged in as ${client.user?.tag || client.user?.id}.`);
    });

    try {
      await client.login(token);
      if (!observerOnly) {
        await registerCommands();
        queuePoll({ hydrateOnly: true });
        schedulePolling();
      }

      return {
        enabled: true
      };
    } catch (error) {
      started = false;
      throw error;
    }
  }

  async function stop() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    clearStatusRotation();
    if (activePollPromise) {
      try {
        await activePollPromise;
      } catch (error) {
        // Ignore in shutdown path.
      }
    }
    if (client) {
      client.destroy();
    }
    started = false;
    startedAtMs = 0;
    readyAtMs = 0;
    statusRotationIndex = 0;
    activeStatusLabel = "";
  }

  return {
    start,
    stop,
    isEnabled,
    isReady,
    getAdminSnapshot,
    syncCommands,
    sendWelcomeToGuild,
    leaveGuild
  };
}

module.exports = {
  createDiscordIntelBot
};
