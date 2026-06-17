(function atomicShopDossier() {
  "use strict";

  const ORIGIN = typeof ATOMIC_SHOP_ORIGIN !== "undefined" ? ATOMIC_SHOP_ORIGIN : "https://db.atomicshop.fyi";
  const PROXY_ORIGIN = typeof ATOMIC_SHOP_PROXY_ORIGIN !== "undefined" ? ATOMIC_SHOP_PROXY_ORIGIN : "/api/atomic-shop/assets";
  const DB_URL = typeof ATOMIC_SHOP_DB_URL !== "undefined" ? ATOMIC_SHOP_DB_URL : `${ORIGIN}/data/items-db.json`;
  const KEYWORDS_URL = typeof ATOMIC_SHOP_KEYWORDS_URL !== "undefined" ? ATOMIC_SHOP_KEYWORDS_URL : `${ORIGIN}/data/edidkeywords.json`;
  const CACHE_KEY = typeof ATOMIC_SHOP_CACHE_KEY !== "undefined" ? ATOMIC_SHOP_CACHE_KEY : "atomic_shop_db_cache_v1";
  const CACHE_TTL_MS = typeof ATOMIC_SHOP_CACHE_TTL_MS !== "undefined" ? ATOMIC_SHOP_CACHE_TTL_MS : 6 * 60 * 60 * 1000;
  const CUT_CONTENT = "\u200bCut Content";
  const STORAGE_LANG_KEY_FALLBACK = "pipboy_lang";

  const CATEGORY_LABELS_ES = {
    [CUT_CONTENT]: "Contenido Cortado",
    "No Image": "Sin Imagen",
    "Player Icons": "Iconos",
    Titles: "Titulos",
    Emotes: "Gestos",
    Bundle: "Paquetes",
    Misc: "Varios",
    Bobbers: "Flotadores",
    Outfits: "Atuendos",
    Headwear: "Sombreros",
    Armor: "Armadura",
    Weapons: "Armas",
    Furniture: "Muebles",
    Lights: "Luces",
    Hairstyle: "Peinados",
    Tattoos: "Tatuajes",
    Facepaint: "Pintura facial"
  };

  const STRINGS = {
    en: {
      pageTitle: "Atomic Shop Item Dossier",
      eyebrow: "PUBLIC REQUISITION DOSSIER",
      loadingSummary: "Loading item record...",
      statusLoading: "SYNCING",
      statusReady: "DOSSIER READY",
      statusMissing: "RECORD MISSING",
      returnButton: "RETURN TO FALLOUT CODEX",
      assetViewer: "ASSET VIEWER",
      itemRecord: "ITEM RECORD",
      noImage: "NO IMAGE AVAILABLE",
      readySummary: "Public item dossier generated from the Atomic Shop database. Classified archive access remains locked to the terminal.",
      noDescription: "No public description is registered for this item.",
      notice: "- Notice -",
      includes: "Includes:",
      dbInfo: "Database Info",
      fullName: "Full name",
      shortName: "Short name",
      price: "Price",
      noPrice: "No price registered",
      carousel: "Carousel images",
      edid: "EDID",
      primaryImage: "Primary image",
      directory: "Directory",
      missingTitle: "DOSSIER NOT FOUND",
      missingName: "No matching item record",
      missingNoId: "No item id was provided for this public dossier.",
      missingNotFound: "The requested Atomic Shop item could not be found in the current database.",
      missingCopyFresh: "Return to Fallout Codex and copy a fresh item dossier link.",
      syncError: "Unable to sync the Atomic Shop database right now."
    },
    es: {
      pageTitle: "Dossier de Articulo Atomic Shop",
      eyebrow: "DOSSIER PUBLICO DE REQUISICION",
      loadingSummary: "Cargando registro del articulo...",
      statusLoading: "SINCRONIZANDO",
      statusReady: "DOSSIER LISTO",
      statusMissing: "REGISTRO FALTANTE",
      returnButton: "VOLVER A FALLOUT CODEX",
      assetViewer: "VISOR DE RECURSO",
      itemRecord: "REGISTRO DEL ARTICULO",
      noImage: "SIN IMAGEN DISPONIBLE",
      readySummary: "Dossier publico generado desde la base de datos de Atomic Shop. El acceso al archivo clasificado sigue bloqueado en el terminal.",
      noDescription: "No hay descripcion publica registrada para este articulo.",
      notice: "- Aviso -",
      includes: "Incluye:",
      dbInfo: "Info de Base de Datos",
      fullName: "Nombre completo",
      shortName: "Nombre corto",
      price: "Precio",
      noPrice: "Sin precio registrado",
      carousel: "Imagenes del carrusel",
      edid: "EDID",
      primaryImage: "Imagen principal",
      directory: "Directorio",
      missingTitle: "DOSSIER NO ENCONTRADO",
      missingName: "Sin registro coincidente",
      missingNoId: "No se proporciono un id de articulo para este dossier publico.",
      missingNotFound: "El articulo solicitado no existe en la base de datos actual de Atomic Shop.",
      missingCopyFresh: "Vuelve a Fallout Codex y copia un enlace nuevo del dossier del articulo.",
      syncError: "No se pudo sincronizar la base de datos de Atomic Shop ahora mismo."
    }
  };

  const lang = detectLang();
  const text = STRINGS[lang] || STRINGS.en;

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
    Frames: ["_photomode_frame_"],
    "Player Icons": ["_playericon_"],
    Bobbers: ["_rodbobber_"]
  };

  for (let s = 1; s <= 25; s++) EDID_CATEGORY_KEYWORDS[`Season ${s}`] = [`score_s${s}_`];

  const data = {
    items: [],
    byEdid: new Map(),
    byShareId: new Map(),
    externalKeywords: {}
  };
  const dom = {};
  let gallery = { images: [], index: 0 };

  function detectLang() {
    try {
      const param = new URLSearchParams(window.location.search).get("lang");
      if (param && /^es\b/i.test(param)) return "es";
      if (param && /^en\b/i.test(param)) return "en";
    } catch (_) {}

    try {
      const key = typeof STORAGE_LANG_KEY !== "undefined" ? STORAGE_LANG_KEY : STORAGE_LANG_KEY_FALLBACK;
      const stored = localStorage.getItem(key);
      if (stored && /^es\b/i.test(stored)) return "es";
      if (stored && /^en\b/i.test(stored)) return "en";
    } catch (_) {}

    return /^es\b/i.test(navigator.language || "") ? "es" : "en";
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function cacheDom() {
    [
      "atomicDossierTitle", "atomicDossierSummary", "atomicDossierStatus",
      "atomicDossierImage", "atomicDossierNoImage", "atomicDossierThumbs",
      "atomicDossierItemName", "atomicDossierCategories", "atomicDossierDescription",
      "atomicDossierDisclaimer", "atomicDossierIncludes", "atomicDossierDbInfo"
    ].forEach((id) => { dom[id] = byId(id); });
    dom.eyebrow = document.querySelector(".atomic-dossier-eyebrow");
    dom.returnButton = document.querySelector(".atomic-dossier-button");
    dom.assetPill = document.querySelector(".atomic-dossier-asset .atomic-dossier-pill");
    dom.recordPill = document.querySelector(".atomic-dossier-record .atomic-dossier-pill");
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
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

  function assetOrigin() {
    return String(ORIGIN || "").replace(/\/+$/, "");
  }

  function proxyOrigin() {
    return String(PROXY_ORIGIN || "").replace(/\/+$/, "");
  }

  function getImagePath(directory, imageName) {
    if (!directory || !imageName) return "";
    let dir = String(directory).toLowerCase().replace(/\\/g, "/").replace(/\/+/g, "/");
    if (dir.startsWith("/")) dir = dir.substring(1);
    if (!dir.endsWith("/")) dir += "/";
    return `${dir}${imageName}`;
  }

  function getImageUrl(directory, imageName) {
    const path = getImagePath(directory, imageName);
    return path ? `${assetOrigin()}/${path}` : "";
  }

  function getFallbackForImageUrl(url) {
    const value = String(url || "");
    const primary = assetOrigin();
    const fallback = proxyOrigin();
    if (!value || !primary || !fallback || primary === fallback) return "";
    return value.startsWith(`${primary}/`) ? `${fallback}/${value.slice(primary.length + 1)}` : "";
  }

  function installImageFallback(img, fallbackUrl, onFinalError) {
    if (!img) return;
    img.onerror = () => {
      if (fallbackUrl && img.src !== fallbackUrl) {
        const next = fallbackUrl;
        fallbackUrl = "";
        img.src = next;
        return;
      }
      if (typeof onFinalError === "function") onFinalError();
    };
  }

  function warmGalleryImages(urls, activeUrl = "") {
    if (!Array.isArray(urls)) return;
    urls.slice(0, 6).forEach((url) => {
      if (!url || url === activeUrl) return;
      const image = new Image();
      image.decoding = "async";
      image.src = url;
    });
  }

  function primaryImageUrl(item) {
    return item.primaryImage ? getImageUrl(item.primaryImage.directory, item.primaryImage.imageName) : "";
  }

  function priceOf(item) {
    return item.highPriceOriginal || item.price || null;
  }

  function firstOrdinalMarkup() {
    return `<span class="atomic-dossier-first-symbol" aria-label="1st">¼</span>`;
  }

  function textWithFo76OrdinalsMarkup(value = "") {
    return esc(String(value || "").replace(/1ˢᵗ/g, "1st")).replace(/\b1st\b/g, firstOrdinalMarkup());
  }

  function bestName(item) {
    return [item.itemName, item.itemNameShort, item.name].filter(Boolean)
      .sort((a, b) => b.length - a.length)[0] || "N/A";
  }

  function categoryLabel(category) {
    if (category === "Support Item List (279/311)") return "Support Item List";
    if (lang === "es" && CATEGORY_LABELS_ES[category]) return CATEGORY_LABELS_ES[category];
    return String(category).replace("\u200b", "");
  }

  function matchesItemCondition(item, condition) {
    const [key, expected] = String(condition).split(":");
    if (!key || expected == null) return false;
    const actual = item[key];
    if (actual == null) return false;
    return String(actual).toLowerCase() === String(expected).toLowerCase();
  }

  function getItemCategories(item) {
    const categories = new Set();
    if (item.primaryImage && item.primaryImage.directory) {
      const dir = String(item.primaryImage.directory).toLowerCase();
      const parts = dir.split("/").filter(Boolean);
      parts.forEach((part) => {
        if (VALID_CATEGORIES.has(part)) {
          categories.add(part);
          return;
        }
        for (const [category, directories] of Object.entries(DIRECTORY_TO_CATEGORIES)) {
          if (directories.includes(part)) categories.add(category);
        }
      });
      if (dir.includes("/camp/utility/")) {
        categories.add("Utility");
        categories.add("CAMP");
      } else if (dir.includes("/storefront/utility/")) {
        categories.add("P2W");
      }
    }

    const edidKeywords = Object.assign({}, EDID_CATEGORY_KEYWORDS, data.externalKeywords);
    if (item.EDID) {
      const edid = item.EDID.toLowerCase();
      for (const [category, keywords] of Object.entries(edidKeywords)) {
        if (Array.isArray(keywords) && keywords.some((kw) => edid.includes(kw))) categories.add(category);
      }
    }

    if (matchesItemCondition(item, "cBadge:cut")) categories.add(CUT_CONTENT);
    if (!item.primaryImage) categories.add("No Image");
    return Array.from(categories);
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.items)) return null;
      if (Date.now() - (parsed.ts || 0) > CACHE_TTL_MS) return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function writeCache(items, keywords) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items, keywords }));
    } catch (_) {}
  }

  function indexItems(items, keywords) {
    data.externalKeywords = keywords && typeof keywords === "object" ? keywords : {};
    data.byEdid.clear();
    data.byShareId.clear();
    items.forEach((item, i) => {
      item._categories = getItemCategories(item);
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
  }

  async function loadData() {
    const cached = readCache();
    if (cached) {
      try {
        indexItems(cached.items, cached.keywords);
        return;
      } catch (_) {}
    }

    const [keywords, items] = await Promise.all([
      fetch(KEYWORDS_URL).then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
      fetch(DB_URL).then((r) => {
        if (!r.ok) throw new Error("Atomic Shop database unavailable");
        return r.json();
      })
    ]);
    indexItems(Array.isArray(items) ? items : [], keywords);
    writeCache(data.items, data.externalKeywords);
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

  function resolveBundleEntry(entry) {
    if (!entry) return null;
    if (typeof entry === "string") return { resolvedName: entry, primaryImage: null };
    const id = entry.EDID || entry.entmName || entry.edid || entry.entm || entry.id || null;
    const oldName = entry.szItemName || entry.name || entry.itemName || "";
    const record = id ? data.byEdid.get(normalizeEdid(id)) : null;
    return {
      resolvedName: (record && record.itemName) || oldName || id || "Unknown Item",
      primaryImage: (record && record.primaryImage) || entry.primaryImage || null
    };
  }

  function resolveBundleItems(item) {
    if (!item || !Array.isArray(item.dynamicBundleItems)) return [];
    return item.dynamicBundleItems.map(resolveBundleEntry).filter(Boolean);
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

  function checkImageExists(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  async function detectGalleryImages(item) {
    const images = [];
    const primary = primaryImageUrl(item);
    if (primary) images.push(primary);

    const bundleCarousel = resolveBundleItems(item)
      .map((entry) => entry.primaryImage)
      .filter((img) => img && img.directory && img.imageName);
    const source = bundleCarousel.length ? bundleCarousel : item.carouselImages;
    if (Array.isArray(source)) {
      const seen = new Set();
      source.forEach((image) => {
        if (!image || !image.imageName || !image.directory) return;
        const url = getImageUrl(image.directory, image.imageName);
        if (url && !seen.has(url) && !images.includes(url)) images.push(url);
        if (url) seen.add(url);
      });
    }

    if (!Array.isArray(item.carouselImages) && !bundleCarousel.length && item.primaryImage?.imageName && item.primaryImage?.directory) {
      const parsed = parseVariantBase(item.primaryImage.imageName);
      if (parsed) {
        for (let i = 1; i <= 8; i++) {
          const variant = getImageUrl(item.primaryImage.directory, buildVariantName(parsed.base, parsed.ext, i));
          const exists = await checkImageExists(variant);
          if (exists && !images.includes(variant)) images.push(variant);
          else if (!exists && i > 3) break;
        }
      }
    }

    return images;
  }

  function renderGallery() {
    if (!dom.atomicDossierImage) return;
    if (!gallery.images.length) {
      dom.atomicDossierImage.hidden = true;
      if (dom.atomicDossierNoImage) dom.atomicDossierNoImage.hidden = false;
      if (dom.atomicDossierThumbs) dom.atomicDossierThumbs.innerHTML = "";
      return;
    }

    const currentSrc = gallery.images[gallery.index];
    dom.atomicDossierImage.hidden = true;
    dom.atomicDossierImage.onload = () => {
      dom.atomicDossierImage.hidden = false;
    };
    installImageFallback(dom.atomicDossierImage, getFallbackForImageUrl(currentSrc), () => {
      dom.atomicDossierImage.hidden = true;
      dom.atomicDossierImage.removeAttribute("src");
      if (dom.atomicDossierNoImage) dom.atomicDossierNoImage.hidden = false;
    });
    if ("fetchPriority" in dom.atomicDossierImage) dom.atomicDossierImage.fetchPriority = "high";
    dom.atomicDossierImage.src = currentSrc;
    warmGalleryImages(gallery.images, currentSrc);
    if (dom.atomicDossierNoImage) dom.atomicDossierNoImage.hidden = true;

    if (!dom.atomicDossierThumbs) return;
    dom.atomicDossierThumbs.innerHTML = "";
    gallery.images.forEach((src, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "atomic-dossier-thumb" + (index === gallery.index ? " is-active" : "");
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      installImageFallback(img, getFallbackForImageUrl(src), () => { button.style.display = "none"; });
      button.appendChild(img);
      button.addEventListener("click", () => {
        gallery.index = index;
        renderGallery();
      });
      dom.atomicDossierThumbs.appendChild(button);
    });
    dom.atomicDossierThumbs.hidden = gallery.images.length <= 1;
  }

  function renderItem(item) {
    const itemName = item.itemName || item.itemNameShort || item.name || "Atomic Shop Item";
    const { description, disclaimer: parsedDisclaimer } = parseDescriptionAndDisclaimer(item.desc || "");
    const disclaimer = item.disclaimer || parsedDisclaimer || "";
    const price = priceOf(item);
    const bundleNames = resolveBundleItems(item).map((entry) => entry.resolvedName).filter(Boolean);

    document.title = `${itemName} | ${text.pageTitle}`;
    document.documentElement.lang = lang;
    if (dom.atomicDossierTitle) dom.atomicDossierTitle.textContent = itemName;
    if (dom.atomicDossierItemName) dom.atomicDossierItemName.textContent = itemName;
    if (dom.atomicDossierSummary) {
      dom.atomicDossierSummary.textContent = text.readySummary;
    }
    if (dom.atomicDossierStatus) {
      dom.atomicDossierStatus.dataset.state = "ready";
      dom.atomicDossierStatus.textContent = text.statusReady;
    }

    const categories = (item._categories || []).filter((c) => !["No Image", "Missing Directory", "Invalid Image Path"].includes(c));
    if (dom.atomicDossierCategories) {
      dom.atomicDossierCategories.hidden = !categories.length;
      dom.atomicDossierCategories.innerHTML = categories
        .map((category) => `<span class="atomic-dossier-category">${esc(categoryLabel(category))}</span>`)
        .join("");
    }

    if (dom.atomicDossierDescription) {
      dom.atomicDossierDescription.innerHTML = textWithFo76OrdinalsMarkup(description || text.noDescription);
    }

    if (dom.atomicDossierDisclaimer) {
      dom.atomicDossierDisclaimer.hidden = !disclaimer;
      dom.atomicDossierDisclaimer.innerHTML = disclaimer
        ? `<strong>${esc(text.notice)}</strong>${textWithFo76OrdinalsMarkup(disclaimer).replace(/\n/g, "<br>")}`
        : "";
    }

    if (dom.atomicDossierIncludes) {
      dom.atomicDossierIncludes.hidden = !bundleNames.length;
      dom.atomicDossierIncludes.innerHTML = bundleNames.length
        ? `<strong>${esc(text.includes)}</strong> ${bundleNames.map((name) => `<span>${textWithFo76OrdinalsMarkup(name)}</span>`).join(", ")}`
        : "";
    }

    let imgName = item.primaryImage ? item.primaryImage.imageName : "N/A";
    imgName = String(imgName).toLowerCase().replace(/\.webp$/i, ".dds");
    const imgDir = item.primaryImage ? item.primaryImage.directory : "N/A";
    const cells = [
      [text.fullName, itemName, true],
      [text.shortName, item.itemNameShort || "N/A", false],
      [text.price, price ? `Atoms ${price}` : text.noPrice, false],
      [text.carousel, String(Math.max(0, gallery.images.length - 1)), false],
      [text.edid, (item.EDID || "N/A").toLowerCase(), true],
      [text.primaryImage, imgName, true],
      [text.directory, String(imgDir).toLowerCase(), true]
    ];

    if (dom.atomicDossierDbInfo) {
      dom.atomicDossierDbInfo.innerHTML =
        `<span class="atomic-dossier-db-label">${esc(text.dbInfo)}</span>` +
        `<div class="atomic-dossier-db-grid">` +
        cells.map(([label, value, wide]) =>
          `<div class="atomic-dossier-db-cell${wide ? " is-wide" : ""}">` +
            `<span class="atomic-dossier-db-label-text">${esc(label)}</span>` +
            `<code class="atomic-dossier-db-value">${esc(value)}</code>` +
          `</div>`
        ).join("") +
        `</div>`;
    }
  }

  function getRequestedItemId() {
    try {
      const params = new URLSearchParams(window.location.search);
      return (params.get("item") || params.get("atomicShop") || "").trim();
    } catch (_) {
      return "";
    }
  }

  function findRequestedItem(id) {
    const key = String(id || "").toLowerCase().replace(/^0x/, "");
    return data.byShareId.get(key) || data.byEdid.get(normalizeEdid(id));
  }

  function setError(message) {
    if (dom.atomicDossierStatus) {
      dom.atomicDossierStatus.dataset.state = "error";
      dom.atomicDossierStatus.textContent = text.statusMissing;
    }
    if (dom.atomicDossierTitle) dom.atomicDossierTitle.textContent = text.missingTitle;
    if (dom.atomicDossierSummary) dom.atomicDossierSummary.textContent = message;
    if (dom.atomicDossierItemName) dom.atomicDossierItemName.textContent = text.missingName;
    if (dom.atomicDossierDescription) dom.atomicDossierDescription.textContent = text.missingCopyFresh;
    if (dom.atomicDossierNoImage) dom.atomicDossierNoImage.hidden = false;
    if (dom.atomicDossierImage) dom.atomicDossierImage.hidden = true;
  }

  async function init() {
    cacheDom();
    document.documentElement.lang = lang;
    if (dom.eyebrow) dom.eyebrow.textContent = text.eyebrow;
    if (dom.atomicDossierSummary) dom.atomicDossierSummary.textContent = text.loadingSummary;
    if (dom.atomicDossierStatus) dom.atomicDossierStatus.textContent = text.statusLoading;
    if (dom.returnButton) dom.returnButton.textContent = text.returnButton;
    if (dom.assetPill) dom.assetPill.textContent = text.assetViewer;
    if (dom.recordPill) dom.recordPill.textContent = text.itemRecord;
    if (dom.atomicDossierNoImage) dom.atomicDossierNoImage.textContent = text.noImage;

    const id = getRequestedItemId();
    if (!id) {
      setError(text.missingNoId);
      return;
    }

    try {
      await loadData();
      const item = findRequestedItem(id);
      if (!item) {
        setError(text.missingNotFound);
        return;
      }

      gallery = { images: [], index: 0 };
      renderItem(item);
      renderGallery();
      gallery.images = await detectGalleryImages(item);
      renderItem(item);
      renderGallery();
    } catch (error) {
      setError(text.syncError);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
