(function minervaDossierPage() {
  const MINERVA_API_URL = "/api/intel/minerva";
  const MINERVA_LISTS_PATH = "/data/minerva-lists.json";
  const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
  const STORAGE_LANG_KEY = "pipboy_lang";
  const loader = window.createDossierLoader?.({ minDelayMs: 900 }) || {
    ready() {},
    fail() {}
  };
  const WIKI_BASE = "https://fallout.fandom.com";
  const MINERVA_INFO_LOCAL_IMAGE_BASE = "/assets/images/minerva-locations";
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
  const FALLBACK_MINERVA_ANCHOR_DATE_UTC = Date.UTC(2026, 1, 16);
  const MS_DAY = 24 * 60 * 60 * 1000;
  const MS_WEEK = 7 * MS_DAY;
  const CYCLE_WEEKS = 24;
  const CYCLE_LOCATIONS = ["Foundation", "Crater", "Fort Atlas", "The Whitespring"];
  const PLAN_ITEM_GLYPH = "\uF246";
  const GOLD_BULLION_GLYPH = "\uF400";
  const STRINGS = {
    en: {
      pageTitle: "Minerva Intel | Fallout Codex",
      loaderKicker: "FALLOUT CODEX // RELAY SYNC",
      loaderTitle: "SYNCING MERCHANT INTEL",
      loaderCopy: "Tracking caravan signals, sale windows, and bullion inventory...",
      eyebrow: "WASTELAND MERCHANT INTEL",
      title: "MINERVA INTEL",
      summaryLoading: "Loading Minerva routing intel...",
      summaryActive: "Minerva is currently on the ground. Review her inventory and route data before spending bullion.",
      summaryTransit: "Minerva is in transit. The intel feed is tracking her next confirmed stop and sale window.",
      summaryError: "Minerva telemetry is unavailable right now. Review the latest relayed inventory snapshot and try again shortly.",
      chipVendor: "GOLD BULLION VENDOR",
      chipRoute: "CARAVAN NETWORK",
      routeLabel: "CURRENT ROUTE",
      portraitKicker: "MERCHANT SIGNAL",
      portraitLoading: "Broker signal calibrating. Cached portrait archive is standing by.",
      portraitActive: "Broker signal stable. Minerva is transmitting a live sale inventory.",
      portraitTransit: "Convoy in motion. Relay is locked on the next confirmed route stop.",
      portraitError: "Portrait archive cached locally while telemetry relays recover.",
      mapKicker: "LOCATION INTEL",
      listLabel: "LIST ROTATION",
      itemsLabel: "ITEM COUNT",
      bullionLabel: "TOTAL BULLION",
      arrivesLabel: "ARRIVES",
      leavesLabel: "LEAVES",
      availabilityLabelInactive: "AVAILABLE IN",
      availabilityLabelActive: "STATUS",
      availabilityNow: "AVAILABLE NOW",
      availabilityMetaInactive: "{location} | {date}",
      availabilityMetaActive: "Live at {location}",
      availabilityMetaError: "Awaiting relay sync.",
      inventoryTitle: "INVENTORY CATALOG",
      inventoryNameHeader: "PLAN / ITEM",
      inventoryPriceHeader: "GOLD BULLION",
      mapSlideRoute: "ROUTE INTEL",
      mapSlideStore: "STORE LOCATION",
      mapPrev: "<",
      mapNext: ">",
      mapPrevLabel: "Previous image",
      mapNextLabel: "Next image",
      briefingKicker: "TRADE BRIEFING",
      briefingBadgeActive: "SALE LIVE",
      briefingBadgeTransit: "NEXT DEPLOYMENT",
      briefingBadgeError: "SIGNAL DEGRADED",
      briefingLoading: "Awaiting merchant telemetry...",
      briefingActive: "Current sale is live at {current}. After rollover, Minerva is expected at {next} on {date}.",
      briefingTransit: "Minerva is moving toward {next}. The next sale window opens {date}.",
      briefingError: "The relay could not confirm Minerva telemetry. This intel feed is holding the safest known merchant snapshot.",
      statusTracking: "TRACKING",
      statusActive: "MERCHANT ACTIVE",
      statusTransit: "IN TRANSIT",
      statusError: "SIGNAL DEGRADED",
      back: "RETURN TO FALLOUT CODEX",
      listValue: "List {number}",
      unknown: "--",
      itemsEmpty: "No inventory items available."
    },
    es: {
      pageTitle: "Intel de Minerva | Fallout Codex",
      loaderKicker: "FALLOUT CODEX // SINCRONIA DEL RELAY",
      loaderTitle: "SINCRONIZANDO INTEL DE MERCADER",
      loaderCopy: "Rastreando senales de caravana, ventanas de venta e inventario de bullion...",
      eyebrow: "INTEL DE MERCADER DEL YERMO",
      title: "INTEL DE MINERVA",
      summaryLoading: "Cargando intel de ruta de Minerva...",
      summaryActive: "Minerva esta operando en este momento. Revisa su inventario y la ruta antes de gastar bullion.",
      summaryTransit: "Minerva esta en transito. Este intel sigue su proxima parada confirmada y la ventana de venta.",
      summaryError: "La telemetria de Minerva no esta disponible ahora mismo. Revisa el ultimo inventario retransmitido y vuelve a intentar pronto.",
      chipVendor: "VENDEDORA DE BULLION",
      chipRoute: "RED DE CARAVANA",
      routeLabel: "RUTA ACTUAL",
      portraitKicker: "SENAL DE MERCADER",
      portraitLoading: "La senal de la corredora se esta calibrando. El archivo del retrato queda en espera.",
      portraitActive: "La senal de la corredora esta estable. Minerva transmite un inventario de venta en vivo.",
      portraitTransit: "El convoy esta en movimiento. El relay sigue la proxima parada confirmada.",
      portraitError: "El archivo del retrato queda en cache mientras se recuperan los relays de telemetria.",
      mapKicker: "INTEL DE UBICACION",
      listLabel: "ROTACION DE LISTA",
      itemsLabel: "CANTIDAD DE ITEMS",
      bullionLabel: "BULLION TOTAL",
      arrivesLabel: "LLEGA",
      leavesLabel: "SE VA",
      availabilityLabelInactive: "DISPONIBLE EN",
      availabilityLabelActive: "ESTADO",
      availabilityNow: "DISPONIBLE AHORA",
      availabilityMetaInactive: "{location} | {date}",
      availabilityMetaActive: "Activa en {location}",
      availabilityMetaError: "Esperando sincronizacion del relay.",
      inventoryTitle: "CATALOGO DE INVENTARIO",
      inventoryNameHeader: "PLANO / ITEM",
      inventoryPriceHeader: "ORO EN LINGOTES",
      mapSlideRoute: "INTEL DE RUTA",
      mapSlideStore: "UBICACION DE TIENDA",
      mapPrev: "<",
      mapNext: ">",
      mapPrevLabel: "Imagen anterior",
      mapNextLabel: "Imagen siguiente",
      briefingKicker: "BRIEFING DE COMERCIO",
      briefingBadgeActive: "VENTA ACTIVA",
      briefingBadgeTransit: "SIGUIENTE PARADA",
      briefingBadgeError: "SENAL DEGRADADA",
      briefingLoading: "Esperando telemetria de la mercader...",
      briefingActive: "La venta actual sigue activa en {current}. Despues del reinicio, Minerva deberia aparecer en {next} el {date}.",
      briefingTransit: "Minerva se dirige a {next}. La siguiente ventana de venta abre el {date}.",
      briefingError: "El relay no pudo confirmar la telemetria de Minerva. Este intel mantiene la instantanea mas segura conocida.",
      statusTracking: "RASTREANDO",
      statusActive: "MERCADER ACTIVA",
      statusTransit: "EN TRANSITO",
      statusError: "SENAL DEGRADADA",
      back: "VOLVER A FALLOUT CODEX",
      listValue: "Lista {number}",
      unknown: "--",
      itemsEmpty: "No hay items de inventario disponibles."
    }
  };

  const state = {
    lang: detectLanguage(),
    loading: true,
    error: false,
    data: null,
    lastRelayAt: null,
    minervaLists: null,
    minervaListsPromise: null,
    mapSlides: [],
    mapSlideIndex: 0,
    mapSlideKey: "",
    mapTransitionToken: 0
  };

  const elements = {
    minervaEyebrow: document.getElementById("minervaEyebrow"),
    minervaTitle: document.getElementById("minervaTitle"),
    minervaSummary: document.getElementById("minervaSummary"),
    minervaChipVendor: document.getElementById("minervaChipVendor"),
    minervaChipRoute: document.getElementById("minervaChipRoute"),
    minervaStatusPill: document.getElementById("minervaStatusPill"),
    minervaRouteLabel: document.getElementById("minervaRouteLabel"),
    minervaRouteValue: document.getElementById("minervaRouteValue"),
    minervaBackBtn: document.getElementById("minervaBackBtn"),
    minervaPortraitKicker: document.getElementById("minervaPortraitKicker"),
    minervaPortraitStatus: document.getElementById("minervaPortraitStatus"),
    minervaPortraitCaption: document.getElementById("minervaPortraitCaption"),
    minervaPortraitImage: document.getElementById("minervaPortraitImage"),
    minervaAvailabilityLabel: document.getElementById("minervaAvailabilityLabel"),
    minervaAvailabilityValue: document.getElementById("minervaAvailabilityValue"),
    minervaAvailabilityMeta: document.getElementById("minervaAvailabilityMeta"),
    minervaMapKicker: document.getElementById("minervaMapKicker"),
    minervaLocationValue: document.getElementById("minervaLocationValue"),
    minervaMapImage: document.getElementById("minervaMapImage"),
    minervaMapPrevBtn: document.getElementById("minervaMapPrevBtn"),
    minervaMapSlideLabel: document.getElementById("minervaMapSlideLabel"),
    minervaMapNextBtn: document.getElementById("minervaMapNextBtn"),
    minervaListLabel: document.getElementById("minervaListLabel"),
    minervaListValue: document.getElementById("minervaListValue"),
    minervaItemsLabel: document.getElementById("minervaItemsLabel"),
    minervaItemsValue: document.getElementById("minervaItemsValue"),
    minervaBullionLabel: document.getElementById("minervaBullionLabel"),
    minervaBullionValue: document.getElementById("minervaBullionValue"),
    minervaArrivesLabel: document.getElementById("minervaArrivesLabel"),
    minervaArrivesValue: document.getElementById("minervaArrivesValue"),
    minervaLeavesLabel: document.getElementById("minervaLeavesLabel"),
    minervaLeavesValue: document.getElementById("minervaLeavesValue"),
    minervaBriefingKicker: document.getElementById("minervaBriefingKicker"),
    minervaBriefingBadge: document.getElementById("minervaBriefingBadge"),
    minervaBriefing: document.getElementById("minervaBriefing"),
    minervaInventoryTitle: document.getElementById("minervaInventoryTitle"),
    minervaInventoryNameHeader: document.getElementById("minervaInventoryNameHeader"),
    minervaInventoryPriceHeader: document.getElementById("minervaInventoryPriceHeader"),
    minervaInventoryList: document.getElementById("minervaInventoryList")
  };

  function normalizeLanguage(value) {
    return String(value || "").trim().toLowerCase().startsWith("es") ? "es" : "en";
  }

  function detectLanguage() {
    const params = new URLSearchParams(window.location.search);
    return normalizeLanguage(params.get("lang") || safeStorageGet(STORAGE_LANG_KEY) || navigator.language || "en");
  }

  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_error) {
      return "";
    }
  }

  function t(key, vars = {}) {
    const dictionary = STRINGS[state.lang] || STRINGS.en;
    const template = dictionary[key] || STRINGS.en[key] || key;
    return String(template).replace(/\{(\w+)\}/g, (_match, token) => {
      return Object.prototype.hasOwnProperty.call(vars, token) ? String(vars[token]) : `{${token}}`;
    });
  }

  function normalizeMeridiemText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b([ap])\s*\.\s*m\s*\./gi, (_match, token) => `${token.toLowerCase()}m`)
      .replace(/\b([AP])M\b/g, (_match, token) => `${token.toLowerCase()}m`);
  }

  function extractTimeZoneParts(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).formatToParts(date);
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

  function getLocalZoneLabel(date = new Date()) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return "";
    }

    const locale = state.lang === "es" ? "es-ES" : "en-US";
    const parts = new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short"
    }).formatToParts(date);

    return parts.find((part) => part.type === "timeZoneName")?.value || "";
  }

  function formatLocalDateTime(date, { includeSeconds = false } = {}) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return t("unknown");
    }

    const locale = state.lang === "es" ? "es-ES" : "en-US";
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `${normalizeMeridiemText(new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: includeSeconds ? "2-digit" : undefined,
      hour12: true,
      timeZone: zone
    }).format(date))} ${getLocalZoneLabel(date)}`.trim();
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString(state.lang === "es" ? "es-ES" : "en-US");
  }

  function formatCountdown(ms) {
    const totalSeconds = Math.max(0, Math.floor(Number(ms || 0) / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
    }
    return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  }

  function normalizeItemName(value) {
    return String(value || "").trim() || t("unknown");
  }

  function isPlanOrPlanoItem(name) {
    return /\bplan(?:o)?\b/i.test(String(name || ""));
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

  function createIconTag(glyph) {
    const icon = document.createElement("span");
    icon.className = "fo76-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = glyph;
    return icon;
  }

  function sumBullion(items = []) {
    return items.reduce((total, item) => {
      const price = Number(item?.price);
      return total + (Number.isFinite(price) ? price : 0);
    }, 0);
  }

  async function loadMinervaLists() {
    if (Array.isArray(state.minervaLists)) {
      return state.minervaLists;
    }

    if (state.minervaListsPromise) {
      return state.minervaListsPromise;
    }

    state.minervaListsPromise = (async () => {
      try {
        const response = await fetch(MINERVA_LISTS_PATH, { cache: "force-cache" });
        if (!response.ok) {
          throw new Error(`Failed to load ${MINERVA_LISTS_PATH}: ${response.status}`);
        }
        const data = await response.json();
        state.minervaLists = Array.isArray(data) ? data : [];
      } catch (_error) {
        state.minervaLists = [];
      } finally {
        state.minervaListsPromise = null;
      }

      return state.minervaLists;
    })();

    return state.minervaListsPromise;
  }

  function inferListNumber(items = [], lists = []) {
    if (!Array.isArray(items) || !items.length || !Array.isArray(lists) || !lists.length) {
      return null;
    }

    const itemNames = new Set(items.map((item) => normalizePlanName(item?.name)));
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
    const cycleIndex = ((weekNumber % CYCLE_WEEKS) + CYCLE_WEEKS) % CYCLE_WEEKS;
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

    const listData = Array.isArray(lists)
      ? lists.find((entry) => Number(entry?.ListNumber) === cycle.listNumber)
      : null;
    const inventory = Array.isArray(listData?.Inventory) ? listData.Inventory : [];

    return {
      location: cycle.location,
      listNumber: cycle.listNumber,
      active,
      nextChange: null,
      eventStart: cycle.eventStart,
      eventEnd: cycle.eventEnd,
      items: inventory.map((item) => ({
        name: String(item?.Name || "").trim() || "--",
        price: Number.isFinite(Number(item?.Price)) ? Number(item.Price) : null,
        url: normalizeWikiUrl(item?.WikiUrl || "")
      })),
      locationMapImage: MINERVA_LOCATION_MAP_BY_LOCATION[cycle.location] || "",
      archiveSource: "fallback"
    };
  }

  function getScheduleSnapshot(now = new Date()) {
    const currentWeek = resolveFallbackWeekNumber(now);
    const currentCycle = cycleForWeek(currentWeek);
    const isCurrentActive = now >= currentCycle.eventStart && now < currentCycle.eventEnd;
    const activeOrUpcomingCycle = (!isCurrentActive && now >= currentCycle.eventEnd)
      ? cycleForWeek(currentWeek + 1)
      : currentCycle;
    const nextCycle = isCurrentActive
      ? cycleForWeek(currentWeek + 1)
      : activeOrUpcomingCycle;

    return {
      activeOrUpcomingCycle,
      nextCycle
    };
  }

  function mergeArchiveItems(payload, lists = []) {
    const liveData = payload && typeof payload === "object" ? payload : {};
    if (!Array.isArray(lists) || !lists.length) {
      return liveData;
    }

    let listNumber = Number.isFinite(Number(liveData?.listNumber)) ? Number(liveData.listNumber) : null;
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
      items: inventory.map((item) => ({
        name: String(item?.Name || "").trim() || "--",
        price: Number.isFinite(Number(item?.Price)) ? Number(item.Price) : null,
        url: normalizeWikiUrl(item?.WikiUrl || "")
      })),
      locationMapImage: liveData.locationMapImage || MINERVA_LOCATION_MAP_BY_LOCATION[liveData.location] || "",
      archiveSource: "local_lists"
    };
  }

  function renderBullionValue(element, value) {
    if (!element) {
      return;
    }

    element.textContent = "";
    if (!Number.isFinite(Number(value))) {
      element.textContent = t("unknown");
      return;
    }

    const line = document.createElement("span");
    line.className = "minerva-bullion-line";
    line.appendChild(createIconTag(GOLD_BULLION_GLYPH));
    line.append(document.createTextNode(formatNumber(value)));
    element.appendChild(line);
  }

  function renderCountValue(element, value) {
    if (!element) {
      return;
    }

    element.textContent = "";
    if (!Number.isFinite(Number(value))) {
      element.textContent = t("unknown");
      return;
    }

    const countValue = document.createElement("span");
    countValue.className = "minerva-meta-stat-number";
    countValue.textContent = formatNumber(value);

    element.appendChild(countValue);
  }

  function resolveMapSlides(data) {
    const location = String(data?.location || "").trim();
    const routeSrc = String(
      data?.locationMapImage
        || MINERVA_LOCATION_MAP_BY_LOCATION[location]
        || "/assets/images/minerva-route-map.svg"
    ).trim();
    const storeSrc = String(MINERVA_STORE_IMAGE_BY_LOCATION[location] || "").trim();
    const slides = [
      {
        key: "route",
        src: routeSrc || "/assets/images/minerva-route-map.svg",
        label: t("mapSlideRoute"),
        alt: location && location !== "--"
          ? `${location} route intel`
          : "Minerva route intel"
      }
    ];

    if (storeSrc && storeSrc !== routeSrc) {
      slides.push({
        key: "store",
        src: storeSrc,
        label: t("mapSlideStore"),
        alt: location && location !== "--"
          ? `${location} store location`
          : "Minerva store location"
      });
    }

    return slides;
  }

  function syncMapSlides(data) {
    const slides = resolveMapSlides(data);
    const key = slides.map((slide) => `${slide.key}:${slide.src}`).join("|");
    if (state.mapSlideKey !== key) {
      state.mapSlides = slides;
      state.mapSlideKey = key;
      state.mapSlideIndex = 0;
    } else {
      state.mapSlides = slides;
      state.mapSlideIndex = Math.min(state.mapSlideIndex, Math.max(0, slides.length - 1));
    }
  }

  function renderMapSlide(data) {
    if (!elements.minervaMapImage || !elements.minervaMapSlideLabel) {
      return;
    }

    syncMapSlides(data);
    const slides = state.mapSlides.length ? state.mapSlides : resolveMapSlides(data);
    const activeSlide = slides[state.mapSlideIndex] || slides[0];
    if (!activeSlide) {
      return;
    }

    const currentSrc = elements.minervaMapImage.dataset.slideSrc || elements.minervaMapImage.getAttribute("src") || "";
    if (currentSrc !== activeSlide.src) {
      const token = ++state.mapTransitionToken;
      const preload = new Image();
      elements.minervaMapImage.classList.add("is-switching");
      preload.onload = () => {
        if (token !== state.mapTransitionToken) {
          return;
        }
        window.setTimeout(() => {
          if (token !== state.mapTransitionToken) {
            return;
          }
          elements.minervaMapImage.src = activeSlide.src;
          elements.minervaMapImage.alt = activeSlide.alt;
          elements.minervaMapImage.dataset.slideSrc = activeSlide.src;
          requestAnimationFrame(() => {
            elements.minervaMapImage.classList.remove("is-switching");
          });
        }, 130);
      };
      preload.onerror = preload.onload;
      preload.src = activeSlide.src;
    } else {
      elements.minervaMapImage.alt = activeSlide.alt;
      elements.minervaMapImage.dataset.slideSrc = activeSlide.src;
      elements.minervaMapImage.classList.remove("is-switching");
    }

    elements.minervaMapSlideLabel.textContent = activeSlide.label;

    const hasMultipleSlides = slides.length > 1;
    if (elements.minervaMapPrevBtn) {
      elements.minervaMapPrevBtn.disabled = !hasMultipleSlides;
    }
    if (elements.minervaMapNextBtn) {
      elements.minervaMapNextBtn.disabled = !hasMultipleSlides;
    }
  }

  function renderAvailability(data = state.data, nowMs = Date.now()) {
    if (!elements.minervaAvailabilityLabel || !elements.minervaAvailabilityValue || !elements.minervaAvailabilityMeta) {
      return;
    }

    if (!data) {
      elements.minervaAvailabilityLabel.textContent = t("availabilityLabelInactive");
      elements.minervaAvailabilityValue.textContent = t("unknown");
      elements.minervaAvailabilityMeta.textContent = t("availabilityMetaError");
      return;
    }

    if (data.active) {
      elements.minervaAvailabilityLabel.textContent = t("availabilityLabelActive");
      elements.minervaAvailabilityValue.textContent = t("availabilityNow");
      elements.minervaAvailabilityMeta.textContent = t("availabilityMetaActive", {
        location: data.location || t("unknown")
      });
      return;
    }

    const target = data.eventStart instanceof Date ? data.eventStart : null;
    if (!target || Number.isNaN(target.getTime())) {
      elements.minervaAvailabilityLabel.textContent = t("availabilityLabelInactive");
      elements.minervaAvailabilityValue.textContent = t("unknown");
      elements.minervaAvailabilityMeta.textContent = t("availabilityMetaError");
      return;
    }

    elements.minervaAvailabilityLabel.textContent = t("availabilityLabelInactive");
    elements.minervaAvailabilityValue.textContent = formatCountdown(target.getTime() - nowMs);
    elements.minervaAvailabilityMeta.textContent = t("availabilityMetaInactive", {
      location: data.location || t("unknown"),
      date: formatLocalDateTime(target)
    });
  }

  function resolveBriefingMessage(data) {
    if (!data) {
      return {
        badge: t("briefingBadgeError"),
        message: t("briefingError")
      };
    }

    const schedule = getScheduleSnapshot();
    if (data.active) {
      const nextLocation = schedule.nextCycle?.location || t("unknown");
      const nextDate = schedule.nextCycle?.eventStart
        ? formatLocalDateTime(schedule.nextCycle.eventStart)
        : t("unknown");
      return {
        badge: t("briefingBadgeActive"),
        message: t("briefingActive", {
          current: data.location || t("unknown"),
          next: nextLocation,
          date: nextDate
        })
      };
    }

    const nextLocation = data.location || schedule.activeOrUpcomingCycle?.location || t("unknown");
    const nextDate = data.eventStart
      ? formatLocalDateTime(data.eventStart)
      : (schedule.activeOrUpcomingCycle?.eventStart ? formatLocalDateTime(schedule.activeOrUpcomingCycle.eventStart) : t("unknown"));
    return {
      badge: t("briefingBadgeTransit"),
      message: t("briefingTransit", {
        next: nextLocation,
        date: nextDate
      })
    };
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

  function normalizePayload(payload) {
    return {
      location: String(payload?.location || "").trim() || "--",
      listNumber: Number.isFinite(Number(payload?.listNumber)) ? Number(payload.listNumber) : null,
      active: Boolean(payload?.active),
      nextChange: String(payload?.nextChange || "").trim() || null,
      eventStart: payload?.eventStart ? new Date(payload.eventStart) : null,
      eventEnd: payload?.eventEnd ? new Date(payload.eventEnd) : null,
      items: Array.isArray(payload?.items)
        ? payload.items.map((item) => ({
          name: String(item?.name || "").trim() || "--",
          price: Number.isFinite(Number(item?.price)) ? Number(item.price) : null,
          url: String(item?.url || "").trim()
        }))
        : [],
      locationMapImage: String(payload?.locationMapImage || "").trim()
    };
  }

  function applyStaticText() {
    document.documentElement.lang = state.lang;
    document.title = t("pageTitle");
    window.setDossierLoaderText?.({
      kicker: t("loaderKicker"),
      title: t("loaderTitle"),
      copy: t("loaderCopy")
    });
    elements.minervaEyebrow.textContent = t("eyebrow");
    elements.minervaTitle.textContent = t("title");
    elements.minervaChipVendor.textContent = t("chipVendor");
    elements.minervaChipRoute.textContent = t("chipRoute");
    elements.minervaRouteLabel.textContent = t("routeLabel");
    elements.minervaPortraitKicker.textContent = t("portraitKicker");
    elements.minervaMapKicker.textContent = t("mapKicker");
    elements.minervaListLabel.textContent = t("listLabel");
    elements.minervaItemsLabel.textContent = t("itemsLabel");
    elements.minervaBullionLabel.textContent = t("bullionLabel");
    elements.minervaArrivesLabel.textContent = t("arrivesLabel");
    elements.minervaLeavesLabel.textContent = t("leavesLabel");
    elements.minervaBriefingKicker.textContent = t("briefingKicker");
    elements.minervaBriefingBadge.textContent = t("briefingBadgeTransit");
    elements.minervaInventoryTitle.textContent = t("inventoryTitle");
    elements.minervaInventoryNameHeader.textContent = t("inventoryNameHeader");
    elements.minervaInventoryPriceHeader.textContent = t("inventoryPriceHeader");
    elements.minervaMapSlideLabel.textContent = t("mapSlideRoute");
    elements.minervaMapPrevBtn.textContent = t("mapPrev");
    elements.minervaMapPrevBtn.setAttribute("aria-label", t("mapPrevLabel"));
    elements.minervaMapNextBtn.textContent = t("mapNext");
    elements.minervaMapNextBtn.setAttribute("aria-label", t("mapNextLabel"));
    elements.minervaBackBtn.textContent = t("back");
  }

  function renderInventoryList(items = []) {
    elements.minervaInventoryList.innerHTML = "";

    if (!items.length) {
      const item = document.createElement("li");
      item.textContent = t("itemsEmpty");
      elements.minervaInventoryList.appendChild(item);
      return;
    }

    for (const entry of items) {
      const item = document.createElement("li");
      const itemName = normalizeItemName(entry.name);
      const nameWrap = document.createElement("div");
      nameWrap.className = "minerva-page-item-name";

      if (isPlanOrPlanoItem(itemName)) {
        nameWrap.appendChild(createIconTag(PLAN_ITEM_GLYPH));
      }

      if (entry.url) {
        const link = document.createElement("a");
        link.className = "minerva-page-inventory-link";
        link.href = entry.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = itemName;
        nameWrap.appendChild(link);
      } else {
        const label = document.createElement("span");
        label.className = "minerva-page-inventory-link";
        label.textContent = itemName;
        nameWrap.appendChild(label);
      }

      item.appendChild(nameWrap);

      if (Number.isFinite(entry.price)) {
        const price = document.createElement("span");
        price.className = "minerva-page-price";
        price.appendChild(createIconTag(GOLD_BULLION_GLYPH));
        price.append(document.createTextNode(formatNumber(entry.price)));
        item.appendChild(price);
      }

      elements.minervaInventoryList.appendChild(item);
    }
  }

  function render() {
    applyStaticText();

    const data = state.data;
    const hasData = Boolean(data);
    const items = data?.items || [];
    const totalBullion = sumBullion(items);
    elements.minervaRouteValue.textContent = data?.location || t("unknown");
    elements.minervaLocationValue.textContent = data?.location || t("unknown");
    elements.minervaListValue.textContent = Number.isFinite(Number(data?.listNumber))
      ? t("listValue", { number: data.listNumber })
      : t("unknown");
    renderCountValue(elements.minervaItemsValue, hasData ? items.length : Number.NaN);
    renderBullionValue(elements.minervaBullionValue, hasData ? totalBullion : Number.NaN);
    elements.minervaArrivesValue.textContent = formatLocalDateTime(data?.eventStart);
    elements.minervaLeavesValue.textContent = formatLocalDateTime(data?.eventEnd);
    elements.minervaPortraitImage.alt = data?.location && data.location !== "--"
      ? `Minerva portrait near ${data.location}`
      : "Minerva portrait";
    renderAvailability(data);
    renderMapSlide(data);

    renderInventoryList(data?.items || []);

    if (state.loading && !data) {
      elements.minervaSummary.textContent = t("summaryLoading");
      elements.minervaBriefing.textContent = t("briefingLoading");
      elements.minervaStatusPill.textContent = t("statusTracking");
      elements.minervaPortraitStatus.textContent = t("statusTracking");
      elements.minervaPortraitCaption.textContent = t("portraitLoading");
      elements.minervaBriefingBadge.textContent = t("briefingBadgeTransit");
      renderAvailability(null);
      return;
    }

    if (state.error || !data) {
      elements.minervaSummary.textContent = t("summaryError");
      elements.minervaBriefing.textContent = t("briefingError");
      elements.minervaStatusPill.textContent = t("statusError");
      elements.minervaPortraitStatus.textContent = t("statusError");
      elements.minervaPortraitCaption.textContent = t("portraitError");
      elements.minervaBriefingBadge.textContent = t("briefingBadgeError");
      renderAvailability(null);
      return;
    }

    const briefing = resolveBriefingMessage(data);
    elements.minervaBriefing.textContent = briefing.message;
    elements.minervaBriefingBadge.textContent = briefing.badge;

    if (data.active) {
      elements.minervaSummary.textContent = t("summaryActive");
      elements.minervaStatusPill.textContent = t("statusActive");
      elements.minervaPortraitStatus.textContent = t("statusActive");
      elements.minervaPortraitCaption.textContent = t("portraitActive");
      return;
    }

    elements.minervaSummary.textContent = t("summaryTransit");
    elements.minervaStatusPill.textContent = t("statusTransit");
    elements.minervaPortraitStatus.textContent = t("statusTransit");
    elements.minervaPortraitCaption.textContent = t("portraitTransit");
  }

  async function loadIntel() {
    state.loading = true;
    render();

    try {
      const lists = await loadMinervaLists();
      const response = await fetch(MINERVA_API_URL, {
        cache: "no-store",
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      state.data = mergeArchiveItems(normalizePayload(payload), lists);
      state.error = false;
      state.lastRelayAt = new Date();
    } catch (_error) {
      const lists = await loadMinervaLists();
      if (Array.isArray(lists) && lists.length) {
        state.data = buildFallbackMinerva(lists);
        state.error = false;
      } else {
        state.error = true;
      }
      state.lastRelayAt = new Date();
    } finally {
      state.loading = false;
      render();
      loader.ready();
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    render();
    void loadIntel();
    elements.minervaMapPrevBtn?.addEventListener("click", () => {
      if (state.mapSlides.length < 2) {
        return;
      }
      state.mapSlideIndex = (state.mapSlideIndex - 1 + state.mapSlides.length) % state.mapSlides.length;
      renderMapSlide(state.data);
    });
    elements.minervaMapNextBtn?.addEventListener("click", () => {
      if (state.mapSlides.length < 2) {
        return;
      }
      state.mapSlideIndex = (state.mapSlideIndex + 1) % state.mapSlides.length;
      renderMapSlide(state.data);
    });
    window.setInterval(() => {
      renderAvailability(state.data);
    }, 1000);
    window.setInterval(() => {
      void loadIntel();
    }, REFRESH_INTERVAL_MS);
  });
})();
