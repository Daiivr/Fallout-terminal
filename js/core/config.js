const PROXY_BASE = "https://api.codetabs.com/v1/proxy/?quest=";
const SILO_API_URL = "/api/intel/silo";
const PLAYER_COUNTS_API_URL = "/api/intel/player-counts";
const NUKAKNIGHTS_INTEL_API_URL = "/api/intel/nukaknights";
const SILO_RESET_DAY_UTC = 4;
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

const FALLBACK_MINERVA_ANCHOR_DATE_UTC = Date.UTC(2026, 1, 16);
const MS_DAY = 24 * 60 * 60 * 1000;
const MS_WEEK = 7 * MS_DAY;
const CYCLE_WEEKS = 24;
const MINERVA_FALLBACK_EVENT_START_GAP_DAYS = [7, 7, 10, 11];
const MINERVA_FALLBACK_EVENT_ACTIVE_DAYS = [2, 2, 2, 4];
const MINERVA_FALLBACK_EVENT_SEARCH_LIMIT = CYCLE_WEEKS * 32;
const WIKI_BASE = "https://fallout.fandom.com";
const WIKI_API_BY_LANG = {
  en: `${WIKI_BASE}/api.php`,
  es: `${WIKI_BASE}/es/api.php`
};
const DETAIL_SECTION_TITLES = {
  en: {
    locations: ["Locations", "Location"],
    unlocks: ["Unlocks", "Unlock"]
  },
  es: {
    locations: ["Ubicaciones", "Ubicacion", "Lugares", "Lugar", "Locations", "Location"],
    unlocks: ["Desbloquea", "Desbloqueos", "Desbloqueo", "Unlocks", "Unlock"]
  }
};
const GOOGLE_TRANSLATE_BASE = "https://translate.googleapis.com/translate_a/single";
const MINERVA_DETAIL_FALLBACK_PATH = "data/minerva-detail-fallback.json";
const MINERVA_DETAIL_FALLBACK_IMAGE = "assets/images/minerva-plan-fallback.png";
const MINERVA_DETAIL_IMAGE_PRELOAD_LIMIT = 24;
const MINERVA_INFO_LOCAL_IMAGE_BASE = "assets/images/minerva-locations";
const MINERVA_INFO_REMOTE_IMAGE_BASE = "https://whereisminerva.info/assets/images";
const MINERVA_LOCATION_MAP_BY_LOCATION = {
  Foundation: `${MINERVA_INFO_LOCAL_IMAGE_BASE}/minerva_foundation.png`,
  Crater: `${MINERVA_INFO_LOCAL_IMAGE_BASE}/minerva_crater.png`,
  "Fort Atlas": `${MINERVA_INFO_LOCAL_IMAGE_BASE}/minerva_atlas.png`,
  "The Whitespring": `${MINERVA_INFO_LOCAL_IMAGE_BASE}/minerva_whitespring.jpg`
};
const MINERVA_STORE_IMAGE_BY_LOCATION = {
  Foundation: `${MINERVA_INFO_LOCAL_IMAGE_BASE}/store_minerva_foundation.png`,
  Crater: `${MINERVA_INFO_LOCAL_IMAGE_BASE}/store_minerva_crater.png`,
  "Fort Atlas": `${MINERVA_INFO_LOCAL_IMAGE_BASE}/store_minerva_atlas.png`,
  "The Whitespring": `${MINERVA_INFO_LOCAL_IMAGE_BASE}/store_minerva_whitespring.jpg`
};
const MINERVA_LOCATION_IMAGE_HINTS = [
  { token: "foundation", location: "Foundation" },
  { token: "crater", location: "Crater" },
  { token: "atlas", location: "Fort Atlas" },
  { token: "whitespring", location: "The Whitespring" }
];
const STATIC_SITE_IMAGE_PRELOAD_URLS = [
  "assets/images/appalachia-map-texture.svg",
  "assets/images/output-onlinegiftools.gif",
  "assets/images/StopVaultBoy.png",
  "assets/images/minerva-plan-fallback.png",
  "assets/images/where-is-minerva.png",
  "assets/images/minerva-route-map.svg",
  "assets/images/minerva-merchant.svg",
  "assets/images/image.png",
  ...Object.values(MINERVA_LOCATION_MAP_BY_LOCATION),
  `${MINERVA_INFO_LOCAL_IMAGE_BASE}/store_minerva_foundation.png`,
  `${MINERVA_INFO_LOCAL_IMAGE_BASE}/store_minerva_crater.png`,
  `${MINERVA_INFO_LOCAL_IMAGE_BASE}/store_minerva_atlas.png`,
  `${MINERVA_INFO_LOCAL_IMAGE_BASE}/store_minerva_whitespring.jpg`
];
const CYCLE_LOCATIONS = ["Foundation", "Crater", "Fort Atlas", "The Whitespring"];
const STORAGE_LANG_KEY = "pipboy_lang";
const STORAGE_FILES_DECISION_SEEN_PREFIX = "files_decision_seen_v1";
const PLAN_ITEM_GLYPH = "\uF246";
const GOLD_BULLION_GLYPH = "\uF400";
const SILO_SITE_GLYPHS = {
  Alpha: "\uF24B",
  Bravo: "\uF24C",
  Charlie: "\uF24D"
};
const HACK_TRIGGER_CLICKS = 1;
const HACK_TRIGGER_WINDOW_MS = 4200;
const HACK_ATTEMPTS_MAX = 4;
const HACK_COLUMN_LINE_COUNT = 16;
const HACK_DUMP_WIDTH = 12;
const HACK_WORD_COUNT = 12;
const HACK_PAIR_COUNT = 6;
const HACK_WORD_LENGTH_OPTIONS = [6, 7, 8];
const HACK_ADDRESS_LEFT_BASE = 0xf680;
const HACK_ADDRESS_RIGHT_BASE = 0xf760;
const HACK_LOG_TYPE_CHAR_MS = 6;
const HACK_LOG_TYPE_PUNCT_MS = 9;
const HACK_LOG_TYPE_GAP_MS = 4;
const TYPE_SOUND_MIN_INTERVAL_MS = 24;
const TYPE_SOUND_DURATION_SEC = 0.028;
const TYPE_SOUND_BASE_FREQ = 1180;
const TYPE_SOUND_GAIN = 0.015;
const HACK_WORD_BANK = [
  "OVERSEER",
  "VAULTTEC",
  "REACTORS",
  "PROTOCOL",
  "SECURITY",
  "CLASSIFY",
  "TERMLINK",
  "PIPELINE",
  "BUNKERED",
  "RADIANTS",
  "TRANSMIT",
  "SHELTERS",
  "FIREWALL",
  "PASSWORD",
  "WARHEADS",
  "BULLIONS",
  "INTRUDER",
  "ENCRYPTS",
  "ARCHIVES",
  "RELAYING",
  "SENTRIES",
  "RESEARCH",
  "RESPONSE",
  "VANGUARD",
  "COMMANDS",
  "TITANIUM"
];
const HACK_JUNK_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>/?";
const HACK_BRACKET_PAIRS = [
  ["(", ")"],
  ["[", "]"],
  ["{", "}"],
  ["<", ">"]
];
const VIEW_HASHES = {
  intel: "#intel",
  files: "#files",
  drops: "#drops",
  classified: "#clasified"
};
const FILES_ACCESS_REQUEST_REASON_MAX = 1200;
const FILES_ACCESS_DECLINED_REAPPLY_MS = 7 * 24 * 60 * 60 * 1000;
const FILES_ACCESS_APPROVED_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const FILES_LIVE_IDENTITY_POLL_INTERVAL_MS = 5000;
const FILES_ADMIN_REQUESTS_FEEDBACK_AUTO_HIDE_MS = 5000;
const FILES_UPLOAD_FEEDBACK_AUTO_HIDE_MS = 5000;
const FILES_DISCLAIMER_ACCEPT_MIN_MS = 700;
const FILES_DISCLAIMER_ACCEPT_FADE_MS = 280;
const DISCORD_AUTH_POPUP_WINDOW_NAME = "fallout_codex_discord_auth";
const DISCORD_AUTH_POPUP_PATH = "/auth/discord?popup=1";
const DISCORD_AUTH_POPUP_WIDTH = 540;
const DISCORD_AUTH_POPUP_HEIGHT = 760;
const DISCORD_AUTH_POPUP_POLL_INTERVAL_MS = 450;
const DISCORD_AUTH_POST_MESSAGE_TYPE = "fallout-codex:discord-auth";
const FILES_SHARED_URL_PARAM = "sharedFile";
const FILES_SHARE_ROUTE_PREFIX = "/share/";
const FILES_SHARED_ID_PATTERN = /^[a-f0-9-]{36}$/i;
const FILES_SHARED_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FILES_SHARE_BUTTON_RESET_MS = 1800;
const FILES_DESCRIPTION_FORMATS = [
  {
    key: "alert",
    open: "[alert]",
    close: "[/alert]",
    tagName: "span",
    className: "files-rich-inline is-alert"
  },
  {
    key: "glow",
    open: "[glow]",
    close: "[/glow]",
    tagName: "span",
    className: "files-rich-inline is-glow"
  },
  {
    key: "inverse",
    open: "[inv]",
    close: "[/inv]",
    tagName: "span",
    className: "files-rich-inline is-inverse"
  },
  {
    key: "scan",
    open: "[scan]",
    close: "[/scan]",
    tagName: "span",
    className: "files-rich-inline is-scan"
  },
  {
    key: "signal",
    open: "[sig]",
    close: "[/sig]",
    tagName: "span",
    className: "files-rich-inline is-signal"
  },
  {
    key: "tag",
    open: "[tag]",
    close: "[/tag]",
    tagName: "span",
    className: "files-rich-inline is-tag"
  },
  {
    key: "bi",
    open: "[bi]",
    close: "[/bi]",
    tagName: "span",
    className: "files-rich-inline is-bold-italic"
  },
  {
    key: "hl",
    open: "[hl]",
    close: "[/hl]",
    tagName: "mark",
    className: "files-rich-inline is-highlight"
  },
  {
    key: "b",
    open: "[b]",
    close: "[/b]",
    tagName: "strong",
    className: "files-rich-inline is-bold"
  },
  {
    key: "i",
    open: "[i]",
    close: "[/i]",
    tagName: "em",
    className: "files-rich-inline is-italic"
  },
  {
    key: "u",
    open: "[u]",
    close: "[/u]",
    tagName: "span",
    className: "files-rich-inline is-underline"
  }
];
const FILES_DESCRIPTION_EDITOR_BUTTONS = [
  { format: "b", label: "B", titleKey: "files_description_format_bold" },
  { format: "i", label: "I", titleKey: "files_description_format_italic" },
  { format: "bi", label: "BI", titleKey: "files_description_format_bold_italic" },
  { format: "hl", label: "HL", titleKey: "files_description_format_highlight" },
  { format: "glow", label: "GL", titleKey: "files_description_format_glow" },
  { format: "alert", label: "AL", titleKey: "files_description_format_alert" },
  { format: "inverse", label: "INV", titleKey: "files_description_format_inverse" },
  { format: "scan", label: "SCN", titleKey: "files_description_format_scan" },
  { format: "signal", label: "SIG", titleKey: "files_description_format_signal" },
  { format: "tag", label: "TAG", titleKey: "files_description_format_tag" },
  { format: "u", label: "U", titleKey: "files_description_format_underline" }
];
const FILES_DESCRIPTION_LINK_PATTERN = /(?:https?:\/\/|www\.)[^\s<]+/gi;
const FILES_AUTHORIZED_VISIT_COUNTER_MOBILE_MEDIA = "(hover: none) and (pointer: coarse), (max-width: 1020px)";
const VISIT_COUNTER_EYE_POINTER_MAX_OFFSET_PX = 1.65;
const VISIT_COUNTER_EYE_POINTER_MAX_OFFSET_MOBILE_PX = 1.2;
const VISIT_COUNTER_EYE_POINTER_EASING = 0.2;
const VISIT_COUNTER_EYE_POINTER_SETTLE_PX = 0.02;

