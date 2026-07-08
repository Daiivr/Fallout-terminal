// classified.js — Classified tab, Nuka intel, player counts, and archive search logic
// Loaded before app.js; depends on shared globals from config/state/elements and app helpers at runtime.
const CLASSIFIED_SEARCH_RENDER_DEBOUNCE_MS = 180;
let classifiedSearchRenderTimer = 0;

function setClassifiedSearchCount(text = "") {
  if (!elements.classifiedSearchCount) {
    return;
  }
  const hasText = Boolean(text);
  elements.classifiedSearchCount.hidden = !hasText;
  elements.classifiedSearchCount.textContent = hasText ? text : "";
}

function clearClassifiedSearchRenderSchedule() {
  if (!classifiedSearchRenderTimer) {
    return;
  }
  clearTimeout(classifiedSearchRenderTimer);
  classifiedSearchRenderTimer = 0;
}

function scheduleClassifiedMinervaSearchResultsRender() {
  if (!state.classifiedSearch.open) {
    clearClassifiedSearchRenderSchedule();
    return;
  }

  clearClassifiedSearchRenderSchedule();
  classifiedSearchRenderTimer = window.setTimeout(() => {
    classifiedSearchRenderTimer = 0;
    renderClassifiedMinervaSearchResults();
  }, CLASSIFIED_SEARCH_RENDER_DEBOUNCE_MS);
}

function syncClassifiedArchiveVisibility() {
  const detailOpen = Boolean(state.classifiedDetail.open && state.classifiedDetail.item);
  const searchOpen = Boolean(state.classifiedSearch.open);

  if (elements.classifiedSearchWrap) {
    elements.classifiedSearchWrap.hidden = detailOpen || !searchOpen;
  }
  if (elements.classifiedSearchResults) {
    elements.classifiedSearchResults.hidden = detailOpen || !searchOpen;
  }
  if (elements.classifiedMinervaLists) {
    elements.classifiedMinervaLists.hidden = detailOpen || searchOpen;
  }
  if (elements.classifiedInlineDetail) {
    elements.classifiedInlineDetail.hidden = !detailOpen;
  }
}

function refreshClassifiedArchiveCardBaseSize(force = false) {
  if (!elements.classifiedArchiveCard || (state.classifiedSearch.open && !force)) {
    return;
  }

  const rect = elements.classifiedArchiveCard.getBoundingClientRect();
  const cardWidth = Math.round(rect.width);
  if (cardWidth > 0) {
    state.classifiedSearch.baseArchiveWidth = cardWidth;
  }
}

function lockClassifiedArchiveCardSize() {
  if (!elements.classifiedArchiveCard) {
    return;
  }

  const rect = elements.classifiedArchiveCard.getBoundingClientRect();
  const measuredWidth = Math.round(rect.width);
  if (measuredWidth > 0 && !state.classifiedSearch.baseArchiveWidth) {
    state.classifiedSearch.baseArchiveWidth = measuredWidth;
  }

  const targetWidth = state.classifiedSearch.baseArchiveWidth || measuredWidth || 0;
  if (targetWidth > 0) {
    const nextWidth = `${targetWidth}px`;
    elements.classifiedArchiveCard.style.width = nextWidth;
    elements.classifiedArchiveCard.style.minWidth = nextWidth;
    elements.classifiedArchiveCard.style.maxWidth = nextWidth;
  }
}

function unlockClassifiedArchiveCardSize() {
  if (!elements.classifiedArchiveCard) {
    return;
  }
  elements.classifiedArchiveCard.style.removeProperty("width");
  elements.classifiedArchiveCard.style.removeProperty("min-width");
  elements.classifiedArchiveCard.style.removeProperty("max-width");
}

function setClassifiedSearchOpen(active, { focusInput = false, clearQuery = false } = {}) {
  const wasOpen = state.classifiedSearch.open;
  const open = Boolean(active);
  state.classifiedSearch.open = open;

  if (open && !wasOpen) {
    refreshClassifiedArchiveCardBaseSize(true);
    lockClassifiedArchiveCardSize();
  }

  syncClassifiedArchiveVisibility();

  if (!open) {
    clearClassifiedSearchRenderSchedule();
    setClassifiedSearchCount("");
    if (wasOpen) {
      unlockClassifiedArchiveCardSize();
      requestAnimationFrame(() => {
        refreshClassifiedArchiveCardBaseSize();
      });
    }
  }

  if (elements.classifiedSearchToggleBtn) {
    elements.classifiedSearchToggleBtn.classList.toggle("is-active", open);
    elements.classifiedSearchToggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
    const titleKey = open ? "classified_search_toggle_close_label" : "classified_search_toggle_open_label";
    elements.classifiedSearchToggleBtn.title = t(titleKey);
    elements.classifiedSearchToggleBtn.setAttribute("aria-label", t(titleKey));
  }
  if (elements.classifiedSearchToggleText) {
    const textKey = open ? "classified_search_toggle_close" : "classified_search_toggle_open";
    elements.classifiedSearchToggleText.textContent = t(textKey);
  }

  if (!open && clearQuery && elements.classifiedSearchInput) {
    elements.classifiedSearchInput.value = "";
    state.classifiedSearch.query = "";
  }

  if (open && !(state.classifiedDetail.open && state.classifiedDetail.item)) {
    renderClassifiedMinervaSearchResults();
    if (focusInput && elements.classifiedSearchInput) {
      elements.classifiedSearchInput.focus();
      elements.classifiedSearchInput.select();
    }
  }
}

function renderClassifiedMinervaSearchResults() {
  clearClassifiedSearchRenderSchedule();

  if (!elements.classifiedSearchResults || !elements.classifiedSearchInput) {
    return;
  }

  if (!state.classifiedSearch.open) {
    elements.classifiedSearchResults.innerHTML = "";
    setClassifiedSearchCount("");
    return;
  }

  const query = String(elements.classifiedSearchInput.value || "").trim();
  state.classifiedSearch.query = query;

  if (!query) {
    setClassifiedSearchCount("");
    elements.classifiedSearchResults.innerHTML = `<p class="classified-search-empty">${t("classified_search_prompt")}</p>`;
    return;
  }

  const queryNorm = normalizePlanName(query);
  const queryRaw = normalizeSearchText(query);
  const entries = Array.isArray(state.classifiedSearch.entries) ? state.classifiedSearch.entries : [];
  const now = new Date();
  const availabilityByList = new Map();
  const getAvailability = (listNumber) => {
    const listKey = Number(listNumber);
    if (!Number.isFinite(listKey)) {
      return null;
    }
    if (!availabilityByList.has(listKey)) {
      availabilityByList.set(listKey, nextAvailabilityForList(listKey, now));
    }
    return availabilityByList.get(listKey);
  };

  const bestMatchByItem = new Map();
  for (const entry of entries) {
    const score = scoreClassifiedSearchEntry(entry, queryNorm, queryRaw);
    if (!score) {
      continue;
    }

    const availability = getAvailability(entry.listNumber);
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
    setClassifiedSearchCount(t("classified_search_results_count", { n: "0" }));
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

  const limited = matches.slice(0, 24);
  setClassifiedSearchCount(t("classified_search_results_count", { n: String(matches.length) }));

  const itemLabel = escapeHtml(t("classified_search_item"));
  const priceLabel = escapeHtml(t("classified_search_price"));
  const saleLabel = escapeHtml(t("classified_search_sale"));
  const availableLabel = escapeHtml(t("classified_search_available"));
  const daysLabel = escapeHtml(t("classified_search_days"));
  const rows = limited.map((match) => {
    const planIcon = isPlanOrPlanoItem(match.name)
      ? `<span class="fo76-icon" aria-hidden="true">${escapeHtml(PLAN_ITEM_GLYPH)}</span>`
      : "";
    const itemMarkup = match.wikiUrl
      ? `<button type="button" class="minerva-item-trigger classified-item-trigger" data-classified-search-detail="true" data-name="${escapeHtml(match.name)}" data-price="${escapeHtml(match.price ?? "")}" data-wiki-url="${escapeHtml(match.wikiUrl)}">${escapeHtml(match.name)}</button>`
      : escapeHtml(match.name);
    const priceText = match.price != null ? Number(match.price).toLocaleString() : "--";
    const saleText = `${t("list_value", { n: String(match.listNumber).padStart(2, "0") })} - ${t(match.availability.saleKey)} - ${localizeLocation(match.availability.location)}`;
    const availableStamp = formatStamp(match.availability.eventStart);
    const availableText = match.availability.isActive
      ? `${availableStamp} (${t("classified_search_now")})`
      : availableStamp;
    const daysText = t("classified_days_value", { n: match.availability.daysUntil });

    return `
      <article class="classified-search-row">
        <div class="classified-search-cell classified-search-item">
          <span class="classified-search-k">${itemLabel}</span>
          <span class="classified-search-v">${planIcon}${itemMarkup}</span>
        </div>
        <div class="classified-search-cell">
          <span class="classified-search-k">${priceLabel}</span>
          <span class="classified-search-v"><span class="fo76-icon" aria-hidden="true">${escapeHtml(GOLD_BULLION_GLYPH)}</span>${escapeHtml(priceText)}</span>
        </div>
        <div class="classified-search-cell">
          <span class="classified-search-k">${saleLabel}</span>
          <span class="classified-search-v">${escapeHtml(saleText)}</span>
        </div>
        <div class="classified-search-cell">
          <span class="classified-search-k">${availableLabel}</span>
          <span class="classified-search-v">${escapeHtml(availableText)}</span>
        </div>
        <div class="classified-search-cell">
          <span class="classified-search-k">${daysLabel}</span>
          <span class="classified-search-v">${escapeHtml(daysText)}</span>
        </div>
      </article>
    `;
  });

  elements.classifiedSearchResults.innerHTML = rows.join("");
}

function renderClassifiedInlineDetail() {
  if (
    !elements.classifiedInlineDetail
    || !elements.classifiedInlineName
    || !elements.classifiedInlineWikiLink
    || !elements.classifiedInlineStatus
    || !elements.classifiedInlineContent
    || !elements.classifiedInlineImage
    || !elements.classifiedInlineWhereLabel
    || !elements.classifiedInlineWhereList
    || !elements.classifiedInlineUnlocksLabel
    || !elements.classifiedInlineUnlocks
  ) {
    return;
  }

  const isOpen = Boolean(state.classifiedDetail.open && state.classifiedDetail.item);
  syncClassifiedArchiveVisibility();
  if (!isOpen) {
    return;
  }

  const item = state.classifiedDetail.item || {};
  const detail = state.classifiedDetail.data;
  const itemName = String(item.name || item.Name || t("files_unknown_value"));
  const wikiUrl = normalizeWikiUrl(detail?.wikiUrl || item.url || item.WikiUrl || "");

  elements.classifiedInlineName.textContent = itemName;
  elements.classifiedInlineWikiLink.textContent = t("minerva_detail_open_source");
  elements.classifiedInlineWikiLink.href = wikiUrl || "#";
  elements.classifiedInlineWikiLink.hidden = !wikiUrl;
  elements.classifiedInlineWhereLabel.textContent = t("minerva_detail_where_label");
  elements.classifiedInlineUnlocksLabel.textContent = t("minerva_detail_unlocks_label");
  if (elements.classifiedInlineCloseBtn) {
    elements.classifiedInlineCloseBtn.textContent = t("minerva_detail_back");
  }

  if (state.classifiedDetail.loading) {
    clearMinervaDetailImage(elements.classifiedInlineImage);
    elements.classifiedInlineStatus.hidden = false;
    elements.classifiedInlineStatus.textContent = t("minerva_detail_loading");
    elements.classifiedInlineContent.classList.remove("is-revealing");
    elements.classifiedInlineContent.hidden = true;
    return;
  }

  if (state.classifiedDetail.error || !detail) {
    clearMinervaDetailImage(elements.classifiedInlineImage);
    elements.classifiedInlineStatus.hidden = false;
    elements.classifiedInlineStatus.textContent = state.classifiedDetail.error || t("minerva_detail_error");
    elements.classifiedInlineContent.classList.remove("is-revealing");
    elements.classifiedInlineContent.hidden = true;
    return;
  }

  const shouldAnimateContent = elements.classifiedInlineContent.hidden;
  elements.classifiedInlineStatus.hidden = true;
  elements.classifiedInlineContent.hidden = false;

  const fallbackImageUrl = state.minervaDetail.fallbackImageUrl || MINERVA_DETAIL_FALLBACK_IMAGE;
  const detailImageUrl = detail.imageUrl || fallbackImageUrl;

  if (detailImageUrl) {
    void queueImagePreload(detailImageUrl, { highPriority: true });
    applyMinervaDetailImage(elements.classifiedInlineImage, detailImageUrl, {
      alt: `${itemName} image`,
      fallbackSrc: fallbackImageUrl || detailImageUrl
    });
  } else {
    clearMinervaDetailImage(elements.classifiedInlineImage);
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
  elements.classifiedInlineWhereList.innerHTML = "";
  elements.classifiedInlineWhereList.appendChild(whereFragment);

  elements.classifiedInlineUnlocks.textContent = detail.unlocks || t("minerva_detail_no_unlocks");

  if (shouldAnimateContent) {
    restartMinervaDetailAnimation(elements.classifiedInlineContent, "is-revealing", 320);
  }
}

function closeClassifiedInlineDetail() {
  state.classifiedDetail.requestId += 1;
  state.classifiedDetail.loading = false;
  state.classifiedDetail.error = "";
  state.classifiedDetail.item = null;
  state.classifiedDetail.data = null;
  state.classifiedDetail.open = false;
  clearMinervaDetailImage(elements.classifiedInlineImage);
  renderClassifiedInlineDetail();
  syncClassifiedArchiveVisibility();
  if (state.classifiedSearch.open) {
    renderClassifiedMinervaSearchResults();
  }
}

async function openClassifiedInlineDetail(item = {}) {
  const itemName = String(item?.name || item?.Name || "").trim();
  const itemUrl = normalizeWikiUrl(item?.url || item?.WikiUrl || item?.wikiUrl || "");
  if (!itemName || !itemUrl) {
    return;
  }

  const numericPrice = Number(item?.price ?? item?.Price);
  const safePrice = Number.isFinite(numericPrice) ? numericPrice : null;

  const normalizedItem = {
    name: itemName,
    Name: itemName,
    price: safePrice,
    Price: safePrice,
    url: itemUrl,
    WikiUrl: itemUrl
  };

  const detailKey = minervaDetailKeyFromUrl(itemUrl);
  const cacheKey = `${state.lang}:${detailKey}`;
  const requestId = state.classifiedDetail.requestId + 1;
  state.classifiedDetail.requestId = requestId;
  state.classifiedDetail.error = "";
  state.classifiedDetail.item = normalizedItem;
  state.classifiedDetail.open = true;
  state.classifiedDetail.loading = false;
  renderClassifiedInlineDetail();
  syncClassifiedArchiveVisibility();

  const cachedDetail = state.minervaDetail.cache[cacheKey];
  if (cachedDetail) {
    if (state.classifiedDetail.requestId !== requestId) {
      return;
    }
    state.classifiedDetail.data = cachedDetail;
    renderClassifiedInlineDetail();
    return;
  }

  const immediateOffline = resolveOfflineMinervaDetailFromMap(normalizedItem, state.lang);
  if (immediateOffline) {
    if (state.classifiedDetail.requestId !== requestId) {
      return;
    }
    state.classifiedDetail.data = immediateOffline;
    state.minervaDetail.cache[cacheKey] = immediateOffline;
    renderClassifiedInlineDetail();
    return;
  }

  state.classifiedDetail.loading = true;
  state.classifiedDetail.data = null;
  renderClassifiedInlineDetail();

  let offlineDetail = null;
  try {
    offlineDetail = await resolveOfflineMinervaDetail(normalizedItem, state.lang);
    if (state.classifiedDetail.requestId !== requestId) {
      return;
    }
    if (offlineDetail) {
      state.classifiedDetail.loading = false;
      state.classifiedDetail.error = "";
      state.classifiedDetail.data = offlineDetail;
      state.minervaDetail.cache[cacheKey] = offlineDetail;
      renderClassifiedInlineDetail();
      return;
    }
  } catch {
    // Continue with online fallback.
  }

  try {
    const liveDetail = await fetchMinervaPlanDetail(normalizedItem, state.lang);
    if (state.classifiedDetail.requestId !== requestId) {
      return;
    }

    const normalizedLive = {
      wikiUrl: normalizeWikiUrl(liveDetail?.wikiUrl || itemUrl),
      imageUrl: liveDetail?.imageUrl || state.minervaDetail.fallbackImageUrl || MINERVA_DETAIL_FALLBACK_IMAGE,
      whereElse: Array.isArray(liveDetail?.whereElse)
        ? liveDetail.whereElse.map((line) => sanitizeDetailText(line)).filter(Boolean)
        : [],
      unlocks: sanitizeDetailText(liveDetail?.unlocks || "")
    };

    state.classifiedDetail.loading = false;
    state.classifiedDetail.error = "";
    state.classifiedDetail.data = normalizedLive;
    state.minervaDetail.cache[cacheKey] = normalizedLive;
    renderClassifiedInlineDetail();
  } catch {
    if (state.classifiedDetail.requestId !== requestId) {
      return;
    }
    state.classifiedDetail.loading = false;
    state.classifiedDetail.error = t("minerva_detail_error");
    state.classifiedDetail.data = null;
    renderClassifiedInlineDetail();
  }
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

      const itemUrl = normalizeWikiUrl(item?.WikiUrl || "");
      if (itemUrl) {
        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "minerva-item-trigger classified-item-trigger";
        trigger.textContent = item.Name;
        trigger.addEventListener("click", (event) => {
          event.preventDefault();
          void openClassifiedInlineDetail({
            Name: item.Name,
            Price: item.Price,
            WikiUrl: itemUrl
          });
        });
        nameWrap.appendChild(trigger);
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
  refreshClassifiedArchiveCardBaseSize();
}

async function ensureClassifiedMinervaArchive() {
  const lists = await loadMinervaLists();
  renderClassifiedMinervaLists(lists);
  buildClassifiedSearchCatalog(lists);
  setClassifiedSearchOpen(state.classifiedSearch.open);
}

const CLASSIFIED_NUKA_PANEL_CONFIG = {
  dailyOps: {
    titleKey: "classified_intel_daily_ops_title",
    bodyKey: "classified_intel_daily_ops_body"
  },
  dailyChallenges: {
    titleKey: "classified_intel_daily_challenges_title",
    bodyKey: "classified_intel_daily_challenges_body"
  },
  weeklyChallenges: {
    titleKey: "classified_intel_weekly_challenges_title",
    bodyKey: "classified_intel_weekly_challenges_body"
  }
};

const CLASSIFIED_NUKA_READABLE_URLS = [
  "https://r.jina.ai/https://nukaknights.com/ajax/home.html",
  "https://r.jina.ai/https://nukaknights.com/en/"
];
const CLASSIFIED_NUKA_INTEL_CACHE_KEY = "fallout_codex_classified_nuka_intel_v4";
const CLASSIFIED_NUKA_INTEL_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const CLASSIFIED_NUKA_INTEL_RECHECK_INTERVAL_MS = 15 * 60 * 1000;
const CLASSIFIED_DAILY_OPS_LOGO_URL = "https://nukaknights.com/cms/templates/nukaknights/img/FO76_dailyops_uplink02_bw.png";

const CLASSIFIED_NUKA_ICON_PATHS = {
  lock: '<path d="M7 10V8a5 5 0 0 1 10 0v2h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1Zm2 0h6V8a3 3 0 0 0-6 0v2Z"/>',
  unlock: '<path d="M8 10V8a5 5 0 0 1 9.6-1.9l-1.8.8A3 3 0 0 0 10 8v2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2Z"/>',
  shield: '<path d="M12 3 19 6v5c0 4.6-2.7 8.2-7 10-4.3-1.8-7-5.4-7-10V6l7-3Zm0 3.1-4 1.7V11c0 3 1.5 5.4 4 6.8 2.5-1.4 4-3.8 4-6.8V7.8l-4-1.7Z"/>',
  group: '<path d="M7.5 11a3 3 0 1 1 .1-6 3 3 0 0 1-.1 6Zm9 0a3 3 0 1 1 .1-6 3 3 0 0 1-.1 6ZM2.8 20c.3-3.2 2.1-5.2 4.7-5.2s4.4 2 4.7 5.2H2.8Zm9 0c.1-1.4-.3-2.8-1.1-4 1-.8 2.2-1.2 3.8-1.2 2.6 0 4.4 2 4.7 5.2h-7.4Z"/>',
  medkit: '<path d="M9 4h6a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2V6a2 2 0 0 1 2-2Zm6 4V6H9v2h6Zm-4 4H9v3h2v2h2v-2h2v-3h-2v-2h-2v2Z"/>',
  skull: '<path d="M12 3c4 0 7 2.8 7 6.7 0 2.5-1.2 4.2-3 5.3v3a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-3c-1.8-1.1-3-2.8-3-5.3C5 5.8 8 3 12 3Zm-3.1 8.6c1 0 1.8-.8 1.8-1.7s-.8-1.7-1.8-1.7-1.8.8-1.8 1.7.8 1.7 1.8 1.7Zm6.2 0c1 0 1.8-.8 1.8-1.7s-.8-1.7-1.8-1.7-1.8.8-1.8 1.7.8 1.7 1.8 1.7ZM10 17h1v-2h-1v2Zm3 0h1v-2h-1v2Z"/>',
  eye: '<path d="M12 5c5.1 0 8.7 4.4 10 7-1.3 2.6-4.9 7-10 7S3.3 14.6 2 12c1.3-2.6 4.9-7 10-7Zm0 2C8.7 7 6 9.4 4.3 12 6 14.6 8.7 17 12 17s6-2.4 7.7-5C18 9.4 15.3 7 12 7Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"/>',
  "eye-slash": '<path d="m4.3 3 16.7 16.7-1.4 1.4-3.1-3.1c-1.3.6-2.8 1-4.5 1-5.1 0-8.7-4.4-10-7 .7-1.4 2.1-3.3 4-4.7L2.9 4.4 4.3 3Zm3.2 5.8A12.5 12.5 0 0 0 4.3 12C6 14.6 8.7 17 12 17c1.1 0 2.1-.2 3-.6l-1.7-1.7A3 3 0 0 1 9.3 10.7L7.5 8.8ZM12 5c5.1 0 8.7 4.4 10 7-.4.8-1 1.8-1.8 2.7l-1.4-1.4c.4-.4.7-.9 1-1.3C18 9.4 15.3 7 12 7c-.7 0-1.4.1-2 .3L8.4 5.7C9.5 5.2 10.7 5 12 5Z"/>',
  bomb: '<path d="M15.7 5.7 17 4.4 18.6 6 20 4.6 21.4 6 20 7.4 21.6 9 20.3 10.3 18.7 8.7 17.4 10 16 8.6 17.3 7.3 15.7 5.7ZM10 7a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm2.8-3.4 1.6 1.6-1.4 1.4L11.4 7 12.8 5.6Z"/>',
  sword: '<path d="M20.7 3.3 22 2l-1.3 6.2-7.3 7.3 2.1 2.1-1.4 1.4-2.1-2.1-2.1 2.1 2.1 2.1-1.4 1.4-2.1-2.1-2.1 2.1L4.9 21l2.1-2.1-2.1-2.1 1.4-1.4 2.1 2.1 2.1-2.1-2.1-2.1L15.8 6 22 4.7l-1.3-1.4Z"/>',
  snowflake: '<path d="M11 2h2v4.1l2.3-2.3 1.4 1.4L13 8.9V11h2.1l3.7-3.7 1.4 1.4-2.3 2.3H22v2h-4.1l2.3 2.3-1.4 1.4-3.7-3.7H13v2.1l3.7 3.7-1.4 1.4-2.3-2.3V22h-2v-4.1l-2.3 2.3-1.4-1.4 3.7-3.7V13H8.9l-3.7 3.7-1.4-1.4L6.1 13H2v-2h4.1L3.8 8.7l1.4-1.4L8.9 11H11V8.9L7.3 5.2l1.4-1.4L11 6.1V2Z"/>',
  hazard: '<path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm1 2.1V11l5.1-3A7 7 0 0 0 13 5.1ZM5 12c0 1.9.8 3.6 2 4.9l5-2.9v-4l-5-2.9A7 7 0 0 0 5 12Zm7 7a7 7 0 0 0 5.1-2.2L12 13.9 6.9 16.8A7 7 0 0 0 12 19Z"/>',
  swift: '<path d="M13 4 5 14h5l-1 6 9-11h-5l1-5ZM3 6h7v2H3V6Zm-2 5h6v2H1v-2Zm2 5h5v2H3v-2Z"/>',
  leaf: '<path d="M20.5 3.5C13.4 3.8 8 6.4 6.2 11.1c-.6 1.5-.7 3-.4 4.3l-2.3 2.3 1.4 1.4 2.2-2.2c1.2.4 2.8.3 4.3-.3 4.8-1.9 7.2-7 9.1-13.1Zm-4.1 3.1c-2.4 3.3-5 5.9-8.2 8.2.3-1.1 1.3-2.9 3-4.6 1.7-1.7 3.7-3 5.2-3.6Z"/>',
  calendar: '<path d="M7 2h2v3h6V2h2v3h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2V2Zm12 8H5v9h14v-9Z"/>',
  clock: '<path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm1 4h-2v6l5 3 1-1.7-4-2.3V7Z"/>',
  alert: '<path d="M12 3 22 20H2L12 3Zm1 13h-2v2h2v-2Zm0-7h-2v6h2V9Z"/>',
  star: '<path d="m12 2.7 2.8 5.7 6.3.9-4.5 4.4 1.1 6.2-5.7-3-5.7 3 1.1-6.2-4.5-4.4 6.3-.9L12 2.7Z"/>',
  repeat: '<path d="M17 2.8 21.2 7 17 11.2V8H8.5A3.5 3.5 0 0 0 5 11.5H3A5.5 5.5 0 0 1 8.5 6H17V2.8Zm-10 18.4L2.8 17 7 12.8V16h8.5a3.5 3.5 0 0 0 3.5-3.5h2a5.5 5.5 0 0 1-5.5 5.5H7v3.2Z"/>',
  trophy: '<path d="M7 3h10v2h3v2.2c0 2.9-1.7 5.1-4.4 5.8-.6 1-1.5 1.7-2.6 2v2h3v2H8v-2h3v-2c-1.1-.3-2-1-2.6-2C5.7 12.3 4 10.1 4 7.2V5h3V3Zm0 4H6v.2c0 1.4.6 2.6 1.6 3.3C7.2 9.4 7 8.2 7 7Zm10 0c0 1.2-.2 2.4-.6 3.5 1-.7 1.6-1.9 1.6-3.3V7h-1Z"/>',
  bulb: '<path d="M12 2a7 7 0 0 1 4.1 12.7c-.7.5-1.1 1.2-1.1 2.1V17H9v-.2c0-.9-.4-1.6-1.1-2.1A7 7 0 0 1 12 2Zm-3 17h6v2H9v-2Z"/>',
  marker: '<path d="M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/>'
};

const CLASSIFIED_NUKA_GLYPH_ICONS = {
  group: "\uF1ED",
  hostiles: "\uF8BF",
  mutation: "\uF159",
  repeat: "\uF346"
};

const CLASSIFIED_NUKA_ES_DAILY_OPS_TEXT = {
  "Uplink": "Enlace",
  "Decryption": "Descifrado",
  "Savage Strike": "Golpe salvaje",
  "Group Regeneration": "Regeneración de grupo",
  "Piercing Gaze": "Mirada penetrante",
  "Active Camouflage": "Camuflaje activo",
  Volatile: "Volátil",
  "Freezing Touch": "Toque congelante",
  "Swift-Footed": "Pies ligeros",
  "Resilient": "Resistente",
  "Toxic Blood": "Sangre tóxica",
  "Arktos Pharma Biome Labs": "Laboratorios de biomas de Arktos Pharma",
  "Watoga Raider Arena": "Arena de saqueadores de Watoga",
  "Community Center": "Centro comunitario",
  "Communists": "Comunistas",
  "Overgrown": "Agrestes"
};

const CLASSIFIED_NUKA_MUTATION_TOOLTIPS = {
  "Savage Strike": {
    en: "Enemies bypass armor resistances.",
    es: "Los enemigos ignoran las resistencias de armadura."
  },
  "Group Regeneration": {
    en: "Enemies heal nearby enemies and may heal themselves.",
    es: "Los enemigos curan a los enemigos cercanos y pueden curarse a sí mismos."
  },
  "Piercing Gaze": {
    en: "Enemies have greatly enhanced perception and detect nearby players.",
    es: "Los enemigos tienen percepción aumentada y detectan a jugadores cercanos."
  },
  "Resilient": {
    en: "Enemies can only be killed by a melee attack.",
    es: "Los enemigos solo pueden morir con un ataque cuerpo a cuerpo."
  },
  "Volatile": {
    en: "Enemies explode on death.",
    es: "Los enemigos explotan al morir."
  },
  "Freezing Touch": {
    en: "Enemy attacks freeze players.",
    es: "Los ataques enemigos congelan a los jugadores."
  },
  "Active Camouflage": {
    en: "Enemies are cloaked while not attacking.",
    es: "Los enemigos se camuflan mientras no atacan."
  },
  "Swift-Footed": {
    en: "Enemies have increased movement speed.",
    es: "Los enemigos tienen mayor velocidad de movimiento."
  },
  "Toxic Blood": {
    en: "Enemies leave toxic hazards on death.",
    es: "Los enemigos dejan peligros tóxicos al morir."
  }
};

const CLASSIFIED_NUKA_MUTATION_SYMBOLS = {
  "Active Camouflage": "eye-slash",
  Volatile: "bomb",
  "Piercing Gaze": "eye",
  "Savage Strike": "sword",
  Resilient: "shield",
  "Freezing Touch": "snowflake",
  "Toxic Blood": "hazard",
  "Swift-Footed": "swift",
  "Group Regeneration": "medkit"
};

const CLASSIFIED_NUKA_ES_CHALLENGE_TEXT = {
  "1st Drink Nuka-Twist (2)": "1st Beber Nuka-Twist (2)",
  "1st Eat Dog Food (5)": "1st Comer comida para perro (5)",
  "Gold Star: Complete a Daily Challenge (6)": "Estrella dorada: Completar un desafío diario (6)",
  "Complete a Gold Star Daily Challenge! (3)": "Completar un desafío diario de estrella dorada (3)",
  "Repeatable Under Rank 100: Gain XP (10000)": "Repetible por debajo del rango 100: Ganar PE (10000)",
  "Repeatable at Rank 100 or above: Complete a Public Event (3)": "Repetible en rango 100 o superior: Completar un evento público (3)",
  "Build a Bed, Table, or Stairs in a Workshop or C.A.M.P. (3)": "Construir una cama, mesa o escaleras en un taller o C.A.M.P. (3)",
  "Complete an Event": "Completar un evento",
  "Craft Bulk Aluminum": "Crear aluminio a granel",
  "Kill a Canine (5)": "Matar un cánido (5)",
  "Kill a Creature (12)": "Matar una criatura (12)",
  "Pick a Lock": "Forzar una cerradura",
  "Build a Decoration in a Shelter (15)": "Construir una decoración en un refugio (15)",
  "Collect Pre-war Food (20)": "Recoger comida de antes de la guerra (20)",
  "Collect RadAway or Rad-X (15)": "Recoger RadAway o Rad-X (15)",
  "Collect Soap (14)": "Recoger jabón (14)",
  "Complete a Mutated Public Event (3)": "Completar un evento público mutado (3)",
  "Cripple a Human's Head (25)": "Lisiar la cabeza de un humano (25)",
  "Kill a Mutated Enemy (30)": "Matar a un enemigo mutado (30)",
  "Mod an Energy Weapon (5)": "Modificar un arma de energía (5)",
  "Scrap junk to produce Glass (30)": "Desguazar chatarra para obtener vidrio (30)",
  "Collect a Board Game": "Recoger un juego de mesa",
  "1st Collect a Board Game": "1st recoger un juego de mesa",
  "Craft or Scrap a piece of Power Armor": "Crear o desguazar una pieza de servoarmadura",
  "Cripple a Protectron or a Robobrain's Arm (2)": "Lisiar el brazo de un Protectrón o un Robocerebro (2)",
  "Destroy an Assaultron": "Destruir un Assaultron",
  "Mod a piece of Armor (5)": "Modificar una pieza de armadura (5)",
  "Buy an item from or Sell an item to another Player (15)": "Comprar un objeto de otro jugador o venderle un objeto (15)",
  "Collect Caps (2500)": "Recoger chapas (2500)",
  "Complete a Grunt Hunt (10)": "Completar una cacería Grunt Hunt (10)",
  "Consume an Alcoholic Beverage (20)": "Consumir una bebida alcohólica (20)",
  "Craft any Plushie at a Tinkerer's Bench (3)": "Crear cualquier peluche en una mesa de artesano (3)",
  "Kill a Mole Miner (30)": "Matar a un minero topo (30)",
  "Kill a Rust Raider (30)": "Matar a un Rust Raider (30)",
  "Scrap junk to produce Acid (15)": "Desguazar chatarra para obtener ácido (15)",
  "Scrap junk to produce Adhesive (15)": "Desguazar chatarra para obtener adhesivo (15)"
};

const CLASSIFIED_NUKA_ES_CHALLENGE_REPLACEMENTS = [
  [/^Gold Star:\s*/i, "Estrella dorada: "],
  [/^Repeatable Under Rank 100:\s*/i, "Repetible por debajo del rango 100: "],
  [/^Repeatable at Rank 100 or above:\s*/i, "Repetible en rango 100 o superior: "],
  [/\bComplete a Gold Star Daily Challenge!?\b/gi, "Completar un desafío diario de estrella dorada"],
  [/\bComplete a Daily Challenge\b/gi, "Completar un desafío diario"],
  [/\bComplete a Mutated Public Event\b/gi, "Completar un evento público mutado"],
  [/\bComplete a Public Event\b/gi, "Completar un evento público"],
  [/\bComplete an Event\b/gi, "Completar un evento"],
  [/\bComplete a Grunt Hunt\b/gi, "Completar una cacería Grunt Hunt"],
  [/\bBuy an item from or Sell an item to another Player\b/gi, "Comprar un objeto de otro jugador o venderle un objeto"],
  [/\bBuild a Bed, Table, or Stairs in a Workshop or C\.A\.M\.P\.\b/gi, "Construir una cama, mesa o escaleras en un taller o C.A.M.P."],
  [/\bBuild a Decoration in a Shelter\b/gi, "Construir una decoración en un refugio"],
  [/\bConsume an Alcoholic Beverage\b/gi, "Consumir una bebida alcohólica"],
  [/\bCollect Pre-war Food\b/gi, "Recoger comida de antes de la guerra"],
  [/\bCollect RadAway or Rad-X\b/gi, "Recoger RadAway o Rad-X"],
  [/\bCollect Soap\b/gi, "Recoger jabón"],
  [/\bCraft any Plushie at a Tinkerer's Bench\b/gi, "Crear cualquier peluche en una mesa de artesano"],
  [/\bCraft Bulk Aluminum\b/gi, "Crear aluminio a granel"],
  [/\bCripple a Human's Head\b/gi, "Lisiar la cabeza de un humano"],
  [/\bDrink Nuka-Twist\b/gi, "Beber Nuka-Twist"],
  [/\bDrink Nuka-Cola Quantum\b/gi, "Beber Nuka-Cola Quantum"],
  [/\bDrink Nuka-Cola Wild\b/gi, "Beber Nuka-Cola Wild"],
  [/\bDrink Nuka-Cola\b/gi, "Beber Nuka-Cola"],
  [/\bDrink Nuka-Grape\b/gi, "Beber Nuka-Grape"],
  [/\bDrink Nuka-Orange\b/gi, "Beber Nuka-Orange"],
  [/\bCollect any flavor of Nuka-Cola\b/gi, "Recoger cualquier sabor de Nuka-Cola"],
  [/\bTake a Camera Picture at\b/gi, "Hacer una foto con la cámara en"],
  [/\bTake a Camera Picture\b/gi, "Hacer una foto con la cámara"],
  [/\bEat Dog Food\b/gi, "Comer comida para perro"],
  [/\bGain XP\b/gi, "Ganar PE"],
  [/\bKill a Mutated Enemy\b/gi, "Matar a un enemigo mutado"],
  [/\bKill a Canine\b/gi, "Matar un cánido"],
  [/\bKill a Creature\b/gi, "Matar una criatura"],
  [/\bMod an Energy Weapon\b/gi, "Modificar un arma de energía"],
  [/\bPick a Lock\b/gi, "Forzar una cerradura"],
  [/\bScrap junk to produce Glass\b/gi, "Desguazar chatarra para obtener vidrio"],
  [/\bCraft or Scrap a piece of Power Armor\b/gi, "Crear o desguazar una pieza de servoarmadura"],
  [/\bCripple a Protectron or a Robobrain's Arm\b/gi, "Lisiar el brazo de un Protectrón o un Robocerebro"],
  [/\bCollect a Board Game\b/gi, "Recoger un juego de mesa"],
  [/\bCollect a Magazine\b/gi, "Recoger una revista"],
  [/\bCollect Caps\b/gi, "Recoger chapas"],
  [/\bCollect Junk\b/gi, "Recoger chatarra"],
  [/\bCraft a piece of Power Armor\b/gi, "Crear una pieza de servoarmadura"],
  [/\bCraft a piece of Armor\b/gi, "Crear una pieza de armadura"],
  [/\bCraft a Weapon\b/gi, "Crear un arma"],
  [/\bScrap a Weapon\b/gi, "Desguazar un arma"],
  [/\bDestroy an Assaultron\b/gi, "Destruir un Assaultron"],
  [/\bDestroy a Robot\b/gi, "Destruir un robot"],
  [/\bMod a piece of Power Armor\b/gi, "Modificar una pieza de servoarmadura"],
  [/\bMod a piece of Armor\b/gi, "Modificar una pieza de armadura"],
  [/\bMod a Weapon\b/gi, "Modificar un arma"],
  [/\bKill a Mole Miner\b/gi, "Matar a un minero topo"],
  [/\bKill a Rust Raider\b/gi, "Matar a un Rust Raider"],
  [/\bKill a Scorched\b/gi, "Matar a un Carbonizado"],
  [/\bKill a Super Mutant\b/gi, "Matar a un supermutante"],
  [/\bKill a Ghoul\b/gi, "Matar a un necrófago"],
  [/\bKill a Robot\b/gi, "Matar a un robot"],
  [/\bScrap junk to produce Acid\b/gi, "Desguazar chatarra para obtener ácido"],
  [/\bScrap junk to produce Adhesive\b/gi, "Desguazar chatarra para obtener adhesivo"],
  [/\bScrap junk to produce Aluminum\b/gi, "Desguazar chatarra para obtener aluminio"],
  [/\bScrap junk to produce Cloth\b/gi, "Desguazar chatarra para obtener tela"],
  [/\bScrap junk to produce Copper\b/gi, "Desguazar chatarra para obtener cobre"],
  [/\bScrap junk to produce Gears\b/gi, "Desguazar chatarra para obtener engranajes"],
  [/\bScrap junk to produce Leather\b/gi, "Desguazar chatarra para obtener cuero"],
  [/\bScrap junk to produce Oil\b/gi, "Desguazar chatarra para obtener aceite"],
  [/\bScrap junk to produce Plastic\b/gi, "Desguazar chatarra para obtener plástico"],
  [/\bScrap junk to produce Rubber\b/gi, "Desguazar chatarra para obtener goma"],
  [/\bScrap junk to produce Screws\b/gi, "Desguazar chatarra para obtener tornillos"],
  [/\bScrap junk to produce Silver\b/gi, "Desguazar chatarra para obtener plata"],
  [/\bScrap junk to produce Springs\b/gi, "Desguazar chatarra para obtener resortes"],
  [/\bScrap junk to produce Steel\b/gi, "Desguazar chatarra para obtener acero"],
  [/\bScrap junk to produce Wood\b/gi, "Desguazar chatarra para obtener madera"],
  [/^1st\s+/i, "1st "]
];

function classifiedNukaIconMarkup(iconKey = "marker", className = "") {
  const safeKey = Object.prototype.hasOwnProperty.call(CLASSIFIED_NUKA_ICON_PATHS, iconKey) ? iconKey : "marker";
  const safeClassName = String(className || "").replace(/[^\w -]/g, "").trim();
  return `<span class="classified-nuka-icon classified-nuka-icon-${safeKey}${safeClassName ? ` ${safeClassName}` : ""}" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">${CLASSIFIED_NUKA_ICON_PATHS[safeKey]}</svg></span>`;
}

function classifiedNukaGlyphIconMarkup(glyphKey = "group", className = "") {
  const safeKey = Object.prototype.hasOwnProperty.call(CLASSIFIED_NUKA_GLYPH_ICONS, glyphKey) ? glyphKey : "group";
  const safeClassName = String(className || "").replace(/[^\w -]/g, "").trim();
  return `<span class="classified-nuka-icon classified-nuka-glyph-icon classified-nuka-glyph-icon-${safeKey}${safeClassName ? ` ${safeClassName}` : ""}" aria-hidden="true">${escapeHtml(CLASSIFIED_NUKA_GLYPH_ICONS[safeKey])}</span>`;
}

function classifiedDailyOpsLogoMarkup(className = "") {
  const safeClassName = String(className || "").replace(/[^\w -]/g, "").trim();
  return `
    <span class="classified-daily-ops-logo${safeClassName ? ` ${safeClassName}` : ""}" aria-hidden="true">
      <img src="${escapeHtml(CLASSIFIED_DAILY_OPS_LOGO_URL)}" alt="" loading="lazy" decoding="async">
    </span>
  `;
}

function formatClassifiedNukaChallengeName(value = "") {
  return String(value || "").replace(/1ˢᵗ/g, "1st");
}

function buildFo76FirstOrdinalMarkup(label = "first") {
  return `<span class="fo76-icon classified-nuka-first-symbol" aria-label="${escapeHtml(label)}">¼</span>`;
}

function replaceFirstOrdinalWithFo76Markup(value = "") {
  return escapeHtml(formatClassifiedNukaChallengeName(value)).replace(
    /\b1st\b/g,
    buildFo76FirstOrdinalMarkup()
  );
}

function buildClassifiedNukaChallengeNameMarkup(value = "") {
  return replaceFirstOrdinalWithFo76Markup(value);
}

function isClassifiedNukaSpanish() {
  return state.lang === "es";
}

function translateClassifiedNukaDailyOpsText(value = "") {
  const normalized = String(value || "").trim();
  if (!isClassifiedNukaSpanish() || !normalized) {
    return normalized;
  }
  return CLASSIFIED_NUKA_ES_DAILY_OPS_TEXT[normalized] || normalized;
}

function getClassifiedNukaMutationTooltip(value = "") {
  const normalized = String(value || "").trim();
  const tooltip = CLASSIFIED_NUKA_MUTATION_TOOLTIPS[normalized];
  if (!tooltip) {
    return "";
  }
  return tooltip[state.lang === "es" ? "es" : "en"] || tooltip.en || "";
}

function getClassifiedNukaMutationSymbol(value = "") {
  const normalized = String(value || "").replace(/^\+\s*/, "").trim();
  return CLASSIFIED_NUKA_MUTATION_SYMBOLS[normalized] || "marker";
}

function splitClassifiedNukaMutationTokens(value = "") {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return [];
  }

  return normalized
    .split(/\s+\+\s+|\s+(?=\+\s*)/)
    .map((token, index) => {
      const cleaned = token.replace(/^\+\s*/, "").trim();
      return cleaned ? { value: cleaned, prefixed: index > 0 || /^\+\s*/.test(token) } : null;
    })
    .filter(Boolean);
}

function buildClassifiedNukaMutationTokenMarkup(value = "") {
  const displayValue = translateClassifiedNukaDailyOpsText(value);
  const tooltip = getClassifiedNukaMutationTooltip(value);
  const symbolKey = getClassifiedNukaMutationSymbol(value);
  return `
    <span class="classified-intel-mutation-token"${tooltip ? ` tabindex="0" aria-label="${escapeHtml(`${displayValue}. ${tooltip}`)}"` : ""}>
      ${classifiedNukaIconMarkup(symbolKey, "classified-nuka-mutation-icon")}
      <span>${escapeHtml(displayValue)}</span>
      ${tooltip ? `<span class="classified-intel-mutation-tooltip" role="tooltip">${escapeHtml(tooltip)}</span>` : ""}
    </span>
  `;
}

function buildClassifiedNukaMutationValueMarkup(value = "") {
  const tokens = splitClassifiedNukaMutationTokens(value);
  if (!tokens.length) {
    return "";
  }

  // Render the "+" as its own connector between tokens (a centered line in the
  // stacked card layout) rather than as a prefix glued to the next mutation.
  const plus = '<span class="classified-intel-mutation-plus" aria-hidden="true">+</span>';
  return `
    <span class="classified-intel-mutation-value">
      ${tokens.map((token, index) =>
        (index > 0 ? plus : "") + buildClassifiedNukaMutationTokenMarkup(token.value)
      ).join("")}
    </span>
  `;
}

function translateClassifiedNukaRelativeTime(value = "") {
  const normalized = String(value || "").trim();
  if (!isClassifiedNukaSpanish() || !normalized) {
    return normalized;
  }

  return normalized
    .replace(/^Ends in\b/i, "Termina en")
    .replace(/\b1 days\b/gi, "1 día")
    .replace(/\b1 hours\b/gi, "1 hora")
    .replace(/\b1 minutes\b/gi, "1 minuto")
    .replace(/\bdays\b/gi, "días")
    .replace(/\bhours\b/gi, "horas")
    .replace(/\bminutes\b/gi, "minutos")
    .replace(/\bday\b/gi, "día")
    .replace(/\bhour\b/gi, "hora")
    .replace(/\bminute\b/gi, "minuto");
}

function translateClassifiedNukaSince(value = "") {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return normalized;
  }
  return normalized.replace(/^since\s*/i, "");
}

function translateClassifiedNukaChallengeName(value = "") {
  const normalized = formatClassifiedNukaChallengeName(value).trim();
  if (!isClassifiedNukaSpanish() || !normalized) {
    return normalized;
  }
  if (CLASSIFIED_NUKA_ES_CHALLENGE_TEXT[normalized]) {
    return CLASSIFIED_NUKA_ES_CHALLENGE_TEXT[normalized];
  }
  return CLASSIFIED_NUKA_ES_CHALLENGE_REPLACEMENTS.reduce(
    (translated, [pattern, replacement]) => translated.replace(pattern, replacement),
    normalized
  );
}

function buildClassifiedNukaChallengeDisplayMarkup(value = "") {
  const original = formatClassifiedNukaChallengeName(value).trim();
  const translated = translateClassifiedNukaChallengeName(original);
  const hasSpanishVariant = isClassifiedNukaSpanish() && translated && translated !== original;

  if (!hasSpanishVariant) {
    return `<span class="classified-intel-challenge-name-primary">${buildClassifiedNukaChallengeNameMarkup(original)}</span>`;
  }
  return `<span class="classified-intel-challenge-name-primary">${buildClassifiedNukaChallengeNameMarkup(translated)}</span>`;
}

function getClassifiedNukaChallengeIconKey(name = "") {
  const normalized = String(name || "").trim().toLowerCase();
  if (normalized.includes("gold star")) {
    return "star";
  }
  if (normalized.includes("repeatable")) {
    return "repeat";
  }
  return "calendar";
}

function normalizeClassifiedNukaIntelKey(value) {
  const key = String(value || "").trim();
  return Object.prototype.hasOwnProperty.call(CLASSIFIED_NUKA_PANEL_CONFIG, key) ? key : "dailyOps";
}

function normalizeClassifiedNukaItems(items) {
  return Array.isArray(items)
    ? items
      .map((item) => {
        const score = Number(item?.score);
        return {
          name: formatClassifiedNukaChallengeName(item?.name).trim(),
          score: Number.isFinite(score) ? Math.max(0, Math.round(score)) : null,
          hasTips: Boolean(item?.hasTips)
        };
      })
      .filter((item) => item.name)
    : [];
}

function normalizeClassifiedNukaIntelPayload(payload = {}) {
  const normalizeText = (value) => String(value || "").trim();
  const dailyOps = payload?.dailyOps && typeof payload.dailyOps === "object" ? payload.dailyOps : {};
  const dailyChallenges = payload?.dailyChallenges && typeof payload.dailyChallenges === "object" ? payload.dailyChallenges : {};
  const weeklyChallenges = payload?.weeklyChallenges && typeof payload.weeklyChallenges === "object" ? payload.weeklyChallenges : {};

  return {
    fetchedAt: normalizeText(payload?.fetchedAt),
    source: normalizeText(payload?.source) || "https://nukaknights.com/en/",
    dailyOps: {
      since: normalizeText(dailyOps.since),
      timezone: normalizeText(dailyOps.timezone),
      mode: normalizeText(dailyOps.mode),
      mutation: normalizeText(dailyOps.mutation),
      groupMutation: normalizeText(dailyOps.groupMutation),
      location: normalizeText(dailyOps.location),
      enemy: normalizeText(dailyOps.enemy),
      rewardsUrl: normalizeText(dailyOps.rewardsUrl)
    },
    dailyChallenges: {
      endsIn: normalizeText(dailyChallenges.endsIn),
      provider: normalizeText(dailyChallenges.provider),
      items: normalizeClassifiedNukaItems(dailyChallenges.items)
    },
    weeklyChallenges: {
      endsIn: normalizeText(weeklyChallenges.endsIn),
      provider: normalizeText(weeklyChallenges.provider),
      items: normalizeClassifiedNukaItems(weeklyChallenges.items)
    }
  };
}

function hasClassifiedNukaDailyOpsDetails(payload = {}) {
  const dailyOps = payload?.dailyOps && typeof payload.dailyOps === "object" ? payload.dailyOps : {};
  return Boolean(
    String(dailyOps.mode || "").trim()
    || String(dailyOps.mutation || "").trim()
    || String(dailyOps.groupMutation || "").trim()
    || String(dailyOps.location || "").trim()
    || String(dailyOps.enemy || "").trim()
  );
}

function hasClassifiedNukaChallengeDetails(payload = {}, key = "dailyChallenges") {
  const section = payload?.[key] && typeof payload[key] === "object" ? payload[key] : {};
  return Array.isArray(section.items) && section.items.length > 0;
}

function hasClassifiedNukaIntelForPanel(payload = {}, activeKey = "dailyOps") {
  const normalizedKey = normalizeClassifiedNukaIntelKey(activeKey);
  if (normalizedKey === "dailyOps") {
    return hasClassifiedNukaDailyOpsDetails(payload);
  }
  return hasClassifiedNukaChallengeDetails(payload, normalizedKey);
}

function scoreClassifiedNukaIntelPayload(payload = {}) {
  const dailyCount = Array.isArray(payload?.dailyChallenges?.items)
    ? payload.dailyChallenges.items.length
    : 0;
  const weeklyCount = Array.isArray(payload?.weeklyChallenges?.items)
    ? payload.weeklyChallenges.items.length
    : 0;
  return (
    (hasClassifiedNukaDailyOpsDetails(payload) ? 1000 : 0)
    + (dailyCount * 40)
    + (weeklyCount * 30)
    + (payload?.dailyChallenges?.endsIn ? 8 : 0)
    + (payload?.weeklyChallenges?.endsIn ? 8 : 0)
    + (payload?.dailyOps?.since ? 4 : 0)
  );
}

function getClassifiedNukaIntelFingerprint(payload = {}) {
  const normalized = normalizeClassifiedNukaIntelPayload(payload);
  return JSON.stringify({
    dailyOps: {
      since: normalized.dailyOps.since,
      mode: normalized.dailyOps.mode,
      mutation: normalized.dailyOps.mutation,
      groupMutation: normalized.dailyOps.groupMutation,
      location: normalized.dailyOps.location,
      enemy: normalized.dailyOps.enemy
    },
    dailyChallenges: normalizeClassifiedNukaItems(normalized.dailyChallenges.items).map((item) => ({
      name: item.name,
      score: item.score
    })),
    weeklyChallenges: normalizeClassifiedNukaItems(normalized.weeklyChallenges.items).map((item) => ({
      name: item.name,
      score: item.score
    }))
  });
}

function hasAnyClassifiedNukaIntelDetails(payload = {}) {
  return Boolean(
    hasClassifiedNukaDailyOpsDetails(payload)
    || hasClassifiedNukaChallengeDetails(payload, "dailyChallenges")
    || hasClassifiedNukaChallengeDetails(payload, "weeklyChallenges")
  );
}

function readClassifiedNukaIntelCache() {
  try {
    const raw = localStorage.getItem(CLASSIFIED_NUKA_INTEL_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const cached = JSON.parse(raw);
    const savedAt = Number(cached?.savedAt || 0);
    if (!Number.isFinite(savedAt) || Date.now() - savedAt > CLASSIFIED_NUKA_INTEL_CACHE_MAX_AGE_MS) {
      localStorage.removeItem(CLASSIFIED_NUKA_INTEL_CACHE_KEY);
      return null;
    }

    const payload = normalizeClassifiedNukaIntelPayload(cached?.payload);
    if (!hasAnyClassifiedNukaIntelDetails(payload)) {
      localStorage.removeItem(CLASSIFIED_NUKA_INTEL_CACHE_KEY);
      return null;
    }

    return {
      payload,
      fingerprint: String(cached?.fingerprint || "") || getClassifiedNukaIntelFingerprint(payload),
      checkedAt: Number(cached?.checkedAt || savedAt) || savedAt
    };
  } catch {
    try {
      localStorage.removeItem(CLASSIFIED_NUKA_INTEL_CACHE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
    return null;
  }
}

function writeClassifiedNukaIntelCache(payload = {}, { checkedAt = Date.now() } = {}) {
  try {
    const normalized = normalizeClassifiedNukaIntelPayload(payload);
    if (!hasAnyClassifiedNukaIntelDetails(normalized)) {
      return;
    }

    const fingerprint = getClassifiedNukaIntelFingerprint(normalized);
    localStorage.setItem(CLASSIFIED_NUKA_INTEL_CACHE_KEY, JSON.stringify({
      savedAt: Date.now(),
      checkedAt,
      fingerprint,
      payload: normalized
    }));
    state.classifiedNukaIntel.fingerprint = fingerprint;
    state.classifiedNukaIntel.checkedAt = checkedAt;
  } catch {
    // Storage can fail in private mode or restricted browser contexts.
  }
}

function hydrateClassifiedNukaIntelFromCache() {
  if (state.classifiedNukaIntel.data) {
    return false;
  }

  const cached = readClassifiedNukaIntelCache();
  if (!cached) {
    return false;
  }

  state.classifiedNukaIntel.data = cached.payload;
  state.classifiedNukaIntel.fingerprint = cached.fingerprint;
  state.classifiedNukaIntel.checkedAt = cached.checkedAt;
  return true;
}

function shouldCheckClassifiedNukaIntel({ force = false, activeKey = state.classifiedNukaIntel.activeKey } = {}) {
  if (force) {
    return true;
  }
  if (!hasClassifiedNukaIntelForPanel(state.classifiedNukaIntel.data, activeKey)) {
    return true;
  }
  const checkedAt = Number(state.classifiedNukaIntel.checkedAt || 0);
  return !checkedAt || Date.now() - checkedAt > CLASSIFIED_NUKA_INTEL_RECHECK_INTERVAL_MS;
}

function assertClassifiedNukaIntelReadyForActivePanel(payload = {}, activeKey = "dailyOps") {
  const normalizedKey = normalizeClassifiedNukaIntelKey(activeKey);
  if (!hasClassifiedNukaIntelForPanel(payload, normalizedKey)) {
    throw new Error(`NukaKnights ${normalizedKey} payload was empty.`);
  }
}

function mergeClassifiedNukaIntelPayload(existingPayload = null, incomingPayload = {}) {
  const incoming = normalizeClassifiedNukaIntelPayload(incomingPayload);
  if (!existingPayload) {
    return incoming;
  }

  const existing = normalizeClassifiedNukaIntelPayload(existingPayload);
  return {
    ...incoming,
    dailyOps: hasClassifiedNukaDailyOpsDetails(incoming)
      ? incoming.dailyOps
      : existing.dailyOps,
    dailyChallenges: hasClassifiedNukaChallengeDetails(incoming, "dailyChallenges")
      ? incoming.dailyChallenges
      : existing.dailyChallenges,
    weeklyChallenges: hasClassifiedNukaChallengeDetails(incoming, "weeklyChallenges")
      ? incoming.weeklyChallenges
      : existing.weeklyChallenges
  };
}

function decodeClassifiedNukaHtmlEntities(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_match, code) => {
      const parsed = Number(code);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => {
      const parsed = Number.parseInt(code, 16);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : "";
    })
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function classifiedNukaTextToLines(text = "") {
  const stripped = String(text || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "\n")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|section|article|header|footer|h[1-6]|li|ul|ol|tr|td|th)>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n* ")
    .replace(/<[^>]+>/g, " ");

  return decodeClassifiedNukaHtmlEntities(stripped)
    .replace(/\u00A0/g, " ")
    .split(/\r?\n/)
    .map((line) => line
      .replace(/\*\*/g, "")
      .replace(/^#{1,6}\s+/, "")
      .replace(/\s+/g, " ")
      .trim())
    .filter(Boolean);
}

function cleanClassifiedNukaChallengeName(value = "") {
  return String(value || "")
    .replace(/\s+Tips\b.*$/i, "")
    .replace(/\s+#{1,6}\s+.*$/i, "")
    .replace(/\s+\(\s*/g, " (")
    .replace(/\s*\)\s*/g, ")")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/1ˢᵗ/g, "1st");
}

function parseClassifiedNukaChallengeItems(sectionLines = []) {
  const items = [];
  const scorePattern = /^(?:100|250|300|500|1000|1500|2000)$/;

  for (let index = 0; index < sectionLines.length; index += 1) {
    const line = String(sectionLines[index] || "").trim();
    const isStandaloneBullet = line === "*";
    const isInlineBullet = /^\*\s+/.test(line);
    if (!isStandaloneBullet && !isInlineBullet) {
      continue;
    }

    const nameLine = isStandaloneBullet
      ? String(sectionLines[index + 1] || "").trim()
      : line.replace(/^\*\s+/, "").trim();
    if (!nameLine || nameLine === "*" || /^Tips$/i.test(nameLine)) {
      continue;
    }

    const segment = [];
    const nextStartIndex = isStandaloneBullet ? index + 2 : index + 1;
    for (let nextIndex = nextStartIndex; nextIndex < sectionLines.length; nextIndex += 1) {
      const nextLine = String(sectionLines[nextIndex] || "").trim();
      if (nextLine === "*" || /^\*\s+/.test(nextLine)) {
        break;
      }
      segment.push(nextLine);
    }

    const scoreCandidates = [nameLine, ...segment]
      .map((candidate) => candidate.replace(/,/g, "").trim())
      .flatMap((candidate) => candidate.match(/\b(?:100|250|300|500|1000|1500|2000)\b/g) || [])
      .filter((candidate) => scorePattern.test(candidate));
    const score = scoreCandidates.length ? Number(scoreCandidates[scoreCandidates.length - 1]) : null;

    items.push({
      name: cleanClassifiedNukaChallengeName(nameLine.replace(/\s+\b(?:100|250|300|500|1000|1500|2000)\b\s*$/i, "")),
      score,
      hasTips: /\bTips\b/i.test(nameLine) || segment.some((candidate) => /^Tips$/i.test(candidate))
    });
  }

  return items.filter((item) => item.name);
}

function parseClassifiedNukaChallengeSection(lines = [], startIndex = -1, endIndex = -1) {
  if (startIndex < 0 || endIndex <= startIndex) {
    return { endsIn: "", provider: "", items: [] };
  }

  const sectionLines = lines.slice(startIndex + 1, endIndex);
  const navIndex = sectionLines.findIndex((line) => /\b(Zuruck|Zurück|Weiter)\b|\[(Back|Next)\]/i.test(line));
  const usefulLines = navIndex >= 0 ? sectionLines.slice(0, navIndex) : sectionLines;
  const endsIn = usefulLines.find((line) => /^Ends in\b/i.test(line)) || "";
  const providerLine = usefulLines.find((line) => /^Provided by\b/i.test(line)) || "";

  return {
    endsIn,
    provider: providerLine.replace(/^Provided by\s*/i, "").trim(),
    items: parseClassifiedNukaChallengeItems(usefulLines)
  };
}

function parseClassifiedNukaDailyOps(lines = [], startIndex = -1, endIndex = -1) {
  if (startIndex < 0 || endIndex <= startIndex) {
    return {
      since: "",
      timezone: "",
      mode: "",
      mutation: "",
      groupMutation: "",
      location: "",
      enemy: "",
      rewardsUrl: "https://nukaknights.com/articles/all-about-the-daily-ops.html"
    };
  }

  const sectionLines = lines.slice(startIndex + 1, endIndex);
  const sinceLine = sectionLines.find((line) => /^since\b/i.test(line)) || "";
  const timezoneLine = sectionLines.find((line) => /America\/New_York/i.test(line)) || "";
  const details = sectionLines.filter((line) => (
    line
    && !/^Daily Ops$/i.test(line)
    && !/^since\b/i.test(line)
    && !/America\/New_York/i.test(line)
    && !/^\[?Daily Ops:\s*All Rewards/i.test(line)
    && !/current daily ops details will be available here soon/i.test(line)
  ));
  const hasSecondaryMutation = /^\+\s*/.test(details[3] || "");
  const groupMutation = hasSecondaryMutation
    ? `${details[2] || ""} ${details[3] || ""}`.trim()
    : details[2] || "";
  const locationIndex = hasSecondaryMutation ? 4 : 3;

  return {
    since: sinceLine.replace(/\s*America\/New_York\s*$/i, "").trim(),
    timezone: timezoneLine.match(/America\/New_York/i)?.[0] || sinceLine.match(/America\/New_York/i)?.[0] || "",
    mode: details[0] || "",
    mutation: details[1] || "",
    groupMutation,
    location: details[locationIndex] || "",
    enemy: details[locationIndex + 1] || "",
    rewardsUrl: "https://nukaknights.com/articles/all-about-the-daily-ops.html"
  };
}

function parseClassifiedNukaReadableFeed(text = "") {
  const lines = classifiedNukaTextToLines(text);
  const dailyOpsIndex = (() => {
    let foundIndex = -1;
    for (let index = 0; index < lines.length; index += 1) {
      if (
        String(lines[index] || "").trim().toLowerCase() === "daily ops"
        && /^since\b/i.test(lines[index + 1] || "")
      ) {
        foundIndex = index;
      }
    }
    return foundIndex;
  })();
  const dailyChallengesIndex = lines.findIndex((line, index) => (
    index > dailyOpsIndex && line === "Daily Challenges"
  ));
  const weeklyChallengesIndex = lines.findIndex((line, index) => (
    index > Math.max(dailyChallengesIndex, dailyOpsIndex) && line === "Weekly Challenges"
  ));
  const dailyOpsEndIndex = dailyChallengesIndex >= 0
    ? dailyChallengesIndex
    : (weeklyChallengesIndex >= 0 ? weeklyChallengesIndex : lines.length);
  const weeklyEndIndex = (() => {
    if (weeklyChallengesIndex < 0) {
      return lines.length;
    }
    const navIndex = lines.findIndex((line, index) => (
      index > weeklyChallengesIndex && /\b(Zuruck|Zurück|Weiter)\b|\[(Back|Next)\]/i.test(line)
    ));
    return navIndex >= 0 ? navIndex + 1 : lines.length;
  })();

  const parsed = {
    fetchedAt: new Date().toISOString(),
    source: "https://nukaknights.com/en/",
    dailyOps: parseClassifiedNukaDailyOps(lines, dailyOpsIndex, dailyOpsEndIndex),
    dailyChallenges: parseClassifiedNukaChallengeSection(lines, dailyChallengesIndex, weeklyChallengesIndex),
    weeklyChallenges: parseClassifiedNukaChallengeSection(lines, weeklyChallengesIndex, weeklyEndIndex)
  };
  const normalized = normalizeClassifiedNukaIntelPayload(parsed);
  const hasOps = Boolean(normalized.dailyOps.mode || normalized.dailyOps.location);
  const hasDaily = normalized.dailyChallenges.items.length > 0;
  const hasWeekly = normalized.weeklyChallenges.items.length > 0;
  if (!hasOps && !hasDaily && !hasWeekly) {
    throw new Error("NukaKnights readable feed did not include daily intel.");
  }
  return normalized;
}

async function fetchClassifiedNukaReadableFallback() {
  const attempts = await Promise.allSettled(CLASSIFIED_NUKA_READABLE_URLS.map(async (url) => (
    parseClassifiedNukaReadableFeed(await fetchTextWithTimeout(url, 30000))
  )));

  let lastError = new Error("No readable NukaKnights fallback URL configured.");
  let bestPayload = null;
  let bestScore = -1;
  for (const attempt of attempts) {
    if (attempt.status !== "fulfilled") {
      lastError = attempt.reason || lastError;
      continue;
    }
    const score = scoreClassifiedNukaIntelPayload(attempt.value);
    if (score > bestScore) {
      bestPayload = attempt.value;
      bestScore = score;
    }
  }
  if (bestPayload) {
    return bestPayload;
  }
  throw lastError;
}

function renderClassifiedIntelButtons() {
  if (elements.classifiedCard1Title) elements.classifiedCard1Title.textContent = t("classified_card1_title");
  if (elements.classifiedCard1Body) elements.classifiedCard1Body.textContent = t("classified_card1_body");
  if (elements.classifiedCard2Title) elements.classifiedCard2Title.textContent = t("classified_card2_title");
  if (elements.classifiedCard2Body) elements.classifiedCard2Body.textContent = t("classified_card2_body");
  if (elements.classifiedCard3Title) elements.classifiedCard3Title.textContent = t("classified_card3_title");
  if (elements.classifiedCard3Body) elements.classifiedCard3Body.textContent = t("classified_card3_body");
  if (elements.classifiedCard4Title) elements.classifiedCard4Title.textContent = t("classified_card4_title");
  if (elements.classifiedCard4Body) elements.classifiedCard4Body.textContent = t("classified_card4_body");
  for (const action of [elements.classifiedCard1Action, elements.classifiedCard2Action, elements.classifiedCard3Action, elements.classifiedCard4Action]) {
    if (action) {
      action.textContent = t("classified_card_action");
    }
  }
}

function buildClassifiedDailyOpsMarkup(dailyOps = {}) {
  const operationCards = [
    {
      icon: "unlock",
      labelKey: "classified_intel_mode",
      value: translateClassifiedNukaDailyOpsText(dailyOps.mode),
      detailLabelKey: "classified_intel_mutation",
      detailValue: dailyOps.mutation,
      detailMarkup: buildClassifiedNukaMutationValueMarkup(dailyOps.mutation)
    },
    {
      glyph: "group",
      labelKey: "classified_intel_group",
      value: dailyOps.groupMutation,
      valueMarkup: buildClassifiedNukaMutationValueMarkup(dailyOps.groupMutation)
    },
    {
      icon: "skull",
      labelKey: "classified_intel_location",
      value: translateClassifiedNukaDailyOpsText(dailyOps.location)
    },
    {
      glyph: "hostiles",
      labelKey: "classified_intel_enemy",
      value: translateClassifiedNukaDailyOpsText(dailyOps.enemy)
    }
  ].filter((card) => String(card.value || card.detailValue || "").trim());
  const supportRows = [
    { icon: "calendar", labelKey: "classified_intel_since", value: translateClassifiedNukaSince(dailyOps.since) },
    { icon: "clock", labelKey: "classified_intel_timezone", value: dailyOps.timezone }
  ].filter((row) => String(row.value || "").trim());

  if (!operationCards.length && !supportRows.length) {
    return `
      <section class="classified-intel-ops-brief is-pending">
        <p class="classified-intel-daily-ops-pending">
          ${classifiedNukaIconMarkup("alert")}
          <span>${escapeHtml(t("classified_intel_daily_ops_pending"))}</span>
        </p>
      </section>
    `;
  }

  return `
    <section class="classified-intel-ops-brief${operationCards.length ? "" : " is-pending"}">
      ${supportRows.length ? `
        <div class="classified-intel-ops-headerline">
          <div class="classified-intel-ops-rail">
            ${supportRows.map((row) => `
              <span class="classified-intel-ops-rail-item">
                ${classifiedNukaIconMarkup(row.icon)}
                <span>${escapeHtml(t(row.labelKey))}: <strong>${escapeHtml(row.value)}</strong></span>
              </span>
            `).join("")}
          </div>
        </div>
      ` : ""}
      ${operationCards.length ? `
        <div class="classified-intel-ops-grid">
          ${operationCards.map((card) => `
            <article class="classified-intel-ops-cell">
              ${card.glyph
                ? classifiedNukaGlyphIconMarkup(card.glyph, "classified-intel-ops-cell-icon")
                : classifiedNukaIconMarkup(card.icon, "classified-intel-ops-cell-icon")}
              <span class="classified-intel-cell-label">${escapeHtml(t(card.labelKey))}</span>
              <strong class="classified-intel-cell-value${card.valueMarkup ? " has-mutation-tokens" : ""}">${card.valueMarkup || escapeHtml(card.value || translateClassifiedNukaDailyOpsText(card.detailValue))}</strong>
              ${card.detailValue && card.value ? (() => {
                return `
                <span class="classified-intel-cell-detail has-mutation-tokens">
                  ${card.detailMarkup || buildClassifiedNukaMutationValueMarkup(card.detailValue)}
                </span>
              `;
              })() : ""}
            </article>
          `).join("")}
        </div>
      ` : `
        <div class="classified-intel-ops-pending-wrap">
          <p class="classified-intel-daily-ops-pending">
            ${classifiedNukaIconMarkup("alert")}
            <span>${escapeHtml(t("classified_intel_daily_ops_pending"))}</span>
          </p>
        </div>
      `}
    </section>
  `;
}

function buildClassifiedChallengesMetaMarkup(section = {}) {
  const endsIn = String(section.endsIn || "").trim();
  if (!endsIn) {
    return "";
  }

  return `
    <div class="classified-intel-section-meta">
      <span>
        ${classifiedNukaIconMarkup("calendar")}
        <span>${escapeHtml(translateClassifiedNukaRelativeTime(endsIn))}</span>
      </span>
    </div>
  `;
}

function buildClassifiedScorePillMarkup(scoreText = "--") {
  return `
    <div class="classified-intel-score-pill" aria-label="${escapeHtml(t("classified_intel_reward"))}: ${escapeHtml(scoreText)}">
      ${classifiedNukaIconMarkup("trophy")}
      <span class="classified-intel-score-value">${escapeHtml(scoreText)}</span>
      <span class="classified-intel-score-label">SCORE</span>
    </div>
  `;
}

function buildClassifiedChallengesMarkup(section = {}, activeKey = "dailyChallenges") {
  const items = normalizeClassifiedNukaItems(section.items);
  const metaMarkup = buildClassifiedChallengesMetaMarkup(section);
  const pendingKey = activeKey === "weeklyChallenges"
    ? "classified_intel_weekly_challenges_pending"
    : "classified_intel_daily_challenges_pending";

  if (!items.length) {
    return `
      ${metaMarkup}
      <p class="classified-intel-challenges-pending">
        ${classifiedNukaIconMarkup("alert")}
        <span>${escapeHtml(t(pendingKey))}</span>
      </p>
    `;
  }

  return `
    ${metaMarkup}
    <div class="classified-intel-challenge-list">
      ${items.map((item, index) => {
        const scoreText = item.score == null ? "--" : Number(item.score).toLocaleString(state.lang === "es" ? "es-ES" : "en-US");
        const iconKey = getClassifiedNukaChallengeIconKey(item.name);
        return `
          <article class="classified-intel-challenge-row">
            <div class="classified-intel-challenge-index">${String(index + 1).padStart(2, "0")}</div>
            ${iconKey === "repeat"
              ? classifiedNukaGlyphIconMarkup("repeat", "classified-intel-challenge-icon")
              : classifiedNukaIconMarkup(iconKey, "classified-intel-challenge-icon")}
            <div class="classified-intel-challenge-name">
              ${buildClassifiedNukaChallengeDisplayMarkup(item.name)}
            </div>
            ${buildClassifiedScorePillMarkup(scoreText)}
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderClassifiedNukaIntelModal() {
  const modalState = state.classifiedNukaIntel;
  const activeKey = normalizeClassifiedNukaIntelKey(modalState.activeKey);
  const config = CLASSIFIED_NUKA_PANEL_CONFIG[activeKey];
  const data = modalState.data;
  const hasData = Boolean(data);

  if (!elements.classifiedIntelOverlay) {
    state.classifiedNukaIntel.open = false;
    document.body.classList.remove("is-classified-intel-open");
    return;
  }

  if (elements.classifiedIntelBadge) {
    elements.classifiedIntelBadge.textContent = t("classified_intel_badge");
  }
  if (elements.classifiedIntelTitle) {
    elements.classifiedIntelTitle.textContent = t(config.titleKey);
  }
  if (elements.classifiedIntelBody) {
    elements.classifiedIntelBody.textContent = t(config.bodyKey);
  }
  if (elements.classifiedIntelCore) {
    elements.classifiedIntelCore.classList.toggle("is-daily-ops-intel", activeKey === "dailyOps");
    let dailyOpsLogo = elements.classifiedIntelCore.querySelector(".classified-intel-modal-daily-ops-logo");
    if (activeKey === "dailyOps") {
      if (!dailyOpsLogo) {
        elements.classifiedIntelCore.insertAdjacentHTML("beforeend", classifiedDailyOpsLogoMarkup("classified-intel-modal-daily-ops-logo"));
        dailyOpsLogo = elements.classifiedIntelCore.querySelector(".classified-intel-modal-daily-ops-logo");
      }
      if (dailyOpsLogo) {
        dailyOpsLogo.hidden = false;
      }
    } else if (dailyOpsLogo) {
      dailyOpsLogo.hidden = true;
    }
  }
  if (elements.classifiedIntelMeta) {
    elements.classifiedIntelMeta.textContent = hasData && data.fetchedAt
      ? t("classified_intel_meta_updated", { time: formatFileDateTime(data.fetchedAt) })
      : t("classified_intel_meta_loading");
  }
  if (elements.classifiedIntelStatus) {
    const statusText = modalState.loading
      ? t("classified_intel_loading")
      : modalState.error;
    elements.classifiedIntelStatus.hidden = !statusText;
    elements.classifiedIntelStatus.textContent = statusText || t("classified_intel_loading");
  }
  if (elements.classifiedIntelContent) {
    elements.classifiedIntelContent.hidden = !hasData;
    elements.classifiedIntelContent.classList.toggle("is-daily-ops-intel", activeKey === "dailyOps");
    if (hasData) {
      elements.classifiedIntelContent.innerHTML = activeKey === "dailyOps"
        ? buildClassifiedDailyOpsMarkup(data.dailyOps)
        : buildClassifiedChallengesMarkup(data[activeKey], activeKey);
    } else {
      elements.classifiedIntelContent.innerHTML = "";
    }
  }
  if (elements.classifiedIntelRefreshBtn) {
    elements.classifiedIntelRefreshBtn.textContent = modalState.loading
      ? t("classified_intel_refreshing")
      : t("classified_intel_refresh");
    elements.classifiedIntelRefreshBtn.disabled = Boolean(modalState.loading);
  }
  if (elements.classifiedIntelCloseBtn) {
    elements.classifiedIntelCloseBtn.textContent = t("classified_intel_close");
  }
  if (elements.classifiedIntelCloseIconBtn) {
    elements.classifiedIntelCloseIconBtn.setAttribute("aria-label", t("classified_intel_close"));
  }

  elements.classifiedIntelOverlay.classList.toggle("is-active", Boolean(modalState.open));
  elements.classifiedIntelOverlay.setAttribute("aria-hidden", modalState.open ? "false" : "true");
  document.body.classList.toggle("is-classified-intel-open", Boolean(modalState.open));
}

function closeClassifiedNukaIntelModal() {
  state.classifiedNukaIntel.open = false;
  renderClassifiedNukaIntelModal();
}

function applyClassifiedNukaIntelPayload(payload = {}, { activeKey = state.classifiedNukaIntel.activeKey } = {}) {
  const mergedPayload = mergeClassifiedNukaIntelPayload(state.classifiedNukaIntel.data, payload);
  assertClassifiedNukaIntelReadyForActivePanel(mergedPayload, activeKey);

  const previousFingerprint = state.classifiedNukaIntel.fingerprint
    || (state.classifiedNukaIntel.data ? getClassifiedNukaIntelFingerprint(state.classifiedNukaIntel.data) : "");
  const nextFingerprint = getClassifiedNukaIntelFingerprint(mergedPayload);
  const changed = !previousFingerprint || previousFingerprint !== nextFingerprint;
  const checkedAt = Date.now();

  if (changed || !state.classifiedNukaIntel.data) {
    state.classifiedNukaIntel.data = mergedPayload;
  }

  writeClassifiedNukaIntelCache(state.classifiedNukaIntel.data || mergedPayload, { checkedAt });
  state.classifiedNukaIntel.fingerprint = nextFingerprint;
  state.classifiedNukaIntel.checkedAt = checkedAt;
  return changed;
}

function markClassifiedNukaIntelChecked() {
  const checkedAt = Date.now();
  state.classifiedNukaIntel.checkedAt = checkedAt;
  if (state.classifiedNukaIntel.data) {
    writeClassifiedNukaIntelCache(state.classifiedNukaIntel.data, { checkedAt });
  }
}

async function fetchClassifiedNukaIntel({ force = false, silent = false } = {}) {
  if (!shouldCheckClassifiedNukaIntel({ force, activeKey: state.classifiedNukaIntel.activeKey })) {
    return;
  }

  const requestId = state.classifiedNukaIntel.requestId + 1;
  state.classifiedNukaIntel.requestId = requestId;
  state.classifiedNukaIntel.loading = !silent;
  state.classifiedNukaIntel.error = "";
  if (!silent) {
    renderClassifiedNukaIntelModal();
  }

  try {
    const params = new URLSearchParams();
    if (force) {
      params.set("force", "1");
      params.set("_", String(Date.now()));
    }
    const requestUrl = params.toString()
      ? `${NUKAKNIGHTS_INTEL_API_URL}?${params.toString()}`
      : NUKAKNIGHTS_INTEL_API_URL;
    const payload = await requestJson(requestUrl, {
      method: "GET",
      cache: "no-store"
    });
    if (state.classifiedNukaIntel.requestId !== requestId) {
      return;
    }

    const changed = applyClassifiedNukaIntelPayload(payload);
    state.classifiedNukaIntel.loading = false;
    state.classifiedNukaIntel.error = "";
    if (!silent || changed) {
      renderClassifiedNukaIntelModal();
    }
  } catch {
    if (state.classifiedNukaIntel.requestId !== requestId) {
      return;
    }

    try {
      const fallback = await fetchClassifiedNukaReadableFallback();
      if (state.classifiedNukaIntel.requestId !== requestId) {
        return;
      }
      const changed = applyClassifiedNukaIntelPayload(fallback);
      state.classifiedNukaIntel.loading = false;
      state.classifiedNukaIntel.error = "";
      if (!silent || changed) {
        renderClassifiedNukaIntelModal();
      }
    } catch {
      if (state.classifiedNukaIntel.requestId !== requestId) {
        return;
      }
      markClassifiedNukaIntelChecked();
      state.classifiedNukaIntel.loading = false;
      state.classifiedNukaIntel.error = state.classifiedNukaIntel.data ? "" : t("classified_intel_error");
      if (!silent || !state.classifiedNukaIntel.data) {
        renderClassifiedNukaIntelModal();
      }
    }
  }
}

async function openClassifiedNukaIntelModal(key = "dailyOps") {
  state.classifiedNukaIntel.activeKey = normalizeClassifiedNukaIntelKey(key);
  state.classifiedNukaIntel.open = true;
  const hydrated = hydrateClassifiedNukaIntelFromCache();
  renderClassifiedNukaIntelModal();
  if (shouldCheckClassifiedNukaIntel({ activeKey: state.classifiedNukaIntel.activeKey })) {
    const hasActivePanel = hasClassifiedNukaIntelForPanel(state.classifiedNukaIntel.data, state.classifiedNukaIntel.activeKey);
    void fetchClassifiedNukaIntel({
      force: !hasActivePanel,
      silent: hasActivePanel && (hydrated || Boolean(state.classifiedNukaIntel.data))
    });
  }
}

const AXOLOTL_SOURCE_URL = "https://fallout.fandom.com/wiki/Fallout_76_fishing";

const AXOLOTL_REGION_NAMES = {
  forest: { en: "The Forest", es: "El Bosque" },
  toxic_valley: { en: "Toxic Valley", es: "Valle Tóxico" },
  ash_heap: { en: "Ash Heap", es: "Cúmulo de Cenizas" },
  the_mire: { en: "The Mire", es: "La Ciénaga" },
  savage_divide: { en: "Savage Divide", es: "Sierra Salvaje" },
  cranberry_bog: { en: "Cranberry Bog", es: "Pantano de Arándanos" },
  skyline_valley: { en: "Skyline Valley", es: "Valle del Horizonte" },
  burning_springs: { en: "Burning Springs", es: "Manantiales Ardientes" }
};

// Fallout 76 "Axolotl of the month" rotation (Gone Fission fishing update). Each
// calendar month maps to one axolotl variant. The active variant rotates on the
// first weekly reset of each month (first Tuesday, 12:00 ET). Names, regions, and
// art sourced from the Fallout Wiki (fallout.fandom.com).
const AXOLOTL_ROTATION = [
  { month: 1, key: "charcoal", en: "Charcoal Axolotl", es: "Ajolote carbón", regions: ["burning_springs", "savage_divide"] },
  { month: 2, key: "pink", en: "Pink Axolotl", es: "Ajolote rosa", regions: ["cranberry_bog", "forest"] },
  { month: 3, key: "clay", en: "Clay Axolotl", es: "Ajolote arcilla", regions: ["skyline_valley", "toxic_valley"] },
  { month: 4, key: "dotted", en: "Dotted Axolotl", es: "Ajolote punteado", regions: ["the_mire", "burning_springs"] },
  { month: 5, key: "purple", en: "Purple Axolotl", es: "Ajolote púrpura", regions: ["skyline_valley", "cranberry_bog"] },
  { month: 6, key: "banded", en: "Banded Axolotl", es: "Ajolote con bandas", regions: ["the_mire", "toxic_valley"] },
  { month: 7, key: "scaled", en: "Scaled Axolotl", es: "Ajolote escamado", regions: ["forest", "ash_heap"] },
  { month: 8, key: "striped", en: "Striped Axolotl", es: "Ajolote rayado", regions: ["the_mire", "skyline_valley"] },
  { month: 9, key: "shadow", en: "Shadow Axolotl", es: "Ajolote sombrío", regions: ["toxic_valley", "ash_heap"] },
  { month: 10, key: "spotted", en: "Spotted Axolotl", es: "Ajolote moteado", regions: ["toxic_valley", "savage_divide"] },
  { month: 11, key: "speckled", en: "Speckled Axolotl", es: "Ajolote jaspeado", regions: ["forest", "cranberry_bog"] },
  { month: 12, key: "stone", en: "Stone Axolotl", es: "Ajolote pétreo", regions: ["ash_heap", "toxic_valley"] }
];

function axolotlEntryForMonth(month) {
  return AXOLOTL_ROTATION.find((entry) => entry.month === month) || AXOLOTL_ROTATION[0];
}

function axolotlName(entry, lang = state.lang) {
  if (!entry) return "";
  return (lang === "es" && entry.es) ? entry.es : entry.en;
}

function axolotlImageSrc(entry) {
  return entry ? `assets/images/axolotls/axolotl-${entry.key}.webp` : "";
}

function axolotlRegionLabels(entry, lang = state.lang) {
  if (!entry) return [];
  return entry.regions.map((regionKey) => {
    const region = AXOLOTL_REGION_NAMES[regionKey];
    if (!region) return regionKey;
    return (lang === "es" && region.es) ? region.es : region.en;
  });
}

function axolotlRegionText(entry, lang = state.lang) {
  return axolotlRegionLabels(entry, lang).join(lang === "es" ? " y " : " & ");
}

function getEasternDateParts(date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
  const byType = Object.create(null);
  for (const part of formatter.formatToParts(date)) {
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

// Convert an America/New_York wall-clock time to an absolute UTC timestamp,
// accounting for EST/EDT, by iteratively correcting the offset (DST-safe).
function easternWallClockToMs(year, month, day, hour, minute) {
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let index = 0; index < 4; index += 1) {
    const actual = getEasternDateParts(new Date(utcMs));
    const targetMs = Date.UTC(year, month - 1, day, hour, minute, 0);
    const actualMs = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    const diff = targetMs - actualMs;
    if (!diff) {
      return utcMs;
    }
    utcMs += diff;
  }
  return utcMs;
}

function firstTuesdayDayOfMonth(year, month) {
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return 1 + ((2 - firstDow + 7) % 7);
}

function axolotlPeriodStartMs(year, month) {
  return easternWallClockToMs(year, month, firstTuesdayDayOfMonth(year, month), 12, 0);
}

// Resolve the axolotl that is active at `now`. The active window runs from the
// first Tuesday of its month (12:00 ET) to the first Tuesday of the next month.
function getCurrentAxolotl(now = Date.now()) {
  const nowParts = getEasternDateParts(new Date(now));
  const startThisMonth = axolotlPeriodStartMs(nowParts.year, nowParts.month);

  let activeYear;
  let activeMonth;
  let periodStart;
  let periodEnd;

  if (now >= startThisMonth) {
    activeYear = nowParts.year;
    activeMonth = nowParts.month;
    periodStart = startThisMonth;
    const nextYear = activeMonth === 12 ? activeYear + 1 : activeYear;
    const nextMonth = activeMonth === 12 ? 1 : activeMonth + 1;
    periodEnd = axolotlPeriodStartMs(nextYear, nextMonth);
  } else {
    activeYear = nowParts.month === 1 ? nowParts.year - 1 : nowParts.year;
    activeMonth = nowParts.month === 1 ? 12 : nowParts.month - 1;
    periodStart = axolotlPeriodStartMs(activeYear, activeMonth);
    periodEnd = startThisMonth;
  }

  const totalMs = periodEnd - periodStart;
  const progress = totalMs > 0 ? Math.min(1, Math.max(0, (now - periodStart) / totalMs)) : 0;
  const msLeft = Math.max(0, periodEnd - now);

  return {
    entry: axolotlEntryForMonth(activeMonth),
    activeYear,
    activeMonth,
    periodStart,
    periodEnd,
    progress,
    daysLeft: Math.ceil(msLeft / 86400000),
    totalDays: Math.max(1, Math.round(totalMs / 86400000))
  };
}

function formatAxolotlMonthLabel(year, month, lang = state.lang) {
  const localeTag = lang === "es" ? "es-ES" : "en-US";
  const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(localeTag, {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatAxolotlMonthShort(month, lang = state.lang) {
  const localeTag = lang === "es" ? "es-ES" : "en-US";
  const label = new Date(Date.UTC(2026, month - 1, 1)).toLocaleDateString(localeTag, {
    month: "long",
    timeZone: "UTC"
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatAxolotlEasternDateTime(ms, lang = state.lang) {
  const localeTag = lang === "es" ? "es-ES" : "en-US";
  const label = new Intl.DateTimeFormat(localeTag, {
    timeZone: "America/New_York",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(new Date(ms));
  return `${label} ET`;
}

function buildClassifiedAxolotlMarkup() {
  const lang = state.lang === "es" ? "es" : "en";
  const current = getCurrentAxolotl();
  const entry = current.entry;
  const pct = Math.round(current.progress * 100);

  const daysLeftText = current.daysLeft <= 0
    ? t("axolotl_modal_last_day")
    : current.daysLeft === 1
      ? t("axolotl_modal_day_left")
      : t("axolotl_modal_days_left", { n: current.daysLeft });

  const spotlight = `
    <section class="classified-axolotl-spotlight">
      <span class="classified-axolotl-spotlight-art" aria-hidden="true">
        <img src="${escapeHtml(axolotlImageSrc(entry))}" alt="${escapeHtml(axolotlName(entry, lang))}" loading="eager" decoding="async" draggable="false">
      </span>
      <div class="classified-axolotl-spotlight-info">
        <p class="classified-axolotl-spotlight-kicker">${escapeHtml(t("axolotl_modal_current_label"))} · ${escapeHtml(formatAxolotlMonthLabel(current.activeYear, current.activeMonth, lang))}</p>
        <h3 class="classified-axolotl-spotlight-name">${escapeHtml(axolotlName(entry, lang))}</h3>
        <p class="classified-axolotl-spotlight-type">${escapeHtml(t("axolotl_modal_type_small_fish"))}</p>
        <dl class="classified-axolotl-meta">
          <div class="classified-axolotl-meta-row">
            <dt>${escapeHtml(t("axolotl_modal_regions_label"))}</dt>
            <dd>${escapeHtml(axolotlRegionText(entry, lang))}</dd>
          </div>
          <div class="classified-axolotl-meta-row">
            <dt>${escapeHtml(t("axolotl_modal_window_start"))}</dt>
            <dd>${escapeHtml(formatAxolotlEasternDateTime(current.periodStart, lang))}</dd>
          </div>
          <div class="classified-axolotl-meta-row">
            <dt>${escapeHtml(t("axolotl_modal_window_end"))}</dt>
            <dd>${escapeHtml(formatAxolotlEasternDateTime(current.periodEnd - 60000, lang))}</dd>
          </div>
        </dl>
        <div class="classified-axolotl-progress" role="img" aria-label="${escapeHtml(daysLeftText)}">
          <div class="classified-axolotl-progress-track">
            <span class="classified-axolotl-progress-fill" style="width: ${pct}%;"></span>
          </div>
          <div class="classified-axolotl-progress-foot">
            <span>${pct}%</span>
            <span>${escapeHtml(daysLeftText)}</span>
          </div>
        </div>
      </div>
    </section>
  `;

  const rotationItems = AXOLOTL_ROTATION.map((rotationEntry) => {
    const isActive = rotationEntry.month === current.activeMonth;
    return `
      <article class="classified-axolotl-rotation-item${isActive ? " is-active" : ""}">
        <span class="classified-axolotl-rotation-flag${isActive ? " is-active" : ""}">${escapeHtml(isActive ? t("axolotl_modal_active_tag") : t("axolotl_modal_inactive_tag"))}</span>
        <span class="classified-axolotl-rotation-art" aria-hidden="true">
          <img src="${escapeHtml(axolotlImageSrc(rotationEntry))}" alt="${escapeHtml(axolotlName(rotationEntry, lang))}" loading="lazy" decoding="async" draggable="false">
        </span>
        <div class="classified-axolotl-rotation-info">
          <p class="classified-axolotl-rotation-month">${escapeHtml(formatAxolotlMonthShort(rotationEntry.month, lang))}</p>
          <p class="classified-axolotl-rotation-name">${escapeHtml(axolotlName(rotationEntry, lang))}</p>
          <p class="classified-axolotl-rotation-regions">${escapeHtml(axolotlRegionText(rotationEntry, lang))}</p>
        </div>
      </article>
    `;
  }).join("");

  return `
    ${spotlight}
    <section class="classified-axolotl-rotation">
      <p class="classified-axolotl-rotation-title">${escapeHtml(t("axolotl_modal_rotation_title"))}</p>
      <div class="classified-axolotl-rotation-grid">${rotationItems}</div>
    </section>
  `;
}

function renderClassifiedAxolotlModal() {
  const modalState = state.classifiedAxolotl;
  if (!elements.classifiedAxolotlOverlay) {
    state.classifiedAxolotl.open = false;
    return;
  }

  if (elements.classifiedAxolotlBadge) {
    elements.classifiedAxolotlBadge.textContent = t("axolotl_modal_badge");
  }
  if (elements.classifiedAxolotlTitle) {
    elements.classifiedAxolotlTitle.textContent = t("axolotl_modal_title");
  }
  if (elements.classifiedAxolotlBody) {
    elements.classifiedAxolotlBody.textContent = t("axolotl_modal_body");
  }
  if (elements.classifiedAxolotlSourceLink) {
    elements.classifiedAxolotlSourceLink.textContent = t("axolotl_modal_source");
    elements.classifiedAxolotlSourceLink.href = AXOLOTL_SOURCE_URL;
  }
  if (elements.classifiedAxolotlCloseBtn) {
    elements.classifiedAxolotlCloseBtn.textContent = t("axolotl_modal_close");
  }
  if (elements.classifiedAxolotlCloseIconBtn) {
    elements.classifiedAxolotlCloseIconBtn.setAttribute("aria-label", t("axolotl_modal_close"));
  }
  if (elements.classifiedAxolotlContent) {
    elements.classifiedAxolotlContent.innerHTML = modalState.open ? buildClassifiedAxolotlMarkup() : "";
  }

  elements.classifiedAxolotlOverlay.classList.toggle("is-active", Boolean(modalState.open));
  elements.classifiedAxolotlOverlay.setAttribute("aria-hidden", modalState.open ? "false" : "true");
  document.body.classList.toggle("is-classified-intel-open", Boolean(modalState.open));
}

function openClassifiedAxolotlModal() {
  state.classifiedAxolotl.open = true;
  renderClassifiedAxolotlModal();
}

function closeClassifiedAxolotlModal() {
  state.classifiedAxolotl.open = false;
  renderClassifiedAxolotlModal();
}


// Player count modal and Classified page navigation
const CLASSIFIED_PLAYER_HISTORY_RANGES = [
  { key: "48h", label: "48H", offsetUnit: "hour", offsetCount: 48 },
  { key: "1w", label: "1W", offsetUnit: "day", offsetCount: 7 },
  { key: "1m", label: "1M", offsetUnit: "month", offsetCount: 1 },
  { key: "3m", label: "3M", offsetUnit: "month", offsetCount: 3 },
  { key: "6m", label: "6M", offsetUnit: "month", offsetCount: 6 },
  { key: "1y", label: "1Y", offsetUnit: "year", offsetCount: 1 },
  { key: "max", label: "MAX", offsetUnit: null, offsetCount: 0 }
];

function normalizeClassifiedPlayerRange(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return CLASSIFIED_PLAYER_HISTORY_RANGES.some((range) => range.key === normalized)
    ? normalized
    : "48h";
}

function normalizeClassifiedPlayerCountsPayload(payload = {}) {
  const parseCount = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue >= 0 ? Math.round(numericValue) : null;
  };
  const source = payload && typeof payload.source === "object" ? payload.source : {};
  const history = Array.isArray(payload.history)
    ? payload.history
      .map((point) => {
        const timestampMs = Array.isArray(point) ? Number(point[0]) : NaN;
        const playerCount = Array.isArray(point) ? parseCount(point[1]) : null;
        if (!Number.isFinite(timestampMs) || playerCount == null) {
          return null;
        }
        return [Math.round(timestampMs), playerCount];
      })
      .filter(Boolean)
      .sort((left, right) => left[0] - right[0])
    : [];

  return {
    playersNow: parseCount(payload.playersNow),
    peak24h: parseCount(payload.peak24h),
    peakAllTime: parseCount(payload.peakAllTime),
    partial: Boolean(payload.partial),
    fetchedAt: String(payload.fetchedAt || "").trim(),
    capturedAt: String(payload.capturedAt || "").trim(),
    sourceCurrent: String(source.current || "").trim(),
    sourceHistory: String(source.history || "").trim(),
    sourcePeaks: String(source.peaks || "").trim(),
    history
  };
}

function escapeSvgText(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getClassifiedPlayerRangeConfig(rangeKey = state.classifiedPlayers.range) {
  const normalized = normalizeClassifiedPlayerRange(rangeKey);
  return CLASSIFIED_PLAYER_HISTORY_RANGES.find((range) => range.key === normalized) || CLASSIFIED_PLAYER_HISTORY_RANGES[0];
}

function subtractClassifiedPlayerRange(timestampMs, rangeKey = state.classifiedPlayers.range) {
  const range = getClassifiedPlayerRangeConfig(rangeKey);
  if (!range.offsetUnit || !range.offsetCount) {
    return null;
  }

  const date = new Date(timestampMs);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  switch (range.offsetUnit) {
    case "hour":
      date.setHours(date.getHours() - range.offsetCount);
      break;
    case "day":
      date.setDate(date.getDate() - range.offsetCount);
      break;
    case "month":
      date.setMonth(date.getMonth() - range.offsetCount);
      break;
    case "year":
      date.setFullYear(date.getFullYear() - range.offsetCount);
      break;
    default:
      return null;
  }

  return date.getTime();
}

function getFilteredClassifiedPlayerHistory(history = [], rangeKey = state.classifiedPlayers.range) {
  const safeHistory = Array.isArray(history) ? history : [];
  if (safeHistory.length < 2) {
    return [];
  }

  const latestTimestampMs = safeHistory[safeHistory.length - 1][0];
  const cutoffMs = subtractClassifiedPlayerRange(latestTimestampMs, rangeKey);
  if (!Number.isFinite(cutoffMs)) {
    return safeHistory;
  }

  const filtered = safeHistory.filter((point) => point[0] >= cutoffMs);
  if (filtered.length >= 2) {
    return filtered;
  }

  return safeHistory.slice(Math.max(0, safeHistory.length - 48));
}

function downsampleClassifiedPlayerHistory(points = [], maxPoints = 220) {
  const safePoints = Array.isArray(points) ? points : [];
  if (safePoints.length <= 900) {
    return safePoints;
  }
  if (safePoints.length <= maxPoints) {
    return safePoints;
  }

  const sampled = [];
  const step = (safePoints.length - 1) / (maxPoints - 1);
  for (let index = 0; index < maxPoints; index += 1) {
    const point = safePoints[Math.round(index * step)];
    if (!point) {
      continue;
    }
    const lastPoint = sampled[sampled.length - 1];
    if (!lastPoint || lastPoint[0] !== point[0]) {
      sampled.push(point);
    }
  }

  const finalPoint = safePoints[safePoints.length - 1];
  if (sampled[sampled.length - 1]?.[0] !== finalPoint?.[0]) {
    sampled.push(finalPoint);
  }
  return sampled;
}

function getNiceChartMax(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 10;
  }

  const roughInterval = numericValue / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughInterval));
  const normalized = roughInterval / magnitude;
  const steps = [1, 2, 2.5, 5, 10];
  const step = steps.find((candidate) => normalized <= candidate) || 10;
  const interval = step * magnitude;
  return Math.ceil(numericValue / interval) * interval;
}

function buildSmoothClassifiedPlayerPath(points = []) {
  const safePoints = Array.isArray(points) ? points : [];
  if (safePoints.length < 2) {
    return "";
  }
  if (safePoints.length === 2) {
    return safePoints
      .map((point, index) => `${index ? "L" : "M"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(" ");
  }

  let path = `M ${safePoints[0].x.toFixed(2)} ${safePoints[0].y.toFixed(2)}`;
  for (let index = 0; index < safePoints.length - 1; index += 1) {
    const previous = safePoints[index - 1] || safePoints[index];
    const current = safePoints[index];
    const next = safePoints[index + 1];
    const afterNext = safePoints[index + 2] || next;
    const controlPoint1X = current.x + (next.x - previous.x) / 6;
    const controlPoint1Y = current.y + (next.y - previous.y) / 6;
    const controlPoint2X = next.x - (afterNext.x - current.x) / 6;
    const controlPoint2Y = next.y - (afterNext.y - current.y) / 6;
    path += ` C ${controlPoint1X.toFixed(2)} ${controlPoint1Y.toFixed(2)}, ${controlPoint2X.toFixed(2)} ${controlPoint2Y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
  }
  return path;
}

function formatClassifiedPlayerChartTick(timestampMs, rangeKey = state.classifiedPlayers.range) {
  const date = new Date(timestampMs);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const locale = state.lang === "es" ? "es-ES" : "en-US";
  let options;
  switch (normalizeClassifiedPlayerRange(rangeKey)) {
    case "48h":
      options = { day: "2-digit", month: "short", hour: "2-digit" };
      break;
    case "1w":
    case "1m":
    case "3m":
      options = { day: "2-digit", month: "short" };
      break;
    case "6m":
    case "1y":
      options = { month: "short", year: "2-digit" };
      break;
    default:
      options = { year: "numeric" };
      break;
  }

  return new Intl.DateTimeFormat(locale, options).format(date).replace(/,/g, "");
}

function formatClassifiedPlayerTooltipTimestamp(timestampMs) {
  const date = new Date(timestampMs);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const locale = state.lang === "es" ? "es-ES" : "en-US";
  const rangeKey = normalizeClassifiedPlayerRange(state.classifiedPlayers.range);
  const options = {
    weekday: "long",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  };

  if (rangeKey === "6m" || rangeKey === "1y" || rangeKey === "max") {
    options.year = "numeric";
  }

  return new Intl.DateTimeFormat(locale, options).format(date).replace(/,/g, "");
}

function buildClassifiedPlayerChartSvg(points = [], rangeKey = state.classifiedPlayers.range) {
  const sampledPoints = downsampleClassifiedPlayerHistory(points, 220);
  if (sampledPoints.length < 2) {
    return {
      svg: "",
      points: [],
      layout: null
    };
  }

  const viewWidth = 640;
  const viewHeight = 250;
  const padTop = 16;
  const padRight = 56;
  const padBottom = 34;
  const padLeft = 12;
  const chartWidth = viewWidth - padLeft - padRight;
  const chartHeight = viewHeight - padTop - padBottom;
  const minTimestampMs = sampledPoints[0][0];
  const maxTimestampMs = sampledPoints[sampledPoints.length - 1][0];
  const domainMs = Math.max(1, maxTimestampMs - minTimestampMs);
  const maxValue = Math.max(...sampledPoints.map((point) => point[1]), 1);
  const yMax = getNiceChartMax(maxValue);
  const tickCount = 5;

  const scaleX = (timestampMs) => padLeft + ((timestampMs - minTimestampMs) / domainMs) * chartWidth;
  const scaleY = (value) => padTop + chartHeight - (value / yMax) * chartHeight;

  const chartPoints = sampledPoints.map((point) => ({
    timestampMs: point[0],
    value: point[1],
    x: Number(scaleX(point[0]).toFixed(2)),
    y: Number(scaleY(point[1]).toFixed(2))
  }));

  const linePath = buildSmoothClassifiedPlayerPath(chartPoints);
  const firstPoint = chartPoints[0];
  const lastPoint = chartPoints[chartPoints.length - 1];
  const areaPath = `${linePath} L ${lastPoint.x.toFixed(2)} ${(padTop + chartHeight).toFixed(2)} L ${firstPoint.x.toFixed(2)} ${(padTop + chartHeight).toFixed(2)} Z`;

  const horizontalGrid = Array.from({ length: tickCount }, (_unused, index) => {
    const ratio = index / (tickCount - 1);
    const y = padTop + chartHeight - ratio * chartHeight;
    const value = Math.round(ratio * yMax);
    return `
      <line class="classified-player-chart-grid" x1="${padLeft}" y1="${y.toFixed(2)}" x2="${(padLeft + chartWidth).toFixed(2)}" y2="${y.toFixed(2)}"></line>
      <text class="classified-player-chart-axis-label is-y" x="${(padLeft + chartWidth + 10).toFixed(2)}" y="${(y + 4).toFixed(2)}">${escapeSvgText(formatTelemetryNumber(value, "0"))}</text>
    `;
  }).join("");

  const verticalGrid = Array.from({ length: tickCount }, (_unused, index) => {
    const ratio = index / (tickCount - 1);
    const timestampMs = minTimestampMs + ratio * domainMs;
    const x = padLeft + ratio * chartWidth;
    return `
      <line class="classified-player-chart-grid is-vertical" x1="${x.toFixed(2)}" y1="${padTop}" x2="${x.toFixed(2)}" y2="${(padTop + chartHeight).toFixed(2)}"></line>
      <text class="classified-player-chart-axis-label is-x" x="${x.toFixed(2)}" y="${(viewHeight - 8).toFixed(2)}">${escapeSvgText(formatClassifiedPlayerChartTick(timestampMs, rangeKey))}</text>
    `;
  }).join("");

  return {
    svg: `
      <defs>
        <linearGradient id="classifiedPlayersChartAreaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#c5ff2c" stop-opacity="0.28"></stop>
          <stop offset="100%" stop-color="#c5ff2c" stop-opacity="0.02"></stop>
        </linearGradient>
        <filter id="classifiedPlayersChartGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.6" result="blur"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
      </defs>
      ${horizontalGrid}
      ${verticalGrid}
      <path class="classified-player-chart-area" d="${areaPath}"></path>
      <path class="classified-player-chart-line-glow" d="${linePath}" filter="url(#classifiedPlayersChartGlow)"></path>
      <path class="classified-player-chart-line" d="${linePath}"></path>
      <circle class="classified-player-chart-point" cx="${lastPoint.x.toFixed(2)}" cy="${lastPoint.y.toFixed(2)}" r="4.2"></circle>
    `,
    points: chartPoints,
    layout: {
      viewWidth,
      viewHeight,
      padTop,
      padRight,
      padBottom,
      padLeft,
      chartWidth,
      chartHeight
    }
  };
}

function hideClassifiedPlayerChartHover() {
  state.classifiedPlayers.hoverIndex = -1;

  if (elements.classifiedPlayersChartInteractive) {
    elements.classifiedPlayersChartInteractive.hidden = true;
    elements.classifiedPlayersChartInteractive.setAttribute("aria-hidden", "true");
  }
  if (elements.classifiedPlayersChartCrosshair) {
    elements.classifiedPlayersChartCrosshair.hidden = true;
  }
  if (elements.classifiedPlayersChartMarker) {
    elements.classifiedPlayersChartMarker.hidden = true;
  }
  if (elements.classifiedPlayersChartTooltip) {
    elements.classifiedPlayersChartTooltip.hidden = true;
  }
}

function renderClassifiedPlayerChartHover(index) {
  const chartPoints = Array.isArray(state.classifiedPlayers.chartPoints)
    ? state.classifiedPlayers.chartPoints
    : [];
  const chartLayout = state.classifiedPlayers.chartLayout;
  const frame = elements.classifiedPlayersChartFrame;
  const svg = elements.classifiedPlayersChartSvg;
  const interactive = elements.classifiedPlayersChartInteractive;
  const crosshair = elements.classifiedPlayersChartCrosshair;
  const marker = elements.classifiedPlayersChartMarker;
  const tooltip = elements.classifiedPlayersChartTooltip;

  if (
    !chartLayout
    || !frame
    || !svg
    || !interactive
    || !crosshair
    || !marker
    || !tooltip
    || index < 0
    || index >= chartPoints.length
  ) {
    hideClassifiedPlayerChartHover();
    return;
  }

  const point = chartPoints[index];
  const svgRect = svg.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  if (svgRect.width <= 0 || svgRect.height <= 0 || frameRect.width <= 0 || frameRect.height <= 0) {
    hideClassifiedPlayerChartHover();
    return;
  }

  state.classifiedPlayers.hoverIndex = index;
  interactive.hidden = false;
  interactive.setAttribute("aria-hidden", "false");

  const pointLeftPx = (point.x / chartLayout.viewWidth) * svgRect.width;
  const pointTopPx = (point.y / chartLayout.viewHeight) * svgRect.height;
  const plotTopPx = (chartLayout.padTop / chartLayout.viewHeight) * svgRect.height;
  const plotHeightPx = (chartLayout.chartHeight / chartLayout.viewHeight) * svgRect.height;

  crosshair.hidden = false;
  crosshair.style.left = `${pointLeftPx}px`;
  crosshair.style.top = `${plotTopPx}px`;
  crosshair.style.height = `${plotHeightPx}px`;

  marker.hidden = false;
  marker.style.left = `${pointLeftPx}px`;
  marker.style.top = `${pointTopPx}px`;

  if (elements.classifiedPlayersChartTooltipDate) {
    elements.classifiedPlayersChartTooltipDate.textContent = formatClassifiedPlayerTooltipTimestamp(point.timestampMs);
  }
  if (elements.classifiedPlayersChartTooltipValue) {
    elements.classifiedPlayersChartTooltipValue.textContent = `${t("classified_players_tooltip_players")}: ${formatTelemetryNumber(point.value, "0")}`;
  }

  tooltip.hidden = false;
  tooltip.style.left = "0px";
  tooltip.style.top = "0px";

  const gutterPx = 10;
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  let tooltipLeftPx = pointLeftPx + 16;
  if (tooltipLeftPx + tooltipWidth > frameRect.width - gutterPx) {
    tooltipLeftPx = pointLeftPx - tooltipWidth - 16;
  }
  tooltipLeftPx = Math.max(gutterPx, Math.min(tooltipLeftPx, frameRect.width - tooltipWidth - gutterPx));

  let tooltipTopPx = pointTopPx - tooltipHeight - 16;
  if (tooltipTopPx < gutterPx) {
    tooltipTopPx = Math.min(frameRect.height - tooltipHeight - gutterPx, pointTopPx + 16);
  }
  tooltipTopPx = Math.max(gutterPx, tooltipTopPx);

  tooltip.style.left = `${tooltipLeftPx}px`;
  tooltip.style.top = `${tooltipTopPx}px`;
}

function updateClassifiedPlayerChartHover(clientX) {
  const chartPoints = Array.isArray(state.classifiedPlayers.chartPoints)
    ? state.classifiedPlayers.chartPoints
    : [];
  const chartLayout = state.classifiedPlayers.chartLayout;
  const svg = elements.classifiedPlayersChartSvg;
  if (!chartLayout || !svg || chartPoints.length < 2 || !Number.isFinite(clientX)) {
    hideClassifiedPlayerChartHover();
    return;
  }

  const svgRect = svg.getBoundingClientRect();
  if (svgRect.width <= 0) {
    hideClassifiedPlayerChartHover();
    return;
  }

  const pointerOffsetPx = Math.max(0, Math.min(clientX - svgRect.left, svgRect.width));
  const targetX = (pointerOffsetPx / svgRect.width) * chartLayout.viewWidth;
  let nearestIndex = 0;
  let nearestDistance = Infinity;
  for (let index = 0; index < chartPoints.length; index += 1) {
    const distance = Math.abs(chartPoints[index].x - targetX);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  }

  renderClassifiedPlayerChartHover(nearestIndex);
}

function renderClassifiedPlayerHistoryChart() {
  const history = Array.isArray(state.classifiedPlayers.history) ? state.classifiedPlayers.history : [];
  const filteredHistory = getFilteredClassifiedPlayerHistory(history, state.classifiedPlayers.range);
  const hasHistory = filteredHistory.length >= 2;
  const shouldShowPanel = hasHistory || Boolean(state.classifiedPlayers.error || state.classifiedPlayers.data);
  let chartModel = {
    svg: "",
    points: [],
    layout: null
  };

  if (hasHistory) {
    chartModel = buildClassifiedPlayerChartSvg(filteredHistory, state.classifiedPlayers.range);
  }

  state.classifiedPlayers.chartPoints = chartModel.points;
  state.classifiedPlayers.chartLayout = chartModel.layout;
  hideClassifiedPlayerChartHover();

  if (elements.classifiedPlayersChartTitle) {
    elements.classifiedPlayersChartTitle.textContent = t("classified_players_chart_title");
  }
  if (elements.classifiedPlayersChartPanel) {
    elements.classifiedPlayersChartPanel.hidden = !shouldShowPanel;
  }
  if (elements.classifiedPlayersChartEmpty) {
    elements.classifiedPlayersChartEmpty.hidden = hasHistory;
    elements.classifiedPlayersChartEmpty.textContent = t("classified_players_chart_empty");
  }
  if (elements.classifiedPlayersRangeButtons?.length) {
    for (const button of elements.classifiedPlayersRangeButtons) {
      const rangeKey = normalizeClassifiedPlayerRange(button.dataset.playerRange || "");
      const isActive = rangeKey === normalizeClassifiedPlayerRange(state.classifiedPlayers.range);
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
      button.disabled = !hasHistory;
    }
  }
  if (elements.classifiedPlayersChartSvg) {
    elements.classifiedPlayersChartSvg.innerHTML = chartModel.svg;
  }
}

function renderClassifiedPlayerCountsModal() {
  const modalState = state.classifiedPlayers;
  const isOpen = Boolean(modalState.open);
  const hasData = Boolean(modalState.data);
  const sourceHref = modalState.data?.sourcePeaks
    || modalState.data?.sourceHistory
    || modalState.data?.sourceCurrent
    || "https://steamcharts.com/app/1151340";

  if (elements.classifiedPlayersBtn) {
    elements.classifiedPlayersBtn.textContent = t("classified_players_button");
  }

  if (!elements.classifiedPlayersOverlay) {
    state.classifiedPlayers.open = false;
    return;
  }

  if (elements.classifiedPlayersBadge) {
    elements.classifiedPlayersBadge.textContent = t("classified_players_badge");
  }
  if (elements.classifiedPlayersTitle) {
    elements.classifiedPlayersTitle.textContent = t("classified_players_title");
  }
  if (elements.classifiedPlayersBody) {
    elements.classifiedPlayersBody.textContent = t("classified_players_body");
  }
  if (elements.classifiedPlayersMeta) {
    elements.classifiedPlayersMeta.textContent = hasData && modalState.data?.fetchedAt
      ? t("classified_players_meta_updated", {
        time: formatFileDateTime(modalState.data.fetchedAt)
      })
      : t("classified_players_meta_loading");
  }
  if (elements.classifiedPlayersNowValue) {
    elements.classifiedPlayersNowValue.textContent = formatTelemetryNumber(modalState.data?.playersNow);
  }
  if (elements.classifiedPlayersPeak24hValue) {
    elements.classifiedPlayersPeak24hValue.textContent = formatTelemetryNumber(modalState.data?.peak24h);
  }
  if (elements.classifiedPlayersPeakAllTimeValue) {
    elements.classifiedPlayersPeakAllTimeValue.textContent = formatTelemetryNumber(modalState.data?.peakAllTime);
  }
  if (elements.classifiedPlayersNowLabel) {
    elements.classifiedPlayersNowLabel.textContent = t("classified_players_now_label");
  }
  if (elements.classifiedPlayersPeak24hLabel) {
    elements.classifiedPlayersPeak24hLabel.textContent = t("classified_players_peak_24h_label");
  }
  if (elements.classifiedPlayersPeakAllTimeLabel) {
    elements.classifiedPlayersPeakAllTimeLabel.textContent = t("classified_players_peak_all_label");
  }
  if (elements.classifiedPlayersStats) {
    elements.classifiedPlayersStats.hidden = !hasData;
  }
  renderClassifiedPlayerHistoryChart();
  if (elements.classifiedPlayersNote) {
    elements.classifiedPlayersNote.textContent = t("classified_players_note");
  }
  if (elements.classifiedPlayersSourceLink) {
    elements.classifiedPlayersSourceLink.textContent = t("classified_players_source");
    elements.classifiedPlayersSourceLink.href = sourceHref;
  }
  if (elements.classifiedPlayersRefreshBtn) {
    elements.classifiedPlayersRefreshBtn.textContent = modalState.loading
      ? t("classified_players_refreshing")
      : t("classified_players_refresh");
    elements.classifiedPlayersRefreshBtn.disabled = Boolean(modalState.loading);
  }
  if (elements.classifiedPlayersCloseBtn) {
    elements.classifiedPlayersCloseBtn.textContent = t("classified_players_close");
  }
  if (elements.classifiedPlayersStatus) {
    let statusText = "";
    if (modalState.loading) {
      statusText = t("classified_players_loading");
    } else if (modalState.error) {
      statusText = modalState.error;
    } else if (hasData && modalState.data?.partial) {
      statusText = t("classified_players_partial");
    }

    elements.classifiedPlayersStatus.hidden = !statusText;
    elements.classifiedPlayersStatus.textContent = statusText || t("classified_players_loading");
  }

  elements.classifiedPlayersOverlay.classList.toggle("is-active", isOpen);
  elements.classifiedPlayersOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
}

function closeClassifiedPlayerCountsModal() {
  state.classifiedPlayers.open = false;
  hideClassifiedPlayerChartHover();
  renderClassifiedPlayerCountsModal();
}

async function fetchClassifiedPlayerCounts({ force = false } = {}) {
  const requestId = state.classifiedPlayers.requestId + 1;
  state.classifiedPlayers.requestId = requestId;
  state.classifiedPlayers.loading = true;
  state.classifiedPlayers.error = "";
  renderClassifiedPlayerCountsModal();

  try {
    const params = new URLSearchParams({ history: "1" });
    if (force) {
      params.set("force", "1");
    }
    const requestUrl = `${PLAYER_COUNTS_API_URL}?${params.toString()}`;
    const payload = await requestJson(requestUrl, {
      method: "GET",
      cache: "no-store"
    });
    if (state.classifiedPlayers.requestId !== requestId) {
      return;
    }

    const normalized = normalizeClassifiedPlayerCountsPayload(payload);
    if (normalized.playersNow == null && normalized.peak24h == null && normalized.peakAllTime == null) {
      throw new Error("Missing player telemetry values.");
    }

    state.classifiedPlayers.data = normalized;
    state.classifiedPlayers.history = normalized.history;
    state.classifiedPlayers.range = normalizeClassifiedPlayerRange(state.classifiedPlayers.range);
    state.classifiedPlayers.loading = false;
    state.classifiedPlayers.error = "";
    renderClassifiedPlayerCountsModal();
  } catch (error) {
    if (state.classifiedPlayers.requestId !== requestId) {
      return;
    }

    state.classifiedPlayers.loading = false;
    state.classifiedPlayers.error = t("classified_players_error");
    if (force) {
      state.classifiedPlayers.data = state.classifiedPlayers.data || null;
    }
    renderClassifiedPlayerCountsModal();
  }
}

async function openClassifiedPlayerCountsModal() {
  state.classifiedPlayers.open = true;
  renderClassifiedPlayerCountsModal();
  void fetchClassifiedPlayerCounts();
}

function showClassifiedPage({ updateHash = true } = {}) {
  closeIntelBotInviteModal();
  hideFo76EventsPage();
  const adminBypass = canBypassClassifiedHackAsAdmin();
  if (!canOpenClassifiedArchive()) {
    return;
  }

  if (!adminBypass || state.easterEgg.hack?.solved) {
    state.easterEgg.unlocked = true;
  }
  hideSiloDossier({ updateHash: false });
  showClassifiedLoadOverlay(false);
  hideHackOverlay();
  hideFilesPage();
  hideDropsPage();

  if (elements.classifiedPage) {
    elements.classifiedPage.hidden = false;
    elements.classifiedPage.classList.remove("is-entering");
    void elements.classifiedPage.offsetWidth;
    elements.classifiedPage.classList.add("is-entering");
    setTimeout(() => {
      elements.classifiedPage?.classList.remove("is-entering");
    }, 780);
  }

  state.view = "classified";
  document.body.classList.add("is-classified");
  syncVisitCounterEyeMode();
  elements.mainTitle.textContent = t("classified_main_title");
  syncTopTabForCurrentView();
  renderFilesBotAdminPanel();
  if (updateHash) {
    setHashView("classified");
  }
  setClassifiedSearchOpen(false, { clearQuery: true });
  void ensureClassifiedMinervaArchive();
}

function hideClassifiedPage() {
  showIntelPage({ updateHash: true });
}
