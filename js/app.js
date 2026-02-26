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

const FALLBACK_MINERVA_ANCHOR_UTC = Date.parse("2026-02-16T17:00:00Z");
const MS_DAY = 24 * 60 * 60 * 1000;
const MS_WEEK = 7 * MS_DAY;
const CYCLE_WEEKS = 24;
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
const MINERVA_INFO_LOCAL_IMAGE_BASE = "assets/images/minerva-locations";
const MINERVA_INFO_REMOTE_IMAGE_BASE = "https://whereisminerva.info/assets/images";
const MINERVA_LOCATION_MAP_BY_LOCATION = {
  Foundation: `${MINERVA_INFO_LOCAL_IMAGE_BASE}/minerva_foundation.png`,
  Crater: `${MINERVA_INFO_LOCAL_IMAGE_BASE}/minerva_crater.png`,
  "Fort Atlas": `${MINERVA_INFO_LOCAL_IMAGE_BASE}/minerva_atlas.png`,
  "The Whitespring": `${MINERVA_INFO_LOCAL_IMAGE_BASE}/minerva_whitespring.jpg`
};
const MINERVA_LOCATION_IMAGE_HINTS = [
  { token: "foundation", location: "Foundation" },
  { token: "crater", location: "Crater" },
  { token: "atlas", location: "Fort Atlas" },
  { token: "whitespring", location: "The Whitespring" }
];
const CYCLE_LOCATIONS = ["Foundation", "Crater", "Fort Atlas", "The Whitespring"];
const STORAGE_LANG_KEY = "pipboy_lang";
const PLAN_ITEM_GLYPH = "\uF246";
const GOLD_BULLION_GLYPH = "\uF400";
const SILO_SITE_GLYPHS = {
  Alpha: "\uF24B",
  Bravo: "\uF24C",
  Charlie: "\uF24D"
};
const HACK_TRIGGER_CLICKS = 5;
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

const STRINGS = {
  en: {
    title_doc: "Fallout Codex | Pip-Boy Terminal",
    micro_text: "ROBCO INDUSTRIES (TM) TERMLINK V2.6",
    main_title: "PIP-BOY INTEL TERMINAL",
    tab_status: "STATUS",
    tab_intel: "INTEL",
    tab_data: "DATA",
    lang_label: "LANG",
    label_utc: "UTC CLOCK",
    label_last_sync: "LAST SYNC",
    label_data_link: "DATA LINK",
    refresh_button: "MANUAL SYNC",
    silo_title: "SILO CODES",
    silo_hint: "Weekly reset target: Monday 00:00 UTC",
    silo_source_prefix: "Source:",
    silo_source_suffix: "via CORS proxy",
    minerva_title: "MINERVA INTEL",
    minerva_scanning: "Scanning trade routes...",
    minerva_location_label: "Location",
    minerva_list_label: "List",
    minerva_window_label: "Window",
    minerva_inventory_title: "Inventory + Price",
    table_item_header: "Plan / Item",
    table_price_header: "Gold Bullion",
    minerva_awaiting: "Awaiting response...",
    minerva_source_prefix: "Sources:",
    minerva_source_suffix: "+ local fallback list",
    minerva_location_view_title: "MINERVA LOCATION TRACKER",
    minerva_location_view_back: "RETURN TO INTEL",
    minerva_location_map_label: "Known Route Map",
    minerva_location_status_active: "Minerva is currently at {location}.",
    minerva_location_status_inactive: "Minerva will arrive at {location}.",
    minerva_location_status_unknown: "Location data unavailable.",
    minerva_location_arrives: "Arrives",
    minerva_location_leaves: "Leaves",
    minerva_location_countdown_arrives: "Arrives in",
    minerva_location_countdown_leaves: "Leaves in",
    minerva_location_countdown_now: "Now",
    minerva_detail_back: "RETURN TO LIST",
    minerva_detail_open_source: "OPEN SOURCE PAGE",
    minerva_detail_loading: "Loading plan dossier...",
    minerva_detail_error: "Unable to load plan details right now.",
    minerva_detail_where_label: "Where Else To Get It",
    minerva_detail_unlocks_label: "What This Plan Unlocks",
    minerva_detail_no_other_sources: "No additional source found besides Minerva.",
    minerva_detail_no_unlocks: "Unlock information is unavailable.",
    footer_text: "Community data only. Not affiliated with Bethesda.",
    signal_booting: "BOOTING",
    signal_syncing: "SYNCING",
    signal_online: "ONLINE",
    signal_online_fallback: "ONLINE",
    signal_partial: "PARTIAL",
    signal_offline: "OFFLINE",
    reset_in: "Reset in: {d}d {h}h {m}m {s}s ({ts})",
    silo_expired: "Source reports these codes as expired and awaiting weekly refresh.",
    silo_error: "Unable to fetch silo codes right now.",
    minerva_error_summary: "Unable to fetch Minerva data right now.",
    minerva_error_items: "No Minerva data available.",
    minerva_no_items: "No Minerva items could be resolved.",
    minerva_active_at: "Minerva is currently active at {location}.",
    minerva_transit_to: "Minerva is in transit. Next stop: {location}.",
    next_change: "Next change: {time}",
    window_arrives: "Arrives: {time}",
    window_leaves: "Leaves: {time}",
    window_arrives_short: "ARRIVES",
    window_leaves_short: "LEAVES",
    window_unknown: "Window unavailable.",
    list_value: "List {n}",
    boot_title: "PIP-BOY 3000 MK IV",
    boot_subtitle: "VAULT-TEC PERSONAL INFORMATION PROCESSOR",
    boot_line_1: "Initializing transceiver link...",
    boot_line_2: "Loading Wasteland intelligence feed...",
    boot_line_3: "Calibrating radiation-resistant display...",
    boot_ready: "SYSTEM READY",
    boot_hint_initializing: "Initializing...",
    sync_title: "SYNCING FIELD DATA...",
    classified_loading_title: "LOADING CLASSIFIED ARCHIVES...",
    hack_title: "ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL",
    hack_subtitle: "UNAUTHORIZED TERMINAL ACCESS",
    hack_attempts_label: "ATTEMPTS LEFT:",
    hack_enter_password: "ENTER PASSWORD NOW",
    hack_pick_password: "Pick a password.",
    hack_abort: "ABORT",
    hack_retry: "RETRY",
    hack_open_files: "OPEN FILES",
    hack_log_boot: "ROBCO SECURITY ONLINE.",
    hack_log_ready: "PASSWORD REQUIRED.",
    hack_entry_denied: "ENTRY DENIED.",
    hack_likeness: "LIKENESS={n}/{total}",
    hack_exact_match: "EXACT MATCH!",
    hack_dud_removed: "DUD REMOVED.",
    hack_allowance_replenished: "ALLOWANCE REPLENISHED.",
    hack_access_granted: "ACCESS GRANTED. CLASSIFIED ARCHIVE UNLOCKED.",
    hack_accessing_archive: "ACCESSING ARCHIVE...",
    hack_lockout: "TERMINAL LOCKED. RETRY INTRUSION.",
    classified_main_title: "PIP-BOY CLASSIFIED ARCHIVE",
    classified_title: "[CLASSIFIED] ENCLAVE RELAY ARCHIVE",
    classified_warning: "Unauthorized eyes detected. This archive is restricted to overseer-level clearances.",
    classified_back: "RETURN TO INTEL",
    classified_card1_title: "FILE: OPERATION CINDER TRACE",
    classified_card1_body: "Satellite telemetry indicates repeated launch prep drills near Appalachian silos. Civilian chatter appears unsuspicious.",
    classified_card2_title: "FILE: MINERVA CONTACT CHAIN",
    classified_card2_body: "Merchant route traffic intersects former responder relay nodes. Trade schedule may hide encrypted dead drops.",
    classified_card3_title: "FILE: VAULT-TEC BLACKLIST",
    classified_card3_body: "Access key fragments recovered from deprecated Pip-Boy firmware. Any complete key grants archive-level command injection.",
    classified_minerva_title: "FILE: MINERVA MASTER LISTS",
    classified_minerva_hint: "Decrypted vendor rotation archive. Includes every known list and bullion cost.",
    classified_minerva_empty: "Minerva list archive unavailable.",
    classified_search_label: "Search Item",
    classified_search_placeholder: "Type item name (e.g. gauss minigun)",
    classified_search_hint: "Find the next Minerva sale window for any known item.",
    classified_search_prompt: "Enter an item name to search the archive.",
    classified_search_no_results: "No matching item found in the archive.",
    classified_search_results_count: "Matches: {n}",
    classified_search_item: "Item",
    classified_search_price: "Price",
    classified_search_sale: "Sale",
    classified_search_available: "Available",
    classified_search_days: "Days",
    classified_search_now: "Now",
    classified_sale_standard: "Standard Sale",
    classified_sale_big: "Big Sale",
    classified_days_value: "{n}d"
  },
  es: {
    title_doc: "Fallout Codex | Terminal Pip-Boy",
    micro_text: "ROBCO INDUSTRIES (TM) TERMLINK V2.6",
    main_title: "TERMINAL DE INTEL PIP-BOY",
    tab_status: "ESTADO",
    tab_intel: "INTEL",
    tab_data: "DATOS",
    lang_label: "IDIOMA",
    label_utc: "RELOJ UTC",
    label_last_sync: "ULTIMA SINCRONIZACION",
    label_data_link: "ENLACE DE DATOS",
    refresh_button: "SINCRONIZAR",
    silo_title: "CODIGOS DE SILO",
    silo_hint: "Reinicio semanal objetivo: lunes 00:00 UTC",
    silo_source_prefix: "Fuente:",
    silo_source_suffix: "por proxy CORS",
    minerva_title: "INTEL DE MINERVA",
    minerva_scanning: "Escaneando rutas comerciales...",
    minerva_location_label: "Ubicacion",
    minerva_list_label: "Lista",
    minerva_window_label: "Ventana",
    minerva_inventory_title: "Inventario + Precio",
    table_item_header: "Plano / Item",
    table_price_header: "Oro en lingotes",
    minerva_awaiting: "Esperando respuesta...",
    minerva_source_prefix: "Fuentes:",
    minerva_source_suffix: "+ lista local de respaldo",
    minerva_location_view_title: "RASTREADOR DE UBICACION DE MINERVA",
    minerva_location_view_back: "VOLVER A INTEL",
    minerva_location_map_label: "MAPA DE RUTA CONOCIDA",
    minerva_location_status_active: "Minerva esta actualmente en {location}.",
    minerva_location_status_inactive: "Minerva llegara a {location}.",
    minerva_location_status_unknown: "No hay datos de ubicacion disponibles.",
    minerva_location_arrives: "Llega",
    minerva_location_leaves: "Se va",
    minerva_location_countdown_arrives: "Llega en",
    minerva_location_countdown_leaves: "Se va en",
    minerva_location_countdown_now: "Ahora",
    minerva_detail_back: "VOLVER A LISTA",
    minerva_detail_open_source: "ABRIR FUENTE",
    minerva_detail_loading: "Cargando dossier del plano...",
    minerva_detail_error: "No se pudieron cargar los detalles del plano.",
    minerva_detail_where_label: "Donde Conseguirlo Ademas",
    minerva_detail_unlocks_label: "Que Desbloquea Este Plano",
    minerva_detail_no_other_sources: "No hay otra fuente ademas de Minerva.",
    minerva_detail_no_unlocks: "No hay informacion de desbloqueo disponible.",
    footer_text: "Solo datos de la comunidad. No afiliado con Bethesda.",
    signal_booting: "INICIANDO",
    signal_syncing: "SINCRONIZANDO",
    signal_online: "EN LINEA",
    signal_online_fallback: "EN LINEA",
    signal_partial: "PARCIAL",
    signal_offline: "SIN CONEXION",
    reset_in: "Reinicio en: {d}d {h}h {m}m {s}s ({ts})",
    silo_expired: "La fuente indica que estos codigos estan vencidos y esperando reinicio semanal.",
    silo_error: "No se pudieron cargar los codigos del silo.",
    minerva_error_summary: "No se pudieron cargar los datos de Minerva.",
    minerva_error_items: "No hay datos de Minerva disponibles.",
    minerva_no_items: "No se pudieron resolver items de Minerva.",
    minerva_active_at: "Minerva esta activa en {location}.",
    minerva_transit_to: "Minerva esta en traslado. Proxima parada: {location}.",
    next_change: "Proximo cambio: {time}",
    window_arrives: "Llega: {time}",
    window_leaves: "Se va: {time}",
    window_arrives_short: "LLEGA",
    window_leaves_short: "SE VA",
    window_unknown: "Ventana no disponible.",
    list_value: "Lista {n}",
    boot_title: "PIP-BOY 3000 MK IV",
    boot_subtitle: "PROCESADOR DE INFORMACION PERSONAL VAULT-TEC",
    boot_line_1: "Inicializando enlace de radio...",
    boot_line_2: "Cargando inteligencia del Yermo...",
    boot_line_3: "Calibrando pantalla resistente a radiacion...",
    boot_ready: "SISTEMA LISTO",
    boot_hint_initializing: "Inicializando...",
    sync_title: "SINCRONIZANDO DATOS...",
    classified_loading_title: "CARGANDO ARCHIVOS CLASIFICADOS...",
    hack_title: "ROBCO INDUSTRIES (TM) PROTOCOLO TERMLINK",
    hack_subtitle: "ACCESO NO AUTORIZADO AL TERMINAL",
    hack_attempts_label: "INTENTOS RESTANTES:",
    hack_enter_password: "INTRODUCE CONTRASENA AHORA",
    hack_pick_password: "Elige una contrasena.",
    hack_abort: "ABORTAR",
    hack_retry: "REINTENTAR",
    hack_open_files: "ABRIR ARCHIVOS",
    hack_log_boot: "SEGURIDAD ROBCO EN LINEA.",
    hack_log_ready: "SE REQUIERE CONTRASENA.",
    hack_entry_denied: "ENTRADA DENEGADA.",
    hack_likeness: "COINCIDENCIA={n}/{total}",
    hack_exact_match: "COINCIDENCIA EXACTA!",
    hack_dud_removed: "DUD ELIMINADO.",
    hack_allowance_replenished: "INTENTOS REESTABLECIDOS.",
    hack_access_granted: "ACCESO CONCEDIDO. ARCHIVO CLASIFICADO DESBLOQUEADO.",
    hack_accessing_archive: "ABRIENDO ARCHIVO...",
    hack_lockout: "TERMINAL BLOQUEADO. REINTENTA LA INTRUSION.",
    classified_main_title: "ARCHIVO CLASIFICADO PIP-BOY",
    classified_title: "[CLASIFICADO] ARCHIVO DE RELE ENCLAVE",
    classified_warning: "Ojos no autorizados detectados. Este archivo es solo para nivel de clearance overseer.",
    classified_back: "VOLVER A INTEL",
    classified_card1_title: "ARCHIVO: OPERACION CINDER TRACE",
    classified_card1_body: "La telemetria satelital indica ensayos repetidos de lanzamiento cerca de los silos de Appalachia. El chatter civil parece normal.",
    classified_card2_title: "ARCHIVO: CADENA DE CONTACTO MINERVA",
    classified_card2_body: "El trafico de rutas mercantes cruza nodos ex-responders. El horario comercial puede ocultar dead drops cifrados.",
    classified_card3_title: "ARCHIVO: LISTA NEGRA VAULT-TEC",
    classified_card3_body: "Fragmentos de llave recuperados de firmware Pip-Boy obsoleto. Una llave completa permite inyeccion de comandos de nivel archivo.",
    classified_minerva_title: "ARCHIVO: LISTAS MAESTRAS DE MINERVA",
    classified_minerva_hint: "Archivo descifrado de rotaciones del vendedor. Incluye todas las listas conocidas y su costo en lingotes.",
    classified_minerva_empty: "Archivo de listas de Minerva no disponible.",
    classified_search_label: "Buscar item",
    classified_search_placeholder: "Escribe el nombre del item (ej. gauss minigun)",
    classified_search_hint: "Encuentra la proxima ventana de venta de Minerva para cualquier item.",
    classified_search_prompt: "Escribe un nombre para buscar en el archivo.",
    classified_search_no_results: "No se encontro ningun item coincidente en el archivo.",
    classified_search_results_count: "Coincidencias: {n}",
    classified_search_item: "Item",
    classified_search_price: "Precio",
    classified_search_sale: "Venta",
    classified_search_available: "Disponible",
    classified_search_days: "Dias",
    classified_search_now: "Ahora",
    classified_sale_standard: "Venta estandar",
    classified_sale_big: "Gran venta",
    classified_days_value: "{n}d"
  }
};

const state = {
  lang: "en",
  signalKey: "booting",
  minervaLists: null,
  silo: {
    error: false,
    codes: null,
    isExpired: false,
    resetTargetUtc: null
  },
  minerva: {
    error: false,
    data: null
  },
  minervaDetail: {
    open: false,
    loading: false,
    error: "",
    item: null,
    data: null,
    requestId: 0,
    cache: {},
    translationCache: {},
    fallbackByKey: null,
    fallbackPromise: null,
    fallbackImageUrl: MINERVA_DETAIL_FALLBACK_IMAGE
  },
  minervaLocation: {
    open: false,
    countdownTargetMs: null,
    countdownMode: ""
  },
  classifiedSearch: {
    query: "",
    entries: []
  },
  easterEgg: {
    unlocked: false,
    triggerClicks: 0,
    triggerWindowStart: 0,
    hack: null,
    logAnimation: {
      requestId: 0,
      timer: null,
      displayedText: ""
    }
  },
  audio: {
    context: null,
    lastTypeSoundAt: 0
  }
};

const elements = {
  bootOverlay: document.getElementById("bootOverlay"),
  bootTitle: document.getElementById("bootTitle"),
  bootSubtitle: document.getElementById("bootSubtitle"),
  bootLog: document.getElementById("bootLog"),
  bootBar: document.getElementById("bootBar"),
  bootHint: document.getElementById("bootHint"),
  bootLine1: document.getElementById("bootLine1"),
  bootLine2: document.getElementById("bootLine2"),
  bootLine3: document.getElementById("bootLine3"),
  bootReady: document.getElementById("bootReady"),
  hackOverlay: document.getElementById("hackOverlay"),
  hackTitle: document.getElementById("hackTitle"),
  hackSubtitle: document.getElementById("hackSubtitle"),
  hackAttemptsLabel: document.getElementById("hackAttemptsLabel"),
  hackAttempts: document.getElementById("hackAttempts"),
  hackMemory: document.getElementById("hackMemory"),
  hackLog: document.getElementById("hackLog"),
  hackAbortBtn: document.getElementById("hackAbortBtn"),
  hackRetryBtn: document.getElementById("hackRetryBtn"),
  hackOpenClassifiedBtn: document.getElementById("hackOpenClassifiedBtn"),
  syncOverlay: document.getElementById("syncOverlay"),
  syncTitle: document.getElementById("syncTitle"),
  classifiedLoadOverlay: document.getElementById("classifiedLoadOverlay"),
  classifiedLoadTitle: document.getElementById("classifiedLoadTitle"),
  microText: document.getElementById("microText"),
  mainTitle: document.getElementById("mainTitle"),
  tabStatus: document.getElementById("tabStatus"),
  tabIntel: document.getElementById("tabIntel"),
  tabData: document.getElementById("tabData"),
  langLabel: document.getElementById("langLabel"),
  langDropdown: document.getElementById("langDropdown"),
  langToggleBtn: document.getElementById("langToggleBtn"),
  langMenu: document.getElementById("langMenu"),
  langCurrent: document.getElementById("langCurrent"),
  langOptions: Array.from(document.querySelectorAll(".lang-option")),
  langSelect: document.getElementById("langSelect"),
  labelUtc: document.getElementById("labelUtc"),
  labelLastSync: document.getElementById("labelLastSync"),
  labelDataLink: document.getElementById("labelDataLink"),
  statusStrip: document.getElementById("statusStrip"),
  utcTime: document.getElementById("utcTime"),
  lastRefresh: document.getElementById("lastRefresh"),
  dataSignal: document.getElementById("dataSignal"),
  refreshBtn: document.getElementById("refreshBtn"),
  intelGrid: document.getElementById("intelGrid"),
  siloTitle: document.getElementById("siloTitle"),
  siloHint: document.getElementById("siloHint"),
  siloExpiry: document.getElementById("siloExpiry"),
  siloCodes: document.getElementById("siloCodes"),
  siloSourcePrefix: document.getElementById("siloSourcePrefix"),
  siloSourceSuffix: document.getElementById("siloSourceSuffix"),
  minervaTitle: document.getElementById("minervaTitle"),
  minervaSummary: document.getElementById("minervaSummary"),
  minervaLocationLabel: document.getElementById("minervaLocationLabel"),
  minervaListLabel: document.getElementById("minervaListLabel"),
  minervaWindowLabel: document.getElementById("minervaWindowLabel"),
  minervaLocationCardBtn: document.getElementById("minervaLocationCardBtn"),
  minervaLocation: document.getElementById("minervaLocation"),
  minervaList: document.getElementById("minervaList"),
  minervaWindow: document.getElementById("minervaWindow"),
  minervaInventoryTitle: document.getElementById("minervaInventoryTitle"),
  tableItemHeader: document.getElementById("tableItemHeader"),
  tablePriceHeader: document.getElementById("tablePriceHeader"),
  minervaItems: document.getElementById("minervaItems"),
  minervaAwaiting: document.getElementById("minervaAwaiting"),
  minervaSourcePrefix: document.getElementById("minervaSourcePrefix"),
  minervaSourceSuffix: document.getElementById("minervaSourceSuffix"),
  minervaPanel: document.getElementById("minervaPanel"),
  minervaDetailView: document.getElementById("minervaDetailView"),
  minervaDetailBackBtn: document.getElementById("minervaDetailBackBtn"),
  minervaDetailWikiLink: document.getElementById("minervaDetailWikiLink"),
  minervaDetailName: document.getElementById("minervaDetailName"),
  minervaDetailStatus: document.getElementById("minervaDetailStatus"),
  minervaDetailContent: document.getElementById("minervaDetailContent"),
  minervaDetailImage: document.getElementById("minervaDetailImage"),
  minervaDetailWhereLabel: document.getElementById("minervaDetailWhereLabel"),
  minervaDetailWhereList: document.getElementById("minervaDetailWhereList"),
  minervaDetailUnlocksLabel: document.getElementById("minervaDetailUnlocksLabel"),
  minervaDetailUnlocks: document.getElementById("minervaDetailUnlocks"),
  minervaLocationView: document.getElementById("minervaLocationView"),
  minervaLocationBackBtn: document.getElementById("minervaLocationBackBtn"),
  minervaLocationTitle: document.getElementById("minervaLocationTitle"),
  minervaLocationStatus: document.getElementById("minervaLocationStatus"),
  minervaLocationMapLabel: document.getElementById("minervaLocationMapLabel"),
  minervaLocationMapImage: document.getElementById("minervaLocationMapImage"),
  minervaLocationPinsWrap: document.getElementById("minervaLocationPins"),
  minervaLocationMapName: document.getElementById("minervaLocationMapName"),
  minervaLocationArrivesLabel: document.getElementById("minervaLocationArrivesLabel"),
  minervaLocationArrives: document.getElementById("minervaLocationArrives"),
  minervaLocationLeavesLabel: document.getElementById("minervaLocationLeavesLabel"),
  minervaLocationLeaves: document.getElementById("minervaLocationLeaves"),
  minervaLocationCountdownLabel: document.getElementById("minervaLocationCountdownLabel"),
  minervaLocationCountdown: document.getElementById("minervaLocationCountdown"),
  minervaLocationPins: Array.from(document.querySelectorAll(".minerva-loc-pin")),
  classifiedPage: document.getElementById("classifiedPage"),
  classifiedTitle: document.getElementById("classifiedTitle"),
  classifiedWarning: document.getElementById("classifiedWarning"),
  classifiedBackBtn: document.getElementById("classifiedBackBtn"),
  classifiedCard1Title: document.getElementById("classifiedCard1Title"),
  classifiedCard1Body: document.getElementById("classifiedCard1Body"),
  classifiedCard2Title: document.getElementById("classifiedCard2Title"),
  classifiedCard2Body: document.getElementById("classifiedCard2Body"),
  classifiedCard3Title: document.getElementById("classifiedCard3Title"),
  classifiedCard3Body: document.getElementById("classifiedCard3Body"),
  classifiedMinervaTitle: document.getElementById("classifiedMinervaTitle"),
  classifiedMinervaHint: document.getElementById("classifiedMinervaHint"),
  classifiedSearchLabel: document.getElementById("classifiedSearchLabel"),
  classifiedSearchInput: document.getElementById("classifiedSearchInput"),
  classifiedSearchHint: document.getElementById("classifiedSearchHint"),
  classifiedSearchResults: document.getElementById("classifiedSearchResults"),
  classifiedMinervaLists: document.getElementById("classifiedMinervaLists"),
  footerText: document.getElementById("footerText")
};

function t(key, vars = {}) {
  const dictionary = STRINGS[state.lang] || STRINGS.en;
  const template = dictionary[key] || STRINGS.en[key] || key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ""));
}

function proxied(url) {
  return `${PROXY_BASE}${encodeURIComponent(url)}`;
}

function detectInitialLanguage() {
  const stored = localStorage.getItem(STORAGE_LANG_KEY);
  if (stored === "en" || stored === "es") {
    return stored;
  }

  return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
}

function ensureAudioContext() {
  if (state.audio.context) {
    return state.audio.context;
  }

  const ContextClass = window.AudioContext || window.webkitAudioContext;
  if (!ContextClass) {
    return null;
  }

  try {
    state.audio.context = new ContextClass();
  } catch (error) {
    state.audio.context = null;
  }

  return state.audio.context;
}

function primeAudioContext() {
  const context = ensureAudioContext();
  if (!context || context.state !== "suspended") {
    return;
  }

  context.resume().catch(() => {});
}

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  if (target instanceof HTMLTextAreaElement) {
    return !target.disabled && !target.readOnly;
  }

  if (target instanceof HTMLInputElement) {
    if (target.disabled || target.readOnly) {
      return false;
    }
    const type = String(target.type || "text").toLowerCase();
    return [
      "text",
      "search",
      "url",
      "email",
      "tel",
      "password",
      "number"
    ].includes(type);
  }

  return false;
}

function playTypeTickSound() {
  const nowMs = performance.now();
  if (nowMs - state.audio.lastTypeSoundAt < TYPE_SOUND_MIN_INTERVAL_MS) {
    return;
  }
  state.audio.lastTypeSoundAt = nowMs;

  const context = ensureAudioContext();
  if (!context || context.state !== "running") {
    return;
  }

  const startAt = context.currentTime + 0.001;
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const freqJitter = (Math.random() * 60) - 30;

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(TYPE_SOUND_BASE_FREQ + freqJitter, startAt);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(220, TYPE_SOUND_BASE_FREQ - 120 + freqJitter),
    startAt + TYPE_SOUND_DURATION_SEC
  );

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1900, startAt);
  filter.Q.setValueAtTime(0.8, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(TYPE_SOUND_GAIN, startAt + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + TYPE_SOUND_DURATION_SEC);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + TYPE_SOUND_DURATION_SEC + 0.003);
}

function formatReadableDateTime(
  date,
  {
    includeSeconds = false,
    timeZone = "UTC",
    includeWeekday = true,
    includeYear = true,
    zoneLabel = ""
  } = {}
) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "--";
  }

  const locale = state.lang === "es" ? "es-ES" : "en-US";
  const dateOptions = {
    day: "2-digit",
    month: "short",
    timeZone
  };

  if (includeWeekday) {
    dateOptions.weekday = "short";
  }
  if (includeYear) {
    dateOptions.year = "numeric";
  }

  const timeOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone
  };

  if (includeSeconds) {
    timeOptions.second = "2-digit";
  }

  const datePart = new Intl.DateTimeFormat(locale, dateOptions).format(date).replace(/,/g, "");
  const timePart = new Intl.DateTimeFormat(locale, timeOptions).format(date);
  const zonePart = zoneLabel ? ` ${zoneLabel}` : "";
  return `${datePart} ${timePart}${zonePart}`;
}

function parseBethesdaRawDateTime(raw) {
  const match = String(raw || "").match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  let hour = Number(match[4]);
  const minute = Number(match[5]);
  const meridiem = match[6].toUpperCase();

  if (meridiem === "PM" && hour < 12) {
    hour += 12;
  }
  if (meridiem === "AM" && hour === 12) {
    hour = 0;
  }

  // NukaCrypt/Minerva source uses Bethesda Time (US Eastern). Convert approximately via UTC-05:00 baseline.
  const utcMs = Date.UTC(year, month - 1, day, hour + 5, minute, 0);
  return Number.isNaN(utcMs) ? null : new Date(utcMs);
}

function formatBethesdaRawDateTime(raw) {
  const parsed = parseBethesdaRawDateTime(raw);
  if (!parsed) {
    return raw || "--";
  }
  return formatEtDisplay(parsed);
}

function formatUtc(now = new Date()) {
  return formatReadableDateTime(now, {
    includeSeconds: true,
    timeZone: "UTC",
    includeWeekday: true,
    includeYear: false,
    zoneLabel: "UTC"
  });
}

function formatLastSync(now = new Date()) {
  return formatReadableDateTime(now, {
    includeSeconds: false,
    timeZone: "UTC",
    includeWeekday: true,
    includeYear: false,
    zoneLabel: "UTC"
  });
}

function formatStamp(date) {
  return formatEtDisplay(date);
}

function formatEtDisplay(date, { includeWeekday = true, includeYear = true } = {}) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "--";
  }

  const locale = state.lang === "es" ? "es-ES" : "en-US";
  const dateOptions = {
    month: "short",
    day: "2-digit",
    timeZone: "America/New_York"
  };
  if (includeWeekday) {
    dateOptions.weekday = "short";
  }
  if (includeYear) {
    dateOptions.year = "numeric";
  }

  const timeOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: state.lang !== "es",
    timeZone: "America/New_York"
  };

  const datePart = new Intl.DateTimeFormat(locale, dateOptions).format(date).replace(/,/g, "");
  const timePart = new Intl.DateTimeFormat(locale, timeOptions).format(date).replace(/\s+/g, " ").trim();
  return `${datePart} | ${timePart} ET`;
}

function formatEtCompact(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "--";
  }

  const formatWeekdayToken = (rawWeekday) => {
    const cleaned = String(rawWeekday || "").replace(/\./g, "").trim();
    if (!cleaned) {
      return "";
    }

    if (state.lang === "es") {
      const normalized = cleaned
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const key = normalized.slice(0, 3);
      const esMap = {
        lun: "LUN",
        mar: "MAR",
        mie: "MIER",
        jue: "JUE",
        vie: "VIE",
        sab: "SAB",
        dom: "DOM"
      };
      return esMap[key] || cleaned.toUpperCase();
    }

    return cleaned.toUpperCase();
  };

  const locale = state.lang === "es" ? "es-ES" : "en-US";
  const dateParts = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "2-digit",
    timeZone: "America/New_York"
  }).formatToParts(date);
  const weekdayRaw = dateParts
    .find((part) => part.type === "weekday")
    ?.value
    ?.trim() || "";
  const weekdayPart = formatWeekdayToken(weekdayRaw);
  const dayPart = dateParts.find((part) => part.type === "day")?.value || "";
  let timePart = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York"
  }).format(date).replace(/\s+/g, " ").trim();
  timePart = timePart
    .replace(/a\.?\s*m\.?/i, "AM")
    .replace(/p\.?\s*m\.?/i, "PM");

  return `${weekdayPart} ${dayPart} ${timePart}`.trim();
}

function formatMinervaWindowStatus(data) {
  if (!data || typeof data !== "object") {
    return t("window_unknown");
  }

  const isActive = Boolean(data.active);
  const shortLabelKey = isActive ? "window_leaves_short" : "window_arrives_short";
  const toCardLine = (timeText) => `${t(shortLabelKey)}\n${timeText}`;

  if (data.nextChange) {
    const parsed = parseBethesdaRawDateTime(data.nextChange);
    const timeValue = parsed ? formatEtCompact(parsed) : String(data.nextChange || "--");
    return toCardLine(timeValue);
  }

  const targetDate = isActive ? data.eventEnd : data.eventStart;
  if (targetDate instanceof Date && !Number.isNaN(targetDate.getTime())) {
    return toCardLine(formatEtCompact(targetDate));
  }

  return t("window_unknown");
}

function formatMinervaCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (state.lang === "es") {
    return `${days} ${days === 1 ? "dia" : "dias"} ${hours} horas ${minutes} min ${seconds} seg`;
  }
  return `${days} ${days === 1 ? "day" : "days"} ${hours} hours ${minutes} min ${seconds} sec`;
}

function formatMinervaLocationDate(date, mode = "") {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "--";
  }

  const locale = state.lang === "es" ? "es-ES" : "en-GB";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function asValidDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  return null;
}

function resolveMinervaWindowDates(data) {
  const nextChangeDate = data?.nextChange ? parseBethesdaRawDateTime(data.nextChange) : null;
  const active = Boolean(data?.active);
  const eventStart = asValidDate(data?.eventStart) || (!active ? nextChangeDate : null);
  const eventEnd = asValidDate(data?.eventEnd) || (active ? nextChangeDate : null);
  return { eventStart, eventEnd };
}

function setMinervaLocationCountdownTarget(targetDate, mode = "") {
  const validTarget = asValidDate(targetDate);
  state.minervaLocation.countdownTargetMs = validTarget ? validTarget.getTime() : null;
  state.minervaLocation.countdownMode = mode === "leaves" ? "leaves" : "arrives";
  updateMinervaLocationCountdown();
}

function updateMinervaLocationCountdown(nowMs = Date.now()) {
  if (!elements.minervaLocationCountdown || !elements.minervaLocationCountdownLabel || !state.minervaLocation.open) {
    return;
  }

  const labelKey = state.minervaLocation.countdownMode === "leaves"
    ? "minerva_location_countdown_leaves"
    : "minerva_location_countdown_arrives";
  elements.minervaLocationCountdownLabel.textContent = t(labelKey);

  if (!Number.isFinite(state.minervaLocation.countdownTargetMs)) {
    elements.minervaLocationCountdown.textContent = "--";
    return;
  }

  const remainingMs = state.minervaLocation.countdownTargetMs - nowMs;
  if (remainingMs <= 0) {
    elements.minervaLocationCountdown.textContent = t("minerva_location_countdown_now");
    return;
  }

  elements.minervaLocationCountdown.textContent = formatMinervaCountdown(remainingMs);
}

function syncMinervaLocationMapPins(location) {
  const normalizedTarget = normalizeLocation(location);
  if (!Array.isArray(elements.minervaLocationPins)) {
    return;
  }

  elements.minervaLocationPins.forEach((pin) => {
    const isTarget = normalizeLocation(pin.dataset.location || "") === normalizedTarget && normalizedTarget !== "--";
    pin.classList.toggle("is-target", isTarget);
    pin.setAttribute("aria-current", isTarget ? "true" : "false");
    pin.hidden = !isTarget;
    pin.setAttribute("aria-hidden", isTarget ? "false" : "true");
  });
}

function renderMinervaLocationView() {
  if (
    !state.minervaLocation.open
    || !elements.minervaLocationView
    || !elements.minervaLocationStatus
    || !elements.minervaLocationArrives
    || !elements.minervaLocationLeaves
  ) {
    return;
  }

  const data = state.minerva.data;
  if (!data) {
    elements.minervaLocationStatus.textContent = t("minerva_location_status_unknown");
    elements.minervaLocationArrives.textContent = "--";
    elements.minervaLocationLeaves.textContent = "--";
    if (elements.minervaLocationMapImage) {
      elements.minervaLocationMapImage.src = "assets/images/minerva-route-map.svg";
      elements.minervaLocationMapImage.alt = "Appalachia route map";
    }
    if (elements.minervaLocationPinsWrap) {
      elements.minervaLocationPinsWrap.hidden = false;
    }
    if (elements.minervaLocationMapName) {
      elements.minervaLocationMapName.textContent = "--";
      elements.minervaLocationMapName.hidden = true;
    }
    syncMinervaLocationMapPins("--");
    setMinervaLocationCountdownTarget(null, "arrives");
    return;
  }

  const location = normalizeLocation(data.location || "--");
  const locationByMapImage = inferLocationFromMapImage(data.locationMapImage || "");
  const mapLocation = location !== "--" ? location : locationByMapImage;
  const localizedLocation = localizeLocation(location);
  const localizedMapLocation = localizeLocation(mapLocation);
  if (elements.minervaLocationMapName) {
    elements.minervaLocationMapName.textContent = localizedMapLocation === "--"
      ? t("minerva_location_map_label")
      : localizedMapLocation;
    elements.minervaLocationMapName.hidden = false;
  }
  const statusLocation = localizedLocation === "--" ? localizedMapLocation : localizedLocation;
  if (statusLocation === "--") {
    elements.minervaLocationStatus.textContent = t("minerva_location_status_unknown");
  } else {
    elements.minervaLocationStatus.textContent = data.active
      ? t("minerva_location_status_active", { location: statusLocation })
      : t("minerva_location_status_inactive", { location: statusLocation });
  }

  const { eventStart, eventEnd } = resolveMinervaWindowDates(data);
  elements.minervaLocationArrives.textContent = eventStart
    ? formatMinervaLocationDate(eventStart, data.mode)
    : "--";
  elements.minervaLocationLeaves.textContent = eventEnd
    ? formatMinervaLocationDate(eventEnd, data.mode)
    : "--";

  if (elements.minervaLocationMapImage) {
    const defaultMapImage = "assets/images/minerva-route-map.svg";
    const mapImageSrc = String(data.locationMapImage || "").trim();
    const useLocationImage = Boolean(mapImageSrc);
    const finalMapSrc = useLocationImage ? mapImageSrc : defaultMapImage;

    if ((elements.minervaLocationMapImage.getAttribute("src") || "") !== finalMapSrc) {
      elements.minervaLocationMapImage.src = finalMapSrc;
    }
    elements.minervaLocationMapImage.alt = useLocationImage
      ? `${localizedMapLocation === "--" ? "Appalachia" : localizedMapLocation} map marker`
      : "Appalachia route map";

    if (elements.minervaLocationPinsWrap) {
      elements.minervaLocationPinsWrap.hidden = useLocationImage;
    }
  }

  if (!elements.minervaLocationPinsWrap?.hidden) {
    syncMinervaLocationMapPins(location);
  }
  setMinervaLocationCountdownTarget(data.active ? eventEnd : eventStart, data.active ? "leaves" : "arrives");
}

function nextResetUtc(now = new Date()) {
  const reset = new Date(now);
  reset.setUTCDate(now.getUTCDate() + ((8 - now.getUTCDay()) % 7));
  reset.setUTCHours(0, 0, 0, 0);
  if (reset <= now) {
    reset.setUTCDate(reset.getUTCDate() + 7);
  }
  return reset;
}

function updateClock() {
  elements.utcTime.textContent = formatUtc();

  const nowMs = Date.now();
  const fallbackTarget = nextResetUtc().getTime();
  const targetUtc = Number.isFinite(state.silo.resetTargetUtc) && state.silo.resetTargetUtc > nowMs
    ? state.silo.resetTargetUtc
    : fallbackTarget;

  const totalSeconds = Math.max(0, Math.floor((targetUtc - nowMs) / 1000));
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const ts = formatReadableDateTime(new Date(targetUtc), {
    includeSeconds: false,
    timeZone: "UTC",
    includeWeekday: true,
    includeYear: false,
    zoneLabel: "UTC"
  });

  elements.siloExpiry.textContent = t("reset_in", { d, h, m, s, ts });
  updateMinervaLocationCountdown(nowMs);
}

function setSignal(key) {
  state.signalKey = key;
  elements.dataSignal.textContent = t(`signal_${key}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setupBackgroundParallax() {
  const root = document.documentElement;
  if (!root) {
    return;
  }

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (prefersReducedMotion) {
    root.style.setProperty("--map-parallax-x", "0px");
    root.style.setProperty("--map-parallax-y", "0px");
    return;
  }

  let pointerX = 0;
  let pointerY = 0;
  let scrollAmount = 0;
  let rafId = 0;

  const apply = () => {
    rafId = 0;
    const x = pointerX * 10.5;
    const y = pointerY * 7.5 - scrollAmount * 0.015;
    root.style.setProperty("--map-parallax-x", `${x.toFixed(2)}px`);
    root.style.setProperty("--map-parallax-y", `${y.toFixed(2)}px`);
  };

  const schedule = () => {
    if (!rafId) {
      rafId = window.requestAnimationFrame(apply);
    }
  };

  const handlePointerMove = (event) => {
    const width = Math.max(1, window.innerWidth || 1);
    const height = Math.max(1, window.innerHeight || 1);
    pointerX = (event.clientX / width - 0.5) * 2;
    pointerY = (event.clientY / height - 0.5) * 2;
    schedule();
  };

  const handleScroll = () => {
    const y = window.scrollY || window.pageYOffset || 0;
    scrollAmount = Math.max(-220, Math.min(220, y));
    schedule();
  };

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });

  handleScroll();
  schedule();
}

function showSyncOverlay(active) {
  if (!elements.syncOverlay) {
    return;
  }

  document.body.classList.toggle("is-syncing", active);
  if (active) {
    showClassifiedLoadOverlay(false);
  }
  elements.syncOverlay.classList.toggle("is-active", active);
  elements.syncOverlay.setAttribute("aria-hidden", active ? "false" : "true");
}

function showClassifiedLoadOverlay(active) {
  if (!elements.classifiedLoadOverlay) {
    return;
  }

  if (active) {
    showSyncOverlay(false);
  }
  document.body.classList.toggle("is-classified-loading", active);
  elements.classifiedLoadOverlay.classList.toggle("is-active", active);
  elements.classifiedLoadOverlay.setAttribute("aria-hidden", active ? "false" : "true");
}

function setLanguageMenuOpen(active) {
  if (!elements.langDropdown || !elements.langToggleBtn || !elements.langMenu) {
    return;
  }

  elements.langDropdown.classList.toggle("is-open", active);
  elements.langToggleBtn.setAttribute("aria-expanded", active ? "true" : "false");
  elements.langMenu.hidden = !active;
}

function syncLanguageMenu() {
  if (elements.langCurrent) {
    elements.langCurrent.textContent = state.lang.toUpperCase();
  }

  if (!Array.isArray(elements.langOptions)) {
    return;
  }

  elements.langOptions.forEach((option) => {
    const selected = option.dataset.lang === state.lang;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-selected", selected ? "true" : "false");
  });
}

function applyStaggeredReveal(nodes, stepMs = 45, maxItems = 18) {
  nodes.forEach((node, idx) => {
    node.classList.remove("reveal-item");
    node.style.animationDelay = "0ms";
    if (idx < maxItems) {
      node.style.animationDelay = `${idx * stepMs}ms`;
      node.classList.add("reveal-item");
    }
  });
}

function shuffleCopy(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomJunkChunk(length) {
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += HACK_JUNK_CHARS[Math.floor(Math.random() * HACK_JUNK_CHARS.length)];
  }
  return output;
}

function makeAddress(baseAddress, index) {
  return `0x${(baseAddress + index * HACK_DUMP_WIDTH).toString(16).toUpperCase().padStart(4, "0")}`;
}

function createHackColumn(baseAddress) {
  const lines = Array.from({ length: HACK_COLUMN_LINE_COUNT }, (_, index) => {
    return {
      address: makeAddress(baseAddress, index),
      chars: Array.from({ length: HACK_DUMP_WIDTH }, () => {
        return HACK_JUNK_CHARS[Math.floor(Math.random() * HACK_JUNK_CHARS.length)];
      }),
      tokens: []
    };
  });

  return {
    baseAddress,
    lines
  };
}

function canPlaceHackToken(line, start, length) {
  return !line.tokens.some((token) => {
    return start <= token.end && start + length - 1 >= token.start;
  });
}

function placeHackToken(line, token) {
  line.tokens.push(token);
  line.tokens.sort((a, b) => a.start - b.start);

  for (let i = 0; i < token.text.length; i += 1) {
    line.chars[token.start + i] = token.text[i];
  }
}

function placeTextTokenInColumn(column, text, tokenProps = {}) {
  const length = text.length;
  if (!column || length > HACK_DUMP_WIDTH) {
    return false;
  }

  for (let tries = 0; tries < 320; tries += 1) {
    const lineIndex = Math.floor(Math.random() * column.lines.length);
    const line = column.lines[lineIndex];
    const start = Math.floor(Math.random() * (HACK_DUMP_WIDTH - length + 1));
    if (!canPlaceHackToken(line, start, length)) {
      continue;
    }

    placeHackToken(line, {
      ...tokenProps,
      text,
      start,
      end: start + length - 1
    });
    return true;
  }

  return false;
}

function chooseHackWordLength(wordsByLength) {
  const preferred = HACK_WORD_LENGTH_OPTIONS.filter((length) => {
    const pool = wordsByLength[String(length)] || [];
    return pool.length >= HACK_WORD_COUNT;
  });

  if (preferred.length) {
    return preferred[Math.floor(Math.random() * preferred.length)];
  }

  const fallback = Object.entries(wordsByLength)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([length]) => Number(length))
    .find((length) => Number.isFinite(length));

  return fallback || HACK_WORD_LENGTH_OPTIONS[0];
}

function buildHackBoard(candidates) {
  const leftColumn = createHackColumn(HACK_ADDRESS_LEFT_BASE);
  const rightColumn = createHackColumn(HACK_ADDRESS_RIGHT_BASE);
  const columns = [leftColumn, rightColumn];

  for (let idx = 0; idx < candidates.length; idx += 1) {
    const word = candidates[idx];
    const primary = columns[idx % columns.length];
    const secondary = columns[(idx + 1) % columns.length];
    const placed = placeTextTokenInColumn(primary, word, { type: "word", word })
      || placeTextTokenInColumn(secondary, word, { type: "word", word });
    if (!placed) {
      return null;
    }
  }

  let pairId = 0;
  let ensureDud = true;
  const pairEffects = new Map();

  for (let idx = 0; idx < HACK_PAIR_COUNT; idx += 1) {
    const [open, close] = HACK_BRACKET_PAIRS[Math.floor(Math.random() * HACK_BRACKET_PAIRS.length)];
    const innerLength = 2 + Math.floor(Math.random() * 5);
    const pairText = `${open}${randomJunkChunk(innerLength)}${close}`;
    const primary = columns[idx % columns.length];
    const secondary = columns[(idx + 1) % columns.length];

    pairId += 1;
    let effect = Math.random() < 0.6 ? "dud" : "allowance";
    if (ensureDud) {
      effect = "dud";
    }

    const placed = placeTextTokenInColumn(primary, pairText, { type: "pair", pairId })
      || placeTextTokenInColumn(secondary, pairText, { type: "pair", pairId });
    if (!placed) {
      pairId -= 1;
      continue;
    }

    pairEffects.set(pairId, effect);
    if (effect === "dud") {
      ensureDud = false;
    }
  }

  if (!pairEffects.size) {
    return null;
  }

  return {
    columns,
    pairEffects
  };
}

function likenessCount(input, target) {
  let likeness = 0;
  for (let i = 0; i < Math.min(input.length, target.length); i += 1) {
    if (input[i] === target[i]) {
      likeness += 1;
    }
  }
  return likeness;
}

function createHackSession() {
  const wordsByLength = HACK_WORD_BANK.reduce((map, word) => {
    const key = String(word.length);
    if (!map[key]) {
      map[key] = [];
    }
    map[key].push(word);
    return map;
  }, {});
  const chosenLength = chooseHackWordLength(wordsByLength);
  const sourceWords = wordsByLength[String(chosenLength)] || [];
  const activePool = sourceWords.length ? sourceWords : HACK_WORD_BANK;
  const password = activePool[Math.floor(Math.random() * activePool.length)];
  const decoys = shuffleCopy(activePool.filter((word) => word !== password)).slice(0, HACK_WORD_COUNT - 1);
  const candidates = shuffleCopy([password, ...decoys]);

  let board = null;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    board = buildHackBoard(candidates);
    if (board) {
      break;
    }
  }

  if (!board) {
    board = {
      columns: [createHackColumn(HACK_ADDRESS_LEFT_BASE), createHackColumn(HACK_ADDRESS_RIGHT_BASE)],
      pairEffects: new Map()
    };
  }

  return {
    password,
    candidates,
    columns: board.columns,
    pairEffects: board.pairEffects,
    attempts: HACK_ATTEMPTS_MAX,
    usedWords: new Set(),
    removedWords: new Set(),
    usedPairs: new Set(),
    solved: false,
    locked: false,
    logs: [t("hack_log_boot"), t("hack_log_ready")]
  };
}

function appendHackLog(message) {
  if (!state.easterEgg.hack) {
    return;
  }

  const lines = Array.isArray(message) ? message : [message];
  state.easterEgg.hack.logs.push(...lines);
  if (state.easterEgg.hack.logs.length > 14) {
    state.easterEgg.hack.logs.splice(0, state.easterEgg.hack.logs.length - 14);
  }
}

function clearHackLogAnimationTimer() {
  const animation = state.easterEgg.logAnimation;
  if (animation.timer) {
    clearTimeout(animation.timer);
    animation.timer = null;
  }
}

function resetHackLogAnimation(clearRendered = false) {
  const animation = state.easterEgg.logAnimation;
  animation.requestId += 1;
  clearHackLogAnimationTimer();
  if (clearRendered) {
    animation.displayedText = "";
    if (elements.hackLog) {
      elements.hackLog.textContent = "";
      elements.hackLog.scrollTop = 0;
    }
  }
}

function setHackLogRenderedText(text) {
  if (!elements.hackLog) {
    return;
  }

  elements.hackLog.textContent = text;
  elements.hackLog.scrollTop = elements.hackLog.scrollHeight;
  state.easterEgg.logAnimation.displayedText = text;
}

function sharedPrefixLength(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  const max = Math.min(left.length, right.length);
  let idx = 0;
  while (idx < max && left[idx] === right[idx]) {
    idx += 1;
  }
  return idx;
}

function linePrefixLength(lines, count) {
  let length = 0;
  for (let i = 0; i < count; i += 1) {
    length += lines[i].length;
    if (i < count - 1) {
      length += 1;
    }
  }
  return length;
}

function sameLineSlice(leftLines, leftStart, rightLines, rightStart, count) {
  for (let i = 0; i < count; i += 1) {
    if (leftLines[leftStart + i] !== rightLines[rightStart + i]) {
      return false;
    }
  }
  return true;
}

function sharedShiftedLinePrefixLength(currentText, targetText) {
  const current = String(currentText || "");
  const target = String(targetText || "");
  if (!current || !target) {
    return 0;
  }

  const currentLines = current.split("\n");
  const targetLines = target.split("\n");
  const maxOverlap = Math.min(currentLines.length, targetLines.length);
  for (let overlap = maxOverlap; overlap > 0; overlap -= 1) {
    const currentStart = currentLines.length - overlap;
    if (!sameLineSlice(currentLines, currentStart, targetLines, 0, overlap)) {
      continue;
    }

    return linePrefixLength(targetLines, overlap);
  }

  return 0;
}

function hackLogCharDelay(character) {
  if (!character || character === "\n") {
    return HACK_LOG_TYPE_GAP_MS;
  }
  if (/[.,:;!?=]/.test(character)) {
    return HACK_LOG_TYPE_PUNCT_MS;
  }
  if (character === " ") {
    return HACK_LOG_TYPE_GAP_MS;
  }
  return HACK_LOG_TYPE_CHAR_MS;
}

function renderHackLogAnimated(targetText) {
  if (!elements.hackLog) {
    return;
  }

  const normalizedTarget = String(targetText || "");
  const animation = state.easterEgg.logAnimation;
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  if (normalizedTarget === animation.displayedText && !animation.timer) {
    return;
  }

  const requestId = animation.requestId + 1;
  animation.requestId = requestId;
  clearHackLogAnimationTimer();

  if (reduceMotion) {
    setHackLogRenderedText(normalizedTarget);
    return;
  }

  const currentText = String(animation.displayedText || "");
  const charPrefixLength = sharedPrefixLength(currentText, normalizedTarget);
  const shiftedLinePrefixLength = sharedShiftedLinePrefixLength(currentText, normalizedTarget);
  const prefixLength = Math.max(charPrefixLength, shiftedLinePrefixLength);
  let nextIndex = prefixLength;
  setHackLogRenderedText(normalizedTarget.slice(0, prefixLength));

  const step = () => {
    if (animation.requestId !== requestId) {
      return;
    }

    if (nextIndex >= normalizedTarget.length) {
      animation.timer = null;
      return;
    }

    const nextChar = normalizedTarget[nextIndex];
    const nextText = `${animation.displayedText}${nextChar}`;
    setHackLogRenderedText(nextText);
    if (nextChar !== "\n") {
      playTypeTickSound();
    }
    nextIndex += 1;

    animation.timer = setTimeout(step, hackLogCharDelay(nextChar));
  };

  step();
}

function renderHackColumn(column, session) {
  const columnEl = document.createElement("div");
  columnEl.className = "hack-column";

  for (const line of column.lines) {
    const lineEl = document.createElement("div");
    lineEl.className = "hack-line";

    const addressEl = document.createElement("span");
    addressEl.className = "hack-addr";
    addressEl.textContent = line.address;

    const dumpEl = document.createElement("span");
    dumpEl.className = "hack-dump";

    let cursor = 0;
    for (const token of line.tokens) {
      if (token.start > cursor) {
        dumpEl.append(line.chars.slice(cursor, token.start).join(""));
      }

      if (token.type === "word") {
        if (session.removedWords.has(token.word)) {
          const dudSpan = document.createElement("span");
          dudSpan.className = "hack-dud";
          dudSpan.textContent = ".".repeat(token.text.length);
          dumpEl.appendChild(dudSpan);
        } else if (session.usedWords.has(token.word)) {
          const triedSpan = document.createElement("span");
          triedSpan.className = "hack-word-used";
          triedSpan.textContent = token.text;
          dumpEl.appendChild(triedSpan);
        } else {
          const wordButton = document.createElement("button");
          wordButton.type = "button";
          wordButton.className = "hack-word hack-token";
          wordButton.textContent = token.text;
          wordButton.disabled = session.solved || session.locked;
          wordButton.addEventListener("click", () => {
            handleHackWordSelection(token.word);
          });
          dumpEl.appendChild(wordButton);
        }
      }

      if (token.type === "pair") {
        if (session.usedPairs.has(token.pairId)) {
          const usedPairSpan = document.createElement("span");
          usedPairSpan.className = "hack-pair-used";
          usedPairSpan.textContent = ".".repeat(token.text.length);
          dumpEl.appendChild(usedPairSpan);
        } else {
          const pairButton = document.createElement("button");
          pairButton.type = "button";
          pairButton.className = "hack-pair hack-token";
          pairButton.textContent = token.text;
          pairButton.disabled = session.solved || session.locked;
          pairButton.addEventListener("click", () => {
            handleHackPairSelection(token.pairId, token.text);
          });
          dumpEl.appendChild(pairButton);
        }
      }

      cursor = token.end + 1;
    }

    if (cursor < line.chars.length) {
      dumpEl.append(line.chars.slice(cursor).join(""));
    }

    lineEl.appendChild(addressEl);
    lineEl.appendChild(dumpEl);
    columnEl.appendChild(lineEl);
  }

  return columnEl;
}

function renderHackOverlay() {
  if (!elements.hackMemory || !elements.hackAttempts || !elements.hackLog) {
    return;
  }

  const session = state.easterEgg.hack;
  if (!session) {
    return;
  }

  const pips = `${"\u25A0".repeat(session.attempts)}${"\u25A1".repeat(Math.max(0, HACK_ATTEMPTS_MAX - session.attempts))}`;
  elements.hackAttempts.textContent = pips;

  const memoryFragment = document.createDocumentFragment();
  const enterLine = document.createElement("p");
  enterLine.className = "hack-enter-line";
  enterLine.textContent = t("hack_enter_password");
  memoryFragment.appendChild(enterLine);

  const hintLine = document.createElement("p");
  hintLine.className = "hack-hint-line";
  hintLine.textContent = t("hack_pick_password");
  memoryFragment.appendChild(hintLine);

  const columnsWrap = document.createElement("div");
  columnsWrap.className = "hack-columns";
  for (const column of session.columns || []) {
    columnsWrap.appendChild(renderHackColumn(column, session));
  }
  memoryFragment.appendChild(columnsWrap);

  elements.hackMemory.innerHTML = "";
  elements.hackMemory.appendChild(memoryFragment);

  renderHackLogAnimated(session.logs.join("\n"));

  if (elements.hackRetryBtn) {
    elements.hackRetryBtn.hidden = !session.locked;
  }
  if (elements.hackOpenClassifiedBtn) {
    elements.hackOpenClassifiedBtn.hidden = !(session.solved || state.easterEgg.unlocked);
  }
}

function showHackOverlay() {
  if (!elements.hackOverlay || document.body.classList.contains("is-booting")) {
    return;
  }

  if (document.body.classList.contains("is-classified")) {
    hideClassifiedPage();
  }

  if (!state.easterEgg.hack || state.easterEgg.hack.locked || state.easterEgg.hack.solved) {
    state.easterEgg.hack = createHackSession();
  }

  if (!elements.hackOverlay.classList.contains("is-active")) {
    resetHackLogAnimation(true);
  }
  renderHackOverlay();
  document.body.classList.add("is-hacking");
  elements.hackOverlay.classList.add("is-active");
  elements.hackOverlay.setAttribute("aria-hidden", "false");
}

function hideHackOverlay() {
  document.body.classList.remove("is-hacking");
  if (!elements.hackOverlay) {
    return;
  }

  showClassifiedLoadOverlay(false);
  resetHackLogAnimation(true);
  elements.hackOverlay.classList.remove("is-success");
  elements.hackOverlay.classList.remove("is-active");
  elements.hackOverlay.setAttribute("aria-hidden", "true");
}

function startNewHackSession() {
  state.easterEgg.hack = createHackSession();
  resetHackLogAnimation(true);
  renderHackOverlay();
}

function handleHackPairSelection(pairId, pairText) {
  const session = state.easterEgg.hack;
  if (!session || session.solved || session.locked || session.usedPairs.has(pairId)) {
    return;
  }

  session.usedPairs.add(pairId);
  appendHackLog(`> ${pairText}`);

  const effect = session.pairEffects?.get(pairId) || "dud";
  const dudPool = session.candidates.filter((word) => {
    return word !== session.password && !session.usedWords.has(word) && !session.removedWords.has(word);
  });

  if (effect === "dud" && dudPool.length) {
    const dud = dudPool[Math.floor(Math.random() * dudPool.length)];
    session.removedWords.add(dud);
    appendHackLog(t("hack_dud_removed"));
  } else {
    session.attempts = HACK_ATTEMPTS_MAX;
    appendHackLog(t("hack_allowance_replenished"));
  }

  renderHackOverlay();
}

function handleHackWordSelection(word) {
  const session = state.easterEgg.hack;
  if (!session || session.solved || session.locked || session.usedWords.has(word) || session.removedWords.has(word)) {
    return;
  }

  session.usedWords.add(word);
  appendHackLog(`> ${word}`);

  if (word === session.password) {
    session.solved = true;
    state.easterEgg.unlocked = true;
    appendHackLog(t("hack_exact_match"));
    appendHackLog(t("hack_access_granted"));
    appendHackLog(t("hack_accessing_archive"));
    renderHackOverlay();
    beginClassifiedTransition();
    return;
  }

  session.attempts = Math.max(0, session.attempts - 1);
  appendHackLog(t("hack_entry_denied"));
  appendHackLog(t("hack_likeness", { n: likenessCount(word, session.password), total: session.password.length }));

  if (session.attempts === 0) {
    session.locked = true;
    appendHackLog(t("hack_lockout"));
  }

  renderHackOverlay();
}

function beginClassifiedTransition() {
  if (!elements.hackOverlay) {
    showClassifiedPage();
    return;
  }

  if (!elements.hackOverlay.classList.contains("is-active")) {
    showClassifiedPage();
    return;
  }

  if (elements.hackOverlay.classList.contains("is-success")) {
    return;
  }

  elements.hackOverlay.classList.add("is-success");
  showClassifiedLoadOverlay(true);
  setTimeout(() => {
    showClassifiedLoadOverlay(false);
    showClassifiedPage();
  }, 950);
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function buildClassifiedSearchCatalog(lists = state.minervaLists || []) {
  const entries = [];
  const source = Array.isArray(lists) ? lists : [];

  for (const listData of source) {
    const listNumber = Number(listData?.ListNumber);
    if (!Number.isFinite(listNumber)) {
      continue;
    }

    const inventory = Array.isArray(listData.Inventory) ? listData.Inventory : [];
    for (const item of inventory) {
      const name = String(item?.Name || "").trim();
      if (!name) {
        continue;
      }

      const price = Number(item?.Price);
      const wikiUrl = item?.WikiUrl ? `${WIKI_BASE}${item.WikiUrl}` : null;
      entries.push({
        listNumber,
        name,
        normalizedName: normalizePlanName(name),
        normalizedRaw: normalizeSearchText(name),
        price: Number.isFinite(price) ? price : null,
        wikiUrl
      });
    }
  }

  state.classifiedSearch.entries = entries;
}

function scoreClassifiedSearchEntry(entry, queryNorm, queryRaw) {
  if (!queryNorm && !queryRaw) {
    return 0;
  }

  const hasNorm = Boolean(queryNorm);
  const hasRaw = Boolean(queryRaw);
  let score = 0;
  if ((hasNorm && entry.normalizedName === queryNorm) || (hasRaw && entry.normalizedRaw === queryRaw)) {
    score += 120;
  } else if (
    (hasNorm && entry.normalizedName.startsWith(queryNorm)) ||
    (hasRaw && entry.normalizedRaw.startsWith(queryRaw))
  ) {
    score += 80;
  } else if (
    (hasNorm && entry.normalizedName.includes(queryNorm)) ||
    (hasRaw && entry.normalizedRaw.includes(queryRaw))
  ) {
    score += 56;
  } else {
    return 0;
  }

  const queryTokens = (hasNorm ? queryNorm : queryRaw).split(" ").filter(Boolean);
  const tokenMatches = queryTokens.reduce((sum, token) => {
    return sum + (entry.normalizedName.includes(token) ? 1 : 0);
  }, 0);
  score += tokenMatches * 8;

  return score;
}

function nextAvailabilityForList(listNumber, now = new Date()) {
  const listValue = Number(listNumber);
  if (!Number.isFinite(listValue) || listValue < 1) {
    return null;
  }

  const targetCycleIndex = mod(listValue - 1, CYCLE_WEEKS);
  const currentWeek = Math.floor((now.getTime() - FALLBACK_MINERVA_ANCHOR_UTC) / MS_WEEK);
  const currentCycleIndex = mod(currentWeek, CYCLE_WEEKS);

  let weekCandidate = currentWeek + mod(targetCycleIndex - currentCycleIndex, CYCLE_WEEKS);
  let cycle = cycleForWeek(weekCandidate);

  if (now >= cycle.eventEnd) {
    weekCandidate += CYCLE_WEEKS;
    cycle = cycleForWeek(weekCandidate);
  }

  const isActive = now >= cycle.eventStart && now < cycle.eventEnd;
  const msUntil = cycle.eventStart.getTime() - now.getTime();
  const daysUntil = Math.max(0, Math.ceil(msUntil / MS_DAY));
  const phase = mod(listValue - 1, 4);

  return {
    ...cycle,
    isActive,
    daysUntil,
    saleKey: phase === 3 ? "classified_sale_big" : "classified_sale_standard"
  };
}

function renderClassifiedMinervaSearchResults() {
  if (!elements.classifiedSearchResults || !elements.classifiedSearchInput) {
    return;
  }

  const query = String(elements.classifiedSearchInput.value || "").trim();
  state.classifiedSearch.query = query;

  if (!query) {
    elements.classifiedSearchResults.innerHTML = `<p class="classified-search-empty">${t("classified_search_prompt")}</p>`;
    return;
  }

  const queryNorm = normalizePlanName(query);
  const queryRaw = normalizeSearchText(query);
  const entries = Array.isArray(state.classifiedSearch.entries) ? state.classifiedSearch.entries : [];
  const now = new Date();

  const bestMatchByItem = new Map();
  for (const entry of entries) {
    const score = scoreClassifiedSearchEntry(entry, queryNorm, queryRaw);
    if (!score) {
      continue;
    }

    const availability = nextAvailabilityForList(entry.listNumber, now);
    if (!availability) {
      continue;
    }

    const candidate = {
      ...entry,
      score,
      availability
    };

    const itemKey = entry.normalizedName || entry.normalizedRaw || normalizeSearchText(entry.name);
    const existing = bestMatchByItem.get(itemKey);
    if (!existing) {
      bestMatchByItem.set(itemKey, candidate);
      continue;
    }

    const candidateStart = candidate.availability.eventStart.getTime();
    const existingStart = existing.availability.eventStart.getTime();
    if (
      candidateStart < existingStart ||
      (candidateStart === existingStart && candidate.score > existing.score) ||
      (
        candidateStart === existingStart &&
        candidate.score === existing.score &&
        (candidate.price ?? Number.MAX_SAFE_INTEGER) < (existing.price ?? Number.MAX_SAFE_INTEGER)
      )
    ) {
      bestMatchByItem.set(itemKey, candidate);
    }
  }

  const matches = [...bestMatchByItem.values()];

  if (!matches.length) {
    elements.classifiedSearchResults.innerHTML = `<p class="classified-search-empty">${t("classified_search_no_results")}</p>`;
    return;
  }

  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.availability.daysUntil !== b.availability.daysUntil) return a.availability.daysUntil - b.availability.daysUntil;
    if ((a.price ?? Number.MAX_SAFE_INTEGER) !== (b.price ?? Number.MAX_SAFE_INTEGER)) {
      return (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER);
    }
    return a.name.localeCompare(b.name);
  });

  const limited = matches.slice(0, 40);
  const fragment = document.createDocumentFragment();

  const count = document.createElement("p");
  count.className = "classified-search-meta";
  count.textContent = t("classified_search_results_count", { n: String(limited.length) });
  fragment.appendChild(count);

  for (const match of limited) {
    const row = document.createElement("article");
    row.className = "classified-search-row";

    const itemField = document.createElement("div");
    itemField.className = "classified-search-cell classified-search-item";

    const itemLabel = document.createElement("span");
    itemLabel.className = "classified-search-k";
    itemLabel.textContent = t("classified_search_item");
    itemField.appendChild(itemLabel);

    const itemValue = document.createElement("span");
    itemValue.className = "classified-search-v";
    if (isPlanOrPlanoItem(match.name)) {
      itemValue.appendChild(createIconTag(PLAN_ITEM_GLYPH));
    }
    if (match.wikiUrl) {
      const link = document.createElement("a");
      link.href = match.wikiUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = match.name;
      itemValue.appendChild(link);
    } else {
      itemValue.append(match.name);
    }
    itemField.appendChild(itemValue);
    row.appendChild(itemField);

    const priceField = document.createElement("div");
    priceField.className = "classified-search-cell";
    priceField.innerHTML = `<span class="classified-search-k">${t("classified_search_price")}</span>`;
    const priceValue = document.createElement("span");
    priceValue.className = "classified-search-v";
    priceValue.appendChild(createIconTag(GOLD_BULLION_GLYPH));
    priceValue.append(match.price != null ? Number(match.price).toLocaleString() : "--");
    priceField.appendChild(priceValue);
    row.appendChild(priceField);

    const saleField = document.createElement("div");
    saleField.className = "classified-search-cell";
    saleField.innerHTML = `<span class="classified-search-k">${t("classified_search_sale")}</span>`;
    const saleValue = document.createElement("span");
    saleValue.className = "classified-search-v";
    saleValue.textContent = `${t("list_value", { n: String(match.listNumber).padStart(2, "0") })} - ${t(match.availability.saleKey)} - ${localizeLocation(match.availability.location)}`;
    saleField.appendChild(saleValue);
    row.appendChild(saleField);

    const availableField = document.createElement("div");
    availableField.className = "classified-search-cell";
    availableField.innerHTML = `<span class="classified-search-k">${t("classified_search_available")}</span>`;
    const availableValue = document.createElement("span");
    availableValue.className = "classified-search-v";
    const availableStamp = formatStamp(match.availability.eventStart);
    availableValue.textContent = match.availability.isActive
      ? `${availableStamp} (${t("classified_search_now")})`
      : availableStamp;
    availableField.appendChild(availableValue);
    row.appendChild(availableField);

    const daysField = document.createElement("div");
    daysField.className = "classified-search-cell";
    daysField.innerHTML = `<span class="classified-search-k">${t("classified_search_days")}</span>`;
    const daysValue = document.createElement("span");
    daysValue.className = "classified-search-v";
    daysValue.textContent = t("classified_days_value", { n: match.availability.daysUntil });
    daysField.appendChild(daysValue);
    row.appendChild(daysField);

    fragment.appendChild(row);
  }

  elements.classifiedSearchResults.innerHTML = "";
  elements.classifiedSearchResults.appendChild(fragment);
}

function renderClassifiedMinervaLists(lists = state.minervaLists || []) {
  if (!elements.classifiedMinervaLists) {
    return;
  }

  const sortedLists = Array.isArray(lists)
    ? [...lists].sort((a, b) => Number(a.ListNumber) - Number(b.ListNumber))
    : [];

  if (!sortedLists.length) {
    elements.classifiedMinervaLists.innerHTML = `<p class="classified-minerva-empty">${t("classified_minerva_empty")}</p>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const listData of sortedLists) {
    const block = document.createElement("section");
    block.className = "classified-list-block";

    const heading = document.createElement("h4");
    heading.className = "classified-list-heading";
    heading.textContent = t("list_value", { n: String(listData.ListNumber).padStart(2, "0") });
    block.appendChild(heading);

    const items = Array.isArray(listData.Inventory) ? listData.Inventory : [];
    for (const item of items) {
      const row = document.createElement("div");
      row.className = "classified-item-row";

      const nameWrap = document.createElement("span");
      nameWrap.className = "classified-item-name";
      if (isPlanOrPlanoItem(item.Name)) {
        nameWrap.appendChild(createIconTag(PLAN_ITEM_GLYPH));
      }

      if (item.WikiUrl) {
        const link = document.createElement("a");
        link.href = `${WIKI_BASE}${item.WikiUrl}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = item.Name;
        nameWrap.appendChild(link);
      } else {
        nameWrap.append(item.Name);
      }

      const priceWrap = document.createElement("span");
      priceWrap.className = "classified-item-price";
      priceWrap.appendChild(createIconTag(GOLD_BULLION_GLYPH));
      priceWrap.append(Number(item.Price).toLocaleString());

      row.appendChild(nameWrap);
      row.appendChild(priceWrap);
      block.appendChild(row);
    }

    fragment.appendChild(block);
  }

  elements.classifiedMinervaLists.innerHTML = "";
  elements.classifiedMinervaLists.appendChild(fragment);
}

async function ensureClassifiedMinervaArchive() {
  const lists = await loadMinervaLists();
  renderClassifiedMinervaLists(lists);
  buildClassifiedSearchCatalog(lists);
  renderClassifiedMinervaSearchResults();
}

function showClassifiedPage() {
  if (!state.easterEgg.unlocked && !state.easterEgg.hack?.solved) {
    return;
  }

  state.easterEgg.unlocked = true;
  showClassifiedLoadOverlay(false);
  hideHackOverlay();

  if (elements.classifiedPage) {
    elements.classifiedPage.hidden = false;
    elements.classifiedPage.classList.remove("is-entering");
    void elements.classifiedPage.offsetWidth;
    elements.classifiedPage.classList.add("is-entering");
    setTimeout(() => {
      elements.classifiedPage?.classList.remove("is-entering");
    }, 780);
  }

  document.body.classList.add("is-classified");
  elements.mainTitle.textContent = t("classified_main_title");
  elements.tabIntel.classList.remove("active");
  elements.tabStatus.classList.remove("active");
  elements.tabData.classList.add("active");
  void ensureClassifiedMinervaArchive();
}

function hideClassifiedPage() {
  showClassifiedLoadOverlay(false);
  document.body.classList.remove("is-classified");
  if (elements.classifiedPage) {
    elements.classifiedPage.classList.remove("is-entering");
    elements.classifiedPage.hidden = true;
  }

  elements.mainTitle.textContent = t("main_title");
  elements.tabData.classList.remove("active");
  elements.tabStatus.classList.remove("active");
  elements.tabIntel.classList.add("active");
}

function handleSecretTriggerTap() {
  const now = Date.now();
  if (!state.easterEgg.triggerWindowStart || now - state.easterEgg.triggerWindowStart > HACK_TRIGGER_WINDOW_MS) {
    state.easterEgg.triggerWindowStart = now;
    state.easterEgg.triggerClicks = 0;
  }

  state.easterEgg.triggerClicks += 1;
  if (state.easterEgg.triggerClicks >= HACK_TRIGGER_CLICKS) {
    state.easterEgg.triggerClicks = 0;
    state.easterEgg.triggerWindowStart = 0;
    showHackOverlay();
  }
}

async function fetchTextWithTimeout(url, timeoutMs = 20000) {
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

    return response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFromCandidates(candidates, timeoutMs = 20000) {
  let lastError = new Error("No source candidates configured.");

  for (const candidate of candidates) {
    try {
      const text = await fetchTextWithTimeout(proxied(candidate), timeoutMs);
      return { text, source: candidate };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
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
    const idx = afterStart.toUpperCase().indexOf(stopLabel);
    if (idx >= 0 && idx < sectionEnd) {
      sectionEnd = idx;
    }
  }

  const block = afterStart.slice(0, sectionEnd);
  return block.match(/\b(\d{8})\b/)?.[1] || null;
}

function parseSiloResetCountdown(text) {
  const match = text.match(/Resets\s+in:\s*(\d+)d\s*(\d+)h\s*(\d+)m(?:\s*(\d+)s)?/i);
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
  return baseMs + totalMs;
}

function parseSiloData(text) {
  const normalized = text.replace(/\u00A0/g, " ");

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

function renderSiloFromState() {
  elements.siloCodes.innerHTML = "";

  if (state.silo.error) {
    elements.siloCodes.innerHTML = `<div class="error">${t("silo_error")}</div>`;
    return;
  }

  const codes = state.silo.codes || {
    Alpha: null,
    Bravo: null,
    Charlie: null
  };
  const cards = [];

  for (const site of ["Alpha", "Bravo", "Charlie"]) {
    const card = document.createElement("div");
    card.className = "code-card";

    const siteLabel = document.createElement("div");
    siteLabel.className = "site";
    const siteIcon = createIconTag(SILO_SITE_GLYPHS[site] || "");
    siteLabel.appendChild(siteIcon);
    siteLabel.append(`SITE ${site.toUpperCase()}`);

    const codeValue = document.createElement("div");
    codeValue.className = "code";
    codeValue.textContent = codes[site] || "--------";

    card.appendChild(siteLabel);
    card.appendChild(codeValue);
    elements.siloCodes.appendChild(card);
    cards.push(card);
  }

  if (state.silo.isExpired) {
    const note = document.createElement("div");
    note.className = "error";
    note.textContent = t("silo_expired");
    elements.siloCodes.appendChild(note);
  }

  applyStaggeredReveal(cards, 55, 6);
}

async function refreshSiloPanel() {
  const previousResetTarget = state.silo.resetTargetUtc;

  try {
    const { text } = await fetchFromCandidates(SOURCE_URLS.silo, 25000);
    const parsed = parseSiloData(text);
    const hasAtLeastOne = Object.values(parsed.codes).some(Boolean);
    const resetTargetUtc = countdownToUtc(parsed.resetCountdown);

    state.silo = {
      error: !hasAtLeastOne,
      codes: parsed.codes,
      isExpired: parsed.isExpired,
      resetTargetUtc: resetTargetUtc || previousResetTarget || null
    };

    renderSiloFromState();
    return { ok: hasAtLeastOne };
  } catch (error) {
    state.silo = {
      error: true,
      codes: null,
      isExpired: false,
      resetTargetUtc: previousResetTarget || null
    };
    renderSiloFromState();
    return { ok: false };
  }
}

function normalizePlanName(name) {
  return String(name || "")
    .replace(/^Plan:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isPlanOrPlanoItem(name) {
  return /\bplan(?:o)?\b/i.test(String(name || ""));
}

function createIconTag(glyph) {
  const icon = document.createElement("span");
  icon.className = "fo76-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = glyph;
  return icon;
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function normalizeWikiTitle(title) {
  return String(title || "")
    .trim()
    .replace(/\s+/g, "_");
}

function wikiApiForLang(lang) {
  return lang === "es" ? WIKI_API_BY_LANG.es : WIKI_API_BY_LANG.en;
}

function buildWikiPageUrl(title, lang = "en") {
  const normalizedTitle = normalizeWikiTitle(title);
  if (!normalizedTitle) {
    return "";
  }

  const basePath = lang === "es" ? `${WIKI_BASE}/es/wiki/` : `${WIKI_BASE}/wiki/`;
  return `${basePath}${encodeURIComponent(normalizedTitle)}`;
}

function wikiPageTitleFromUrl(url) {
  try {
    const parsed = new URL(normalizeWikiUrl(url));
    const path = decodeURIComponent(parsed.pathname || "");
    const page = path.replace(/^\/(?:es\/)?wiki\//i, "").trim();
    return page.replace(/\s+/g, "_");
  } catch (error) {
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
      const decodedTitle = decodeURIComponent(canonicalPath)
        .replace(/^\/wiki\//i, "")
        .trim()
        .replace(/\s+/g, "_");
      if (decodedTitle) {
        keys.add(`${WIKI_BASE}/wiki/${decodedTitle}`.toLowerCase());
        keys.add(`${WIKI_BASE}/wiki/${encodeURIComponent(decodedTitle)}`.toLowerCase());
      }
    }
  } catch (error) {
    // Ignore malformed URLs and keep collected candidates.
  }

  return [...keys].filter(Boolean);
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

function restartMinervaDetailAnimation(element, className, durationMs = 320) {
  if (!element || !className) {
    return;
  }

  element.classList.remove(className);
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
    return;
  }

  void element.offsetWidth;
  element.classList.add(className);
  setTimeout(() => {
    element.classList.remove(className);
  }, durationMs);
}

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

async function fetchJsonWithFallback(url, timeoutMs = 22000) {
  const candidates = [url, proxied(url)];
  let lastError = new Error("Unable to fetch JSON.");

  for (const candidate of candidates) {
    try {
      const text = await fetchTextWithTimeout(candidate, timeoutMs);
      const normalized = text.replace(/^\uFEFF/, "");
      return JSON.parse(normalized);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function resolveWikiTitleForLanguage(title, lang) {
  const normalizedTitle = normalizeWikiTitle(title);
  if (!normalizedTitle || lang !== "es") {
    return normalizedTitle;
  }

  const langlinksUrl = `${WIKI_API_BY_LANG.en}?action=query&prop=langlinks&lllang=es&titles=${encodeURIComponent(normalizedTitle)}&format=json&formatversion=2&origin=*`;
  const data = await fetchJsonWithFallback(langlinksUrl);
  const pages = Array.isArray(data?.query?.pages) ? data.query.pages : [];
  const pageWithLanglink = pages.find((entry) => Array.isArray(entry?.langlinks) && entry.langlinks.length);
  const localizedTitle = pageWithLanglink?.langlinks?.[0]?.title || "";
  return normalizeWikiTitle(localizedTitle) || normalizedTitle;
}

function parseGoogleTranslateText(payload) {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    return "";
  }

  return payload[0]
    .map((entry) => (Array.isArray(entry) ? entry[0] : ""))
    .join("")
    .trim();
}

async function translateText(text, sourceLang, targetLang) {
  const value = String(text || "").trim();
  if (!value || sourceLang === targetLang) {
    return value;
  }

  const cacheKey = `${sourceLang}:${targetLang}:${value}`;
  const cached = state.minervaDetail.translationCache[cacheKey];
  if (cached) {
    return cached;
  }

  const translateUrl = `${GOOGLE_TRANSLATE_BASE}?client=gtx&sl=${encodeURIComponent(sourceLang)}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(value)}`;
  try {
    const payload = await fetchJsonWithFallback(translateUrl, 18000);
    const translated = parseGoogleTranslateText(payload) || value;
    state.minervaDetail.translationCache[cacheKey] = translated;
    return translated;
  } catch (error) {
    state.minervaDetail.translationCache[cacheKey] = value;
    return value;
  }
}

async function resolveWikiImageUrl(fileName, lang = "en") {
  if (!fileName) {
    return "";
  }

  const title = /^file:/i.test(fileName) ? fileName : `File:${fileName}`;
  const apiUrl = `${wikiApiForLang(lang)}?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json&formatversion=2&origin=*`;
  const data = await fetchJsonWithFallback(apiUrl);
  const pages = Array.isArray(data?.query?.pages) ? data.query.pages : [];
  const page = pages.find((entry) => Array.isArray(entry?.imageinfo) && entry.imageinfo.length) || null;
  return page?.imageinfo?.[0]?.url || "";
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

function extractUnlocksSummary(sectionText) {
  const bullets = extractWikiBullets(sectionText);
  if (bullets.length) {
    return sanitizeDetailText(bullets.join(" "));
  }

  const summary = stripWikiMarkup(sectionText).replace(/^(?:unlocks?|desbloquea|desbloqueos?):?\s*/i, "").trim();
  return sanitizeDetailText(summary);
}

async function loadMinervaDetailFallback() {
  const embeddedPayload = typeof window !== "undefined" ? window.MINERVA_DETAIL_FALLBACK : null;
  if (embeddedPayload && typeof embeddedPayload === "object") {
    const embeddedByKey = embeddedPayload && typeof embeddedPayload.byKey === "object" && embeddedPayload.byKey
      ? embeddedPayload.byKey
      : {};
    if (typeof embeddedPayload?.defaultImageUrl === "string" && embeddedPayload.defaultImageUrl.trim()) {
      state.minervaDetail.fallbackImageUrl = embeddedPayload.defaultImageUrl.trim();
    }
    state.minervaDetail.fallbackByKey = embeddedByKey;
    return embeddedByKey;
  }

  if (state.minervaDetail.fallbackByKey) {
    return state.minervaDetail.fallbackByKey;
  }

  if (state.minervaDetail.fallbackPromise) {
    return state.minervaDetail.fallbackPromise;
  }

  state.minervaDetail.fallbackPromise = (async () => {
    try {
      const response = await fetch(MINERVA_DETAIL_FALLBACK_PATH, { cache: "force-cache" });
      if (!response.ok) {
        throw new Error(`Failed to load ${MINERVA_DETAIL_FALLBACK_PATH}: ${response.status}`);
      }

      const raw = await response.text();
      const payload = JSON.parse(String(raw || "").replace(/^\uFEFF/, ""));
      if (typeof payload?.defaultImageUrl === "string" && payload.defaultImageUrl.trim()) {
        state.minervaDetail.fallbackImageUrl = payload.defaultImageUrl.trim();
      }

      const byKey = payload && typeof payload.byKey === "object" && payload.byKey ? payload.byKey : {};
      state.minervaDetail.fallbackByKey = byKey;
      return byKey;
    } catch (error) {
      state.minervaDetail.fallbackByKey = {};
      return state.minervaDetail.fallbackByKey;
    } finally {
      state.minervaDetail.fallbackPromise = null;
    }
  })();

  return state.minervaDetail.fallbackPromise;
}

function resolveOfflineMinervaDetailFromMap(item, lang = state.lang, byKey = state.minervaDetail.fallbackByKey) {
  if (!byKey || typeof byKey !== "object") {
    return null;
  }

  const normalizedUrl = normalizeWikiUrl(item?.url || item?.WikiUrl || "");
  if (!normalizedUrl) {
    return null;
  }

  const keyCandidates = minervaDetailKeyCandidatesFromUrl(normalizedUrl);
  const entry = keyCandidates
    .map((key) => byKey[key])
    .find((candidate) => candidate && typeof candidate === "object");
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const langKey = lang === "es" ? "es" : "en";
  const localized = entry[langKey] || entry.en || entry.es || {};
  const whereElse = Array.isArray(localized.whereElse)
    ? localized.whereElse.map((line) => sanitizeDetailText(line)).filter(Boolean)
    : [];
  const unlocks = sanitizeDetailText(localized.unlocks);

  const preferredWikiUrl = langKey === "es"
    ? (entry.wikiUrlEs || entry.wikiUrlEn || normalizedUrl)
    : (entry.wikiUrlEn || entry.wikiUrlEs || normalizedUrl);

  return {
    wikiUrl: normalizeWikiUrl(preferredWikiUrl),
    imageUrl: String(entry.imageUrl || state.minervaDetail.fallbackImageUrl || MINERVA_DETAIL_FALLBACK_IMAGE),
    whereElse,
    unlocks
  };
}

async function resolveOfflineMinervaDetail(item, lang = state.lang) {
  const byKey = await loadMinervaDetailFallback();
  return resolveOfflineMinervaDetailFromMap(item, lang, byKey);
}

function prewarmMinervaDetailCache(items = []) {
  const byKey = state.minervaDetail.fallbackByKey;
  if (!byKey || typeof byKey !== "object") {
    return;
  }

  for (const item of items) {
    const normalizedUrl = normalizeWikiUrl(item?.url || item?.WikiUrl || "");
    if (!normalizedUrl) {
      continue;
    }

    const detailKey = minervaDetailKeyFromUrl(normalizedUrl);
    for (const lang of ["en", "es"]) {
      const cacheKey = `${lang}:${detailKey}`;
      if (state.minervaDetail.cache[cacheKey]) {
        continue;
      }
      const detail = resolveOfflineMinervaDetailFromMap({ ...item, url: normalizedUrl }, lang, byKey);
      if (detail) {
        state.minervaDetail.cache[cacheKey] = detail;
      }
    }
  }
}

async function fetchMinervaPlanDetail(item, requestedLang = state.lang) {
  const wikiUrl = normalizeWikiUrl(item?.url || item?.WikiUrl || "");
  const sourceTitle = wikiPageTitleFromUrl(wikiUrl);
  if (!wikiUrl || !sourceTitle) {
    throw new Error("Missing wiki URL.");
  }

  const targetLang = requestedLang === "es" ? "es" : "en";
  let resolvedTitle = sourceTitle;

  if (targetLang === "es") {
    try {
      resolvedTitle = await resolveWikiTitleForLanguage(sourceTitle, "es");
    } catch (error) {
      resolvedTitle = sourceTitle;
    }
  }

  const parseWikiPage = async (lang, title) => {
    const parseUrl = `${wikiApiForLang(lang)}?action=parse&page=${encodeURIComponent(title)}&prop=wikitext|images|displaytitle&format=json&formatversion=2&origin=*`;
    const data = await fetchJsonWithFallback(parseUrl);
    if (data?.error || !data?.parse) {
      throw new Error(data?.error?.info || "Missing wiki parse payload.");
    }
    return data;
  };

  let contentLang = targetLang;
  let parseData;
  try {
    parseData = await parseWikiPage(targetLang, resolvedTitle);
  } catch (error) {
    if (targetLang !== "es") {
      throw error;
    }
    parseData = await parseWikiPage("en", sourceTitle);
    contentLang = "en";
    resolvedTitle = sourceTitle;
  }

  const wikitext = String(parseData?.parse?.wikitext || "");
  const images = Array.isArray(parseData?.parse?.images) ? parseData.parse.images : [];

  const sectionTitles = DETAIL_SECTION_TITLES[contentLang] || DETAIL_SECTION_TITLES.en;
  const locationsSection = extractFirstWikiSection(wikitext, sectionTitles.locations);
  const unlocksSection = extractFirstWikiSection(wikitext, sectionTitles.unlocks);

  let whereElse = extractOtherSourcesFromLocations(locationsSection);
  let unlocks = extractUnlocksSummary(unlocksSection);

  if (targetLang === "es" && contentLang !== "es") {
    if (whereElse.length) {
      whereElse = await Promise.all(whereElse.map((line) => translateText(line, "en", "es")));
    }
    if (unlocks) {
      unlocks = await translateText(unlocks, "en", "es");
    }
  }

  const imageFile = parseInfoboxImageFile(wikitext, images);
  const imageUrl = imageFile ? await resolveWikiImageUrl(imageFile, contentLang) : "";
  const detailWikiUrl = buildWikiPageUrl(resolvedTitle, contentLang) || wikiUrl;

  return {
    wikiUrl: detailWikiUrl,
    imageUrl,
    whereElse,
    unlocks
  };
}

function syncMinervaSubviewVisibility() {
  const hasSubviewOpen = Boolean(state.minervaDetail.open || state.minervaLocation.open);
  if (elements.minervaPanel) {
    elements.minervaPanel.classList.toggle("is-detail-open", hasSubviewOpen);
  }
  if (elements.minervaDetailView) {
    elements.minervaDetailView.hidden = !state.minervaDetail.open;
  }
  if (elements.minervaLocationView) {
    elements.minervaLocationView.hidden = !state.minervaLocation.open;
  }
}

function setMinervaDetailOpen(active) {
  const nextOpen = Boolean(active);
  const wasOpen = state.minervaDetail.open;

  state.minervaDetail.open = nextOpen;
  if (nextOpen) {
    state.minervaLocation.open = false;
    state.minervaLocation.countdownTargetMs = null;
    state.minervaLocation.countdownMode = "";
    elements.minervaLocationView?.classList.remove("is-entering");
  }

  syncMinervaSubviewVisibility();

  if (elements.minervaDetailView) {
    if (nextOpen && !wasOpen) {
      restartMinervaDetailAnimation(elements.minervaDetailView, "is-entering", 360);
    }
    if (!nextOpen) {
      elements.minervaDetailView.classList.remove("is-entering");
      elements.minervaDetailStatus?.classList.remove("is-revealing");
      elements.minervaDetailContent?.classList.remove("is-revealing");
    }
  }
}

function setMinervaLocationOpen(active) {
  const nextOpen = Boolean(active);
  const wasOpen = state.minervaLocation.open;

  state.minervaLocation.open = nextOpen;
  if (nextOpen) {
    state.minervaDetail.open = false;
    elements.minervaDetailView?.classList.remove("is-entering");
    elements.minervaDetailStatus?.classList.remove("is-revealing");
    elements.minervaDetailContent?.classList.remove("is-revealing");
  }

  syncMinervaSubviewVisibility();

  if (elements.minervaLocationView) {
    if (nextOpen && !wasOpen) {
      restartMinervaDetailAnimation(elements.minervaLocationView, "is-entering", 360);
    }
    if (!nextOpen) {
      elements.minervaLocationView.classList.remove("is-entering");
      state.minervaLocation.countdownTargetMs = null;
      state.minervaLocation.countdownMode = "";
    }
  }
}

function openMinervaLocationView() {
  setMinervaLocationOpen(true);
  renderMinervaLocationView();
}

function closeMinervaLocationView() {
  setMinervaLocationOpen(false);
}

function renderMinervaDetailView() {
  if (!elements.minervaDetailView) {
    return;
  }

  if (!state.minervaDetail.open || !state.minervaDetail.item) {
    setMinervaDetailOpen(false);
    return;
  }

  setMinervaDetailOpen(true);

  const item = state.minervaDetail.item;
  const detail = state.minervaDetail.data;
  const wikiUrl = normalizeWikiUrl(detail?.wikiUrl || item.url || item.WikiUrl || "");

  elements.minervaDetailName.textContent = item.name || item.Name || "--";
  elements.minervaDetailWikiLink.textContent = t("minerva_detail_open_source");
  elements.minervaDetailWikiLink.href = wikiUrl || "#";
  elements.minervaDetailWikiLink.hidden = !wikiUrl;

  if (state.minervaDetail.loading) {
    const shouldAnimateStatus = elements.minervaDetailStatus.hidden;
    elements.minervaDetailStatus.hidden = false;
    elements.minervaDetailStatus.textContent = t("minerva_detail_loading");
    elements.minervaDetailContent.classList.remove("is-revealing");
    elements.minervaDetailContent.hidden = true;
    if (shouldAnimateStatus) {
      restartMinervaDetailAnimation(elements.minervaDetailStatus, "is-revealing", 220);
    }
    return;
  }

  if (state.minervaDetail.error || !detail) {
    const shouldAnimateStatus = elements.minervaDetailStatus.hidden;
    elements.minervaDetailStatus.hidden = false;
    elements.minervaDetailStatus.textContent = state.minervaDetail.error || t("minerva_detail_error");
    elements.minervaDetailContent.classList.remove("is-revealing");
    elements.minervaDetailContent.hidden = true;
    if (shouldAnimateStatus) {
      restartMinervaDetailAnimation(elements.minervaDetailStatus, "is-revealing", 220);
    }
    return;
  }

  const shouldAnimateContent = elements.minervaDetailContent.hidden;
  elements.minervaDetailStatus.hidden = true;
  elements.minervaDetailStatus.classList.remove("is-revealing");
  elements.minervaDetailContent.hidden = false;

  const fallbackImageUrl = state.minervaDetail.fallbackImageUrl || MINERVA_DETAIL_FALLBACK_IMAGE;
  const detailImageUrl = detail.imageUrl || fallbackImageUrl;

  if (detailImageUrl) {
    elements.minervaDetailImage.hidden = false;
    elements.minervaDetailImage.dataset.fallbackSrc = fallbackImageUrl || detailImageUrl;
    elements.minervaDetailImage.src = detailImageUrl;
    elements.minervaDetailImage.alt = `${item.name || item.Name} image`;
  } else {
    elements.minervaDetailImage.hidden = true;
    elements.minervaDetailImage.removeAttribute("data-fallback-src");
    elements.minervaDetailImage.removeAttribute("src");
    elements.minervaDetailImage.alt = "";
  }

  const whereElse = Array.isArray(detail.whereElse) && detail.whereElse.length
    ? detail.whereElse
    : [t("minerva_detail_no_other_sources")];
  const whereFragment = document.createDocumentFragment();
  for (const sourceLine of whereElse) {
    const li = document.createElement("li");
    li.textContent = sourceLine;
    whereFragment.appendChild(li);
  }
  elements.minervaDetailWhereList.innerHTML = "";
  elements.minervaDetailWhereList.appendChild(whereFragment);

  elements.minervaDetailUnlocks.textContent = detail.unlocks || t("minerva_detail_no_unlocks");
  if (shouldAnimateContent) {
    restartMinervaDetailAnimation(elements.minervaDetailContent, "is-revealing", 320);
  }
}

function closeMinervaDetail() {
  state.minervaDetail.requestId += 1;
  state.minervaDetail.loading = false;
  state.minervaDetail.error = "";
  state.minervaDetail.item = null;
  state.minervaDetail.data = null;
  setMinervaDetailOpen(false);
}

async function openMinervaDetail(item) {
  const normalizedUrl = normalizeWikiUrl(item?.url || item?.WikiUrl || "");
  if (!normalizedUrl) {
    return;
  }

  const detailKey = minervaDetailKeyFromUrl(normalizedUrl);
  const cacheKey = `${state.lang}:${detailKey}`;
  const requestId = state.minervaDetail.requestId + 1;
  state.minervaDetail.requestId = requestId;
  state.minervaDetail.error = "";
  state.minervaDetail.item = { ...item, url: normalizedUrl };
  setMinervaDetailOpen(true);

  const cachedDetail = state.minervaDetail.cache[cacheKey];
  if (cachedDetail) {
    if (state.minervaDetail.requestId !== requestId) {
      return;
    }
    state.minervaDetail.loading = false;
    state.minervaDetail.data = cachedDetail;
    renderMinervaDetailView();
    return;
  }

  const immediateOffline = resolveOfflineMinervaDetailFromMap({ ...item, url: normalizedUrl }, state.lang);
  if (immediateOffline) {
    if (state.minervaDetail.requestId !== requestId) {
      return;
    }
    state.minervaDetail.loading = false;
    state.minervaDetail.data = immediateOffline;
    state.minervaDetail.cache[cacheKey] = immediateOffline;
    renderMinervaDetailView();
    return;
  }

  state.minervaDetail.loading = true;
  state.minervaDetail.data = null;
  renderMinervaDetailView();

  let offlineDetail = null;
  try {
    offlineDetail = await resolveOfflineMinervaDetail({ ...item, url: normalizedUrl }, state.lang);
    if (state.minervaDetail.requestId !== requestId) {
      return;
    }
    if (offlineDetail) {
      state.minervaDetail.loading = false;
      state.minervaDetail.error = "";
      state.minervaDetail.data = offlineDetail;
      state.minervaDetail.cache[cacheKey] = offlineDetail;
      renderMinervaDetailView();
      return;
    }
  } catch (error) {
    // Continue with online fallback.
  }

  try {
    const liveDetail = await fetchMinervaPlanDetail({ ...item, url: normalizedUrl }, state.lang);
    if (state.minervaDetail.requestId !== requestId) {
      return;
    }

    const normalizedLive = {
      wikiUrl: normalizeWikiUrl(liveDetail?.wikiUrl || normalizedUrl),
      imageUrl: liveDetail?.imageUrl || state.minervaDetail.fallbackImageUrl || MINERVA_DETAIL_FALLBACK_IMAGE,
      whereElse: Array.isArray(liveDetail?.whereElse)
        ? liveDetail.whereElse.map((line) => sanitizeDetailText(line)).filter(Boolean)
        : [],
      unlocks: sanitizeDetailText(liveDetail?.unlocks || "")
    };

    state.minervaDetail.loading = false;
    state.minervaDetail.error = "";
    state.minervaDetail.data = normalizedLive;
    state.minervaDetail.cache[cacheKey] = normalizedLive;
    renderMinervaDetailView();
    return;
  } catch (error) {
    // Fall through to final error.
  }

  if (state.minervaDetail.requestId !== requestId) {
    return;
  }
  state.minervaDetail.loading = false;
  state.minervaDetail.error = t("minerva_detail_error");
  renderMinervaDetailView();
}

function normalizeLocation(raw) {
  const value = String(raw || "").toLowerCase();
  if (value.includes("foundation")) return "Foundation";
  if (value.includes("crater")) return "Crater";
  if (value.includes("fort atlas")) return "Fort Atlas";
  if (value.includes("whitespring")) return "The Whitespring";
  return "--";
}

function localizeLocation(location) {
  if (!location || location === "--") {
    return "--";
  }
  return location;
}

function inferLocationFromMapImage(imagePath) {
  const value = String(imagePath || "").toLowerCase();
  if (!value) {
    return "--";
  }

  for (const hint of MINERVA_LOCATION_IMAGE_HINTS) {
    if (value.includes(hint.token)) {
      return hint.location;
    }
  }

  return "--";
}

async function loadMinervaLists() {
  if (Array.isArray(state.minervaLists) && state.minervaLists.length) {
    return state.minervaLists;
  }

  if (Array.isArray(window.MINERVA_LISTS) && window.MINERVA_LISTS.length) {
    state.minervaLists = window.MINERVA_LISTS;
    return state.minervaLists;
  }

  try {
    const response = await fetch("data/minerva-lists.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load data/minerva-lists.json: ${response.status}`);
    }

    const data = await response.json();
    state.minervaLists = Array.isArray(data) ? data : [];
    return state.minervaLists;
  } catch (error) {
    state.minervaLists = [];
    return state.minervaLists;
  }
}

function inferListNumber(items, lists) {
  if (!items.length || !lists.length) {
    return null;
  }

  const itemNames = new Set(items.map((item) => normalizePlanName(item.name)));
  let bestScore = 0;
  let bestListNumber = null;

  for (const list of lists) {
    const inventory = Array.isArray(list.Inventory) ? list.Inventory : [];
    const score = inventory.reduce((sum, entry) => {
      return sum + (itemNames.has(normalizePlanName(entry.Name)) ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestListNumber = Number(list.ListNumber);
    }
  }

  const threshold = Math.min(3, itemNames.size);
  return bestScore >= threshold ? bestListNumber : null;
}

function parseMinervaInfoApiDateAt18(dateValue) {
  const normalized = String(dateValue || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return null;
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setHours(18, 0, 0, 0);
  return date;
}

function normalizeMinervaInfoImagePath(fileName) {
  const cleaned = String(fileName || "").trim();
  if (!cleaned) {
    return "";
  }
  return `${MINERVA_INFO_LOCAL_IMAGE_BASE}/${cleaned}`;
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
  const locationMapImage = normalizeMinervaInfoImagePath(firstItem?.location_img)
    || MINERVA_LOCATION_MAP_BY_LOCATION[location]
    || "";

  const items = itemsRaw.map((item) => {
    const price = Number(item?.gold);
    return {
      name: String(item?.item || "").trim() || "--",
      price: Number.isFinite(price) ? price : null,
      url: normalizeWikiUrl(item?.wiki_url || "")
    };
  }).filter((item) => item.name && item.name !== "--");

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
    mode: "live_info",
    locationMapImage
  };
}

async function fetchMinervaInfoData(lists = []) {
  const dateValue = new Date().toISOString().slice(0, 10);
  const bodyParams = new URLSearchParams({
    accion: "getLista",
    fecha: dateValue
  });

  const directUrl = SOURCE_URLS.minervaInfoApi[0];
  const candidates = [
    {
      url: directUrl,
      options: {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: bodyParams.toString()
      }
    },
    {
      url: proxied(directUrl),
      options: {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: bodyParams.toString()
      }
    }
  ];

  for (const candidate of candidates) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(candidate.url, {
        ...candidate.options,
        signal: controller.signal
      });
      if (!response.ok) {
        continue;
      }
      const text = await response.text();
      const parsed = JSON.parse(String(text || "").replace(/^\uFEFF/, ""));
      const data = parseMinervaInfoApi(parsed, lists);
      if (data) {
        return data;
      }
    } catch (error) {
      // continue with fallback candidate
    } finally {
      clearTimeout(timer);
    }
  }

  return null;
}

function parseMinervaLive(text, lists) {
  const statusLine = text.match(/She is[^\n]+/i)?.[0]?.trim() || "";
  const locationRaw = statusLine.match(/(Foundation|Crater|Fort Atlas|(?:The\s+)?Whitespring)/i)?.[1] || "";
  const location = normalizeLocation(locationRaw);
  const isActive = statusLine ? !/not available/i.test(statusLine) : false;

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

  const listNumber = inferListNumber(items, lists);

  return {
    location,
    listNumber,
    active: isActive,
    nextChange,
    eventStart: null,
    eventEnd: null,
    items,
    mode: "live",
    locationMapImage: MINERVA_LOCATION_MAP_BY_LOCATION[location] || ""
  };
}

function mod(value, base) {
  return ((value % base) + base) % base;
}

function cycleForWeek(weekNumber) {
  const cycleIndex = mod(weekNumber, CYCLE_WEEKS);
  const listNumber = cycleIndex + 1;
  const phase = cycleIndex % 4;
  const location = CYCLE_LOCATIONS[phase];

  const weekStart = new Date(FALLBACK_MINERVA_ANCHOR_UTC + weekNumber * MS_WEEK);
  let eventStart = new Date(weekStart);
  let eventEnd;

  if (phase === 3) {
    eventStart = new Date(weekStart.getTime() + 3 * MS_DAY);
    eventEnd = new Date(weekStart.getTime() + 7 * MS_DAY);
  } else {
    eventEnd = new Date(weekStart.getTime() + 2 * MS_DAY);
  }

  return {
    listNumber,
    location,
    eventStart,
    eventEnd
  };
}

function buildFallbackMinerva(lists) {
  const now = new Date();
  const currentWeek = Math.floor((now.getTime() - FALLBACK_MINERVA_ANCHOR_UTC) / MS_WEEK);

  let cycle = cycleForWeek(currentWeek);
  const isActive = now >= cycle.eventStart && now < cycle.eventEnd;

  if (!isActive && now >= cycle.eventEnd) {
    cycle = cycleForWeek(currentWeek + 1);
  }

  const listData = lists.find((entry) => Number(entry.ListNumber) === cycle.listNumber);
  const inventory = Array.isArray(listData?.Inventory) ? listData.Inventory : [];

  const items = inventory.map((item) => ({
    name: item.Name,
    price: Number(item.Price),
    url: item.WikiUrl ? `${WIKI_BASE}${item.WikiUrl}` : null
  }));

  return {
    location: cycle.location,
    listNumber: cycle.listNumber,
    active: isActive,
    nextChange: null,
    eventStart: cycle.eventStart,
    eventEnd: cycle.eventEnd,
    items,
    mode: "fallback",
    locationMapImage: MINERVA_LOCATION_MAP_BY_LOCATION[cycle.location] || ""
  };
}

function renderMinervaFromState() {
  elements.minervaSummary.classList.remove("error");

  if (state.minerva.error) {
    elements.minervaSummary.textContent = t("minerva_error_summary");
    elements.minervaSummary.classList.add("error");
    elements.minervaItems.innerHTML = `<tr><td colspan="2" class="error">${t("minerva_error_items")}</td></tr>`;
    elements.minervaLocation.textContent = "--";
    elements.minervaList.textContent = "--";
    elements.minervaWindow.textContent = "--";
    if (state.minervaLocation.open) {
      renderMinervaLocationView();
    }
    if (state.minervaDetail.open) {
      renderMinervaDetailView();
    }
    return;
  }

  if (!state.minerva.data) {
    elements.minervaSummary.textContent = t("minerva_scanning");
    elements.minervaItems.innerHTML = `<tr><td colspan="2">${t("minerva_awaiting")}</td></tr>`;
    elements.minervaLocation.textContent = "--";
    elements.minervaList.textContent = "--";
    elements.minervaWindow.textContent = "--";
    if (state.minervaLocation.open) {
      renderMinervaLocationView();
    }
    if (state.minervaDetail.open) {
      renderMinervaDetailView();
    }
    return;
  }

  const data = state.minerva.data;
  const locationText = localizeLocation(data.location || "--");
  const summaryText = data.active
    ? t("minerva_active_at", { location: locationText })
    : t("minerva_transit_to", { location: locationText });

  elements.minervaSummary.textContent = summaryText;
  elements.minervaLocation.textContent = locationText;
  elements.minervaList.textContent = data.listNumber
    ? t("list_value", { n: String(data.listNumber).padStart(2, "0") })
    : "--";

  elements.minervaWindow.textContent = formatMinervaWindowStatus(data);

  if (!Array.isArray(data.items) || !data.items.length) {
    elements.minervaItems.innerHTML = `<tr><td colspan="2" class="error">${t("minerva_no_items")}</td></tr>`;
    if (state.minervaLocation.open) {
      renderMinervaLocationView();
    }
    if (state.minervaDetail.open) {
      renderMinervaDetailView();
    }
    return;
  }

  const fragment = document.createDocumentFragment();
  const rows = [];
  for (const item of data.items) {
    const itemName = item.name || item.Name || "--";
    const itemUrl = normalizeWikiUrl(item.url || item.WikiUrl || "");

    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    if (isPlanOrPlanoItem(itemName)) {
      nameCell.appendChild(createIconTag(PLAN_ITEM_GLYPH));
    }

    if (itemUrl) {
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "minerva-item-trigger";
      trigger.textContent = itemName;
      trigger.addEventListener("click", () => {
        void openMinervaDetail({
          name: itemName,
          url: itemUrl,
          price: item.price
        });
      });
      nameCell.appendChild(trigger);

      const link = document.createElement("a");
      link.className = "minerva-item-external";
      link.href = itemUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "\u2197";
      link.title = t("minerva_detail_open_source");
      link.setAttribute("aria-label", t("minerva_detail_open_source"));
      nameCell.appendChild(link);
    } else {
      nameCell.append(itemName);
    }

    const priceCell = document.createElement("td");
    const priceValue = Number(item.price);
    const priceText = Number.isFinite(priceValue) ? priceValue.toLocaleString() : "--";
    priceCell.appendChild(createIconTag(GOLD_BULLION_GLYPH));
    priceCell.append(priceText);

    row.appendChild(nameCell);
    row.appendChild(priceCell);
    fragment.appendChild(row);
    rows.push(row);
  }

  elements.minervaItems.innerHTML = "";
  elements.minervaItems.appendChild(fragment);
  prewarmMinervaDetailCache(data.items);
  applyStaggeredReveal(rows, 22, 24);
  if (state.minervaLocation.open) {
    renderMinervaLocationView();
  }
  if (state.minervaDetail.open) {
    renderMinervaDetailView();
  }
}

async function refreshMinervaPanel() {
  const lists = await loadMinervaLists();

  const liveInfoData = await fetchMinervaInfoData(lists);
  if (liveInfoData) {
    state.minerva = {
      error: false,
      data: liveInfoData
    };
    renderMinervaFromState();
    return { ok: true, source: "live" };
  }

  if (lists.length) {
    const fallbackData = buildFallbackMinerva(lists);
    state.minerva = {
      error: false,
      data: fallbackData
    };
    renderMinervaFromState();
    return { ok: true, source: "fallback" };
  }

  state.minerva = {
    error: true,
    data: null
  };
  renderMinervaFromState();
  return { ok: false, source: "none" };
}

function applyLanguage(lang, persist = true) {
  state.lang = lang === "es" ? "es" : "en";
  document.documentElement.lang = state.lang;
  document.title = t("title_doc");

  elements.bootTitle.textContent = t("boot_title");
  elements.bootSubtitle.textContent = t("boot_subtitle");
  elements.bootLine1.textContent = t("boot_line_1");
  elements.bootLine2.textContent = t("boot_line_2");
  elements.bootLine3.textContent = t("boot_line_3");
  elements.bootReady.textContent = t("boot_ready");
  elements.bootHint.textContent = t("boot_hint_initializing");
  elements.syncTitle.textContent = t("sync_title");
  elements.classifiedLoadTitle.textContent = t("classified_loading_title");
  elements.hackTitle.textContent = t("hack_title");
  elements.hackSubtitle.textContent = t("hack_subtitle");
  elements.hackAttemptsLabel.textContent = t("hack_attempts_label");
  elements.hackAbortBtn.textContent = t("hack_abort");
  elements.hackRetryBtn.textContent = t("hack_retry");
  elements.hackOpenClassifiedBtn.textContent = t("hack_open_files");

  elements.microText.textContent = t("micro_text");
  elements.mainTitle.textContent = t("main_title");
  elements.tabStatus.textContent = t("tab_status");
  elements.tabIntel.textContent = t("tab_intel");
  elements.tabData.textContent = t("tab_data");
  elements.langLabel.textContent = t("lang_label");

  elements.labelUtc.textContent = t("label_utc");
  elements.labelLastSync.textContent = t("label_last_sync");
  elements.labelDataLink.textContent = t("label_data_link");
  elements.refreshBtn.textContent = t("refresh_button");

  elements.siloTitle.textContent = t("silo_title");
  elements.siloHint.textContent = t("silo_hint");
  elements.siloSourcePrefix.textContent = t("silo_source_prefix");
  elements.siloSourceSuffix.textContent = t("silo_source_suffix");

  elements.minervaTitle.textContent = t("minerva_title");
  elements.minervaLocationLabel.textContent = t("minerva_location_label");
  elements.minervaListLabel.textContent = t("minerva_list_label");
  elements.minervaWindowLabel.textContent = t("minerva_window_label");
  elements.minervaInventoryTitle.textContent = t("minerva_inventory_title");
  elements.tableItemHeader.textContent = t("table_item_header");
  elements.tablePriceHeader.textContent = t("table_price_header");
  elements.minervaSourcePrefix.textContent = t("minerva_source_prefix");
  elements.minervaSourceSuffix.textContent = t("minerva_source_suffix");
  elements.minervaLocationTitle.textContent = t("minerva_location_view_title");
  elements.minervaLocationBackBtn.textContent = t("minerva_location_view_back");
  elements.minervaLocationMapLabel.textContent = t("minerva_location_map_label");
  elements.minervaLocationArrivesLabel.textContent = t("minerva_location_arrives");
  elements.minervaLocationLeavesLabel.textContent = t("minerva_location_leaves");
  elements.minervaDetailBackBtn.textContent = t("minerva_detail_back");
  elements.minervaDetailWikiLink.textContent = t("minerva_detail_open_source");
  elements.minervaDetailWhereLabel.textContent = t("minerva_detail_where_label");
  elements.minervaDetailUnlocksLabel.textContent = t("minerva_detail_unlocks_label");
  if (!state.minervaLocation.open) {
    elements.minervaLocationStatus.textContent = t("minerva_location_status_unknown");
    elements.minervaLocationArrives.textContent = "--";
    elements.minervaLocationLeaves.textContent = "--";
    elements.minervaLocationCountdownLabel.textContent = t("minerva_location_countdown_arrives");
    elements.minervaLocationCountdown.textContent = "--";
  }
  if (elements.minervaDetailStatus && !state.minervaDetail.open) {
    elements.minervaDetailStatus.textContent = t("minerva_detail_loading");
  }
  elements.classifiedTitle.textContent = t("classified_title");
  elements.classifiedWarning.textContent = t("classified_warning");
  elements.classifiedBackBtn.textContent = t("classified_back");
  elements.classifiedCard1Title.textContent = t("classified_card1_title");
  elements.classifiedCard1Body.textContent = t("classified_card1_body");
  elements.classifiedCard2Title.textContent = t("classified_card2_title");
  elements.classifiedCard2Body.textContent = t("classified_card2_body");
  elements.classifiedCard3Title.textContent = t("classified_card3_title");
  elements.classifiedCard3Body.textContent = t("classified_card3_body");
  elements.classifiedMinervaTitle.textContent = t("classified_minerva_title");
  elements.classifiedMinervaHint.textContent = t("classified_minerva_hint");
  elements.classifiedSearchLabel.textContent = t("classified_search_label");
  elements.classifiedSearchInput.placeholder = t("classified_search_placeholder");
  elements.classifiedSearchHint.textContent = t("classified_search_hint");

  if (elements.minervaAwaiting) {
    elements.minervaAwaiting.textContent = t("minerva_awaiting");
  }

  elements.footerText.textContent = t("footer_text");

  updateClock();
  renderSiloFromState();
  renderMinervaFromState();
  if (state.minervaLocation.open) {
    renderMinervaLocationView();
  }
  if (state.minervaDetail.open && state.minervaDetail.item) {
    void openMinervaDetail(state.minervaDetail.item);
  }
  setSignal(state.signalKey);
  if (state.easterEgg.hack && elements.hackOverlay.classList.contains("is-active")) {
    renderHackOverlay();
  }

  if (state.minervaLists?.length) {
    renderClassifiedMinervaLists(state.minervaLists);
    buildClassifiedSearchCatalog(state.minervaLists);
  } else {
    renderClassifiedMinervaLists([]);
    buildClassifiedSearchCatalog([]);
  }
  renderClassifiedMinervaSearchResults();

  if (document.body.classList.contains("is-classified")) {
    elements.mainTitle.textContent = t("classified_main_title");
  }

  elements.langSelect.value = state.lang;
  syncLanguageMenu();
  setLanguageMenuOpen(false);
  if (persist) {
    localStorage.setItem(STORAGE_LANG_KEY, state.lang);
  }
}

async function refreshIntel() {
  const syncStartedAt = performance.now();
  elements.refreshBtn.disabled = true;
  setSignal("syncing");
  showSyncOverlay(true);

  try {
    const [siloStatus, minervaStatus] = await Promise.all([
      refreshSiloPanel(),
      refreshMinervaPanel()
    ]);

    if (siloStatus.ok && minervaStatus.ok) {
      setSignal(minervaStatus.source === "live" ? "online" : "online_fallback");
    } else if (siloStatus.ok || minervaStatus.ok) {
      setSignal("partial");
    } else {
      setSignal("offline");
    }

    elements.lastRefresh.textContent = formatLastSync();
  } finally {
    const elapsed = performance.now() - syncStartedAt;
    const minSyncAnimationMs = 850;
    if (elapsed < minSyncAnimationMs) {
      await sleep(minSyncAnimationMs - elapsed);
    }

    showSyncOverlay(false);
    elements.refreshBtn.disabled = false;
  }
}

async function startBootSequence() {
  if (!elements.bootOverlay) {
    document.body.classList.remove("is-booting");
    document.body.classList.add("is-ready");
    return;
  }

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const timing = prefersReducedMotion
    ? { pre: 20, bloom: 70, step: 90, ready: 110, post: 80, fade: 160 }
    : { pre: 90, bloom: 180, step: 240, ready: 280, post: 220, fade: 380 };

  const bootSteps = [
    { text: elements.bootLine1?.textContent || t("boot_line_1"), progress: 32 },
    { text: elements.bootLine2?.textContent || t("boot_line_2"), progress: 62 },
    { text: elements.bootLine3?.textContent || t("boot_line_3"), progress: 88 },
    { text: elements.bootReady?.textContent || t("boot_ready"), progress: 100, ready: true }
  ];

  if (elements.bootLog) {
    elements.bootLog.replaceChildren();
  }
  if (elements.bootBar) {
    elements.bootBar.style.width = "0%";
  }
  if (elements.bootHint) {
    elements.bootHint.textContent = t("boot_hint_initializing");
  }

  await sleep(timing.pre);
  elements.bootOverlay.classList.add("is-blooming");
  await sleep(timing.bloom);
  elements.bootOverlay.classList.add("is-boot-running");

  for (const step of bootSteps) {
    if (elements.bootLog) {
      const line = document.createElement("div");
      line.className = `boot-log-line${step.ready ? " is-ready" : ""}`;
      line.textContent = step.ready ? `[OK] ${step.text}` : `> ${step.text}`;
      elements.bootLog.appendChild(line);
      elements.bootLog.scrollTop = elements.bootLog.scrollHeight;
    }
    if (elements.bootBar) {
      elements.bootBar.style.width = `${step.progress}%`;
    }
    if (elements.bootHint) {
      elements.bootHint.textContent = step.text;
    }
    await sleep(step.ready ? timing.ready : timing.step);
  }

  await sleep(timing.post);
  elements.bootOverlay.classList.add("is-hidden");

  await sleep(timing.fade);
  elements.bootOverlay.remove();
  document.body.classList.remove("is-booting");
  document.body.classList.add("is-ready");
}

function wireEvents() {
  document.addEventListener("pointerdown", () => {
    primeAudioContext();
  }, { passive: true });
  document.addEventListener("keydown", () => {
    primeAudioContext();
  });

  elements.refreshBtn.addEventListener("click", () => {
    void refreshIntel();
  });
  elements.langSelect.addEventListener("change", (event) => {
    applyLanguage(event.target.value);
  });
  elements.langToggleBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = elements.langDropdown?.classList.contains("is-open");
    setLanguageMenuOpen(!isOpen);
  });
  elements.langOptions?.forEach((option) => {
    option.addEventListener("click", () => {
      const targetLang = option.dataset.lang === "es" ? "es" : "en";
      elements.langSelect.value = targetLang;
      elements.langSelect.dispatchEvent(new Event("change", { bubbles: true }));
      setLanguageMenuOpen(false);
    });
  });
  elements.minervaLocationCardBtn?.addEventListener("click", openMinervaLocationView);
  elements.minervaLocationBackBtn?.addEventListener("click", closeMinervaLocationView);
  elements.microText.addEventListener("click", handleSecretTriggerTap);
  elements.hackAbortBtn.addEventListener("click", hideHackOverlay);
  elements.hackRetryBtn.addEventListener("click", startNewHackSession);
  elements.hackOpenClassifiedBtn.addEventListener("click", showClassifiedPage);
  elements.classifiedBackBtn.addEventListener("click", hideClassifiedPage);
  elements.minervaDetailBackBtn?.addEventListener("click", closeMinervaDetail);
  elements.minervaDetailImage?.addEventListener("error", () => {
    const fallbackSrc = elements.minervaDetailImage?.dataset?.fallbackSrc
      || state.minervaDetail.fallbackImageUrl
      || MINERVA_DETAIL_FALLBACK_IMAGE;
    if (!fallbackSrc) {
      return;
    }

    const currentSrc = elements.minervaDetailImage.getAttribute("src") || "";
    if (currentSrc === fallbackSrc) {
      return;
    }

    elements.minervaDetailImage.src = fallbackSrc;
  });
  elements.minervaLocationMapImage?.addEventListener("error", () => {
    elements.minervaLocationMapImage.src = "assets/images/minerva-route-map.svg";
    elements.minervaLocationMapImage.alt = "Appalachia route map";
    if (elements.minervaLocationPinsWrap) {
      elements.minervaLocationPinsWrap.hidden = false;
    }
    syncMinervaLocationMapPins(state.minerva.data?.location || "--");
  });
  elements.classifiedSearchInput.addEventListener("input", () => {
    renderClassifiedMinervaSearchResults();
  });
  document.addEventListener("beforeinput", (event) => {
    if (!isTypingTarget(event.target)) {
      return;
    }

    const inputType = String(event.inputType || "");
    if (
      inputType.startsWith("insert")
      || inputType.startsWith("delete")
      || inputType === "historyUndo"
      || inputType === "historyRedo"
    ) {
      playTypeTickSound();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (!isTypingTarget(event.target)) {
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const key = String(event.key || "");
    if (key.length === 1 || key === "Backspace" || key === "Delete" || key === "Enter") {
      playTypeTickSound();
    }
  });
  elements.hackOverlay.addEventListener("click", (event) => {
    if (event.target === elements.hackOverlay) {
      hideHackOverlay();
    }
  });
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!elements.langDropdown) {
      return;
    }
    if (target instanceof Node && !elements.langDropdown.contains(target)) {
      setLanguageMenuOpen(false);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (elements.langDropdown?.classList.contains("is-open")) {
      setLanguageMenuOpen(false);
      return;
    }

    if (elements.hackOverlay.classList.contains("is-active")) {
      hideHackOverlay();
      return;
    }

    if (document.body.classList.contains("is-classified")) {
      hideClassifiedPage();
    }
  });
}

async function init() {
  setupBackgroundParallax();
  wireEvents();

  const initialLang = detectInitialLanguage();
  applyLanguage(initialLang, false);
  void loadMinervaDetailFallback();
  setSignal("booting");

  await startBootSequence();

  updateClock();
  setInterval(updateClock, 1000);
  await refreshIntel();
}

init();
