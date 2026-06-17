// atomic-shop.js — Atomic Shop database browser modal for the CLASSIFIED tab.
// Data + images are sourced live from atomicshop.fyi (AGPL-3.0 project
// github.com/ggmatze/atomic-shop-web). We write original code here and only
// consume the public data/images at runtime, with visible attribution.
// Depends on: js/core/config.js, js/core/state.js, js/app.js (for t()), loaded first.

(function atomicShopModule() {
  "use strict";

  const CUT_CONTENT = "​Cut Content";

  // Grouped categories shown in the filter panel (ported from the reference).
  const FILTER_GROUPS = {
    CAMP: [
      "Kits", "Floors/Foundation", "Roofs", "Wallpaper", "Doors", "Decoration",
      "Floordecor", "Walldecor", "Signs", "Vendors", "Lights", "Machinery",
      "Power Connectors", "Power Generators", "Furniture", "Beds", "Stash",
      "Displays", "Shelters", "Structures", "Defenses", "Allies", "Utility", "Collectron"
    ],
    Skins: [
      "C.A.M.P.", "Clothing", "Headwear", "Armor", "Backpack", "PipBoy", "Lootbags",
      "Camera", "Weapons", "Weapon Skins", "Weapon Models", "Powerarmor", "Tents"
    ],
    Apparel: ["Outfits", "Headwear", "Underarmor", "Armor", "PipBoy", "Flairs", "Backpack"],
    "Player Appearance": ["Hairstyle", "Tattoos", "Facepaint"],
    "Photo Mode": ["Frames", "Pose", "Vanity Lights"],
    Seasons: Array.from({ length: 25 }, (_, i) => `Season ${i + 1}`),
    "Mini Seasons": [
      "Appalachian Outlaws", "Marvelous Fishing Excursion", "Night at the Morgue",
      "Weapons Expert Extraordinaire", "Sunset Stranger", "Love Hurts"
    ],
    Other: [
      "Player Icons", "Titles", "Emotes", "Bundle", CUT_CONTENT, "Misc", "Bobbers",
      "Support Item List (279/311)", "P2W", "No Image"
    ]
  };

  const VALID_CATEGORIES = new Set([
    "CAMP", "Clothing", "Kits", "Beds", "Collectors", "Defenses", "PipBoy",
    "Floors/Foundation", "Roof", "Doors", "Armor", "Apparel", "Skins", "Floor",
    "Decoration", "Wall", "Ceiling", "Lights", "Utility", "Weapons", "Weaponmodel",
    "Furniture", "Entertainment", "Bundle", "Powerarmor", "Settlement", "Workshop",
    "Vendors", "Hairstyle", "Structures", "Headwear", "Outfit", "Player Icons", "Emotes"
  ]);

  const DIRECTORY_TO_CATEGORIES = {
    Titles: ["playertitles", "camptitles"],
    Floordecor: ["floordecoration", "flags", "statues"],
    Decoration: ["floordecoration", "flags", "signs", "statues", "walldecoration", "ceilingdecoration", "lights", "furniture", "beds", "wallpaper", "stash", "displays"],
    Signs: ["signs"],
    Doors: ["doors"],
    Walldecor: ["walldecoration", "ceilingdecoration"],
    Vendors: ["vendors"],
    Lights: ["lights"],
    Machinery: ["machinery"],
    Furniture: ["furniture", "beds"],
    Beds: ["beds"],
    Kits: ["kits", "roof"],
    Shelters: ["shelters"],
    Structures: ["structures"],
    Defenses: ["defenses"],
    Allies: ["ally"],
    Tents: ["tents"],
    "Floors/Foundation": ["floors"],
    Roofs: ["roof"],
    Wallpaper: ["wallpaper"],
    Stash: ["stash"],
    Displays: ["displays", "display"],
    Clothing: ["outfit"],
    Outfits: ["outfit"],
    Armor: ["armorskin"],
    Underarmor: ["underarmor"],
    Headwear: ["headwear"],
    Backpack: ["backpack"],
    Flairs: ["flair"],
    Weapons: ["weaponskin", "weaponmodel", "weapon"],
    PipBoy: ["pipboy"],
    Powerarmor: ["powerarmor"],
    Hairstyle: ["hairstyle"],
    Tattoos: ["tattoo"],
    Facepaint: ["facepaint"],
    Pose: ["photopose"],
    "Player Icons": ["playericons"],
    Emotes: ["emotes"],
    P2W: ["storefront/utility", "events"],
    Lootbags: ["lootbags"]
  };

  const EDID_CATEGORY_KEYWORDS = {
    Apparel: ["_apparel_", "_outfit_"],
    CAMP: ["_camp_"],
    "C.A.M.P.": ["_deployable_"],
    Kits: ["_entm_camp_kit_"],
    Roofs: ["_roofs_", "_roof_"],
    "Power Generators": ["_generator_"],
    "Power Connectors": ["_powerconnectors_"],
    Camera: ["_cameraskin_"],
    Tents: ["_survivaltent_"],
    Underarmor: ["_underarmor_"],
    Signs: ["_sign_", "_neonsigns_"],
    Doors: ["_door_"],
    Weapons: ["_weaponskin_", "_weaponmodel_", "_weapons_"],
    "Weapon Models": ["_weaponmodel_"],
    "Weapon Skins": ["_weaponskin_"],
    Skins: ["_skin_"],
    Emotes: ["_emotes_"],
    Collectron: ["_collectron_"],
    Foundations: ["_foundation_"],
    Floors: ["_floor_"],
    Utility: ["_camp_utility_"],
    Beds: ["_bed_"],
    Misc: ["_account_"],
    [CUT_CONTENT]: ["zzz", "reuse", "armorskin_wood_nw", "_armorskin_metal_nw", "_armorskin_marine_nw", "_armorskin_scout_nw", "_outfit_nukagirloutfit_"],
    Bundle: ["_bndl_"],
    "Vanity Lights": ["_vanitylight_"],
    Frames: ["_photomode_frame_"],
    "Player Icons": ["_playericon_"],
    Bobbers: ["_rodbobber_"],
    "Appalachian Outlaws": ["_appalachianoutlaws_"],
    "Marvelous Fishing Excursion": ["_mmmfe_"],
    "Night at the Morgue": ["_nightatthemorgue_"],
    "Weapons Expert Extraordinaire": ["_weaponsexpert_"],
    "Sunset Stranger": ["_sunsetstranger_"],
    "Love Hurts": ["_miniseason_lovehurts_"]
  };
  for (let s = 1; s <= 25; s++) EDID_CATEGORY_KEYWORDS[`Season ${s}`] = [`score_s${s}_`];

  const CUSTOM_CATEGORY_FILTERS = { [CUT_CONTENT]: ["cBadge:cut"] };

  // Spanish labels for group/category names (UI chrome only; item data stays English).
  const GROUP_LABELS_ES = {
    CAMP: "C.A.M.P.", Skins: "Aspectos", Apparel: "Vestimenta",
    "Player Appearance": "Apariencia", "Photo Mode": "Modo Foto",
    Seasons: "Temporadas", "Mini Seasons": "Mini Temporadas", Other: "Otros"
  };
  const CATEGORY_LABELS_ES = {
    [CUT_CONTENT]: "Contenido Cortado", "No Image": "Sin Imagen",
    "Player Icons": "Iconos", Titles: "Titulos", Emotes: "Gestos",
    Bundle: "Paquetes", Misc: "Varios", Bobbers: "Flotadores",
    Outfits: "Atuendos", Headwear: "Sombreros", Armor: "Armadura",
    Weapons: "Armas", Furniture: "Muebles", Lights: "Luces",
    Hairstyle: "Peinados", Tattoos: "Tatuajes", Facepaint: "Pintura facial"
  };

  function categoryLabel(category) {
    if (category === "Support Item List (279/311)") return "Support Item List";
    if (String(state?.lang) === "es" && CATEGORY_LABELS_ES[category]) return CATEGORY_LABELS_ES[category];
    return category.replace("​", "");
  }
  function groupLabel(group) {
    if (String(state?.lang) === "es" && GROUP_LABELS_ES[group]) return GROUP_LABELS_ES[group];
    return group;
  }

  // ----- module state -----
  const data = {
    items: [],
    byEdid: new Map(),
    byShareId: new Map(),
    externalKeywords: {},
    loaded: false,
    loading: false,
    error: ""
  };
  let filterStates = loadFilterStates(); // { [category]: 'included' | 'excluded' }
  let query = "";
  let filtered = [];
  let renderedCount = 0;
  let searchTimer = 0;
  let selectedItem = null;
  let gallery = { images: [], index: 0 };
  let observer = null;
  let booted = false;

  // ----- DOM refs (resolved at init) -----
  const dom = {};
  function byId(id) { return document.getElementById(id); }
  function cacheDom() {
    [
      "atomicShopBtn", "atomicShopOverlay", "atomicShopCore", "atomicShopBadge",
      "atomicShopTitle", "atomicShopBody", "atomicShopCloseIconBtn", "atomicShopSearchInput",
      "atomicShopClearBtn", "atomicShopFilterToggle", "atomicShopFilterPanel",
      "atomicShopFilterHint", "atomicShopFilterReset", "atomicShopFilterGroups",
      "atomicShopStatus", "atomicShopStats", "atomicShopScroll", "atomicShopResults",
      "atomicShopSentinel", "atomicShopSourceLink", "atomicShopAttribution", "atomicShopCloseBtn",
      "atomicShopItemOverlay", "atomicShopItemBackBtn", "atomicShopItemCloseIcon",
      "atomicShopItemMainImage", "atomicShopItemNoImage", "atomicShopItemThumbs",
      "atomicShopItemTitle", "atomicShopItemPrice", "atomicShopItemCategories",
      "atomicShopItemDesc", "atomicShopItemDisclaimer", "atomicShopItemIncludes",
      "atomicShopItemDbInfo", "atomicShopItemShareBtn"
    ].forEach((id) => { dom[id] = byId(id); });
  }

  // ----- helpers -----
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function normalizeEdid(value) {
    return (typeof value === "string" && value.trim()) ? value.trim().toLowerCase() : "";
  }
  function hashStringToHex(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash.toString(16).padStart(8, "0").slice(-6);
  }
  function getImageUrl(directory, imageName) {
    if (!directory || !imageName) return "";
    let dir = String(directory).toLowerCase().replace(/\\/g, "/").replace(/\/+/g, "/");
    if (dir.startsWith("/")) dir = dir.substring(1);
    if (!dir.endsWith("/")) dir += "/";
    return `${ATOMIC_SHOP_ORIGIN}/${dir}${imageName}`;
  }
  function matchesItemCondition(item, condition) {
    const [key, expected] = String(condition).split(":");
    if (!key || expected == null) return false;
    const actual = item[key];
    if (actual == null) return false;
    return String(actual).toLowerCase() === String(expected).toLowerCase();
  }
  function primaryImageUrl(item) {
    return item.primaryImage ? getImageUrl(item.primaryImage.directory, item.primaryImage.imageName) : "";
  }
  function priceOf(item) { return item.highPriceOriginal || item.price || null; }
  function capsIconMarkup() {
    return `<span class="fo76-icon atomic-shop-caps-icon" aria-hidden="true">¢</span>`;
  }
  function priceMarkup(value) {
    return `${capsIconMarkup()}${value ? esc(value) : "&ndash;"}`;
  }
  function firstOrdinalMarkup() {
    return `<span class="fo76-icon atomic-shop-first-symbol" aria-label="1st">¼</span>`;
  }
  function textWithFo76OrdinalsMarkup(value = "") {
    return esc(String(value || "").replace(/1ˢᵗ/g, "1st")).replace(/\b1st\b/g, firstOrdinalMarkup());
  }
  function bestName(item) {
    return [item.itemName, item.itemNameShort, item.name].filter(Boolean)
      .sort((a, b) => b.length - a.length)[0] || "N/A";
  }

  // ----- category engine (ported from reference getItemCategories) -----
  function getItemCategories(item) {
    const categories = new Set();
    if (item.primaryImage && item.primaryImage.directory) {
      const dir = String(item.primaryImage.directory).toLowerCase();
      const parts = dir.split("/").filter(Boolean);
      parts.forEach((p) => {
        if (VALID_CATEGORIES.has(p)) { categories.add(p); return; }
        for (const [category, directories] of Object.entries(DIRECTORY_TO_CATEGORIES)) {
          if (directories.includes(p)) categories.add(category);
        }
      });
      if (dir.includes("/camp/utility/")) { categories.add("Utility"); categories.add("CAMP"); }
      else if (dir.includes("/storefront/utility/")) categories.add("P2W");
    }

    const edidKeywords = Object.assign({}, EDID_CATEGORY_KEYWORDS, data.externalKeywords);
    if (item.EDID) {
      const edid = item.EDID.toLowerCase();
      for (const [category, keywords] of Object.entries(edidKeywords)) {
        if (Array.isArray(keywords) && keywords.some((kw) => edid.includes(kw))) categories.add(category);
      }
    }

    for (const [category, conditions] of Object.entries(CUSTOM_CATEGORY_FILTERS)) {
      if (conditions.some((c) => matchesItemCondition(item, c))) categories.add(category);
    }

    if (!item.primaryImage) {
      categories.add("No Image");
    } else if (typeof item.primaryImage === "object") {
      const { imageName, directory } = item.primaryImage;
      if (!imageName || !directory) categories.add("Missing Directory");
      if (imageName && directory && !directory.includes("textures") && !directory.includes("media") && !directory.includes("storefront")) {
        categories.add("Invalid Image Path");
      }
    } else {
      categories.add("Invalid Image Path");
    }
    return Array.from(categories);
  }

  // ----- data loading + caching -----
  function readCache() {
    try {
      const raw = localStorage.getItem(ATOMIC_SHOP_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.items)) return null;
      if (Date.now() - (parsed.ts || 0) > ATOMIC_SHOP_CACHE_TTL_MS) return null;
      return parsed;
    } catch (_) { return null; }
  }
  function writeCache(items, keywords) {
    try {
      localStorage.setItem(ATOMIC_SHOP_CACHE_KEY, JSON.stringify({ ts: Date.now(), items, keywords }));
    } catch (_) { /* quota / private mode — non-fatal, memory cache still serves the session */ }
  }

  function indexItems(items, keywords) {
    data.externalKeywords = keywords && typeof keywords === "object" ? keywords : {};
    data.byEdid.clear();
    data.byShareId.clear();
    items.forEach((item, i) => {
      item._categories = getItemCategories(item);
      item._lowerEDID = (item.EDID || "").toLowerCase();
      item._lowerName = (item.itemName || item.name || "").toLowerCase();
      item._lowerShortName = (item.itemNameShort || "").toLowerCase();
      const edidKey = normalizeEdid(item.EDID);
      if (edidKey && !data.byEdid.has(edidKey)) data.byEdid.set(edidKey, item);
      const base = normalizeEdid(item.EDID || item.itemName || item.name || String(i));
      if (base) {
        let shareId = hashStringToHex(base);
        let collision = 0;
        while (data.byShareId.has(shareId) && data.byShareId.get(shareId) !== item) {
          shareId = hashStringToHex(`${base}:${collision++}`);
        }
        item._shareId = shareId;
        data.byShareId.set(shareId, item);
      }
    });
    data.items = items;
    data.loaded = true;
  }

  async function loadData() {
    if (data.loaded || data.loading) return;
    data.loading = true;
    data.error = "";
    renderStatus();

    const cached = readCache();
    if (cached) {
      try {
        indexItems(cached.items, cached.keywords);
        data.loading = false;
        afterLoad();
        return;
      } catch (_) { /* fall through to network */ }
    }

    try {
      const fetchJson = async (url, { optional = false } = {}) => {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
          const body = await response.text().catch(() => "");
          const error = new Error(`Atomic Shop request failed: ${response.status} ${url}`);
          error.status = response.status;
          error.url = url;
          error.bodyPreview = body.slice(0, 180);
          throw error;
        }
        try {
          return await response.json();
        } catch (error) {
          const parseError = new Error(`Atomic Shop JSON parse failed: ${url}`);
          parseError.url = url;
          parseError.cause = error;
          throw parseError;
        }
      };
      const [keywords, items] = await Promise.all([
        fetchJson(ATOMIC_SHOP_KEYWORDS_URL, { optional: true }).catch((error) => {
          console.warn("[atomic-shop] Keywords request failed, continuing without keywords.", error);
          return {};
        }),
        fetchJson(ATOMIC_SHOP_DB_URL)
      ]);
      indexItems(Array.isArray(items) ? items : [], keywords);
      writeCache(data.items, data.externalKeywords);
      data.loading = false;
      afterLoad();
    } catch (err) {
      console.error("[atomic-shop] Database load failed.", err);
      data.loading = false;
      data.error = t("atomic_shop_error");
      renderStatus();
      renderResults();
    }
  }

  function afterLoad() {
    buildFilterPanel();
    applyAndRender();
    maybeOpenSharedItem();
  }

  // ----- filtering + search -----
  function getSelectedCategories() {
    const included = [];
    const excluded = [];
    Object.entries(filterStates).forEach(([cat, st]) => {
      if (st === "included") included.push(cat);
      else if (st === "excluded") excluded.push(cat);
    });
    return { included, excluded };
  }

  function computeFiltered() {
    let results = data.items;
    const { included, excluded } = getSelectedCategories();
    if (included.length || excluded.length) {
      results = results.filter((item) => {
        const cats = item._categories || getItemCategories(item);
        if (included.length && !included.some((c) => cats.includes(c))) return false;
        if (excluded.length && excluded.some((c) => cats.includes(c))) return false;
        return true;
      });
    }
    const q = query.trim().toLowerCase();
    if (q) {
      const shareCandidate = q.replace(/^0x/, "");
      if (/^[0-9a-f]{6}$/.test(shareCandidate) && data.byShareId.has(shareCandidate)) {
        results = [data.byShareId.get(shareCandidate)];
      } else {
        results = results.filter((item) =>
          item._lowerEDID.includes(q) || item._lowerName.includes(q) || item._lowerShortName.includes(q));
      }
    }
    return results;
  }

  function applyAndRender() {
    filtered = computeFiltered();
    renderedCount = 0;
    if (dom.atomicShopResults) dom.atomicShopResults.innerHTML = "";
    renderStats();
    renderNextChunk();
    renderStatus();
  }

  // ----- rendering -----
  function renderStatus() {
    const el = dom.atomicShopStatus;
    if (!el) return;
    let text = "";
    if (data.loading) text = t("atomic_shop_loading");
    else if (data.error) text = data.error;
    else if (data.loaded && filtered.length === 0) text = t("atomic_shop_empty");
    el.hidden = !text;
    el.textContent = text;
    el.classList.toggle("is-error", Boolean(data.error));
  }

  function renderStats() {
    const el = dom.atomicShopStats;
    if (!el) return;
    if (!data.loaded || data.error) { el.hidden = true; return; }
    const filterPanelOpen = Boolean(dom.atomicShopFilterPanel && !dom.atomicShopFilterPanel.hidden);
    el.hidden = false;
    el.classList.toggle("is-filter-panel-open", filterPanelOpen);
    el.textContent = t(filterPanelOpen ? "atomic_shop_filter_stats" : "atomic_shop_stats", {
      shown: filtered.length,
      total: data.items.length
    });
  }

  function tileHtml(item) {
    const imgUrl = primaryImageUrl(item);
    const price = priceOf(item);
    const bundleCount = Array.isArray(item.dynamicBundleItems) ? item.dynamicBundleItems.length : 0;
    const noImg = esc(t("atomic_shop_no_image"));
    const imgBlock = imgUrl
      ? `<img class="atomic-shop-tile-img" src="${esc(imgUrl)}" alt="" loading="lazy" decoding="async" onerror="this.style.display='none';this.parentElement.classList.add('is-noimage');">`
      : "";
    return `
      <button class="atomic-shop-tile${imgUrl ? "" : " is-noimage"}" type="button" role="listitem" data-edid="${esc(item.EDID || "")}" data-share="${esc(item._shareId || "")}">
        <span class="atomic-shop-tile-imgwrap" data-noimage="${noImg}">${imgBlock}</span>
        <span class="atomic-shop-tile-meta">
          <span class="atomic-shop-tile-name">${esc(bestName(item))}</span>
          <span class="atomic-shop-tile-price">${priceMarkup(price)}</span>
        </span>
        ${bundleCount ? `<span class="atomic-shop-tile-bundle" title="Items in this bundle/set">${bundleCount}</span>` : ""}
      </button>`;
  }

  function renderNextChunk() {
    if (!dom.atomicShopResults) return;
    if (renderedCount >= filtered.length) { updateObserver(false); return; }
    const end = Math.min(renderedCount + ATOMIC_SHOP_RENDER_CHUNK, filtered.length);
    const html = filtered.slice(renderedCount, end).map(tileHtml).join("");
    dom.atomicShopResults.insertAdjacentHTML("beforeend", html);
    renderedCount = end;
    updateObserver(renderedCount < filtered.length);
  }

  function updateObserver(active) {
    if (!dom.atomicShopSentinel) return;
    dom.atomicShopSentinel.hidden = !active;
    if (!observer) return;
    observer.disconnect();
    if (active) observer.observe(dom.atomicShopSentinel);
  }

  // ----- filter panel UI -----
  function groupAggregate(categories) {
    const states = categories.map((c) => filterStates[c] || "unchecked");
    if (states.every((s) => s === "included")) return "included";
    if (states.every((s) => s === "excluded")) return "excluded";
    if (states.some((s) => s !== "unchecked")) return "mixed";
    return "unchecked";
  }

  function buildFilterPanel() {
    const host = dom.atomicShopFilterGroups;
    if (!host) return;
    host.innerHTML = "";
    Object.entries(FILTER_GROUPS).forEach(([groupName, categories]) => {
      const group = document.createElement("section");
      group.className = "atomic-shop-filter-group is-open";

      const head = document.createElement("div");
      head.className = "atomic-shop-filter-group-head";

      const expand = document.createElement("button");
      expand.type = "button";
      expand.className = "asf-group-expand";
      expand.innerHTML = `<span class="asf-chevron" aria-hidden="true">▸</span><span>${esc(groupLabel(groupName))}</span>`;
      expand.addEventListener("click", () => group.classList.toggle("is-open"));

      const bulk = document.createElement("button");
      bulk.type = "button";
      bulk.className = "asf-group-bulk";
      bulk.dataset.group = groupName;
      bulk.setAttribute("aria-label", `Toggle all ${groupName}`);
      bulk.addEventListener("click", () => {
        const agg = groupAggregate(categories);
        const next = agg === "included" ? "excluded" : agg === "excluded" ? "unchecked" : "included";
        categories.forEach((c) => setCategoryState(c, next, false));
        persistFilterStates();
        refreshFilterUI();
        applyAndRender();
      });

      head.appendChild(expand);
      head.appendChild(bulk);
      group.appendChild(head);

      const body = document.createElement("div");
      body.className = "atomic-shop-filter-group-body";
      categories.forEach((cat) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "atomic-shop-filter-chip";
        chip.dataset.category = cat;
        chip.textContent = categoryLabel(cat);
        chip.addEventListener("click", () => {
          const cur = filterStates[cat] || "unchecked";
          const next = cur === "unchecked" ? "included" : cur === "included" ? "excluded" : "unchecked";
          setCategoryState(cat, next, true);
          refreshFilterUI();
          applyAndRender();
        });
        body.appendChild(chip);
      });
      group.appendChild(body);
      host.appendChild(group);
    });
    refreshFilterUI();
  }

  function setCategoryState(category, st, persist) {
    if (st === "unchecked") delete filterStates[category];
    else filterStates[category] = st;
    if (persist) persistFilterStates();
  }

  function refreshFilterUI() {
    if (!dom.atomicShopFilterGroups) return;
    dom.atomicShopFilterGroups.querySelectorAll(".atomic-shop-filter-chip").forEach((chip) => {
      const st = filterStates[chip.dataset.category] || "unchecked";
      chip.dataset.state = st;
    });
    dom.atomicShopFilterGroups.querySelectorAll(".asf-group-bulk").forEach((bulk) => {
      const cats = FILTER_GROUPS[bulk.dataset.group] || [];
      bulk.dataset.state = groupAggregate(cats);
    });
    updateFilterIndicator();
  }

  function updateFilterIndicator() {
    const btn = dom.atomicShopFilterToggle;
    if (!btn) return;
    const count = Object.keys(filterStates).length;
    btn.classList.toggle("has-active-filters", count > 0);
    btn.textContent = count > 0 ? t("atomic_shop_filter_active", { count }) : t("atomic_shop_filter_toggle");
  }

  function loadFilterStates() {
    try {
      const raw = localStorage.getItem(ATOMIC_SHOP_FILTER_STATE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) { return {}; }
  }
  function persistFilterStates() {
    try { localStorage.setItem(ATOMIC_SHOP_FILTER_STATE_KEY, JSON.stringify(filterStates)); } catch (_) {}
  }
  function resetFilters() {
    filterStates = {};
    try { localStorage.removeItem(ATOMIC_SHOP_FILTER_STATE_KEY); } catch (_) {}
    refreshFilterUI();
    applyAndRender();
  }

  // ----- item detail overlay -----
  let galleryRenderToken = 0;

  function checkImageExists(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }
  function parseVariantBase(filename) {
    if (!filename) return null;
    const match = filename.match(/^(.*?)(?:_(?:l|c\d+))?(\.\w+)$/i);
    if (!match) return null;
    return { base: match[1], ext: match[2] };
  }
  function buildVariantName(base, ext, n) {
    return base + (n === 0 ? "_l" : `_c${n}`) + ext;
  }
  function resolveBundleEntry(entry) {
    if (!entry) return null;
    if (typeof entry === "string") {
      return { resolvedName: entry, primaryImage: null };
    }
    const id = entry.EDID || entry.entmName || entry.edid || entry.entm || entry.id || null;
    const oldName = entry.szItemName || entry.name || entry.itemName || "";
    const record = id ? data.byEdid.get(normalizeEdid(id)) : null;
    const resolvedName = (record && record.itemName) || oldName || id || "Unknown Item";
    const primaryImage = (record && record.primaryImage) || entry.primaryImage || null;
    return { resolvedName, primaryImage };
  }
  function resolveBundleItems(item) {
    if (!item || !Array.isArray(item.dynamicBundleItems)) return [];
    return item.dynamicBundleItems.map(resolveBundleEntry).filter(Boolean);
  }
  function buildBundleCarousel(item) {
    return resolveBundleItems(item).map((e) => {
      const img = e.primaryImage;
      return img && img.directory && img.imageName ? { directory: img.directory, imageName: img.imageName } : null;
    }).filter(Boolean);
  }

  async function detectGalleryImages(item, override) {
    const images = [];
    const seen = new Set();
    const hasExplicit = Array.isArray(item.carouselImages) && item.carouselImages.length > 0;
    const hasBundle = Array.isArray(item.dynamicBundleItems) && item.dynamicBundleItems.length > 0;
    const skipAuto = hasExplicit || hasBundle || Array.isArray(override);
    const source = Array.isArray(override) ? override : item.carouselImages;

    const pushIfValid = async (url) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      if (await checkImageExists(url)) images.push(url);
    };

    const primary = primaryImageUrl(item);
    await pushIfValid(primary);

    if (Array.isArray(source)) {
      for (const c of source) {
        if (c && c.imageName && c.directory) {
          const url = getImageUrl(c.directory, c.imageName);
          await pushIfValid(url);
        }
      }
    }

    if (!skipAuto && item.primaryImage && item.primaryImage.imageName && item.primaryImage.directory) {
      const parsed = parseVariantBase(item.primaryImage.imageName);
      if (parsed) {
        for (let i = 1; i <= 16; i++) {
          const variant = getImageUrl(item.primaryImage.directory, buildVariantName(parsed.base, parsed.ext, i));
          const exists = await checkImageExists(variant);
          if (exists && !seen.has(variant)) {
            seen.add(variant);
            images.push(variant);
          }
          else if (!exists && i > 3) break;
        }
      }
    }
    return images;
  }

  function parseDescriptionAndDisclaimer(desc) {
    let description = "";
    let disclaimer = "";
    if (desc) {
      const normalized = String(desc).replace(/\r\n/g, "\n");
      const splitMatch = normalized.match(/\n{2,}/);
      if (!splitMatch) {
        description = normalized.trim();
      } else {
        description = normalized.slice(0, splitMatch.index).trim();
        const rest = normalized.slice(splitMatch.index).replace(/^\n+/, "");
        disclaimer = rest.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).join("\n\n").trim();
      }
    }
    return { description, disclaimer };
  }

  function renderGallery() {
    const mainImg = dom.atomicShopItemMainImage;
    const noImg = dom.atomicShopItemNoImage;
    const thumbs = dom.atomicShopItemThumbs;
    if (!mainImg) return;
    const token = ++galleryRenderToken;
    mainImg.onload = null;
    mainImg.onerror = null;

    if (!gallery.images.length) {
      mainImg.hidden = true;
      mainImg.removeAttribute("src");
      if (noImg) noImg.hidden = false;
      if (thumbs) {
        thumbs.innerHTML = "";
        thumbs.hidden = true;
      }
      return;
    }

    const currentSrc = gallery.images[gallery.index];
    if (noImg) noImg.hidden = true;
    mainImg.hidden = true;
    mainImg.removeAttribute("src");
    mainImg.onload = () => {
      if (token !== galleryRenderToken) return;
      mainImg.hidden = false;
    };
    mainImg.onerror = () => {
      if (token !== galleryRenderToken) return;
      mainImg.hidden = true;
      mainImg.removeAttribute("src");
      if (noImg) noImg.hidden = false;
    };
    mainImg.src = currentSrc;

    if (thumbs) {
      thumbs.innerHTML = "";
      gallery.images.forEach((src, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "atomic-shop-item-thumb" + (i === gallery.index ? " is-active" : "");
        const im = document.createElement("img");
        im.src = src;
        im.alt = "";
        im.loading = "lazy";
        im.onerror = () => { b.style.display = "none"; };
        b.appendChild(im);
        b.addEventListener("click", () => { gallery.index = i; renderGallery(); });
        thumbs.appendChild(b);
      });
      thumbs.hidden = gallery.images.length <= 1;
    }
  }

  // Renders all text + DB-info for the open item. Safe to re-run (e.g. on
  // language change, or after async gallery detection updates the image count).
  function renderItemDetail(item) {
    dom.atomicShopItemTitle.textContent = item.itemName || item.itemNameShort || item.name || "Item";

    const { description, disclaimer: parsedDisc } = parseDescriptionAndDisclaimer(item.desc || "");
    dom.atomicShopItemDesc.innerHTML = description ? textWithFo76OrdinalsMarkup(description) : "";
    dom.atomicShopItemDesc.hidden = !description;

    const price = priceOf(item);
    if (price) {
      dom.atomicShopItemPrice.hidden = false;
      dom.atomicShopItemPrice.innerHTML = priceMarkup(price);
    } else {
      dom.atomicShopItemPrice.hidden = true;
      dom.atomicShopItemPrice.innerHTML = "";
    }

    // Category chips (skip internal diagnostic flags)
    const DIAGNOSTIC = ["No Image", "Missing Directory", "Invalid Image Path"];
    const cats = (item._categories || []).filter((c) => !DIAGNOSTIC.includes(c));
    if (dom.atomicShopItemCategories) {
      if (cats.length) {
        dom.atomicShopItemCategories.hidden = false;
        dom.atomicShopItemCategories.innerHTML = cats
          .map((c) => `<span class="atomic-shop-item-cat">${esc(categoryLabel(c))}</span>`).join("");
      } else {
        dom.atomicShopItemCategories.hidden = true;
        dom.atomicShopItemCategories.innerHTML = "";
      }
    }

    const disclaimerText = item.disclaimer || parsedDisc || "";
    if (disclaimerText) {
      dom.atomicShopItemDisclaimer.hidden = false;
      dom.atomicShopItemDisclaimer.innerHTML =
        `<div class="atomic-shop-item-disclaimer-head">${esc(t("atomic_shop_detail_disclaimer"))}</div>` +
        `<div class="atomic-shop-item-disclaimer-text">${textWithFo76OrdinalsMarkup(disclaimerText).replace(/\n/g, "<br>")}</div>`;
    } else {
      dom.atomicShopItemDisclaimer.hidden = true;
      dom.atomicShopItemDisclaimer.innerHTML = "";
    }

    const bundleNames = resolveBundleItems(item).map((e) => e.resolvedName).filter(Boolean);
    if (bundleNames.length) {
      dom.atomicShopItemIncludes.hidden = false;
      dom.atomicShopItemIncludes.innerHTML =
        `<strong>${esc(t("atomic_shop_detail_includes"))}:</strong> ` +
        bundleNames.map((n) => `<span class="atomic-shop-include">${textWithFo76OrdinalsMarkup(n)}</span>`).join(", ");
    } else {
      dom.atomicShopItemIncludes.hidden = true;
      dom.atomicShopItemIncludes.innerHTML = "";
    }

    let imgName = (item.primaryImage ? item.primaryImage.imageName : "N/A");
    imgName = String(imgName).toLowerCase().replace(/\.webp$/i, ".dds");
    const imgDir = (item.primaryImage ? item.primaryImage.directory : "N/A");
    const carouselCount = Math.max(0, gallery.images.length - 1);
    // [label, value, isWide, isHtml] — long fields span the full grid width.
    const cells = [
      [t("atomic_shop_dbinfo_fullname"), item.itemName || item.name || item.itemNameShort || "N/A", true, false],
      [t("atomic_shop_dbinfo_shortname"), item.itemNameShort || "N/A", false, false],
      [t("atomic_shop_dbinfo_price"), price ? priceMarkup(price) : t("atomic_shop_no_price"), false, Boolean(price)],
      [t("atomic_shop_dbinfo_carousel"), String(carouselCount), false, false],
      [t("atomic_shop_dbinfo_edid"), (item.EDID || "N/A").toLowerCase(), true, false],
      [t("atomic_shop_dbinfo_image"), imgName, true, false],
      [t("atomic_shop_dbinfo_directory"), String(imgDir).toLowerCase(), true, false]
    ];
    dom.atomicShopItemDbInfo.innerHTML =
      `<div class="atomic-shop-item-dbinfo-head">${esc(t("atomic_shop_detail_dbinfo"))}</div>` +
      `<div class="atomic-shop-item-dbinfo-grid">` +
      cells.map(([k, v, wide, isHtml]) =>
        `<div class="atomic-shop-item-dbinfo-cell${wide ? " is-wide" : ""}">` +
          `<span class="atomic-shop-item-dbinfo-label">${esc(k)}</span>` +
          `<code>${isHtml ? v : esc(v)}</code></div>`).join("") +
      `</div>`;
  }

  async function openItem(item) {
    if (!item) return;
    selectedItem = item;
    const bundleCarousel = buildBundleCarousel(item);

    gallery = { images: [], index: 0 };
    renderItemDetail(item);
    renderGallery();
    openItemOverlay();
    setShareParam(item._shareId || "");

    gallery.images = await detectGalleryImages(item, bundleCarousel.length ? bundleCarousel : null);
    if (selectedItem !== item) return; // user navigated away while detecting
    renderItemDetail(item);
    renderGallery();
  }

  function copyShareLink() {
    if (!selectedItem || !selectedItem._shareId) return;
    const url = shareUrlFor(selectedItem._shareId);
    const btn = dom.atomicShopItemShareBtn;
    const flash = () => {
      if (!btn) return;
      btn.textContent = t("atomic_shop_share_copied");
      btn.classList.add("is-copied");
      setTimeout(() => { btn.textContent = t("atomic_shop_share"); btn.classList.remove("is-copied"); }, 1800);
    };
    // Reuse the app-wide clipboard helper (clipboard API + execCommand fallback).
    if (typeof copyTextToClipboard === "function") {
      copyTextToClipboard(url).then(flash).catch(() => window.prompt("Copy this share link:", url));
    } else {
      window.prompt("Copy this share link:", url);
    }
  }

  // ----- share / deep links (scoped query param, preserves other params) -----
  function shareUrlFor(shareId) {
    return atomicShopDossierUrlFor(shareId);
  }
  function atomicShopDossierUrlFor(shareId) {
    const url = new URL("/atomic-shop-dossier/", window.location.origin);
    url.searchParams.set("item", shareId);
    const currentLang = String(state?.lang || "").trim().toLowerCase();
    if (currentLang === "es" || currentLang === "en") url.searchParams.set("lang", currentLang);
    return url.toString();
  }
  function setShareParam(shareId) {
    try {
      const params = new URLSearchParams(window.location.search);
      params.delete(ATOMIC_SHOP_SHARE_PARAM);
      const qs = params.toString();
      const base = window.location.pathname;
      history.replaceState(null, "", `${base}${qs ? "?" + qs : ""}${window.location.hash || ""}`);
    } catch (_) {}
  }
  function maybeOpenSharedItem() {
    let raw = "";
    try { raw = new URLSearchParams(window.location.search).get(ATOMIC_SHOP_SHARE_PARAM) || ""; } catch (_) {}
    if (!raw) return;
    try {
      window.location.replace(atomicShopDossierUrlFor(raw));
    } catch (_) {}
  }

  // ----- open / close -----
  function openModal() {
    if (!dom.atomicShopOverlay) return;
    dom.atomicShopOverlay.classList.add("is-active");
    dom.atomicShopOverlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("atomic-shop-open");
    loadData();
  }
  function closeModal() {
    if (!dom.atomicShopOverlay) return;
    closeItemOverlay();
    if (dom.atomicShopFilterPanel) {
      dom.atomicShopFilterPanel.hidden = true;
    }
    if (dom.atomicShopFilterToggle) {
      dom.atomicShopFilterToggle.setAttribute("aria-expanded", "false");
    }
    renderStats();
    dom.atomicShopOverlay.classList.remove("is-active");
    dom.atomicShopOverlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("atomic-shop-open");
  }
  window.closeAtomicShopModal = closeModal;

  function openItemOverlay() {
    if (!dom.atomicShopItemOverlay) return;
    dom.atomicShopItemOverlay.classList.add("is-active");
    dom.atomicShopItemOverlay.setAttribute("aria-hidden", "false");
  }
  function closeItemOverlay() {
    if (!dom.atomicShopItemOverlay) return;
    dom.atomicShopItemOverlay.classList.remove("is-active");
    dom.atomicShopItemOverlay.setAttribute("aria-hidden", "true");
    selectedItem = null;
    setShareParam("");
  }

  function modalOpen() { return dom.atomicShopOverlay && dom.atomicShopOverlay.classList.contains("is-active"); }
  function itemOpen() { return dom.atomicShopItemOverlay && dom.atomicShopItemOverlay.classList.contains("is-active"); }

  // ----- language refresh -----
  function applyLanguage() {
    if (!dom.atomicShopBtn) return;
    dom.atomicShopBtn.textContent = t("atomic_shop_button");
    if (dom.atomicShopBadge) dom.atomicShopBadge.textContent = t("atomic_shop_badge");
    if (dom.atomicShopTitle) dom.atomicShopTitle.textContent = t("atomic_shop_title");
    if (dom.atomicShopBody) dom.atomicShopBody.textContent = t("atomic_shop_body");
    if (dom.atomicShopSearchInput) dom.atomicShopSearchInput.placeholder = t("atomic_shop_search_placeholder");
    if (dom.atomicShopClearBtn) dom.atomicShopClearBtn.setAttribute("aria-label", t("atomic_shop_search_clear"));
    if (dom.atomicShopFilterHint) dom.atomicShopFilterHint.textContent = t("atomic_shop_filter_hint");
    if (dom.atomicShopFilterReset) dom.atomicShopFilterReset.textContent = t("atomic_shop_filter_reset");
    if (dom.atomicShopSourceLink) dom.atomicShopSourceLink.textContent = t("atomic_shop_source");
    if (dom.atomicShopAttribution) dom.atomicShopAttribution.textContent = t("atomic_shop_attribution");
    if (dom.atomicShopCloseBtn) dom.atomicShopCloseBtn.textContent = t("atomic_shop_close");
    if (dom.atomicShopItemBackBtn) dom.atomicShopItemBackBtn.textContent = t("atomic_shop_detail_back");
    if (dom.atomicShopItemNoImage) dom.atomicShopItemNoImage.textContent = t("atomic_shop_no_image");
    if (dom.atomicShopItemShareBtn) dom.atomicShopItemShareBtn.textContent = t("atomic_shop_share");
    updateFilterIndicator();
    if (data.loaded) {
      buildFilterPanel();
      renderStats();
      renderStatus();
    }
    if (selectedItem && itemOpen()) renderItemDetail(selectedItem);
  }

  // ----- init / wiring -----
  function init() {
    if (booted) return;
    booted = true;
    cacheDom();
    if (!dom.atomicShopOverlay) return;

    applyLanguage();

    observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) renderNextChunk();
    }, { root: dom.atomicShopScroll || null, rootMargin: "240px" });

    dom.atomicShopBtn && dom.atomicShopBtn.addEventListener("click", openModal);
    dom.atomicShopCloseBtn && dom.atomicShopCloseBtn.addEventListener("click", closeModal);
    dom.atomicShopCloseIconBtn && dom.atomicShopCloseIconBtn.addEventListener("click", closeModal);
    dom.atomicShopOverlay.addEventListener("click", (e) => { if (e.target === dom.atomicShopOverlay) closeModal(); });

    dom.atomicShopItemBackBtn && dom.atomicShopItemBackBtn.addEventListener("click", closeItemOverlay);
    dom.atomicShopItemCloseIcon && dom.atomicShopItemCloseIcon.addEventListener("click", closeItemOverlay);
    dom.atomicShopItemOverlay && dom.atomicShopItemOverlay.addEventListener("click", (e) => { if (e.target === dom.atomicShopItemOverlay) closeItemOverlay(); });
    dom.atomicShopItemShareBtn && dom.atomicShopItemShareBtn.addEventListener("click", copyShareLink);

    if (dom.atomicShopSearchInput) {
      dom.atomicShopSearchInput.addEventListener("input", (e) => {
        query = e.target.value || "";
        if (dom.atomicShopClearBtn) dom.atomicShopClearBtn.hidden = !query;
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(() => { if (data.loaded) applyAndRender(); }, 200);
      });
    }
    if (dom.atomicShopClearBtn) {
      dom.atomicShopClearBtn.addEventListener("click", () => {
        query = "";
        dom.atomicShopSearchInput.value = "";
        dom.atomicShopClearBtn.hidden = true;
        if (data.loaded) applyAndRender();
        dom.atomicShopSearchInput.focus();
      });
    }
    if (dom.atomicShopFilterToggle && dom.atomicShopFilterPanel) {
      dom.atomicShopFilterToggle.addEventListener("click", () => {
        const open = dom.atomicShopFilterPanel.hidden;
        dom.atomicShopFilterPanel.hidden = !open;
        dom.atomicShopFilterToggle.setAttribute("aria-expanded", open ? "true" : "false");
        renderStats();
      });
    }
    dom.atomicShopFilterReset && dom.atomicShopFilterReset.addEventListener("click", resetFilters);

    // tile click via delegation
    dom.atomicShopResults && dom.atomicShopResults.addEventListener("click", (e) => {
      const tile = e.target.closest && e.target.closest(".atomic-shop-tile");
      if (!tile) return;
      const item = data.byEdid.get(normalizeEdid(tile.dataset.edid)) || data.byShareId.get(tile.dataset.share);
      if (item) openItem(item);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (itemOpen()) { e.stopPropagation(); closeItemOverlay(); }
      else if (modalOpen()) { e.stopPropagation(); closeModal(); }
    }, true);

    // Legacy deep-links are public dossier links now. The classified modal stays
    // behind the hacking flow instead of opening from a copied URL.
    try {
      const legacyShare = new URLSearchParams(window.location.search).get(ATOMIC_SHOP_SHARE_PARAM);
      if (legacyShare) {
        window.location.replace(atomicShopDossierUrlFor(legacyShare));
        return;
      }
    } catch (_) {}
  }

  window.updateAtomicShopLanguage = applyLanguage;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
