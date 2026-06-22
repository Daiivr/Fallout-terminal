// app.js — main application logic
// Depends on: js/core/config.js, js/core/state.js loaded before this file
const CLASSIFIED_SEARCH_RENDER_DEBOUNCE_MS = 180;
const INTEL_EMAIL_FEEDBACK_AUTO_DISMISS_MS = 4500;

let classifiedSearchRenderTimer = 0;
let intelEmailFeedbackDismissTimer = 0;

function t(key, vars = {}) {
  const dictionary = STRINGS[state.lang] || STRINGS.en;
  const template = dictionary[key] || STRINGS.en[key] || key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ""));
}

function isSiloDossierHash(hashValue = window.location.hash) {
  void hashValue;
  return false;
}

function getHashView() {
  const hash = String(window.location.hash || "").trim().toLowerCase();
  const sharedTargetActive = hasFilesSharedTargetInLocation();
  if (hash === VIEW_HASHES.files) {
    return "files";
  }
  if (hash === VIEW_HASHES.drops) {
    return "drops";
  }
  if (!hash && sharedTargetActive) {
    return "files";
  }
  if (hash === VIEW_HASHES.classified || hash === "#classified" || hash === "#data") {
    return "classified";
  }
  if (!hash || hash === VIEW_HASHES.intel) {
    return "intel";
  }
  return "";
}

function setHashView(view, { replace = false } = {}) {
  const targetHash = view === "files"
    ? VIEW_HASHES.files
    : view === "drops"
      ? VIEW_HASHES.drops
    : view === "classified"
      ? VIEW_HASHES.classified
      : VIEW_HASHES.intel;
  const currentHash = String(window.location.hash || "").trim().toLowerCase();
  if (currentHash === targetHash) {
    return;
  }

  if (replace && window.history?.replaceState) {
    const nextUrl = `${window.location.pathname}${window.location.search}${targetHash}`;
    window.history.replaceState(null, "", nextUrl);
    return;
  }

  window.location.hash = targetHash;
}

function isValidFilesSharedId(value) {
  return FILES_SHARED_ID_PATTERN.test(String(value || "").trim());
}

function normalizeFilesSharedSlugValue(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function isValidFilesSharedSlug(value) {
  return FILES_SHARED_SLUG_PATTERN.test(String(value || "").trim());
}

function getFilesSharedFileIdFromLocation(locationLike = window.location) {
  const search = String(locationLike?.search || "").trim();
  if (!search) {
    return "";
  }

  try {
    const params = new URLSearchParams(search);
    const fileId = String(params.get(FILES_SHARED_URL_PARAM) || "").trim().toLowerCase();
    return isValidFilesSharedId(fileId) ? fileId : "";
  } catch {
    return "";
  }
}

function getFilesSharedSlugFromLocation(locationLike = window.location) {
  const pathname = String(locationLike?.pathname || "").trim();
  if (!pathname || !pathname.startsWith(FILES_SHARE_ROUTE_PREFIX)) {
    return "";
  }

  const rawSegment = pathname.slice(FILES_SHARE_ROUTE_PREFIX.length).split("/")[0] || "";
  let decodedSegment = rawSegment;
  try {
    decodedSegment = decodeURIComponent(rawSegment);
  } catch {
    decodedSegment = rawSegment;
  }
  const normalizedSlug = normalizeFilesSharedSlugValue(decodedSegment);
  return isValidFilesSharedSlug(normalizedSlug) ? normalizedSlug : "";
}

function hasFilesSharedTargetInLocation(locationLike = window.location) {
  return Boolean(getFilesSharedSlugFromLocation(locationLike) || getFilesSharedFileIdFromLocation(locationLike));
}

function stripFilesShareExtension(name) {
  const value = String(name || "").trim();
  if (!value) {
    return "";
  }
  const dotIndex = value.lastIndexOf(".");
  if (dotIndex <= 0) {
    return value;
  }
  return value.slice(0, dotIndex);
}

function buildFilesShareSlug(file) {
  const fileId = String(file?.id || "").trim().toLowerCase();
  if (!isValidFilesSharedId(fileId)) {
    return "";
  }

  const stableName = stripFilesShareExtension(String(file?.name || "").trim()) || getFilesDisplayName(file);
  const slugBase = normalizeFilesSharedSlugValue(stableName) || "shared-file";
  const shortId = fileId.replace(/-/g, "").slice(0, 8);
  return `${slugBase}-${shortId}`;
}

function humanizeFilesSharedSlug(slugValue = "") {
  const normalizedSlug = normalizeFilesSharedSlugValue(slugValue);
  if (!normalizedSlug) {
    return "";
  }

  const parts = normalizedSlug.split("-").filter(Boolean);
  if (!parts.length) {
    return "";
  }

  const tail = parts[parts.length - 1];
  const nameParts = /^[a-f0-9]{8}$/i.test(tail) ? parts.slice(0, -1) : parts;
  if (!nameParts.length) {
    return "";
  }

  return nameParts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveFilesSharedEntryFromLocation(files = state.files.list, locationLike = window.location) {
  const sourceFiles = Array.isArray(files) ? files : [];
  const sharedSlug = getFilesSharedSlugFromLocation(locationLike);
  if (sharedSlug) {
    return sourceFiles.find((entry) => buildFilesShareSlug(entry) === sharedSlug) || null;
  }

  const sharedFileId = getFilesSharedFileIdFromLocation(locationLike);
  if (!sharedFileId) {
    return null;
  }
  return sourceFiles.find((entry) => String(entry?.id || "").trim().toLowerCase() === sharedFileId) || null;
}

function getFilesSharedNameHintFromLocation(locationLike = window.location) {
  const sharedSlug = getFilesSharedSlugFromLocation(locationLike);
  if (!sharedSlug) {
    return "";
  }
  return humanizeFilesSharedSlug(sharedSlug);
}

function getFilesSharedUnauthorizedMessage() {
  const sharedNameHint = getFilesSharedNameHintFromLocation();
  if (sharedNameHint) {
    return t("files_share_unauthorized_message_named", { name: sharedNameHint });
  }
  return t("files_share_unauthorized_message");
}

function resolveFilesSharedSlugValue(fileOrValue = "") {
  if (fileOrValue && typeof fileOrValue === "object") {
    return buildFilesShareSlug(fileOrValue);
  }

  const rawValue = String(fileOrValue || "").trim();
  if (!rawValue) {
    return "";
  }

  if (isValidFilesSharedId(rawValue)) {
    const matchedFile = resolveFilesSharedEntryFromLocation(state.files.list, {
      pathname: "",
      search: `?${FILES_SHARED_URL_PARAM}=${encodeURIComponent(rawValue)}`
    });
    return matchedFile ? buildFilesShareSlug(matchedFile) : "";
  }

  const normalizedSlug = normalizeFilesSharedSlugValue(rawValue);
  if (isValidFilesSharedSlug(normalizedSlug)) {
    return normalizedSlug;
  }

  return "";
}

function buildFilesLocationUrl(fileOrValue = "", { absolute = false } = {}) {
  const baseUrl = new URL(window.location.href);
  const sharedSlug = resolveFilesSharedSlugValue(fileOrValue);
  if (sharedSlug) {
    baseUrl.pathname = `${FILES_SHARE_ROUTE_PREFIX}${encodeURIComponent(sharedSlug)}`;
  } else {
    baseUrl.pathname = "/";
  }
  baseUrl.searchParams.delete(FILES_SHARED_URL_PARAM);
  baseUrl.hash = VIEW_HASHES.files;

  if (absolute) {
    return baseUrl.toString();
  }
  return `${baseUrl.pathname}${baseUrl.search}${baseUrl.hash}`;
}

function syncFilesLoginReturnToField(fileOrValue = getFilesSharedSlugFromLocation() || getFilesSharedFileIdFromLocation()) {
  if (!(elements.filesLoginReturnTo instanceof HTMLInputElement)) {
    return;
  }
  elements.filesLoginReturnTo.value = buildFilesLocationUrl(fileOrValue);
}

function setFilesLocationSharedFile(fileOrValue = "") {
  const nextUrl = buildFilesLocationUrl(fileOrValue);
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (window.history?.replaceState && currentUrl !== nextUrl) {
    window.history.replaceState(null, "", nextUrl);
  }
  syncFilesLoginReturnToField(fileOrValue);
}

function setFilesShareButtonText(button, text) {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const nextText = String(text || "");
  if (button.classList.contains("is-icon")) {
    const copiedLabel = t("files_share_button_copied");
    const errorLabel = t("files_share_button_copy_error");
    const iconKind = nextText === copiedLabel
      ? "copied"
      : nextText === errorLabel
        ? "error"
        : "share";
    button.classList.toggle("is-flash-success", iconKind === "copied");
    button.classList.toggle("is-flash-error", iconKind === "error");
    button.classList.toggle("is-tooltip-forced", iconKind === "copied" || iconKind === "error");
    decorateFilesActionIconButton(button, nextText, iconKind);
    return;
  }

  button.textContent = nextText;
}

function flashFilesShareButtonState(button, text) {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const previousTimerId = Number.parseInt(button.dataset.shareResetTimer || "", 10);
  if (Number.isFinite(previousTimerId) && previousTimerId > 0) {
    clearTimeout(previousTimerId);
  }

  setFilesShareButtonText(button, text);
  const timerId = window.setTimeout(() => {
    if (button.isConnected) {
      setFilesShareButtonText(button, t("files_share_button"));
    }
    delete button.dataset.shareResetTimer;
  }, FILES_SHARE_BUTTON_RESET_MS);
  button.dataset.shareResetTimer = String(timerId);
}

function flashFilesShareButtonStateAfterModal(button, text) {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  window.setTimeout(() => {
    if (button.isConnected) {
      flashFilesShareButtonState(button, text);
    }
  }, 80);
}

async function copyTextToClipboard(text) {
  const value = String(text || "");
  if (!value) {
    throw new Error("Missing clipboard text");
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = value;
  helper.setAttribute("readonly", "true");
  helper.style.position = "fixed";
  helper.style.top = "-9999px";
  helper.style.left = "-9999px";
  helper.style.opacity = "0";
  document.body.appendChild(helper);
  helper.focus();
  helper.select();

  try {
    const copied = document.execCommand("copy");
    if (!copied) {
      throw new Error("Copy command failed");
    }
  } finally {
    helper.remove();
  }
}

function setTopTabActive(view) {
  elements.tabIntel?.classList.toggle("active", view === "intel");
  elements.tabStatus?.classList.toggle("active", view === "files");
  elements.tabDrops?.classList.toggle("active", view === "drops");
  elements.tabData?.classList.toggle("active", view === "data");
}

function normalizePublicConfig(payload) {
  if (!payload || typeof payload !== "object") {
    return {
      botInviteLink: ""
    };
  }

  return {
    botInviteLink: String(payload.botInviteLink || "").trim()
  };
}

function syncDiscordBotInviteButton() {
  if (!elements.discordBotInviteBtn) {
    return;
  }

  const inviteLink = String(state.publicConfig?.botInviteLink || "").trim();
  const shouldShow = state.view === "intel" && Boolean(inviteLink);
  elements.discordBotInviteBtn.hidden = !shouldShow;
  elements.discordBotInviteBtn.href = shouldShow ? inviteLink : "#";
  elements.discordBotInviteBtn.setAttribute("aria-hidden", shouldShow ? "false" : "true");
  if (!shouldShow && state.intelBotInvite.open) {
    closeIntelBotInviteModal();
  }
}

function renderIntelBotInviteModal() {
  if (!elements.intelBotInviteOverlay || !elements.intelBotInviteConfirmBtn) {
    return;
  }

  const inviteLink = String(state.publicConfig?.botInviteLink || "").trim();
  elements.intelBotInviteConfirmBtn.href = inviteLink || "#";
  elements.intelBotInviteConfirmBtn.setAttribute("aria-disabled", inviteLink ? "false" : "true");
  elements.intelBotInviteConfirmBtn.classList.toggle("is-disabled", !inviteLink);
}

function openIntelBotInviteModal() {
  if (!elements.intelBotInviteOverlay) {
    return;
  }
  if (!String(state.publicConfig?.botInviteLink || "").trim()) {
    return;
  }

  state.intelBotInvite.open = true;
  renderIntelBotInviteModal();
  elements.intelBotInviteOverlay.classList.add("is-active");
  elements.intelBotInviteOverlay.setAttribute("aria-hidden", "false");
}

function closeIntelBotInviteModal() {
  if (!elements.intelBotInviteOverlay) {
    return;
  }

  state.intelBotInvite.open = false;
  elements.intelBotInviteOverlay.classList.remove("is-active");
  elements.intelBotInviteOverlay.setAttribute("aria-hidden", "true");
}

function normalizeIntelEmailFeed(feed) {
  return String(feed || "").trim().toLowerCase() === "minerva" ? "minerva" : "silo";
}

function isValidIntelEmailAddress(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || "").trim());
}

function normalizeIntelEmailSubscriptionEntry(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const feed = normalizeIntelEmailFeed(payload.feed);
  const email = String(payload.email || "").trim();
  if (!email) {
    return null;
  }
  return {
    feed,
    email,
    lang: String(payload.lang || "").trim().toLowerCase() === "es" ? "es" : "en",
    updatedAt: String(payload.updatedAt || ""),
    confirmedAt: String(payload.confirmedAt || "")
  };
}

function normalizeIntelEmailCooldownEntry(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const feed = normalizeIntelEmailFeed(payload.feed);
  const cooldownUntil = String(payload.cooldownUntil || "").trim();
  const cooldownUntilMs = Date.parse(cooldownUntil);
  if (!Number.isFinite(cooldownUntilMs) || cooldownUntilMs <= Date.now()) {
    return null;
  }
  return {
    feed,
    email: String(payload.email || "").trim(),
    lang: String(payload.lang || "").trim().toLowerCase() === "es" ? "es" : "en",
    cooldownUntil,
    cooldownUntilMs
  };
}

function syncIntelEmailSubscriptionsFromPayload(payload) {
  const subscriptions = payload?.subscriptions && typeof payload.subscriptions === "object"
    ? payload.subscriptions
    : {};
  const cooldowns = payload?.cooldowns && typeof payload.cooldowns === "object"
    ? payload.cooldowns
    : {};
  state.intelEmail.subscriptions = {
    silo: normalizeIntelEmailSubscriptionEntry(subscriptions.silo),
    minerva: normalizeIntelEmailSubscriptionEntry(subscriptions.minerva)
  };
  state.intelEmail.cooldowns = {
    silo: normalizeIntelEmailCooldownEntry(cooldowns.silo),
    minerva: normalizeIntelEmailCooldownEntry(cooldowns.minerva)
  };
  state.intelEmail.statusLoaded = true;
}

function getIntelEmailCooldownRemainingMs(feed = state.intelEmail.feed, nowMs = Date.now()) {
  const cooldown = state.intelEmail.cooldowns[normalizeIntelEmailFeed(feed)] || null;
  if (!cooldown) {
    return 0;
  }
  return Math.max(0, Number(cooldown.cooldownUntilMs) - nowMs);
}

function updateIntelEmailCooldownCountdown(nowMs = Date.now()) {
  if (!state.intelEmail.open || !elements.intelEmailCooldownValue) {
    return;
  }

  const feed = normalizeIntelEmailFeed(state.intelEmail.feed);
  const remainingMs = getIntelEmailCooldownRemainingMs(feed, nowMs);
  if (remainingMs <= 0) {
    if (state.intelEmail.cooldowns[feed]) {
      state.intelEmail.cooldowns[feed] = null;
      renderIntelEmailModal();
    }
    return;
  }

  elements.intelEmailCooldownValue.textContent = formatMinervaCountdown(remainingMs);
}

function normalizeIntelEmailAdminSubscriptionEntry(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const id = String(payload.id || "").trim();
  const feeds = Array.isArray(payload.feeds)
    ? Array.from(new Set(payload.feeds.map((feed) => normalizeIntelEmailFeed(feed))))
    : [];
  if (!id || !feeds.length) {
    return null;
  }
  return {
    id,
    email: String(payload.email || "").trim(),
    discordId: String(payload.discordId || "").trim(),
    discordUsername: String(payload.discordUsername || "").trim() || "Unknown Discord user",
    avatarUrl: String(payload.avatarUrl || "").trim(),
    feeds,
    lang: String(payload.lang || "").trim().toLowerCase() === "es" ? "es" : "en",
    updatedAt: String(payload.updatedAt || "")
  };
}

function syncIntelEmailAdminSubscriptionsFromPayload(payload) {
  const entries = Array.isArray(payload?.entries) ? payload.entries : [];
  state.intelEmail.adminSubscriptions.entries = entries
    .map((entry) => normalizeIntelEmailAdminSubscriptionEntry(entry))
    .filter(Boolean);
  state.intelEmail.adminSubscriptions.error = "";
}

function getIntelEmailFeedDisplayName(feed) {
  return t(normalizeIntelEmailFeed(feed) === "minerva" ? "intel_email_feed_minerva" : "intel_email_feed_silo");
}

function renderIntelEmailAdminSubscribersList() {
  const list = elements.intelEmailAdminSubscribersList;
  if (!list) {
    return;
  }

  list.replaceChildren();
  const adminState = state.intelEmail.adminSubscriptions;
  if (adminState.loading) {
    const loading = document.createElement("p");
    loading.className = "intel-email-admin-subscribers-note";
    loading.textContent = t("intel_email_admin_subscribers_loading");
    list.appendChild(loading);
    return;
  }
  if (adminState.error) {
    const error = document.createElement("p");
    error.className = "intel-email-admin-subscribers-note is-error";
    error.textContent = t("intel_email_admin_subscribers_error");
    list.appendChild(error);
    return;
  }
  if (!adminState.entries.length) {
    const empty = document.createElement("p");
    empty.className = "intel-email-admin-subscribers-note";
    empty.textContent = t("intel_email_admin_subscribers_empty");
    list.appendChild(empty);
    return;
  }

  for (const entry of adminState.entries) {
    const row = document.createElement("article");
    row.className = "intel-email-admin-subscriber";
    row.classList.toggle("has-no-avatar", !entry.avatarUrl);

    const avatar = document.createElement("img");
    avatar.className = "intel-email-admin-subscriber-avatar";
    avatar.alt = "";
    if (entry.avatarUrl) {
      avatar.src = entry.avatarUrl;
    } else {
      avatar.hidden = true;
    }

    const identity = document.createElement("div");
    identity.className = "intel-email-admin-subscriber-identity";

    const name = document.createElement("strong");
    name.className = "intel-email-admin-subscriber-name";
    name.textContent = entry.discordUsername;

    const meta = document.createElement("span");
    meta.className = "intel-email-admin-subscriber-meta";
    meta.textContent = entry.discordId || t("intel_email_admin_subscribers_unknown_id");

    const email = document.createElement("span");
    email.className = "intel-email-admin-subscriber-email";
    email.textContent = entry.email || "--";

    identity.append(name, meta, email);

    const feeds = document.createElement("div");
    feeds.className = "intel-email-admin-subscriber-feeds";
    for (const feed of entry.feeds) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "files-btn intel-email-admin-remove-btn";
      button.dataset.subscriptionId = entry.id;
      button.dataset.feed = feed;
      const busyKey = `${entry.id}:${feed}`;
      button.disabled = adminState.busyKey === busyKey;
      button.classList.toggle("is-disabled", button.disabled);
      button.textContent = adminState.busyKey === busyKey
        ? t("intel_email_admin_subscribers_removing")
        : t("intel_email_admin_subscribers_remove_feed", { feed: getIntelEmailFeedDisplayName(feed) });
      feeds.appendChild(button);
    }

    row.append(avatar, identity, feeds);
    list.appendChild(row);
  }
}

function clearIntelEmailFeedbackDismissTimer() {
  if (intelEmailFeedbackDismissTimer) {
    window.clearTimeout(intelEmailFeedbackDismissTimer);
    intelEmailFeedbackDismissTimer = 0;
  }
}

function setIntelEmailFeedback(message = "", kind = "", { autoDismiss = true } = {}) {
  if (!elements.intelEmailFeedback) {
    return;
  }

  const normalizedKind = kind === "success" || kind === "error" ? kind : "";
  if (autoDismiss || !message) {
    clearIntelEmailFeedbackDismissTimer();
  }
  elements.intelEmailFeedback.textContent = message;
  elements.intelEmailFeedback.hidden = !message;
  elements.intelEmailFeedback.classList.toggle("is-success", normalizedKind === "success");
  elements.intelEmailFeedback.classList.toggle("is-error", normalizedKind === "error");
  state.intelEmail.message = message;
  state.intelEmail.messageKind = normalizedKind;
  if (autoDismiss && normalizedKind === "success" && message) {
    intelEmailFeedbackDismissTimer = window.setTimeout(() => {
      if (state.intelEmail.message === message && state.intelEmail.messageKind === normalizedKind) {
        setIntelEmailFeedback("", "", { autoDismiss: false });
      }
    }, INTEL_EMAIL_FEEDBACK_AUTO_DISMISS_MS);
  }
}

function renderIntelEmailModal() {
  if (!elements.intelEmailOverlay) {
    return;
  }

  const feed = normalizeIntelEmailFeed(state.intelEmail.feed);
  const isMinerva = feed === "minerva";
  const me = normalizeFilesProfile(state.files.me);
  const isLoggedIn = Boolean(me.loggedIn);
  const isStatusPending = Boolean(isLoggedIn && state.intelEmail.statusLoading && !state.intelEmail.statusLoaded);
  const activeSubscription = state.intelEmail.subscriptions[feed] || null;
  const activeCooldown = state.intelEmail.cooldowns[feed] || null;
  const cooldownRemainingMs = activeCooldown ? getIntelEmailCooldownRemainingMs(feed) : 0;
  const isCooldownActive = Boolean(isLoggedIn && !activeSubscription && cooldownRemainingMs > 0);
  const isSubscribed = Boolean(isLoggedIn && activeSubscription?.email);
  const canSubscribe = Boolean(isLoggedIn && !isSubscribed && !isCooldownActive && !isStatusPending);
  const canUseAdminEmailTests = Boolean(me.loggedIn && me.isAdmin);
  const testBusyKind = String(state.intelEmail.testBusyKind || "");
  const isTestingEmail = Boolean(testBusyKind);
  if (elements.intelEmailBadge) {
    elements.intelEmailBadge.textContent = t("intel_email_modal_badge");
  }
  if (elements.intelEmailTitle) {
    elements.intelEmailTitle.textContent = t(isMinerva ? "intel_email_modal_title_minerva" : "intel_email_modal_title_silo");
  }
  if (elements.intelEmailBody) {
    elements.intelEmailBody.textContent = t(isMinerva ? "intel_email_modal_body_minerva" : "intel_email_modal_body_silo");
  }
  if (elements.intelEmailFeedLabel) {
    elements.intelEmailFeedLabel.textContent = t("intel_email_feed_label");
  }
  if (elements.intelEmailFeedValue) {
    elements.intelEmailFeedValue.textContent = t(isMinerva ? "intel_email_feed_minerva" : "intel_email_feed_silo");
  }
  if (elements.intelEmailAccountPill) {
    elements.intelEmailAccountPill.hidden = !isLoggedIn;
  }
  if (elements.intelEmailAccountLabel) {
    elements.intelEmailAccountLabel.textContent = t("intel_email_account_label");
  }
  if (elements.intelEmailAccountName) {
    elements.intelEmailAccountName.textContent = me.username || me.discordId || "Discord";
  }
  if (elements.intelEmailAccountAvatar instanceof HTMLImageElement) {
    if (isLoggedIn && me.avatarUrl) {
      elements.intelEmailAccountAvatar.src = me.avatarUrl;
      elements.intelEmailAccountAvatar.hidden = false;
    } else {
      elements.intelEmailAccountAvatar.removeAttribute("src");
      elements.intelEmailAccountAvatar.hidden = true;
    }
  }
  if (elements.intelEmailLoginPanel) {
    elements.intelEmailLoginPanel.hidden = isLoggedIn;
  }
  if (elements.intelEmailLoginTitle) {
    elements.intelEmailLoginTitle.textContent = t("intel_email_login_title");
  }
  if (elements.intelEmailLoginBody) {
    elements.intelEmailLoginBody.textContent = t("intel_email_login_body");
  }
  if (elements.intelEmailLoginBtn) {
    elements.intelEmailLoginBtn.textContent = t("intel_email_login_button");
  }
  if (elements.intelEmailSubscribedPanel) {
    elements.intelEmailSubscribedPanel.hidden = !isSubscribed;
  }
  if (elements.intelEmailSubscribedTitle) {
    elements.intelEmailSubscribedTitle.textContent = t("intel_email_subscribed_title");
  }
  if (elements.intelEmailSubscribedBody) {
    elements.intelEmailSubscribedBody.textContent = t(isMinerva ? "intel_email_subscribed_body_minerva" : "intel_email_subscribed_body_silo");
  }
  if (elements.intelEmailSubscribedEmail) {
    elements.intelEmailSubscribedEmail.textContent = activeSubscription?.email || "";
  }
  if (elements.intelEmailUnsubscribeBtn) {
    elements.intelEmailUnsubscribeBtn.textContent = state.intelEmail.unsubscribeBusy
      ? t("intel_email_unsubscribe_busy")
      : t("intel_email_unsubscribe");
    elements.intelEmailUnsubscribeBtn.disabled = state.intelEmail.unsubscribeBusy || state.intelEmail.busy || isTestingEmail;
    elements.intelEmailUnsubscribeBtn.classList.toggle("is-disabled", elements.intelEmailUnsubscribeBtn.disabled);
  }
  if (elements.intelEmailCooldownPanel) {
    elements.intelEmailCooldownPanel.hidden = !isCooldownActive;
  }
  if (elements.intelEmailCooldownTitle) {
    elements.intelEmailCooldownTitle.textContent = t("intel_email_cooldown_title");
  }
  if (elements.intelEmailCooldownBody) {
    elements.intelEmailCooldownBody.textContent = t(isMinerva ? "intel_email_cooldown_body_minerva" : "intel_email_cooldown_body_silo");
  }
  if (elements.intelEmailCooldownValue) {
    elements.intelEmailCooldownValue.textContent = cooldownRemainingMs > 0
      ? formatMinervaCountdown(cooldownRemainingMs)
      : t("intel_email_cooldown_ready");
  }
  if (elements.intelEmailInputLabel) {
    elements.intelEmailInputLabel.textContent = t("intel_email_input_label");
    elements.intelEmailInputLabel.hidden = !canSubscribe;
  }
  if (elements.intelEmailInputShell) {
    elements.intelEmailInputShell.hidden = !canSubscribe;
  }
  if (elements.intelEmailInput) {
    elements.intelEmailInput.placeholder = t("intel_email_input_placeholder");
    elements.intelEmailInput.classList.remove("is-invalid");
    elements.intelEmailInput.required = canSubscribe;
    elements.intelEmailInput.disabled = !canSubscribe || state.intelEmail.busy;
    if (isSubscribed && activeSubscription?.email) {
      elements.intelEmailInput.value = activeSubscription.email;
    }
  }
  if (elements.intelEmailHint) {
    elements.intelEmailHint.textContent = isStatusPending
      ? t("intel_email_status_loading")
      : (isLoggedIn ? t("intel_email_hint") : t("intel_email_login_hint"));
    elements.intelEmailHint.hidden = isSubscribed;
  }
  if (elements.intelEmailCancelBtn) {
    elements.intelEmailCancelBtn.textContent = t("intel_email_cancel");
  }
  if (elements.intelEmailSubmitBtn) {
    elements.intelEmailSubmitBtn.textContent = state.intelEmail.busy
      ? t("intel_email_submit_busy")
      : t("intel_email_submit");
    elements.intelEmailSubmitBtn.hidden = !canSubscribe;
    elements.intelEmailSubmitBtn.disabled = !canSubscribe || state.intelEmail.busy || isTestingEmail;
    elements.intelEmailSubmitBtn.classList.toggle("is-disabled", state.intelEmail.busy || isTestingEmail);
  }
  if (elements.intelEmailAdminTools) {
    elements.intelEmailAdminTools.hidden = !canUseAdminEmailTests;
  }
  if (elements.intelEmailAdminToolsLabel) {
    elements.intelEmailAdminToolsLabel.textContent = t("intel_email_admin_tools_label");
  }
  if (elements.intelEmailTestConfirmationBtn) {
    const isBusy = testBusyKind === "confirmation";
    elements.intelEmailTestConfirmationBtn.textContent = isBusy
      ? t("intel_email_test_confirmation_busy")
      : t("intel_email_test_confirmation");
    elements.intelEmailTestConfirmationBtn.disabled = !canUseAdminEmailTests || state.intelEmail.busy || isTestingEmail;
    elements.intelEmailTestConfirmationBtn.classList.toggle("is-disabled", elements.intelEmailTestConfirmationBtn.disabled);
  }
  if (elements.intelEmailTestIntelBtn) {
    const isBusy = testBusyKind === "intel";
    elements.intelEmailTestIntelBtn.textContent = isBusy
      ? t("intel_email_test_intel_busy")
      : t("intel_email_test_intel");
    elements.intelEmailTestIntelBtn.disabled = !canUseAdminEmailTests || state.intelEmail.busy || isTestingEmail;
    elements.intelEmailTestIntelBtn.classList.toggle("is-disabled", elements.intelEmailTestIntelBtn.disabled);
  }
  if (!canUseAdminEmailTests) {
    state.intelEmail.adminSubscriptions.open = false;
  }
  if (elements.intelEmailAdminSubscribersBtn) {
    const adminSubscriptions = state.intelEmail.adminSubscriptions;
    elements.intelEmailAdminSubscribersBtn.textContent = adminSubscriptions.loading
      ? t("intel_email_admin_subscribers_loading_button")
      : (adminSubscriptions.open ? t("intel_email_admin_subscribers_hide") : t("intel_email_admin_subscribers_show"));
    elements.intelEmailAdminSubscribersBtn.disabled = !canUseAdminEmailTests || state.intelEmail.busy || isTestingEmail;
    elements.intelEmailAdminSubscribersBtn.classList.toggle("is-disabled", elements.intelEmailAdminSubscribersBtn.disabled);
  }
  if (elements.intelEmailAdminSubscribersPanel) {
    elements.intelEmailAdminSubscribersPanel.hidden = !canUseAdminEmailTests || !state.intelEmail.adminSubscriptions.open;
  }
  renderIntelEmailAdminSubscribersList();
  if (elements.siloEmailBtn) {
    const siloEmailLabel = t("intel_email_button_silo_label");
    elements.siloEmailBtn.setAttribute("aria-label", siloEmailLabel);
    elements.siloEmailBtn.setAttribute("data-tooltip", siloEmailLabel);
    elements.siloEmailBtn.removeAttribute("title");
  }
  if (elements.minervaEmailBtn) {
    const minervaEmailLabel = t("intel_email_button_minerva_label");
    elements.minervaEmailBtn.setAttribute("aria-label", minervaEmailLabel);
    elements.minervaEmailBtn.setAttribute("data-tooltip", minervaEmailLabel);
    elements.minervaEmailBtn.removeAttribute("title");
  }
  setIntelEmailFeedback(state.intelEmail.message, state.intelEmail.messageKind, { autoDismiss: false });
}

function openIntelEmailModal(feed, opener = null) {
  if (!elements.intelEmailOverlay) {
    return;
  }

  state.intelEmail.open = true;
  state.intelEmail.feed = normalizeIntelEmailFeed(feed);
  state.intelEmail.busy = false;
  state.intelEmail.unsubscribeBusy = false;
  state.intelEmail.testBusyKind = "";
  state.intelEmail.message = "";
  state.intelEmail.messageKind = "";
  state.intelEmail.opener = opener instanceof HTMLElement ? opener : document.activeElement;
  state.intelEmail.statusLoading = normalizeFilesProfile(state.files.me).loggedIn && !state.intelEmail.statusLoaded;
  if (elements.intelEmailInput instanceof HTMLInputElement) {
    elements.intelEmailInput.value = "";
  }
  renderIntelEmailModal();
  elements.intelEmailOverlay.classList.add("is-active");
  elements.intelEmailOverlay.setAttribute("aria-hidden", "false");
  if (normalizeFilesProfile(state.files.me).loggedIn) {
    void refreshIntelEmailSubscriptions({ silent: true });
  }
  window.setTimeout(() => {
    if (normalizeFilesProfile(state.files.me).loggedIn && !state.intelEmail.subscriptions[state.intelEmail.feed]) {
      elements.intelEmailInput?.focus();
    } else if (!normalizeFilesProfile(state.files.me).loggedIn) {
      elements.intelEmailLoginBtn?.focus();
    }
  }, 60);
}

function closeIntelEmailModal({ restoreFocus = true } = {}) {
  if (!elements.intelEmailOverlay) {
    return;
  }

  state.intelEmail.open = false;
  state.intelEmail.busy = false;
  state.intelEmail.unsubscribeBusy = false;
  state.intelEmail.testBusyKind = "";
  state.intelEmail.adminSubscriptions.busyKey = "";
  clearIntelEmailFeedbackDismissTimer();
  elements.intelEmailOverlay.classList.remove("is-active");
  elements.intelEmailOverlay.setAttribute("aria-hidden", "true");
  renderIntelEmailModal();
  if (restoreFocus && state.intelEmail.opener instanceof HTMLElement) {
    state.intelEmail.opener.focus();
  }
}

async function submitIntelEmailSubscription(event) {
  event?.preventDefault();
  if (state.intelEmail.busy || state.intelEmail.testBusyKind || !(elements.intelEmailInput instanceof HTMLInputElement)) {
    return;
  }
  const me = normalizeFilesProfile(state.files.me);
  if (!me.loggedIn) {
    setIntelEmailFeedback(t("intel_email_login_required"), "error");
    return;
  }
  if (state.intelEmail.subscriptions[normalizeIntelEmailFeed(state.intelEmail.feed)]) {
    setIntelEmailFeedback(t("intel_email_already_subscribed"), "success");
    return;
  }
  if (getIntelEmailCooldownRemainingMs(state.intelEmail.feed) > 0) {
    renderIntelEmailModal();
    setIntelEmailFeedback(t("intel_email_cooldown_feedback"), "error");
    return;
  }

  const email = String(elements.intelEmailInput.value || "").trim();
  if (!isValidIntelEmailAddress(email)) {
    elements.intelEmailInput.classList.add("is-invalid");
    setIntelEmailFeedback(t("intel_email_invalid"), "error");
    elements.intelEmailInput.focus();
    return;
  }

  state.intelEmail.busy = true;
  state.intelEmail.message = "";
  state.intelEmail.messageKind = "";
  renderIntelEmailModal();

  try {
    const response = await fetch(INTEL_EMAIL_SUBSCRIBE_API_URL, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        email,
        feed: state.intelEmail.feed,
        lang: state.lang
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      if (response.status === 429) {
        syncIntelEmailSubscriptionsFromPayload(payload);
        throw new Error("intel_email_cooldown_feedback");
      }
      const errorKey = response.status === 401
        ? "intel_email_login_required"
        : (response.status === 503 ? "intel_email_unavailable" : "intel_email_error");
      throw new Error(errorKey);
    }

    const payload = await response.json().catch(() => null);
    syncIntelEmailSubscriptionsFromPayload(payload);
    state.intelEmail.busy = false;
    renderIntelEmailModal();
    setIntelEmailFeedback(
      t(state.intelEmail.feed === "minerva" ? "intel_email_success_minerva" : "intel_email_success_silo"),
      "success"
    );
  } catch (error) {
    state.intelEmail.busy = false;
    renderIntelEmailModal();
    const errorKey = ["intel_email_unavailable", "intel_email_cooldown_feedback"].includes(error?.message)
      ? error.message
      : "intel_email_error";
    setIntelEmailFeedback(t(errorKey), "error");
  }
}

async function refreshIntelEmailSubscriptions({ silent = false } = {}) {
  const me = normalizeFilesProfile(state.files.me);
  if (!me.loggedIn) {
    state.intelEmail.subscriptions = { silo: null, minerva: null };
    state.intelEmail.cooldowns = { silo: null, minerva: null };
    state.intelEmail.statusLoaded = false;
    renderIntelEmailModal();
    return;
  }

  state.intelEmail.statusLoading = true;
  state.intelEmail.statusLoaded = false;
  if (!silent) {
    renderIntelEmailModal();
  }

  try {
    const response = await fetch(INTEL_EMAIL_SUBSCRIPTIONS_ME_API_URL, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) {
      throw new Error(response.status === 401 ? "intel_email_login_required" : "intel_email_error");
    }
    const payload = await response.json();
    syncIntelEmailSubscriptionsFromPayload(payload);
  } catch {
    if (!silent) {
      setIntelEmailFeedback(t("intel_email_status_error"), "error");
    }
  } finally {
    state.intelEmail.statusLoading = false;
    renderIntelEmailModal();
  }
}

async function unsubscribeIntelEmailSubscription() {
  const feed = normalizeIntelEmailFeed(state.intelEmail.feed);
  const me = normalizeFilesProfile(state.files.me);
  if (!me.loggedIn) {
    setIntelEmailFeedback(t("intel_email_login_required"), "error");
    return;
  }
  if (!state.intelEmail.subscriptions[feed] || state.intelEmail.unsubscribeBusy) {
    return;
  }

  state.intelEmail.unsubscribeBusy = true;
  state.intelEmail.message = "";
  state.intelEmail.messageKind = "";
  renderIntelEmailModal();

  try {
    const response = await fetch(`${INTEL_EMAIL_SUBSCRIBE_API_URL}/${encodeURIComponent(feed)}`, {
      method: "DELETE",
      cache: "no-store",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) {
      throw new Error(response.status === 401 ? "intel_email_login_required" : "intel_email_unsubscribe_error");
    }
    const payload = await response.json().catch(() => null);
    syncIntelEmailSubscriptionsFromPayload(payload);
    state.intelEmail.unsubscribeBusy = false;
    renderIntelEmailModal();
    setIntelEmailFeedback(t("intel_email_unsubscribe_success"), "success");
  } catch (error) {
    state.intelEmail.unsubscribeBusy = false;
    renderIntelEmailModal();
    const errorKey = String(error?.message || "") || "intel_email_unsubscribe_error";
    setIntelEmailFeedback(t(errorKey), "error");
  }
}

function loginForIntelEmailSubscription() {
  const opened = openDiscordLoginPopup();
  if (!opened) {
    setIntelEmailFeedback(t("intel_email_login_popup_blocked"), "error");
  }
}

async function refreshIntelEmailAdminSubscriptions() {
  const me = normalizeFilesProfile(state.files.me);
  if (!me.loggedIn || !me.isAdmin) {
    setIntelEmailFeedback(t("intel_email_test_admin_only"), "error");
    return;
  }

  state.intelEmail.adminSubscriptions.loading = true;
  state.intelEmail.adminSubscriptions.error = "";
  renderIntelEmailModal();

  try {
    const response = await fetch(INTEL_EMAIL_ADMIN_SUBSCRIPTIONS_API_URL, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) {
      throw new Error("intel_email_admin_subscribers_error");
    }
    const payload = await response.json();
    syncIntelEmailAdminSubscriptionsFromPayload(payload);
  } catch {
    state.intelEmail.adminSubscriptions.error = "1";
  } finally {
    state.intelEmail.adminSubscriptions.loading = false;
    renderIntelEmailModal();
  }
}

function toggleIntelEmailAdminSubscribers() {
  const adminState = state.intelEmail.adminSubscriptions;
  adminState.open = !adminState.open;
  renderIntelEmailModal();
  if (adminState.open && !adminState.entries.length && !adminState.loading) {
    void refreshIntelEmailAdminSubscriptions();
  }
}

async function removeIntelEmailAdminSubscription(subscriptionId, feed) {
  const normalizedId = String(subscriptionId || "").trim();
  const normalizedFeed = normalizeIntelEmailFeed(feed);
  if (!normalizedId || state.intelEmail.adminSubscriptions.busyKey) {
    return;
  }

  const busyKey = `${normalizedId}:${normalizedFeed}`;
  state.intelEmail.adminSubscriptions.busyKey = busyKey;
  renderIntelEmailModal();

  try {
    const response = await fetch(`${INTEL_EMAIL_ADMIN_SUBSCRIPTIONS_API_URL}/${encodeURIComponent(normalizedId)}/${encodeURIComponent(normalizedFeed)}`, {
      method: "DELETE",
      cache: "no-store",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) {
      throw new Error("intel_email_admin_subscribers_remove_error");
    }
    const payload = await response.json();
    syncIntelEmailAdminSubscriptionsFromPayload(payload);
    await refreshIntelEmailSubscriptions({ silent: true });
    setIntelEmailFeedback(t("intel_email_admin_subscribers_remove_success"), "success");
  } catch {
    setIntelEmailFeedback(t("intel_email_admin_subscribers_remove_error"), "error");
  } finally {
    state.intelEmail.adminSubscriptions.busyKey = "";
    renderIntelEmailModal();
  }
}

async function sendIntelEmailAdminTest(kind) {
  const normalizedKind = kind === "intel" ? "intel" : "confirmation";
  const me = normalizeFilesProfile(state.files.me);
  if (!me.loggedIn || !me.isAdmin) {
    setIntelEmailFeedback(t("intel_email_test_admin_only"), "error");
    return;
  }
  if (state.intelEmail.busy || state.intelEmail.testBusyKind || !(elements.intelEmailInput instanceof HTMLInputElement)) {
    return;
  }

  const email = String(elements.intelEmailInput.value || "").trim();
  if (!isValidIntelEmailAddress(email)) {
    elements.intelEmailInput.classList.add("is-invalid");
    setIntelEmailFeedback(t("intel_email_invalid"), "error");
    elements.intelEmailInput.focus();
    return;
  }

  state.intelEmail.testBusyKind = normalizedKind;
  state.intelEmail.message = "";
  state.intelEmail.messageKind = "";
  renderIntelEmailModal();

  try {
    const response = await fetch(INTEL_EMAIL_ADMIN_TEST_API_URL, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        email,
        feed: state.intelEmail.feed,
        kind: normalizedKind,
        lang: state.lang
      })
    });

    if (!response.ok) {
      const errorKey = response.status === 403
        ? "intel_email_test_admin_only"
        : (response.status === 503 ? "intel_email_unavailable" : "intel_email_test_error");
      throw new Error(errorKey);
    }

    state.intelEmail.testBusyKind = "";
    renderIntelEmailModal();
    setIntelEmailFeedback(
      t(normalizedKind === "intel" ? "intel_email_test_success_intel" : "intel_email_test_success_confirmation"),
      "success"
    );
  } catch (error) {
    state.intelEmail.testBusyKind = "";
    renderIntelEmailModal();
    const errorKey = String(error?.message || "") || "intel_email_test_error";
    setIntelEmailFeedback(t(errorKey), "error");
  }
}

function syncTopTabForCurrentView() {
  if (state.view === "classified") {
    setTopTabActive("data");
    syncDiscordBotInviteButton();
    return;
  }
  if (state.view === "drops") {
    setTopTabActive("drops");
    syncDiscordBotInviteButton();
    return;
  }
  if (state.view === "files") {
    setTopTabActive("files");
    syncDiscordBotInviteButton();
    return;
  }
  setTopTabActive("intel");
  syncDiscordBotInviteButton();
}

async function loadPublicConfig() {
  try {
    const response = await fetch("/api/public-config", {
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    state.publicConfig = normalizePublicConfig(payload);
  } catch (_error) {
    state.publicConfig = {
      botInviteLink: ""
    };
  }

  syncDiscordBotInviteButton();
  renderFilesBotAdminPanel();
}

function normalizeVisitCounterTotal(value) {
  const numericValue = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null;
  }
  return numericValue;
}

function setInlineStyleMap(element, styleMap) {
  if (!(element instanceof HTMLElement) && !(element instanceof SVGElement)) {
    return;
  }

  for (const [property, value] of Object.entries(styleMap)) {
    element.style.setProperty(property, value);
  }
}

function clearInlineStyleMap(element, styleMap) {
  if (!(element instanceof HTMLElement) && !(element instanceof SVGElement)) {
    return;
  }

  for (const property of Object.keys(styleMap)) {
    element.style.removeProperty(property);
  }
}

function syncFilesAuthorizedVisitCounterMobileCard() {
  const badge = elements.visitCounterMobileBadge;
  if (!(badge instanceof HTMLElement)) {
    return;
  }

  const icon = badge.querySelector(".visit-counter-mobile-icon");
  const iconSvg = badge.querySelector(".visit-counter-mobile-icon-svg");
  const copy = badge.querySelector(".visit-counter-mobile-copy");
  const topline = badge.querySelector(".visit-counter-mobile-topline");
  const label = elements.visitCounterMobileLabel;
  const value = elements.visitCounterMobileValue;
  const hint = elements.visitCounterMobileHint;
  const mediaMatches = window.matchMedia(FILES_AUTHORIZED_VISIT_COUNTER_MOBILE_MEDIA).matches;
  const active = mediaMatches
    && state.view === "files"
    && document.body.classList.contains("is-files")
    && !document.body.classList.contains("is-files-guest")
    && !document.body.classList.contains("is-files-unauthorized");

  const badgeStyles = {
    display: "flex",
    width: "100%",
    "justify-self": "stretch",
    "align-self": "stretch",
    "margin-top": "10px",
    position: "relative",
    border: "1px solid var(--line)",
    "border-radius": "12px",
    padding: "8px 9px",
    color: "var(--fg-faint)",
    "align-items": "stretch",
    gap: "8px",
    overflow: "hidden",
    isolation: "isolate",
    background:
      "linear-gradient(180deg, rgba(255, 225, 122, 0.08), rgba(0, 0, 0, 0.16)), rgba(0, 0, 0, 0.22)",
    "box-shadow":
      "0 0 0 1px rgba(0, 0, 0, 0.44) inset, 0 10px 18px rgba(0, 0, 0, 0.14)"
  };
  const iconStyles = {
    position: "relative",
    "z-index": "1",
    "align-self": "stretch",
    width: "auto",
    height: "auto",
    "min-width": "45px",
    flex: "0 0 auto",
    "aspect-ratio": "1 / 1",
    display: "grid",
    "place-items": "center",
    border: "1px solid rgba(255, 225, 122, 0.2)",
    "border-radius": "12px",
    background:
      "linear-gradient(180deg, rgba(255, 225, 122, 0.12), rgba(0, 0, 0, 0.2)), rgba(0, 0, 0, 0.18)",
    "box-shadow": "0 0 0 1px rgba(0, 0, 0, 0.4) inset",
    overflow: "hidden"
  };
  const iconSvgStyles = {
    width: "27px",
    height: "27px",
    display: "block"
  };
  const copyStyles = {
    position: "relative",
    "z-index": "1",
    flex: "1 1 auto",
    "min-width": "0",
    display: "grid",
    gap: "3px",
    "align-content": "center",
    padding: "4px 7px 5px",
    border: "1px solid rgba(139, 255, 139, 0.18)",
    "border-radius": "9px",
    background:
      "linear-gradient(180deg, rgba(139, 255, 139, 0.05), rgba(0, 0, 0, 0.16)), rgba(0, 0, 0, 0.18)",
    "box-shadow": "0 0 0 1px rgba(0, 0, 0, 0.38) inset"
  };
  const toplineStyles = {
    display: "flex",
    "align-items": "baseline",
    gap: "10px",
    "min-width": "0"
  };
  const labelStyles = {
    color: "rgba(255, 239, 175, 0.82)",
    "font-size": "10px",
    "letter-spacing": "0.12em",
    "white-space": "nowrap"
  };
  const valueStyles = {
    color: "#fff1aa",
    "font-size": "clamp(1.14rem, 5.4vw, 1.42rem)",
    "line-height": "1",
    "font-variant-numeric": "tabular-nums",
    "text-shadow": "0 0 10px rgba(255, 225, 122, 0.12), 0 0 1px rgba(255, 239, 175, 0.82)"
  };
  const hintStyles = {
    display: "block",
    color: "rgba(139, 255, 139, 0.68)",
    "font-size": "10px",
    "letter-spacing": "0.08em",
    "text-transform": "uppercase"
  };

  const targets = [
    [badge, badgeStyles],
    [icon, iconStyles],
    [iconSvg, iconSvgStyles],
    [copy, copyStyles],
    [topline, toplineStyles],
    [label, labelStyles],
    [value, valueStyles],
    [hint, hintStyles]
  ];

  badge.classList.toggle("is-files-authorized-card", active);

  for (const [element, styleMap] of targets) {
    if (active) {
      setInlineStyleMap(element, styleMap);
    } else {
      clearInlineStyleMap(element, styleMap);
    }
  }
}

function renderVisitCounter() {
  const hasValue = Number.isFinite(state.visitCounter.total);
  const formattedValue = hasValue
    ? formatFilesBotAdminNumber(state.visitCounter.total)
    : "----";
  const visitCounterTargets = [
    {
      badge: elements.visitCounterBadge,
      label: elements.visitCounterLabel,
      value: elements.visitCounterValue,
      hint: elements.visitCounterHint
    },
    {
      badge: elements.visitCounterMobileBadge,
      label: elements.visitCounterMobileLabel,
      value: elements.visitCounterMobileValue,
      hint: elements.visitCounterMobileHint
    },
    {
      badge: elements.filesVisitCounterMobileCard,
      label: elements.filesVisitCounterMobileLabel,
      value: elements.filesVisitCounterMobileValue,
      hint: elements.filesVisitCounterMobileHint
    }
  ];

  for (const target of visitCounterTargets) {
    if (!target.badge || !target.value) {
      continue;
    }

    if (target.label) {
      target.label.textContent = t("visit_counter_label");
    }
    if (target.hint) {
      target.hint.textContent = t("visit_counter_hint");
    }

    target.value.textContent = formattedValue;
    target.badge.hidden = false;
    target.badge.classList.toggle("is-loading", state.visitCounter.loading && !hasValue);
    target.badge.classList.toggle("is-counted", state.visitCounter.counted);
    target.badge.setAttribute(
      "aria-label",
      hasValue
        ? t("visit_counter_aria", { n: formattedValue })
        : t("visit_counter_loading")
    );
  }

  syncFilesAuthorizedVisitCounterMobileCard();
}

async function loadVisitCounter() {
  state.visitCounter.loading = true;
  renderVisitCounter();

  try {
    const payload = await requestJson("/api/visits", {
      method: "POST",
      headers: {
        Accept: "application/json"
      }
    });
    state.visitCounter.total = normalizeVisitCounterTotal(payload?.totalVisits);
    state.visitCounter.counted = Boolean(payload?.counted);
  } catch (_error) {
    state.visitCounter.counted = false;
  } finally {
    state.visitCounter.loading = false;
    renderVisitCounter();
  }
}

function isVisitCounterEyeLockdownActive() {
  return state.view === "classified" || document.body.classList.contains("is-classified");
}

function syncVisitCounterEyeMode() {
  const isLockdown = isVisitCounterEyeLockdownActive();
  const iconHosts = [
    elements.visitCounterIcon,
    elements.visitCounterMobileIcon
  ].filter(Boolean);
  const badgeHosts = [
    elements.visitCounterBadge,
    elements.visitCounterMobileBadge
  ].filter(Boolean);
  const hosts = [...badgeHosts, ...iconHosts];
  const wasLockdown = hosts.some((host) => host.classList.contains("is-classified-lockdown"));

  hosts.forEach((host) => {
    host.classList.toggle("is-classified-lockdown", isLockdown);
  });

  if (isLockdown) {
    if (!wasLockdown) {
      if (visitCounterEyeEntryTimer) {
        clearTimeout(visitCounterEyeEntryTimer);
      }
      hosts.forEach((host) => {
        host.classList.add("is-classified-lockdown-entering");
      });
      visitCounterEyeEntryTimer = window.setTimeout(() => {
        visitCounterEyeEntryTimer = null;
        hosts.forEach((host) => {
          host.classList.remove("is-classified-lockdown-entering");
        });
      }, 2200);
    }
    resetVisitCounterEyeTargets();
  } else {
    if (visitCounterEyeEntryTimer) {
      clearTimeout(visitCounterEyeEntryTimer);
      visitCounterEyeEntryTimer = null;
    }
    hosts.forEach((host) => {
      host.classList.remove("is-classified-lockdown-entering");
    });
  }
}

function syncVisitCounterEyeOffset(eye) {
  if (!eye?.host) {
    return;
  }
  eye.host.style.setProperty("--visit-eye-pupil-x", `${eye.currentX.toFixed(2)}px`);
  eye.host.style.setProperty("--visit-eye-pupil-y", `${eye.currentY.toFixed(2)}px`);
  eye.host.style.setProperty("--visit-eye-shell-x", `${(eye.currentX * 0.36).toFixed(2)}px`);
  eye.host.style.setProperty("--visit-eye-shell-y", `${(eye.currentY * 0.28).toFixed(2)}px`);
}

function queueVisitCounterEyeMotion() {
  if (visitCounterEyeMotionFrame || !visitCounterEyes.length) {
    return;
  }

  visitCounterEyeMotionFrame = window.requestAnimationFrame(() => {
    visitCounterEyeMotionFrame = 0;
    let shouldContinue = false;

    for (const eye of visitCounterEyes) {
      const deltaX = eye.targetX - eye.currentX;
      const deltaY = eye.targetY - eye.currentY;

      if (
        Math.abs(deltaX) <= VISIT_COUNTER_EYE_POINTER_SETTLE_PX
        && Math.abs(deltaY) <= VISIT_COUNTER_EYE_POINTER_SETTLE_PX
      ) {
        eye.currentX = eye.targetX;
        eye.currentY = eye.targetY;
      } else {
        eye.currentX += deltaX * VISIT_COUNTER_EYE_POINTER_EASING;
        eye.currentY += deltaY * VISIT_COUNTER_EYE_POINTER_EASING;
        shouldContinue = true;
      }

      syncVisitCounterEyeOffset(eye);
    }

    if (shouldContinue) {
      queueVisitCounterEyeMotion();
    }
  });
}

function resetVisitCounterEyeTargets() {
  for (const eye of visitCounterEyes) {
    eye.targetX = 0;
    eye.targetY = 0;
  }
  queueVisitCounterEyeMotion();
}

function updateVisitCounterEyeTargets(clientX, clientY) {
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
    resetVisitCounterEyeTargets();
    return;
  }

  for (const eye of visitCounterEyes) {
    const rect = eye.host?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      eye.targetX = 0;
      eye.targetY = 0;
      continue;
    }

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance <= 0.001) {
      eye.targetX = 0;
      eye.targetY = 0;
      continue;
    }

    const rangeX = Math.max(rect.width * 0.55, 1);
    const rangeY = Math.max(rect.height * 0.55, 1);
    const influence = Math.min(Math.hypot(deltaX / rangeX, deltaY / rangeY), 1);
    const offsetScale = eye.maxOffset * influence / distance;

    eye.targetX = deltaX * offsetScale;
    eye.targetY = deltaY * offsetScale;
  }

  queueVisitCounterEyeMotion();
}

function setupVisitCounterEyeTracking() {
  visitCounterEyes = [
    {
      host: elements.visitCounterIcon,
      maxOffset: VISIT_COUNTER_EYE_POINTER_MAX_OFFSET_PX,
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0
    },
    {
      host: elements.visitCounterMobileIcon,
      maxOffset: VISIT_COUNTER_EYE_POINTER_MAX_OFFSET_MOBILE_PX,
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0
    }
  ].filter((eye) => eye.host);

  if (!visitCounterEyes.length) {
    return;
  }

  for (const eye of visitCounterEyes) {
    syncVisitCounterEyeOffset(eye);
  }
  syncVisitCounterEyeMode();

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || isVisitCounterEyeLockdownActive()) {
      return;
    }
    updateVisitCounterEyeTargets(event.clientX, event.clientY);
  }, { passive: true });
  document.documentElement.addEventListener("mouseleave", resetVisitCounterEyeTargets);
  window.addEventListener("blur", resetVisitCounterEyeTargets);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      resetVisitCounterEyeTargets();
    }
  });
}

function getActiveSiloResetTargetMs(nowMs = Date.now()) {
  const fallbackTarget = nextResetUtc().getTime();
  return Number.isFinite(state.silo.resetTargetUtc) && state.silo.resetTargetUtc > nowMs
    ? state.silo.resetTargetUtc
    : fallbackTarget;
}

function formatSiloCountdownValue(totalSeconds) {
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${d}d ${h}h ${m}m ${s}s`;
}

function formatSiloResetMoment(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "--";
  }

  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  return formatReadableDateTime(date, {
    includeSeconds: false,
    timeZone: localTimeZone,
    includeWeekday: true,
    includeYear: false,
    zoneLabel: getLocalZoneLabel(date),
    hour12: true
  });
}

function renderSiloDossier() {
  if (!elements.siloDossierOverlay || !elements.siloDossierCodes) {
    return;
  }

  elements.siloDossierEyebrow.textContent = t("silo_dossier_eyebrow");
  elements.siloDossierTitle.textContent = t("silo_dossier_title");
  elements.siloDossierResetLabel.textContent = t("silo_dossier_reset_label");
  elements.siloDossierCountdownLabel.textContent = t("silo_dossier_countdown_label");
  elements.siloDossierStatusLabel.textContent = t("silo_dossier_status_label");
  elements.siloDossierSignalLabel.textContent = t("silo_dossier_signal_label");
  elements.siloDossierSourceLink.textContent = t("silo_dossier_open_source");
  elements.siloDossierCloseBtn.textContent = t("silo_dossier_close");
  elements.siloDossierBackBtn.textContent = t("silo_dossier_back");

  const rawSourceUrl = String(state.silo.source || "").trim();
  const sourceUrl = /nukacrypt/i.test(rawSourceUrl)
    ? "https://nukacrypt.com/"
    : (rawSourceUrl || "https://nukacrypt.com/");
  elements.siloDossierSourceLink.href = sourceUrl;

  const cardsFragment = document.createDocumentFragment();
  const codes = state.silo.codes || {
    Alpha: null,
    Bravo: null,
    Charlie: null
  };
  const hasCodes = Object.values(codes).some(Boolean);

  for (const site of ["Alpha", "Bravo", "Charlie"]) {
    const card = document.createElement("article");
    card.className = "silo-dossier-code-card";

    const label = document.createElement("div");
    label.className = "silo-dossier-code-label";
    label.appendChild(createIconTag(SILO_SITE_GLYPHS[site] || ""));
    label.append(`SITE ${site.toUpperCase()}`);

    const value = document.createElement("div");
    value.className = "silo-dossier-code-value";
    value.textContent = formatSiloCodeForDisplay(codes[site]);

    card.appendChild(label);
    card.appendChild(value);
    cardsFragment.appendChild(card);
  }

  elements.siloDossierCodes.innerHTML = "";
  elements.siloDossierCodes.appendChild(cardsFragment);

  const nowMs = Date.now();
  const targetUtc = getActiveSiloResetTargetMs(nowMs);
  const totalSeconds = Math.max(0, Math.floor((targetUtc - nowMs) / 1000));
  elements.siloDossierResetValue.textContent = formatSiloResetMoment(new Date(targetUtc));
  elements.siloDossierCountdownValue.textContent = formatSiloCountdownValue(totalSeconds);

  if (!hasCodes && !state.silo.error) {
    elements.siloDossierSummary.textContent = t("silo_dossier_loading");
    elements.siloDossierStatusValue.textContent = t("signal_syncing");
    elements.siloDossierBriefing.textContent = t("silo_dossier_loading");
  } else if (state.silo.error) {
    elements.siloDossierSummary.textContent = t("silo_dossier_summary_error");
    elements.siloDossierStatusValue.textContent = t("silo_dossier_status_error");
    elements.siloDossierBriefing.textContent = t("silo_dossier_briefing_error");
  } else if (state.silo.isExpired) {
    elements.siloDossierSummary.textContent = t("silo_dossier_summary_expired");
    elements.siloDossierStatusValue.textContent = t("silo_dossier_status_expired");
    elements.siloDossierBriefing.textContent = t("silo_dossier_briefing_expired");
  } else {
    elements.siloDossierSummary.textContent = t("silo_dossier_summary_live");
    elements.siloDossierStatusValue.textContent = t("silo_dossier_status_live");
    elements.siloDossierBriefing.textContent = t("silo_dossier_briefing_live");
  }

  elements.siloDossierSignalValue.textContent = t(`signal_${state.signalKey}`);
}

function showSiloDossier({ updateHash = true } = {}) {
  if (!elements.siloDossierOverlay) {
    return;
  }

  if (state.view !== "intel") {
    showIntelPage({ updateHash: false });
  }

  state.siloDossier.open = true;
  document.body.classList.add("is-silo-dossier-open");
  elements.siloDossierOverlay.classList.add("is-active");
  elements.siloDossierOverlay.setAttribute("aria-hidden", "false");
  renderSiloDossier();
  renderFilesBotAdminPanel();

  if (updateHash) {
    setHashView("silo");
  }
}

function hideSiloDossier({ updateHash = true } = {}) {
  if (!elements.siloDossierOverlay) {
    return;
  }

  state.siloDossier.open = false;
  document.body.classList.remove("is-silo-dossier-open");
  elements.siloDossierOverlay.classList.remove("is-active");
  elements.siloDossierOverlay.setAttribute("aria-hidden", "true");
  renderFilesBotAdminPanel();

  if (updateHash && isSiloDossierHash()) {
    setHashView("intel");
  }
}

function hideFilesPage() {
  closeIntelBotInviteModal();
  stopFilesLiveIdentityPolling();
  document.body.classList.remove("is-files");
  document.body.classList.remove("is-files-unauthorized", "is-files-guest");
  closeFilesDeleteModal({ force: true });
  closeFilesCautionModal();
  closeFilesDisclaimerModal();
  closeFilesGroupRenameModal({ force: true });
  closeFilesAdminModal();
  if (state.files.search.open || state.files.search.query) {
    setFilesSearchOpen(false, { clearQuery: true });
  }
  if (elements.filesPage) {
    elements.filesPage.classList.remove("is-entering");
    elements.filesPage.hidden = true;
  }
  renderFilesBotAdminPanel();
}

function hideDropsPage() {
  stopDropsVtAutoPoll();
  stopDropsCountAutoPoll();
  closeDropsDeleteModal({ force: true });
  document.body.classList.remove("is-drops");
  if (elements.dropsPage) {
    elements.dropsPage.classList.remove("is-entering");
    elements.dropsPage.hidden = true;
  }
}

function closeClassifiedModalsForNavigation() {
  closeClassifiedPlayerCountsModal();
  closeClassifiedNukaIntelModal();
  closeClassifiedAxolotlModal();
  if (typeof window.closeAtomicShopModal === "function") {
    window.closeAtomicShopModal();
  }
  document.body.classList.remove("is-classified-intel-open", "atomic-shop-open");
}

function closeClassifiedPageForNavigation() {
  showClassifiedLoadOverlay(false);
  closeClassifiedModalsForNavigation();
  document.body.classList.remove("is-classified");
  setClassifiedSearchOpen(false, { clearQuery: true });
  if (elements.classifiedPage) {
    elements.classifiedPage.classList.remove("is-entering");
    elements.classifiedPage.hidden = true;
  }
}

function showIntelPage({ updateHash = true } = {}) {
  closeClassifiedPageForNavigation();
  hideFilesPage();
  hideDropsPage();
  state.view = "intel";
  syncVisitCounterEyeMode();
  elements.mainTitle.textContent = t("main_title");
  syncTopTabForCurrentView();
  renderFilesBotAdminPanel();
  if (updateHash) {
    setHashView("intel");
  }
}

function showFilesPage({ updateHash = true } = {}) {
  closeIntelBotInviteModal();
  hideSiloDossier({ updateHash: false });
  closeClassifiedPageForNavigation();
  hideDropsPage();
  markFilesDecisionNoticeSeen();
  startFilesLiveIdentityPolling();
  syncFilesLoginReturnToField();
  document.body.classList.add("is-files");
  if (elements.filesPage) {
    elements.filesPage.hidden = false;
    elements.filesPage.classList.remove("is-entering");
    void elements.filesPage.offsetWidth;
    elements.filesPage.classList.add("is-entering");
    setTimeout(() => {
      elements.filesPage?.classList.remove("is-entering");
    }, 540);
  }

  state.view = "files";
  syncVisitCounterEyeMode();
  elements.mainTitle.textContent = t("files_main_title");
  syncTopTabForCurrentView();
  renderFilesBotAdminPanel();
  renderFilesAccessView();
  void refreshFilesIdentity();
  if (updateHash) {
    setHashView("files");
  }
}

function showDropsPage({ updateHash = true } = {}) {
  closeIntelBotInviteModal();
  hideSiloDossier({ updateHash: false });
  closeClassifiedPageForNavigation();
  hideFilesPage();
  document.body.classList.add("is-drops");
  if (elements.dropsPage) {
    elements.dropsPage.hidden = false;
    elements.dropsPage.classList.remove("is-entering");
    void elements.dropsPage.offsetWidth;
    elements.dropsPage.classList.add("is-entering");
    setTimeout(() => {
      elements.dropsPage?.classList.remove("is-entering");
    }, 540);
  }

  state.view = "drops";
  syncVisitCounterEyeMode();
  elements.mainTitle.textContent = t("drops_main_title");
  syncTopTabForCurrentView();
  renderFilesBotAdminPanel();
  renderDropsPage();
  void refreshFilesIdentity({ loadFiles: false });
  if (updateHash) {
    setHashView("drops");
  }
}

function applyViewFromHash() {
  const hashView = getHashView();
  if (!hashView) {
    setHashView("intel", { replace: true });
    showIntelPage({ updateHash: false });
    hideSiloDossier({ updateHash: false });
    return;
  }

  if (hashView === "files") {
    if (state.view === "files" && document.body.classList.contains("is-files")) {
      return;
    }
    showFilesPage({ updateHash: false });
    return;
  }

  if (hashView === "drops") {
    if (state.view === "drops" && document.body.classList.contains("is-drops")) {
      return;
    }
    showDropsPage({ updateHash: false });
    return;
  }

  if (hashView === "classified") {
    hideSiloDossier({ updateHash: false });
    if (!canOpenClassifiedArchive()) {
      setHashView("intel", { replace: true });
      showIntelPage({ updateHash: false });
      return;
    }

    if (state.view === "classified" && document.body.classList.contains("is-classified")) {
      return;
    }
    showClassifiedPage({ updateHash: false });
    return;
  }

  if (
    state.view === "intel"
    && !document.body.classList.contains("is-classified")
    && !document.body.classList.contains("is-files")
    && !state.siloDossier.open
  ) {
    return;
  }
  showIntelPage({ updateHash: false });
  hideSiloDossier({ updateHash: false });
}

function buildGuestFilesProfile() {
  return {
    loggedIn: false,
    discordId: "",
    username: "",
    isAdmin: false,
    isAuthorized: false,
    accessRequestStatus: "none",
    accessRequestRequestedAt: "",
    accessRequestDecidedAt: "",
    accessRequestReapplyAt: "",
    accessRequestDeclineReason: "",
    accessDisclaimerDecision: "none",
    accessDisclaimerDecidedAt: "",
    accessDisclaimerReevaluationRequestedAt: "",
    disclaimerRequired: false
  };
}

function normalizeFilesProfile(payload) {
  const fallback = buildGuestFilesProfile();
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  return {
    loggedIn: Boolean(payload.loggedIn),
    discordId: String(payload.discordId || ""),
    username: String(payload.username || ""),
    avatarUrl: String(payload.avatarUrl || ""),
    isAdmin: Boolean(payload.isAdmin),
    isAuthorized: Boolean(payload.isAuthorized),
    accessRequestStatus: String(payload.accessRequestStatus || "none").trim().toLowerCase() || "none",
    accessRequestRequestedAt: String(payload.accessRequestRequestedAt || ""),
    accessRequestDecidedAt: String(payload.accessRequestDecidedAt || ""),
    accessRequestReapplyAt: String(payload.accessRequestReapplyAt || ""),
    accessRequestDeclineReason: String(payload.accessRequestDeclineReason || ""),
    accessDisclaimerDecision: String(payload.accessDisclaimerDecision || "none").trim().toLowerCase() || "none",
    accessDisclaimerDecidedAt: String(payload.accessDisclaimerDecidedAt || ""),
    accessDisclaimerReevaluationRequestedAt: String(payload.accessDisclaimerReevaluationRequestedAt || ""),
    disclaimerRequired: Boolean(payload.disclaimerRequired)
  };
}

function normalizeFilesAccessRequestStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "pending" || normalized === "approved" || normalized === "declined") {
    return normalized;
  }
  return "none";
}

function normalizeFilesDisclaimerDecision(decision) {
  const normalized = String(decision || "").trim().toLowerCase();
  if (normalized === "accepted" || normalized === "declined") {
    return normalized;
  }
  return "none";
}

function normalizeFilesBotAdminSubscriptionEntry(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const channelId = String(payload.channelId || "").trim();
  if (!channelId) {
    return null;
  }

  const feeds = Array.isArray(payload.feeds)
    ? payload.feeds.map((feed) => String(feed || "").trim().toLowerCase()).filter(Boolean)
    : [];

  return {
    channelId,
    channelName: String(payload.channelName || "").trim(),
    feeds: feeds.filter((feed) => feed === "silos" || feed === "minerva")
  };
}

function normalizeFilesBotAdminGuildEntry(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const guildId = String(payload.id || "").trim();
  if (!guildId) {
    return null;
  }

  const subscriptions = Array.isArray(payload.subscriptions)
    ? payload.subscriptions.map((entry) => normalizeFilesBotAdminSubscriptionEntry(entry)).filter(Boolean)
    : [];
  const memberCount = Number(payload.memberCount);

  return {
    id: guildId,
    name: String(payload.name || "").trim() || t("files_unknown_value"),
    iconUrl: String(payload.iconUrl || "").trim(),
    ownerId: String(payload.ownerId || "").trim(),
    ownerName: String(payload.ownerName || "").trim(),
    preferredLocale: String(payload.preferredLocale || "").trim(),
    joinedAt: String(payload.joinedAt || "").trim(),
    memberCount: Number.isFinite(memberCount) ? memberCount : null,
    language: String(payload.language || "").trim().toLowerCase() || "",
    subscriptionCount: Number.isFinite(Number(payload.subscriptionCount))
      ? Number(payload.subscriptionCount)
      : subscriptions.length,
    subscriptions
  };
}

function normalizeFilesBotAdminOverview(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const guilds = Array.isArray(payload.guilds)
    ? payload.guilds.map((entry) => normalizeFilesBotAdminGuildEntry(entry)).filter(Boolean)
    : [];

  return {
    enabled: payload.enabled !== false,
    ready: Boolean(payload.ready),
    generatedAt: String(payload.generatedAt || "").trim(),
    inviteLink: String(payload.inviteLink || "").trim(),
    bot: {
      applicationId: String(payload.bot?.applicationId || "").trim(),
      userId: String(payload.bot?.userId || "").trim(),
      username: String(payload.bot?.username || "").trim(),
      tag: String(payload.bot?.tag || "").trim(),
      avatarUrl: String(payload.bot?.avatarUrl || "").trim(),
      defaultLanguage: String(payload.bot?.defaultLanguage || "").trim().toLowerCase() || "",
      pollIntervalMs: Number.isFinite(Number(payload.bot?.pollIntervalMs)) ? Number(payload.bot.pollIntervalMs) : 0,
      statusRotationIntervalMs: Number.isFinite(Number(payload.bot?.statusRotationIntervalMs))
        ? Number(payload.bot.statusRotationIntervalMs)
        : 0,
      statusRotationActivities: Array.isArray(payload.bot?.statusRotationActivities)
        ? payload.bot.statusRotationActivities.map((entry) => String(entry || "").trim()).filter(Boolean)
        : [],
      currentStatus: String(payload.bot?.currentStatus || "").trim(),
      postOnStartup: Boolean(payload.bot?.postOnStartup),
      startedAt: String(payload.bot?.startedAt || "").trim(),
      readyAt: String(payload.bot?.readyAt || "").trim(),
      uptimeMs: Number.isFinite(Number(payload.bot?.uptimeMs)) ? Number(payload.bot.uptimeMs) : 0,
      publicBaseUrl: String(payload.bot?.publicBaseUrl || "").trim()
    },
    stats: {
      guildCount: Number.isFinite(Number(payload.stats?.guildCount)) ? Number(payload.stats.guildCount) : guilds.length,
      userCount: Number.isFinite(Number(payload.stats?.userCount)) ? Number(payload.stats.userCount) : 0,
      subscriptionCount: Number.isFinite(Number(payload.stats?.subscriptionCount)) ? Number(payload.stats.subscriptionCount) : 0,
      orphanSubscriptionCount: Number.isFinite(Number(payload.stats?.orphanSubscriptionCount))
        ? Number(payload.stats.orphanSubscriptionCount)
        : 0,
      latencyMs: Number.isFinite(Number(payload.stats?.latencyMs)) ? Number(payload.stats.latencyMs) : null
    },
    state: {
      updatedAt: String(payload.state?.updatedAt || "").trim()
    },
    guilds
  };
}

function clearFilesBotAdminState({ preserveQuery = false } = {}) {
  stopFilesBotAdminLivePolling();
  state.files.botAdmin.loading = false;
  state.files.botAdmin.overview = null;
  if (!preserveQuery) {
    state.files.botAdmin.query = "";
    state.files.botAdmin.filter = "all";
    state.files.botAdmin.sort = "members";
  }
  state.files.botAdmin.selectedGuildId = "";
  state.files.botAdmin.diagnosticsOpen = false;
  state.files.botAdmin.message = "";
  state.files.botAdmin.messageKind = "";
  state.files.botAdmin.busyActionKey = "";
  state.files.botAdmin.lastLoadedAt = 0;
}

function setFilesBotAdminFeedback(message = "", kind = "") {
  state.files.botAdmin.message = String(message || "");
  state.files.botAdmin.messageKind = kind === "success" || kind === "error" ? kind : "";
}

function getFilesBotAdminErrorMessage(error) {
  const status = Number(error?.status);
  if (status === 502) {
    return t("files_bot_admin_worker_offline");
  }

  const message = String(error?.message || "").trim();
  if (status === 503 && message.toLowerCase().includes("not configured")) {
    return t("files_bot_admin_unavailable");
  }

  return message || t("files_bot_admin_unavailable");
}

function formatFilesBotAdminNumber(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return t("files_unknown_value");
  }

  try {
    const locale = state.lang === "es" ? "es-ES" : "en-US";
    return new Intl.NumberFormat(locale).format(numericValue);
  } catch {
    return String(numericValue);
  }
}

function formatTelemetryNumber(value, fallback = "--") {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  try {
    const locale = state.lang === "es" ? "es-ES" : "en-US";
    return new Intl.NumberFormat(locale).format(Math.round(numericValue));
  } catch {
    return String(Math.round(numericValue));
  }
}

function normalizeFilesBotAdminGuildFilter(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "subscribed" || normalized === "empty") {
    return normalized;
  }
  return "all";
}

function normalizeFilesBotAdminGuildSort(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "subscriptions" || normalized === "name") {
    return normalized;
  }
  return "members";
}

function getFilesBotAdminGuildSortLabel(sort) {
  const resolvedSort = normalizeFilesBotAdminGuildSort(sort);
  if (resolvedSort === "subscriptions") {
    return t("files_bot_admin_sort_subscriptions");
  }
  if (resolvedSort === "name") {
    return t("files_bot_admin_sort_name");
  }
  return t("files_bot_admin_sort_members");
}

function setFilesBotAdminSortMenuOpen(active) {
  if (!elements.filesBotAdminSortDropdown || !elements.filesBotAdminSortBtn || !elements.filesBotAdminSortMenu) {
    return;
  }

  const shouldOpen = Boolean(active);
  elements.filesBotAdminSortDropdown.classList.toggle("is-open", shouldOpen);
  elements.filesBotAdminSortBtn.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
  elements.filesBotAdminSortMenu.hidden = !shouldOpen;
}

function syncFilesBotAdminSortMenu() {
  const resolvedSort = normalizeFilesBotAdminGuildSort(state.files.botAdmin.sort);
  const selectedLabel = getFilesBotAdminGuildSortLabel(resolvedSort);
  state.files.botAdmin.sort = resolvedSort;

  if (elements.filesBotAdminSortSelect) {
    elements.filesBotAdminSortSelect.value = resolvedSort;
  }
  if (elements.filesBotAdminSortCurrent) {
    elements.filesBotAdminSortCurrent.textContent = selectedLabel;
  }
  if (elements.filesBotAdminSortBtn) {
    const buttonLabel = `${t("files_bot_admin_sort_label")}: ${selectedLabel}`;
    elements.filesBotAdminSortBtn.setAttribute("aria-label", buttonLabel);
    elements.filesBotAdminSortBtn.title = selectedLabel;
  }
  if (!Array.isArray(elements.filesBotAdminSortOptions)) {
    return;
  }

  elements.filesBotAdminSortOptions.forEach((option) => {
    const selected = normalizeFilesBotAdminGuildSort(option.dataset.filesBotSort || "") === resolvedSort;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-selected", selected ? "true" : "false");
  });
}

function setFilesBotAdminSortValue(nextSort, { render = true, closeMenu = true } = {}) {
  state.files.botAdmin.sort = normalizeFilesBotAdminGuildSort(nextSort);
  syncFilesBotAdminSortMenu();
  if (closeMenu) {
    setFilesBotAdminSortMenuOpen(false);
  }
  if (render) {
    renderFilesBotAdminPanel();
  }
}

function formatFilesBotAdminDuration(durationMs) {
  const totalSeconds = Math.max(0, Math.floor(Number(durationMs) / 1000));
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return t("files_unknown_value");
  }

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function renderFilesBotAdminDiagnostics(targetElement, overview = null) {
  if (!(targetElement instanceof HTMLElement)) {
    return;
  }

  const diagnostics = [
    [
      t("files_bot_admin_diagnostic_latency"),
      overview && Number.isFinite(Number(overview.stats?.latencyMs))
        ? `${formatFilesBotAdminNumber(overview.stats.latencyMs)} ms`
        : t("files_unknown_value")
    ],
    [
      t("files_bot_admin_diagnostic_uptime"),
      overview?.bot?.uptimeMs
        ? formatFilesBotAdminDuration(overview.bot.uptimeMs)
        : t("files_unknown_value")
    ],
    [
      t("files_bot_admin_diagnostic_presence"),
      overview?.bot?.currentStatus || t("files_unknown_value")
    ],
    [
      t("files_bot_admin_diagnostic_poll_interval"),
      overview?.bot?.pollIntervalMs
        ? formatFilesBotAdminDuration(overview.bot.pollIntervalMs)
        : t("files_unknown_value")
    ],
    [
      t("files_bot_admin_diagnostic_startup_post"),
      overview?.bot?.postOnStartup ? t("files_bot_admin_flag_enabled") : t("files_bot_admin_flag_disabled")
    ]
  ];

  const fragment = document.createDocumentFragment();
  for (const [label, value] of diagnostics) {
    const card = document.createElement("article");
    card.className = "files-bot-admin-diagnostic-card";

    const cardLabel = document.createElement("span");
    cardLabel.className = "files-bot-admin-diagnostic-label";
    cardLabel.textContent = label;

    const cardValue = document.createElement("strong");
    cardValue.className = "files-bot-admin-diagnostic-value";
    cardValue.textContent = value;

    card.appendChild(cardLabel);
    card.appendChild(cardValue);
    fragment.appendChild(card);
  }

  targetElement.replaceChildren(fragment);
}

function renderFilesBotAdminDiagnosticsModal(overview = normalizeFilesBotAdminOverview(state.files.botAdmin.overview)) {
  const me = normalizeFilesProfile(state.files.me);
  const botModalOpen = normalizeFilesAdminModalType(state.files.adminModal.active) === "bot";
  const isOpen = Boolean(me.isAuthorized && me.isAdmin && botModalOpen && state.files.botAdmin.diagnosticsOpen);

  if (elements.filesBotAdminDiagnosticsModalBadge) {
    elements.filesBotAdminDiagnosticsModalBadge.textContent = t("files_bot_admin_diagnostics_modal_badge");
  }
  if (elements.filesBotAdminDiagnosticsModalTitle) {
    elements.filesBotAdminDiagnosticsModalTitle.textContent = t("files_bot_admin_diagnostics_title");
  }
  if (elements.filesBotAdminDiagnosticsModalHint) {
    elements.filesBotAdminDiagnosticsModalHint.textContent = t("files_bot_admin_diagnostics_modal_hint");
  }
  if (elements.filesBotAdminDiagnosticsModalMeta) {
    elements.filesBotAdminDiagnosticsModalMeta.textContent = getFilesBotAdminMetaText(overview);
  }
  if (elements.filesBotAdminDiagnosticsModalCloseBtn) {
    elements.filesBotAdminDiagnosticsModalCloseBtn.textContent = t("files_bot_admin_diagnostics_modal_close");
  }
  renderFilesBotAdminDiagnostics(elements.filesBotAdminDiagnosticsModalBody, overview);
  if (elements.filesBotAdminDiagnosticsOverlay) {
    elements.filesBotAdminDiagnosticsOverlay.classList.toggle("is-active", isOpen);
    elements.filesBotAdminDiagnosticsOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }
}

function closeFilesBotAdminDiagnosticsModal({ render = true } = {}) {
  state.files.botAdmin.diagnosticsOpen = false;
  if (render) {
    renderFilesBotAdminDiagnosticsModal();
    renderFilesBotAdminPanel();
  }
}

function openFilesBotAdminDiagnosticsModal() {
  const me = normalizeFilesProfile(state.files.me);
  if (!canUseFilesBotAdmin(me, { requireDesktop: true })) {
    return;
  }
  if (normalizeFilesAdminModalType(state.files.adminModal.active) !== "bot") {
    return;
  }

  state.files.botAdmin.diagnosticsOpen = true;
  renderFilesBotAdminDiagnosticsModal();
  renderFilesBotAdminPanel();
  if (elements.filesBotAdminDiagnosticsModalCloseBtn instanceof HTMLElement) {
    requestAnimationFrame(() => {
      focusFilesOpenTarget(elements.filesBotAdminDiagnosticsModalCloseBtn, {
        fallback: elements.filesBotAdminDiagnosticsModalCloseBtn
      });
    });
  }
}

function renderFilesBotAdminServerModal(overview = normalizeFilesBotAdminOverview(state.files.botAdmin.overview)) {
  const me = normalizeFilesProfile(state.files.me);
  const botModalOpen = normalizeFilesAdminModalType(state.files.adminModal.active) === "bot";
  const selectedGuild = getFilesBotAdminSelectedGuild(overview);
  const isOpen = Boolean(me.isAuthorized && me.isAdmin && botModalOpen && selectedGuild);

  if (elements.filesBotAdminServerModalBadge) {
    elements.filesBotAdminServerModalBadge.textContent = t("files_bot_admin_server_modal_badge");
  }
  if (elements.filesBotAdminServerModalTitle) {
    elements.filesBotAdminServerModalTitle.textContent = selectedGuild?.name || t("files_unknown_value");
  }
  if (elements.filesBotAdminServerModalHint) {
    elements.filesBotAdminServerModalHint.textContent = t("files_bot_admin_server_modal_hint");
  }
  if (elements.filesBotAdminServerModalMeta) {
    const localeValue = String(
      selectedGuild?.preferredLocale
      || selectedGuild?.language
      || overview?.bot?.defaultLanguage
      || t("files_unknown_value")
    ).toUpperCase();
    const joinedValue = selectedGuild ? formatFileDateTime(selectedGuild.joinedAt) : t("files_unknown_value");
    elements.filesBotAdminServerModalMeta.textContent = selectedGuild
      ? `${t("files_bot_admin_server_locale")} ${localeValue} | ${t("files_bot_admin_server_joined")} ${joinedValue}`
      : getFilesBotAdminMetaText(overview);
  }
  if (elements.filesBotAdminServerModalCloseBtn) {
    elements.filesBotAdminServerModalCloseBtn.textContent = t("files_admin_modal_close");
  }
  if (elements.filesBotAdminServerModalBody) {
    if (selectedGuild) {
      elements.filesBotAdminServerModalBody.replaceChildren(
        createFilesBotAdminServerDetailCard(selectedGuild, overview, {
          loading: Boolean(state.files.botAdmin.loading),
          busyActionKey: String(state.files.botAdmin.busyActionKey || "").trim()
        })
      );
    } else {
      elements.filesBotAdminServerModalBody.replaceChildren();
    }
  }
  if (elements.filesBotAdminServerOverlay) {
    elements.filesBotAdminServerOverlay.classList.toggle("is-active", isOpen);
    elements.filesBotAdminServerOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }
}

function getFilesBotAdminStatusLabel(overview = null) {
  if (!overview?.enabled) {
    return t("files_bot_admin_status_offline");
  }
  if (!overview.ready) {
    return t("files_bot_admin_status_starting");
  }
  return t("files_bot_admin_status_online");
}

function getFilesBotAdminMetaText(overview = null) {
  if (!overview) {
    return state.files.botAdmin.messageKind === "error"
      ? t("files_bot_admin_meta_offline")
      : t("files_bot_admin_meta_loading");
  }
  if (!overview.enabled || !overview.ready) {
    return t("files_bot_admin_meta_starting");
  }

  const tag = overview.bot.tag || overview.bot.username || t("files_unknown_value");
  const snapshotTime = formatFileDateTime(overview.generatedAt || overview.state.updatedAt || overview.bot.readyAt || "");
  return t("files_bot_admin_meta_ready", {
    tag,
    time: snapshotTime
  });
}

function stopFilesBotAdminLivePolling() {
  if (filesBotAdminPollTimer) {
    window.clearInterval(filesBotAdminPollTimer);
    filesBotAdminPollTimer = 0;
  }
}

function startFilesBotAdminLivePolling() {
  stopFilesBotAdminLivePolling();

  const me = normalizeFilesProfile(state.files.me);
  if (!hasFilesAuthorizedAccess(me) || !me.isAdmin) {
    return;
  }
  if (normalizeFilesAdminModalType(state.files.adminModal.active) !== "bot") {
    return;
  }

  filesBotAdminPollTimer = window.setInterval(() => {
    if (document.hidden) {
      return;
    }
    if (normalizeFilesAdminModalType(state.files.adminModal.active) !== "bot") {
      stopFilesBotAdminLivePolling();
      return;
    }
    if (state.files.botAdmin.loading || state.files.botAdmin.busyActionKey) {
      return;
    }
    void refreshFilesBotAdminOverview({ silent: true });
  }, FILES_BOT_ADMIN_POLL_INTERVAL_MS);
}

function getFilesBotAdminFeedLabel(feeds = []) {
  const uniqueFeeds = [...new Set(Array.isArray(feeds) ? feeds.filter(Boolean) : [])];
  if (uniqueFeeds.includes("silos") && uniqueFeeds.includes("minerva")) {
    return t("files_bot_admin_feed_both");
  }
  if (uniqueFeeds.includes("silos")) {
    return t("files_bot_admin_feed_silos");
  }
  if (uniqueFeeds.includes("minerva")) {
    return t("files_bot_admin_feed_minerva");
  }
  return t("files_unknown_value");
}

function getFilteredFilesBotAdminGuilds() {
  const overview = normalizeFilesBotAdminOverview(state.files.botAdmin.overview);
  if (!overview) {
    return [];
  }

  const query = normalizeSearchText(state.files.botAdmin.query || "");
  const tokens = query ? query.split(" ").filter(Boolean) : [];
  const filterValue = normalizeFilesBotAdminGuildFilter(state.files.botAdmin.filter);
  const sortValue = normalizeFilesBotAdminGuildSort(state.files.botAdmin.sort);
  const filteredGuilds = overview.guilds.filter((guild) => {
    if (filterValue === "subscribed" && Number(guild.subscriptionCount || 0) <= 0) {
      return false;
    }
    if (filterValue === "empty" && Number(guild.subscriptionCount || 0) > 0) {
      return false;
    }
    if (!tokens.length) {
      return true;
    }

    const subscriptionSearch = guild.subscriptions.map((entry) => {
      return [entry.channelId, entry.channelName, getFilesBotAdminFeedLabel(entry.feeds)].join(" ");
    }).join(" ");
    const haystack = normalizeSearchText([
      guild.name,
      guild.id,
      guild.ownerName,
      guild.ownerId,
      guild.preferredLocale,
      guild.language,
      subscriptionSearch
    ].join(" "));
    return tokens.every((token) => haystack.includes(token));
  });

  return [...filteredGuilds].sort((left, right) => {
    if (sortValue === "name") {
      return String(left.name || "").localeCompare(String(right.name || ""), "en", { sensitivity: "base" });
    }

    if (sortValue === "subscriptions") {
      const leftSubscriptions = Number.isFinite(Number(left.subscriptionCount)) ? Number(left.subscriptionCount) : -1;
      const rightSubscriptions = Number.isFinite(Number(right.subscriptionCount)) ? Number(right.subscriptionCount) : -1;
      if (rightSubscriptions !== leftSubscriptions) {
        return rightSubscriptions - leftSubscriptions;
      }
      return String(left.name || "").localeCompare(String(right.name || ""), "en", { sensitivity: "base" });
    }

    const leftMembers = Number.isFinite(Number(left.memberCount)) ? Number(left.memberCount) : -1;
    const rightMembers = Number.isFinite(Number(right.memberCount)) ? Number(right.memberCount) : -1;
    if (rightMembers !== leftMembers) {
      return rightMembers - leftMembers;
    }
    return String(left.name || "").localeCompare(String(right.name || ""), "en", { sensitivity: "base" });
  });
}

function setFilesBotAdminSelectedGuildId(guildId, { scrollIntoView = false, focusModal = false } = {}) {
  state.files.botAdmin.selectedGuildId = String(guildId || "").trim();
  renderFilesBotAdminPanel();

  if (focusModal && state.files.botAdmin.selectedGuildId && elements.filesBotAdminServerModalCloseBtn instanceof HTMLElement) {
    requestAnimationFrame(() => {
      focusFilesOpenTarget(elements.filesBotAdminServerModalCloseBtn, {
        fallback: elements.filesBotAdminServerModalCloseBtn
      });
    });
  }

  if (!scrollIntoView || !state.files.botAdmin.selectedGuildId) {
    return;
  }

  requestAnimationFrame(() => {
    const selector = `[data-files-bot-guild-card="${getFilesBotAdminGuildSelectorValue(state.files.botAdmin.selectedGuildId)}"]`;
    const card = elements.filesBotAdminServerList?.querySelector(selector);
    if (card instanceof HTMLElement) {
      card.scrollIntoView({
        block: "nearest",
        inline: "nearest"
      });
    }
  });
}

function openFilesBotAdminServerModal(guildId) {
  const normalizedGuildId = String(guildId || "").trim();
  if (!normalizedGuildId) {
    return;
  }
  setFilesBotAdminSelectedGuildId(normalizedGuildId, {
    focusModal: true
  });
}

function closeFilesBotAdminServerModal({ focusRow = true, render = true } = {}) {
  const guildId = String(state.files.botAdmin.selectedGuildId || "").trim();
  state.files.botAdmin.selectedGuildId = "";
  if (render) {
    renderFilesBotAdminPanel();
  }

  if (!focusRow || !guildId) {
    return;
  }

  requestAnimationFrame(() => {
    const selector = `[data-files-bot-guild-card="${getFilesBotAdminGuildSelectorValue(guildId)}"] [data-files-bot-select]`;
    const trigger = elements.filesBotAdminServerList?.querySelector(selector);
    if (trigger instanceof HTMLElement) {
      focusFilesOpenTarget(trigger, {
        fallback: trigger
      });
    }
  });
}

function getFilesBotAdminGuildSelectorValue(guildId) {
  const value = String(guildId || "").trim();
  if (!value) {
    return "";
  }
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function getFilesBotAdminSelectedGuild(overview = normalizeFilesBotAdminOverview(state.files.botAdmin.overview)) {
  const selectedGuildId = String(state.files.botAdmin.selectedGuildId || "").trim();
  if (!selectedGuildId || !overview?.guilds?.length) {
    return null;
  }
  return overview.guilds.find((guild) => guild.id === selectedGuildId) || null;
}

function createFilesBotAdminGuildAvatar(guildName, iconUrl) {
  const avatar = document.createElement("div");
  avatar.className = "files-bot-admin-server-avatar";
  if (iconUrl) {
    const image = document.createElement("img");
    image.src = iconUrl;
    image.alt = `${guildName} icon`;
    image.loading = "lazy";
    avatar.appendChild(image);
  } else {
    avatar.textContent = guildName.slice(0, 2).toUpperCase();
  }
  return avatar;
}

function createFilesBotAdminServerDetailCard(
  guild,
  overview,
  { loading = false, busyActionKey = String(state.files.botAdmin.busyActionKey || "").trim() } = {}
) {
  const guildName = guild.name || t("files_unknown_value");
  const welcomeActionKey = `welcome:${guild.id}`;
  const testPostActionKey = `test-post:${guild.id}`;
  const leaveActionKey = `leave:${guild.id}`;
  const welcomeBusy = busyActionKey === welcomeActionKey;
  const testPostBusy = busyActionKey === testPostActionKey;
  const leaveBusy = busyActionKey === leaveActionKey;
  const hasRelayChannels = Number(guild.subscriptionCount || 0) > 0;

  const card = document.createElement("article");
  card.className = "files-bot-admin-focus-card";
  card.dataset.filesBotGuildCard = guild.id;

  const hero = document.createElement("div");
  hero.className = "files-bot-admin-focus-hero";

  const identity = document.createElement("div");
  identity.className = "files-bot-admin-focus-identity";

  const avatar = createFilesBotAdminGuildAvatar(guildName, guild.iconUrl);

  const heroCopy = document.createElement("div");
  heroCopy.className = "files-bot-admin-focus-hero-copy";
  const heading = document.createElement("div");
  heading.className = "files-bot-admin-focus-hero-heading";
  const name = document.createElement("h3");
  name.className = "files-bot-admin-server-name";
  name.textContent = guildName;
  const id = document.createElement("span");
  id.className = "files-bot-admin-server-id";
  id.textContent = guild.id;
  heading.appendChild(name);
  heading.appendChild(id);
  heroCopy.appendChild(heading);

  const heroMeta = document.createElement("div");
  heroMeta.className = "files-bot-admin-focus-hero-meta";
  const heroMetaValues = [
    `${t("files_bot_admin_server_locale")} ${String(
      guild.preferredLocale || guild.language || overview.bot.defaultLanguage || t("files_unknown_value")
    ).toUpperCase()}`,
    `${t("files_bot_admin_server_users")} ${formatFilesBotAdminNumber(guild.memberCount)}`
  ];
  for (const value of heroMetaValues) {
    const metaChip = document.createElement("span");
    metaChip.className = "files-bot-admin-focus-hero-chip";
    metaChip.textContent = value;
    heroMeta.appendChild(metaChip);
  }
  heroCopy.appendChild(heroMeta);

  identity.appendChild(avatar);
  identity.appendChild(heroCopy);

  const heroBadges = document.createElement("div");
  heroBadges.className = "files-bot-admin-focus-hero-badges";

  const liveBadge = document.createElement("span");
  liveBadge.className = "files-bot-admin-server-badge is-live";
  liveBadge.textContent = getFilesBotAdminStatusLabel(overview);

  const subscriptionBadge = document.createElement("span");
  subscriptionBadge.className = "files-bot-admin-server-badge";
  subscriptionBadge.textContent = t("files_bot_admin_server_channels_count", {
    n: formatFilesBotAdminNumber(guild.subscriptionCount)
  });

  heroBadges.appendChild(liveBadge);
  heroBadges.appendChild(subscriptionBadge);

  hero.appendChild(identity);
  hero.appendChild(heroBadges);

  const metrics = document.createElement("div");
  metrics.className = "files-bot-admin-focus-grid";
  const ownerDisplay = guild.ownerName
    ? `${guild.ownerName} | ${guild.ownerId || t("files_unknown_value")}`
    : guild.ownerId || t("files_unknown_value");
  const metricEntries = [
    [t("files_bot_admin_server_joined"), formatFileDateTime(guild.joinedAt)],
    [t("files_bot_admin_server_owner"), ownerDisplay],
    [t("files_bot_admin_server_language"), (guild.language || overview.bot.defaultLanguage || t("files_unknown_value")).toUpperCase()],
    [t("files_bot_admin_summary_channels"), formatFilesBotAdminNumber(guild.subscriptionCount)]
  ];
  for (const [label, value] of metricEntries) {
    const item = document.createElement("div");
    item.className = "files-bot-admin-focus-metric";
    const itemLabel = document.createElement("span");
    itemLabel.textContent = label;
    const itemValue = document.createElement("strong");
    itemValue.textContent = value;
    item.appendChild(itemLabel);
    item.appendChild(itemValue);
    metrics.appendChild(item);
  }

  const subscriptions = document.createElement("section");
  subscriptions.className = "files-bot-admin-focus-subscriptions";
  const subscriptionsHead = document.createElement("div");
  subscriptionsHead.className = "files-bot-admin-focus-subscriptions-head";
  const subscriptionsTitle = document.createElement("strong");
  subscriptionsTitle.className = "files-bot-admin-focus-subscriptions-title";
  subscriptionsTitle.textContent = t("files_bot_admin_server_subscriptions");
  const subscriptionsCount = document.createElement("span");
  subscriptionsCount.className = "files-bot-admin-focus-subscriptions-count";
  subscriptionsCount.textContent = t("files_bot_admin_server_channels_count", {
    n: formatFilesBotAdminNumber(guild.subscriptionCount)
  });
  subscriptionsHead.appendChild(subscriptionsTitle);
  subscriptionsHead.appendChild(subscriptionsCount);
  subscriptions.appendChild(subscriptionsHead);

  if (guild.subscriptions.length) {
    const subscriptionList = document.createElement("div");
    subscriptionList.className = "files-bot-admin-focus-subscription-list";
    for (const entry of guild.subscriptions) {
      const chip = document.createElement("span");
      chip.className = "files-bot-admin-focus-subscription";
      chip.append(document.createTextNode(entry.channelName ? `#${entry.channelName}` : entry.channelId));
      const feed = document.createElement("span");
      feed.textContent = getFilesBotAdminFeedLabel(entry.feeds);
      chip.appendChild(feed);
      subscriptionList.appendChild(chip);
    }
    subscriptions.appendChild(subscriptionList);
  } else {
    const noSubscriptions = document.createElement("p");
    noSubscriptions.className = "files-bot-admin-empty";
    noSubscriptions.textContent = t("files_bot_admin_server_no_subscriptions");
    subscriptions.appendChild(noSubscriptions);
  }

  const actions = document.createElement("div");
  actions.className = "files-bot-admin-focus-actions";

  const welcomeBtn = document.createElement("button");
  welcomeBtn.type = "button";
  welcomeBtn.className = "files-card-action files-bot-admin-focus-action";
  welcomeBtn.textContent = welcomeBusy ? t("files_bot_admin_server_action_busy") : t("files_bot_admin_server_action_welcome");
  welcomeBtn.dataset.filesBotAction = "welcome";
  welcomeBtn.dataset.guildId = guild.id;
  welcomeBtn.dataset.guildName = guildName;
  welcomeBtn.dataset.actionKey = welcomeActionKey;
  welcomeBtn.disabled = loading || Boolean(busyActionKey);

  const testPostBtn = document.createElement("button");
  testPostBtn.type = "button";
  testPostBtn.className = "files-card-action files-bot-admin-focus-action";
  testPostBtn.textContent = testPostBusy
    ? t("files_bot_admin_server_action_busy")
    : t("files_bot_admin_server_action_test_post");
  testPostBtn.dataset.filesBotAction = "test-post";
  testPostBtn.dataset.guildId = guild.id;
  testPostBtn.dataset.guildName = guildName;
  testPostBtn.dataset.actionKey = testPostActionKey;
  testPostBtn.disabled = loading || Boolean(busyActionKey) || !hasRelayChannels;
  if (!hasRelayChannels) {
    testPostBtn.title = t("files_bot_admin_server_no_subscriptions");
  }

  const leaveBtn = document.createElement("button");
  leaveBtn.type = "button";
  leaveBtn.className = "files-card-action files-bot-admin-focus-action is-delete";
  leaveBtn.textContent = leaveBusy ? t("files_bot_admin_server_action_busy") : t("files_bot_admin_server_action_leave");
  leaveBtn.dataset.filesBotAction = "leave";
  leaveBtn.dataset.guildId = guild.id;
  leaveBtn.dataset.guildName = guildName;
  leaveBtn.dataset.actionKey = leaveActionKey;
  leaveBtn.disabled = loading || Boolean(busyActionKey);

  actions.appendChild(welcomeBtn);
  actions.appendChild(testPostBtn);
  actions.appendChild(leaveBtn);

  card.appendChild(hero);
  card.appendChild(metrics);
  card.appendChild(subscriptions);
  card.appendChild(actions);

  return card;
}

function hasPendingFilesDisclaimerReevaluation(profile = null) {
  const me = normalizeFilesProfile(profile || state.files.me);
  return Boolean(String(me.accessDisclaimerReevaluationRequestedAt || "").trim());
}

function getFilesDecisionSeenStorageKey(discordId) {
  const normalizedId = String(discordId || "").trim();
  if (!normalizedId) {
    return "";
  }
  return `${STORAGE_FILES_DECISION_SEEN_PREFIX}:${normalizedId}`;
}

function getFilesDecisionToken(profile = null) {
  const me = normalizeFilesProfile(profile || state.files.me);
  if (!me.loggedIn || !me.discordId) {
    return "";
  }

  const status = normalizeFilesAccessRequestStatus(me.accessRequestStatus);
  if (status !== "approved" && status !== "declined") {
    return "";
  }

  const decidedAt = String(me.accessRequestDecidedAt || "").trim();
  if (!decidedAt) {
    return "";
  }

  return `${me.discordId}:${status}:${decidedAt}`;
}

function readFilesSeenDecisionToken(discordId) {
  const storageKey = getFilesDecisionSeenStorageKey(discordId);
  if (!storageKey) {
    return "";
  }

  try {
    return String(localStorage.getItem(storageKey) || "");
  } catch {
    return "";
  }
}

function writeFilesSeenDecisionToken(discordId, token) {
  const storageKey = getFilesDecisionSeenStorageKey(discordId);
  if (!storageKey) {
    return;
  }

  try {
    localStorage.setItem(storageKey, String(token || ""));
  } catch {
    // no-op
  }
}

function renderFilesDecisionTabBadge() {
  if (!elements.tabStatusDecisionBadge) {
    return;
  }

  const showBadge = Boolean(state.files.decisionNotice.visible);
  elements.tabStatusDecisionBadge.hidden = !showBadge;
  elements.tabStatusDecisionBadge.textContent = showBadge ? "1" : "";
  elements.tabStatusDecisionBadge.setAttribute("aria-label", t("files_decision_badge_aria_label"));
  elements.tabStatusDecisionBadge.title = t("files_decision_badge_aria_label");
}

function syncFilesDecisionNoticeFromProfile(profile = null) {
  const me = normalizeFilesProfile(profile || state.files.me);
  const nextToken = getFilesDecisionToken(me);

  if (!nextToken) {
    state.files.decisionNotice.visible = false;
    state.files.decisionNotice.token = "";
    renderFilesDecisionTabBadge();
    return;
  }

  const seenToken = readFilesSeenDecisionToken(me.discordId);
  const alreadySeen = Boolean(seenToken && seenToken === nextToken);
  const currentlyInFilesView = state.view === "files" && document.body.classList.contains("is-files");

  if (currentlyInFilesView || alreadySeen) {
    state.files.decisionNotice.visible = false;
    state.files.decisionNotice.token = nextToken;
    if (currentlyInFilesView && seenToken !== nextToken) {
      writeFilesSeenDecisionToken(me.discordId, nextToken);
    }
    renderFilesDecisionTabBadge();
    return;
  }

  state.files.decisionNotice.visible = true;
  state.files.decisionNotice.token = nextToken;
  renderFilesDecisionTabBadge();
}

function markFilesDecisionNoticeSeen() {
  const me = normalizeFilesProfile(state.files.me);
  const token = getFilesDecisionToken(me);
  if (token && me.discordId) {
    writeFilesSeenDecisionToken(me.discordId, token);
  }
  state.files.decisionNotice.visible = false;
  state.files.decisionNotice.token = token || "";
  renderFilesDecisionTabBadge();
}

function isFilesAccessExpired(profile = null, nowMs = Date.now()) {
  const me = normalizeFilesProfile(profile || state.files.me);
  if (!me.loggedIn) {
    return false;
  }

  if (normalizeFilesAccessRequestStatus(me.accessRequestStatus) !== "approved") {
    return false;
  }

  const expiryMs = getFilesAccessExpiryMs(me.accessRequestDecidedAt);
  return Boolean(expiryMs && expiryMs <= nowMs);
}

function syncFilesLocalAccessExpired(profile = null, nowMs = Date.now()) {
  const expired = isFilesAccessExpired(profile, nowMs);
  state.files.localAccessExpired = expired;
  return expired;
}

function hasFilesAuthorizedAccess(profile = null, { allowExpired = false } = {}) {
  const me = normalizeFilesProfile(profile || state.files.me);
  if (!me.loggedIn) {
    return false;
  }

  const approvedAccepted = normalizeFilesAccessRequestStatus(me.accessRequestStatus) === "approved"
    && normalizeFilesDisclaimerDecision(me.accessDisclaimerDecision) === "accepted";
  const authorized = Boolean(me.isAuthorized) || approvedAccepted;
  if (!authorized) {
    return false;
  }

  return allowExpired ? true : !isFilesAccessExpired(me);
}

function canBypassClassifiedHackAsAdmin(profile = null) {
  const me = normalizeFilesProfile(profile || state.files.me);
  return Boolean(me.loggedIn && me.isAdmin && hasFilesAuthorizedAccess(me));
}

function canOpenClassifiedArchive() {
  return Boolean(
    state.easterEgg.unlocked
    || state.easterEgg.hack?.solved
    || canBypassClassifiedHackAsAdmin()
  );
}

function syncClassifiedAccessState() {
  if (elements.hackOverlay?.classList.contains("is-active")) {
    renderHackOverlay();
  }

  if (document.body.classList.contains("is-classified") && !canOpenClassifiedArchive()) {
    hideClassifiedPage();
  }
}

function shouldShowFilesDisclaimerGate(profile = null) {
  const me = normalizeFilesProfile(profile || state.files.me);
  if (!me.loggedIn) {
    return false;
  }

  if (normalizeFilesAccessRequestStatus(me.accessRequestStatus) !== "approved") {
    return false;
  }

  if (isFilesAccessExpired(me)) {
    return false;
  }

  if (hasFilesAuthorizedAccess(me)) {
    return false;
  }

  const decision = normalizeFilesDisclaimerDecision(me.accessDisclaimerDecision);
  if (me.disclaimerRequired) {
    return decision !== "accepted";
  }

  return decision === "none" || decision === "declined";
}

function getFilesAccessRequestStatusLabel(status) {
  const resolvedStatus = normalizeFilesAccessRequestStatus(status);
  if (resolvedStatus === "approved") {
    return t("files_restricted_status_approved");
  }
  if (resolvedStatus === "declined") {
    return t("files_restricted_status_declined");
  }
  if (resolvedStatus === "pending") {
    return t("files_restricted_status_pending");
  }
  return t("files_restricted_status_none");
}

function resolveFilesReapplyAtMs({ accessRequestStatus, accessRequestDecidedAt, accessRequestReapplyAt } = {}) {
  const explicitMs = Date.parse(String(accessRequestReapplyAt || "").trim());
  if (Number.isFinite(explicitMs) && explicitMs > 0) {
    return explicitMs;
  }

  const resolvedStatus = normalizeFilesAccessRequestStatus(accessRequestStatus);
  if (resolvedStatus !== "declined") {
    return 0;
  }

  const decidedAtMs = Date.parse(String(accessRequestDecidedAt || "").trim());
  if (!Number.isFinite(decidedAtMs) || decidedAtMs <= 0) {
    return 0;
  }
  return decidedAtMs + FILES_ACCESS_DECLINED_REAPPLY_MS;
}

function getFilesDeclinedCooldownRemainingMs(profile = {}, nowMs = Date.now()) {
  const reapplyAtMs = resolveFilesReapplyAtMs(profile);
  if (!Number.isFinite(reapplyAtMs) || reapplyAtMs <= 0) {
    return 0;
  }
  return Math.max(0, reapplyAtMs - nowMs);
}

function getFilesAccessExpiryMs(decidedAtStr) {
  const ms = Date.parse(String(decidedAtStr || "").trim());
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return ms + FILES_ACCESS_APPROVED_DURATION_MS;
}

function formatFilesAccessCountdown(expiryMs) {
  const remaining = expiryMs - Date.now();
  if (remaining <= 0) return null;
  const totalSec = Math.floor(remaining / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return d > 0 ? `${d}D ${hh}H ${mm}M ${ss}S` : `${hh}H ${mm}M ${ss}S`;
}

function updateFilesAccessTimers() {
  const timerEls = document.querySelectorAll("[data-files-access-timer]");
  for (const el of timerEls) {
    const expiryMs = Number(el.dataset.filesAccessTimer);
    if (!expiryMs) continue;
    const remaining = expiryMs - Date.now();
    const container = el.closest(".files-session-timer-row, .files-admin-request-timer");
    if (remaining <= 0) {
      el.textContent = t("files_access_timer_expired");
      container?.classList.add("is-expired");
      container?.classList.remove("is-warning");
      if (el.id === "filesSessionTimer" && !state.files.localAccessExpired) {
        state.files.localAccessExpired = true;
        renderFilesAccessView();
      }
    } else {
      el.textContent = formatFilesAccessCountdown(expiryMs) || t("files_access_timer_expired");
      if (container) {
        container.classList.toggle("is-warning", remaining < 3 * 24 * 60 * 60 * 1000);
        container.classList.remove("is-expired");
      }
    }
  }
}

function isFilesDeclinedCooldownActive(profile = {}, nowMs = Date.now()) {
  const status = normalizeFilesAccessRequestStatus(profile.accessRequestStatus);
  if (status !== "declined") {
    return false;
  }
  return getFilesDeclinedCooldownRemainingMs(profile, nowMs) > 0;
}

function getFilesSessionStateLabel({ loggedIn, accessRequestStatus }) {
  if (!loggedIn) {
    return t("files_unknown_value");
  }
  const resolvedStatus = normalizeFilesAccessRequestStatus(accessRequestStatus);
  if (resolvedStatus === "approved") {
    return t("files_session_state_approved");
  }
  if (resolvedStatus === "declined") {
    return t("files_session_state_declined");
  }
  if (resolvedStatus === "pending") {
    return t("files_session_state_pending");
  }
  return t("files_session_state_online");
}

function formatFileSize(byteValue) {
  const bytes = Number(byteValue);
  if (!Number.isFinite(bytes) || bytes < 0) {
    return t("files_unknown_value");
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const precision = size >= 100 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
}

function formatFileDateTime(value) {
  if (!value) {
    return t("files_unknown_value");
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return t("files_unknown_value");
  }

  try {
    const locale = state.lang === "es" ? "es-ES" : "en-US";
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

function formatFileFooterDate(value) {
  if (!value) {
    return t("files_unknown_value");
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return t("files_unknown_value");
  }

  try {
    const locale = state.lang === "es" ? "es-ES" : "en-US";
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short"
    }).format(date)
      .replace(/\./g, "")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return date.toISOString().slice(5, 10);
  }
}

function hasFilesUpdatedTimestamp(file) {
  const uploadedAt = String(file?.uploadedAt || file?.uploaded_at || "").trim();
  const contentUpdatedAt = String(file?.contentUpdatedAt || file?.content_updated_at || "").trim();
  if (!uploadedAt || !contentUpdatedAt || uploadedAt === contentUpdatedAt) {
    return false;
  }

  const uploadedMs = Date.parse(uploadedAt);
  const updatedMs = Date.parse(contentUpdatedAt);
  if (Number.isFinite(uploadedMs) && Number.isFinite(updatedMs)) {
    return updatedMs > uploadedMs;
  }

  return true;
}

function resolveFilesTimestampMeta(file) {
  const uploadedRaw = String(file?.uploadedAt || file?.uploaded_at || "").trim();
  const updatedRaw = String(file?.contentUpdatedAt || file?.content_updated_at || uploadedRaw || "").trim();
  const uploadedDate = formatFileDateTime(uploadedRaw);
  const updatedDate = formatFileDateTime(updatedRaw);
  const uploadedFooterDate = formatFileFooterDate(uploadedRaw);
  const updatedFooterDate = formatFileFooterDate(updatedRaw);
  const hasUpdatedDate = hasFilesUpdatedTimestamp(file);

  return {
    uploadedDate,
    updatedDate,
    uploadedFooterDate,
    updatedFooterDate,
    hasUpdatedDate,
    primaryLabel: hasUpdatedDate ? t("files_updated_label") : t("files_uploaded_label"),
    primaryDate: hasUpdatedDate ? updatedDate : uploadedDate,
    previewLabel: hasUpdatedDate ? t("files_updated_short_label") : t("files_uploaded_label"),
    previewDate: hasUpdatedDate ? updatedFooterDate : uploadedFooterDate
  };
}

function resolveFileTypeLabel(file) {
  const fileName = String(file.name || file.originalName || "");
  const extensionMatch = /\.([A-Za-z0-9]+)$/.exec(fileName);
  const extension = extensionMatch ? extensionMatch[1].toUpperCase() : "";
  const mimeType = String(file.mimeType || file.type || "").trim();

  if (extension && mimeType) {
    return `${extension} / ${mimeType}`;
  }
  if (extension) {
    return extension;
  }
  if (mimeType) {
    return mimeType;
  }
  return t("files_unknown_value");
}

function getFilesTypeBadgeLabel(file) {
  const fileName = String(file?.name || file?.originalName || "");
  const extensionMatch = /\.([A-Za-z0-9]+)$/.exec(fileName);
  if (extensionMatch && extensionMatch[1]) {
    return extensionMatch[1].toUpperCase();
  }

  const mimeType = String(file?.mimeType || file?.type || "").trim();
  if (!mimeType) {
    return "FILE";
  }

  const mimeToken = mimeType.includes("/") ? mimeType.split("/").pop() : mimeType;
  const compactToken = String(mimeToken || "")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)[0]
    .slice(0, 12)
    .toUpperCase();
  return compactToken || "FILE";
}

function resolveFilesTypeIconKind(file) {
  const extension = getFilesTypeBadgeLabel(file).toLowerCase();
  const mimeType = String(file?.mimeType || file?.type || "").trim().toLowerCase();
  if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "avif", "svg"].includes(extension)) {
    return "image";
  }
  if (mimeType.startsWith("video/") || ["mp4", "mov", "webm", "mkv"].includes(extension)) {
    return "video";
  }
  if (mimeType.startsWith("audio/") || ["mp3", "wav", "ogg", "flac"].includes(extension)) {
    return "audio";
  }
  if (mimeType.includes("zip") || mimeType.includes("rar") || ["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
    return "archive";
  }
  if (mimeType.includes("pdf") || extension === "pdf") {
    return "pdf";
  }
  if (
    mimeType.includes("spreadsheet")
    || mimeType.includes("excel")
    || ["xls", "xlsx", "csv", "tsv"].includes(extension)
  ) {
    return "sheet";
  }
  if (
    mimeType.includes("document")
    || mimeType.includes("word")
    || ["doc", "docx", "rtf"].includes(extension)
  ) {
    return "document";
  }
  if (
    mimeType.includes("json")
    || mimeType.includes("javascript")
    || mimeType.includes("xml")
    || ["js", "ts", "tsx", "jsx", "json", "css", "html", "xml", "py", "lua", "ini", "yml", "yaml"].includes(extension)
  ) {
    return "code";
  }
  if (mimeType.startsWith("text/") || ["txt", "md", "log"].includes(extension)) {
    return "text";
  }
  return "file";
}

function createFilesTypeIcon(file, { compact = false } = {}) {
  const iconKind = resolveFilesTypeIconKind(file);
  const extensionLabel = getFilesTypeBadgeLabel(file).slice(0, 5) || "FILE";
  const icon = document.createElement("span");
  icon.className = `files-detail-type-icon is-${iconKind}${compact ? " is-compact" : ""}`;
  icon.setAttribute("aria-hidden", "true");
  icon.dataset.fileExt = extensionLabel;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 48 56");
  svg.setAttribute("focusable", "false");
  svg.classList.add("files-detail-type-icon-svg");

  const appendShape = (tagName, attrs) => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tagName);
    Object.entries(attrs).forEach(([name, value]) => {
      node.setAttribute(name, value);
    });
    svg.appendChild(node);
  };

  appendShape("path", { class: "files-detail-type-icon-page", d: "M9 4h21l9 9v39H9z" });
  appendShape("path", { class: "files-detail-type-icon-fold", d: "M30 4v10h9" });
  if (iconKind === "image") {
    appendShape("rect", { class: "files-detail-type-icon-mark", x: "15", y: "22", width: "18", height: "14", rx: "2" });
    appendShape("path", { class: "files-detail-type-icon-line", d: "m16 34 6-6 4 4 3-3 5 5" });
    appendShape("circle", { class: "files-detail-type-icon-dot", cx: "29", cy: "25", r: "1.8" });
  } else if (iconKind === "archive") {
    appendShape("path", { class: "files-detail-type-icon-line", d: "M18 19h12v20H18z" });
    appendShape("path", { class: "files-detail-type-icon-line", d: "M23 19v20M25 19v20M21 24h6M21 31h6" });
  } else if (iconKind === "code") {
    appendShape("path", { class: "files-detail-type-icon-line", d: "m21 24-5 5 5 5M27 24l5 5-5 5" });
    appendShape("path", { class: "files-detail-type-icon-line", d: "m26 22-4 14" });
  } else if (iconKind === "pdf") {
    appendShape("path", { class: "files-detail-type-icon-mark", d: "M17 22h14v16H17z" });
    appendShape("path", { class: "files-detail-type-icon-line", d: "M20 27h8M20 31h8M20 35h5" });
  } else if (iconKind === "sheet") {
    appendShape("path", { class: "files-detail-type-icon-line", d: "M16 22h16v16H16zM16 27h16M16 32h16M21 22v16M27 22v16" });
  } else if (iconKind === "audio") {
    appendShape("path", { class: "files-detail-type-icon-mark", d: "M20 34h-4v-8h4l8-5v18z" });
    appendShape("path", { class: "files-detail-type-icon-line", d: "M31 26a7 7 0 0 1 0 8" });
  } else if (iconKind === "video") {
    appendShape("rect", { class: "files-detail-type-icon-mark", x: "15", y: "23", width: "16", height: "13", rx: "2" });
    appendShape("path", { class: "files-detail-type-icon-line", d: "m31 27 5-3v11l-5-3z" });
  } else {
    appendShape("path", { class: "files-detail-type-icon-line", d: "M16 23h16M16 29h16M16 35h10" });
  }

  const label = document.createElement("span");
  label.className = "files-detail-type-icon-label";
  label.textContent = extensionLabel;
  icon.append(svg, label);
  return icon;
}

function createFilesDetailStat(label, value) {
  const item = document.createElement("span");
  item.className = "files-detail-modal-stat";

  const labelEl = document.createElement("span");
  labelEl.className = "files-detail-modal-stat-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  valueEl.className = "files-detail-modal-stat-value";
  valueEl.textContent = value || t("files_unknown_value");

  item.append(labelEl, valueEl);
  return item;
}

function normalizeFilesGroup(value) {
  return String(value || "")
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function getFilesGroupKey(groupValue) {
  const normalizedGroup = normalizeFilesGroup(groupValue);
  if (!normalizedGroup) {
    return "__ungrouped__";
  }
  return `group:${normalizeSearchText(normalizedGroup)}`;
}

function getFilesGroupItemCount(groupKey, files = state.files.list) {
  const targetKey = String(groupKey || "").trim();
  if (!targetKey) {
    return 0;
  }
  const source = Array.isArray(files) ? files : [];
  let count = 0;
  for (const file of source) {
    const entryKey = getFilesGroupKey(normalizeFilesGroup(file?.group || ""));
    if (entryKey === targetKey) {
      count += 1;
    }
  }
  return count;
}

function getFilesDisplayName(file) {
  const displayName = String(file?.displayName || "")
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (displayName) {
    return displayName;
  }

  const fallbackName = String(file?.name || file?.originalName || "")
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .trim();
  if (fallbackName) {
    return fallbackName;
  }

  return t("files_unknown_value");
}

function getFilesGroupDisplayLabel(file) {
  const group = normalizeFilesGroup(file?.group || "");
  return group || t("files_group_default");
}

function formatFilesGroupCount(count) {
  const normalizedCount = Math.max(0, Number(count) || 0);
  return t("files_group_count", { n: String(normalizedCount) });
}

function getKnownFileGroups() {
  const groups = new Set();
  const baseFiles = Array.isArray(state.files.list) ? state.files.list : [];
  for (const file of baseFiles) {
    const group = normalizeFilesGroup(file?.group || "");
    if (group) {
      groups.add(group);
    }
  }

  return Array.from(groups).sort((left, right) => left.localeCompare(right, state.lang === "es" ? "es" : "en"));
}

function getFilesGroupSuggestionOptions(selectedValue = "") {
  const groups = getKnownFileGroups();
  const normalizedSelected = normalizeFilesGroup(selectedValue);
  const options = [
    {
      value: "",
      label: t("files_group_manager_suggest_placeholder")
    }
  ];

  let hasSelectedOption = !normalizedSelected;
  for (const group of groups) {
    options.push({
      value: group,
      label: group
    });
    if (!hasSelectedOption && group === normalizedSelected) {
      hasSelectedOption = true;
    }
  }

  if (normalizedSelected && !hasSelectedOption) {
    options.push({
      value: normalizedSelected,
      label: normalizedSelected
    });
  }

  return {
    options,
    selectedValue: normalizedSelected
  };
}

function getFilesGroupSuggestTargetInput(dropdownElement) {
  if (!(dropdownElement instanceof HTMLElement)) {
    return null;
  }
  const targetId = String(dropdownElement.getAttribute("data-files-group-suggest-target") || "").trim();
  if (!targetId) {
    return null;
  }
  const targetInput = document.getElementById(targetId);
  return targetInput instanceof HTMLInputElement ? targetInput : null;
}

function setFilesGroupSuggestMenuOpen(dropdownElement, active) {
  if (!(dropdownElement instanceof HTMLElement)) {
    return;
  }
  const toggleBtn = dropdownElement.querySelector("[data-files-group-suggest-toggle]");
  const menu = dropdownElement.querySelector("[data-files-group-suggest-menu]");
  if (!(toggleBtn instanceof HTMLButtonElement) || !(menu instanceof HTMLElement)) {
    return;
  }

  const shouldOpen = Boolean(active);
  dropdownElement.classList.toggle("is-open", shouldOpen);
  toggleBtn.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
  menu.hidden = !shouldOpen;
}

function closeAllFilesEditPickers() {
  const pickers = Array.from(document.querySelectorAll(".files-edit-picker-wrap.is-open"));
  for (const node of pickers) {
    node.classList.remove("is-open");
  }
}

function closeAllFilesGroupSuggestMenus({ except = null } = {}) {
  const dropdowns = Array.from(document.querySelectorAll("[data-files-group-suggest-dropdown]"));
  for (const node of dropdowns) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    if (except && node === except) {
      continue;
    }
    setFilesGroupSuggestMenuOpen(node, false);
  }
}

function syncFilesGroupSuggestDropdown(dropdownElement, selectedValue = null) {
  if (!(dropdownElement instanceof HTMLElement)) {
    return;
  }

  const currentEl = dropdownElement.querySelector("[data-files-group-suggest-current]");
  const menu = dropdownElement.querySelector("[data-files-group-suggest-menu]");
  const toggleBtn = dropdownElement.querySelector("[data-files-group-suggest-toggle]");
  if (!(menu instanceof HTMLElement)) {
    return;
  }

  const linkedInput = getFilesGroupSuggestTargetInput(dropdownElement);
  const effectiveValue = selectedValue === null
    ? normalizeFilesGroup(linkedInput?.value || "")
    : normalizeFilesGroup(selectedValue);
  const optionState = getFilesGroupSuggestionOptions(effectiveValue);
  const selectedValueKey = optionState.selectedValue || "";
  let selectedLabel = t("files_group_manager_suggest_placeholder");
  const fragment = document.createDocumentFragment();

  for (const option of optionState.options) {
    const row = document.createElement("li");

    const optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = "files-admin-requests-filter-option files-group-suggest-option";
    optionButton.setAttribute("role", "option");
    optionButton.setAttribute("data-files-action", "select-group-suggest-option");
    optionButton.setAttribute("data-group-value", option.value);
    optionButton.textContent = option.label;

    const isSelected = option.value === selectedValueKey;
    if (isSelected) {
      selectedLabel = option.label;
      optionButton.classList.add("is-selected");
    }
    optionButton.setAttribute("aria-selected", isSelected ? "true" : "false");

    row.appendChild(optionButton);
    fragment.appendChild(row);
  }

  menu.replaceChildren(fragment);
  if (currentEl instanceof HTMLElement) {
    currentEl.textContent = selectedLabel;
  }
  if (toggleBtn instanceof HTMLButtonElement) {
    toggleBtn.setAttribute("aria-label", selectedLabel || t("files_group_manager_suggest_placeholder"));
    toggleBtn.title = selectedLabel || t("files_group_manager_suggest_placeholder");
  }
}

function createFilesGroupSuggestionDropdown(targetInputId, selectedValue = "") {
  const dropdown = document.createElement("div");
  dropdown.className = "files-admin-requests-filter-dropdown files-group-suggest-dropdown";
  dropdown.setAttribute("data-files-group-suggest-dropdown", "true");
  dropdown.setAttribute("data-files-group-suggest-target", targetInputId);

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "files-admin-requests-filter-trigger files-group-suggest-trigger";
  toggleBtn.setAttribute("data-files-action", "toggle-group-suggest-menu");
  toggleBtn.setAttribute("data-files-group-suggest-toggle", "true");
  toggleBtn.setAttribute("aria-haspopup", "listbox");
  toggleBtn.setAttribute("aria-expanded", "false");

  const current = document.createElement("span");
  current.setAttribute("data-files-group-suggest-current", "true");
  current.textContent = t("files_group_manager_suggest_placeholder");
  toggleBtn.appendChild(current);

  const caret = document.createElement("span");
  caret.className = "files-admin-requests-filter-caret";
  caret.setAttribute("aria-hidden", "true");
  caret.textContent = "▾";
  toggleBtn.appendChild(caret);

  const menu = document.createElement("ul");
  menu.className = "files-admin-requests-filter-menu files-group-suggest-menu";
  menu.setAttribute("data-files-group-suggest-menu", "true");
  menu.setAttribute("role", "listbox");
  menu.hidden = true;

  dropdown.appendChild(toggleBtn);
  dropdown.appendChild(menu);
  syncFilesGroupSuggestDropdown(dropdown, selectedValue);
  return dropdown;
}

function syncFilesGroupSuggestions() {
  const dropdowns = Array.from(document.querySelectorAll("[data-files-group-suggest-dropdown]"));
  for (const node of dropdowns) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    syncFilesGroupSuggestDropdown(node);
  }
}

function getFilesGroupManagerVisibleFileIds() {
  const baseFiles = Array.isArray(state.files.list) ? state.files.list : [];
  const filteredFiles = getFilteredFilesList(baseFiles);
  const ids = [];
  for (const file of filteredFiles) {
    const fileId = String(file?.id || "").trim();
    if (fileId) {
      ids.push(fileId);
    }
  }
  return ids;
}

function getFilesActiveGroupFileIds() {
  const activeGroupKey = String(state.files.activeGroupKey || "").trim();
  if (!activeGroupKey) {
    return [];
  }

  const ids = [];
  const baseFiles = Array.isArray(state.files.list) ? state.files.list : [];
  for (const file of baseFiles) {
    if (getFilesGroupKey(file?.group || "") !== activeGroupKey) {
      continue;
    }
    const fileId = String(file?.id || "").trim();
    if (fileId) {
      ids.push(fileId);
    }
  }
  return ids;
}

function getFilesActiveGroupContext() {
  const activeGroupKey = String(state.files.activeGroupKey || "").trim();
  if (!activeGroupKey) {
    return null;
  }

  const files = [];
  let groupLabel = "";
  const baseFiles = Array.isArray(state.files.list) ? state.files.list : [];
  for (const file of baseFiles) {
    if (getFilesGroupKey(file?.group || "") !== activeGroupKey) {
      continue;
    }
    files.push(file);
    if (!groupLabel) {
      groupLabel = getFilesGroupDisplayLabel(file);
    }
  }

  if (!files.length) {
    return null;
  }

  return {
    key: activeGroupKey,
    label: groupLabel || t("files_group_default"),
    files
  };
}

function resolveFilesGroupManagerFileStatus(file, targetGroup = "") {
  const currentGroup = normalizeFilesGroup(file?.group || "");
  const currentGroupLabel = currentGroup || t("files_group_default");
  const normalizedTarget = normalizeFilesGroup(targetGroup);

  if (!normalizedTarget) {
    return {
      kind: currentGroup ? "other" : "none",
      text: t("files_group_manager_status_current", { group: currentGroupLabel })
    };
  }

  if (getFilesGroupKey(currentGroup) === getFilesGroupKey(normalizedTarget)) {
    return {
      kind: "match",
      text: t("files_group_manager_status_in_target")
    };
  }

  if (currentGroup) {
    return {
      kind: "other",
      text: t("files_group_manager_status_other", { group: currentGroupLabel })
    };
  }

  return {
    kind: "none",
    text: t("files_group_manager_status_none")
  };
}

function clearFilesGroupManagerState({ clearTargetGroup = true } = {}) {
  state.files.groupManager.selectedIds = [];
  state.files.groupManager.busy = false;
  if (clearTargetGroup) {
    state.files.groupManager.targetGroup = "";
  }
}

function clearFilesGroupRenameState({ closeModal = true } = {}) {
  state.files.groupRename.busy = false;
  state.files.groupRename.key = "";
  if (closeModal) {
    state.files.groupRename.open = false;
  }
  state.files.groupRename.label = "";
  state.files.groupRename.value = "";
  state.files.groupRename.message = "";
  state.files.groupRename.messageKind = "";
}

function setFilesGroupRenameFeedback(message = "", kind = "") {
  state.files.groupRename.message = String(message || "");
  state.files.groupRename.messageKind = kind === "success" ? "success" : kind === "error" ? "error" : "";
}

function getFilesGroupEntriesByKey(groupKey) {
  const targetKey = String(groupKey || "").trim();
  if (!targetKey) {
    return [];
  }

  const source = Array.isArray(state.files.list) ? state.files.list : [];
  return source.filter((file) => getFilesGroupKey(file?.group || "") === targetKey);
}

function renderFilesGroupRenameModal() {
  const modalState = state.files.groupRename;
  const isOpen = Boolean(modalState.open);
  const groupLabel = normalizeFilesGroup(modalState.label || "") || t("files_group_default");

  document.body.classList.toggle("is-files-group-rename-open", isOpen);

  if (elements.filesGroupRenameTitle) {
    elements.filesGroupRenameTitle.textContent = t("files_group_rename_modal_title");
  }
  if (elements.filesGroupRenameMessage) {
    elements.filesGroupRenameMessage.textContent = t("files_group_rename_modal_body", { group: groupLabel });
  }
  if (elements.filesGroupRenameLabel) {
    elements.filesGroupRenameLabel.textContent = t("files_group_rename_modal_label");
  }
  if (elements.filesGroupRenameInput) {
    elements.filesGroupRenameInput.placeholder = t("files_group_rename_modal_placeholder");
    if (elements.filesGroupRenameInput.value !== String(modalState.value || "")) {
      elements.filesGroupRenameInput.value = String(modalState.value || "");
    }
    elements.filesGroupRenameInput.disabled = Boolean(modalState.busy);
  }
  if (elements.filesGroupRenameCancelBtn) {
    elements.filesGroupRenameCancelBtn.textContent = t("files_group_rename_modal_cancel");
    elements.filesGroupRenameCancelBtn.disabled = Boolean(modalState.busy);
  }
  if (elements.filesGroupRenameConfirmBtn) {
    elements.filesGroupRenameConfirmBtn.textContent = modalState.busy
      ? t("files_group_rename_modal_confirm_busy")
      : t("files_group_rename_modal_confirm");
    elements.filesGroupRenameConfirmBtn.disabled = Boolean(modalState.busy);
  }
  if (elements.filesGroupRenameFeedback) {
    const message = String(modalState.message || "");
    const hasMessage = Boolean(message);
    elements.filesGroupRenameFeedback.hidden = !hasMessage;
    elements.filesGroupRenameFeedback.textContent = message;
    elements.filesGroupRenameFeedback.classList.toggle("is-error", modalState.messageKind === "error");
    elements.filesGroupRenameFeedback.classList.toggle("is-success", modalState.messageKind === "success");
  }
  if (elements.filesGroupRenameOverlay) {
    elements.filesGroupRenameOverlay.classList.toggle("is-active", isOpen);
    elements.filesGroupRenameOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }
}

function openFilesGroupRenameModal(groupKey, fallbackGroupLabel = "") {
  if (!state.files.me?.isAdmin || state.files.groupRename.busy) {
    return;
  }

  const targetGroupKey = String(groupKey || "").trim();
  if (!targetGroupKey || targetGroupKey === "__ungrouped__") {
    return;
  }

  const filesInGroup = getFilesGroupEntriesByKey(targetGroupKey);
  if (!filesInGroup.length) {
    return;
  }

  const resolvedLabel = normalizeFilesGroup(filesInGroup[0]?.group || "") || normalizeFilesGroup(fallbackGroupLabel || "");
  if (!resolvedLabel) {
    return;
  }

  state.files.groupRename.open = true;
  state.files.groupRename.key = targetGroupKey;
  state.files.groupRename.label = resolvedLabel;
  state.files.groupRename.value = resolvedLabel;
  setFilesGroupRenameFeedback("", "");
  renderFilesGroupRenameModal();

  if (elements.filesGroupRenameInput instanceof HTMLInputElement) {
    focusFilesOpenTarget(elements.filesGroupRenameInput, {
      fallback: elements.filesGroupRenameCancelBtn,
      selectText: true
    });
  }
}

function closeFilesGroupRenameModal({ force = false } = {}) {
  if (state.files.groupRename.busy && !force) {
    return;
  }

  clearFilesGroupRenameState({ closeModal: true });
  renderFilesGroupRenameModal();
}

function isDesktopModalViewport() {
  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(min-width: 1025px)").matches;
  }
  return (Number(window.innerWidth) || 0) >= 1025;
}

function isFilesBotAdminMobileViewport() {
  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(max-width: 860px)").matches;
  }
  return (Number(window.innerWidth) || 0) <= 860;
}

function canUseFilesBotAdmin(profile, { requireDesktop = false } = {}) {
  const me = normalizeFilesProfile(profile);
  const canUseBotAdmin = Boolean(me.loggedIn && hasFilesAuthorizedAccess(me) && me.isAdmin);
  if (!canUseBotAdmin) {
    return false;
  }
  return !requireDesktop || !isFilesBotAdminMobileViewport();
}

function shouldAvoidTextInputFocusOnOpen() {
  if (typeof window.matchMedia === "function") {
    if (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches) {
      return true;
    }
  }
  return !isDesktopModalViewport();
}

function focusFilesOpenTarget(inputTarget, { fallback = null, selectText = false } = {}) {
  const preferredTarget = shouldAvoidTextInputFocusOnOpen() && fallback instanceof HTMLElement
    ? fallback
    : inputTarget instanceof HTMLElement
      ? inputTarget
      : fallback instanceof HTMLElement
        ? fallback
        : null;

  if (!(preferredTarget instanceof HTMLElement)) {
    return;
  }

  try {
    preferredTarget.focus({ preventScroll: true });
  } catch {
    preferredTarget.focus();
  }

  if (preferredTarget === inputTarget && selectText && typeof inputTarget?.select === "function") {
    inputTarget.select();
  }
}

function scheduleFilesListPostMutationRefresh() {
  if (!shouldAvoidTextInputFocusOnOpen() || typeof window.requestAnimationFrame !== "function") {
    return;
  }

  const currentScrollTop = elements.filesList instanceof HTMLElement
    ? elements.filesList.scrollTop
    : 0;

  requestAnimationFrame(() => {
    renderFilesList();
    renderFilesGroupManagerPanel();
    if (elements.filesList instanceof HTMLElement) {
      elements.filesList.scrollTop = currentScrollTop;
      void elements.filesList.offsetHeight;
    }
  });
}

function renderFilesDisclaimerModal() {
  const me = normalizeFilesProfile(state.files.me);
  const canShowDisclaimer = hasFilesAuthorizedAccess(me);
  const isOpen = canShowDisclaimer && Boolean(state.files.disclaimerModal.open);
  state.files.disclaimerModal.open = isOpen;
  document.body.classList.toggle("is-files-disclaimer-open", isOpen);

  if (elements.filesDisclaimerBtn) {
    elements.filesDisclaimerBtn.hidden = !canShowDisclaimer;
    elements.filesDisclaimerBtn.classList.toggle("is-active", isOpen);
    elements.filesDisclaimerBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    elements.filesDisclaimerBtn.setAttribute("aria-label", t("files_disclaimer_button"));
  }
  if (elements.filesDisclaimerOverlay) {
    elements.filesDisclaimerOverlay.classList.toggle("is-active", isOpen);
    elements.filesDisclaimerOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }
}

function openFilesDisclaimerModal() {
  const me = normalizeFilesProfile(state.files.me);
  if (!hasFilesAuthorizedAccess(me)) {
    return;
  }
  state.files.disclaimerModal.open = true;
  renderFilesDisclaimerModal();
}

function closeFilesDisclaimerModal() {
  state.files.disclaimerModal.open = false;
  renderFilesDisclaimerModal();
}

function pruneFilesDescriptionEditors() {
  filesDescriptionEditors = filesDescriptionEditors.filter((editor) => {
    return editor
      && editor.textarea instanceof HTMLTextAreaElement
      && editor.textarea.isConnected;
  });
}

function getFilesDescriptionFormatConfig(formatKey) {
  const normalizedKey = String(formatKey || "").trim().toLowerCase();
  return FILES_DESCRIPTION_FORMATS.find((entry) => entry.key === normalizedKey) || null;
}

function escapeFilesDescriptionRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countFilesDescriptionChar(value, token) {
  return String(value || "").split(token).length - 1;
}

function splitFilesDescriptionLinkCandidate(rawValue) {
  let linkText = String(rawValue || "");
  let suffix = "";

  while (linkText && /[.,!?;:'"»]+$/.test(linkText)) {
    suffix = linkText.slice(-1) + suffix;
    linkText = linkText.slice(0, -1);
  }

  const pairedDelimiters = [
    ["(", ")"],
    ["[", "]"],
    ["{", "}"]
  ];

  for (const [openToken, closeToken] of pairedDelimiters) {
    while (linkText.endsWith(closeToken)) {
      const openCount = countFilesDescriptionChar(linkText, openToken);
      const closeCount = countFilesDescriptionChar(linkText, closeToken);
      if (closeCount <= openCount) {
        break;
      }
      suffix = closeToken + suffix;
      linkText = linkText.slice(0, -1);
    }
  }

  return {
    linkText,
    suffix
  };
}

function normalizeFilesDescriptionLinkHref(value) {
  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return "";
  }

  const href = rawValue.startsWith("www.") ? `https://${rawValue}` : rawValue;

  try {
    const parsed = new URL(href);
    const protocol = String(parsed.protocol || "").toLowerCase();
    if (protocol !== "http:" && protocol !== "https:") {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

function createFilesDescriptionLinkNode(value) {
  const href = normalizeFilesDescriptionLinkHref(value);
  if (!href) {
    return null;
  }

  const link = document.createElement("a");
  link.className = "files-rich-link";
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = String(value || "");
  return link;
}

function appendFilesDescriptionLineContent(parent, value) {
  if (!(parent instanceof Node)) {
    return;
  }

  const line = String(value || "");
  if (!line) {
    return;
  }

  FILES_DESCRIPTION_LINK_PATTERN.lastIndex = 0;
  let cursor = 0;
  let match;

  while ((match = FILES_DESCRIPTION_LINK_PATTERN.exec(line)) !== null) {
    const startIndex = Number(match.index) || 0;
    const rawMatch = String(match[0] || "");
    const endIndex = startIndex + rawMatch.length;

    if (startIndex > cursor) {
      parent.appendChild(document.createTextNode(line.slice(cursor, startIndex)));
    }

    const { linkText, suffix } = splitFilesDescriptionLinkCandidate(rawMatch);
    const linkNode = createFilesDescriptionLinkNode(linkText);
    if (linkNode) {
      parent.appendChild(linkNode);
      if (suffix) {
        parent.appendChild(document.createTextNode(suffix));
      }
    } else {
      parent.appendChild(document.createTextNode(rawMatch));
    }

    cursor = endIndex;
  }

  if (cursor < line.length) {
    parent.appendChild(document.createTextNode(line.slice(cursor)));
  }
}

function appendFilesDescriptionPlainText(parent, value) {
  if (!(parent instanceof Node)) {
    return;
  }

  const text = String(value || "");
  if (!text) {
    return;
  }

  const lines = text.split("\n");
  lines.forEach((line, index) => {
    if (index > 0) {
      parent.appendChild(document.createElement("br"));
    }
    if (line) {
      appendFilesDescriptionLineContent(parent, line);
    }
  });
}

function appendFilesDescriptionFormattedNodes(parent, value) {
  if (!(parent instanceof Node)) {
    return;
  }

  const source = String(value || "");
  if (!source) {
    return;
  }

  let cursor = 0;
  while (cursor < source.length) {
    let matchedFormat = null;

    for (const format of FILES_DESCRIPTION_FORMATS) {
      const openIndex = source.indexOf(format.open, cursor);
      if (openIndex === -1) {
        continue;
      }
      const closeIndex = source.indexOf(format.close, openIndex + format.open.length);
      if (closeIndex === -1) {
        continue;
      }

      if (!matchedFormat || openIndex < matchedFormat.openIndex) {
        matchedFormat = { format, openIndex, closeIndex };
        continue;
      }

      if (openIndex === matchedFormat.openIndex && format.open.length > matchedFormat.format.open.length) {
        matchedFormat = { format, openIndex, closeIndex };
      }
    }

    if (!matchedFormat) {
      appendFilesDescriptionPlainText(parent, source.slice(cursor));
      break;
    }

    appendFilesDescriptionPlainText(parent, source.slice(cursor, matchedFormat.openIndex));
    const content = source.slice(
      matchedFormat.openIndex + matchedFormat.format.open.length,
      matchedFormat.closeIndex
    );

    if (!content) {
      appendFilesDescriptionPlainText(parent, `${matchedFormat.format.open}${matchedFormat.format.close}`);
    } else {
      const node = document.createElement(matchedFormat.format.tagName);
      node.className = matchedFormat.format.className;
      appendFilesDescriptionFormattedNodes(node, content);
      parent.appendChild(node);
    }

    cursor = matchedFormat.closeIndex + matchedFormat.format.close.length;
  }
}

function buildFilesDescriptionContentFragment(value, { emptyText = "" } = {}) {
  const fragment = document.createDocumentFragment();
  const normalizedValue = String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (!normalizedValue) {
    if (emptyText) {
      const empty = document.createElement("span");
      empty.className = "files-rich-empty";
      empty.textContent = emptyText;
      fragment.appendChild(empty);
    }
    return fragment;
  }

  const paragraphs = normalizedValue.split(/\n{2,}/).filter((entry) => entry.trim());
  paragraphs.forEach((paragraph) => {
    const paragraphEl = document.createElement("p");
    paragraphEl.className = "files-rich-paragraph";
    appendFilesDescriptionFormattedNodes(paragraphEl, paragraph);
    fragment.appendChild(paragraphEl);
  });

  return fragment;
}

function renderFilesDescriptionContent(container, value, { emptyText = "" } = {}) {
  if (!(container instanceof HTMLElement)) {
    return;
  }

  const hasValue = Boolean(String(value || "").trim());
  container.textContent = "";
  container.classList.toggle("is-empty", !hasValue);
  container.appendChild(buildFilesDescriptionContentFragment(value, { emptyText }));
}

function extractFilesDescriptionPlainText(value) {
  let plainText = String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  FILES_DESCRIPTION_FORMATS.forEach((format) => {
    const openPattern = new RegExp(escapeFilesDescriptionRegex(format.open), "g");
    const closePattern = new RegExp(escapeFilesDescriptionRegex(format.close), "g");
    plainText = plainText.replace(openPattern, "").replace(closePattern, "");
  });

  return plainText
    .replace(/\s+/g, " ")
    .trim();
}

function updateFilesDescriptionEditorPreview(editor) {
  if (!editor || !(editor.preview instanceof HTMLElement)) {
    return;
  }

  renderFilesDescriptionContent(editor.preview, editor.textarea?.value || "", {
    emptyText: t("files_description_preview_empty")
  });
}

function refreshFilesDescriptionEditors() {
  pruneFilesDescriptionEditors();
  filesDescriptionEditors.forEach((editor) => {
    if (!(editor?.toolbar instanceof HTMLElement)) {
      return;
    }

    editor.toolbar.setAttribute("aria-label", t("files_description_toolbar_label"));
    if (editor.toolbarLabel instanceof HTMLElement) {
      editor.toolbarLabel.textContent = t("files_description_toolbar_label");
    }
    if (editor.hint instanceof HTMLElement) {
      editor.hint.textContent = t("files_description_format_hint");
    }
    if (editor.previewLabel instanceof HTMLElement) {
      editor.previewLabel.textContent = t("files_description_preview_label");
    }

    editor.buttons.forEach((entry) => {
      if (!(entry?.button instanceof HTMLButtonElement)) {
        return;
      }
      const title = t(entry.titleKey);
      entry.button.removeAttribute("title");
      entry.button.setAttribute("aria-label", title);
    });

    updateFilesDescriptionEditorPreview(editor);
  });
}

function applyFilesDescriptionFormat(textarea, formatKey) {
  if (!(textarea instanceof HTMLTextAreaElement) || textarea.disabled || textarea.readOnly) {
    return;
  }

  const format = getFilesDescriptionFormatConfig(formatKey);
  if (!format) {
    return;
  }

  const value = String(textarea.value || "");
  const selectionStart = Number.isInteger(textarea.selectionStart) ? textarea.selectionStart : value.length;
  const selectionEnd = Number.isInteger(textarea.selectionEnd) ? textarea.selectionEnd : selectionStart;
  const before = value.slice(0, selectionStart);
  const selected = value.slice(selectionStart, selectionEnd);
  const after = value.slice(selectionEnd);
  const nextValue = `${before}${format.open}${selected}${format.close}${after}`;
  const maxLength = Number(textarea.maxLength) || 0;

  if (maxLength > 0 && nextValue.length > maxLength) {
    return;
  }

  textarea.value = nextValue;
  textarea.focus();

  const cursorStart = selectionStart + format.open.length;
  const cursorEnd = cursorStart + selected.length;
  textarea.setSelectionRange(cursorStart, cursorEnd);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function mountFilesDescriptionEditor(textarea) {
  if (!(textarea instanceof HTMLTextAreaElement)) {
    return null;
  }

  pruneFilesDescriptionEditors();
  const existing = filesDescriptionEditors.find((entry) => entry.textarea === textarea);
  if (existing) {
    return existing;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "files-description-editor";

  const toolbarHead = document.createElement("div");
  toolbarHead.className = "files-description-toolbar-head";

  const toolbarLabel = document.createElement("p");
  toolbarLabel.className = "files-description-toolbar-label";
  toolbarHead.appendChild(toolbarLabel);

  const hint = document.createElement("p");
  hint.className = "files-description-toolbar-hint";
  toolbarHead.appendChild(hint);

  wrapper.appendChild(toolbarHead);

  const toolbar = document.createElement("div");
  toolbar.className = "files-description-toolbar";
  toolbar.setAttribute("role", "toolbar");
  wrapper.appendChild(toolbar);

  const buttons = FILES_DESCRIPTION_EDITOR_BUTTONS.map((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "files-description-toolbar-btn";
    button.textContent = entry.label;
    button.setAttribute("data-files-description-format", entry.format);
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });
    button.addEventListener("click", () => {
      applyFilesDescriptionFormat(textarea, entry.format);
    });
    toolbar.appendChild(button);
    return {
      button,
      titleKey: entry.titleKey
    };
  });

  const currentParent = textarea.parentNode;
  if (currentParent) {
    currentParent.insertBefore(wrapper, textarea);
  }
  wrapper.appendChild(textarea);

  const previewWrap = document.createElement("div");
  previewWrap.className = "files-description-preview";

  const previewLabel = document.createElement("p");
  previewLabel.className = "files-description-preview-label";
  previewWrap.appendChild(previewLabel);

  const preview = document.createElement("div");
  preview.className = "files-description-preview-body files-description-value";
  previewWrap.appendChild(preview);

  wrapper.appendChild(previewWrap);

  const editor = {
    textarea,
    toolbar,
    toolbarLabel,
    hint,
    previewLabel,
    preview,
    buttons
  };

  textarea.addEventListener("input", () => {
    updateFilesDescriptionEditorPreview(editor);
  });

  filesDescriptionEditors.push(editor);
  refreshFilesDescriptionEditors();
  return editor;
}

function normalizeFilesBooleanFlag(value) {
  if (value === true || value === 1) {
    return true;
  }
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function normalizeFilesEntry(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const id = String(payload.id || "").trim();
  if (!id) {
    return null;
  }

  const versions = Array.isArray(payload.versions)
    ? payload.versions
      .filter((version) => version && typeof version === "object")
      .map((version) => ({
        id: String(version.id || version.versionId || version.fileId || "").trim(),
        versionId: String(version.versionId || version.id || "").trim(),
        downloadId: String(version.downloadId || version.fileId || version.id || version.versionId || "").trim(),
        label: String(version.label || version.version || "").trim(),
        name: String(version.name || version.fileName || version.displayName || "").trim(),
        displayName: String(version.displayName || "").trim(),
        fileName: String(version.fileName || "").trim(),
        mimeType: String(version.mimeType || version.type || "").trim(),
        size: Math.max(0, Number(version.size) || 0),
        uploadedAt: String(version.uploadedAt || version.uploaded_at || version.createdAt || version.created_at || "").trim(),
        createdAt: String(version.createdAt || version.created_at || "").trim(),
        current: normalizeFilesBooleanFlag(version.current ?? version.isCurrent)
      }))
    : [];

  return {
    id,
    name: String(payload.name || payload.originalName || "").trim(),
    displayName: String(payload.displayName || "").trim(),
    mimeType: String(payload.mimeType || payload.type || "").trim(),
    size: Math.max(0, Number(payload.size) || 0),
    downloadCount: Math.max(0, Number(payload.downloadCount || payload.download_count) || 0),
    outdated: normalizeFilesBooleanFlag(payload.outdated ?? payload.isOutdated),
    untested: normalizeFilesBooleanFlag(payload.untested ?? payload.isUntested),
    caution: normalizeFilesBooleanFlag(payload.caution ?? payload.hasCaution),
    uploadedAt: String(payload.uploadedAt || payload.uploaded_at || "").trim(),
    updatedAt: String(payload.updatedAt || payload.updated_at || payload.uploadedAt || "").trim(),
    contentUpdatedAt: String(
      payload.contentUpdatedAt || payload.content_updated_at || payload.uploadedAt || payload.uploaded_at || ""
    ).trim(),
    description: String(payload.description || ""),
    descriptionPlain: extractFilesDescriptionPlainText(payload.description || ""),
    functions: String(payload.functions || ""),
    group: normalizeFilesGroup(payload.group),
    uploader: String(payload.uploader || payload.uploaderDiscordId || "").trim(),
    imageUrl: String(payload.imageUrl || "").trim(),
    imageName: String(payload.imageName || "").trim(),
    hasImage: Boolean(payload.hasImage || payload.imageUrl),
    versions
  };
}

function mergeFilesListEntry(fileId, patch = {}) {
  const normalizedFileId = String(fileId || "").trim();
  if (!normalizedFileId || !patch || typeof patch !== "object") {
    return;
  }

  state.files.list = (Array.isArray(state.files.list) ? state.files.list : []).map((file) => {
    if (String(file?.id || "").trim() !== normalizedFileId) {
      return file;
    }
    return {
      ...file,
      ...patch,
      id: file.id
    };
  });
}

function setFilesUploadFeedback(message = "", kind = "") {
  if (filesUploadFeedbackTimer) {
    clearTimeout(filesUploadFeedbackTimer);
    filesUploadFeedbackTimer = null;
  }

  state.files.uploadMessage = String(message || "");
  state.files.uploadMessageKind = kind === "success" ? "success" : kind === "error" ? "error" : "";

  if (!state.files.uploadMessage) {
    return;
  }

  filesUploadFeedbackTimer = setTimeout(() => {
    filesUploadFeedbackTimer = null;
    state.files.uploadMessage = "";
    state.files.uploadMessageKind = "";
    if (state.view === "files" && document.body.classList.contains("is-files")) {
      renderFilesAccessView();
    }
  }, FILES_UPLOAD_FEEDBACK_AUTO_HIDE_MS);
}

function clearFilesEditModalState() {
  if (filesEditModalFeedbackTimer) {
    clearTimeout(filesEditModalFeedbackTimer);
    filesEditModalFeedbackTimer = null;
  }
  state.files.editModal.fileId = "";
  state.files.editModal.message = "";
  state.files.editModal.messageKind = "";
  state.files.editModal.busy = false;
}

function setFilesEditModalFeedback(message = "", kind = "") {
  if (filesEditModalFeedbackTimer) {
    clearTimeout(filesEditModalFeedbackTimer);
    filesEditModalFeedbackTimer = null;
  }

  state.files.editModal.message = String(message || "");
  state.files.editModal.messageKind = kind === "success" ? "success" : kind === "error" ? "error" : "";

  if (!state.files.editModal.message) {
    return;
  }

  filesEditModalFeedbackTimer = setTimeout(() => {
    filesEditModalFeedbackTimer = null;
    state.files.editModal.message = "";
    state.files.editModal.messageKind = "";
    renderFilesEditModal();
  }, 4500);
}

function setFilesRestrictedRequestFeedback(message = "", kind = "") {
  state.files.accessRequestMessage = String(message || "");
  state.files.accessRequestMessageKind = kind === "success" ? "success" : kind === "error" ? "error" : "";
}

function setFilesAdminRequestsFeedback(message = "", kind = "") {
  if (filesAdminRequestsFeedbackTimer) {
    clearTimeout(filesAdminRequestsFeedbackTimer);
    filesAdminRequestsFeedbackTimer = null;
  }

  state.files.adminRequests.message = String(message || "");
  state.files.adminRequests.messageKind = kind === "success" ? "success" : kind === "error" ? "error" : "";

  if (!state.files.adminRequests.message) {
    return;
  }

  filesAdminRequestsFeedbackTimer = setTimeout(() => {
    filesAdminRequestsFeedbackTimer = null;
    state.files.adminRequests.message = "";
    state.files.adminRequests.messageKind = "";
    if (state.view === "files" && document.body.classList.contains("is-files")) {
      renderFilesAccessView();
    }
  }, FILES_ADMIN_REQUESTS_FEEDBACK_AUTO_HIDE_MS);
}

function normalizeFilesAdminRequestsFilter(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (
    normalized === "pending"
    || normalized === "approved"
    || normalized === "declined"
    || normalized === "authorized"
    || normalized === "all"
  ) {
    return normalized;
  }
  return "pending";
}

function getFilesAdminRequestsFilterLabel(filter) {
  const resolvedFilter = normalizeFilesAdminRequestsFilter(filter);
  if (resolvedFilter === "approved") {
    return t("files_admin_requests_filter_approved");
  }
  if (resolvedFilter === "declined") {
    return t("files_admin_requests_filter_declined");
  }
  if (resolvedFilter === "authorized") {
    return t("files_admin_requests_filter_authorized");
  }
  if (resolvedFilter === "all") {
    return t("files_admin_requests_filter_all");
  }
  return t("files_admin_requests_filter_pending");
}

function setFilesAdminRequestsFilterMenuOpen(active) {
  if (!elements.filesAdminRequestsFilterDropdown || !elements.filesAdminRequestsFilterBtn || !elements.filesAdminRequestsFilterMenu) {
    return;
  }

  const shouldOpen = Boolean(active);
  elements.filesAdminRequestsFilterDropdown.classList.toggle("is-open", shouldOpen);
  elements.filesAdminRequestsFilterBtn.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
  elements.filesAdminRequestsFilterMenu.hidden = !shouldOpen;
}

function syncFilesAdminRequestsFilterMenu() {
  const resolvedFilter = normalizeFilesAdminRequestsFilter(state.files.adminRequests.filter);
  state.files.adminRequests.filter = resolvedFilter;

  if (elements.filesAdminRequestsFilter) {
    elements.filesAdminRequestsFilter.value = resolvedFilter;
  }
  if (elements.filesAdminRequestsFilterCurrent) {
    elements.filesAdminRequestsFilterCurrent.textContent = getFilesAdminRequestsFilterLabel(resolvedFilter);
  }
  if (elements.filesAdminRequestsStateBadge) {
    elements.filesAdminRequestsStateBadge.textContent = getFilesAdminRequestsFilterLabel(resolvedFilter);
    elements.filesAdminRequestsStateBadge.dataset.filter = resolvedFilter;
  }
  if (!Array.isArray(elements.filesAdminRequestsFilterOptions)) {
    return;
  }

  elements.filesAdminRequestsFilterOptions.forEach((option) => {
    const selected = normalizeFilesAdminRequestsFilter(option.dataset.filter || "") === resolvedFilter;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-selected", selected ? "true" : "false");
  });
}

function setFilesAdminRequestsFilterValue(nextFilter, { render = true, closeMenu = true } = {}) {
  state.files.adminRequests.filter = normalizeFilesAdminRequestsFilter(nextFilter);
  syncFilesAdminRequestsFilterMenu();
  if (closeMenu) {
    setFilesAdminRequestsFilterMenuOpen(false);
  }
  if (render) {
    renderFilesAdminRequestsPanel();
  }
}

function normalizeFilesAdminRequestSource(source) {
  const normalized = String(source || "").trim().toLowerCase();
  if (normalized === "allowlist") {
    return "allowlist";
  }
  return "request";
}

function normalizeFilesAdminRequestEntry(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const discordId = String(payload.discordId || "").trim();
  const requestId = String(payload.requestId || "").trim();
  if (!discordId) {
    return null;
  }

  return {
    requestId,
    discordId,
    nick: String(payload.nick || "").trim(),
    username: String(payload.username || "").trim(),
    email: String(payload.email || "").trim(),
    reason: String(payload.reason || "").trim(),
    declineReason: String(payload.declineReason || "").trim(),
    status: normalizeFilesAccessRequestStatus(payload.status),
    requestedAt: String(payload.requestedAt || "").trim(),
    decidedAt: String(payload.decidedAt || "").trim(),
    source: normalizeFilesAdminRequestSource(payload.source),
    canApprove: Boolean(payload.canApprove),
    canDecline: Boolean(payload.canDecline),
    canUnauthorize: Boolean(payload.canUnauthorize),
    canAllowReapply: Boolean(payload.canAllowReapply)
  };
}

function openFilesAdminRequestsDeclineComposer(requestId, { focus = true } = {}) {
  const normalizedRequestId = String(requestId || "").trim();
  if (!normalizedRequestId) {
    return;
  }

  const alreadyOpen = state.files.adminRequests.declineComposerRequestId === normalizedRequestId;
  state.files.adminRequests.declineComposerRequestId = alreadyOpen ? "" : normalizedRequestId;
  if (alreadyOpen) {
    state.files.adminRequests.declineComposerValue = "";
    renderFilesAccessView();
    return;
  }

  state.files.adminRequests.declineComposerValue = "";
  renderFilesAccessView();
  if (!focus || !elements.filesAdminRequestsList) {
    return;
  }

  requestAnimationFrame(() => {
    const textareaList = elements.filesAdminRequestsList.querySelectorAll("textarea[data-files-admin-decline-input=\"true\"]");
    const targetTextarea = Array.from(textareaList).find((node) => {
      return String(node.getAttribute("data-request-id") || "").trim() === normalizedRequestId;
    });
    if (targetTextarea instanceof HTMLTextAreaElement) {
      targetTextarea.focus();
      targetTextarea.selectionStart = targetTextarea.value.length;
      targetTextarea.selectionEnd = targetTextarea.value.length;
    }
  });
}

function closeFilesAdminRequestsDeclineComposer({ render = true } = {}) {
  state.files.adminRequests.declineComposerRequestId = "";
  state.files.adminRequests.declineComposerValue = "";
  if (render) {
    renderFilesAccessView();
  }
}

function clearFilesAdminRequestsState() {
  if (filesAdminRequestsFeedbackTimer) {
    clearTimeout(filesAdminRequestsFeedbackTimer);
    filesAdminRequestsFeedbackTimer = null;
  }
  state.files.adminRequests.loading = false;
  state.files.adminRequests.list = [];
  state.files.adminRequests.declineComposerRequestId = "";
  state.files.adminRequests.declineComposerValue = "";
  state.files.adminRequests.busyActionKey = "";
  state.files.adminRequests.message = "";
  state.files.adminRequests.messageKind = "";
}

function setFilesPublicSharesFeedback(message = "", kind = "") {
  if (filesPublicSharesFeedbackTimer) {
    clearTimeout(filesPublicSharesFeedbackTimer);
    filesPublicSharesFeedbackTimer = null;
  }

  state.files.publicShares.message = String(message || "");
  state.files.publicShares.messageKind = kind === "success" ? "success" : kind === "error" ? "error" : "";

  if (!state.files.publicShares.message) {
    return;
  }

  filesPublicSharesFeedbackTimer = setTimeout(() => {
    filesPublicSharesFeedbackTimer = null;
    state.files.publicShares.message = "";
    state.files.publicShares.messageKind = "";
    if (state.view === "files" && document.body.classList.contains("is-files")) {
      renderFilesAccessView();
    }
  }, FILES_ADMIN_REQUESTS_FEEDBACK_AUTO_HIDE_MS);
}

function normalizeFilesPublicShareEntry(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const id = String(payload.id || "").trim().toLowerCase();
  const shareUrl = String(payload.shareUrl || "").trim();
  if (!id || !shareUrl) {
    return null;
  }

  return {
    id,
    fileId: String(payload.fileId || "").trim().toLowerCase(),
    name: String(payload.name || "").trim(),
    displayName: String(payload.displayName || payload.name || t("files_unknown_value")).trim(),
    mimeType: String(payload.mimeType || "application/octet-stream").trim(),
    size: Math.max(0, Number(payload.size) || 0),
    sizeLabel: String(payload.sizeLabel || "").trim(),
    code: /^\d{4}$/.test(String(payload.code || "").trim()) ? String(payload.code || "").trim() : "",
    createdAt: String(payload.createdAt || "").trim(),
    failedCodeAttempts: Math.max(0, Number(payload.failedCodeAttempts) || 0),
    remainingCodeAttempts: Math.max(0, Number(payload.remainingCodeAttempts) || 0),
    createdBy: String(payload.createdBy || "").trim(),
    createdByDiscordId: String(payload.createdByDiscordId || "").trim(),
    sharePath: String(payload.sharePath || "").trim(),
    shareUrl
  };
}

function normalizeFilesPublicSharesMode(value) {
  return String(value || "").trim().toLowerCase() === "admin" ? "admin" : "mine";
}

function getFilesPublicSharesCurrentList() {
  const mode = normalizeFilesPublicSharesMode(state.files.publicShares.mode);
  if (mode === "admin") {
    return Array.isArray(state.files.publicShares.adminList) ? state.files.publicShares.adminList : [];
  }
  return Array.isArray(state.files.publicShares.list) ? state.files.publicShares.list : [];
}

function getFilesPublicSharesActiveCount() {
  return Array.isArray(state.files.publicShares.list) ? state.files.publicShares.list.length : 0;
}

function clearFilesPublicSharesState() {
  if (filesPublicSharesFeedbackTimer) {
    clearTimeout(filesPublicSharesFeedbackTimer);
    filesPublicSharesFeedbackTimer = null;
  }
  state.files.publicShares.loading = false;
  state.files.publicShares.list = [];
  state.files.publicShares.adminList = [];
  state.files.publicShares.maxActive = 3;
  state.files.publicShares.mode = "mine";
  state.files.publicShares.message = "";
  state.files.publicShares.messageKind = "";
  state.files.publicShares.busyActionKey = "";
}

function normalizeFilesAdminModalType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (
    normalized === "upload"
    || normalized === "edit"
    || normalized === "requests"
    || normalized === "publicshares"
    || normalized === "public-shares"
    || normalized === "bot"
  ) {
    if (normalized === "publicshares" || normalized === "public-shares") {
      return "publicShares";
    }
    return normalized;
  }
  return "";
}

function getFilesPendingAdminRequestCount() {
  const entries = Array.isArray(state.files.adminRequests.list) ? state.files.adminRequests.list : [];
  let pendingCount = 0;
  for (const entry of entries) {
    if (normalizeFilesAccessRequestStatus(entry?.status) === "pending") {
      pendingCount += 1;
    }
  }
  return pendingCount;
}

function renderFilesEditModal({ force = false } = {}) {
  if (!elements.filesEditPanel) {
    return;
  }

  const me = normalizeFilesProfile(state.files.me);
  const canUseAdminTools = Boolean(me.isAuthorized && me.isAdmin);
  const editOpen = canUseAdminTools && normalizeFilesAdminModalType(state.files.adminModal.active) === "edit";
  const fileId = String(state.files.editModal.fileId || "").trim();
  const matchedFile = editOpen
    ? state.files.list.find((entry) => String(entry?.id || "").trim() === fileId) || null
    : null;

  if (editOpen && !matchedFile) {
    state.files.adminModal.active = "";
    clearFilesEditModalState();
  }

  const shouldShow = editOpen && Boolean(matchedFile);
  elements.filesEditPanel.hidden = !shouldShow;

  if (!shouldShow || !matchedFile) {
    if (elements.filesEditModalBody) {
      elements.filesEditModalBody.replaceChildren();
    }
    if (elements.filesEditFeedback) {
      elements.filesEditFeedback.hidden = true;
      elements.filesEditFeedback.textContent = "";
      elements.filesEditFeedback.classList.remove("is-error", "is-success");
    }
    delete elements.filesEditPanel.dataset.renderKey;
    return;
  }

  const focusField = String(state.files.editModal.focusField || "description");
  const isFunctionsMode = focusField === "functions";

  if (elements.filesEditTitle) {
    elements.filesEditTitle.textContent = isFunctionsMode
      ? t("files_edit_modal_functions_title")
      : t("files_edit_modal_title");
  }
  if (elements.filesEditHint) {
    elements.filesEditHint.textContent = isFunctionsMode
      ? t("files_edit_modal_functions_hint")
      : t("files_edit_modal_hint");
  }
  if (elements.filesEditTargetName) {
    elements.filesEditTargetName.textContent = getFilesDisplayName(matchedFile);
  }
  if (
    elements.filesEditPanel instanceof HTMLElement
    && elements.filesEditFeedback instanceof HTMLElement
    && elements.filesEditFeedback.parentElement !== elements.filesEditPanel
  ) {
    elements.filesEditPanel.appendChild(elements.filesEditFeedback);
  }
  const renderKey = [state.lang, focusField, buildFilesDetailRenderKey(matchedFile, { isAdmin: true })].join("|");
  const currentForm = elements.filesEditModalBody?.querySelector("[data-files-edit-modal-form]") || null;
  const needsRender = force || !(currentForm instanceof HTMLFormElement) || elements.filesEditPanel.dataset.renderKey !== renderKey;

  if (needsRender && elements.filesEditModalBody) {
    const nextForm = createFilesAdminEditForm(matchedFile, { focusField });
    elements.filesEditModalBody.replaceChildren();
    if (nextForm) {
      elements.filesEditModalBody.appendChild(nextForm);
      const descriptionInput = nextForm.querySelector("textarea[name=\"description\"]");
      if (descriptionInput instanceof HTMLTextAreaElement) {
        mountFilesDescriptionEditor(descriptionInput);
      }
    }
    elements.filesEditPanel.dataset.renderKey = renderKey;
  }

  const form = elements.filesEditModalBody?.querySelector("[data-files-edit-modal-form]") || null;
  if (form instanceof HTMLFormElement) {
    const editGrid = form.querySelector(".files-edit-grid, .files-edit-grid-single");
    if (
      elements.filesEditFeedback instanceof HTMLElement
      && editGrid instanceof HTMLElement
      && elements.filesEditFeedback.parentElement !== editGrid
    ) {
      editGrid.appendChild(elements.filesEditFeedback);
    }
    setFilesEditFormBusy(form, Boolean(state.files.editModal.busy));
  }

  if (elements.filesEditFeedback) {
    elements.filesEditFeedback.classList.remove("is-error", "is-success");
    if (state.files.editModal.messageKind === "error") {
      elements.filesEditFeedback.classList.add("is-error");
    } else if (state.files.editModal.messageKind === "success") {
      elements.filesEditFeedback.classList.add("is-success");
    }

    const hasMessage = Boolean(state.files.editModal.message);
    elements.filesEditFeedback.hidden = !hasMessage;
    elements.filesEditFeedback.textContent = hasMessage ? state.files.editModal.message : "";
  }
}

function renderFilesAdminModals() {
  const me = normalizeFilesProfile(state.files.me);
  const canUseAdminTools = Boolean(me.isAuthorized && me.isAdmin);
  const canUsePublicShares = Boolean(me.isAuthorized);
  const canUseBotAdmin = canUseFilesBotAdmin(me, { requireDesktop: true });
  let activeModal = normalizeFilesAdminModalType(state.files.adminModal.active);
  if ((activeModal === "upload" || activeModal === "edit" || activeModal === "requests") && !canUseAdminTools) {
    activeModal = "";
  }
  if (activeModal === "publicShares" && !canUsePublicShares) {
    activeModal = "";
  }
  if (activeModal === "publicShares" && normalizeFilesPublicSharesMode(state.files.publicShares.mode) === "admin" && !canUseAdminTools) {
    activeModal = "";
  }
  if (activeModal === "bot" && !canUseBotAdmin) {
    activeModal = "";
  }
  state.files.adminModal.active = activeModal;

  const uploadOpen = activeModal === "upload";
  const editOpen = activeModal === "edit";
  const requestsOpen = activeModal === "requests";
  const publicSharesOpen = activeModal === "publicShares";
  const publicSharesMode = normalizeFilesPublicSharesMode(state.files.publicShares.mode);
  const botOpen = canUseBotAdmin && activeModal === "bot";
  const modalOpen = uploadOpen || editOpen || requestsOpen || publicSharesOpen || botOpen;
  const pendingCount = getFilesPendingAdminRequestCount();
  const pendingBadgeText = pendingCount > 99 ? "99+" : String(pendingCount);
  const publicSharesCount = getFilesPublicSharesActiveCount();
  const publicSharesBadgeText = publicSharesCount > 99 ? "99+" : String(publicSharesCount);
  if (!botOpen) {
    state.files.botAdmin.diagnosticsOpen = false;
    state.files.botAdmin.selectedGuildId = "";
  }

  document.body.classList.toggle("is-files-admin-modal-open", modalOpen);
  document.body.classList.toggle("is-files-bot-admin-modal-open", botOpen);

  if (elements.filesAdminToolsPanel) {
    elements.filesAdminToolsPanel.hidden = !canUseAdminTools;
  }
  if (elements.filesPublicSharesToolsPanel) {
    elements.filesPublicSharesToolsPanel.hidden = !canUsePublicShares;
  }
  if (elements.filesAdminConsoleModalBtn) {
    elements.filesAdminConsoleModalBtn.classList.toggle("is-active", uploadOpen);
    elements.filesAdminConsoleModalBtn.setAttribute("aria-expanded", uploadOpen ? "true" : "false");
  }
  if (elements.filesAccessControlModalBtn) {
    elements.filesAccessControlModalBtn.classList.toggle("is-active", requestsOpen);
    elements.filesAccessControlModalBtn.setAttribute("aria-expanded", requestsOpen ? "true" : "false");
    const showBadge = canUseAdminTools && pendingCount > 0;
    elements.filesAccessControlModalBtn.classList.toggle("has-pending-badge", showBadge);
    const baseLabel = t("files_admin_requests_title");
    const fullLabel = pendingCount > 0
      ? `${baseLabel}. ${t("files_admin_requests_pending_badge", { n: pendingCount })}`
      : baseLabel;
    elements.filesAccessControlModalBtn.setAttribute("aria-label", fullLabel);
  }
  if (elements.filesAccessControlPendingBadge) {
    const showBadge = canUseAdminTools && pendingCount > 0;
    elements.filesAccessControlPendingBadge.hidden = !showBadge;
    elements.filesAccessControlPendingBadge.textContent = showBadge ? pendingBadgeText : "0";
    const badgeLabel = t("files_admin_requests_pending_badge", { n: pendingCount });
    elements.filesAccessControlPendingBadge.setAttribute("aria-label", badgeLabel);
    elements.filesAccessControlPendingBadge.title = badgeLabel;
  }
  if (elements.filesPublicSharesModalBtn) {
    const publicSharesMineOpen = publicSharesOpen && publicSharesMode === "mine";
    elements.filesPublicSharesModalBtn.classList.toggle("is-active", publicSharesMineOpen);
    elements.filesPublicSharesModalBtn.setAttribute("aria-expanded", publicSharesMineOpen ? "true" : "false");
    const showBadge = canUsePublicShares && publicSharesCount > 0;
    elements.filesPublicSharesModalBtn.classList.toggle("has-pending-badge", showBadge);
    const baseLabel = t("files_public_shares_title");
    const fullLabel = publicSharesCount > 0
      ? `${baseLabel}. ${t("files_public_shares_active_count", {
        count: publicSharesCount,
        max: state.files.publicShares.maxActive || 3
      })}`
      : baseLabel;
    elements.filesPublicSharesModalBtn.setAttribute("aria-label", fullLabel);
  }
  if (elements.filesPublicSharesCountBadge) {
    const showBadge = canUsePublicShares && publicSharesCount > 0;
    elements.filesPublicSharesCountBadge.hidden = !showBadge;
    elements.filesPublicSharesCountBadge.textContent = showBadge ? publicSharesBadgeText : "0";
    const badgeLabel = t("files_public_shares_active_count", {
      count: publicSharesCount,
      max: state.files.publicShares.maxActive || 3
    });
    elements.filesPublicSharesCountBadge.setAttribute("aria-label", badgeLabel);
    elements.filesPublicSharesCountBadge.title = badgeLabel;
  }
  if (elements.filesAdminPublicSharesModalBtn) {
    const publicSharesAdminOpen = publicSharesOpen && publicSharesMode === "admin";
    elements.filesAdminPublicSharesModalBtn.classList.toggle("is-active", publicSharesAdminOpen);
    elements.filesAdminPublicSharesModalBtn.setAttribute("aria-expanded", publicSharesAdminOpen ? "true" : "false");
    elements.filesAdminPublicSharesModalBtn.setAttribute("aria-label", t("files_admin_public_shares_title"));
  }
  if (elements.filesBotAdminModalBtn) {
    elements.filesBotAdminModalBtn.classList.toggle("is-active", botOpen);
    elements.filesBotAdminModalBtn.setAttribute("aria-expanded", botOpen ? "true" : "false");
  }
  if (elements.filesBotAdminFloatingBtn) {
    elements.filesBotAdminFloatingBtn.classList.toggle("is-active", botOpen);
    elements.filesBotAdminFloatingBtn.setAttribute("aria-expanded", botOpen ? "true" : "false");
  }
  if (elements.filesUploadOverlay) {
    elements.filesUploadOverlay.classList.toggle("is-active", uploadOpen);
    elements.filesUploadOverlay.setAttribute("aria-hidden", uploadOpen ? "false" : "true");
  }
  if (elements.filesEditOverlay) {
    elements.filesEditOverlay.classList.toggle("is-active", editOpen);
    elements.filesEditOverlay.setAttribute("aria-hidden", editOpen ? "false" : "true");
  }
  if (elements.filesAdminRequestsOverlay) {
    elements.filesAdminRequestsOverlay.classList.toggle("is-active", requestsOpen);
    elements.filesAdminRequestsOverlay.setAttribute("aria-hidden", requestsOpen ? "false" : "true");
  }
  if (elements.filesPublicSharesOverlay) {
    elements.filesPublicSharesOverlay.classList.toggle("is-active", publicSharesOpen);
    elements.filesPublicSharesOverlay.setAttribute("aria-hidden", publicSharesOpen ? "false" : "true");
  }
  if (elements.filesBotAdminOverlay) {
    elements.filesBotAdminOverlay.classList.toggle("is-active", botOpen);
    elements.filesBotAdminOverlay.setAttribute("aria-hidden", botOpen ? "false" : "true");
  }
  if (!requestsOpen) {
    setFilesAdminRequestsFilterMenuOpen(false);
  }
  if (!botOpen) {
    setFilesBotAdminSortMenuOpen(false);
  }
  if (!uploadOpen && !editOpen) {
    closeAllFilesGroupSuggestMenus();
  }
  if (!editOpen) {
    clearFilesEditModalState();
  }
  renderFilesEditModal();
  renderFilesPublicSharesPanel();
  renderFilesBotAdminDiagnosticsModal();
  renderFilesBotAdminPanel();
}

function setFilesAdminModalOpen(nextModal, { focus = true, publicSharesMode = "" } = {}) {
  const me = normalizeFilesProfile(state.files.me);
  const canUseAdminTools = Boolean(me.isAuthorized && me.isAdmin);
  const canUsePublicShares = Boolean(me.isAuthorized);
  let normalizedModal = normalizeFilesAdminModalType(nextModal);
  const normalizedPublicSharesMode = normalizeFilesPublicSharesMode(publicSharesMode || state.files.publicShares.mode);
  if ((normalizedModal === "upload" || normalizedModal === "edit" || normalizedModal === "requests") && !canUseAdminTools) {
    normalizedModal = "";
  }
  if (normalizedModal === "publicShares" && !canUsePublicShares) {
    normalizedModal = "";
  }
  if (normalizedModal === "publicShares" && normalizedPublicSharesMode === "admin" && !canUseAdminTools) {
    normalizedModal = "";
  }
  if (normalizedModal === "bot" && !canUseFilesBotAdmin(me, { requireDesktop: true })) {
    normalizedModal = "";
  }
  state.files.adminModal.active = normalizedModal;
  if (normalizedModal === "publicShares") {
    state.files.publicShares.mode = normalizedPublicSharesMode;
  }
  if (normalizedModal === "bot") {
    startFilesBotAdminLivePolling();
  } else {
    stopFilesBotAdminLivePolling();
  }
  renderFilesAdminModals();

  if (!normalizedModal || !focus) {
    return;
  }

  if (normalizedModal === "upload") {
    if (elements.filesUploadInput instanceof HTMLInputElement) {
      focusFilesOpenTarget(elements.filesUploadInput, {
        fallback: elements.filesUploadModalCloseBtn
      });
    }
    return;
  }

  if (normalizedModal === "edit") {
    const descriptionInput = elements.filesEditPanel?.querySelector("textarea[name=\"description\"]") || null;
    if (descriptionInput instanceof HTMLTextAreaElement) {
      focusFilesOpenTarget(descriptionInput, {
        fallback: elements.filesEditModalCloseBtn
      });
    }
    return;
  }

  if (normalizedModal === "requests") {
    if (!state.files.adminRequests.loading) {
      void refreshFilesAdminRequests({ silent: true });
    }
    if (elements.filesAdminRequestsSearchInput instanceof HTMLInputElement) {
      focusFilesOpenTarget(elements.filesAdminRequestsSearchInput, {
        fallback: elements.filesAdminRequestsModalCloseBtn,
        selectText: true
      });
    }
    return;
  }

  if (normalizedModal === "publicShares") {
    if (!state.files.publicShares.loading) {
      void refreshFilesPublicShares({ silent: true, mode: normalizedPublicSharesMode });
    }
    if (elements.filesPublicSharesRefreshBtn instanceof HTMLButtonElement) {
      focusFilesOpenTarget(elements.filesPublicSharesRefreshBtn, {
        fallback: elements.filesPublicSharesModalCloseBtn
      });
    }
    return;
  }

  if (normalizedModal === "bot") {
    const shouldRefresh = !state.files.botAdmin.overview
      || (Date.now() - Number(state.files.botAdmin.lastLoadedAt || 0)) > 60 * 1000;
    if (!state.files.botAdmin.loading && shouldRefresh) {
      void refreshFilesBotAdminOverview({ silent: true });
    }
    if (elements.filesBotAdminSearchInput instanceof HTMLInputElement) {
      focusFilesOpenTarget(elements.filesBotAdminSearchInput, {
        fallback: elements.filesBotAdminModalCloseBtn,
        selectText: true
      });
    }
  }
}

function closeFilesAdminModal() {
  closeFilesBotAdminLeaveModal({ force: true });
  closeFilesBotAdminDiagnosticsModal({ render: false });
  setFilesAdminModalOpen("", { focus: false });
}

function openFilesFunctionsModal(fileId) {
  const file = state.files.list.find((f) => String(f.id || "") === String(fileId || ""));
  if (!file) {
    return;
  }
  state.files.functionsModal.open = true;
  state.files.functionsModal.fileName = getFilesDisplayName(file);
  state.files.functionsModal.functions = String(file.functions || "");
  renderFilesFunctionsModal();
}

function closeFilesFunctionsModal() {
  state.files.functionsModal.open = false;
  state.files.functionsModal.fileName = "";
  state.files.functionsModal.functions = "";
  renderFilesFunctionsModal();
}

function renderFilesFunctionsModal() {
  const { open, fileName, functions } = state.files.functionsModal;

  if (elements.filesFunctionsOverlay) {
    elements.filesFunctionsOverlay.classList.toggle("is-active", open);
    elements.filesFunctionsOverlay.setAttribute("aria-hidden", open ? "false" : "true");
  }

  document.body.classList.toggle("is-files-functions-modal-open", open);

  if (!elements.filesFunctionsPanel) {
    return;
  }

  elements.filesFunctionsPanel.hidden = !open;

  if (!open) {
    return;
  }

  if (elements.filesFunctionsModalFileName) {
    elements.filesFunctionsModalFileName.textContent = fileName || t("files_unknown_value");
  }

  if (elements.filesFunctionsModalBody) {
    const { itemCount = 0 } = renderFilesFunctionsContent(elements.filesFunctionsModalBody, functions);
    if (elements.filesFunctionsModalCount) {
      elements.filesFunctionsModalCount.hidden = itemCount < 1;
      elements.filesFunctionsModalCount.textContent = `${itemCount} ${String(t("files_functions_label") || "").toUpperCase()}`;
    }
  }
}

function getFilesAdminRequestStatusLabel(status) {
  const normalized = normalizeFilesAccessRequestStatus(status);
  if (normalized === "approved") {
    return t("files_admin_requests_status_approved");
  }
  if (normalized === "declined") {
    return t("files_admin_requests_status_declined");
  }
  if (normalized === "pending") {
    return t("files_admin_requests_status_pending");
  }
  return t("files_unknown_value");
}

function getFilesAdminRequestSearchText(entry) {
  return normalizeSearchText([
    entry.nick,
    entry.username,
    entry.discordId,
    entry.email,
    entry.reason,
    entry.declineReason
  ].join(" "));
}

function getFilteredFilesAdminRequestsList() {
  const source = Array.isArray(state.files.adminRequests.list) ? state.files.adminRequests.list : [];
  const filter = normalizeFilesAdminRequestsFilter(state.files.adminRequests.filter);
  const query = normalizeSearchText(state.files.adminRequests.query || "");
  const tokens = query ? query.split(" ").filter(Boolean) : [];

  return source.filter((entry) => {
    if (filter === "pending" && entry.status !== "pending") {
      return false;
    }
    if (filter === "approved" && entry.status !== "approved") {
      return false;
    }
    if (filter === "declined" && entry.status !== "declined") {
      return false;
    }
    if (filter === "authorized" && entry.status !== "approved") {
      return false;
    }
    if (!tokens.length) {
      return true;
    }

    const haystack = getFilesAdminRequestSearchText(entry);
    return tokens.every((token) => haystack.includes(token));
  });
}

function renderFilesAdminRequestsPanel() {
  if (!elements.filesAdminRequestsPanel) {
    return;
  }

  const me = normalizeFilesProfile(state.files.me);
  const showPanel = Boolean(me.isAuthorized && me.isAdmin);
  elements.filesAdminRequestsPanel.hidden = !showPanel;
  if (!showPanel) {
    setFilesAdminRequestsFilterMenuOpen(false);
    return;
  }

  if (state.files.adminRequests.declineComposerRequestId) {
    const hasComposerEntry = state.files.adminRequests.list.some((entry) => {
      return String(entry?.requestId || "").trim() === state.files.adminRequests.declineComposerRequestId;
    });
    if (!hasComposerEntry) {
      state.files.adminRequests.declineComposerRequestId = "";
      state.files.adminRequests.declineComposerValue = "";
    }
  }

  syncFilesAdminRequestsFilterMenu();

  if (elements.filesAdminRequestsSearchInput) {
    const nextQuery = String(state.files.adminRequests.query || "");
    if (elements.filesAdminRequestsSearchInput.value !== nextQuery) {
      elements.filesAdminRequestsSearchInput.value = nextQuery;
    }
  }

  if (elements.filesAdminRequestsRefreshBtn) {
    elements.filesAdminRequestsRefreshBtn.disabled = state.files.adminRequests.loading;
  }

  if (elements.filesAdminRequestsFeedback) {
    const message = String(state.files.adminRequests.message || "");
    const hasMessage = Boolean(message);
    elements.filesAdminRequestsFeedback.hidden = !hasMessage;
    elements.filesAdminRequestsFeedback.textContent = message;
    elements.filesAdminRequestsFeedback.classList.toggle("is-success", state.files.adminRequests.messageKind === "success");
    elements.filesAdminRequestsFeedback.classList.toggle("is-error", state.files.adminRequests.messageKind === "error");
  }

  if (!elements.filesAdminRequestsList) {
    return;
  }

  if (state.files.adminRequests.loading) {
    elements.filesAdminRequestsList.innerHTML = `<p class="files-admin-requests-empty">${t("files_admin_requests_loading")}</p>`;
    return;
  }

  const visibleEntries = getFilteredFilesAdminRequestsList();
  if (!visibleEntries.length) {
    elements.filesAdminRequestsList.innerHTML = `<p class="files-admin-requests-empty">${t("files_admin_requests_empty")}</p>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (let index = 0; index < visibleEntries.length; index += 1) {
    const entry = visibleEntries[index];
    const identity = entry.nick || entry.username || entry.discordId || t("files_unknown_value");
    const statusLabel = getFilesAdminRequestStatusLabel(entry.status);
    const sourceLabel = entry.source === "allowlist"
      ? t("files_admin_requests_source_allowlist")
      : t("files_admin_requests_source_request");
    const requestedAt = formatFileDateTime(entry.requestedAt);
    const decidedAt = entry.decidedAt ? formatFileDateTime(entry.decidedAt) : t("files_unknown_value");
    const emailText = entry.email || t("files_unknown_value");
    const reasonText = entry.reason || t("files_unknown_value");
    const declineReasonText = String(entry.declineReason || "").trim();
    const itemKey = entry.requestId || entry.discordId;
    const rowBusy = Boolean(state.files.adminRequests.busyActionKey) && state.files.adminRequests.busyActionKey === itemKey;
    const isDeclineComposerOpen = Boolean(entry.requestId)
      && state.files.adminRequests.declineComposerRequestId === entry.requestId;

    const card = document.createElement("article");
    card.className = "files-admin-request-item";
    card.style.setProperty("--files-admin-request-index", String(Math.min(index, 11)));

    const top = document.createElement("div");
    top.className = "files-admin-request-top";
    const name = document.createElement("p");
    name.className = "files-admin-request-name";
    name.textContent = identity;
    const badges = document.createElement("div");
    badges.className = "files-admin-request-badges";
    const statusBadge = document.createElement("span");
    statusBadge.className = `files-admin-request-badge is-${entry.status}`;
    statusBadge.textContent = statusLabel;
    const sourceBadge = document.createElement("span");
    sourceBadge.className = "files-admin-request-badge is-source";
    sourceBadge.textContent = sourceLabel;
    badges.appendChild(statusBadge);
    badges.appendChild(sourceBadge);
    top.appendChild(name);
    top.appendChild(badges);

    const meta = document.createElement("div");
    meta.className = "files-admin-request-meta";
    const metaRows = [
      [t("files_session_id_label"), entry.discordId || t("files_unknown_value")],
      [t("files_admin_requests_meta_email"), emailText],
      [t("files_admin_requests_meta_requested"), requestedAt],
      [t("files_admin_requests_meta_decided"), decidedAt]
    ];
    for (const [label, value] of metaRows) {
      const row = document.createElement("div");
      const key = document.createElement("span");
      key.textContent = label;
      const val = document.createElement("strong");
      val.textContent = value;
      row.appendChild(key);
      row.appendChild(val);
      meta.appendChild(row);
    }

    const reason = document.createElement("p");
    reason.className = "files-admin-request-reason";
    const reasonLabel = document.createElement("span");
    reasonLabel.textContent = t("files_admin_requests_meta_reason");
    reason.appendChild(reasonLabel);
    reason.appendChild(document.createTextNode(reasonText));

    let declineReason = null;
    if (declineReasonText && declineReasonText !== reasonText) {
      declineReason = document.createElement("p");
      declineReason.className = "files-admin-request-reason";
      const declineReasonLabel = document.createElement("span");
      declineReasonLabel.textContent = t("files_admin_requests_meta_decline_reason");
      declineReason.appendChild(declineReasonLabel);
      declineReason.appendChild(document.createTextNode(declineReasonText));
    }

    const actions = document.createElement("div");
    actions.className = "files-admin-request-actions";

    if (entry.canApprove && entry.requestId) {
      const approveBtn = document.createElement("button");
      approveBtn.type = "button";
      approveBtn.className = "files-card-action files-admin-request-action";
      approveBtn.textContent = rowBusy ? t("files_admin_requests_action_busy") : t("files_admin_requests_action_approve");
      approveBtn.dataset.filesAdminAction = "approve";
      approveBtn.dataset.requestId = entry.requestId;
      approveBtn.dataset.actionKey = itemKey;
      approveBtn.disabled = rowBusy || state.files.adminRequests.loading;
      actions.appendChild(approveBtn);
    }

    if (entry.canDecline && entry.requestId) {
      if (!isDeclineComposerOpen) {
        const denyBtn = document.createElement("button");
        denyBtn.type = "button";
        denyBtn.className = "files-card-action files-admin-request-action is-delete";
        denyBtn.textContent = rowBusy ? t("files_admin_requests_action_busy") : t("files_admin_requests_action_deny");
        denyBtn.dataset.filesAdminAction = "deny-open";
        denyBtn.dataset.requestId = entry.requestId;
        denyBtn.dataset.actionKey = itemKey;
        denyBtn.disabled = rowBusy || state.files.adminRequests.loading;
        actions.appendChild(denyBtn);
      }
    }

    if (entry.canUnauthorize) {
      const unauthorizeBtn = document.createElement("button");
      unauthorizeBtn.type = "button";
      unauthorizeBtn.className = "files-card-action files-admin-request-action is-delete";
      unauthorizeBtn.textContent = rowBusy ? t("files_admin_requests_action_busy") : t("files_admin_requests_action_unauthorize");
      unauthorizeBtn.dataset.filesAdminAction = "unauthorize";
      unauthorizeBtn.dataset.discordId = entry.discordId;
      unauthorizeBtn.dataset.actionKey = itemKey;
      unauthorizeBtn.disabled = rowBusy || state.files.adminRequests.loading;
      actions.appendChild(unauthorizeBtn);
    }

    if (entry.canAllowReapply) {
      const allowReapplyBtn = document.createElement("button");
      allowReapplyBtn.type = "button";
      allowReapplyBtn.className = "files-card-action files-admin-request-action";
      allowReapplyBtn.textContent = rowBusy ? t("files_admin_requests_action_busy") : t("files_admin_requests_action_allow_reapply");
      allowReapplyBtn.dataset.filesAdminAction = "allow-reapply";
      allowReapplyBtn.dataset.discordId = entry.discordId;
      allowReapplyBtn.dataset.actionKey = itemKey;
      allowReapplyBtn.disabled = rowBusy || state.files.adminRequests.loading;
      actions.appendChild(allowReapplyBtn);
    }

    if (!actions.children.length && entry.source === "allowlist") {
      const locked = document.createElement("p");
      locked.className = "files-admin-request-locked";
      locked.textContent = t("files_admin_requests_error_allowlist");
      actions.appendChild(locked);
    }

    let approvalTimerEl = null;
    if (entry.status === "approved" && entry.decidedAt) {
      const expiryMs = getFilesAccessExpiryMs(entry.decidedAt);
      if (expiryMs) {
        approvalTimerEl = document.createElement("div");
        approvalTimerEl.className = "files-admin-request-timer";
        const timerLabel = document.createElement("span");
        timerLabel.textContent = t("files_admin_requests_meta_expires");
        const timerValue = document.createElement("strong");
        const remaining = expiryMs - Date.now();
        if (remaining <= 0) {
          timerValue.textContent = t("files_access_timer_expired");
          approvalTimerEl.classList.add("is-expired");
        } else {
          timerValue.textContent = formatFilesAccessCountdown(expiryMs) || t("files_access_timer_expired");
          timerValue.dataset.filesAccessTimer = String(expiryMs);
          approvalTimerEl.classList.toggle("is-warning", remaining < 3 * 24 * 60 * 60 * 1000);
        }
        approvalTimerEl.appendChild(timerLabel);
        approvalTimerEl.appendChild(timerValue);
      }
    }

    card.appendChild(top);
    card.appendChild(meta);
    if (approvalTimerEl) card.appendChild(approvalTimerEl);
    card.appendChild(reason);
    if (declineReason) {
      card.appendChild(declineReason);
    }
    card.appendChild(actions);
    if (isDeclineComposerOpen && entry.requestId) {
      const declineEditor = document.createElement("div");
      declineEditor.className = "files-admin-request-decline-editor";

      const declineLabel = document.createElement("label");
      declineLabel.className = "files-admin-request-decline-label";
      declineLabel.textContent = t("files_admin_requests_action_decline_reason_label");

      const declineInput = document.createElement("textarea");
      declineInput.className = "files-admin-request-decline-input";
      declineInput.rows = 3;
      declineInput.maxLength = FILES_ACCESS_REQUEST_REASON_MAX;
      declineInput.placeholder = t("files_admin_requests_action_decline_reason_placeholder");
      declineInput.value = String(state.files.adminRequests.declineComposerValue || "");
      declineInput.setAttribute("data-files-admin-decline-input", "true");
      declineInput.setAttribute("data-request-id", entry.requestId);
      declineInput.disabled = rowBusy || state.files.adminRequests.loading;

      const declineEditorActions = document.createElement("div");
      declineEditorActions.className = "files-admin-request-decline-actions";

      const declineCancelBtn = document.createElement("button");
      declineCancelBtn.type = "button";
      declineCancelBtn.className = "files-card-action files-admin-request-action";
      declineCancelBtn.textContent = t("files_admin_requests_action_deny_cancel");
      declineCancelBtn.dataset.filesAdminAction = "deny-cancel";
      declineCancelBtn.dataset.requestId = entry.requestId;
      declineCancelBtn.dataset.actionKey = itemKey;
      declineCancelBtn.disabled = rowBusy || state.files.adminRequests.loading;

      const declineConfirmBtn = document.createElement("button");
      declineConfirmBtn.type = "button";
      declineConfirmBtn.className = "files-card-action files-admin-request-action is-delete";
      declineConfirmBtn.textContent = rowBusy
        ? t("files_admin_requests_action_busy")
        : t("files_admin_requests_action_deny_confirm");
      declineConfirmBtn.dataset.filesAdminAction = "deny-submit";
      declineConfirmBtn.dataset.requestId = entry.requestId;
      declineConfirmBtn.dataset.actionKey = itemKey;
      declineConfirmBtn.disabled = rowBusy || state.files.adminRequests.loading;

      declineEditorActions.appendChild(declineCancelBtn);
      declineEditorActions.appendChild(declineConfirmBtn);

      declineEditor.appendChild(declineLabel);
      declineEditor.appendChild(declineInput);
      declineEditor.appendChild(declineEditorActions);
      card.appendChild(declineEditor);
    }
    fragment.appendChild(card);
  }

  elements.filesAdminRequestsList.innerHTML = "";
  elements.filesAdminRequestsList.appendChild(fragment);
}

function renderFilesPublicSharesPanel() {
  if (!elements.filesPublicSharesPanel) {
    return;
  }

  const me = normalizeFilesProfile(state.files.me);
  const mode = normalizeFilesPublicSharesMode(state.files.publicShares.mode);
  const adminMode = mode === "admin";
  const showPanel = Boolean(me.isAuthorized && (!adminMode || me.isAdmin));
  elements.filesPublicSharesPanel.hidden = !showPanel;
  if (!showPanel) {
    return;
  }

  elements.filesPublicSharesPanel.classList.toggle("is-admin-scope", adminMode);
  if (elements.filesPublicSharesBadge) {
    elements.filesPublicSharesBadge.textContent = t(adminMode ? "files_public_shares_admin_badge" : "files_public_shares_badge");
  }
  if (elements.filesPublicSharesTitle) {
    elements.filesPublicSharesTitle.textContent = t(adminMode ? "files_public_shares_admin_title" : "files_public_shares_title");
  }
  if (elements.filesPublicSharesHint) {
    elements.filesPublicSharesHint.textContent = t(adminMode ? "files_public_shares_admin_hint" : "files_public_shares_hint");
  }
  if (elements.filesPublicSharesConsoleLabel) {
    elements.filesPublicSharesConsoleLabel.textContent = t(adminMode ? "files_public_shares_admin_console_label" : "files_public_shares_console_label");
  }
  if (elements.filesPublicSharesConsoleHint) {
    elements.filesPublicSharesConsoleHint.textContent = t(adminMode ? "files_public_shares_admin_console_hint" : "files_public_shares_console_hint");
  }

  const entries = getFilesPublicSharesCurrentList();
  const activeCount = entries.length;
  const maxActive = Math.max(1, Number(state.files.publicShares.maxActive) || 3);
  const activeLabel = adminMode
    ? t("files_public_shares_admin_active_count", { count: activeCount })
    : t("files_public_shares_active_count", { count: activeCount, max: maxActive });

  if (elements.filesPublicSharesStateBadge) {
    elements.filesPublicSharesStateBadge.textContent = activeLabel;
  }
  if (elements.filesPublicSharesRefreshBtn) {
    elements.filesPublicSharesRefreshBtn.disabled = state.files.publicShares.loading || Boolean(state.files.publicShares.busyActionKey);
  }
  if (elements.filesPublicSharesFeedback) {
    const message = String(state.files.publicShares.message || "");
    const hasMessage = Boolean(message);
    elements.filesPublicSharesFeedback.hidden = !hasMessage;
    elements.filesPublicSharesFeedback.textContent = message;
    elements.filesPublicSharesFeedback.classList.toggle("is-success", state.files.publicShares.messageKind === "success");
    elements.filesPublicSharesFeedback.classList.toggle("is-error", state.files.publicShares.messageKind === "error");
  }
  if (!elements.filesPublicSharesList) {
    return;
  }

  if (state.files.publicShares.loading) {
    elements.filesPublicSharesList.innerHTML = `<p class="files-public-shares-empty">${t("files_public_shares_loading")}</p>`;
    return;
  }

  if (!entries.length) {
    elements.filesPublicSharesList.innerHTML = `
      <article class="files-public-shares-empty-card">
        <p class="files-public-shares-empty-title">${t(adminMode ? "files_public_shares_admin_empty_title" : "files_public_shares_empty_title")}</p>
        <p class="files-public-shares-empty">${t(adminMode ? "files_public_shares_admin_empty" : "files_public_shares_empty")}</p>
      </article>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();
  entries.forEach((entry, index) => {
    const card = document.createElement("article");
    card.className = "files-public-share-item";
    card.style.setProperty("--files-public-share-index", String(Math.min(index, 10)));

    const top = document.createElement("div");
    top.className = "files-public-share-top";
    const titleWrap = document.createElement("div");
    titleWrap.className = "files-public-share-title-wrap";
    const badge = document.createElement("span");
    badge.className = "files-public-share-index";
    badge.textContent = String(index + 1).padStart(2, "0");
    const title = document.createElement("p");
    title.className = "files-public-share-name";
    title.textContent = entry.displayName || entry.name || t("files_unknown_value");
    titleWrap.append(badge, title);
    const status = document.createElement("span");
    status.className = "files-public-share-status";
    status.textContent = t("files_public_shares_status_ready");
    top.append(titleWrap, status);

    const meta = document.createElement("div");
    meta.className = "files-public-share-meta";
    const metaRows = adminMode
      ? [
        [t("files_public_shares_meta_owner"), entry.createdBy || t("files_unknown_value")],
        [t("files_public_shares_meta_owner_id"), entry.createdByDiscordId || t("files_unknown_value")],
        [t("files_public_shares_meta_code"), entry.code || "----"],
        [t("files_public_shares_meta_size"), entry.sizeLabel || (entry.size ? formatFileSize(entry.size) : t("files_unknown_value"))],
        [t("files_public_shares_meta_created"), formatFileDateTime(entry.createdAt)],
        [t("files_public_shares_meta_attempts"), t("files_public_shares_attempts_value", { n: entry.remainingCodeAttempts })]
      ]
      : [
        [t("files_public_shares_meta_code"), entry.code || "----"],
        [t("files_public_shares_meta_size"), entry.sizeLabel || (entry.size ? formatFileSize(entry.size) : t("files_unknown_value"))],
        [t("files_public_shares_meta_created"), formatFileDateTime(entry.createdAt)],
        [t("files_public_shares_meta_attempts"), t("files_public_shares_attempts_value", { n: entry.remainingCodeAttempts })]
      ];
    for (const [label, value] of metaRows) {
      const row = document.createElement("div");
      const key = document.createElement("span");
      key.textContent = label;
      const val = document.createElement("strong");
      val.textContent = value || t("files_unknown_value");
      row.append(key, val);
      meta.appendChild(row);
    }

    const link = document.createElement("p");
    link.className = "files-public-share-url";
    link.textContent = entry.shareUrl;

    const actions = document.createElement("div");
    actions.className = "files-public-share-actions";
    const rowBusy = state.files.publicShares.busyActionKey === entry.id;
    const actionSpecs = [
      ["open", t("files_public_shares_action_open"), false],
      ["copy", t("files_public_shares_action_copy"), false],
      ["delete", rowBusy ? t("files_public_shares_action_busy") : t("files_public_shares_action_delete"), true]
    ];
    for (const [action, label, isDelete] of actionSpecs) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `files-card-action files-public-share-action${isDelete ? " is-delete" : ""}`;
      button.textContent = label;
      button.dataset.filesPublicShareAction = action;
      button.dataset.shareId = entry.id;
      button.disabled = Boolean(state.files.publicShares.busyActionKey) || state.files.publicShares.loading;
      actions.appendChild(button);
    }

    card.append(top, meta, link, actions);
    fragment.appendChild(card);
  });

  elements.filesPublicSharesList.innerHTML = "";
  elements.filesPublicSharesList.appendChild(fragment);
}

function renderFilesBotAdminPanel() {
  if (!elements.filesBotAdminPanel) {
    return;
  }

  const me = normalizeFilesProfile(state.files.me);
  const canUseBotAdmin = canUseFilesBotAdmin(me, { requireDesktop: true });
  const showIndexButton = canUseBotAdmin
    && state.view === "intel"
    && !document.body.classList.contains("is-files")
    && !document.body.classList.contains("is-classified")
    && !state.siloDossier.open;
  elements.filesBotAdminPanel.hidden = !canUseBotAdmin;

  const activeModal = normalizeFilesAdminModalType(state.files.adminModal.active);
  const modalOpen = canUseBotAdmin && activeModal === "bot";
  const loading = Boolean(state.files.botAdmin.loading);
  const busyActionKey = String(state.files.botAdmin.busyActionKey || "").trim();
  const overview = normalizeFilesBotAdminOverview(state.files.botAdmin.overview);
  const inviteLink = overview?.inviteLink || state.publicConfig.botInviteLink || "";
  const selectedGuildId = String(state.files.botAdmin.selectedGuildId || "").trim();
  if (selectedGuildId && overview?.guilds?.length && !overview.guilds.some((guild) => guild.id === selectedGuildId)) {
    state.files.botAdmin.selectedGuildId = "";
  }

  if (elements.filesBotAdminFloatingBtn) {
    elements.filesBotAdminFloatingBtn.hidden = !showIndexButton;
    elements.filesBotAdminFloatingBtn.classList.toggle("is-active", modalOpen);
    elements.filesBotAdminFloatingBtn.setAttribute("aria-expanded", modalOpen ? "true" : "false");
  }
  if (elements.filesBotAdminModalBtn) {
    elements.filesBotAdminModalBtn.classList.toggle("is-active", modalOpen);
    elements.filesBotAdminModalBtn.setAttribute("aria-expanded", modalOpen ? "true" : "false");
  }

  if (!canUseBotAdmin) {
    setFilesBotAdminSortMenuOpen(false);
    return;
  }

  if (elements.filesBotAdminRefreshBtn) {
    elements.filesBotAdminRefreshBtn.disabled = loading || Boolean(busyActionKey);
    elements.filesBotAdminRefreshBtn.textContent = loading
      ? t("files_bot_admin_refresh_button_busy")
      : t("files_bot_admin_refresh_button");
  }
  if (elements.filesBotAdminSyncBtn) {
    const syncBusy = busyActionKey === "sync";
    const canSyncBot = Boolean(overview?.enabled && overview.ready);
    elements.filesBotAdminSyncBtn.disabled = loading || Boolean(busyActionKey) || !canSyncBot;
    elements.filesBotAdminSyncBtn.textContent = syncBusy
      ? t("files_bot_admin_sync_button_busy")
      : t("files_bot_admin_sync_button");
  }
  if (elements.filesBotAdminDiagnosticsBtn) {
    const canOpenDiagnostics = Boolean(overview);
    elements.filesBotAdminDiagnosticsBtn.disabled = !canOpenDiagnostics;
    elements.filesBotAdminDiagnosticsBtn.textContent = t("files_bot_admin_diagnostics_button");
    elements.filesBotAdminDiagnosticsBtn.classList.toggle("is-active", state.files.botAdmin.diagnosticsOpen);
  }
  if (elements.filesBotAdminInviteLink) {
    const hasInviteLink = Boolean(inviteLink);
    elements.filesBotAdminInviteLink.textContent = t("files_bot_admin_invite_button");
    elements.filesBotAdminInviteLink.href = hasInviteLink ? inviteLink : "#";
    elements.filesBotAdminInviteLink.classList.toggle("is-disabled", !hasInviteLink);
    elements.filesBotAdminInviteLink.setAttribute("aria-disabled", hasInviteLink ? "false" : "true");
    elements.filesBotAdminInviteLink.tabIndex = hasInviteLink ? 0 : -1;
    elements.filesBotAdminInviteLink.title = hasInviteLink ? t("files_bot_admin_invite_button") : t("files_bot_admin_invite_unavailable");
  }

  if (elements.filesBotAdminMeta) {
    elements.filesBotAdminMeta.textContent = getFilesBotAdminMetaText(overview);
  }
  if (elements.filesBotAdminFeedback) {
    const message = String(state.files.botAdmin.message || "");
    const hasMessage = Boolean(message);
    elements.filesBotAdminFeedback.hidden = !hasMessage;
    elements.filesBotAdminFeedback.textContent = message;
    elements.filesBotAdminFeedback.classList.toggle("is-success", state.files.botAdmin.messageKind === "success");
    elements.filesBotAdminFeedback.classList.toggle("is-error", state.files.botAdmin.messageKind === "error");
  }
  if (elements.filesBotAdminStatusValue) {
    elements.filesBotAdminStatusValue.textContent = getFilesBotAdminStatusLabel(overview);
  }
  if (elements.filesBotAdminServersValue) {
    elements.filesBotAdminServersValue.textContent = overview
      ? formatFilesBotAdminNumber(overview.stats.guildCount)
      : "--";
  }
  if (elements.filesBotAdminUsersValue) {
    elements.filesBotAdminUsersValue.textContent = overview
      ? formatFilesBotAdminNumber(overview.stats.userCount)
      : "--";
  }
  if (elements.filesBotAdminChannelsValue) {
    elements.filesBotAdminChannelsValue.textContent = overview
      ? formatFilesBotAdminNumber(overview.stats.subscriptionCount)
      : "--";
  }
  if (elements.filesBotAdminOrphansValue) {
    elements.filesBotAdminOrphansValue.textContent = overview
      ? formatFilesBotAdminNumber(overview.stats.orphanSubscriptionCount)
      : "--";
  }
  renderFilesBotAdminDiagnosticsModal(overview);
  renderFilesBotAdminServerModal(overview);
  if (elements.filesBotAdminSearchInput) {
    const nextQuery = String(state.files.botAdmin.query || "");
    if (elements.filesBotAdminSearchInput.value !== nextQuery) {
      elements.filesBotAdminSearchInput.value = nextQuery;
    }
  }
  syncFilesBotAdminSortMenu();
  if (elements.filesBotAdminFilterOptions?.length) {
    const activeFilter = normalizeFilesBotAdminGuildFilter(state.files.botAdmin.filter);
    for (const option of elements.filesBotAdminFilterOptions) {
      const optionFilter = normalizeFilesBotAdminGuildFilter(option.dataset.filesBotFilter || "all");
      const isActive = optionFilter === activeFilter;
      option.classList.toggle("is-active", isActive);
      option.setAttribute("aria-pressed", isActive ? "true" : "false");
    }
  }
  elements.filesBotAdminPanel.classList.remove("is-focus-mode");
  if (elements.filesBotAdminToolbar) {
    elements.filesBotAdminToolbar.hidden = false;
  }
  if (elements.filesBotAdminFilterWrap) {
    elements.filesBotAdminFilterWrap.hidden = false;
  }
  if (elements.filesBotAdminOverview) {
    elements.filesBotAdminOverview.hidden = false;
  }

  if (!elements.filesBotAdminServerList) {
    return;
  }

  const emptyState = document.createElement("p");
  emptyState.className = "files-bot-admin-empty";

  if (loading && !overview) {
    emptyState.textContent = t("files_bot_admin_loading");
    elements.filesBotAdminServerList.replaceChildren(emptyState);
    return;
  }

  if (!overview || !overview.enabled) {
    emptyState.textContent = state.files.botAdmin.message || t("files_bot_admin_unavailable");
    elements.filesBotAdminServerList.replaceChildren(emptyState);
    return;
  }
  if (!overview.ready && !overview.guilds.length) {
    emptyState.textContent = t("files_bot_admin_loading");
    elements.filesBotAdminServerList.replaceChildren(emptyState);
    return;
  }

  const guilds = getFilteredFilesBotAdminGuilds();
  if (!guilds.length) {
    state.files.botAdmin.selectedGuildId = "";
    emptyState.textContent = t("files_bot_admin_empty");
    elements.filesBotAdminServerList.replaceChildren(emptyState);
    return;
  }

  const fragment = document.createDocumentFragment();

  const listShell = document.createElement("section");
  listShell.className = "files-bot-admin-list-shell";

  const listHead = document.createElement("div");
  listHead.className = "files-bot-admin-list-head";

  const listTitle = document.createElement("strong");
  listTitle.className = "files-bot-admin-list-title";
  listTitle.textContent = t("files_bot_admin_summary_servers");

  const listCount = document.createElement("span");
  listCount.className = "files-bot-admin-list-count";
  listCount.textContent = formatFilesBotAdminNumber(guilds.length);

  listHead.appendChild(listTitle);
  listHead.appendChild(listCount);

  const listScroll = document.createElement("div");
  listScroll.className = "files-bot-admin-list-scroll";

  for (const guild of guilds) {
    const guildName = guild.name || t("files_unknown_value");
    const isSelected = guild.id === state.files.botAdmin.selectedGuildId;

    const row = document.createElement("article");
    row.className = "files-bot-admin-server-row";
    row.dataset.filesBotGuildCard = guild.id;
    row.classList.toggle("is-active", isSelected);

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "files-bot-admin-server-row-trigger";
    trigger.dataset.filesBotSelect = "true";
    trigger.dataset.guildId = guild.id;
    trigger.setAttribute("aria-expanded", isSelected ? "true" : "false");

    const main = document.createElement("div");
    main.className = "files-bot-admin-server-row-main";

    const identity = document.createElement("div");
    identity.className = "files-bot-admin-server-row-identity";

    const avatar = createFilesBotAdminGuildAvatar(guildName, guild.iconUrl);

    const nameBlock = document.createElement("div");
    nameBlock.className = "files-bot-admin-server-name-block";
    const name = document.createElement("h3");
    name.className = "files-bot-admin-server-name";
    name.textContent = guildName;
    const id = document.createElement("span");
    id.className = "files-bot-admin-server-id";
    id.textContent = guild.id;
    nameBlock.appendChild(name);
    nameBlock.appendChild(id);

    identity.appendChild(avatar);
    identity.appendChild(nameBlock);

    const side = document.createElement("div");
    side.className = "files-bot-admin-server-row-side";

    const subscriptionBadge = document.createElement("span");
    subscriptionBadge.className = "files-bot-admin-server-badge";
    subscriptionBadge.textContent = t("files_bot_admin_server_channels_count", {
      n: formatFilesBotAdminNumber(guild.subscriptionCount)
    });

    const chevron = document.createElement("span");
    chevron.className = "files-bot-admin-server-row-chevron";
    chevron.textContent = "›";
    chevron.setAttribute("aria-hidden", "true");

    main.appendChild(identity);
    side.appendChild(subscriptionBadge);
    side.appendChild(chevron);
    main.appendChild(side);
    trigger.appendChild(main);
    row.appendChild(trigger);
    listScroll.appendChild(row);
  }

  listShell.appendChild(listHead);
  listShell.appendChild(listScroll);
  fragment.appendChild(listShell);
  elements.filesBotAdminServerList.replaceChildren(fragment);
}

function setFilesUploadInputInvalid(isInvalid, { isMissingFileError = false } = {}) {
  state.files.uploadFieldInvalid = Boolean(isInvalid);
  state.files.uploadMissingFileError = Boolean(isMissingFileError) && state.files.uploadFieldInvalid;
}

function renderFilesDeleteModal() {
  const modalState = state.files.deleteModal;
  const isOpen = Boolean(modalState.open);
  const displayName = modalState.fileName || t("files_unknown_value");

  if (elements.filesDeleteTitle) {
    elements.filesDeleteTitle.textContent = t("files_delete_modal_title");
  }
  if (elements.filesDeleteMessage) {
    elements.filesDeleteMessage.textContent = t("files_delete_modal_body", { name: displayName });
  }
  if (elements.filesDeleteCancelBtn) {
    elements.filesDeleteCancelBtn.textContent = t("files_delete_modal_cancel");
    elements.filesDeleteCancelBtn.disabled = modalState.deleting;
  }
  if (elements.filesDeleteConfirmBtn) {
    elements.filesDeleteConfirmBtn.textContent = t("files_delete_modal_confirm");
    elements.filesDeleteConfirmBtn.disabled = modalState.deleting;
  }
  if (elements.filesDeleteOverlay) {
    elements.filesDeleteOverlay.classList.toggle("is-active", isOpen);
    elements.filesDeleteOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }
}

function closeFilesDeleteModal({ force = false } = {}) {
  if (state.files.deleteModal.deleting && !force) {
    return;
  }

  state.files.deleteModal.open = false;
  state.files.deleteModal.fileId = "";
  state.files.deleteModal.fileName = "";
  state.files.deleteModal.deleting = false;
  renderFilesDeleteModal();
}

function renderFilesCautionModal() {
  const modalState = state.files.cautionModal;
  const isOpen = Boolean(modalState.open);
  const modalKind = modalState.kind === "untested" ? "untested" : "caution";
  const titleKey = modalKind === "untested" ? "files_untested_notice_title" : "files_caution_modal_title";
  const bodyKey = modalKind === "untested" ? "files_untested_notice_body" : "files_caution_modal_body";

  if (elements.filesCautionTitle) {
    elements.filesCautionTitle.textContent = t(titleKey);
  }
  if (elements.filesCautionMessage) {
    elements.filesCautionMessage.textContent = t(bodyKey);
  }
  if (elements.filesCautionRejectBtn) {
    elements.filesCautionRejectBtn.textContent = t("files_caution_modal_reject");
  }
  if (elements.filesCautionConfirmBtn) {
    elements.filesCautionConfirmBtn.textContent = t("files_caution_modal_confirm");
  }
  const cautionCore = elements.filesCautionOverlay?.querySelector(".files-caution-core") || null;
  if (cautionCore instanceof HTMLElement) {
    cautionCore.classList.toggle("is-untested", modalKind === "untested");
  }
  if (elements.filesCautionOverlay) {
    elements.filesCautionOverlay.classList.toggle("is-active", isOpen);
    elements.filesCautionOverlay.classList.toggle("is-untested", modalKind === "untested");
    elements.filesCautionOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }
}

function openFilesCautionModal(fileId, { kind = "", versionId = "" } = {}) {
  const matchedFile = state.files.list.find((entry) => String(entry.id || "") === String(fileId || ""));
  if (!matchedFile) {
    return;
  }

  const modalKind = kind === "untested"
    ? "untested"
    : normalizeFilesBooleanFlag(matchedFile.caution)
      ? "caution"
      : normalizeFilesBooleanFlag(matchedFile.untested)
        ? "untested"
        : "caution";

  state.files.cautionModal.open = true;
  state.files.cautionModal.fileId = String(fileId);
  state.files.cautionModal.versionId = String(versionId || "").trim().toLowerCase();
  state.files.cautionModal.fileName = getFilesDisplayName(matchedFile);
  state.files.cautionModal.kind = modalKind;
  renderFilesCautionModal();
  setTimeout(() => {
    elements.filesCautionConfirmBtn?.focus();
  }, 0);
}

function closeFilesCautionModal() {
  state.files.cautionModal.open = false;
  state.files.cautionModal.fileId = "";
  state.files.cautionModal.versionId = "";
  state.files.cautionModal.fileName = "";
  state.files.cautionModal.kind = "";
  renderFilesCautionModal();
}

function confirmFilesCautionDownload() {
  const fileId = String(state.files.cautionModal.fileId || "").trim();
  const versionId = String(state.files.cautionModal.versionId || "").trim().toLowerCase();
  if (!fileId) {
    closeFilesCautionModal();
    return;
  }

  closeFilesCautionModal();
  startFilesDownload(fileId, { versionId });
}

function setFilesShareFeedback(message = "", kind = "") {
  state.files.shareModal.feedback = String(message || "");
  state.files.shareModal.feedbackKind = String(kind || "");
  renderFilesShareModal();
}

function renderFilesShareModal() {
  const modalState = state.files.shareModal;
  const isOpen = Boolean(modalState.open);
  const isPublicMode = modalState.mode === "public";
  const isBusy = Boolean(modalState.busy);

  if (elements.filesShareBadge) {
    elements.filesShareBadge.textContent = t("files_share_modal_badge");
  }
  if (elements.filesShareTitle) {
    elements.filesShareTitle.textContent = t("files_share_modal_title");
  }
  if (elements.filesShareMessage) {
    elements.filesShareMessage.textContent = t("files_share_modal_body");
  }
  if (elements.filesSharePrivateTitle) {
    elements.filesSharePrivateTitle.textContent = t("files_share_private_title");
  }
  if (elements.filesSharePrivateBody) {
    elements.filesSharePrivateBody.textContent = t("files_share_private_body");
  }
  if (elements.filesSharePublicTitle) {
    elements.filesSharePublicTitle.textContent = t("files_share_public_title");
  }
  if (elements.filesSharePublicBody) {
    elements.filesSharePublicBody.textContent = t("files_share_public_body");
  }
  if (elements.filesShareCodeLabel) {
    elements.filesShareCodeLabel.textContent = t("files_share_code_label");
  }
  if (elements.filesSharePublicCreateBtn) {
    elements.filesSharePublicCreateBtn.textContent = isBusy
      ? t("files_share_public_creating")
      : t("files_share_public_create");
    elements.filesSharePublicCreateBtn.disabled = isBusy;
  }
  if (elements.filesSharePublicHint) {
    elements.filesSharePublicHint.textContent = t("files_share_public_hint");
  }
  if (elements.filesShareCancelBtn) {
    elements.filesShareCancelBtn.textContent = t("files_share_modal_cancel");
    elements.filesShareCancelBtn.disabled = isBusy;
  }
  if (elements.filesSharePrivateBtn) {
    elements.filesSharePrivateBtn.disabled = isBusy;
    elements.filesSharePrivateBtn.classList.toggle("is-selected", modalState.mode === "private");
  }
  if (elements.filesSharePublicBtn) {
    elements.filesSharePublicBtn.disabled = isBusy;
    elements.filesSharePublicBtn.classList.toggle("is-selected", isPublicMode);
  }
  if (elements.filesSharePublicForm) {
    elements.filesSharePublicForm.hidden = !isPublicMode;
    elements.filesSharePublicForm.style.display = isPublicMode ? "" : "none";
  }
  if (elements.filesShareFeedback) {
    elements.filesShareFeedback.hidden = !modalState.feedback;
    elements.filesShareFeedback.textContent = modalState.feedback;
    elements.filesShareFeedback.classList.toggle("is-error", modalState.feedbackKind === "error");
    elements.filesShareFeedback.classList.toggle("is-success", modalState.feedbackKind === "success");
  }
  if (elements.filesShareOverlay) {
    elements.filesShareOverlay.classList.toggle("is-active", isOpen);
    elements.filesShareOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }
}

function openFilesShareModal(fileId, button = null) {
  const normalizedFileId = String(fileId || "").trim().toLowerCase();
  const matchedFile = state.files.list.find((entry) => String(entry?.id || "").trim().toLowerCase() === normalizedFileId) || null;
  if (!matchedFile) {
    if (button instanceof HTMLButtonElement) {
      flashFilesShareButtonState(button, t("files_share_button_copy_error"));
    }
    return;
  }

  state.files.shareModal.open = true;
  state.files.shareModal.fileId = normalizedFileId;
  state.files.shareModal.fileName = getFilesDisplayName(matchedFile);
  state.files.shareModal.mode = "choice";
  state.files.shareModal.busy = false;
  state.files.shareModal.feedback = "";
  state.files.shareModal.feedbackKind = "";
  state.files.shareModal.sourceButton = button instanceof HTMLButtonElement ? button : null;
  if (elements.filesShareCodeInput instanceof HTMLInputElement) {
    elements.filesShareCodeInput.value = "";
    elements.filesShareCodeInput.classList.remove("is-invalid");
  }
  renderFilesShareModal();
  setTimeout(() => {
    elements.filesShareCancelBtn?.focus();
  }, 0);
}

function closeFilesShareModal({ force = false } = {}) {
  if (state.files.shareModal.busy && !force) {
    return;
  }

  state.files.shareModal.open = false;
  state.files.shareModal.fileId = "";
  state.files.shareModal.fileName = "";
  state.files.shareModal.mode = "choice";
  state.files.shareModal.busy = false;
  state.files.shareModal.feedback = "";
  state.files.shareModal.feedbackKind = "";
  state.files.shareModal.sourceButton = null;
  if (elements.filesShareCodeInput instanceof HTMLInputElement) {
    elements.filesShareCodeInput.value = "";
    elements.filesShareCodeInput.classList.remove("is-invalid");
  }
  renderFilesShareModal();
}

async function copyPrivateFilesShareLink() {
  state.files.shareModal.mode = "private";
  renderFilesShareModal();
  const normalizedFileId = String(state.files.shareModal.fileId || "").trim().toLowerCase();
  const button = state.files.shareModal.sourceButton;
  const matchedFile = state.files.list.find((entry) => String(entry?.id || "").trim().toLowerCase() === normalizedFileId) || null;
  if (!matchedFile) {
    if (button instanceof HTMLButtonElement) {
      flashFilesShareButtonState(button, t("files_share_button_copy_error"));
    }
    closeFilesShareModal({ force: true });
    return;
  }

  const shareUrl = buildFilesLocationUrl(matchedFile, { absolute: true });
  try {
    await copyTextToClipboard(shareUrl);
    closeFilesShareModal({ force: true });
    flashFilesShareButtonStateAfterModal(button, t("files_share_button_copied"));
  } catch {
    setFilesShareFeedback(t("files_share_button_copy_error"), "error");
    if (button instanceof HTMLButtonElement) {
      flashFilesShareButtonState(button, t("files_share_button_copy_error"));
    }
  }
}

function showPublicFilesShareForm() {
  state.files.shareModal.mode = "public";
  state.files.shareModal.feedback = "";
  state.files.shareModal.feedbackKind = "";
  renderFilesShareModal();
  setTimeout(() => {
    elements.filesShareCodeInput?.focus();
  }, 0);
}

async function submitPublicFilesShare(event) {
  event?.preventDefault?.();
  const normalizedFileId = String(state.files.shareModal.fileId || "").trim().toLowerCase();
  const button = state.files.shareModal.sourceButton;
  const codeInput = elements.filesShareCodeInput instanceof HTMLInputElement ? elements.filesShareCodeInput : null;
  const code = String(codeInput?.value || "").replace(/\D/g, "").slice(0, 4);
  if (codeInput) {
    codeInput.value = code;
    codeInput.classList.toggle("is-invalid", !/^\d{4}$/.test(code));
  }
  if (!/^\d{4}$/.test(code)) {
    setFilesShareFeedback(t("files_share_public_invalid_code"), "error");
    codeInput?.focus();
    return;
  }
  if (!normalizedFileId || state.files.shareModal.busy) {
    return;
  }

  state.files.shareModal.busy = true;
  state.files.shareModal.feedback = "";
  state.files.shareModal.feedbackKind = "";
  renderFilesShareModal();

  try {
    const payload = await requestJson(`/api/files/${encodeURIComponent(normalizedFileId)}/public-share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code,
        lang: state.lang === "es" ? "es" : "en"
      })
    });
    const shareUrl = String(payload.shareUrl || payload.sharePath || "").trim();
    if (!shareUrl) {
      throw new Error(t("files_share_public_create_error"));
    }
    try {
      await copyTextToClipboard(shareUrl);
    } catch {
      state.files.shareModal.busy = false;
      setFilesShareFeedback(t("files_share_public_copy_error"), "error");
      window.prompt("Copy public link:", shareUrl);
      return;
    }
    if (button instanceof HTMLButtonElement) {
      void refreshFilesPublicShares({ silent: true, mode: "mine" });
      closeFilesShareModal({ force: true });
      flashFilesShareButtonStateAfterModal(button, t("files_share_button_copied"));
    } else {
      void refreshFilesPublicShares({ silent: true, mode: "mine" });
      closeFilesShareModal({ force: true });
    }
  } catch (error) {
    const message = String(error?.message || t("files_share_public_create_error"));
    state.files.shareModal.busy = false;
    setFilesShareFeedback(message, "error");
    if (button instanceof HTMLButtonElement) {
      flashFilesShareButtonState(button, t("files_share_button_copy_error"));
    }
  }
}

function renderFilesBotAdminLeaveModal() {
  const modalState = state.files.botAdmin.leaveConfirm;
  const me = normalizeFilesProfile(state.files.me);
  const isOpen = Boolean(me.isAuthorized && me.isAdmin && modalState.open);
  const guildName = modalState.guildName || t("files_unknown_value");
  const busy = Boolean(state.files.botAdmin.busyActionKey);

  if (elements.filesBotAdminLeaveBadge) {
    elements.filesBotAdminLeaveBadge.textContent = t("files_bot_admin_leave_modal_badge");
  }
  if (elements.filesBotAdminLeaveTitle) {
    elements.filesBotAdminLeaveTitle.textContent = t("files_bot_admin_leave_modal_title");
  }
  if (elements.filesBotAdminLeaveMessage) {
    elements.filesBotAdminLeaveMessage.textContent = t("files_bot_admin_leave_confirm", { server: guildName });
  }
  if (elements.filesBotAdminLeaveCancelBtn) {
    elements.filesBotAdminLeaveCancelBtn.textContent = t("files_bot_admin_leave_modal_cancel");
    elements.filesBotAdminLeaveCancelBtn.disabled = busy;
  }
  if (elements.filesBotAdminLeaveConfirmBtn) {
    elements.filesBotAdminLeaveConfirmBtn.textContent = busy
      ? t("files_bot_admin_server_action_busy")
      : t("files_bot_admin_leave_modal_confirm");
    elements.filesBotAdminLeaveConfirmBtn.disabled = busy;
  }
  if (elements.filesBotAdminLeaveOverlay) {
    elements.filesBotAdminLeaveOverlay.classList.toggle("is-active", isOpen);
    elements.filesBotAdminLeaveOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }
}

function closeFilesBotAdminLeaveModal({ force = false } = {}) {
  if (state.files.botAdmin.busyActionKey && !force) {
    return;
  }

  state.files.botAdmin.leaveConfirm.open = false;
  state.files.botAdmin.leaveConfirm.guildId = "";
  state.files.botAdmin.leaveConfirm.guildName = "";
  state.files.botAdmin.leaveConfirm.actionKey = "";
  renderFilesBotAdminLeaveModal();
}

function openFilesBotAdminLeaveModal({ guildId = "", guildName = "", actionKey = "" } = {}) {
  state.files.botAdmin.leaveConfirm.open = true;
  state.files.botAdmin.leaveConfirm.guildId = String(guildId || "").trim();
  state.files.botAdmin.leaveConfirm.guildName = String(guildName || "").trim();
  state.files.botAdmin.leaveConfirm.actionKey = String(actionKey || "").trim();
  renderFilesBotAdminLeaveModal();
}

async function confirmFilesBotAdminLeaveModal() {
  const modalState = state.files.botAdmin.leaveConfirm;
  if (!modalState.open || !modalState.guildId || state.files.botAdmin.busyActionKey) {
    return;
  }

  await executeFilesBotAdminAction({
    action: "leave",
    guildId: modalState.guildId,
    guildName: modalState.guildName || t("files_unknown_value"),
    actionKey: modalState.actionKey || `leave:${modalState.guildId}`
  });
}

function setFilesSearchCount(text = "") {
  if (!elements.filesSearchCount) {
    return;
  }
  const hasText = Boolean(text);
  elements.filesSearchCount.hidden = !hasText;
  elements.filesSearchCount.textContent = hasText ? text : "";
}

function setFilesSearchOpen(active, { focusInput = false, clearQuery = false } = {}) {
  const open = Boolean(active);

  if (open && state.files.groupManager.open) {
    setFilesGroupManagerOpen(false, { focusInput: false, clearSelection: true });
  }

  state.files.search.open = open;

  if (open) {
    state.files.selectedId = "";
    state.files.detailOrigin = "";
    state.files.transition = "";
  }

  if (elements.filesSearchWrap) {
    elements.filesSearchWrap.hidden = !open;
  }
  if (elements.filesSearchToggleBtn) {
    elements.filesSearchToggleBtn.classList.toggle("is-active", open);
    elements.filesSearchToggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
    const titleKey = open ? "files_search_toggle_close_label" : "files_search_toggle_open_label";
    elements.filesSearchToggleBtn.title = t(titleKey);
    elements.filesSearchToggleBtn.setAttribute("aria-label", t(titleKey));
  }
  if (elements.filesSearchToggleText) {
    const textKey = open ? "files_search_toggle_close" : "files_search_toggle_open";
    elements.filesSearchToggleText.textContent = t(textKey);
  }

  if (!open && clearQuery && elements.filesSearchInput) {
    elements.filesSearchInput.value = "";
    state.files.search.query = "";
  }

  renderFilesList();
  renderFilesGroupManagerPanel();

  if (open && focusInput && elements.filesSearchInput) {
    focusFilesOpenTarget(elements.filesSearchInput, {
      fallback: elements.filesSearchToggleBtn,
      selectText: true
    });
  }
}

function setFilesGroupManagerOpen(active, { focusInput = false, clearSelection = false } = {}) {
  const me = normalizeFilesProfile(state.files.me);
  const canUseManager = Boolean(me.isAuthorized && me.isAdmin);
  const open = canUseManager && Boolean(active);

  if (open && state.files.search.open) {
    setFilesSearchOpen(false, { focusInput: false, clearQuery: true });
  }

  state.files.groupManager.open = open;

  if (open) {
    state.files.activeGroupKey = "";
    state.files.groupTransition = "";
    state.files.selectedId = "";
    state.files.detailOrigin = "";
    cancelFilesRename({ render: false });
  }

  if (!open && clearSelection) {
    clearFilesGroupManagerState();
    closeAllFilesGroupSuggestMenus();
  }

  if (elements.filesGroupManagerToggleBtn) {
    elements.filesGroupManagerToggleBtn.classList.toggle("is-active", open);
    elements.filesGroupManagerToggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
    const titleKey = open ? "files_group_manager_toggle_close_label" : "files_group_manager_toggle_open_label";
    elements.filesGroupManagerToggleBtn.title = t(titleKey);
    elements.filesGroupManagerToggleBtn.setAttribute("aria-label", t(titleKey));
    elements.filesGroupManagerToggleBtn.hidden = !canUseManager;
  }
  if (elements.filesGroupManagerToggleText) {
    const textKey = open ? "files_group_manager_toggle_close" : "files_group_manager_toggle_open";
    elements.filesGroupManagerToggleText.textContent = t(textKey);
  }
  if (elements.filesGroupManagerWrap) {
    elements.filesGroupManagerWrap.hidden = !open;
  }

  renderFilesList();
  renderFilesGroupManagerPanel();

  if (open && focusInput) {
    const managerInput = elements.filesGroupManagerWrap?.querySelector("[data-files-group-input]");
    if (managerInput instanceof HTMLInputElement) {
      focusFilesOpenTarget(managerInput, {
        fallback: elements.filesGroupManagerToggleBtn,
        selectText: true
      });
    }
  }
}

function renderFilesGroupManagerPanel() {
  if (!elements.filesGroupManagerWrap) {
    return;
  }

  const me = normalizeFilesProfile(state.files.me);
  const canUseManager = Boolean(me.isAuthorized && me.isAdmin);
  const shouldShow = canUseManager && Boolean(state.files.groupManager.open);
  elements.filesGroupManagerWrap.hidden = !shouldShow;
  elements.filesGroupManagerWrap.replaceChildren();
  if (!shouldShow) {
    return;
  }

  const visibleFileIds = getFilesGroupManagerVisibleFileIds();
  const visibleIdSet = new Set(visibleFileIds);
  state.files.groupManager.selectedIds = state.files.groupManager.selectedIds
    .map((value) => String(value || "").trim())
    .filter((value) => value && visibleIdSet.has(value));

  const selectedCount = state.files.groupManager.selectedIds.length;
  const totalCount = Math.max(0, visibleFileIds.length);
  const currentTargetGroup = normalizeFilesGroup(state.files.groupManager.targetGroup || "");
  const currentTargetLabel = currentTargetGroup || t("files_group_default");
  const fragment = document.createDocumentFragment();

  const manager = document.createElement("section");
  manager.className = "files-group-manager";

  const managerTop = document.createElement("div");
  managerTop.className = "files-group-manager-top";

  const managerTitle = document.createElement("p");
  managerTitle.className = "files-group-manager-title";
  managerTitle.textContent = t("files_group_manager_title");
  managerTop.appendChild(managerTitle);

  const managerCount = document.createElement("span");
  managerCount.className = "files-group-manager-count";
  managerCount.textContent = t("files_group_manager_selected_count", {
    n: String(selectedCount),
    total: String(totalCount)
  });
  managerTop.appendChild(managerCount);
  manager.appendChild(managerTop);

  const activeGroupText = document.createElement("p");
  activeGroupText.className = "files-group-manager-active";
  activeGroupText.textContent = t("files_group_manager_active_group", { group: currentTargetLabel });
  manager.appendChild(activeGroupText);

  const managerHint = document.createElement("p");
  managerHint.className = "files-group-manager-hint";
  managerHint.textContent = t("files_group_manager_mode_hint");
  manager.appendChild(managerHint);

  const managerControls = document.createElement("div");
  managerControls.className = "files-group-manager-controls";

  const managerInput = document.createElement("input");
  managerInput.id = "filesGroupManagerInput";
  managerInput.type = "text";
  managerInput.className = "files-upload-text files-group-manager-input";
  managerInput.maxLength = 80;
  managerInput.placeholder = t("files_group_manager_placeholder");
  managerInput.value = currentTargetGroup;
  managerInput.setAttribute("data-files-group-input", "true");
  managerInput.disabled = state.files.groupManager.busy;
  managerControls.appendChild(managerInput);

  const managerSuggest = createFilesGroupSuggestionDropdown(managerInput.id, managerInput.value);
  const managerSuggestToggle = managerSuggest.querySelector("[data-files-group-suggest-toggle]");
  if (managerSuggestToggle instanceof HTMLButtonElement) {
    managerSuggestToggle.disabled = state.files.groupManager.busy;
  }
  managerControls.appendChild(managerSuggest);

  const managerActions = document.createElement("div");
  managerActions.className = "files-group-manager-actions";

  const assignButton = document.createElement("button");
  assignButton.type = "button";
  assignButton.className = "files-card-action";
  assignButton.setAttribute("data-files-action", "assign-selected-group");
  assignButton.textContent = state.files.groupManager.busy
    ? t("files_group_manager_assign_busy")
    : t("files_group_manager_assign_button");
  assignButton.disabled = state.files.groupManager.busy || selectedCount < 1;
  managerActions.appendChild(assignButton);

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "files-card-action is-delete";
  removeButton.setAttribute("data-files-action", "remove-selected-group");
  removeButton.textContent = state.files.groupManager.busy
    ? t("files_group_manager_remove_busy")
    : t("files_group_manager_remove_button");
  removeButton.disabled = state.files.groupManager.busy || selectedCount < 1;
  managerActions.appendChild(removeButton);

  const selectAllButton = document.createElement("button");
  selectAllButton.type = "button";
  selectAllButton.className = "files-card-action";
  selectAllButton.setAttribute("data-files-action", "select-all-group-files");
  selectAllButton.textContent = t("files_group_manager_select_all_button");
  selectAllButton.disabled = state.files.groupManager.busy || totalCount < 1;
  managerActions.appendChild(selectAllButton);

  const clearSelectionButton = document.createElement("button");
  clearSelectionButton.type = "button";
  clearSelectionButton.className = "files-card-action";
  clearSelectionButton.setAttribute("data-files-action", "clear-group-files-selection");
  clearSelectionButton.textContent = t("files_group_manager_clear_button");
  clearSelectionButton.disabled = state.files.groupManager.busy || selectedCount < 1;
  managerActions.appendChild(clearSelectionButton);

  managerControls.appendChild(managerActions);
  if (!totalCount) {
    const empty = document.createElement("p");
    empty.className = "files-search-empty files-group-manager-empty";
    empty.textContent = t("files_group_manager_no_files");
    managerControls.appendChild(empty);
  }
  manager.appendChild(managerControls);
  fragment.appendChild(manager);

  elements.filesGroupManagerWrap.appendChild(fragment);
}

function getFilteredFilesList(files = []) {
  const source = Array.isArray(files) ? files : [];
  const isSearchOpen = Boolean(state.files.search.open);
  const rawQuery = isSearchOpen
    ? String(state.files.search.query || "")
    : "";
  const query = normalizeSearchText(rawQuery);
  if (!isSearchOpen || !query) {
    return source;
  }

  const queryTokens = query.split(" ").filter(Boolean);
  if (!queryTokens.length) {
    return source;
  }

  return source.filter((file) => {
    const displayName = normalizeSearchText(getFilesDisplayName(file));
    const realName = normalizeSearchText(file.name || file.originalName || "");
    const type = normalizeSearchText(file.mimeType || file.type || resolveFileTypeLabel(file));
    const group = normalizeSearchText(file.group || "");
    const description = normalizeSearchText(file.descriptionPlain || file.description || "");
    const uploader = normalizeSearchText(file.uploader || file.uploaderDiscordId || "");
    const status = [
      normalizeFilesBooleanFlag(file.outdated) ? t("files_outdated_badge") : "",
      normalizeFilesBooleanFlag(file.untested) ? t("files_untested_badge") : "",
      normalizeFilesBooleanFlag(file.caution) ? t("files_caution_badge") : ""
    ].filter(Boolean).map((value) => normalizeSearchText(value)).join(" ");
    const haystack = `${displayName} ${realName} ${type} ${group} ${description} ${uploader} ${status}`;
    return queryTokens.every((token) => haystack.includes(token));
  });
}

function openFilesDeleteModal(fileId) {
  if (!state.files.me?.isAdmin) {
    return;
  }

  const matchedFile = state.files.list.find((entry) => String(entry.id || "") === String(fileId || ""));
  if (!matchedFile) {
    return;
  }

  state.files.deleteModal.open = true;
  state.files.deleteModal.fileId = String(fileId);
  state.files.deleteModal.fileName = getFilesDisplayName(matchedFile);
  state.files.deleteModal.deleting = false;
  renderFilesDeleteModal();
  setTimeout(() => {
    elements.filesDeleteConfirmBtn?.focus();
  }, 0);
}

function openFilesEditModal(fileId, { focusField = "" } = {}) {
  if (!state.files.me?.isAdmin) {
    return;
  }

  const matchedFile = state.files.list.find((entry) => String(entry?.id || "").trim() === String(fileId || "").trim()) || null;
  if (!matchedFile) {
    return;
  }

  state.files.editModal.fileId = String(matchedFile.id || "");
  state.files.editModal.focusField = focusField === "functions" ? "functions" : "description";
  state.files.editModal.message = "";
  state.files.editModal.messageKind = "";
  state.files.editModal.busy = false;
  setFilesAdminModalOpen("edit");
}

async function confirmFilesDeleteModal() {
  if (!state.files.me?.isAdmin) {
    closeFilesDeleteModal({ force: true });
    return;
  }

  const fileId = state.files.deleteModal.fileId;
  if (!fileId) {
    closeFilesDeleteModal({ force: true });
    return;
  }

  state.files.deleteModal.deleting = true;
  renderFilesDeleteModal();

  try {
    await requestJson(`/api/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE"
    });
    closeFilesDeleteModal({ force: true });
    setFilesUploadFeedback(t("files_delete_success"), "success");
    await refreshFilesList();
  } catch (error) {
    closeFilesDeleteModal({ force: true });
    setFilesUploadFeedback(String(error?.message || t("files_delete_error")), "error");
    renderFilesAccessView();
  }
}

function createFilesMetaItem(label, value, key = "") {
  const wrap = document.createElement("div");
  wrap.className = "files-meta-item";
  const normalizedKey = String(key || "").trim();
  if (normalizedKey) {
    wrap.dataset.metaKey = normalizedKey;
  }

  const labelEl = document.createElement("span");
  labelEl.className = "files-meta-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  valueEl.className = "files-meta-value";
  valueEl.textContent = value || t("files_unknown_value");

  wrap.appendChild(labelEl);
  wrap.appendChild(valueEl);
  return wrap;
}

function formatFilesDownloadCount(downloadCount) {
  const safeCount = Math.max(0, Number(downloadCount) || 0);
  if (safeCount === 1) {
    return t("files_download_count_value_one");
  }
  if (safeCount === 0) {
    return t("files_download_count_value_zero");
  }
  return t("files_download_count_value_many", { n: String(safeCount) });
}

function createFilesDescriptionBlock({
  description = "",
  imageUrl = "",
  imageName = "",
  fileName = "",
  fileId = "",
  functions = "",
  editFileId = "",
  allowEdit = false
} = {}) {
  const wrap = document.createElement("div");
  wrap.className = "files-description-block";

  const head = document.createElement("div");
  head.className = "files-description-head";

  const labelEl = document.createElement("span");
  labelEl.className = "files-meta-label";
  labelEl.textContent = t("files_description_label");
  head.appendChild(labelEl);

  const headRight = document.createElement("div");
  headRight.className = "files-description-head-right";

  const normalizedFileId = String(fileId || "").trim();
  const hasFunctions = Boolean(String(functions || "").trim());
  if (normalizedFileId && hasFunctions) {
    const functionsButton = document.createElement("button");
    functionsButton.type = "button";
    functionsButton.className = "files-btn files-detail-view-functions-btn";
    functionsButton.setAttribute("data-files-action", "open-functions-modal");
    functionsButton.setAttribute("data-file-id", normalizedFileId);
    functionsButton.textContent = t("files_functions_show_button");
    headRight.appendChild(functionsButton);
  }

  const normalizedEditFileId = String(editFileId || "").trim();
  if (allowEdit && normalizedEditFileId) {
    const pickerWrap = document.createElement("div");
    pickerWrap.className = "files-edit-picker-wrap";

    const pickerToggle = document.createElement("button");
    pickerToggle.type = "button";
    pickerToggle.className = "files-card-action files-description-edit-btn";
    pickerToggle.setAttribute("data-files-action", "toggle-edit-picker");
    pickerToggle.setAttribute("data-file-id", normalizedEditFileId);
    decorateFilesActionIconButton(pickerToggle, t("files_edit_open_button"), "edit");

    const picker = document.createElement("div");
    picker.className = "files-edit-picker";

    const descOption = document.createElement("button");
    descOption.type = "button";
    descOption.className = "files-btn files-edit-picker-option";
    descOption.setAttribute("data-files-action", "edit-metadata");
    descOption.setAttribute("data-file-id", normalizedEditFileId);
    descOption.setAttribute("data-edit-focus", "description");
    descOption.textContent = t("files_edit_picker_description");

    const fnOption = document.createElement("button");
    fnOption.type = "button";
    fnOption.className = "files-btn files-edit-picker-option";
    fnOption.setAttribute("data-files-action", "edit-metadata");
    fnOption.setAttribute("data-file-id", normalizedEditFileId);
    fnOption.setAttribute("data-edit-focus", "functions");
    fnOption.textContent = t("files_edit_picker_functions");

    picker.appendChild(descOption);
    picker.appendChild(fnOption);
    pickerWrap.appendChild(pickerToggle);
    pickerWrap.appendChild(picker);
    headRight.appendChild(pickerWrap);
  }

  if (headRight.childElementCount) {
    head.appendChild(headRight);
  }

  const valueEl = document.createElement("div");
  valueEl.className = "files-description-value";
  renderFilesDescriptionContent(valueEl, description, {
    emptyText: t("files_unknown_value")
  });

  wrap.appendChild(head);
  wrap.appendChild(valueEl);

  const resolvedImageUrl = String(imageUrl || "").trim();
  if (resolvedImageUrl) {
    const imageWrap = document.createElement("figure");
    imageWrap.className = "files-description-image";

    const imageEl = document.createElement("img");
    imageEl.className = "files-description-image-media";
    imageEl.src = resolvedImageUrl;
    imageEl.alt = String(imageName || fileName || t("files_description_label"));
    imageEl.loading = "lazy";
    imageEl.decoding = "async";

    imageWrap.appendChild(imageEl);
    wrap.appendChild(imageWrap);
  }

  return wrap;
}

function renderFilesFunctionsContent(container, text) {
  container.innerHTML = "";

  const raw = String(text || "").trim();
  if (!raw) {
    const emptyEl = document.createElement("p");
    emptyEl.className = "files-functions-empty";
    emptyEl.textContent = t("files_functions_empty");
    container.appendChild(emptyEl);
    return { itemCount: 0 };
  }

  const lines = raw.split("\n");
  const sections = [];
  let pendingHeading = "";
  let currentSection = null;
  let itemCount = 0;

  const getNextMeaningfulLine = (startIndex) => {
    for (let i = startIndex + 1; i < lines.length; i += 1) {
      const candidate = lines[i].trim();
      if (candidate) {
        return candidate;
      }
    }
    return "";
  };

  const isPlainSectionHeading = (line, index) => {
    const nextLine = getNextMeaningfulLine(index);
    if (!nextLine.startsWith("* ")) {
      return false;
    }
    if (line.length > 48 && !line.endsWith(":")) {
      return false;
    }
    if (/[.!?]$/.test(line)) {
      return false;
    }
    return true;
  };

  const startSection = ({ title = "", heading = "" } = {}) => {
    currentSection = {
      heading: heading || pendingHeading,
      title: title.trim(),
      items: [],
      text: []
    };
    pendingHeading = "";
    sections.push(currentSection);
    return currentSection;
  };

  const ensureSection = () => {
    if (currentSection) {
      return currentSection;
    }
    return startSection();
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      continue;
    }

    if (line.startsWith("### ")) {
      pendingHeading = line.slice(4).trim();
      currentSection = null;
      continue;
    }

    if (/^\*\*(.+)\*\*$/.test(line)) {
      startSection({ title: line.slice(2, -2).trim() });
      continue;
    }

    if (line.startsWith("* ")) {
      const section = ensureSection();
      section.items.push(line.slice(2).trim());
      itemCount += 1;
      continue;
    }

    if (isPlainSectionHeading(line, index)) {
      startSection({ title: line.replace(/:$/, "").trim() });
      continue;
    }

    const section = ensureSection();
    section.text.push(line);
  }

  for (const section of sections) {
    const block = document.createElement("section");
    block.className = "files-functions-group";

    if (section.heading || section.title) {
      const head = document.createElement("div");
      head.className = "files-functions-group-head";

      if (section.heading) {
        const headingEl = document.createElement("p");
        headingEl.className = "files-functions-heading";
        headingEl.textContent = section.heading;
        head.appendChild(headingEl);
      }

      if (section.title) {
        const titleEl = document.createElement("p");
        titleEl.className = "files-functions-section";
        titleEl.textContent = section.title;
        head.appendChild(titleEl);
      }

      block.appendChild(head);
    }

    if (section.text.length) {
      const copy = document.createElement("div");
      copy.className = "files-functions-copy";
      for (const paragraph of section.text) {
        const textEl = document.createElement("p");
        textEl.className = "files-functions-text";
        textEl.textContent = paragraph;
        copy.appendChild(textEl);
      }
      block.appendChild(copy);
    }

    if (section.items.length) {
      const list = document.createElement("ul");
      list.className = "files-functions-list";
      for (const entry of section.items) {
        const li = document.createElement("li");
        li.className = "files-functions-item";
        li.textContent = entry;
        list.appendChild(li);
      }
      block.appendChild(list);
    }

    container.appendChild(block);
  }

  return { itemCount };
}

function createFilesFunctionsBlock({ fileId = "", editFileId = "", allowEdit = false } = {}) {
  const wrap = document.createElement("div");
  wrap.className = "files-functions-block";

  const head = document.createElement("div");
  head.className = "files-functions-head";

  const labelEl = document.createElement("span");
  labelEl.className = "files-meta-label";
  labelEl.textContent = t("files_functions_label");
  head.appendChild(labelEl);

  const headRight = document.createElement("div");
  headRight.className = "files-functions-head-right";

  const normalizedFileId = String(fileId || "").trim();
  if (normalizedFileId) {
    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "files-btn files-functions-toggle";
    openButton.setAttribute("data-files-action", "open-functions-modal");
    openButton.setAttribute("data-file-id", normalizedFileId);
    openButton.textContent = t("files_functions_show_button");
    headRight.appendChild(openButton);
  }

  const normalizedEditFileId = String(editFileId || "").trim();
  if (allowEdit && normalizedEditFileId) {
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "files-card-action files-description-edit-btn";
    editButton.setAttribute("data-files-action", "edit-metadata");
    editButton.setAttribute("data-file-id", normalizedEditFileId);
    decorateFilesActionIconButton(editButton, t("files_edit_open_button"), "edit");
    headRight.appendChild(editButton);
  }

  head.appendChild(headRight);
  wrap.appendChild(head);
  return wrap;
}

function createFilesOutdatedNotice() {
  const notice = document.createElement("div");
  notice.className = "files-outdated-notice";

  const title = document.createElement("strong");
  title.className = "files-outdated-notice-title";
  title.textContent = t("files_outdated_notice_title");

  const body = document.createElement("span");
  body.className = "files-outdated-notice-body";
  body.textContent = t("files_outdated_notice_body");

  notice.appendChild(title);
  notice.appendChild(body);
  return notice;
}

function createFilesCautionNotice() {
  const notice = document.createElement("div");
  notice.className = "files-outdated-notice files-caution-notice";

  const title = document.createElement("strong");
  title.className = "files-outdated-notice-title";
  title.textContent = t("files_caution_notice_title");

  const body = document.createElement("span");
  body.className = "files-outdated-notice-body";
  body.textContent = t("files_caution_notice_body");

  notice.appendChild(title);
  notice.appendChild(body);
  return notice;
}

function createFilesUntestedNotice() {
  const notice = document.createElement("div");
  notice.className = "files-outdated-notice files-untested-notice";

  const title = document.createElement("strong");
  title.className = "files-outdated-notice-title";
  title.textContent = t("files_untested_notice_title");

  const body = document.createElement("span");
  body.className = "files-outdated-notice-body";
  body.textContent = t("files_untested_notice_body");

  notice.appendChild(title);
  notice.appendChild(body);
  return notice;
}

function appendFilesOutdatedBadge(container, file) {
  if (!(container instanceof HTMLElement) || !normalizeFilesBooleanFlag(file?.outdated)) {
    return;
  }

  const outdatedBadge = document.createElement("span");
  outdatedBadge.className = "files-file-badge is-outdated";
  outdatedBadge.textContent = t("files_outdated_badge");
  container.appendChild(outdatedBadge);
}

function appendFilesCautionBadge(container, file) {
  if (!(container instanceof HTMLElement) || !normalizeFilesBooleanFlag(file?.caution)) {
    return;
  }

  const cautionBadge = document.createElement("span");
  cautionBadge.className = "files-file-badge is-caution";
  cautionBadge.textContent = t("files_caution_badge");
  container.appendChild(cautionBadge);
}

function appendFilesUntestedBadge(container, file) {
  if (!(container instanceof HTMLElement) || !normalizeFilesBooleanFlag(file?.untested)) {
    return;
  }

  const untestedBadge = document.createElement("span");
  untestedBadge.className = "files-file-badge is-untested";
  untestedBadge.textContent = t("files_untested_badge");
  container.appendChild(untestedBadge);
}

function buildFilesDetailRenderKey(file, { isAdmin = false } = {}) {
  const safeFile = file && typeof file === "object" ? file : {};
  return [
    state.lang,
    isAdmin ? "1" : "0",
    String(safeFile.id || ""),
    String(safeFile.name || safeFile.originalName || ""),
    String(safeFile.displayName || ""),
    String(safeFile.mimeType || safeFile.type || ""),
    String(Math.max(0, Number(safeFile.size) || 0)),
    String(safeFile.uploadedAt || safeFile.uploaded_at || ""),
    String(safeFile.updatedAt || safeFile.updated_at || ""),
    String(Math.max(0, Number(safeFile.downloadCount) || 0)),
    normalizeFilesGroup(safeFile.group),
    String(safeFile.description || ""),
    normalizeFilesBooleanFlag(safeFile.outdated) ? "1" : "0",
    normalizeFilesBooleanFlag(safeFile.untested) ? "1" : "0",
    normalizeFilesBooleanFlag(safeFile.caution) ? "1" : "0",
    String(safeFile.uploader || safeFile.uploaderDiscordId || ""),
    String(safeFile.imageUrl || ""),
    String(safeFile.imageName || ""),
    safeFile.hasImage ? "1" : "0",
    String(safeFile.functions || ""),
    JSON.stringify(Array.isArray(safeFile.versions) ? safeFile.versions : [])
  ].join("|");
}

function createFilesActionIcon(kind) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("files-card-action-icon");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("aria-hidden", "true");

  const appendShape = (tagName, attrs) => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tagName);
    Object.entries(attrs).forEach(([name, value]) => {
      node.setAttribute(name, value);
    });
    svg.appendChild(node);
  };

  if (kind === "share") {
    appendShape("path", { d: "M14 5h5v5" });
    appendShape("path", { d: "M10 14 19 5" });
    appendShape("path", { d: "M19 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" });
    return svg;
  }

  if (kind === "download") {
    appendShape("path", { d: "M12 4v10" });
    appendShape("path", { d: "m7.5 10.5 4.5 4.5 4.5-4.5" });
    appendShape("path", { d: "M5 19h14" });
    return svg;
  }

  if (kind === "download-blocked") {
    appendShape("path", { d: "M12 6.25v7.25" });
    appendShape("path", { d: "m8.75 10.75 3.25 3.25 3.25-3.25" });
    appendShape("path", { d: "M7 18h10" });
    appendShape("path", { d: "M6 6 18 18" });
    return svg;
  }

  if (kind === "edit") {
    appendShape("path", { d: "M4 20h4.5l10-10a1.8 1.8 0 0 0 0-2.5l-2-2a1.8 1.8 0 0 0-2.5 0L4 15.5V20" });
    appendShape("path", { d: "m12.5 7 4.5 4.5" });
    return svg;
  }

  if (kind === "replace") {
    appendShape("path", { d: "M20 7v5h-5" });
    appendShape("path", { d: "M20 12a8 8 0 0 0-13.8-4.8L4 9.5" });
    appendShape("path", { d: "M4 17v-5h5" });
    appendShape("path", { d: "M4 12a8 8 0 0 0 13.8 4.8L20 14.5" });
    return svg;
  }

  if (kind === "copied") {
    appendShape("path", { d: "M20 6 9 17l-5-5" });
    return svg;
  }

  if (kind === "error") {
    appendShape("circle", { cx: "12", cy: "12", r: "8" });
    appendShape("path", { d: "M12 8v4.5" });
    appendShape("path", { d: "M12 16h.01" });
    return svg;
  }

  appendShape("path", { d: "M4 7h16" });
  appendShape("path", { d: "M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" });
  appendShape("path", { d: "M7.5 7 8.4 18.5A1.5 1.5 0 0 0 9.9 20h4.2a1.5 1.5 0 0 0 1.5-1.5L16.5 7" });
  appendShape("path", { d: "M10 10.25v6.5" });
  appendShape("path", { d: "M14 10.25v6.5" });
  return svg;
}

function decorateFilesActionIconButton(button, label, kind, { busy = false } = {}) {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }
  button.classList.add("is-icon");
  button.classList.toggle("is-busy", Boolean(busy));
  button.setAttribute("aria-label", label);
  button.setAttribute("data-tooltip", label);
  button.removeAttribute("title");
  button.replaceChildren(createFilesActionIcon(kind));
}

function createFilesAdminEditForm(file, { focusField = "description" } = {}) {
  if (!state.files.me?.isAdmin) {
    return null;
  }

  const fileId = String(file.id || "").trim();
  if (!fileId) {
    return null;
  }

  const isBusy = Boolean(state.files.editModal.busy);
  const isFunctionsMode = focusField === "functions";

  const form = document.createElement("form");
  form.className = "files-edit-modal-form";
  form.noValidate = true;
  form.setAttribute("data-files-edit-form", "true");
  form.setAttribute("data-files-edit-modal-form", "true");
  form.setAttribute("data-file-id", fileId);
  form.setAttribute("data-edit-mode", isFunctionsMode ? "functions" : "description");

  const grid = document.createElement("div");
  grid.className = "files-upload-grid files-edit-grid";

  const controlsShell = document.createElement("section");
  controlsShell.className = "files-upload-shell files-edit-shell";

  const controlsHead = document.createElement("div");
  controlsHead.className = "files-upload-shell-head";

  const controlsLabel = document.createElement("p");
  controlsLabel.className = "files-upload-shell-label";
  controlsLabel.textContent = t("files_edit_modal_details_label");
  controlsHead.appendChild(controlsLabel);

  const controlsHint = document.createElement("p");
  controlsHint.className = "files-upload-shell-hint";
  controlsHint.textContent = t("files_edit_modal_details_hint");
  controlsHead.appendChild(controlsHint);

  controlsShell.appendChild(controlsHead);

  const groupField = document.createElement("div");
  groupField.className = "files-upload-field";

  const descriptionLabel = document.createElement("label");
  descriptionLabel.className = "files-edit-label";
  descriptionLabel.textContent = t("files_edit_group_label");
  descriptionLabel.setAttribute("for", `filesEditGroup-${fileId}`);
  groupField.appendChild(descriptionLabel);

  const groupInput = document.createElement("input");
  groupInput.id = `filesEditGroup-${fileId}`;
  groupInput.className = "files-upload-text files-edit-group";
  groupInput.name = "group";
  groupInput.type = "text";
  groupInput.maxLength = 80;
  groupInput.value = normalizeFilesGroup(file.group || "");
  groupInput.placeholder = t("files_upload_group_placeholder");
  groupInput.disabled = isBusy;
  groupField.appendChild(groupInput);
  controlsShell.appendChild(groupField);

  const groupSuggestField = document.createElement("div");
  groupSuggestField.className = "files-upload-field";

  const groupSuggestDropdown = createFilesGroupSuggestionDropdown(groupInput.id, groupInput.value);
  const groupSuggestToggle = groupSuggestDropdown.querySelector("[data-files-group-suggest-toggle]");
  if (groupSuggestToggle instanceof HTMLButtonElement) {
    groupSuggestToggle.disabled = isBusy;
  }
  groupSuggestField.appendChild(groupSuggestDropdown);
  controlsShell.appendChild(groupSuggestField);

  const imageField = document.createElement("div");
  imageField.className = "files-upload-field";

  const imageLabel = document.createElement("label");
  imageLabel.className = "files-edit-label";
  imageLabel.textContent = t("files_edit_image_label");
  imageLabel.setAttribute("for", `filesEditImage-${fileId}`);
  imageField.appendChild(imageLabel);

  const imageInput = document.createElement("input");
  imageInput.id = `filesEditImage-${fileId}`;
  imageInput.className = "files-upload-input files-upload-image-input files-edit-image";
  imageInput.name = "image";
  imageInput.type = "file";
  imageInput.accept = "image/*";
  imageInput.disabled = isBusy;
  imageField.appendChild(imageInput);
  controlsShell.appendChild(imageField);

  if (file.hasImage || file.imageUrl) {
    const removeWrap = document.createElement("label");
    removeWrap.className = "files-edit-remove";

    const removeInput = document.createElement("input");
    removeInput.type = "checkbox";
    removeInput.name = "removeImage";
    removeInput.value = "1";
    removeInput.disabled = isBusy;

    const removeText = document.createElement("span");
    removeText.textContent = t("files_edit_remove_image_label");

    removeWrap.appendChild(removeInput);
    removeWrap.appendChild(removeText);
    controlsShell.appendChild(removeWrap);
  }

  const toggleGroup = document.createElement("div");
  toggleGroup.className = "files-upload-toggle-group";

  const outdatedWrap = document.createElement("label");
  outdatedWrap.className = "files-edit-toggle";

  const outdatedInput = document.createElement("input");
  outdatedInput.type = "checkbox";
  outdatedInput.name = "outdated";
  outdatedInput.value = "1";
  outdatedInput.checked = normalizeFilesBooleanFlag(file.outdated);
  outdatedInput.disabled = isBusy;

  const outdatedText = document.createElement("span");
  outdatedText.textContent = t("files_edit_outdated_label");

  outdatedWrap.appendChild(outdatedInput);
  outdatedWrap.appendChild(outdatedText);
  toggleGroup.appendChild(outdatedWrap);

  const untestedWrap = document.createElement("label");
  untestedWrap.className = "files-edit-toggle files-edit-toggle-untested";

  const untestedInput = document.createElement("input");
  untestedInput.type = "checkbox";
  untestedInput.name = "untested";
  untestedInput.value = "1";
  untestedInput.checked = normalizeFilesBooleanFlag(file.untested);
  untestedInput.disabled = isBusy;

  const untestedText = document.createElement("span");
  untestedText.textContent = t("files_edit_untested_label");

  untestedWrap.appendChild(untestedInput);
  untestedWrap.appendChild(untestedText);
  toggleGroup.appendChild(untestedWrap);

  const cautionWrap = document.createElement("label");
  cautionWrap.className = "files-edit-toggle files-edit-toggle-caution";

  const cautionInput = document.createElement("input");
  cautionInput.type = "checkbox";
  cautionInput.name = "caution";
  cautionInput.value = "1";
  cautionInput.checked = normalizeFilesBooleanFlag(file.caution);
  cautionInput.disabled = isBusy;

  const cautionText = document.createElement("span");
  cautionText.textContent = t("files_edit_caution_label");

  cautionWrap.appendChild(cautionInput);
  cautionWrap.appendChild(cautionText);
  toggleGroup.appendChild(cautionWrap);
  controlsShell.appendChild(toggleGroup);

  const descriptionShell = document.createElement("section");
  descriptionShell.className = "files-upload-shell files-edit-shell files-edit-shell-description";

  const descriptionHead = document.createElement("div");
  descriptionHead.className = "files-upload-shell-head";

  const descriptionHeadLabel = document.createElement("p");
  descriptionHeadLabel.className = "files-upload-shell-label";
  descriptionHeadLabel.textContent = isFunctionsMode
    ? t("files_edit_modal_functions_label")
    : t("files_edit_modal_description_label");
  descriptionHead.appendChild(descriptionHeadLabel);

  const descriptionHeadHint = document.createElement("p");
  descriptionHeadHint.className = "files-upload-shell-hint";
  descriptionHeadHint.textContent = isFunctionsMode
    ? t("files_edit_modal_functions_hint")
    : t("files_edit_modal_description_hint");
  descriptionHead.appendChild(descriptionHeadHint);

  descriptionShell.appendChild(descriptionHead);

  if (!isFunctionsMode) {
    const descriptionField = document.createElement("div");
    descriptionField.className = "files-upload-field";

    const descriptionFieldLabel = document.createElement("label");
    descriptionFieldLabel.className = "files-edit-label";
    descriptionFieldLabel.textContent = t("files_edit_description_label");
    descriptionFieldLabel.setAttribute("for", `filesEditDescription-${fileId}`);
    descriptionField.appendChild(descriptionFieldLabel);

    const descriptionInput = document.createElement("textarea");
    descriptionInput.id = `filesEditDescription-${fileId}`;
    descriptionInput.className = "files-upload-description files-edit-description";
    descriptionInput.name = "description";
    descriptionInput.rows = 4;
    descriptionInput.maxLength = 900;
    descriptionInput.value = String(file.description || "").trim();
    descriptionInput.placeholder = t("files_upload_description_placeholder");
    descriptionInput.disabled = isBusy;
    descriptionField.appendChild(descriptionInput);
    descriptionShell.appendChild(descriptionField);
  }

  if (isFunctionsMode) {
    const functionsField = document.createElement("div");
    functionsField.className = "files-upload-field";

    const functionsFieldLabel = document.createElement("label");
    functionsFieldLabel.className = "files-edit-label";
    functionsFieldLabel.textContent = t("files_edit_functions_label");
    functionsFieldLabel.setAttribute("for", `filesEditFunctions-${fileId}`);
    functionsField.appendChild(functionsFieldLabel);

    const functionsFieldHint = document.createElement("p");
    functionsFieldHint.className = "files-upload-shell-hint files-edit-functions-hint";
    functionsFieldHint.textContent = t("files_edit_functions_hint");
    functionsField.appendChild(functionsFieldHint);

    const functionsInput = document.createElement("textarea");
    functionsInput.id = `filesEditFunctions-${fileId}`;
    functionsInput.className = "files-upload-description files-edit-description files-edit-functions";
    functionsInput.name = "functions";
    functionsInput.rows = 12;
    functionsInput.maxLength = 4000;
    functionsInput.value = String(file.functions || "").trim();
    functionsInput.placeholder = t("files_edit_functions_placeholder");
    functionsInput.disabled = isBusy;
    functionsField.appendChild(functionsInput);
    descriptionShell.appendChild(functionsField);
  }

  if (isFunctionsMode) {
    grid.className = "files-edit-grid-single";
    grid.appendChild(descriptionShell);
  } else {
    grid.appendChild(controlsShell);
    grid.appendChild(descriptionShell);
  }
  form.appendChild(grid);

  const actions = document.createElement("div");
  actions.className = "files-upload-submit-row files-edit-submit-row";

  const saveButton = document.createElement("button");
  saveButton.type = "submit";
  saveButton.className = "files-btn";
  saveButton.textContent = isBusy ? t("files_edit_save_busy") : t("files_edit_save_button");
  saveButton.disabled = isBusy;
  actions.appendChild(saveButton);

  form.appendChild(actions);
  return form;
}

function renderFilesDetailCard(file) {
  if (!elements.filesList) {
    return;
  }

  const fileId = String(file.id || "");
  const fileName = getFilesDisplayName(file);
  const fileType = resolveFileTypeLabel(file);
  const fileSize = formatFileSize(file.size);
  const timestampMeta = resolveFilesTimestampMeta(file);
  const description = String(file.description || "").trim();
  const functions = String(file.functions || "").trim();
  const downloadCount = Math.max(0, Number(file.downloadCount) || 0);
  const group = getFilesGroupDisplayLabel(file);
  const uploader = String(file.uploader || file.uploaderDiscordId || t("files_unknown_value"));
  const imageUrl = String(file.imageUrl || "").trim();
  const imageName = String(file.imageName || "").trim();
  const isReplacing = String(state.files.replace.fileId || "") === fileId;
  const isOutdated = normalizeFilesBooleanFlag(file.outdated);
  const isUntested = normalizeFilesBooleanFlag(file.untested);
  const hasCaution = normalizeFilesBooleanFlag(file.caution);

  const detailCard = document.createElement("article");
  detailCard.className = "panel files-detail-card";

  const detailTop = document.createElement("div");
  detailTop.className = "files-detail-top";

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "files-btn files-detail-back";
  backButton.textContent = t("files_back_to_index_button");
  backButton.setAttribute("data-files-action", "back-to-index");
  detailTop.appendChild(backButton);

  const title = document.createElement("p");
  title.className = "files-detail-title";
  title.textContent = fileName;
  detailTop.appendChild(title);

  const detailBody = document.createElement("div");
  detailBody.className = "files-detail-body";

  const metadata = document.createElement("div");
  metadata.className = "files-meta-grid";
  metadata.appendChild(createFilesMetaItem(t("files_name_label"), fileName));
  metadata.appendChild(createFilesMetaItem(t("files_type_label"), fileType));
  metadata.appendChild(createFilesMetaItem(t("files_size_label"), fileSize));
  metadata.appendChild(createFilesMetaItem(t("files_uploaded_label"), timestampMeta.uploadedDate));
  if (timestampMeta.hasUpdatedDate) {
    metadata.appendChild(createFilesMetaItem(t("files_updated_label"), timestampMeta.updatedDate));
  }
  metadata.appendChild(createFilesMetaItem(t("files_group_label"), group));
  metadata.appendChild(createFilesMetaItem(t("files_uploader_label"), uploader));
  metadata.appendChild(createFilesMetaItem(t("files_downloads_label"), formatFilesDownloadCount(downloadCount)));

  const descriptionBlock = createFilesDescriptionBlock({
    description,
    imageUrl,
    imageName,
    fileName,
    fileId,
    functions,
    editFileId: fileId,
    allowEdit: Boolean(state.files.me?.isAdmin)
  });

  const actions = document.createElement("div");
  actions.className = "files-card-actions files-detail-actions";

  const shareButton = document.createElement("button");
  shareButton.type = "button";
  shareButton.className = "files-card-action";
  shareButton.setAttribute("data-files-action", "share");
  shareButton.setAttribute("data-file-id", fileId);
  decorateFilesActionIconButton(shareButton, t("files_share_button"), "share");
  actions.appendChild(shareButton);

  const downloadButton = document.createElement("button");
  downloadButton.type = "button";
  downloadButton.className = "files-card-action";
  downloadButton.setAttribute("data-files-action", "download");
  downloadButton.setAttribute("data-file-id", fileId);
  if (isOutdated) {
    downloadButton.setAttribute("aria-disabled", "true");
  }
  downloadButton.classList.toggle("is-outdated", isOutdated);
  downloadButton.classList.toggle("is-caution", !isOutdated && hasCaution);
  decorateFilesActionIconButton(
    downloadButton,
    isOutdated
      ? t("files_outdated_badge")
      : hasCaution
        ? t("files_caution_badge")
        : t("files_download_button"),
    isOutdated ? "download-blocked" : "download"
  );
  actions.appendChild(downloadButton);

  if (state.files.me?.isAdmin) {
    const replaceInputId = `filesReplaceInput-${fileId}`;
    const replaceInput = document.createElement("input");
    replaceInput.id = replaceInputId;
    replaceInput.type = "file";
    replaceInput.hidden = true;
    replaceInput.setAttribute("data-files-replace-input", "true");
    replaceInput.setAttribute("data-file-id", fileId);

    const replaceButton = document.createElement("button");
    replaceButton.type = "button";
    replaceButton.className = "files-card-action";
    replaceButton.setAttribute("data-files-action", "replace");
    replaceButton.setAttribute("data-file-id", fileId);
    replaceButton.setAttribute("data-files-replace-input-id", replaceInputId);
    replaceButton.disabled = isReplacing;
    decorateFilesActionIconButton(
      replaceButton,
      isReplacing ? t("files_replace_button_busy") : t("files_replace_button"),
      "replace",
      { busy: isReplacing }
    );
    actions.appendChild(replaceButton);
    actions.appendChild(replaceInput);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "files-card-action is-delete";
    deleteButton.setAttribute("data-files-action", "delete");
    deleteButton.setAttribute("data-file-id", fileId);
    decorateFilesActionIconButton(deleteButton, t("files_delete_button"), "delete");
    actions.appendChild(deleteButton);
  }

  detailBody.appendChild(metadata);
  if (isOutdated) {
    detailBody.appendChild(createFilesOutdatedNotice());
  } else {
    if (isUntested) {
      detailBody.appendChild(createFilesUntestedNotice());
    }
    if (hasCaution) {
      detailBody.appendChild(createFilesCautionNotice());
    }
  }
  detailBody.appendChild(descriptionBlock);
  detailBody.appendChild(actions);

  detailCard.appendChild(detailTop);
  detailCard.appendChild(detailBody);
  elements.filesList.appendChild(detailCard);
  elements.filesList.dataset.detailRenderKey = buildFilesDetailRenderKey(file, {
    isAdmin: Boolean(state.files.me?.isAdmin)
  });
}

function getFilesDetailVersionEntries(file) {
  const fileId = String(file?.id || "").trim().toLowerCase();
  const rawVersions = Array.isArray(file?.versions) ? file.versions : [];
  const normalizedVersions = rawVersions
    .map((version, index) => {
      const versionId = String(version?.id || version?.versionId || fileId).trim().toLowerCase();
      const downloadId = String(version?.downloadId || version?.fileId || versionId || fileId).trim().toLowerCase();
      const isCurrent = Boolean(version?.current);
      const label = String(version?.label || version?.version || "").trim()
        || (isCurrent
          ? t("files_detail_current_version")
          : t("files_detail_version_label", { n: String(index + 1) }));
      return {
        id: versionId || fileId,
        label,
        name: String(version?.fileName || version?.displayName || version?.name || getFilesDisplayName(file)),
        size: Math.max(0, Number(version?.size) || Number(file?.size) || 0),
        mimeType: String(version?.mimeType || file?.mimeType || ""),
        uploadedAt: String(version?.uploadedAt || version?.createdAt || file?.uploadedAt || ""),
        current: isCurrent,
        downloadId: downloadId || fileId,
        versionId: isCurrent ? "" : String(version?.versionId || version?.id || "").trim().toLowerCase()
      };
    })
    .filter((version) => version.id || version.downloadId);

  if (!normalizedVersions.length) {
    return [{
      id: fileId,
      label: t("files_detail_current_version"),
      name: getFilesDisplayName(file),
      size: Math.max(0, Number(file?.size) || 0),
      mimeType: String(file?.mimeType || ""),
      uploadedAt: String(file?.contentUpdatedAt || file?.updatedAt || file?.uploadedAt || ""),
      current: true,
      downloadId: fileId
    }];
  }

  if (!normalizedVersions.some((version) => version.current)) {
    normalizedVersions[0].current = true;
  }
  return normalizedVersions;
}

function createFilesDetailActions(file, { compact = false } = {}) {
  const fileId = String(file?.id || "");
  const isReplacing = String(state.files.replace.fileId || "") === fileId;
  const isOutdated = normalizeFilesBooleanFlag(file?.outdated);
  const hasCaution = normalizeFilesBooleanFlag(file?.caution);
  const actions = document.createElement("div");
  actions.className = `files-card-actions files-detail-actions${compact ? " files-detail-modal-actions" : ""}`;
  if (compact) {
    actions.dataset.actionsLabel = t("files_detail_actions_title");
  }

  const shareButton = document.createElement("button");
  shareButton.type = "button";
  shareButton.className = "files-card-action";
  shareButton.setAttribute("data-files-action", "share");
  shareButton.setAttribute("data-file-id", fileId);
  decorateFilesActionIconButton(shareButton, t("files_share_button"), "share");
  actions.appendChild(shareButton);

  const downloadButton = document.createElement("button");
  downloadButton.type = "button";
  downloadButton.className = "files-card-action";
  downloadButton.setAttribute("data-files-action", "download");
  downloadButton.setAttribute("data-file-id", fileId);
  if (isOutdated) {
    downloadButton.setAttribute("aria-disabled", "true");
  }
  downloadButton.classList.toggle("is-outdated", isOutdated);
  downloadButton.classList.toggle("is-caution", !isOutdated && hasCaution);
  decorateFilesActionIconButton(
    downloadButton,
    isOutdated
      ? t("files_outdated_badge")
      : hasCaution
        ? t("files_caution_badge")
        : t("files_download_button"),
    isOutdated ? "download-blocked" : "download"
  );
  actions.appendChild(downloadButton);

  if (state.files.me?.isAdmin) {
    const replaceInputId = `filesReplaceInput-${fileId}`;
    const replaceInput = document.createElement("input");
    replaceInput.id = replaceInputId;
    replaceInput.type = "file";
    replaceInput.hidden = true;
    replaceInput.setAttribute("data-files-replace-input", "true");
    replaceInput.setAttribute("data-file-id", fileId);

    const replaceButton = document.createElement("button");
    replaceButton.type = "button";
    replaceButton.className = "files-card-action";
    replaceButton.setAttribute("data-files-action", "replace");
    replaceButton.setAttribute("data-file-id", fileId);
    replaceButton.setAttribute("data-files-replace-input-id", replaceInputId);
    replaceButton.disabled = isReplacing;
    decorateFilesActionIconButton(
      replaceButton,
      isReplacing ? t("files_replace_button_busy") : t("files_replace_button"),
      "replace",
      { busy: isReplacing }
    );
    actions.appendChild(replaceButton);
    actions.appendChild(replaceInput);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "files-card-action is-delete";
    deleteButton.setAttribute("data-files-action", "delete");
    deleteButton.setAttribute("data-file-id", fileId);
    decorateFilesActionIconButton(deleteButton, t("files_delete_button"), "delete");
    actions.appendChild(deleteButton);
  }

  return actions;
}

function createFilesVersionPanel(file) {
  const panel = document.createElement("section");
  panel.className = "files-detail-versions-panel";
  panel.setAttribute("aria-labelledby", "filesDetailVersionsTitle");

  const head = document.createElement("div");
  head.className = "files-detail-versions-head";

  const title = document.createElement("h3");
  title.id = "filesDetailVersionsTitle";
  title.textContent = t("files_detail_versions_title");
  head.appendChild(title);

  const hint = document.createElement("p");
  hint.textContent = t("files_detail_versions_hint");
  head.appendChild(hint);
  panel.appendChild(head);

  const list = document.createElement("div");
  list.className = "files-detail-version-list";

  const isOutdated = normalizeFilesBooleanFlag(file?.outdated);
  const versions = getFilesDetailVersionEntries(file);
  versions.forEach((version, index) => {
    const row = document.createElement("article");
    row.className = "files-detail-version-row";
    row.appendChild(createFilesTypeIcon(version, { compact: true }));

    const copy = document.createElement("div");
    copy.className = "files-detail-version-copy";

    const label = document.createElement("p");
    label.className = "files-detail-version-label";
    label.textContent = version.current
      ? `${version.label} / ${t("files_detail_version_current_tag")}`
      : version.label;
    copy.appendChild(label);

    const meta = document.createElement("p");
    meta.className = "files-detail-version-meta";
    const dateText = formatFileDateTime(version.uploadedAt);
    meta.textContent = [
      version.name,
      formatFileSize(version.size),
      resolveFileTypeLabel(version),
      dateText
    ].filter(Boolean).join(" / ");
    copy.appendChild(meta);
    row.appendChild(copy);

    const download = document.createElement("button");
    download.type = "button";
    download.className = "files-btn files-detail-version-download";
    download.setAttribute("data-files-action", "download");
    download.setAttribute("data-file-id", version.downloadId || file.id);
    if (version.versionId) {
      download.setAttribute("data-file-version-id", version.versionId);
    }
    download.textContent = isOutdated
      ? t("files_download_blocked_button")
      : index === 0
        ? t("files_detail_download_current")
        : t("files_detail_download_version");
    download.disabled = isOutdated;
    row.appendChild(download);

    list.appendChild(row);
  });

  panel.appendChild(list);
  return panel;
}

function closeFilesDetailModal({ clearLocation = true, render = true } = {}) {
  const hadSelection = Boolean(String(state.files.selectedId || "").trim());
  state.files.selectedId = "";
  state.files.detailOrigin = "";
  state.files.transition = "";
  if (clearLocation) {
    setFilesLocationSharedFile("");
  }
  if (render && hadSelection) {
    renderFilesList();
  } else if (render) {
    renderFilesDetailModal();
  }
}

function renderFilesDetailModal() {
  const selectedId = String(state.files.selectedId || "").trim();
  const selectedFile = selectedId
    ? state.files.list.find((entry) => String(entry.id || "") === selectedId) || null
    : null;
  const isOpen = Boolean(selectedFile) && !state.files.groupManager.open;

  if (elements.filesDetailOverlay) {
    elements.filesDetailOverlay.classList.toggle("is-active", isOpen);
    elements.filesDetailOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }
  if (elements.filesDetailModalPanel) {
    elements.filesDetailModalPanel.hidden = !isOpen;
  }
  if (!elements.filesDetailModalBody) {
    return;
  }
  elements.filesDetailModalBody.replaceChildren();
  if (!isOpen || !selectedFile) {
    return;
  }

  const fileId = String(selectedFile.id || "");
  const fileName = getFilesDisplayName(selectedFile);
  const fileType = resolveFileTypeLabel(selectedFile);
  const fileSize = formatFileSize(selectedFile.size);
  const timestampMeta = resolveFilesTimestampMeta(selectedFile);
  const description = String(selectedFile.description || "").trim();
  const functions = String(selectedFile.functions || "").trim();
  const downloadCount = Math.max(0, Number(selectedFile.downloadCount) || 0);
  const group = getFilesGroupDisplayLabel(selectedFile);
  const uploader = String(selectedFile.uploader || selectedFile.uploaderDiscordId || t("files_unknown_value"));
  const imageUrl = String(selectedFile.imageUrl || "").trim();
  const imageName = String(selectedFile.imageName || "").trim();
  const isOutdated = normalizeFilesBooleanFlag(selectedFile.outdated);
  const isUntested = normalizeFilesBooleanFlag(selectedFile.untested);
  const hasCaution = normalizeFilesBooleanFlag(selectedFile.caution);

  const hero = document.createElement("header");
  hero.className = "files-detail-modal-hero";
  hero.dataset.fileKind = resolveFilesTypeIconKind(selectedFile);
  hero.appendChild(createFilesTypeIcon(selectedFile));

  const heroCopy = document.createElement("div");
  heroCopy.className = "files-detail-modal-hero-copy";

  const eyebrow = document.createElement("p");
  eyebrow.className = "files-detail-modal-eyebrow";
  eyebrow.textContent = t("files_detail_modal_badge");
  heroCopy.appendChild(eyebrow);

  const title = document.createElement("h2");
  title.id = "filesDetailModalTitle";
  title.textContent = fileName;
  heroCopy.appendChild(title);

  const summary = document.createElement("div");
  summary.id = "filesDetailModalSummary";
  summary.className = "files-detail-modal-summary";
  summary.appendChild(createFilesDetailStat(t("files_type_label"), fileType));
  summary.appendChild(createFilesDetailStat(t("files_size_label"), fileSize));
  summary.appendChild(createFilesDetailStat(t("files_downloads_label"), formatFilesDownloadCount(downloadCount)));
  heroCopy.appendChild(summary);
  hero.appendChild(heroCopy);

  const heroStatus = document.createElement("div");
  heroStatus.className = "files-detail-modal-status-stack";
  [
    isOutdated ? t("files_outdated_badge") : "",
    !isOutdated && isUntested ? t("files_untested_badge") : "",
    !isOutdated && hasCaution ? t("files_caution_badge") : ""
  ].filter(Boolean).forEach((label) => {
    const badge = document.createElement("span");
    badge.className = "files-detail-modal-status-badge";
    badge.textContent = label;
    heroStatus.appendChild(badge);
  });
  if (!heroStatus.childElementCount) {
    const badge = document.createElement("span");
    badge.className = "files-detail-modal-status-badge is-stable";
    badge.textContent = t("files_detail_status_ready");
    heroStatus.appendChild(badge);
  }
  hero.appendChild(heroStatus);

  const layout = document.createElement("div");
  layout.className = "files-detail-modal-layout";

  const main = document.createElement("div");
  main.className = "files-detail-modal-main";

  if (isOutdated) {
    main.appendChild(createFilesOutdatedNotice());
  } else {
    if (isUntested) {
      main.appendChild(createFilesUntestedNotice());
    }
    if (hasCaution) {
      main.appendChild(createFilesCautionNotice());
    }
  }

  main.appendChild(createFilesDescriptionBlock({
    description,
    imageUrl,
    imageName,
    fileName,
    fileId,
    functions,
    editFileId: fileId,
    allowEdit: Boolean(state.files.me?.isAdmin)
  }));
  main.appendChild(createFilesVersionPanel(selectedFile));

  const aside = document.createElement("aside");
  aside.className = "files-detail-modal-aside";

  const asideTitle = document.createElement("p");
  asideTitle.className = "files-detail-modal-side-title";
  asideTitle.textContent = t("files_detail_info_title");
  aside.appendChild(asideTitle);
  aside.appendChild(createFilesDetailActions(selectedFile, { compact: true }));

  const metadata = document.createElement("div");
  metadata.className = "files-meta-grid files-detail-modal-meta";
  metadata.appendChild(createFilesMetaItem(t("files_name_label"), fileName, "name"));
  metadata.appendChild(createFilesMetaItem(t("files_type_label"), fileType, "type"));
  metadata.appendChild(createFilesMetaItem(t("files_size_label"), fileSize, "size"));
  metadata.appendChild(createFilesMetaItem(t("files_uploaded_label"), timestampMeta.uploadedDate, "uploaded"));
  if (timestampMeta.hasUpdatedDate) {
    metadata.appendChild(createFilesMetaItem(t("files_updated_label"), timestampMeta.updatedDate, "updated"));
  }
  metadata.appendChild(createFilesMetaItem(t("files_group_label"), group, "group"));
  metadata.appendChild(createFilesMetaItem(t("files_uploader_label"), uploader, "uploader"));
  metadata.appendChild(createFilesMetaItem(t("files_downloads_label"), formatFilesDownloadCount(downloadCount), "downloads"));
  aside.appendChild(metadata);

  layout.appendChild(main);
  layout.appendChild(aside);

  elements.filesDetailModalBody.appendChild(hero);
  elements.filesDetailModalBody.appendChild(layout);
}

function setFilesSessionRankEffect(element, text, rank = "") {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  const normalizedText = String(text || "");
  const normalizedRank = rank === "admin" || rank === "authorized" ? rank : "";

  element.textContent = normalizedText;
  element.classList.toggle("has-rank-effect", Boolean(normalizedRank));
  element.classList.toggle("is-admin", normalizedRank === "admin");
  element.classList.toggle("is-authorized", normalizedRank === "authorized");

  if (normalizedRank) {
    element.dataset.sessionRank = normalizedRank;
    element.dataset.sessionText = normalizedText;
    return;
  }

  delete element.dataset.sessionRank;
  delete element.dataset.sessionText;
}

function renderFilesSessionProfile({
  loggedIn,
  authorized,
  isAdmin,
  username,
  discordId,
  accessRequestStatus,
  accessRequestDecidedAt,
  accessDisclaimerDecision,
  disclaimerRequired
} = {}) {
  const unknown = t("files_unknown_value");
  const resolvedLoggedIn = Boolean(loggedIn);
  const resolvedAuthorized = Boolean(authorized) && resolvedLoggedIn;
  const resolvedAdmin = Boolean(isAdmin) && resolvedAuthorized;
  const resolvedRequestStatus = normalizeFilesAccessRequestStatus(accessRequestStatus);
  const resolvedDisclaimerDecision = normalizeFilesDisclaimerDecision(accessDisclaimerDecision);
  const requiresDisclaimer = Boolean(disclaimerRequired);
  const resolvedUsername = resolvedLoggedIn ? (String(username || "").trim() || unknown) : unknown;
  const resolvedDiscordId = resolvedLoggedIn ? (String(discordId || "").trim() || unknown) : unknown;
  const resolvedClearance = !resolvedLoggedIn
    ? unknown
    : resolvedAdmin
      ? t("files_session_clearance_admin")
      : resolvedAuthorized
        ? t("files_session_clearance_authorized")
        : t("files_session_clearance_unauthorized");
  const resolvedState = getFilesSessionStateLabel({
    loggedIn: resolvedLoggedIn,
    accessRequestStatus
  });
  const badgeText = !resolvedLoggedIn
    ? unknown
    : resolvedAdmin
      ? t("files_session_badge_admin")
      : resolvedAuthorized
        ? t("files_session_badge_authorized")
        : t("files_session_badge_unauthorized");
  const sessionRank = resolvedAdmin
    ? "admin"
    : (resolvedAuthorized ? "authorized" : "");

  if (elements.filesSessionUser) {
    setFilesSessionRankEffect(elements.filesSessionUser, resolvedUsername, sessionRank);
  }
  if (elements.filesSessionId) {
    elements.filesSessionId.textContent = resolvedDiscordId;
  }
  if (elements.filesSessionClearance) {
    setFilesSessionRankEffect(elements.filesSessionClearance, resolvedClearance, sessionRank);
  }
  if (elements.filesSessionState) {
    elements.filesSessionState.textContent = resolvedState;
  }
  if (elements.filesSessionBadge) {
    elements.filesSessionBadge.textContent = badgeText;
    elements.filesSessionBadge.classList.toggle("is-admin", resolvedAdmin);
  }
  const timerRow = elements.filesSessionTimerRow;
  const timerEl = elements.filesSessionTimer;
  if (timerRow && timerEl) {
    const approvalExpiryMs = resolvedRequestStatus === "approved"
      ? getFilesAccessExpiryMs(accessRequestDecidedAt)
      : null;
    const hadAuthorizedAccessBefore = resolvedAuthorized || (
      Boolean(approvalExpiryMs) && (!requiresDisclaimer || resolvedDisclaimerDecision === "accepted")
    );
    timerRow.hidden = !hadAuthorizedAccessBefore || !approvalExpiryMs;
    if (hadAuthorizedAccessBefore && approvalExpiryMs) {
      const expiryMs = approvalExpiryMs;
      timerEl.dataset.filesAccessTimer = String(expiryMs);
      const remaining = expiryMs - Date.now();
      if (remaining <= 0) {
        timerEl.textContent = t("files_access_timer_expired");
        timerRow.classList.add("is-expired");
        timerRow.classList.remove("is-warning");
      } else {
        timerEl.textContent = formatFilesAccessCountdown(expiryMs) || t("files_access_timer_expired");
        timerRow.classList.toggle("is-warning", remaining < 3 * 24 * 60 * 60 * 1000);
        timerRow.classList.remove("is-expired");
      }
    } else {
      delete timerEl.dataset.filesAccessTimer;
      timerEl.textContent = "--";
      timerRow.classList.remove("is-expired", "is-warning");
    }
  }
}

function createFilesRestrictedIncidentCode(seed = "") {
  const input = String(seed || "guest");
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33 + input.charCodeAt(index)) >>> 0;
  }
  return `FR-${hash.toString(16).toUpperCase().padStart(8, "0").slice(-6)}`;
}

function renderFilesRestrictedView({
  loggedIn,
  authorized,
  username,
  discordId,
  accessRequestStatus,
  accessRequestRequestedAt,
  accessRequestDecidedAt,
  accessRequestReapplyAt,
  accessRequestDeclineReason,
  accessDisclaimerDecision
} = {}) {
  if (!elements.filesRestrictedView) {
    return;
  }

  const resolvedLoggedIn = Boolean(loggedIn);
  const resolvedAuthorized = Boolean(authorized) && resolvedLoggedIn;
  const accessExpired = Boolean(state.files.localAccessExpired || isFilesAccessExpired({
    loggedIn: resolvedLoggedIn,
    accessRequestStatus,
    accessRequestDecidedAt
  }));
  const sharedRestrictedLanding = hasFilesSharedTargetInLocation()
    && resolvedLoggedIn
    && !resolvedAuthorized
    && !accessExpired;
  const cooldownActive = isFilesDeclinedCooldownActive({
    accessRequestStatus,
    accessRequestDecidedAt,
    accessRequestReapplyAt
  });
  const resolvedRequestStatus = normalizeFilesAccessRequestStatus(accessRequestStatus);
  const resolvedDisclaimerDecision = normalizeFilesDisclaimerDecision(accessDisclaimerDecision);
  const disclaimerGateActive = !accessExpired
    && resolvedRequestStatus === "approved"
    && !resolvedAuthorized
    && (resolvedDisclaimerDecision === "none" || resolvedDisclaimerDecision === "declined");
  const showRestricted = resolvedLoggedIn && !resolvedAuthorized && !cooldownActive && !disclaimerGateActive;
  elements.filesRestrictedView.hidden = !showRestricted;
  if (elements.filesRestrictedRequestFeedback) {
    if (!showRestricted) {
      elements.filesRestrictedRequestFeedback.hidden = true;
      elements.filesRestrictedRequestFeedback.textContent = "";
      elements.filesRestrictedRequestFeedback.classList.remove("is-error", "is-success");
    }
  }
  if (elements.filesRestrictedReasonInput && !showRestricted) {
    elements.filesRestrictedReasonInput.classList.remove("is-invalid");
  }
  if (!showRestricted) {
    return;
  }

  const unknown = t("files_unknown_value");
  const resolvedUsername = String(username || "").trim() || unknown;
  const resolvedDiscordId = String(discordId || "").trim() || unknown;
  const declineReason = String(accessRequestDeclineReason || "").trim();
  const hideReasonSection = resolvedRequestStatus === "pending";
  const incidentCode = createFilesRestrictedIncidentCode(resolvedDiscordId !== unknown ? resolvedDiscordId : resolvedUsername);
  const locale = state.lang === "es" ? "es-ES" : "en-US";

  if (elements.filesRestrictedReasonSection) {
    elements.filesRestrictedReasonSection.hidden = hideReasonSection;
  }
  if (hideReasonSection && elements.filesRestrictedReasonInput) {
    elements.filesRestrictedReasonInput.classList.remove("is-invalid");
  }

  if (elements.filesRestrictedIncident) {
    elements.filesRestrictedIncident.textContent = t("files_restricted_incident", { code: incidentCode });
  }
  if (elements.filesRestrictedBadge) {
    elements.filesRestrictedBadge.textContent = sharedRestrictedLanding
      ? t("files_share_restricted_badge")
      : accessExpired
        ? t("files_restricted_badge_expired")
        : t("files_restricted_badge");
  }
  if (elements.filesRestrictedTitle) {
    elements.filesRestrictedTitle.textContent = sharedRestrictedLanding
      ? t("files_share_restricted_title")
      : accessExpired
        ? t("files_restricted_title_expired")
        : t("files_restricted_title");
  }
  if (elements.filesRestrictedSubtitle) {
    const showDeclinedReason = resolvedRequestStatus === "declined" && Boolean(declineReason);
    elements.filesRestrictedSubtitle.textContent = accessExpired
      ? t("files_restricted_subtitle_expired")
      : showDeclinedReason
        ? sharedRestrictedLanding
          ? t("files_share_restricted_subtitle_declined_reason", { reason: declineReason })
          : t("files_restricted_subtitle_declined_reason", { reason: declineReason })
        : sharedRestrictedLanding
          ? t("files_share_restricted_subtitle")
          : t("files_restricted_subtitle");
  }
  if (elements.filesRestrictedPublicShareNote) {
    elements.filesRestrictedPublicShareNote.hidden = !sharedRestrictedLanding;
    elements.filesRestrictedPublicShareNote.textContent = t("files_share_restricted_public_note");
  }
  if (elements.filesRestrictedIdentityValue) {
    elements.filesRestrictedIdentityValue.textContent = resolvedUsername;
  }
  if (elements.filesRestrictedDiscordValue) {
    elements.filesRestrictedDiscordValue.textContent = resolvedDiscordId;
  }
  if (elements.filesRestrictedClearanceValue) {
    elements.filesRestrictedClearanceValue.textContent = t("files_session_clearance_unauthorized");
  }
  if (elements.filesRestrictedStatusValue) {
    elements.filesRestrictedStatusValue.textContent = accessExpired
      ? t("files_restricted_status_expired")
      : getFilesAccessRequestStatusLabel(resolvedRequestStatus);
  }
  if (elements.filesRestrictedTimeLabel) {
    elements.filesRestrictedTimeLabel.textContent = accessExpired
      ? t("files_restricted_time_label_expired")
      : t("files_restricted_time_label");
  }
  if (elements.filesRestrictedTimeValue) {
    let checkpointSource = String(accessRequestDecidedAt || accessRequestRequestedAt || "").trim();
    if (accessExpired && accessRequestDecidedAt) {
      const expiryMs = getFilesAccessExpiryMs(accessRequestDecidedAt);
      if (expiryMs) checkpointSource = new Date(expiryMs).toISOString();
    }
    const checkpointDate = checkpointSource ? new Date(checkpointSource) : new Date();
    const safeDate = Number.isNaN(checkpointDate.getTime()) ? new Date() : checkpointDate;
    elements.filesRestrictedTimeValue.textContent = safeDate.toLocaleString(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }
  if (elements.filesRestrictedDirectiveTitle) {
    elements.filesRestrictedDirectiveTitle.textContent = sharedRestrictedLanding
      ? t("files_share_restricted_directive_title")
      : accessExpired
        ? t("files_restricted_directive_title_expired")
        : t("files_restricted_directive_title");
  }
  if (elements.filesRestrictedDirectiveLine1) {
    elements.filesRestrictedDirectiveLine1.textContent = sharedRestrictedLanding
      ? t("files_share_restricted_directive_line_1")
      : accessExpired
        ? t("files_restricted_directive_expired_line_1")
        : t("files_restricted_directive_line_1");
  }
  if (elements.filesRestrictedDirectiveLine2) {
    elements.filesRestrictedDirectiveLine2.textContent = sharedRestrictedLanding
      ? t("files_share_restricted_directive_line_2")
      : accessExpired
        ? t("files_restricted_directive_expired_line_2")
        : t("files_restricted_directive_line_2");
  }
  if (elements.filesRestrictedDirectiveLine3) {
    elements.filesRestrictedDirectiveLine3.hidden = accessExpired;
    elements.filesRestrictedDirectiveLine3.textContent = sharedRestrictedLanding
      ? t("files_share_restricted_directive_line_3")
      : accessExpired
        ? ""
        : t("files_restricted_directive_line_3");
  }
  if (elements.filesRestrictedRequestFeedback) {
    const hasMessage = Boolean(state.files.accessRequestMessage);
    elements.filesRestrictedRequestFeedback.hidden = !hasMessage;
    elements.filesRestrictedRequestFeedback.textContent = hasMessage ? state.files.accessRequestMessage : "";
    elements.filesRestrictedRequestFeedback.classList.toggle("is-success", state.files.accessRequestMessageKind === "success");
    elements.filesRestrictedRequestFeedback.classList.toggle("is-error", state.files.accessRequestMessageKind === "error");
  }
}

function updateFilesDeniedCountdown(nowMs = Date.now()) {
  if (!elements.filesDeniedView || elements.filesDeniedView.hidden || !elements.filesDeniedCountdownValue) {
    return;
  }

  const me = normalizeFilesProfile(state.files.me);
  const remainingMs = getFilesDeclinedCooldownRemainingMs(me, nowMs);
  if (remainingMs <= 0) {
    elements.filesDeniedCountdownValue.textContent = t("files_denied_countdown_ready");
    renderFilesAccessView();
    return;
  }

  elements.filesDeniedCountdownValue.textContent = formatMinervaCountdown(remainingMs);
}

function renderFilesDeniedView({
  loggedIn,
  authorized,
  accessRequestStatus,
  accessRequestDecidedAt,
  accessRequestReapplyAt,
  accessRequestDeclineReason
} = {}) {
  if (!elements.filesDeniedView) {
    return;
  }

  const resolvedLoggedIn = Boolean(loggedIn);
  const resolvedAuthorized = Boolean(authorized) && resolvedLoggedIn;
  const resolvedStatus = normalizeFilesAccessRequestStatus(accessRequestStatus);
  const declineReason = String(accessRequestDeclineReason || "").trim();
  const remainingMs = getFilesDeclinedCooldownRemainingMs({
    accessRequestStatus: resolvedStatus,
    accessRequestDecidedAt,
    accessRequestReapplyAt
  });
  const showDenied = resolvedLoggedIn && !resolvedAuthorized && resolvedStatus === "declined" && remainingMs > 0;
  elements.filesDeniedView.hidden = !showDenied;
  if (!showDenied) {
    return;
  }

  const reapplyAtMs = resolveFilesReapplyAtMs({
    accessRequestStatus: resolvedStatus,
    accessRequestDecidedAt,
    accessRequestReapplyAt
  });
  const reapplyAtDate = Number.isFinite(reapplyAtMs) && reapplyAtMs > 0
    ? new Date(reapplyAtMs)
    : null;

  if (elements.filesDeniedSubtitle) {
    elements.filesDeniedSubtitle.textContent = t("files_denied_subtitle");
  }
  if (elements.filesDeniedReasonSection) {
    const showReason = declineReason.length > 0;
    elements.filesDeniedReasonSection.hidden = !showReason;
    if (elements.filesDeniedReasonValue) {
      elements.filesDeniedReasonValue.textContent = showReason ? declineReason : t("files_unknown_value");
    }
  }

  if (elements.filesDeniedStatusValue) {
    elements.filesDeniedStatusValue.textContent = t("files_denied_status_value");
  }
  if (elements.filesDeniedNextWindowValue) {
    elements.filesDeniedNextWindowValue.textContent = reapplyAtDate
      ? formatFileDateTime(reapplyAtDate.toISOString())
      : t("files_unknown_value");
  }

  updateFilesDeniedCountdown();
}

function setFilesDisclaimerGateFeedback(message = "", kind = "") {
  state.files.disclaimerGate.message = String(message || "");
  state.files.disclaimerGate.messageKind = kind === "success" ? "success" : kind === "error" ? "error" : "";
}

function clearFilesDisclaimerAcceptTransitionTimer() {
  if (!filesDisclaimerAcceptTransitionTimer) {
    return;
  }
  clearTimeout(filesDisclaimerAcceptTransitionTimer);
  filesDisclaimerAcceptTransitionTimer = null;
}

function startFilesDisclaimerAcceptTransition() {
  clearFilesDisclaimerAcceptTransitionTimer();
  state.files.disclaimerGate.acceptTransitionActive = true;
  state.files.disclaimerGate.acceptTransitionExiting = false;
  state.files.disclaimerGate.acceptTransitionStartedAt = Date.now();
}

function stopFilesDisclaimerAcceptTransition({ immediate = false } = {}) {
  clearFilesDisclaimerAcceptTransitionTimer();
  if (immediate) {
    state.files.disclaimerGate.acceptTransitionActive = false;
    state.files.disclaimerGate.acceptTransitionExiting = false;
    state.files.disclaimerGate.acceptTransitionStartedAt = 0;
    return;
  }

  if (!state.files.disclaimerGate.acceptTransitionActive) {
    state.files.disclaimerGate.acceptTransitionExiting = false;
    state.files.disclaimerGate.acceptTransitionStartedAt = 0;
    return;
  }

  state.files.disclaimerGate.acceptTransitionExiting = true;
  if (state.view === "files" && document.body.classList.contains("is-files")) {
    renderFilesAccessView();
  }
  filesDisclaimerAcceptTransitionTimer = setTimeout(() => {
    filesDisclaimerAcceptTransitionTimer = null;
    state.files.disclaimerGate.acceptTransitionActive = false;
    state.files.disclaimerGate.acceptTransitionExiting = false;
    state.files.disclaimerGate.acceptTransitionStartedAt = 0;
    if (state.view === "files" && document.body.classList.contains("is-files")) {
      renderFilesAccessView();
    }
  }, FILES_DISCLAIMER_ACCEPT_FADE_MS);
}

function resetFilesDisclaimerGateContactState({ clearText = true } = {}) {
  state.files.disclaimerGate.contactOpen = false;
  state.files.disclaimerGate.contactBusy = false;
  if (clearText) {
    state.files.disclaimerGate.contactText = "";
  }
  if (elements.filesDisclaimerContactInput) {
    if (clearText) {
      elements.filesDisclaimerContactInput.value = "";
    }
    elements.filesDisclaimerContactInput.classList.remove("is-invalid");
  }
}

function openFilesDisclaimerContactView() {
  const me = normalizeFilesProfile(state.files.me);
  if (!shouldShowFilesDisclaimerGate(me)) {
    return;
  }
  if (normalizeFilesDisclaimerDecision(me.accessDisclaimerDecision) !== "declined") {
    return;
  }
  if (hasPendingFilesDisclaimerReevaluation(me)) {
    resetFilesDisclaimerGateContactState({ clearText: false });
    setFilesDisclaimerGateFeedback(t("files_disclaimer_gate_contact_pending"), "error");
    renderFilesAccessView();
    return;
  }

  state.files.disclaimerGate.contactOpen = true;
  state.files.disclaimerGate.contactBusy = false;
  setFilesDisclaimerGateFeedback("", "");
  renderFilesAccessView();

  if (elements.filesDisclaimerContactInput instanceof HTMLTextAreaElement) {
    elements.filesDisclaimerContactInput.focus();
    elements.filesDisclaimerContactInput.selectionStart = elements.filesDisclaimerContactInput.value.length;
    elements.filesDisclaimerContactInput.selectionEnd = elements.filesDisclaimerContactInput.value.length;
  }
}

function closeFilesDisclaimerContactView({ clearText = false } = {}) {
  resetFilesDisclaimerGateContactState({ clearText });
  setFilesDisclaimerGateFeedback("", "");
  renderFilesAccessView();
}

function renderFilesDisclaimerGateView({
  loggedIn,
  authorized,
  accessRequestStatus,
  accessRequestDecidedAt,
  accessDisclaimerDecision
} = {}) {
  if (!elements.filesDisclaimerGateView) {
    return;
  }

  const resolvedLoggedIn = Boolean(loggedIn);
  const resolvedAuthorized = Boolean(authorized) && resolvedLoggedIn;
  const resolvedStatus = normalizeFilesAccessRequestStatus(accessRequestStatus);
  const resolvedDecision = normalizeFilesDisclaimerDecision(accessDisclaimerDecision);
  const accessExpired = isFilesAccessExpired({
    loggedIn: resolvedLoggedIn,
    accessRequestStatus,
    accessRequestDecidedAt
  });
  const showGate = resolvedLoggedIn && !resolvedAuthorized && !accessExpired && resolvedStatus === "approved";
  const showDeclinedState = showGate && resolvedDecision === "declined";
  const showContactView = showDeclinedState && Boolean(state.files.disclaimerGate.contactOpen);
  elements.filesDisclaimerGateView.hidden = !showGate;

  if (!showGate) {
    state.files.disclaimerGate.busy = false;
    state.files.disclaimerGate.pendingDecision = "";
    setFilesDisclaimerGateFeedback("", "");
    resetFilesDisclaimerGateContactState({ clearText: true });
    return;
  }
  if (!showDeclinedState) {
    resetFilesDisclaimerGateContactState({ clearText: true });
  }

  const busy = Boolean(state.files.disclaimerGate.busy);
  const pendingDecision = String(state.files.disclaimerGate.pendingDecision || "").trim().toLowerCase();
  const contactBusy = Boolean(state.files.disclaimerGate.contactBusy);

  if (elements.filesDisclaimerGateBadge) {
    elements.filesDisclaimerGateBadge.textContent = showDeclinedState
      ? t("files_disclaimer_gate_declined_badge")
      : t("files_disclaimer_gate_badge");
  }

  if (elements.filesDisclaimerGateActions) {
    elements.filesDisclaimerGateActions.hidden = showDeclinedState;
  }
  if (elements.filesDisclaimerAgreeBtn) {
    elements.filesDisclaimerAgreeBtn.disabled = busy || showDeclinedState;
    elements.filesDisclaimerAgreeBtn.textContent = busy && pendingDecision === "accepted"
      ? t("files_disclaimer_gate_agree_busy")
      : t("files_disclaimer_gate_agree_button");
  }
  if (elements.filesDisclaimerDeclineBtn) {
    elements.filesDisclaimerDeclineBtn.disabled = busy || showDeclinedState;
    elements.filesDisclaimerDeclineBtn.textContent = busy && pendingDecision === "declined"
      ? t("files_disclaimer_gate_decline_busy")
      : t("files_disclaimer_gate_decline_button");
  }

  if (elements.filesDisclaimerDeclinedPanel) {
    elements.filesDisclaimerDeclinedPanel.hidden = !showDeclinedState || showContactView;
  }
  if (elements.filesDisclaimerContactBtn) {
    elements.filesDisclaimerContactBtn.disabled = contactBusy;
  }
  if (elements.filesDisclaimerContactView) {
    elements.filesDisclaimerContactView.hidden = !showContactView;
  }
  if (elements.filesDisclaimerContactInput) {
    if (elements.filesDisclaimerContactInput.value !== state.files.disclaimerGate.contactText) {
      elements.filesDisclaimerContactInput.value = state.files.disclaimerGate.contactText;
    }
    elements.filesDisclaimerContactInput.disabled = contactBusy;
  }
  if (elements.filesDisclaimerContactCancelBtn) {
    elements.filesDisclaimerContactCancelBtn.disabled = contactBusy;
  }
  if (elements.filesDisclaimerContactSendBtn) {
    elements.filesDisclaimerContactSendBtn.disabled = contactBusy;
    elements.filesDisclaimerContactSendBtn.textContent = contactBusy
      ? t("files_disclaimer_gate_contact_send_busy")
      : t("files_disclaimer_gate_contact_send_button");
  }

  if (elements.filesDisclaimerGateFeedback) {
    const message = String(state.files.disclaimerGate.message || "");
    const hasMessage = Boolean(message);
    elements.filesDisclaimerGateFeedback.hidden = !hasMessage;
    elements.filesDisclaimerGateFeedback.textContent = hasMessage ? message : "";
    elements.filesDisclaimerGateFeedback.classList.toggle("is-success", state.files.disclaimerGate.messageKind === "success");
    elements.filesDisclaimerGateFeedback.classList.toggle("is-error", state.files.disclaimerGate.messageKind === "error");
  }
}

async function submitFilesDisclaimerReevaluation() {
  if (state.files.disclaimerGate.contactBusy) {
    return;
  }

  const me = normalizeFilesProfile(state.files.me);
  if (!shouldShowFilesDisclaimerGate(me)) {
    return;
  }
  if (normalizeFilesDisclaimerDecision(me.accessDisclaimerDecision) !== "declined") {
    return;
  }

  const rawExplanation = elements.filesDisclaimerContactInput instanceof HTMLTextAreaElement
    ? String(elements.filesDisclaimerContactInput.value || "")
    : String(state.files.disclaimerGate.contactText || "");
  const explanation = rawExplanation.trim();
  state.files.disclaimerGate.contactText = rawExplanation;

  if (!explanation) {
    setFilesDisclaimerGateFeedback(t("files_disclaimer_gate_contact_required"), "error");
    if (elements.filesDisclaimerContactInput instanceof HTMLTextAreaElement) {
      elements.filesDisclaimerContactInput.classList.add("is-invalid");
      elements.filesDisclaimerContactInput.focus();
    }
    renderFilesAccessView();
    return;
  }
  if (explanation.length > FILES_ACCESS_REQUEST_REASON_MAX) {
    setFilesDisclaimerGateFeedback(t("files_disclaimer_gate_contact_too_long"), "error");
    if (elements.filesDisclaimerContactInput instanceof HTMLTextAreaElement) {
      elements.filesDisclaimerContactInput.classList.add("is-invalid");
      elements.filesDisclaimerContactInput.focus();
    }
    renderFilesAccessView();
    return;
  }
  if (elements.filesDisclaimerContactInput instanceof HTMLTextAreaElement) {
    elements.filesDisclaimerContactInput.classList.remove("is-invalid");
  }

  state.files.disclaimerGate.contactBusy = true;
  setFilesDisclaimerGateFeedback("", "");
  renderFilesAccessView();

  try {
    await requestJson("/api/files/disclaimer-reevaluation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        explanation
      })
    });
    state.files.me = {
      ...normalizeFilesProfile(state.files.me),
      accessDisclaimerReevaluationRequestedAt: new Date().toISOString()
    };
    resetFilesDisclaimerGateContactState({ clearText: true });
    setFilesDisclaimerGateFeedback(t("files_disclaimer_gate_contact_success"), "success");
  } catch (error) {
    const serverMessage = String(error?.message || "").trim().toLowerCase();
    let message = t("files_disclaimer_gate_contact_error");
    if (error?.status === 503) {
      message = t("files_disclaimer_gate_contact_unavailable");
    } else if (error?.status === 429 || serverMessage.includes("pending")) {
      message = t("files_disclaimer_gate_contact_pending");
      resetFilesDisclaimerGateContactState({ clearText: false });
    } else if (error?.status === 400) {
      message = serverMessage.includes("required")
        ? t("files_disclaimer_gate_contact_required")
        : (serverMessage.includes("long") || serverMessage.includes("exceed") || serverMessage.includes("character"))
            ? t("files_disclaimer_gate_contact_too_long")
            : t("files_disclaimer_gate_contact_error");
    }
    setFilesDisclaimerGateFeedback(message, "error");
  } finally {
    state.files.disclaimerGate.contactBusy = false;
    renderFilesAccessView();
  }
}

async function submitFilesDisclaimerDecision(decision) {
  const normalizedDecision = normalizeFilesDisclaimerDecision(decision);
  const isAcceptDecision = normalizedDecision === "accepted";
  if (normalizedDecision !== "accepted" && normalizedDecision !== "declined") {
    return;
  }
  if (state.files.disclaimerGate.busy) {
    return;
  }

  const me = normalizeFilesProfile(state.files.me);
  if (!shouldShowFilesDisclaimerGate(me)) {
    return;
  }

  state.files.disclaimerGate.busy = true;
  state.files.disclaimerGate.pendingDecision = normalizedDecision;
  setFilesDisclaimerGateFeedback("", "");
  if (isAcceptDecision) {
    startFilesDisclaimerAcceptTransition();
    resetFilesDisclaimerGateContactState({ clearText: true });
  }
  renderFilesAccessView();

  try {
    const payload = await requestJson("/api/files/disclaimer-decision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        decision: normalizedDecision
      })
    });
    const nextProfile = payload?.me ? normalizeFilesProfile(payload.me) : null;
    if (nextProfile) {
      state.files.me = nextProfile;
      syncFilesLocalAccessExpired(nextProfile);
      syncFilesDecisionNoticeFromProfile(nextProfile);
      syncDiscordBotInviteButton();
      renderDropsAdminTabVisibility();
    }

    const hasActiveAuthorizedAccess = hasFilesAuthorizedAccess(state.files.me);
    if (isAcceptDecision && nextProfile && hasActiveAuthorizedAccess) {
      await refreshFilesList();
      await refreshFilesPublicShares({ silent: true });
      if (state.files.me.isAdmin) {
        await refreshFilesAdminRequests({ silent: true });
      } else {
        clearFilesAdminRequestsState();
        clearFilesBotAdminState({ preserveQuery: true });
        renderFilesAccessView();
        renderDropsPage();
      }
    } else {
      await refreshFilesIdentity({ loadFiles: isAcceptDecision });
    }

    if (isAcceptDecision) {
      const startedAt = Number(state.files.disclaimerGate.acceptTransitionStartedAt) || Date.now();
      const elapsedMs = Math.max(0, Date.now() - startedAt);
      const remainingMs = Math.max(0, FILES_DISCLAIMER_ACCEPT_MIN_MS - elapsedMs);
      if (remainingMs > 0) {
        await sleep(remainingMs);
      }
      stopFilesDisclaimerAcceptTransition({ immediate: false });
    }
  } catch (error) {
    if (isAcceptDecision) {
      stopFilesDisclaimerAcceptTransition({ immediate: true });
    }
    const serverMessage = String(error?.message || "").trim();
    const message = serverMessage || t("files_disclaimer_gate_error");
    setFilesDisclaimerGateFeedback(message, "error");
  } finally {
    state.files.disclaimerGate.busy = false;
    state.files.disclaimerGate.pendingDecision = "";
    renderFilesAccessView();
  }
}

function renderFilesSearchResults() {
  if (!elements.filesSearchResults || !elements.filesSearchInput) {
    return;
  }

  if (!state.files.search.open || !hasFilesAuthorizedAccess(state.files.me)) {
    elements.filesSearchResults.innerHTML = "";
    elements.filesSearchResults.hidden = true;
    setFilesSearchCount("");
    return;
  }

  const query = String(elements.filesSearchInput.value || "").trim();
  state.files.search.query = query;
  elements.filesSearchResults.hidden = false;

  const setSearchMessage = (message, kind = "idle") => {
    const empty = document.createElement("p");
    empty.className = `files-search-empty is-${kind}`;
    empty.textContent = message;
    elements.filesSearchResults.replaceChildren(empty);
  };

  if (state.files.loadingList && !state.files.list.length) {
    setFilesSearchCount("");
    setSearchMessage(t("files_loading_state"), "loading");
    return;
  }

  if (state.files.listError) {
    setFilesSearchCount("");
    setSearchMessage(state.files.listError, "error");
    return;
  }

  if (!query) {
    setFilesSearchCount("");
    setSearchMessage(t("files_search_prompt"), "idle");
    return;
  }

  const matches = getFilteredFilesList(state.files.list);
  if (!matches.length) {
    setFilesSearchCount(t("files_search_results_count", { n: "0" }));
    setSearchMessage(t("files_search_no_results"), "empty");
    return;
  }

  setFilesSearchCount(t("files_search_results_count", { n: String(matches.length) }));
  const fragment = document.createDocumentFragment();
  const limitedMatches = matches.slice(0, 200);

  for (let index = 0; index < limitedMatches.length; index += 1) {
    const file = limitedMatches[index];
    const fileId = String(file.id || "");
    const fileName = getFilesDisplayName(file);
    const fileType = resolveFileTypeLabel(file);
    const fileSize = formatFileSize(file.size);
    const groupName = getFilesGroupDisplayLabel(file);
    const timestampMeta = resolveFilesTimestampMeta(file);

    const row = document.createElement("article");
    row.className = "files-search-row";
    row.style.setProperty("--files-search-index", String(Math.min(index, 9)));

    const itemField = document.createElement("div");
    itemField.className = "files-search-cell files-search-item";
    itemField.innerHTML = `<span class="files-search-k">${t("files_name_label")}</span>`;

    const itemValue = document.createElement("span");
    itemValue.className = "files-search-v";
    itemValue.textContent = fileName;
    itemField.appendChild(itemValue);

    const itemMeta = document.createElement("span");
    itemMeta.className = "files-search-meta-line";
    itemMeta.textContent = groupName;
    itemField.appendChild(itemMeta);

    const typeField = document.createElement("div");
    typeField.className = "files-search-cell";
    typeField.innerHTML = `<span class="files-search-k">${t("files_type_label")}</span>`;
    const typeValue = document.createElement("span");
    typeValue.className = "files-search-v";
    typeValue.textContent = fileType;
    typeField.appendChild(typeValue);

    const sizeField = document.createElement("div");
    sizeField.className = "files-search-cell";
    sizeField.innerHTML = `<span class="files-search-k">${t("files_size_label")}</span>`;
    const sizeValue = document.createElement("span");
    sizeValue.className = "files-search-v";
    sizeValue.textContent = fileSize;
    sizeField.appendChild(sizeValue);

    const uploadedField = document.createElement("div");
    uploadedField.className = "files-search-cell";
    uploadedField.innerHTML = `<span class="files-search-k">${timestampMeta.primaryLabel}</span>`;
    const uploadedValue = document.createElement("span");
    uploadedValue.className = "files-search-v";
    uploadedValue.textContent = timestampMeta.primaryDate;
    uploadedField.appendChild(uploadedValue);

    const actionField = document.createElement("div");
    actionField.className = "files-search-cell files-search-action";
    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "files-search-open";
    openButton.textContent = t("files_search_open_file");
    openButton.setAttribute("data-files-action", "open-detail-search");
    openButton.setAttribute("data-file-id", fileId);
    actionField.appendChild(openButton);

    row.appendChild(itemField);
    row.appendChild(typeField);
    row.appendChild(sizeField);
    row.appendChild(uploadedField);
    row.appendChild(actionField);
    fragment.appendChild(row);
  }

  elements.filesSearchResults.innerHTML = "";
  elements.filesSearchResults.appendChild(fragment);
}

function renderFilesList() {
  if (!elements.filesList || !elements.filesEmptyState) {
    return;
  }

  const me = normalizeFilesProfile(state.files.me);
  const accessExpired = Boolean(state.files.localAccessExpired || isFilesAccessExpired(me));
  const canReadFiles = hasFilesAuthorizedAccess(me);
  const showRestrictedNotice = me.loggedIn && !canReadFiles && !shouldShowFilesDisclaimerGate(me);
  elements.filesList.replaceChildren();
  delete elements.filesList.dataset.detailRenderKey;
  elements.filesList.classList.remove(
    "is-detail-mode",
    "is-group-focus-mode",
    "is-transition-to-detail",
    "is-transition-to-list",
    "is-transition-group-open",
    "is-transition-group-close"
  );
  elements.filesEmptyState.classList.remove("is-restricted");
  elements.filesBrowserPanel?.classList.toggle("is-restricted", showRestrictedNotice);
  const transition = String(state.files.transition || "");
  const groupTransition = String(state.files.groupTransition || "");
  state.files.transition = "";
  state.files.groupTransition = "";

  if (!canReadFiles) {
    clearFilesGroupManagerState();
    clearFilesGroupRenameState();
    if (state.files.search.open || state.files.search.query) {
      setFilesSearchOpen(false, { clearQuery: true });
      return;
    }

    setFilesSearchCount("");
    elements.filesList.hidden = true;
    elements.filesEmptyState.hidden = true;
    elements.filesEmptyState.textContent = "";
    elements.filesEmptyState.classList.remove("is-restricted");
    if (!showRestrictedNotice) {
      if (elements.filesRestrictedView) {
        elements.filesRestrictedView.hidden = true;
      }
      if (elements.filesDeniedView) {
        elements.filesDeniedView.hidden = true;
      }
    }
    if (elements.filesSearchResults) {
      elements.filesSearchResults.innerHTML = "";
      elements.filesSearchResults.hidden = true;
    }
    renderFilesDetailModal();
    return;
  }

  if (elements.filesRestrictedView) {
    elements.filesRestrictedView.hidden = true;
  }
  if (elements.filesDeniedView) {
    elements.filesDeniedView.hidden = true;
  }
  syncFilesGroupSuggestions();

  const isSearchMode = Boolean(state.files.search.open);
  const managerMode = Boolean(state.files.groupManager.open && me.isAdmin);
  const selectedId = String(state.files.selectedId || "");
  const selectedFile = selectedId
    ? state.files.list.find((entry) => String(entry.id || "") === selectedId) || null
    : null;

  if (selectedId && !selectedFile) {
    state.files.selectedId = "";
    state.files.detailOrigin = "";
  }

  if (managerMode && selectedFile) {
    state.files.selectedId = "";
    state.files.detailOrigin = "";
  }

  if (isSearchMode && !managerMode) {
    elements.filesList.hidden = true;
    elements.filesEmptyState.hidden = true;
    renderFilesSearchResults();
    renderFilesDetailModal();
    return;
  }

  elements.filesList.hidden = false;
  setFilesSearchCount("");
  if (elements.filesSearchResults) {
    elements.filesSearchResults.innerHTML = "";
    elements.filesSearchResults.hidden = true;
  }

  let emptyMessage = "";
  if (state.files.loadingList && !state.files.list.length) {
    emptyMessage = t("files_loading_state");
  } else if (state.files.listError) {
    emptyMessage = state.files.listError;
  } else if (!state.files.list.length) {
    emptyMessage = t("files_empty_state");
  }

  if (emptyMessage) {
    elements.filesEmptyState.hidden = false;
    elements.filesEmptyState.textContent = emptyMessage;
    renderFilesDetailModal();
    return;
  }

  if (transition === "to-list") {
    elements.filesList.classList.add("is-transition-to-list");
  }
  if (groupTransition === "open") {
    elements.filesList.classList.add("is-transition-group-open");
  } else if (groupTransition === "close") {
    elements.filesList.classList.add("is-transition-group-close");
  }

  elements.filesEmptyState.hidden = true;
  const fragment = document.createDocumentFragment();
  const baseFiles = Array.isArray(state.files.list) ? state.files.list : [];

  const groups = [];
  const groupsByKey = new Map();
  for (const file of baseFiles) {
    const normalizedGroup = normalizeFilesGroup(file.group || "");
    const key = getFilesGroupKey(normalizedGroup);
    if (!groupsByKey.has(key)) {
      const nextGroup = {
        key,
        label: normalizedGroup || t("files_group_default"),
        files: []
      };
      groupsByKey.set(key, nextGroup);
      groups.push(nextGroup);
    }
    groupsByKey.get(key).files.push(file);
  }

  const activeGroupKey = String(state.files.activeGroupKey || "").trim();
  const activeGroup = activeGroupKey
    ? groups.find((entry) => entry.key === activeGroupKey) || null
    : null;
  if (activeGroupKey && !activeGroup) {
    state.files.activeGroupKey = "";
  }
  const hasFocusedGroup = Boolean(activeGroup && state.files.activeGroupKey);
  elements.filesList.classList.toggle("is-group-focus-mode", hasFocusedGroup);
  if (!hasFocusedGroup && state.files.rename.fileId) {
    state.files.rename.fileId = "";
    state.files.rename.value = "";
    state.files.rename.busy = false;
  }
  if (!hasFocusedGroup && !managerMode) {
    state.files.groupManager.selectedIds = [];
  }
  const groupsToRender = hasFocusedGroup ? [activeGroup] : groups;

  if (state.files.rename.fileId && !baseFiles.some((entry) => String(entry.id || "") === state.files.rename.fileId)) {
    state.files.rename.fileId = "";
    state.files.rename.value = "";
    state.files.rename.busy = false;
  }
  const availableFileIds = new Set(baseFiles.map((entry) => String(entry?.id || "")));
  state.files.groupManager.selectedIds = state.files.groupManager.selectedIds
    .map((value) => String(value || "").trim())
    .filter((value) => value && availableFileIds.has(value));
  if (hasFocusedGroup) {
    const focusedIds = new Set((activeGroup?.files || []).map((entry) => String(entry?.id || "")));
    state.files.groupManager.selectedIds = state.files.groupManager.selectedIds.filter((value) => focusedIds.has(value));
  }

  if (managerMode) {
    const managerFiles = getFilteredFilesList(baseFiles);
    const managerVisibleIds = new Set(managerFiles.map((entry) => String(entry?.id || "").trim()).filter(Boolean));
    state.files.groupManager.selectedIds = state.files.groupManager.selectedIds
      .map((value) => String(value || "").trim())
      .filter((value) => value && managerVisibleIds.has(value));

    if (isSearchMode) {
      setFilesSearchCount(t("files_search_results_count", { n: String(managerFiles.length) }));
    }

    if (!managerFiles.length) {
      elements.filesEmptyState.hidden = false;
      elements.filesEmptyState.textContent = isSearchMode
        ? t("files_search_no_results")
        : t("files_group_manager_no_files");
      renderFilesDetailModal();
      return;
    }

    const targetGroup = normalizeFilesGroup(state.files.groupManager.targetGroup || "");
    const managerList = document.createElement("section");
    managerList.className = "files-group-manager-list";
    let renderedIndex = 0;

    for (const file of managerFiles) {
      const fileId = String(file.id || "");
      const fileName = getFilesDisplayName(file);
      const fileType = resolveFileTypeLabel(file);
      const fileTypeBadgeLabel = getFilesTypeBadgeLabel(file);
      const fileTypeSummaryLabel = fileTypeBadgeLabel || fileType;
      const fileSize = formatFileSize(file.size);
      const timestampMeta = resolveFilesTimestampMeta(file);
      const uploader = String(file.uploader || t("files_unknown_value"));
      const selectedForGrouping = state.files.groupManager.selectedIds.includes(fileId);
      const groupStatus = resolveFilesGroupManagerFileStatus(file, targetGroup);

      const card = document.createElement("article");
      card.className = "panel files-file-card files-file-card-manager";
      card.style.setProperty("--files-item-index", String(Math.min(renderedIndex, 9)));
      renderedIndex += 1;

      const cardBody = document.createElement("div");
      cardBody.className = "files-file-toggle files-file-toggle-static";

      const cardHead = document.createElement("div");
      cardHead.className = "files-file-head";

      const title = document.createElement("p");
      title.className = "files-file-name";
      title.textContent = fileName;

      const badges = document.createElement("div");
      badges.className = "files-file-badges";

      const typeBadge = document.createElement("span");
      typeBadge.className = "files-file-badge is-type";
      typeBadge.textContent = fileTypeBadgeLabel;
      badges.appendChild(typeBadge);

      if (file.hasImage || file.imageUrl) {
        const imageBadge = document.createElement("span");
        imageBadge.className = "files-file-badge is-image";
        imageBadge.textContent = "IMG";
        badges.appendChild(imageBadge);
      }
      appendFilesOutdatedBadge(badges, file);
      appendFilesUntestedBadge(badges, file);
      appendFilesCautionBadge(badges, file);

      cardHead.appendChild(title);
      cardHead.appendChild(badges);

      const summary = document.createElement("div");
      summary.className = "files-file-summary";

      const typeSummary = document.createElement("span");
      typeSummary.className = "files-file-pill";
      typeSummary.textContent = `${t("files_type_label")}: ${fileTypeSummaryLabel}`;
      if (fileType && fileType !== fileTypeSummaryLabel) {
        typeSummary.title = fileType;
      }

      const sizeSummary = document.createElement("span");
      sizeSummary.className = "files-file-pill";
      sizeSummary.textContent = `${t("files_size_label")}: ${fileSize}`;

      summary.appendChild(typeSummary);
      summary.appendChild(sizeSummary);

      const footer = document.createElement("div");
      footer.className = "files-file-footer";

      const dateSummary = document.createElement("span");
      dateSummary.className = "files-file-footer-item";
      dateSummary.textContent = `${timestampMeta.previewLabel}: ${timestampMeta.previewDate}`;

      const uploaderSummary = document.createElement("span");
      uploaderSummary.className = "files-file-footer-item";
      uploaderSummary.textContent = `${t("files_uploader_label")}: ${uploader}`;

      footer.appendChild(dateSummary);
      footer.appendChild(uploaderSummary);

      cardBody.appendChild(cardHead);
      cardBody.appendChild(summary);
      cardBody.appendChild(footer);
      card.appendChild(cardBody);

      const managerWrap = document.createElement("div");
      managerWrap.className = "files-file-rename-wrap files-file-group-manager-wrap";

      const statusText = document.createElement("p");
      statusText.className = `files-file-group-status is-${groupStatus.kind}`;
      statusText.textContent = groupStatus.text;
      managerWrap.appendChild(statusText);

      const selectLabel = document.createElement("label");
      selectLabel.className = "files-file-group-select";

      const selectInput = document.createElement("input");
      selectInput.type = "checkbox";
      selectInput.className = "files-file-group-select-input";
      selectInput.setAttribute("data-files-group-select", "true");
      selectInput.setAttribute("data-file-id", fileId);
      selectInput.checked = selectedForGrouping;
      selectInput.disabled = state.files.groupManager.busy;

      const selectText = document.createElement("span");
      selectText.textContent = t("files_group_manager_select_file_label");

      selectLabel.appendChild(selectInput);
      selectLabel.appendChild(selectText);
      managerWrap.appendChild(selectLabel);
      card.appendChild(managerWrap);

      managerList.appendChild(card);
    }

    fragment.appendChild(managerList);
    elements.filesList.appendChild(fragment);
    renderFilesDetailModal();
    return;
  }

  if (hasFocusedGroup) {
    const focusBar = document.createElement("div");
    focusBar.className = "files-group-focus-bar";

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "files-btn files-group-back-btn";
    backButton.textContent = t("files_groups_back_button");
    backButton.setAttribute("data-files-action", "clear-group-filter");
    focusBar.appendChild(backButton);

    const activeLabel = document.createElement("span");
    activeLabel.className = "files-group-focus-label";
    activeLabel.textContent = activeGroup.label;
    focusBar.appendChild(activeLabel);
    fragment.appendChild(focusBar);
  }

  let renderedIndex = 0;
  let renderedGroupIndex = 0;
  for (const groupEntry of groupsToRender) {
    const groupWrap = document.createElement("section");
    groupWrap.className = "files-group-section";
    groupWrap.classList.toggle("is-open", hasFocusedGroup);
    groupWrap.style.setProperty("--files-group-index", String(Math.min(renderedGroupIndex, 8)));
    renderedGroupIndex += 1;

    const groupHead = document.createElement("div");
    groupHead.className = "files-group-head";
    const canRenameFocusedGroup = hasFocusedGroup
      && Boolean(state.files.me?.isAdmin)
      && groupEntry.key !== "__ungrouped__";

    const groupToggle = document.createElement("button");
    groupToggle.type = "button";
    groupToggle.className = "files-group-toggle";
    groupToggle.setAttribute("data-files-action", "select-group");
    groupToggle.setAttribute("data-group-key", groupEntry.key);
    groupToggle.setAttribute("aria-expanded", hasFocusedGroup ? "true" : "false");
    groupToggle.disabled = hasFocusedGroup;

    const groupTotalBytes = groupEntry.files.reduce((acc, item) => acc + (Number(item?.size) || 0), 0);
    const previewFiles = groupEntry.files.slice(0, 3);

    const groupFolder = document.createElement("span");
    groupFolder.className = `files-group-folder has-${previewFiles.length}-preview`;
    groupFolder.setAttribute("aria-hidden", "true");

    const groupFolderBack = document.createElement("span");
    groupFolderBack.className = "files-group-folder-back";
    groupFolder.appendChild(groupFolderBack);

    previewFiles.forEach((previewFile, fileLayerIndex) => {
      const groupFolderFile = document.createElement("span");
      groupFolderFile.className = `files-group-folder-file is-${fileLayerIndex + 1}`;

      const previewName = document.createElement("span");
      previewName.className = "files-group-folder-file-name";
      previewName.textContent = getFilesDisplayName(previewFile);

      const previewTag = document.createElement("span");
      previewTag.className = "files-group-folder-file-tag";
      const previewType = getFilesTypeBadgeLabel(previewFile) || resolveFileTypeLabel(previewFile);
      previewTag.textContent = `${previewType} | ${formatFileSize(previewFile?.size)}`;

      groupFolderFile.appendChild(previewName);
      groupFolderFile.appendChild(previewTag);
      groupFolder.appendChild(groupFolderFile);
    });

    const groupFolderFront = document.createElement("span");
    groupFolderFront.className = "files-group-folder-front";
    const groupFolderCount = document.createElement("span");
    groupFolderCount.className = "files-group-folder-count";
    const groupFolderCountLabel = document.createElement("span");
    groupFolderCountLabel.textContent = "FILES";
    const groupFolderCountValue = document.createElement("strong");
    groupFolderCountValue.textContent = String(Math.min(groupEntry.files.length, 99)).padStart(2, "0");
    groupFolderCount.appendChild(groupFolderCountLabel);
    groupFolderCount.appendChild(groupFolderCountValue);
    groupFolderFront.appendChild(groupFolderCount);
    const groupFolderSize = document.createElement("span");
    groupFolderSize.className = "files-group-folder-size";
    groupFolderSize.textContent = formatFileSize(groupTotalBytes);
    groupFolderFront.appendChild(groupFolderSize);
    groupFolder.appendChild(groupFolderFront);

    const groupMain = document.createElement("span");
    groupMain.className = "files-group-main";

    const groupTitle = document.createElement("span");
    groupTitle.className = "files-group-title";
    groupTitle.textContent = groupEntry.label;

    const groupStats = document.createElement("span");
    groupStats.className = "files-group-stats";

    const groupMeta = document.createElement("span");
    groupMeta.className = "files-group-meta";

    const groupCount = document.createElement("span");
    groupCount.className = "files-group-count files-group-stat is-count";
    groupCount.textContent = formatFilesGroupCount(groupEntry.files.length);

    const groupSize = document.createElement("span");
    groupSize.className = "files-group-size files-group-stat is-size";
    groupSize.textContent = formatFileSize(groupTotalBytes);

    groupStats.appendChild(groupCount);
    groupStats.appendChild(groupSize);
    groupMain.appendChild(groupTitle);
    groupMain.appendChild(groupStats);

    if (!hasFocusedGroup) {
      const openHint = document.createElement("span");
      openHint.className = "files-group-open-hint";
      openHint.textContent = t("files_group_open_button");
      groupMeta.appendChild(openHint);
    }

    const groupCaretWrap = document.createElement("span");
    groupCaretWrap.className = "files-group-caret-wrap";

    const groupCaret = document.createElement("span");
    groupCaret.className = "files-group-caret";
    groupCaret.setAttribute("aria-hidden", "true");
    groupCaret.textContent = ">";
    groupCaretWrap.appendChild(groupCaret);
    groupMeta.appendChild(groupCaretWrap);

    groupToggle.appendChild(groupFolder);
    groupToggle.appendChild(groupMain);
    groupToggle.appendChild(groupMeta);
    groupHead.appendChild(groupToggle);

    if (canRenameFocusedGroup) {
      const renameGroupButton = document.createElement("button");
      renameGroupButton.type = "button";
      renameGroupButton.className = "files-group-rename-btn";
      renameGroupButton.textContent = "✎";
      renameGroupButton.setAttribute("data-files-action", "rename-group");
      renameGroupButton.setAttribute("data-group-key", groupEntry.key);
      renameGroupButton.setAttribute("data-group-label", groupEntry.label || "");
      const renameLabel = t("files_group_rename_button_label", { group: groupEntry.label || t("files_group_default") });
      renameGroupButton.setAttribute("aria-label", renameLabel);
      renameGroupButton.disabled = Boolean(state.files.groupRename.busy);
      groupHead.appendChild(renameGroupButton);
    }

    const groupList = document.createElement("div");
    groupList.className = "files-group-list";
    groupList.hidden = !hasFocusedGroup;

    if (hasFocusedGroup) {
      for (let index = 0; index < groupEntry.files.length; index += 1) {
        const file = groupEntry.files[index];
        const fileId = String(file.id || "");
        const fileName = getFilesDisplayName(file);
        const fileType = resolveFileTypeLabel(file);
        const fileTypeBadgeLabel = getFilesTypeBadgeLabel(file);
        const fileTypeSummaryLabel = fileTypeBadgeLabel || fileType;
        const fileSize = formatFileSize(file.size);
        const timestampMeta = resolveFilesTimestampMeta(file);
        const uploader = String(file.uploader || t("files_unknown_value"));
        const isRenaming = Boolean(state.files.rename.fileId) && state.files.rename.fileId === fileId;
        const renameBusy = isRenaming && Boolean(state.files.rename.busy);
        const selectedForGrouping = state.files.groupManager.selectedIds.includes(fileId);

        const card = document.createElement("article");
        card.className = "panel files-file-card";
        card.style.setProperty("--files-item-index", String(Math.min(renderedIndex, 9)));
        card.style.setProperty("--files-card-index", String(Math.min(index, 9)));
        renderedIndex += 1;

        const openButton = document.createElement("div");
        openButton.className = "files-file-toggle";
        openButton.setAttribute("role", "button");
        openButton.tabIndex = 0;
        openButton.setAttribute("data-files-action", "open-detail");
        openButton.setAttribute("data-file-id", fileId);

        const cardHead = document.createElement("div");
        cardHead.className = "files-file-head";

        const title = document.createElement("p");
        title.className = "files-file-name";
        title.textContent = fileName;

        const badges = document.createElement("div");
        badges.className = "files-file-badges";

        const typeBadge = document.createElement("span");
        typeBadge.className = "files-file-badge is-type";
        typeBadge.textContent = fileTypeBadgeLabel;
        badges.appendChild(typeBadge);

        if (file.hasImage || file.imageUrl) {
          const imageBadge = document.createElement("span");
          imageBadge.className = "files-file-badge is-image";
          imageBadge.textContent = "IMG";
          badges.appendChild(imageBadge);
        }
        appendFilesOutdatedBadge(badges, file);
        appendFilesUntestedBadge(badges, file);
        appendFilesCautionBadge(badges, file);

        cardHead.appendChild(title);
        cardHead.appendChild(badges);

        const summary = document.createElement("div");
        summary.className = "files-file-summary";

        const typeSummary = document.createElement("span");
        typeSummary.className = "files-file-pill";
        typeSummary.textContent = `${t("files_type_label")}: ${fileTypeSummaryLabel}`;
        if (fileType && fileType !== fileTypeSummaryLabel) {
          typeSummary.title = fileType;
        }
        const sizeSummary = document.createElement("span");
        sizeSummary.className = "files-file-pill";
        sizeSummary.textContent = `${t("files_size_label")}: ${fileSize}`;

        summary.appendChild(typeSummary);
        summary.appendChild(sizeSummary);

        const footer = document.createElement("div");
        footer.className = "files-file-footer";

        const dateSummary = document.createElement("span");
        dateSummary.className = "files-file-footer-item";
        dateSummary.textContent = `${timestampMeta.previewLabel}: ${timestampMeta.previewDate}`;

        const uploaderSummary = document.createElement("span");
        uploaderSummary.className = "files-file-footer-item";
        uploaderSummary.textContent = `${t("files_uploader_label")}: ${uploader}`;

        footer.appendChild(dateSummary);
        footer.appendChild(uploaderSummary);

        openButton.appendChild(cardHead);
        openButton.appendChild(summary);
        openButton.appendChild(footer);
        card.appendChild(openButton);

        if (state.files.me?.isAdmin) {
          const actionWrap = document.createElement("div");
          actionWrap.className = "files-file-rename-wrap";

          if (hasFocusedGroup && state.files.groupManager.open) {
            const selectLabel = document.createElement("label");
            selectLabel.className = "files-file-group-select";

            const selectInput = document.createElement("input");
            selectInput.type = "checkbox";
            selectInput.className = "files-file-group-select-input";
            selectInput.setAttribute("data-files-group-select", "true");
            selectInput.setAttribute("data-file-id", fileId);
            selectInput.checked = selectedForGrouping;
            selectInput.disabled = state.files.groupManager.busy;

            const selectText = document.createElement("span");
            selectText.textContent = t("files_group_manager_select_file_label");

            selectLabel.appendChild(selectInput);
            selectLabel.appendChild(selectText);
            actionWrap.appendChild(selectLabel);
          }

          if (isRenaming) {
            const renameForm = document.createElement("form");
            renameForm.className = "files-file-rename-form";
            renameForm.noValidate = true;
            renameForm.setAttribute("data-files-rename-form", "true");
            renameForm.setAttribute("data-file-id", fileId);

            const renameInput = document.createElement("input");
            renameInput.type = "text";
            renameInput.name = "displayName";
            renameInput.className = "files-file-rename-input";
            renameInput.maxLength = 180;
            renameInput.placeholder = t("files_rename_placeholder");
            renameInput.value = state.files.rename.value || fileName;
            renameInput.disabled = renameBusy;

            const renameActions = document.createElement("div");
            renameActions.className = "files-file-rename-actions";

            const saveRenameBtn = document.createElement("button");
            saveRenameBtn.type = "submit";
            saveRenameBtn.className = "files-card-action files-file-rename-save";
            saveRenameBtn.textContent = renameBusy ? t("files_rename_busy") : t("files_rename_save_button");
            saveRenameBtn.disabled = renameBusy;

            const cancelRenameBtn = document.createElement("button");
            cancelRenameBtn.type = "button";
            cancelRenameBtn.className = "files-card-action files-file-rename-cancel";
            cancelRenameBtn.textContent = t("files_rename_cancel_button");
            cancelRenameBtn.setAttribute("data-files-action", "cancel-rename");
            cancelRenameBtn.setAttribute("data-file-id", fileId);
            cancelRenameBtn.disabled = renameBusy;

            renameActions.appendChild(saveRenameBtn);
            renameActions.appendChild(cancelRenameBtn);

            renameForm.appendChild(renameInput);
            renameForm.appendChild(renameActions);
            actionWrap.appendChild(renameForm);
          } else {
            const renameButton = document.createElement("button");
            renameButton.type = "button";
            renameButton.className = "files-card-action files-file-rename-button";
            renameButton.textContent = t("files_rename_button");
            renameButton.setAttribute("data-files-action", "start-rename");
            renameButton.setAttribute("data-file-id", fileId);
            actionWrap.appendChild(renameButton);
          }

          card.appendChild(actionWrap);
        }

        groupList.appendChild(card);
      }
    }

    groupWrap.appendChild(groupHead);
    groupWrap.appendChild(groupList);
    fragment.appendChild(groupWrap);
  }

  elements.filesList.appendChild(fragment);
  renderFilesDetailModal();
}

function renderFilesAccessView() {
  const isFileProtocol = window.location.protocol === "file:";
  const me = normalizeFilesProfile(state.files.me);
  const accessExpired = syncFilesLocalAccessExpired(me);
  const loggedIn = me.loggedIn;
  const authorized = hasFilesAuthorizedAccess(me);
  const isAdmin = me.isAdmin && !accessExpired;
  const sharedTargetActive = hasFilesSharedTargetInLocation();
  const sharedGuestLanding = sharedTargetActive && !loggedIn;
  const sharedRestrictedLanding = sharedTargetActive && loggedIn && !authorized && !accessExpired;
  const showDisclaimerGate = shouldShowFilesDisclaimerGate(me);
  const showRestrictedLayout = loggedIn && !authorized;
  const showAuthorizedLayout = authorized || showRestrictedLayout;
  const showUploadPanel = authorized && isAdmin;
  const disclaimerAcceptTransitionActive = Boolean(state.files.disclaimerGate.acceptTransitionActive);
  const disclaimerAcceptTransitionExiting = Boolean(state.files.disclaimerGate.acceptTransitionExiting);
  const showDisclaimerAcceptLoader = disclaimerAcceptTransitionActive || disclaimerAcceptTransitionExiting;

  if (elements.filesBrowserPanel) {
    elements.filesBrowserPanel.classList.toggle("is-disclaimer-accept-loading", showDisclaimerAcceptLoader);
  }
  if (elements.filesDisclaimerAcceptLoader) {
    elements.filesDisclaimerAcceptLoader.hidden = !showDisclaimerAcceptLoader;
    elements.filesDisclaimerAcceptLoader.classList.toggle("is-visible", showDisclaimerAcceptLoader);
    elements.filesDisclaimerAcceptLoader.classList.toggle(
      "is-active",
      disclaimerAcceptTransitionActive && !disclaimerAcceptTransitionExiting
    );
    elements.filesDisclaimerAcceptLoader.classList.toggle("is-exiting", disclaimerAcceptTransitionExiting);
  }

  if (showDisclaimerGate) {
    state.files.accessRequestBusy = false;
    setFilesRestrictedRequestFeedback("", "");
  }

  syncFilesDecisionNoticeFromProfile(me);

  if ((!authorized || !isAdmin) && state.files.deleteModal.open) {
    closeFilesDeleteModal({ force: true });
  }
  if (!authorized && state.files.cautionModal.open) {
    closeFilesCautionModal();
  }

  document.body.classList.toggle("is-files-unauthorized", !authorized);
  document.body.classList.toggle("is-files-guest", !loggedIn && !authorized);
  document.body.classList.toggle("is-files-shared-landing", sharedGuestLanding);
  document.body.classList.toggle("is-files-shared-restricted", sharedRestrictedLanding);
  document.body.classList.toggle("is-files-shared-blocked", sharedGuestLanding || sharedRestrictedLanding);
  syncFilesAuthorizedVisitCounterMobileCard();

  if (elements.filesUnauthorizedBadge) {
    elements.filesUnauthorizedBadge.textContent = sharedGuestLanding
      ? t("files_share_unauthorized_badge")
      : t("files_unauthorized_badge");
  }

  if (elements.filesAuthCharacterCaption) {
    elements.filesAuthCharacterCaption.textContent = t("files_auth_character_caption");
  }

  if (elements.filesAuthConsoleStatus) {
    elements.filesAuthConsoleStatus.textContent = t("files_auth_console_status");
  }

  if (elements.filesUnauthorizedTitle) {
    elements.filesUnauthorizedTitle.textContent = sharedGuestLanding
      ? t("files_share_unauthorized_title")
      : t("files_unauthorized_title");
  }
  if (elements.filesUnauthorizedSubtitle) {
    elements.filesUnauthorizedSubtitle.textContent = sharedGuestLanding
      ? t("files_share_unauthorized_subtitle")
      : t("files_unauthorized_subtitle");
  }
  if (elements.filesUnauthorizedKicker) {
    elements.filesUnauthorizedKicker.textContent = sharedGuestLanding
      ? t("files_share_unauthorized_kicker")
      : t("files_unauthorized_kicker");
  }
  if (elements.filesUnauthorizedDirectiveTitle) {
    elements.filesUnauthorizedDirectiveTitle.textContent = sharedGuestLanding
      ? t("files_share_unauthorized_directive_title")
      : t("files_unauthorized_directive_title");
  }
  if (elements.filesUnauthorizedDirectiveLine1) {
    elements.filesUnauthorizedDirectiveLine1.textContent = sharedGuestLanding
      ? t("files_share_unauthorized_directive_line_1")
      : t("files_unauthorized_directive_line_1");
  }
  if (elements.filesUnauthorizedDirectiveLine2) {
    elements.filesUnauthorizedDirectiveLine2.textContent = sharedGuestLanding
      ? t("files_share_unauthorized_directive_line_2")
      : t("files_unauthorized_directive_line_2");
  }
  if (elements.filesUnauthorizedDirectiveLine3) {
    elements.filesUnauthorizedDirectiveLine3.textContent = sharedGuestLanding
      ? t("files_share_unauthorized_directive_line_3")
      : t("files_unauthorized_directive_line_3");
  }

  if (elements.filesBrowserTitle) {
    if (showDisclaimerGate) {
      elements.filesBrowserTitle.textContent = t("files_disclaimer_gate_browser_title");
    } else {
      elements.filesBrowserTitle.textContent = showRestrictedLayout
        ? accessExpired
          ? t("files_restricted_browser_title_expired")
          : sharedRestrictedLanding
            ? t("files_share_restricted_browser_title")
            : t("files_restricted_browser_title")
        : t("files_file_index_title");
    }
  }

  if (isFileProtocol) {
    if (state.files.adminModal.active) {
      state.files.adminModal.active = "";
    }
    if (state.files.groupRename.open) {
      clearFilesGroupRenameState();
    }
    if (state.files.disclaimerModal.open) {
      state.files.disclaimerModal.open = false;
    }
    renderFilesSessionProfile({
      loggedIn: false,
      authorized: false,
      isAdmin: false,
      username: "",
      discordId: "",
      accessRequestStatus: "none",
      accessRequestDecidedAt: "",
      accessDisclaimerDecision: "none",
      disclaimerRequired: false
    });
    if (elements.filesUnauthorizedPanel) {
      elements.filesUnauthorizedPanel.hidden = false;
    }
    if (elements.filesAuthorizedView) {
      elements.filesAuthorizedView.hidden = true;
    }
    if (elements.filesNotAuthorizedMessage) {
      elements.filesNotAuthorizedMessage.hidden = false;
      elements.filesNotAuthorizedMessage.textContent = t("files_server_required_message");
    }
    if (elements.filesLoginForm) {
      elements.filesLoginForm.hidden = true;
    }
    if (elements.filesLogoutBtn) {
      elements.filesLogoutBtn.hidden = true;
    }
    if (elements.filesSessionLogoutBtn) {
      elements.filesSessionLogoutBtn.hidden = true;
    }
    if (elements.filesUploadPanel) {
      elements.filesUploadPanel.hidden = true;
    }
    if (elements.filesGroupManagerToggleBtn) {
      elements.filesGroupManagerToggleBtn.hidden = true;
    }
    if (elements.filesGroupManagerWrap) {
      elements.filesGroupManagerWrap.hidden = true;
      elements.filesGroupManagerWrap.replaceChildren();
    }
    if (elements.filesAdminRequestsPanel) {
      elements.filesAdminRequestsPanel.hidden = true;
    }
    if (elements.filesBotAdminPanel) {
      elements.filesBotAdminPanel.hidden = true;
    }
    if (elements.filesRestrictedView) {
      elements.filesRestrictedView.hidden = true;
    }
    if (elements.filesDeniedView) {
      elements.filesDeniedView.hidden = true;
    }
    if (elements.filesDisclaimerGateView) {
      elements.filesDisclaimerGateView.hidden = true;
    }
    renderFilesBotAdminPanel();
    renderFilesBotAdminLeaveModal();
    renderFilesAdminModals();
    renderFilesGroupRenameModal();
    renderFilesCautionModal();
    renderFilesDisclaimerModal();
    renderFilesDecisionTabBadge();
    renderFilesList();
    return;
  }

  if (!authorized) {
    state.files.search.open = false;
    state.files.search.query = "";
    state.files.activeGroupKey = "";
    state.files.rename.fileId = "";
    state.files.rename.value = "";
    state.files.rename.busy = false;
    state.files.groupManager.open = false;
    clearFilesGroupManagerState();
    if (elements.filesSearchInput) {
      elements.filesSearchInput.value = "";
    }
    if (elements.filesSearchWrap) {
      elements.filesSearchWrap.hidden = true;
    }
    if (elements.filesSearchToggleBtn) {
      elements.filesSearchToggleBtn.classList.remove("is-active");
      elements.filesSearchToggleBtn.setAttribute("aria-expanded", "false");
      elements.filesSearchToggleBtn.title = t("files_search_toggle_open_label");
      elements.filesSearchToggleBtn.setAttribute("aria-label", t("files_search_toggle_open_label"));
    }
    if (elements.filesSearchToggleText) {
      elements.filesSearchToggleText.textContent = t("files_search_toggle_open");
    }
  }

  if (elements.filesUnauthorizedPanel) {
    elements.filesUnauthorizedPanel.hidden = showAuthorizedLayout;
  }
  if (elements.filesAuthorizedView) {
    elements.filesAuthorizedView.hidden = !showAuthorizedLayout;
  }
  if (elements.filesNotAuthorizedMessage) {
    elements.filesNotAuthorizedMessage.hidden = !sharedGuestLanding;
    elements.filesNotAuthorizedMessage.textContent = sharedGuestLanding
      ? getFilesSharedUnauthorizedMessage()
      : t("files_not_authorized_message");
  }
  if (elements.filesLoginForm) {
    elements.filesLoginForm.hidden = loggedIn || showAuthorizedLayout;
  }
  if (elements.filesLogoutBtn) {
    elements.filesLogoutBtn.hidden = !loggedIn || showAuthorizedLayout;
  }
  if (elements.filesSessionLogoutBtn) {
    elements.filesSessionLogoutBtn.hidden = !loggedIn || !showAuthorizedLayout;
  }
  if (elements.filesUploadPanel) {
    elements.filesUploadPanel.hidden = !showUploadPanel;
  }
  if (elements.filesSearchToggleBtn) {
    elements.filesSearchToggleBtn.hidden = !authorized;
  }
  if (elements.filesGroupManagerToggleBtn) {
    elements.filesGroupManagerToggleBtn.hidden = !showUploadPanel;
    const managerOpen = showUploadPanel && Boolean(state.files.groupManager.open);
    elements.filesGroupManagerToggleBtn.classList.toggle("is-active", managerOpen);
    elements.filesGroupManagerToggleBtn.setAttribute("aria-expanded", managerOpen ? "true" : "false");
    const managerTitleKey = managerOpen
      ? "files_group_manager_toggle_close_label"
      : "files_group_manager_toggle_open_label";
    elements.filesGroupManagerToggleBtn.title = t(managerTitleKey);
    elements.filesGroupManagerToggleBtn.setAttribute("aria-label", t(managerTitleKey));
  }
  if (elements.filesGroupManagerToggleText) {
    const managerTextKey = showUploadPanel && state.files.groupManager.open
      ? "files_group_manager_toggle_close"
      : "files_group_manager_toggle_open";
    elements.filesGroupManagerToggleText.textContent = t(managerTextKey);
  }
  if (elements.filesGroupManagerWrap) {
    elements.filesGroupManagerWrap.hidden = !showUploadPanel || !state.files.groupManager.open;
  }
  if (!showUploadPanel) {
    state.files.groupManager.open = false;
    clearFilesGroupManagerState();
    clearFilesGroupRenameState();
    state.files.adminModal.active = "";
  }

  renderFilesSessionProfile({
    loggedIn,
    authorized,
    isAdmin,
    username: me.username,
    discordId: me.discordId,
    accessRequestStatus: me.accessRequestStatus,
    accessRequestDecidedAt: me.accessRequestDecidedAt,
    accessDisclaimerDecision: me.accessDisclaimerDecision,
    disclaimerRequired: me.disclaimerRequired
  });
  renderFilesDisclaimerGateView({
    loggedIn,
    authorized,
    accessRequestStatus: me.accessRequestStatus,
    accessRequestDecidedAt: me.accessRequestDecidedAt,
    accessDisclaimerDecision: me.accessDisclaimerDecision
  });
  renderFilesRestrictedView({
    loggedIn,
    authorized,
    username: me.username,
    discordId: me.discordId,
    accessRequestStatus: me.accessRequestStatus,
    accessRequestRequestedAt: me.accessRequestRequestedAt,
    accessRequestDecidedAt: me.accessRequestDecidedAt,
    accessRequestReapplyAt: me.accessRequestReapplyAt,
    accessRequestDeclineReason: me.accessRequestDeclineReason,
    accessDisclaimerDecision: me.accessDisclaimerDecision
  });
  renderFilesDeniedView({
    loggedIn,
    authorized,
    accessRequestStatus: me.accessRequestStatus,
    accessRequestDecidedAt: me.accessRequestDecidedAt,
    accessRequestReapplyAt: me.accessRequestReapplyAt,
    accessRequestDeclineReason: me.accessRequestDeclineReason
  });

  if (elements.filesUploadBtn) {
    elements.filesUploadBtn.disabled = state.files.uploadBusy;
  }
  if (elements.filesRestrictedRetryBtn) {
    const requestBusy = Boolean(state.files.accessRequestBusy);
    const requestPending = normalizeFilesAccessRequestStatus(me.accessRequestStatus) === "pending";
    const declinedCooldownActive = isFilesDeclinedCooldownActive(me);
    elements.filesRestrictedRetryBtn.disabled = requestBusy || requestPending || declinedCooldownActive || !showRestrictedLayout;
    elements.filesRestrictedRetryBtn.textContent = requestBusy
      ? t("files_restricted_request_button_busy")
      : requestPending
        ? t("files_restricted_request_button_pending")
        : t("files_restricted_retry_button");
  }
  if (elements.filesUploadInput) {
    elements.filesUploadInput.classList.toggle("is-invalid", state.files.uploadFieldInvalid);
  }
  if (elements.filesUploadFeedback) {
    if (state.files.uploadMissingFileError) {
      state.files.uploadMessage = t("files_upload_missing_file");
      state.files.uploadMessageKind = "error";
    }

    elements.filesUploadFeedback.classList.remove("is-error", "is-success");
    if (state.files.uploadMessageKind === "error") {
      elements.filesUploadFeedback.classList.add("is-error");
    } else if (state.files.uploadMessageKind === "success") {
      elements.filesUploadFeedback.classList.add("is-success");
    }

    const hasMessage = Boolean(state.files.uploadMessage);
    elements.filesUploadFeedback.hidden = !hasMessage;
    elements.filesUploadFeedback.textContent = hasMessage ? state.files.uploadMessage : "";
  }

  renderFilesAdminRequestsPanel();
  renderFilesBotAdminPanel();
  renderFilesBotAdminLeaveModal();
  renderFilesAdminModals();
  renderFilesGroupRenameModal();
  renderFilesCautionModal();
  renderFilesDisclaimerModal();
  renderFilesDecisionTabBadge();
  renderFilesList();
  renderFilesGroupManagerPanel();
}

function normalizeDropVirusStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (
    normalized === "queued"
    || normalized === "pending"
    || normalized === "clean"
    || normalized === "flagged"
    || normalized === "error"
    || normalized === "skipped"
  ) {
    return normalized;
  }
  return "unavailable";
}

function normalizeDropVirusStats(value) {
  const source = value && typeof value === "object" ? value : {};
  const normalizeCount = (raw) => {
    const parsed = Number.parseInt(String(raw ?? 0), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  return {
    harmless: normalizeCount(source.harmless),
    malicious: normalizeCount(source.malicious),
    suspicious: normalizeCount(source.suspicious),
    undetected: normalizeCount(source.undetected)
  };
}

function normalizeDropEntry(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const id = String(payload.id || "").trim().toLowerCase();
  const slug = String(payload.slug || "").trim();
  const sharePath = String(payload.sharePath || (slug ? `/drops/${encodeURIComponent(slug)}` : "")).trim();
  if (!id || !sharePath) {
    return null;
  }

  const shareUrl = String(payload.shareUrl || "").trim()
    || new URL(sharePath, window.location.origin).toString();

  return {
    id,
    slug,
    sharePath,
    shareUrl,
    name: String(payload.name || "").trim(),
    displayName: String(payload.displayName || payload.name || "").trim() || "--",
    mimeType: String(payload.mimeType || "application/octet-stream").trim() || "application/octet-stream",
    size: Math.max(0, Number(payload.size) || 0),
    description: String(payload.description || "").trim(),
    uploadedAt: String(payload.uploadedAt || "").trim(),
    updatedAt: String(payload.updatedAt || "").trim(),
    expiresAt: String(payload.expiresAt || "").trim(),
    maxDownloads: Math.max(0, Number(payload.maxDownloads) || 0),
    downloadCount: Math.max(0, Number(payload.downloadCount) || 0),
    remainingDownloads: Math.max(0, Number(payload.remainingDownloads) || 0),
    uploader: String(payload.uploader || "").trim(),
    virusTotal: {
      status: normalizeDropVirusStatus(payload.virusTotal?.status),
      permalink: String(payload.virusTotal?.permalink || "").trim(),
      stats: normalizeDropVirusStats(payload.virusTotal?.stats),
      lastError: String(payload.virusTotal?.lastError || "").trim()
    }
  };
}

let dropsUploadFeedbackTimer = null;
function setDropsUploadFeedback(message, kind = "") {
  if (dropsUploadFeedbackTimer !== null) {
    clearTimeout(dropsUploadFeedbackTimer);
    dropsUploadFeedbackTimer = null;
  }
  state.drops.uploadMessage = String(message || "");
  state.drops.uploadMessageKind = kind === "success" ? "success" : kind === "error" ? "error" : "";
  if (message) {
    const timeoutMs = kind === "error" ? 4500 : 3500;
    dropsUploadFeedbackTimer = setTimeout(() => {
      dropsUploadFeedbackTimer = null;
      state.drops.uploadMessage = "";
      state.drops.uploadMessageKind = "";
      renderDropsPage();
    }, timeoutMs);
  }
}

function resetDropsUploadProgress() {
  state.drops.uploadProgress.active = false;
  state.drops.uploadProgress.fileName = "";
  state.drops.uploadProgress.loadedBytes = 0;
  state.drops.uploadProgress.totalBytes = 0;
  state.drops.uploadProgress.percent = 0;
  state.drops.uploadProgress.phase = "";
}

function setDropsUploadProgress(patch = {}) {
  const progress = state.drops.uploadProgress;
  if (Object.prototype.hasOwnProperty.call(patch, "active")) {
    progress.active = Boolean(patch.active);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "fileName")) {
    progress.fileName = String(patch.fileName || "").trim();
  }
  if (Object.prototype.hasOwnProperty.call(patch, "loadedBytes")) {
    progress.loadedBytes = Math.max(0, Number(patch.loadedBytes) || 0);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "totalBytes")) {
    progress.totalBytes = Math.max(0, Number(patch.totalBytes) || 0);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "percent")) {
    progress.percent = Math.max(0, Math.min(100, Number(patch.percent) || 0));
  }
  if (Object.prototype.hasOwnProperty.call(patch, "phase")) {
    progress.phase = String(patch.phase || "").trim().toLowerCase();
  }
}

function getDropsUploadTelemetryCopy() {
  if (state.lang === "es") {
    return {
      badge: "TRANSFERENCIA DE ENLACE",
      idleFile: "Esperando enlace...",
      preparing: "Preparando enlace...",
      uploading: "Subiendo archivo...",
      finalizing: "Registrando enlace..."
    };
  }
  return {
    badge: "LINK TRANSFER",
    idleFile: "Awaiting uplink...",
    preparing: "Preparing uplink...",
    uploading: "Uploading payload...",
    finalizing: "Registering share..."
  };
}

function getDropsUploadTelemetryStatus() {
  const copy = getDropsUploadTelemetryCopy();
  const phase = String(state.drops.uploadProgress.phase || "").trim().toLowerCase();
  if (phase === "finalizing") {
    return copy.finalizing;
  }
  if (phase === "uploading") {
    return copy.uploading;
  }
  return copy.preparing;
}

function renderDropsUploadTelemetry() {
  if (
    !elements.dropsUploadTelemetry ||
    !elements.dropsUploadTelemetryBadge ||
    !elements.dropsUploadTelemetryFile ||
    !elements.dropsUploadTelemetryPercent ||
    !elements.dropsUploadTelemetryBar ||
    !elements.dropsUploadTelemetryFill ||
    !elements.dropsUploadTelemetryBytes ||
    !elements.dropsUploadTelemetryStatus
  ) {
    return;
  }

  const progress = state.drops.uploadProgress;
  const active = Boolean(progress.active);
  elements.dropsUploadTelemetry.hidden = !active;
  elements.dropsUploadTelemetry.dataset.phase = String(progress.phase || "").trim().toLowerCase() || "preparing";
  if (!active) {
    elements.dropsUploadTelemetryBar.setAttribute("aria-valuenow", "0");
    elements.dropsUploadTelemetryFill.style.width = "0%";
    delete elements.dropsUploadTelemetry.dataset.phase;
    return;
  }

  const copy = getDropsUploadTelemetryCopy();
  const totalBytes = Math.max(0, Number(progress.totalBytes) || 0);
  const rawLoadedBytes = Math.max(0, Number(progress.loadedBytes) || 0);
  const loadedBytes = totalBytes > 0 ? Math.min(rawLoadedBytes, totalBytes) : rawLoadedBytes;
  const percent = totalBytes > 0
    ? Math.max(0, Math.min(100, Number(progress.percent) || (loadedBytes / totalBytes) * 100))
    : Math.max(0, Math.min(100, Number(progress.percent) || 0));

  elements.dropsUploadTelemetryBadge.textContent = copy.badge;
  elements.dropsUploadTelemetryFile.textContent = progress.fileName || copy.idleFile;
  elements.dropsUploadTelemetryPercent.textContent = `${Math.round(percent)}%`;
  elements.dropsUploadTelemetryBar.setAttribute("aria-valuenow", String(Math.round(percent)));
  elements.dropsUploadTelemetryFill.style.width = `${percent}%`;
  elements.dropsUploadTelemetryBytes.textContent = totalBytes > 0
    ? `${formatFileSize(loadedBytes)} / ${formatFileSize(totalBytes)}`
    : formatFileSize(loadedBytes);
  elements.dropsUploadTelemetryStatus.textContent = getDropsUploadTelemetryStatus();
}

function getDropsDeleteModalCopy(shareName) {
  const label = String(shareName || "").trim() || (state.lang === "es" ? "este enlace temporal" : "this temporary share");
  if (state.lang === "es") {
    return {
      badge: "PURGA DE ENLACE",
      title: "ELIMINAR ENLACE TEMPORAL",
      message: `¿Eliminar ${label} ahora?`,
      cancel: "CANCELAR",
      confirm: "ELIMINAR ENLACE"
    };
  }
  return {
    badge: "TEMP LINK PURGE",
    title: "DELETE TEMP SHARE",
    message: `Delete ${label} now?`,
    cancel: "CANCEL",
    confirm: "DELETE SHARE"
  };
}

function renderDropsDeleteModal() {
  const modalState = state.drops.deleteModal;
  const isOpen = Boolean(modalState.open);
  const copy = getDropsDeleteModalCopy(modalState.shareName);

  if (elements.dropsDeleteBadge) {
    elements.dropsDeleteBadge.textContent = copy.badge;
  }
  if (elements.dropsDeleteTitle) {
    elements.dropsDeleteTitle.textContent = copy.title;
  }
  if (elements.dropsDeleteMessage) {
    elements.dropsDeleteMessage.textContent = copy.message;
  }
  if (elements.dropsDeleteCancelBtn) {
    elements.dropsDeleteCancelBtn.textContent = copy.cancel;
    elements.dropsDeleteCancelBtn.disabled = modalState.deleting;
  }
  if (elements.dropsDeleteConfirmBtn) {
    elements.dropsDeleteConfirmBtn.textContent = copy.confirm;
    elements.dropsDeleteConfirmBtn.disabled = modalState.deleting;
  }
  if (elements.dropsDeleteOverlay) {
    elements.dropsDeleteOverlay.classList.toggle("is-active", isOpen);
    elements.dropsDeleteOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }
}

function closeDropsDeleteModal({ force = false } = {}) {
  if (state.drops.deleteModal.deleting && !force) {
    return;
  }

  state.drops.deleteModal.open = false;
  state.drops.deleteModal.shareId = "";
  state.drops.deleteModal.shareName = "";
  state.drops.deleteModal.deleting = false;
  renderDropsDeleteModal();
}

function openDropsDeleteModal(shareId) {
  const normalizedShareId = String(shareId || "").trim().toLowerCase();
  if (!normalizedShareId || !state.files.me?.isAdmin) {
    return;
  }

  const matchedEntry = state.drops.list.find((entry) => entry.id === normalizedShareId) || null;
  if (!matchedEntry) {
    return;
  }
  const shareName = [matchedEntry.displayName, matchedEntry.name]
    .map((value) => String(value || "").trim())
    .find((value) => value && value !== "--")
    || "this temporary share";

  state.drops.deleteModal.open = true;
  state.drops.deleteModal.shareId = normalizedShareId;
  state.drops.deleteModal.shareName = shareName;
  state.drops.deleteModal.deleting = false;
  renderDropsDeleteModal();
  setTimeout(() => {
    elements.dropsDeleteConfirmBtn?.focus();
  }, 0);
}

async function confirmDropsDeleteModal() {
  if (!state.files.me?.isAdmin) {
    closeDropsDeleteModal({ force: true });
    return;
  }

  const shareId = String(state.drops.deleteModal.shareId || "").trim().toLowerCase();
  if (!shareId) {
    closeDropsDeleteModal({ force: true });
    return;
  }

  state.drops.deleteModal.deleting = true;
  renderDropsDeleteModal();

  try {
    await requestJson(`/api/admin/temp-shares/${encodeURIComponent(shareId)}`, {
      method: "DELETE"
    });
    closeDropsDeleteModal({ force: true });
    setDropsUploadFeedback(state.lang === "es" ? "Enlace temporal eliminado." : "Temporary share deleted.", "success");
    await refreshDrops();
  } catch (error) {
    closeDropsDeleteModal({ force: true });
    setDropsUploadFeedback(String(error?.message || (state.lang === "es" ? "No se pudo eliminar el enlace temporal." : "Unable to delete temporary share.")), "error");
    renderDropsPage();
  }
}

function formatDropsUploadFileName(name) {
  const value = String(name || "").trim();
  if (!value) {
    return "No file selected";
  }
  const extensionIndex = value.lastIndexOf(".");
  if (value.length <= 42) {
    return value;
  }
  if (extensionIndex > 0 && value.length - extensionIndex <= 10) {
    const extension = value.slice(extensionIndex);
    const base = value.slice(0, Math.max(1, 39 - extension.length));
    return `${base}...${extension}`;
  }
  return `${value.slice(0, 39)}...`;
}

function syncDropsUploadFileName() {
  if (!elements.dropsUploadFileName) {
    return;
  }
  const file = elements.dropsUploadInput?.files?.[0] || null;
  const hasFile = Boolean(file && String(file.name || "").trim());
  const fullName = hasFile ? String(file.name || "").trim() : "";
  elements.dropsUploadFileName.textContent = hasFile
    ? formatDropsUploadFileName(fullName)
    : "No file selected";
  elements.dropsUploadFileName.title = hasFile ? fullName : "";
  elements.dropsUploadFileName.classList.toggle("is-empty", !hasFile);
}

function normalizeDropsExpiryMode(mode) {
  return String(mode || "").trim().toLowerCase() === "datetime" ? "datetime" : "hours";
}

function formatDropDateTimeLocalValue(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function setDropsExpiryMode(mode, { render = true } = {}) {
  state.drops.expiryMode = normalizeDropsExpiryMode(mode);
  if (render) {
    renderDropsPage();
  }
}

function initDropsDatetimePicker() {
  const nativeInput = elements.dropsExpiresAtInput;
  const wrap = elements.dropsExpiresAtWrap;
  if (!nativeInput || !wrap) return;

  nativeInput.style.display = "none";
  nativeInput.setAttribute("tabindex", "-1");
  nativeInput.setAttribute("aria-hidden", "true");

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const TIME_WHEEL_THRESHOLD_PX = 18;

  let sel    = null;
  let viewY  = new Date().getFullYear();
  let viewM  = new Date().getMonth();
  let isOpen = false;

  // --- build DOM ---
  const display = document.createElement("button");
  display.type = "button";
  display.className = "drops-dt-display";
  display.setAttribute("aria-haspopup", "dialog");
  display.setAttribute("aria-expanded", "false");

  const calIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  calIcon.setAttribute("viewBox", "0 0 16 16");
  calIcon.setAttribute("fill", "none");
  calIcon.setAttribute("aria-hidden", "true");
  calIcon.classList.add("drops-dt-display-icon");
  calIcon.innerHTML = `<rect x="1" y="2.5" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/>` +
    `<line x1="1" y1="6" x2="15" y2="6" stroke="currentColor" stroke-width="1.4"/>` +
    `<line x1="5" y1="1" x2="5" y2="4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>` +
    `<line x1="11" y1="1" x2="11" y2="4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`;

  const displayText = document.createElement("span");
  displayText.textContent = "Select date & time…";
  display.append(calIcon, displayText);

  const popup = document.createElement("div");
  popup.className = "drops-dt-popup";
  popup.setAttribute("role", "dialog");
  popup.hidden = true;

  // calendar
  const calNav = document.createElement("div");
  calNav.className = "drops-dt-cal-nav";
  const prevBtn = document.createElement("button");
  prevBtn.type = "button"; prevBtn.className = "drops-dt-nav-btn"; prevBtn.innerHTML = "&#8249;"; prevBtn.setAttribute("aria-label", "Previous month");
  const monthLbl = document.createElement("span");
  monthLbl.className = "drops-dt-month-lbl";
  const nextBtn = document.createElement("button");
  nextBtn.type = "button"; nextBtn.className = "drops-dt-nav-btn"; nextBtn.innerHTML = "&#8250;"; nextBtn.setAttribute("aria-label", "Next month");
  calNav.append(prevBtn, monthLbl, nextBtn);

  const calGrid = document.createElement("div");
  calGrid.className = "drops-dt-cal-grid";

  const calSection = document.createElement("div");
  calSection.className = "drops-dt-cal-section";
  calSection.append(calNav, calGrid);

  // time columns
  const hourCol  = document.createElement("div"); hourCol.className  = "drops-dt-time-col drops-dt-time-col-hour";
  const colonEl  = document.createElement("span"); colonEl.className = "drops-dt-time-colon"; colonEl.textContent = ":";
  const minCol   = document.createElement("div"); minCol.className   = "drops-dt-time-col drops-dt-time-col-minute";
  const ampmCol  = document.createElement("div"); ampmCol.className  = "drops-dt-time-col drops-dt-ampm-col drops-dt-time-col-ampm";
  const timeSection = document.createElement("div");
  timeSection.className = "drops-dt-time-section";
  timeSection.append(hourCol, colonEl, minCol, ampmCol);
  // highlight band sits on top of the columns, centred in the scroll window
  const timeHighlight = document.createElement("div");
  timeHighlight.className = "drops-dt-time-highlight";
  timeSection.appendChild(timeHighlight);

  // footer
  const clearBtn = document.createElement("button");
  clearBtn.type = "button"; clearBtn.className = "drops-dt-foot-btn"; clearBtn.textContent = "Clear";
  const nowBtn = document.createElement("button");
  nowBtn.type = "button"; nowBtn.className = "drops-dt-foot-btn drops-dt-foot-accent"; nowBtn.textContent = "Now";
  const footer = document.createElement("div");
  footer.className = "drops-dt-footer";
  footer.append(clearBtn, nowBtn);

  popup.append(calSection, timeSection, footer);
  wrap.append(display);
  document.body.append(popup);

  // --- rendering ---
  function renderCalendar() {
    monthLbl.textContent = `${MONTHS[viewM]} ${viewY}`;
    calGrid.innerHTML = "";
    DAYS.forEach(d => {
      const h = document.createElement("span");
      h.className = "drops-dt-cal-hdr"; h.textContent = d;
      calGrid.appendChild(h);
    });
    const firstDay = new Date(viewY, viewM, 1).getDay();
    for (let i = 0; i < firstDay; i++) {
      const b = document.createElement("span"); b.className = "drops-dt-cal-blank";
      calGrid.appendChild(b);
    }
    const today = new Date();
    const dim = new Date(viewY, viewM + 1, 0).getDate();
    for (let d = 1; d <= dim; d++) {
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "drops-dt-cal-day"; btn.textContent = d;
      if (today.getFullYear() === viewY && today.getMonth() === viewM && today.getDate() === d) btn.classList.add("is-today");
      if (sel && sel.y === viewY && sel.mo === viewM && sel.d === d) btn.classList.add("is-selected");
      btn.addEventListener("click", () => {
        if (!sel) { const n = new Date(); sel = { y: viewY, mo: viewM, d, h: n.getHours(), mi: n.getMinutes() }; }
        else { sel = { ...sel, y: viewY, mo: viewM, d }; }
        renderCalendar(); renderTime(); commit();
      });
      calGrid.appendChild(btn);
    }
  }

  function renderTimeCol(el, items, selectedVal) {
    el.innerHTML = "";
    // top spacer — lets the first item scroll to the centre highlight band
    const topSpacer = document.createElement("div");
    topSpacer.className = "drops-dt-time-spacer";
    el.appendChild(topSpacer);
    items.forEach(item => {
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "drops-dt-time-item"; btn.textContent = item.lbl; btn.dataset.val = item.val;
      const label = document.createElement("span");
      label.className = "drops-dt-time-item-text";
      label.textContent = item.lbl;
      btn.textContent = "";
      btn.appendChild(label);
      if (item.val === selectedVal) btn.classList.add("is-selected");
      btn.addEventListener("click", () => {
        if (!sel) { const n = new Date(); sel = { y: n.getFullYear(), mo: n.getMonth(), d: n.getDate(), h: n.getHours(), mi: n.getMinutes() }; }
        if (el === hourCol) {
          const isAm = sel.h < 12;
          let hv = Number(item.val); if (hv === 12) hv = 0;
          sel.h = isAm ? hv : hv + 12;
        } else if (el === minCol) {
          sel.mi = Number(item.val);
        } else {
          const h12 = sel.h % 12;
          sel.h = item.val === "AM" ? h12 : h12 + 12;
        }
        renderTime(); commit();
      });
      el.appendChild(btn);
    });
    // bottom spacer — lets the last item scroll to the centre highlight band
    const botSpacer = document.createElement("div");
    botSpacer.className = "drops-dt-time-spacer";
    el.appendChild(botSpacer);
    requestAnimationFrame(() => {
      syncDropsTimeColumnScroll(el);
    });
  }

  function syncDropsTimeColumnScroll(el) {
    const selected = el.querySelector(".is-selected");
    if (!(selected instanceof HTMLElement)) {
      return;
    }
    const snapToSelected = () => {
      const target = Math.max(0, selected.offsetTop - (el.clientHeight - selected.offsetHeight) / 2);
      el.scrollTop = Math.round(target);
    };
    snapToSelected();
    requestAnimationFrame(snapToSelected);
  }

  function renderTime() {
    const h24 = sel ? sel.h : new Date().getHours();
    const mi  = sel ? sel.mi : new Date().getMinutes();
    const h12val = h24 % 12 === 0 ? 12 : h24 % 12;
    const ampm = h24 < 12 ? "AM" : "PM";
    const hours = Array.from({ length: 12 }, (_, i) => {
      const hour = i + 1;
      return { lbl: String(hour).padStart(2, "0"), val: hour };
    });
    const mins  = Array.from({ length: 60 }, (_, i) => ({ lbl: String(i).padStart(2, "0"), val: i }));
    renderTimeCol(hourCol, hours, h12val);
    renderTimeCol(minCol, mins, mi);
    renderTimeCol(ampmCol, [{ lbl: "AM", val: "AM" }, { lbl: "PM", val: "PM" }], ampm);
  }

  function ensureDropsTimeSelection() {
    if (sel) {
      return;
    }
    const now = new Date();
    sel = {
      y: now.getFullYear(),
      mo: now.getMonth(),
      d: now.getDate(),
      h: now.getHours(),
      mi: now.getMinutes()
    };
  }

  function stepDropsHour(direction) {
    ensureDropsTimeSelection();
    const currentHour12 = sel.h % 12 === 0 ? 12 : sel.h % 12;
    const nextHour12 = Math.max(1, Math.min(12, currentHour12 + direction));
    const isAm = sel.h < 12;
    const normalizedHour = nextHour12 === 12 ? 0 : nextHour12;
    sel.h = isAm ? normalizedHour : normalizedHour + 12;
  }

  function stepDropsMinute(direction) {
    ensureDropsTimeSelection();
    sel.mi = Math.max(0, Math.min(59, sel.mi + direction));
  }

  function stepDropsMeridiem(direction) {
    ensureDropsTimeSelection();
    if (direction > 0 && sel.h < 12) {
      sel.h += 12;
    } else if (direction < 0 && sel.h >= 12) {
      sel.h -= 12;
    }
  }

  function handleDropsTimeWheelStep(targetCol, direction) {
    if (!isOpen || !direction) {
      return;
    }
    if (targetCol === hourCol) {
      stepDropsHour(direction);
    } else if (targetCol === minCol) {
      stepDropsMinute(direction);
    } else if (targetCol === ampmCol) {
      stepDropsMeridiem(direction);
    } else {
      return;
    }
    renderTime();
    commit();
  }

  function bindDropsTimeWheel(targetCol) {
    let deltaCarry = 0;
    let resetTimer = 0;
    targetCol.addEventListener("wheel", (event) => {
      if (!isOpen) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const threshold = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 1 : TIME_WHEEL_THRESHOLD_PX;
      deltaCarry += Number(event.deltaY) || 0;
      if (Math.abs(deltaCarry) >= threshold) {
        const direction = deltaCarry > 0 ? 1 : -1;
        deltaCarry = 0;
        handleDropsTimeWheelStep(targetCol, direction);
      }
      if (resetTimer) {
        clearTimeout(resetTimer);
      }
      resetTimer = window.setTimeout(() => {
        deltaCarry = 0;
        resetTimer = 0;
      }, 120);
    }, { passive: false });
  }

  function commit() {
    if (!sel) { nativeInput.value = ""; }
    else {
      const y  = String(sel.y).padStart(4, "0");
      const mo = String(sel.mo + 1).padStart(2, "0");
      const d  = String(sel.d).padStart(2, "0");
      const h  = String(sel.h).padStart(2, "0");
      const mi = String(sel.mi).padStart(2, "0");
      nativeInput.value = `${y}-${mo}-${d}T${h}:${mi}`;
    }
    nativeInput.dispatchEvent(new Event("input", { bubbles: true }));
    updateDisplay();
  }

  function updateDisplay() {
    if (!sel) {
      displayText.textContent = "Select date & time…";
      display.classList.remove("has-value");
    } else {
      const h12 = sel.h % 12 === 0 ? 12 : sel.h % 12;
      const ampm = sel.h < 12 ? "AM" : "PM";
      const mo = String(sel.mo + 1).padStart(2, "0");
      const d  = String(sel.d).padStart(2, "0");
      const mi = String(sel.mi).padStart(2, "0");
      displayText.textContent = `${mo}/${d}/${sel.y}  ${h12}:${mi} ${ampm}`;
      display.classList.add("has-value");
    }
  }

  function positionPopup() {
    const rect   = display.getBoundingClientRect();
    const popupW = 340;
    const estH   = 480;

    // Open to the right of the button
    let left = rect.right + 8;
    if (left + popupW > window.innerWidth - 8) {
      left = Math.max(8, rect.left - popupW - 8);
    }

    // Center vertically on the button, clamped to viewport
    let top = rect.top + rect.height / 2 - estH / 2;
    top = Math.max(8, Math.min(top, window.innerHeight - estH - 8));

    popup.style.left = `${left}px`;
    popup.style.top  = `${top}px`;
  }

  function openPicker() {
    // sync from native input if it has a value
    if (nativeInput.value) {
      const [dp, tp] = nativeInput.value.split("T");
      if (dp && tp) {
        const [y, mo, d] = dp.split("-").map(Number);
        const [h, mi]    = tp.split(":").map(Number);
        sel = { y, mo: mo - 1, d, h, mi };
        viewY = y; viewM = mo - 1;
      }
    }
    isOpen = true;
    positionPopup();
    popup.hidden = false;
    display.setAttribute("aria-expanded", "true");
    renderCalendar();
    renderTime();
  }

  function closePicker() {
    isOpen = false;
    popup.hidden = true;
    display.setAttribute("aria-expanded", "false");
  }

  // expose reset so resetDropsExpiryControls can clear the display
  nativeInput._dtPickerReset = () => { sel = null; updateDisplay(); };

  display.addEventListener("click", e => { e.stopPropagation(); isOpen ? closePicker() : openPicker(); });
  popup.addEventListener("click", e => e.stopPropagation());
  document.addEventListener("click", () => { if (isOpen) closePicker(); });
  prevBtn.addEventListener("click", () => { viewM--; if (viewM < 0) { viewM = 11; viewY--; } renderCalendar(); });
  nextBtn.addEventListener("click", () => { viewM++; if (viewM > 11) { viewM = 0; viewY++; } renderCalendar(); });
  bindDropsTimeWheel(hourCol);
  bindDropsTimeWheel(minCol);
  bindDropsTimeWheel(ampmCol);
  clearBtn.addEventListener("click", () => { sel = null; commit(); closePicker(); });
  nowBtn.addEventListener("click", () => {
    const n = new Date();
    sel = { y: n.getFullYear(), mo: n.getMonth(), d: n.getDate(), h: n.getHours(), mi: n.getMinutes() };
    viewY = sel.y; viewM = sel.mo;
    renderCalendar(); renderTime(); commit(); closePicker();
  });

  renderCalendar();
  renderTime();
}

function resetDropsExpiryControls() {
  state.drops.expiryMode = "hours";
  if (elements.dropsExpiresHoursInput) {
    elements.dropsExpiresHoursInput.value = "";
  }
  if (elements.dropsExpiresAtInput) {
    elements.dropsExpiresAtInput.value = "";
    if (typeof elements.dropsExpiresAtInput._dtPickerReset === "function") {
      elements.dropsExpiresAtInput._dtPickerReset();
    }
  }
}

function getDropShareUrl(entry) {
  if (entry?.shareUrl) {
    return String(entry.shareUrl);
  }
  const sharePath = String(entry?.sharePath || "").trim();
  if (!sharePath) {
    return "";
  }
  return new URL(sharePath, window.location.origin).toString();
}

function buildDropVirusBadgeState(entry) {
  const status = normalizeDropVirusStatus(entry?.virusTotal?.status);
  const stats = normalizeDropVirusStats(entry?.virusTotal?.stats);
  const detected = Math.max(0, stats.malicious + stats.suspicious);

  if (status === "clean") {
    return {
      className: "is-safe",
      title: "VT SAFE",
      body: `${detected} detections`
    };
  }
  if (status === "flagged") {
    return {
      className: "is-flagged",
      title: "VT FLAGGED",
      body: `${detected} detections`
    };
  }
  if (status === "pending" || status === "queued") {
    return {
      className: "is-pending",
      title: "VT SCANNING",
      body: "Awaiting result"
    };
  }
  if (status === "error") {
    return {
      className: "is-error",
      title: "VT ERROR",
      body: "Scan unavailable"
    };
  }
  if (status === "skipped") {
    return {
      className: "is-muted",
      title: "VT SKIPPED",
      body: "Not scanned"
    };
  }
  return {
    className: "is-muted",
    title: "VT UNCHECKED",
    body: "Not scanned"
  };
}

function renderDropsAdminTabVisibility() {
  if (!elements.tabDrops) {
    return;
  }
  const me = normalizeFilesProfile(state.files.me);
  const isAdmin = Boolean(me.loggedIn && hasFilesAuthorizedAccess(me) && me.isAdmin);
  elements.tabDrops.hidden = !isAdmin;
  elements.tabDrops.setAttribute("aria-hidden", isAdmin ? "false" : "true");
}

function renderDropsList() {
  if (!elements.dropsList || !elements.dropsEmptyState || !elements.dropsListMeta) {
    return;
  }

  const entries = Array.isArray(state.drops.list) ? state.drops.list : [];
  const progressActive = Boolean(state.drops.uploadProgress.active);
  elements.dropsList.replaceChildren();

  if (state.drops.loading) {
    elements.dropsListMeta.textContent = "Refreshing temporary shares...";
  } else if (state.drops.error) {
    elements.dropsListMeta.textContent = state.drops.error;
  } else {
    const uploadLimitLabel = state.drops.uploadLimitBytes > 0 ? formatFileSize(state.drops.uploadLimitBytes) : "--";
    const vtLabel = state.drops.virusTotalConfigured ? "VirusTotal scanning enabled." : "VirusTotal not configured.";
    elements.dropsListMeta.textContent = `Upload limit ${uploadLimitLabel}. Max retention ${state.drops.retentionMaxHours || "--"} hours. ${vtLabel}`;
  }

  renderDropsUploadTelemetry();
  elements.dropsEmptyState.hidden = state.drops.loading || progressActive || entries.length > 0;
  if (!entries.length) {
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const entry of entries) {
    const badge = buildDropVirusBadgeState(entry);

    const card = document.createElement("article");
    card.className = "drops-item";

    const header = document.createElement("div");
    header.className = "drops-item-head";

    const heading = document.createElement("div");
    heading.className = "drops-item-heading";

    const title = document.createElement("h3");
    title.className = "drops-item-title";
    title.textContent = entry.displayName;
    heading.appendChild(title);

    const url = document.createElement("p");
    url.className = "drops-item-url";
    url.textContent = getDropShareUrl(entry);
    heading.appendChild(url);

    header.appendChild(heading);

    const virusBadge = document.createElement("div");
    virusBadge.className = `drops-virus-badge ${badge.className}`.trim();
    const virusTitle = document.createElement("span");
    virusTitle.className = "drops-virus-title";
    virusTitle.textContent = badge.title;
    const virusBody = document.createElement("span");
    virusBody.className = "drops-virus-body";
    virusBody.textContent = badge.body;
    virusBadge.appendChild(virusTitle);
    virusBadge.appendChild(virusBody);
    header.appendChild(virusBadge);

    const meta = document.createElement("div");
    meta.className = "drops-item-meta";

    const metaRows = [
      [
        { label: "TYPE", value: String(entry.mimeType || "").trim() || "--" },
        { label: "SIZE", value: formatFileSize(entry.size) }
      ],
      [
        { label: "UPLOADED", value: formatFileDateTime(entry.uploadedAt) },
        { label: "EXPIRES", value: entry.expiresAt ? formatFileDateTime(entry.expiresAt) : "Download limit only" }
      ],
      [
        {
          label: "DOWNLOADS",
          value: entry.maxDownloads > 0
            ? `${entry.downloadCount} / ${entry.maxDownloads}`
            : `${entry.downloadCount} used`
        },
        entry.uploader ? { label: "UPLOADER", value: entry.uploader } : null
      ].filter(Boolean)
    ];

    for (const rowItems of metaRows) {
      const row = document.createElement("div");
      row.className = "drops-meta-row";
      for (const item of rowItems) {
        const cell = document.createElement("div");
        cell.className = "drops-meta-cell";
        const lbl = document.createElement("span");
        lbl.className = "drops-meta-cell-label";
        lbl.textContent = item.label;
        const val = document.createElement("span");
        val.className = "drops-meta-cell-value";
        val.textContent = item.value;
        cell.appendChild(lbl);
        cell.appendChild(val);
        row.appendChild(cell);
      }
      meta.appendChild(row);
    }

    const description = document.createElement("p");
    description.className = "drops-item-description";
    description.textContent = entry.description || "No public description added.";

    const actions = document.createElement("div");
    actions.className = "drops-item-actions";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "files-btn drops-item-btn";
    copyButton.textContent = "COPY LINK";
    copyButton.setAttribute("data-drops-action", "copy");
    copyButton.setAttribute("data-share-id", entry.id);
    actions.appendChild(copyButton);

    const openLink = document.createElement("a");
    openLink.className = "files-btn drops-item-btn";
    openLink.href = getDropShareUrl(entry);
    openLink.target = "_blank";
    openLink.rel = "noopener noreferrer";
    openLink.textContent = "OPEN LINK";
    actions.appendChild(openLink);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "files-btn drops-item-btn is-delete";
    deleteButton.textContent = "DELETE";
    deleteButton.setAttribute("data-drops-action", "delete");
    deleteButton.setAttribute("data-share-id", entry.id);
    actions.appendChild(deleteButton);

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(description);
    card.appendChild(actions);
    fragment.appendChild(card);
  }

  elements.dropsList.appendChild(fragment);
}

function renderDropsPage() {
  renderDropsAdminTabVisibility();
  if (!elements.dropsGatePanel || !elements.dropsAdminView || !elements.dropsUploadFeedback) {
    return;
  }

  const me = normalizeFilesProfile(state.files.me);
  const isAdmin = Boolean(me.loggedIn && hasFilesAuthorizedAccess(me) && me.isAdmin);
  const loadingIdentity = Boolean(state.files.loadingMe);
  const showGate = !isAdmin;
  const hasActiveShare = Array.isArray(state.drops.list) && state.drops.list.length > 0;
  const uploadsLocked = state.drops.uploadBusy || !isAdmin || hasActiveShare;

  if (showGate && state.drops.deleteModal.open) {
    closeDropsDeleteModal({ force: true });
  }

  elements.dropsGatePanel.hidden = !showGate;
  elements.dropsAdminView.hidden = !isAdmin;

  if (showGate) {
    const message = loadingIdentity
      ? "Checking administrator clearance for this console..."
      : !me.loggedIn
        ? "Log in with the configured admin Discord account to open the temporary share console."
        : "This tab is visible only to the configured admin account.";
    if (elements.dropsGateMessage) {
      elements.dropsGateMessage.textContent = message;
    }
  }

  const feedbackMessage = String(state.drops.uploadMessage || "");
  elements.dropsUploadFeedback.hidden = !feedbackMessage;
  elements.dropsUploadFeedback.textContent = feedbackMessage;
  elements.dropsUploadFeedback.classList.toggle("is-success", state.drops.uploadMessageKind === "success");
  elements.dropsUploadFeedback.classList.toggle("is-error", state.drops.uploadMessageKind === "error");

  if (elements.dropsUploadBtn) {
    elements.dropsUploadBtn.disabled = uploadsLocked;
    elements.dropsUploadBtn.textContent = state.drops.uploadBusy
      ? "CREATING..."
      : hasActiveShare
        ? "DELETE CURRENT SHARE FIRST"
        : "CREATE SHARE";
  }
  if (elements.dropsUploadPickerBtn) {
    elements.dropsUploadPickerBtn.disabled = uploadsLocked;
  }
  if (elements.dropsUploadInput) {
    elements.dropsUploadInput.disabled = uploadsLocked;
  }
  if (elements.dropsDisplayNameInput) {
    elements.dropsDisplayNameInput.disabled = uploadsLocked;
  }
  if (elements.dropsMaxDownloadsInput) {
    elements.dropsMaxDownloadsInput.disabled = uploadsLocked;
  }
  if (elements.dropsExpiryModeHoursBtn) {
    elements.dropsExpiryModeHoursBtn.disabled = uploadsLocked;
  }
  if (elements.dropsExpiryModeDateBtn) {
    elements.dropsExpiryModeDateBtn.disabled = uploadsLocked;
  }
  if (elements.dropsExpiresHoursInput) {
    elements.dropsExpiresHoursInput.disabled = uploadsLocked;
  }
  if (elements.dropsExpiresAtInput) {
    elements.dropsExpiresAtInput.disabled = uploadsLocked;
  }
  if (elements.dropsDescriptionInput) {
    elements.dropsDescriptionInput.disabled = uploadsLocked;
  }
  if (elements.dropsLangToggleBtn) {
    elements.dropsLangToggleBtn.disabled = uploadsLocked;
  }
  if (uploadsLocked) {
    setDropsLangMenuOpen(false);
  }
  if (elements.dropsRefreshBtn) {
    elements.dropsRefreshBtn.disabled = state.drops.loading || state.drops.uploadBusy || !isAdmin;
    elements.dropsRefreshBtn.textContent = state.drops.loading
      ? "REFRESHING..."
      : state.drops.uploadBusy
        ? "UPLOADING..."
        : "REFRESH";
  }
  renderDropsDeleteModal();
  const expiryMode = normalizeDropsExpiryMode(state.drops.expiryMode);
  if (elements.dropsExpiryModeHoursBtn) {
    const isActive = expiryMode === "hours";
    elements.dropsExpiryModeHoursBtn.classList.toggle("is-active", isActive);
    elements.dropsExpiryModeHoursBtn.setAttribute("aria-pressed", isActive ? "true" : "false");
  }
  if (elements.dropsExpiryModeDateBtn) {
    const isActive = expiryMode === "datetime";
    elements.dropsExpiryModeDateBtn.classList.toggle("is-active", isActive);
    elements.dropsExpiryModeDateBtn.setAttribute("aria-pressed", isActive ? "true" : "false");
  }
  if (elements.dropsExpiresHoursWrap) {
    elements.dropsExpiresHoursWrap.hidden = expiryMode !== "hours";
  }
  if (elements.dropsExpiresAtWrap) {
    elements.dropsExpiresAtWrap.hidden = expiryMode !== "datetime";
  }
  if (elements.dropsExpiryHint) {
    elements.dropsExpiryHint.textContent = expiryMode === "datetime"
      ? "Pick the exact local date and time when this share should self-delete."
      : "Set a relative expiration in hours from the moment you create the share.";
  }
  if (elements.dropsExpiresAtInput) {
    const now = new Date();
    const minDate = new Date(now.getTime() + 60 * 1000);
    const maxDate = state.drops.retentionMaxHours > 0
      ? new Date(now.getTime() + state.drops.retentionMaxHours * 60 * 60 * 1000)
      : null;
    elements.dropsExpiresAtInput.min = formatDropDateTimeLocalValue(minDate);
    elements.dropsExpiresAtInput.max = maxDate ? formatDropDateTimeLocalValue(maxDate) : "";
  }
  syncDropsUploadFileName();

  renderDropsList();
}

let dropsVtPollTimer = null;
let dropsCountPollTimer = null;

function stopDropsCountAutoPoll() {
  if (dropsCountPollTimer !== null) {
    clearInterval(dropsCountPollTimer);
    dropsCountPollTimer = null;
  }
}

function startDropsCountAutoPoll() {
  if (dropsCountPollTimer !== null) return;
  dropsCountPollTimer = setInterval(async () => {
    if (state.view !== "drops") {
      stopDropsCountAutoPoll();
      return;
    }
    await refreshDrops({ silent: true });
  }, 30000);
}

function dropsHasPendingVtScans() {
  return state.drops.virusTotalConfigured && state.drops.list.some((entry) => {
    const s = String(entry?.virusTotal?.status || "").trim();
    return s === "queued" || s === "pending";
  });
}

function stopDropsVtAutoPoll() {
  if (dropsVtPollTimer !== null) {
    clearInterval(dropsVtPollTimer);
    dropsVtPollTimer = null;
  }
}

function startDropsVtAutoPoll() {
  if (dropsVtPollTimer !== null) {
    return;
  }
  dropsVtPollTimer = setInterval(async () => {
    if (state.view !== "drops" || !dropsHasPendingVtScans()) {
      stopDropsVtAutoPoll();
      return;
    }
    await refreshDrops({ silent: true });
  }, 5000);
}

async function refreshDrops({ silent = false } = {}) {
  const me = normalizeFilesProfile(state.files.me);
  if (!hasFilesAuthorizedAccess(me) || !me.isAdmin) {
    state.drops.list = [];
    state.drops.loading = false;
    state.drops.error = "";
    stopDropsVtAutoPoll();
    renderDropsPage();
    return;
  }

  if (!silent) {
    state.drops.loading = true;
    state.drops.error = "";
    renderDropsPage();
  }

  try {
    const payload = await requestJson("/api/admin/temp-shares");
    state.drops.list = (Array.isArray(payload.entries) ? payload.entries : [])
      .map((entry) => normalizeDropEntry(entry))
      .filter(Boolean);
    state.drops.virusTotalConfigured = Boolean(payload.virusTotalConfigured);
    state.drops.uploadLimitBytes = Math.max(0, Number(payload.uploadLimitBytes) || 0);
    state.drops.retentionMaxHours = Math.max(0, Number(payload.retentionMaxHours) || 0);
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      stopDropsVtAutoPoll();
      await refreshFilesIdentity({ loadFiles: false });
      return;
    }
    state.drops.list = [];
    state.drops.error = String(error?.message || "Unable to load temporary shares.");
  } finally {
    if (!silent) {
      state.drops.loading = false;
    }
  }

  renderDropsPage();
  if (dropsHasPendingVtScans()) {
    startDropsVtAutoPoll();
  } else {
    stopDropsVtAutoPoll();
  }
  startDropsCountAutoPoll();
}

async function handleDropsUploadSubmit() {
  if (state.drops.uploadBusy) {
    return;
  }
  if (Array.isArray(state.drops.list) && state.drops.list.length > 0) {
    setDropsUploadFeedback("Delete the current temporary share before uploading another file.", "error");
    renderDropsPage();
    return;
  }

  const file = elements.dropsUploadInput?.files?.[0] || null;
  const maxDownloadsRaw = String(elements.dropsMaxDownloadsInput?.value || "").trim();
  const expiryMode = normalizeDropsExpiryMode(state.drops.expiryMode);
  const expiresHoursRaw = String(elements.dropsExpiresHoursInput?.value || "").trim();
  const expiresAtRaw = String(elements.dropsExpiresAtInput?.value || "").trim();
  const maxDownloads = maxDownloadsRaw ? Math.max(0, Number.parseInt(maxDownloadsRaw, 10) || 0) : 0;
  const expiresInHours = expiryMode === "hours" && expiresHoursRaw
    ? Math.max(0, Number.parseInt(expiresHoursRaw, 10) || 0)
    : 0;
  const expiresAtMs = expiryMode === "datetime" && expiresAtRaw ? Date.parse(expiresAtRaw) : Number.NaN;
  const expiresAtIso = Number.isFinite(expiresAtMs) ? new Date(expiresAtMs).toISOString() : "";
  const maxRetentionMs = Math.max(0, Number(state.drops.retentionMaxHours) || 0) * 60 * 60 * 1000;

  if (!file) {
    setDropsUploadFeedback("Select a file before creating a share.", "error");
    renderDropsPage();
    return;
  }
  if (state.drops.uploadLimitBytes > 0 && Number(file.size) > state.drops.uploadLimitBytes) {
    setDropsUploadFeedback(`File exceeds the ${formatFileSize(state.drops.uploadLimitBytes)} upload limit.`, "error");
    renderDropsPage();
    return;
  }
  if (expiryMode === "datetime" && expiresAtRaw) {
    if (!expiresAtIso) {
      setDropsUploadFeedback("Pick a valid expiration date and time.", "error");
      renderDropsPage();
      return;
    }
    if (expiresAtMs <= Date.now() + 30 * 1000) {
      setDropsUploadFeedback("Pick a future expiration date and time.", "error");
      renderDropsPage();
      return;
    }
    if (maxRetentionMs > 0 && expiresAtMs - Date.now() > maxRetentionMs) {
      setDropsUploadFeedback(`Expiration cannot exceed ${state.drops.retentionMaxHours} hours from now.`, "error");
      renderDropsPage();
      return;
    }
  }
  if (maxDownloads <= 0 && expiresInHours <= 0 && !expiresAtIso) {
    setDropsUploadFeedback("Add a download limit or an expiration time before creating a share.", "error");
    renderDropsPage();
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("displayName", String(elements.dropsDisplayNameInput?.value || "").trim());
  formData.append("description", String(elements.dropsDescriptionInput?.value || "").trim());
  formData.append("lang", String(elements.dropsLangSelect?.value || "en").trim());
  if (maxDownloads > 0) {
    formData.append("maxDownloads", String(maxDownloads));
  }
  if (expiresInHours > 0) {
    formData.append("expiresInHours", String(expiresInHours));
  }
  if (expiresAtIso) {
    formData.append("expiresAt", expiresAtIso);
  }

  state.drops.uploadBusy = true;
  setDropsUploadProgress({
    active: true,
    fileName: String(file.name || "").trim(),
    loadedBytes: 0,
    totalBytes: Math.max(0, Number(file.size) || 0),
    percent: 0,
    phase: "preparing"
  });
  setDropsUploadFeedback("", "");
  renderDropsPage();

  try {
    await requestJsonWithUploadProgress("/api/admin/temp-shares", {
      method: "POST",
      body: formData,
      onUploadProgress: ({ loaded, total, lengthComputable }) => {
        const totalBytes = lengthComputable && Number(total) > 0
          ? Math.max(0, Number(total) || 0)
          : Math.max(0, Number(file.size) || 0);
        const loadedBytes = Math.max(0, Number(loaded) || 0);
        setDropsUploadProgress({
          active: true,
          fileName: String(file.name || "").trim(),
          loadedBytes,
          totalBytes,
          percent: totalBytes > 0 ? (loadedBytes / totalBytes) * 100 : 0,
          phase: "uploading"
        });
        renderDropsUploadTelemetry();
      },
      onUploadComplete: () => {
        const totalBytes = Math.max(
          0,
          Number(state.drops.uploadProgress.totalBytes) || 0,
          Number(file.size) || 0
        );
        setDropsUploadProgress({
          active: true,
          fileName: String(file.name || "").trim(),
          loadedBytes: totalBytes,
          totalBytes,
          percent: 100,
          phase: "finalizing"
        });
        renderDropsUploadTelemetry();
      }
    });
    resetDropsUploadProgress();
    if (elements.dropsUploadForm instanceof HTMLFormElement) {
      elements.dropsUploadForm.reset();
    }
    syncDropsLangMenu();
    setDropsLangMenuOpen(false);
    resetDropsExpiryControls();
    syncDropsUploadFileName();
    setDropsUploadFeedback("Temporary share created.", "success");
    await refreshDrops();
  } catch (error) {
    resetDropsUploadProgress();
    setDropsUploadFeedback(String(error?.message || "Unable to create temporary share."), "error");
  } finally {
    state.drops.uploadBusy = false;
    renderDropsPage();
  }
}

async function handleDropsListClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const actionTarget = target.closest("[data-drops-action]");
  if (!(actionTarget instanceof HTMLElement)) {
    return;
  }

  const action = String(actionTarget.dataset.dropsAction || "").trim();
  const shareId = String(actionTarget.dataset.shareId || "").trim().toLowerCase();
  const matchedEntry = state.drops.list.find((entry) => entry.id === shareId) || null;
  if (!matchedEntry) {
    return;
  }

  if (action === "copy") {
    try {
      await copyTextToClipboard(getDropShareUrl(matchedEntry));
      setDropsUploadFeedback("Public link copied.", "success");
    } catch {
      setDropsUploadFeedback("Unable to copy the public link.", "error");
    }
    renderDropsPage();
    return;
  }

  if (action === "delete") {
    openDropsDeleteModal(shareId);
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    cache: "no-store",
    ...options
  });

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = new Error(payload?.error || payload?.message || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return payload || {};
}

function requestJsonWithUploadProgress(url, options = {}) {
  const {
    method = "GET",
    headers = {},
    body = null,
    onUploadProgress = null,
    onUploadComplete = null
  } = options;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(String(method || "GET").toUpperCase(), url, true);
    xhr.responseType = "text";
    xhr.setRequestHeader("Accept", "application/json");

    for (const [key, value] of Object.entries(headers || {})) {
      if (value != null) {
        xhr.setRequestHeader(key, value);
      }
    }

    xhr.addEventListener("load", () => {
      let payload = null;
      const text = typeof xhr.responseText === "string" ? xhr.responseText : "";
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = null;
        }
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        const error = new Error(payload?.error || payload?.message || `HTTP ${xhr.status}`);
        error.status = xhr.status;
        reject(error);
        return;
      }

      resolve(payload || {});
    });

    xhr.addEventListener("error", () => {
      const error = new Error("Network request failed.");
      error.status = 0;
      reject(error);
    });

    xhr.addEventListener("abort", () => {
      const error = new Error("Upload request was aborted.");
      error.status = 0;
      reject(error);
    });

    if (xhr.upload && typeof onUploadProgress === "function") {
      xhr.upload.addEventListener("progress", (event) => {
        onUploadProgress({
          loaded: event.loaded,
          total: event.total,
          lengthComputable: event.lengthComputable
        });
      });
    }

    if (xhr.upload && typeof onUploadComplete === "function") {
      xhr.upload.addEventListener("load", () => {
        onUploadComplete();
      }, { once: true });
    }

    xhr.send(body);
  });
}

function getDiscordAuthPopupFeatures() {
  const leftBase = Number.isFinite(window.screenLeft) ? window.screenLeft : window.screenX;
  const topBase = Number.isFinite(window.screenTop) ? window.screenTop : window.screenY;
  const viewportWidth = Number(window.innerWidth) || Number(document.documentElement?.clientWidth) || DISCORD_AUTH_POPUP_WIDTH;
  const viewportHeight = Number(window.innerHeight) || Number(document.documentElement?.clientHeight) || DISCORD_AUTH_POPUP_HEIGHT;
  const left = Math.max(0, Math.round((Number(leftBase) || 0) + (viewportWidth - DISCORD_AUTH_POPUP_WIDTH) / 2));
  const top = Math.max(0, Math.round((Number(topBase) || 0) + (viewportHeight - DISCORD_AUTH_POPUP_HEIGHT) / 2));

  return [
    `width=${DISCORD_AUTH_POPUP_WIDTH}`,
    `height=${DISCORD_AUTH_POPUP_HEIGHT}`,
    `left=${left}`,
    `top=${top}`,
    "menubar=no",
    "toolbar=no",
    "location=no",
    "status=no",
    "resizable=yes",
    "scrollbars=yes"
  ].join(",");
}

function stopDiscordAuthPopupWatch({ refreshIdentity = false } = {}) {
  if (discordAuthPopupPollTimer) {
    clearInterval(discordAuthPopupPollTimer);
    discordAuthPopupPollTimer = null;
  }
  discordAuthPopupWindow = null;
  if (refreshIdentity) {
    void refreshFilesIdentity({ loadFiles: true }).finally(() => {
      if (state.intelEmail.open) {
        void refreshIntelEmailSubscriptions({ silent: true });
      }
    });
  }
}

function startDiscordAuthPopupWatch() {
  if (discordAuthPopupPollTimer) {
    clearInterval(discordAuthPopupPollTimer);
  }

  discordAuthPopupPollTimer = setInterval(() => {
    if (discordAuthPopupWindow && !discordAuthPopupWindow.closed) {
      return;
    }
    stopDiscordAuthPopupWatch({ refreshIdentity: true });
  }, DISCORD_AUTH_POPUP_POLL_INTERVAL_MS);
}

function openDiscordLoginPopup() {
  if (!elements.filesLoginForm) {
    return false;
  }

  syncFilesLoginReturnToField();

  if (discordAuthPopupWindow && !discordAuthPopupWindow.closed) {
    try {
      discordAuthPopupWindow.focus();
    } catch {
      // no-op
    }
    return true;
  }

  const popup = window.open("", DISCORD_AUTH_POPUP_WINDOW_NAME, getDiscordAuthPopupFeatures());
  if (!popup) {
    return false;
  }

  const form = elements.filesLoginForm;
  const previousTarget = form.getAttribute("target");
  const previousAction = form.getAttribute("action");
  discordAuthPopupWindow = popup;

  form.setAttribute("target", DISCORD_AUTH_POPUP_WINDOW_NAME);
  form.setAttribute("action", DISCORD_AUTH_POPUP_PATH);

  try {
    form.submit();
  } catch {
    try {
      popup.close();
    } catch {
      // no-op
    }
    discordAuthPopupWindow = null;
    if (previousTarget === null) {
      form.removeAttribute("target");
    } else {
      form.setAttribute("target", previousTarget);
    }
    if (previousAction === null) {
      form.removeAttribute("action");
    } else {
      form.setAttribute("action", previousAction);
    }
    return false;
  }

  if (previousTarget === null) {
    form.removeAttribute("target");
  } else {
    form.setAttribute("target", previousTarget);
  }
  if (previousAction === null) {
    form.removeAttribute("action");
  } else {
    form.setAttribute("action", previousAction);
  }

  try {
    popup.focus();
  } catch {
    // no-op
  }
  startDiscordAuthPopupWatch();
  return true;
}

function handleDiscordAuthPopupMessage(event) {
  if (event.origin !== window.location.origin) {
    return;
  }
  const payload = event.data;
  if (!payload || typeof payload !== "object" || payload.type !== DISCORD_AUTH_POST_MESSAGE_TYPE) {
    return;
  }

  try {
    if (discordAuthPopupWindow && !discordAuthPopupWindow.closed) {
      discordAuthPopupWindow.close();
    }
  } catch {
    // no-op
  }

  stopDiscordAuthPopupWatch({ refreshIdentity: true });
}

function stopFilesLiveIdentityPolling() {
  if (filesLiveIdentityPollTimer) {
    clearInterval(filesLiveIdentityPollTimer);
    filesLiveIdentityPollTimer = null;
  }
  filesLiveIdentityPollInFlight = false;
}

function startFilesLiveIdentityPolling() {
  if (filesLiveIdentityPollTimer) {
    return;
  }

  filesLiveIdentityPollTimer = setInterval(() => {
    void pollFilesIdentityLive();
  }, FILES_LIVE_IDENTITY_POLL_INTERVAL_MS);
}

function hasFilesIdentityChanged(previousProfile, nextProfile) {
  const prev = normalizeFilesProfile(previousProfile);
  const next = normalizeFilesProfile(nextProfile);
  return (
    prev.loggedIn !== next.loggedIn
    || prev.discordId !== next.discordId
    || prev.username !== next.username
    || prev.isAdmin !== next.isAdmin
    || prev.isAuthorized !== next.isAuthorized
    || prev.accessRequestStatus !== next.accessRequestStatus
    || prev.accessRequestRequestedAt !== next.accessRequestRequestedAt
    || prev.accessRequestDecidedAt !== next.accessRequestDecidedAt
    || prev.accessRequestReapplyAt !== next.accessRequestReapplyAt
    || prev.accessRequestDeclineReason !== next.accessRequestDeclineReason
    || prev.accessDisclaimerDecision !== next.accessDisclaimerDecision
    || prev.accessDisclaimerDecidedAt !== next.accessDisclaimerDecidedAt
    || prev.accessDisclaimerReevaluationRequestedAt !== next.accessDisclaimerReevaluationRequestedAt
    || prev.disclaimerRequired !== next.disclaimerRequired
  );
}

async function pollFilesIdentityLive({ force = false } = {}) {
  if (filesLiveIdentityPollInFlight) {
    return;
  }
  if (state.view !== "files" || !document.body.classList.contains("is-files")) {
    return;
  }
  if (!force && document.hidden) {
    return;
  }

  filesLiveIdentityPollInFlight = true;
  const previousProfile = normalizeFilesProfile(state.files.me);

  try {
    const payload = await requestJson("/api/me");
    const nextProfile = normalizeFilesProfile(payload);
    if (!hasFilesIdentityChanged(previousProfile, nextProfile)) {
      return;
    }

    state.files.me = nextProfile;
    syncFilesLocalAccessExpired(nextProfile);
    const nextAuthorized = hasFilesAuthorizedAccess(nextProfile);
    const previousAuthorized = hasFilesAuthorizedAccess(previousProfile);
    syncFilesDecisionNoticeFromProfile(nextProfile);
    syncDiscordBotInviteButton();
    syncClassifiedAccessState();

    if (nextAuthorized) {
      const identityChanged = previousProfile.discordId !== nextProfile.discordId;
      const becameAuthorized = !previousAuthorized;
      if (identityChanged || becameAuthorized) {
        await refreshFilesList();
      } else {
        renderFilesAccessView();
      }

      if (nextProfile.isAdmin) {
        await refreshFilesAdminRequests({ silent: true });
      } else {
        clearFilesAdminRequestsState();
        renderFilesAccessView();
      }
      await refreshFilesPublicShares({ silent: true });
      return;
    }

    if (previousAuthorized || previousProfile.discordId !== nextProfile.discordId) {
      state.files.list = [];
      state.files.activeGroupKey = "";
      state.files.rename.fileId = "";
      state.files.rename.value = "";
      state.files.rename.busy = false;
      clearFilesGroupManagerState();
      clearFilesGroupRenameState();
      state.files.listError = "";
      state.files.loadingList = false;
      state.files.selectedId = "";
      state.files.detailOrigin = "";
      state.files.transition = "";
      clearFilesAdminRequestsState();
    }
    if (!nextProfile.loggedIn || nextAuthorized) {
      state.files.accessRequestBusy = false;
      setFilesRestrictedRequestFeedback("", "");
    }

    renderFilesAccessView();
  } catch {
    // Ignore background polling failures; user-initiated flows keep explicit errors.
  } finally {
    filesLiveIdentityPollInFlight = false;
  }
}

function applyFilesSharedSelectionFromLocation() {
  if (!hasFilesSharedTargetInLocation()) {
    return false;
  }

  const matchedFile = resolveFilesSharedEntryFromLocation(state.files.list);
  if (!matchedFile) {
    if (String(state.files.selectedId || "").trim()) {
      state.files.selectedId = "";
      state.files.detailOrigin = "";
      state.files.transition = "";
    }
    setFilesLocationSharedFile("");
    return false;
  }

  state.files.selectedId = String(matchedFile.id || "").trim();
  state.files.detailOrigin = "share";
  state.files.activeGroupKey = getFilesGroupKey(matchedFile.group || "");
  state.files.transition = "";
  setFilesLocationSharedFile(matchedFile);
  return true;
}

async function refreshFilesList() {
  const me = normalizeFilesProfile(state.files.me);
  if (!hasFilesAuthorizedAccess(me)) {
    state.files.list = [];
    state.files.activeGroupKey = "";
    state.files.rename.fileId = "";
    state.files.rename.value = "";
    state.files.rename.busy = false;
    clearFilesGroupManagerState();
    clearFilesGroupRenameState();
    state.files.listError = "";
    state.files.selectedId = "";
    state.files.detailOrigin = "";
    state.files.transition = "";
    if (!me.isAdmin) {
      clearFilesAdminRequestsState();
    }
    renderFilesAccessView();
    return;
  }

  state.files.loadingList = true;
  state.files.listError = "";
  renderFilesAccessView();

  try {
    const payload = await requestJson("/api/files");
    const rawFiles = Array.isArray(payload.files) ? payload.files : [];
    state.files.list = rawFiles
      .map((entry) => normalizeFilesEntry(entry))
      .filter(Boolean);
    applyFilesSharedSelectionFromLocation();
    if (
      state.files.activeGroupKey
      && !state.files.list.some((entry) => getFilesGroupKey(entry.group) === state.files.activeGroupKey)
    ) {
      state.files.activeGroupKey = "";
      clearFilesGroupManagerState();
      clearFilesGroupRenameState();
    }
    if (
      state.files.rename.fileId
      && !state.files.list.some((entry) => String(entry.id || "") === state.files.rename.fileId)
    ) {
      state.files.rename.fileId = "";
      state.files.rename.value = "";
      state.files.rename.busy = false;
    }
    if (!state.files.list.some((file) => String(file.id || "") === state.files.selectedId)) {
      state.files.selectedId = "";
      state.files.detailOrigin = "";
      state.files.transition = "";
    }
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      await refreshFilesIdentity({ loadFiles: false });
      return;
    }
    state.files.list = [];
    state.files.activeGroupKey = "";
    state.files.rename.fileId = "";
    state.files.rename.value = "";
    state.files.rename.busy = false;
    clearFilesGroupManagerState();
    clearFilesGroupRenameState();
    state.files.listError = String(error?.message || t("files_empty_state"));
  } finally {
    state.files.loadingList = false;
  }

  renderFilesAccessView();
}

async function refreshFilesAdminRequests({ silent = false } = {}) {
  const me = normalizeFilesProfile(state.files.me);
  if (!hasFilesAuthorizedAccess(me) || !me.isAdmin) {
    clearFilesAdminRequestsState();
    renderFilesAccessView();
    return;
  }

  state.files.adminRequests.loading = true;
  state.files.adminRequests.busyActionKey = "";
  if (!silent) {
    renderFilesAccessView();
  }

  try {
    const payload = await requestJson("/api/files/access-requests");
    const rawEntries = Array.isArray(payload?.entries) ? payload.entries : [];
    const parsedEntries = rawEntries
      .map((entry) => normalizeFilesAdminRequestEntry(entry))
      .filter(Boolean);
    state.files.adminRequests.list = parsedEntries;
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      await refreshFilesIdentity({ loadFiles: false });
      return;
    }
    state.files.adminRequests.list = [];
    setFilesAdminRequestsFeedback(String(error?.message || t("files_admin_requests_error_generic")), "error");
  } finally {
    state.files.adminRequests.loading = false;
  }

  renderFilesAccessView();
}

async function refreshFilesPublicShares({ silent = false, mode = "" } = {}) {
  const me = normalizeFilesProfile(state.files.me);
  if (!hasFilesAuthorizedAccess(me)) {
    clearFilesPublicSharesState();
    renderFilesAccessView();
    return;
  }
  const normalizedMode = normalizeFilesPublicSharesMode(mode || state.files.publicShares.mode);
  if (normalizedMode === "admin" && !me.isAdmin) {
    state.files.publicShares.adminList = [];
    renderFilesAccessView();
    return;
  }
  if (state.files.publicShares.loading) {
    return;
  }

  state.files.publicShares.loading = true;
  state.files.publicShares.busyActionKey = "";
  if (!silent) {
    renderFilesAccessView();
  }

  try {
    const endpoint = normalizedMode === "admin"
      ? "/api/files/public-shares/admin"
      : "/api/files/public-shares";
    const payload = await requestJson(endpoint);
    const rawEntries = Array.isArray(payload?.entries) ? payload.entries : [];
    const parsedEntries = rawEntries
      .map((entry) => normalizeFilesPublicShareEntry(entry))
      .filter(Boolean);
    if (normalizedMode === "admin") {
      state.files.publicShares.adminList = parsedEntries;
    } else {
      state.files.publicShares.list = parsedEntries;
      state.files.publicShares.maxActive = Math.max(1, Number(payload?.maxActive) || 3);
    }
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      await refreshFilesIdentity({ loadFiles: false });
      return;
    }
    if (normalizedMode === "admin") {
      state.files.publicShares.adminList = [];
    } else {
      state.files.publicShares.list = [];
    }
    setFilesPublicSharesFeedback(String(error?.message || t("files_public_shares_error_load")), "error");
  } finally {
    state.files.publicShares.loading = false;
  }

  renderFilesAccessView();
}

async function refreshFilesBotAdminOverview({ silent = false } = {}) {
  const me = normalizeFilesProfile(state.files.me);
  if (!hasFilesAuthorizedAccess(me) || !me.isAdmin) {
    clearFilesBotAdminState();
    renderFilesAccessView();
    return;
  }
  if (state.files.botAdmin.loading) {
    return;
  }

  state.files.botAdmin.loading = true;
  if (!silent) {
    renderFilesAccessView();
  }

  try {
    const payload = await requestJson("/api/admin/bot/overview");
    state.files.botAdmin.overview = normalizeFilesBotAdminOverview(payload);
    state.files.botAdmin.lastLoadedAt = Date.now();
    if (state.files.botAdmin.messageKind === "error") {
      setFilesBotAdminFeedback("", "");
    }
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      stopFilesBotAdminLivePolling();
      await refreshFilesIdentity({ loadFiles: false });
      return;
    }
    state.files.botAdmin.overview = null;
    state.files.botAdmin.selectedGuildId = "";
    state.files.botAdmin.lastLoadedAt = 0;
    setFilesBotAdminFeedback(getFilesBotAdminErrorMessage(error), "error");
  } finally {
    state.files.botAdmin.loading = false;
  }

  renderFilesAccessView();
}

async function refreshFilesIdentity({ loadFiles = true } = {}) {
  state.files.loadingMe = true;
  state.files.meError = "";
  renderFilesAccessView();
  renderDropsPage();

  try {
    const payload = await requestJson("/api/me");
    state.files.me = normalizeFilesProfile(payload);
    syncFilesLocalAccessExpired(state.files.me);
    syncFilesDecisionNoticeFromProfile(state.files.me);
  } catch (error) {
    state.files.me = buildGuestFilesProfile();
    syncFilesLocalAccessExpired(state.files.me);
    state.files.meError = String(error?.message || "");
    syncFilesDecisionNoticeFromProfile(state.files.me);
  } finally {
    state.files.loadingMe = false;
  }

  syncDiscordBotInviteButton();
  renderDropsAdminTabVisibility();
  syncClassifiedAccessState();

  const hasActiveAuthorizedAccess = hasFilesAuthorizedAccess(state.files.me);
  const hasActiveAdminAccess = hasActiveAuthorizedAccess && state.files.me.isAdmin;

  if (state.view === "drops" && document.body.classList.contains("is-drops")) {
    if (hasActiveAdminAccess) {
      await refreshDrops();
      return;
    }
    showFilesPage({ updateHash: true });
    return;
  }

  if (hasActiveAuthorizedAccess && loadFiles) {
    await refreshFilesList();
    await refreshFilesPublicShares({ silent: true });
    if (hasActiveAdminAccess) {
      await refreshFilesAdminRequests({ silent: true });
    } else {
      clearFilesAdminRequestsState();
      clearFilesBotAdminState({ preserveQuery: true });
    }
    return;
  }

  if (!hasActiveAuthorizedAccess) {
    state.files.list = [];
    state.files.activeGroupKey = "";
    state.files.rename.fileId = "";
    state.files.rename.value = "";
    state.files.rename.busy = false;
    clearFilesGroupManagerState();
    clearFilesGroupRenameState();
    state.files.listError = "";
    state.files.loadingList = false;
    state.files.selectedId = "";
    state.files.detailOrigin = "";
    state.files.transition = "";
    clearFilesAdminRequestsState();
    clearFilesPublicSharesState();
    clearFilesBotAdminState({ preserveQuery: true });
  }
  if (hasActiveAuthorizedAccess && !hasActiveAdminAccess) {
    clearFilesAdminRequestsState();
    clearFilesBotAdminState({ preserveQuery: true });
  }
  if (!state.files.me.loggedIn || hasActiveAuthorizedAccess) {
    state.files.accessRequestBusy = false;
    setFilesRestrictedRequestFeedback("", "");
  }

  renderFilesAccessView();
  renderDropsPage();
}

async function refreshFilesIdentityBadgeOnly() {
  try {
    const payload = await requestJson("/api/me");
    state.files.me = normalizeFilesProfile(payload);
    syncFilesLocalAccessExpired(state.files.me);
  } catch {
    state.files.me = buildGuestFilesProfile();
    syncFilesLocalAccessExpired(state.files.me);
  }

  syncFilesDecisionNoticeFromProfile(state.files.me);
  renderDropsAdminTabVisibility();
  syncClassifiedAccessState();
  if (state.view === "drops" && document.body.classList.contains("is-drops")) {
    if (state.files.me.isAdmin && !state.files.localAccessExpired) {
      void refreshDrops();
    } else {
      showFilesPage({ updateHash: true });
      return;
    }
  }
  renderFilesDecisionTabBadge();
  syncDiscordBotInviteButton();
  renderFilesBotAdminPanel();
}

async function handleFilesLogout() {
  try {
    await requestJson("/auth/logout", { method: "POST" });
  } catch {
    // Ignore logout transport errors and still clear local state.
  }

  state.files.me = buildGuestFilesProfile();
  state.intelEmail.subscriptions = { silo: null, minerva: null };
  state.intelEmail.cooldowns = { silo: null, minerva: null };
  state.intelEmail.statusLoaded = false;
  state.intelEmail.statusLoading = false;
  syncClassifiedAccessState();
  state.files.list = [];
  state.files.activeGroupKey = "";
  state.files.rename.fileId = "";
  state.files.rename.value = "";
  state.files.rename.busy = false;
  state.files.adminModal.active = "";
  clearFilesEditModalState();
  stopFilesBotAdminLivePolling();
  clearFilesGroupManagerState();
  clearFilesGroupRenameState();
  state.files.listError = "";
  state.files.selectedId = "";
  state.files.detailOrigin = "";
  state.files.transition = "";
  state.files.uploadBusy = false;
  state.files.replace.fileId = "";
  state.drops.list = [];
  state.drops.loading = false;
  state.drops.error = "";
  state.drops.uploadBusy = false;
  state.drops.uploadMessage = "";
  state.drops.uploadMessageKind = "";
  state.drops.virusTotalConfigured = false;
  state.drops.uploadLimitBytes = 0;
  state.drops.retentionMaxHours = 0;
  resetDropsUploadProgress();
  state.drops.deleteModal.open = false;
  state.drops.deleteModal.shareId = "";
  state.drops.deleteModal.shareName = "";
  state.drops.deleteModal.deleting = false;
  setFilesUploadFeedback("", "");
  state.files.accessRequestBusy = false;
  setFilesRestrictedRequestFeedback("", "");
  stopFilesDisclaimerAcceptTransition({ immediate: true });
  syncDiscordBotInviteButton();
  state.files.disclaimerGate.busy = false;
  state.files.disclaimerGate.pendingDecision = "";
  resetFilesDisclaimerGateContactState({ clearText: true });
  setFilesDisclaimerGateFeedback("", "");
  clearFilesAdminRequestsState();
  clearFilesBotAdminState();
  state.files.adminRequests.query = "";
  state.files.adminRequests.filter = "pending";
  setFilesUploadInputInvalid(false, { isMissingFileError: false });
  state.files.search.query = "";
  state.files.search.open = false;
  state.files.decisionNotice.visible = false;
  state.files.decisionNotice.token = "";
  renderFilesDecisionTabBadge();
  renderFilesAccessView();
  renderDropsAdminTabVisibility();
  renderDropsPage();
  await refreshFilesIdentity({ loadFiles: false });
}

async function handleFilesAccessRequest() {
  if (state.files.accessRequestBusy) {
    return;
  }

  const me = normalizeFilesProfile(state.files.me);
  if (!me.loggedIn) {
    setFilesRestrictedRequestFeedback(t("files_restricted_request_login_required"), "error");
    renderFilesAccessView();
    return;
  }
  if (hasFilesAuthorizedAccess(me)) {
    setFilesRestrictedRequestFeedback(t("files_restricted_request_already_authorized"), "error");
    renderFilesAccessView();
    return;
  }

  const reasonRaw = String(elements.filesRestrictedReasonInput?.value || "");
  const reason = reasonRaw.trim();
  if (!reason) {
    setFilesRestrictedRequestFeedback(t("files_restricted_reason_required"), "error");
    if (elements.filesRestrictedReasonInput) {
      elements.filesRestrictedReasonInput.classList.add("is-invalid");
      elements.filesRestrictedReasonInput.focus();
    }
    renderFilesAccessView();
    return;
  }
  if (reason.length > FILES_ACCESS_REQUEST_REASON_MAX) {
    setFilesRestrictedRequestFeedback(t("files_restricted_reason_too_long"), "error");
    if (elements.filesRestrictedReasonInput) {
      elements.filesRestrictedReasonInput.classList.add("is-invalid");
      elements.filesRestrictedReasonInput.focus();
    }
    renderFilesAccessView();
    return;
  }
  if (elements.filesRestrictedReasonInput) {
    elements.filesRestrictedReasonInput.classList.remove("is-invalid");
  }

  state.files.accessRequestBusy = true;
  setFilesRestrictedRequestFeedback("", "");
  renderFilesAccessView();

  try {
    await requestJson("/api/files/access-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reason
      })
    });
    state.files.localAccessExpired = false;
    state.files.me = {
      ...normalizeFilesProfile(state.files.me),
      isAuthorized: false,
      accessRequestStatus: "pending",
      accessRequestRequestedAt: new Date().toISOString(),
      accessRequestDecidedAt: "",
      accessRequestReapplyAt: "",
      accessRequestDeclineReason: "",
      accessDisclaimerDecision: "none",
      accessDisclaimerDecidedAt: "",
      accessDisclaimerReevaluationRequestedAt: "",
      disclaimerRequired: false
    };
    syncFilesDecisionNoticeFromProfile(state.files.me);
    if (elements.filesRestrictedReasonInput) {
      elements.filesRestrictedReasonInput.value = "";
      elements.filesRestrictedReasonInput.classList.remove("is-invalid");
    }
    setFilesRestrictedRequestFeedback(t("files_restricted_request_success"), "success");
  } catch (error) {
    let message = t("files_restricted_request_error");
    if (error?.status === 401) {
      message = t("files_restricted_request_login_required");
    } else if (error?.status === 400) {
      const serverMessage = String(error?.message || "").toLowerCase();
      message = serverMessage.includes("required")
        ? t("files_restricted_reason_required")
        : (serverMessage.includes("long") || serverMessage.includes("exceed") || serverMessage.includes("character"))
            ? t("files_restricted_reason_too_long")
            : t("files_restricted_request_error");
      if (elements.filesRestrictedReasonInput) {
        elements.filesRestrictedReasonInput.classList.add("is-invalid");
      }
    } else if (error?.status === 409) {
      message = t("files_restricted_request_already_authorized");
    } else if (error?.status === 429) {
      const serverMessage = String(error?.message || "").toLowerCase();
      message = serverMessage.includes("pending")
        ? t("files_restricted_request_pending_error")
        : (serverMessage.includes("declined") || serverMessage.includes("cooldown"))
            ? t("files_restricted_request_declined_cooldown")
            : t("files_restricted_request_rate_limited");
    } else if (error?.status === 503) {
      message = t("files_restricted_request_unavailable");
    } else if (error?.message) {
      message = String(error.message);
    }
    setFilesRestrictedRequestFeedback(message, "error");
  } finally {
    state.files.accessRequestBusy = false;
    renderFilesAccessView();
  }
}

function setFilesEditFormBusy(formElement, busy) {
  if (!(formElement instanceof HTMLFormElement)) {
    return;
  }

  const isBusy = Boolean(busy);
  const controls = Array.from(formElement.querySelectorAll("input, textarea, button"));
  controls.forEach((control) => {
    if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLButtonElement) {
      control.disabled = isBusy;
    }
  });

  const submitButton = formElement.querySelector("button[type=\"submit\"]");
  if (submitButton instanceof HTMLButtonElement) {
    submitButton.textContent = isBusy ? t("files_edit_save_busy") : t("files_edit_save_button");
  }
}

function setFilesReplaceControlBusy(fileId, busy) {
  const normalizedFileId = String(fileId || "").trim();
  if (!normalizedFileId || !elements.filesList) {
    return;
  }

  const replaceButtons = Array.from(elements.filesList.querySelectorAll("[data-files-action=\"replace\"]"));
  for (const button of replaceButtons) {
    if (!(button instanceof HTMLButtonElement)) {
      continue;
    }
    if (String(button.getAttribute("data-file-id") || "").trim() !== normalizedFileId) {
      continue;
    }
    button.disabled = Boolean(busy);
    decorateFilesActionIconButton(
      button,
      busy ? t("files_replace_button_busy") : t("files_replace_button"),
      "replace",
      { busy }
    );
  }
}

async function handleFilesMetadataEdit(formElement) {
  if (!state.files.me?.isAdmin) {
    return;
  }
  if (!(formElement instanceof HTMLFormElement)) {
    return;
  }

  const fileId = String(formElement.dataset.fileId || "").trim();
  const isModalForm = formElement.hasAttribute("data-files-edit-modal-form");
  if (!fileId || (isModalForm && state.files.editModal.busy)) {
    return;
  }

  const descriptionInput = formElement.querySelector("textarea[name=\"description\"]");
  const functionsInput = formElement.querySelector("textarea[name=\"functions\"]");
  const outdatedInput = formElement.querySelector("input[name=\"outdated\"]");
  const untestedInput = formElement.querySelector("input[name=\"untested\"]");
  const cautionInput = formElement.querySelector("input[name=\"caution\"]");
  const groupInput = formElement.querySelector("input[name=\"group\"]");
  const imageInput = formElement.querySelector("input[name=\"image\"]");
  const removeImageInput = formElement.querySelector("input[name=\"removeImage\"]");
  const hasDescriptionField = descriptionInput instanceof HTMLTextAreaElement;
  const hasFunctionsField = functionsInput instanceof HTMLTextAreaElement;
  const hasOutdatedField = outdatedInput instanceof HTMLInputElement;
  const hasUntestedField = untestedInput instanceof HTMLInputElement;
  const hasCautionField = cautionInput instanceof HTMLInputElement;
  const hasGroupField = groupInput instanceof HTMLInputElement;
  const hasRemoveImageField = removeImageInput instanceof HTMLInputElement;

  const description = hasDescriptionField
    ? String(descriptionInput.value || "").trim()
    : "";
  const functions = hasFunctionsField
    ? String(functionsInput.value || "").trim()
    : "";
  const group = hasGroupField
    ? normalizeFilesGroup(groupInput.value)
    : "";
  const imageFile = imageInput instanceof HTMLInputElement && imageInput.files?.length
    ? imageInput.files[0]
    : null;
  const outdated = hasOutdatedField && outdatedInput.checked;
  const untested = hasUntestedField && untestedInput.checked;
  const caution = hasCautionField && cautionInput.checked;
  const removeImage = hasRemoveImageField && removeImageInput.checked;

  const formData = new FormData();
  if (hasDescriptionField) {
    formData.append("description", description);
  }
  if (hasFunctionsField) {
    formData.append("functions", functions);
  }
  if (hasOutdatedField) {
    formData.append("outdated", outdated ? "1" : "0");
  }
  if (hasUntestedField) {
    formData.append("untested", untested ? "1" : "0");
  }
  if (hasCautionField) {
    formData.append("caution", caution ? "1" : "0");
  }
  if (hasGroupField) {
    formData.append("group", group);
  }
  if (imageFile) {
    formData.append("image", imageFile);
  }
  if (hasRemoveImageField && removeImage) {
    formData.append("removeImage", "1");
  }

  if (isModalForm) {
    state.files.editModal.busy = true;
    setFilesEditModalFeedback("", "");
    renderFilesEditModal();
  }
  setFilesEditFormBusy(formElement, true);
  if (!isModalForm) {
    setFilesUploadFeedback("", "");
  }

  try {
    const payload = await requestJson(`/api/files/${encodeURIComponent(fileId)}`, {
      method: "PATCH",
      body: formData
    });
    const responseFile = normalizeFilesEntry(payload?.file);
    const fallbackPatch = {};
    if (hasDescriptionField) {
      fallbackPatch.description = description;
    }
    if (hasFunctionsField) {
      fallbackPatch.functions = functions;
    }
    if (hasGroupField) {
      fallbackPatch.group = group;
    }
    if (hasOutdatedField) {
      fallbackPatch.outdated = outdated;
    }
    if (hasUntestedField) {
      fallbackPatch.untested = untested;
    }
    if (hasCautionField) {
      fallbackPatch.caution = caution;
    }
    mergeFilesListEntry(fileId, responseFile || fallbackPatch);
    if (isModalForm) {
      setFilesEditModalFeedback(t("files_edit_success"), "success");
    } else {
      setFilesUploadFeedback(t("files_edit_success"), "success");
    }
    renderFilesAccessView();
    await refreshFilesList();
    if (isModalForm) {
      renderFilesEditModal({ force: true });
    }
  } catch (error) {
    if (isModalForm) {
      setFilesEditModalFeedback(String(error?.message || t("files_upload_error")), "error");
      renderFilesEditModal();
    } else {
      setFilesUploadFeedback(String(error?.message || t("files_upload_error")), "error");
      renderFilesAccessView();
    }
  } finally {
    if (isModalForm) {
      state.files.editModal.busy = false;
    }
    if (formElement.isConnected) {
      setFilesEditFormBusy(formElement, false);
    }
    if (isModalForm) {
      renderFilesEditModal();
    }
  }
}

async function handleFilesUpload(event) {
  event.preventDefault();
  if (!state.files.me?.isAdmin) {
    setFilesUploadFeedback(t("files_upload_error"), "error");
    setFilesUploadInputInvalid(false, { isMissingFileError: false });
    renderFilesAccessView();
    return;
  }

  if (!elements.filesUploadInput?.files?.length) {
    setFilesUploadFeedback(t("files_upload_missing_file"), "error");
    setFilesUploadInputInvalid(true, { isMissingFileError: true });
    elements.filesUploadInput?.focus();
    renderFilesAccessView();
    return;
  }

  const selectedFile = elements.filesUploadInput.files[0];
  const selectedImage = elements.filesImageInput?.files?.length ? elements.filesImageInput.files[0] : null;
  const group = normalizeFilesGroup(elements.filesGroupInput?.value || "");
  const description = String(elements.filesDescriptionInput?.value || "").trim();
  const outdated = Boolean(elements.filesOutdatedInput?.checked);
  const untested = Boolean(elements.filesUntestedInput?.checked);
  const caution = Boolean(elements.filesCautionInput?.checked);
  const formData = new FormData();
  formData.append("file", selectedFile);
  if (selectedImage) {
    formData.append("image", selectedImage);
  }
  if (group) {
    formData.append("group", group);
  }
  if (description) {
    formData.append("description", description);
  }
  formData.append("outdated", outdated ? "1" : "0");
  formData.append("untested", untested ? "1" : "0");
  formData.append("caution", caution ? "1" : "0");

  state.files.uploadBusy = true;
  setFilesUploadFeedback("", "");
  setFilesUploadInputInvalid(false, { isMissingFileError: false });
  renderFilesAccessView();

  try {
    await requestJson("/api/files/upload", {
      method: "POST",
      body: formData
    });
    elements.filesUploadForm?.reset();
    refreshFilesDescriptionEditors();
    state.files.uploadBusy = false;
    setFilesUploadFeedback(t("files_upload_success"), "success");
    setFilesUploadInputInvalid(false, { isMissingFileError: false });
    await refreshFilesList();
  } catch (error) {
    state.files.uploadBusy = false;
    setFilesUploadFeedback(String(error?.message || t("files_upload_error")), "error");
    setFilesUploadInputInvalid(false, { isMissingFileError: false });
    renderFilesAccessView();
  }
}

async function handleFilesReplace(fileId, inputElement) {
  const normalizedFileId = String(fileId || "").trim();
  if (!state.files.me?.isAdmin || !normalizedFileId || !(inputElement instanceof HTMLInputElement)) {
    if (inputElement instanceof HTMLInputElement) {
      inputElement.value = "";
    }
    return;
  }

  const replacementFile = inputElement.files?.length ? inputElement.files[0] : null;
  if (!replacementFile) {
    inputElement.value = "";
    return;
  }

  if (state.files.replace.fileId && state.files.replace.fileId !== normalizedFileId) {
    inputElement.value = "";
    return;
  }

  state.files.replace.fileId = normalizedFileId;
  setFilesUploadFeedback("", "");
  const formData = new FormData();
  formData.append("file", replacementFile);
  setFilesReplaceControlBusy(normalizedFileId, true);

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, 30000);

  try {
    await requestJson(`/api/files/${encodeURIComponent(normalizedFileId)}/replace`, {
      method: "POST",
      body: formData,
      signal: controller.signal
    });
    setFilesUploadFeedback(t("files_replace_success"), "success");
    await refreshFilesList();
  } catch (error) {
    const message = error?.name === "AbortError"
      ? t("files_replace_error_timeout")
      : String(error?.message || t("files_upload_error"));
    setFilesUploadFeedback(message, "error");
    renderFilesAccessView();
  } finally {
    clearTimeout(timeoutId);
    state.files.replace.fileId = "";
    inputElement.value = "";
    setFilesReplaceControlBusy(normalizedFileId, false);
    renderFilesAccessView();
  }
}

async function handleFilesAdminRequestsAction(actionElement) {
  const me = normalizeFilesProfile(state.files.me);
  if (!hasFilesAuthorizedAccess(me) || !me.isAdmin) {
    return;
  }
  if (!(actionElement instanceof HTMLElement)) {
    return;
  }
  if (state.files.adminRequests.loading || state.files.adminRequests.busyActionKey) {
    return;
  }

  const action = String(actionElement.dataset.filesAdminAction || "").trim().toLowerCase();
  const requestId = String(actionElement.dataset.requestId || "").trim();
  const discordId = String(actionElement.dataset.discordId || "").trim();
  const actionKey = String(actionElement.dataset.actionKey || requestId || discordId).trim();

  if (action === "deny-open" && requestId) {
    openFilesAdminRequestsDeclineComposer(requestId);
    return;
  }
  if (action === "deny-cancel") {
    closeFilesAdminRequestsDeclineComposer();
    return;
  }

  if (!actionKey) {
    return;
  }

  let requestUrl = "";
  let requestBody = null;
  let successMessage = "";

  if ((action === "approve" || action === "deny-submit") && requestId) {
    let declineReason = "";
    if (action === "deny-submit") {
      declineReason = String(state.files.adminRequests.declineComposerValue || "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();
      if (declineReason.length > FILES_ACCESS_REQUEST_REASON_MAX) {
        setFilesAdminRequestsFeedback(t("files_admin_requests_action_decline_reason_too_long"), "error");
        renderFilesAccessView();
        return;
      }
    }
    requestUrl = `/api/files/access-requests/${encodeURIComponent(requestId)}/decision`;
    requestBody = {
      action: action === "approve" ? "approve" : "decline"
    };
    if (action === "deny-submit" && declineReason) {
      requestBody.declineReason = declineReason;
    }
    successMessage = action === "approve"
      ? t("files_admin_requests_action_approve_success")
      : t("files_admin_requests_action_deny_success");
  } else if (action === "unauthorize" && discordId) {
    requestUrl = `/api/files/access-requests/${encodeURIComponent(discordId)}/unauthorize`;
    successMessage = t("files_admin_requests_action_unauthorize_success");
  } else if (action === "allow-reapply" && discordId) {
    requestUrl = `/api/files/access-requests/${encodeURIComponent(discordId)}/allow-reapply`;
    successMessage = t("files_admin_requests_action_allow_reapply_success");
  } else {
    return;
  }

  state.files.adminRequests.busyActionKey = actionKey;
  setFilesAdminRequestsFeedback("", "");
  renderFilesAccessView();

  try {
    await requestJson(requestUrl, {
      method: "POST",
      headers: requestBody
        ? {
            "Content-Type": "application/json"
          }
        : undefined,
      body: requestBody ? JSON.stringify(requestBody) : undefined
    });
    if (action === "approve" || action === "deny-submit") {
      state.files.adminRequests.declineComposerRequestId = "";
      state.files.adminRequests.declineComposerValue = "";
    }
    setFilesAdminRequestsFeedback(successMessage, "success");
    await refreshFilesAdminRequests({ silent: true });
  } catch (error) {
    const serverMessage = String(error?.message || "");
    const lowerMessage = serverMessage.toLowerCase();
    let message = t("files_admin_requests_error_generic");
    if (lowerMessage.includes("allowed_discord_ids")) {
      message = t("files_admin_requests_error_allowlist");
    } else if (serverMessage) {
      message = serverMessage;
    }
    setFilesAdminRequestsFeedback(message, "error");
  } finally {
    state.files.adminRequests.busyActionKey = "";
    renderFilesAccessView();
  }
}

function handleFilesAdminRequestsListClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const actionTarget = target.closest("[data-files-admin-action]");
  if (!(actionTarget instanceof HTMLElement)) {
    return;
  }
  void handleFilesAdminRequestsAction(actionTarget);
}

function handleFilesAdminRequestsListInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLTextAreaElement)) {
    return;
  }
  if (String(target.getAttribute("data-files-admin-decline-input") || "") !== "true") {
    return;
  }

  const requestId = String(target.getAttribute("data-request-id") || "").trim();
  if (!requestId || state.files.adminRequests.declineComposerRequestId !== requestId) {
    return;
  }
  state.files.adminRequests.declineComposerValue = String(target.value || "");
}

async function handleFilesPublicShareAction(actionElement) {
  const me = normalizeFilesProfile(state.files.me);
  if (!hasFilesAuthorizedAccess(me)) {
    return;
  }
  if (!(actionElement instanceof HTMLElement)) {
    return;
  }

  const action = String(actionElement.dataset.filesPublicShareAction || "").trim().toLowerCase();
  const shareId = String(actionElement.dataset.shareId || "").trim().toLowerCase();
  const mode = normalizeFilesPublicSharesMode(state.files.publicShares.mode);
  if (mode === "admin" && !me.isAdmin) {
    return;
  }
  const entry = getFilesPublicSharesCurrentList()
    .find((item) => item.id === shareId) || null;
  if (!action || !entry) {
    return;
  }

  if (action === "open") {
    window.open(entry.shareUrl, "_blank", "noopener,noreferrer");
    return;
  }

  if (action === "copy") {
    try {
      await copyTextToClipboard(entry.shareUrl);
      setFilesPublicSharesFeedback(t("files_public_shares_copied"), "success");
    } catch {
      setFilesPublicSharesFeedback(t("files_share_button_copy_error"), "error");
    }
    renderFilesAccessView();
    return;
  }

  if (action !== "delete" || state.files.publicShares.busyActionKey) {
    return;
  }

  state.files.publicShares.busyActionKey = shareId;
  setFilesPublicSharesFeedback("", "");
  renderFilesAccessView();

  try {
    await requestJson(`/api/files/public-shares/${encodeURIComponent(shareId)}`, {
      method: "DELETE"
    });
    state.files.publicShares.list = (Array.isArray(state.files.publicShares.list) ? state.files.publicShares.list : [])
      .filter((item) => item.id !== shareId);
    state.files.publicShares.adminList = (Array.isArray(state.files.publicShares.adminList) ? state.files.publicShares.adminList : [])
      .filter((item) => item.id !== shareId);
    setFilesPublicSharesFeedback(t("files_public_shares_deleted"), "success");
    await refreshFilesPublicShares({ silent: true, mode });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      await refreshFilesIdentity({ loadFiles: false });
      return;
    }
    setFilesPublicSharesFeedback(String(error?.message || t("files_public_shares_error_delete")), "error");
  } finally {
    state.files.publicShares.busyActionKey = "";
    renderFilesAccessView();
  }
}

function handleFilesPublicSharesListClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const actionTarget = target.closest("[data-files-public-share-action]");
  if (!(actionTarget instanceof HTMLElement)) {
    return;
  }
  void handleFilesPublicShareAction(actionTarget);
}

async function executeFilesBotAdminAction({ action = "", guildId = "", guildName = "", actionKey = "" } = {}) {
  let requestUrl = "";
  let successMessage = "";
  let successMessageResolver = null;
  if (action === "sync") {
    requestUrl = "/api/admin/bot/commands/sync";
    successMessage = t("files_bot_admin_sync_success");
  } else if (action === "test-post") {
    requestUrl = `/api/admin/bot/guilds/${encodeURIComponent(guildId)}/test-post`;
    successMessageResolver = (payload) => t("files_bot_admin_test_post_success", {
      server: guildName,
      count: formatFilesBotAdminNumber(payload?.postedChannelCount ?? payload?.channelCount ?? 0)
    });
  } else if (action === "welcome") {
    requestUrl = `/api/admin/bot/guilds/${encodeURIComponent(guildId)}/welcome`;
    successMessage = t("files_bot_admin_welcome_success", { server: guildName });
  } else if (action === "leave") {
    requestUrl = `/api/admin/bot/guilds/${encodeURIComponent(guildId)}/leave`;
    successMessage = t("files_bot_admin_leave_success", { server: guildName });
  } else {
    return;
  }

  state.files.botAdmin.busyActionKey = actionKey;
  if (action === "leave") {
    closeFilesBotAdminLeaveModal({ force: true });
  }
  setFilesBotAdminFeedback("", "");
  renderFilesAccessView();
  renderFilesBotAdminLeaveModal();

  try {
    const payload = await requestJson(requestUrl, {
      method: "POST"
    });
    setFilesBotAdminFeedback(successMessageResolver ? successMessageResolver(payload) : successMessage, "success");
    await refreshFilesBotAdminOverview({ silent: true });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      stopFilesBotAdminLivePolling();
      await refreshFilesIdentity({ loadFiles: false });
      return;
    }
    setFilesBotAdminFeedback(getFilesBotAdminErrorMessage(error), "error");
  } finally {
    state.files.botAdmin.busyActionKey = "";
    renderFilesAccessView();
    renderFilesBotAdminLeaveModal();
  }
}

async function handleFilesBotAdminAction(actionElement) {
  const me = normalizeFilesProfile(state.files.me);
  if (!hasFilesAuthorizedAccess(me) || !me.isAdmin) {
    return;
  }
  if (!(actionElement instanceof HTMLElement)) {
    return;
  }
  if (state.files.botAdmin.loading || state.files.botAdmin.busyActionKey) {
    return;
  }

  const action = String(actionElement.dataset.filesBotAction || "").trim().toLowerCase();
  const guildId = String(actionElement.dataset.guildId || "").trim();
  const guildName = String(actionElement.dataset.guildName || "").trim() || t("files_unknown_value");
  const actionKey = String(actionElement.dataset.actionKey || action).trim();

  if (!actionKey) {
    return;
  }
  if ((action === "welcome" || action === "leave" || action === "test-post") && !guildId) {
    return;
  }
  if (action === "leave") {
    openFilesBotAdminLeaveModal({
      guildId,
      guildName,
      actionKey
    });
    return;
  }

  await executeFilesBotAdminAction({
    action,
    guildId,
    guildName,
    actionKey
  });
}

function handleFilesBotAdminServerListClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const actionTarget = target.closest("[data-files-bot-action]");
  if (actionTarget instanceof HTMLElement) {
    void handleFilesBotAdminAction(actionTarget);
    return;
  }
  const selectTarget = target.closest("[data-files-bot-select]");
  if (!(selectTarget instanceof HTMLElement)) {
    return;
  }
  const guildId = String(selectTarget.dataset.guildId || "").trim();
  if (!guildId) {
    return;
  }
  openFilesBotAdminServerModal(guildId);
}

async function handleFilesDelete(fileId) {
  if (!state.files.me?.isAdmin) {
    return;
  }
  openFilesDeleteModal(fileId);
}

async function handleFilesShare(fileId, button = null) {
  const normalizedFileId = String(fileId || "").trim().toLowerCase();
  if (!isValidFilesSharedId(normalizedFileId)) {
    if (button instanceof HTMLButtonElement) {
      flashFilesShareButtonState(button, t("files_share_button_copy_error"));
    }
    return;
  }

  const matchedFile = state.files.list.find((entry) => String(entry?.id || "").trim().toLowerCase() === normalizedFileId) || null;
  if (!matchedFile) {
    if (button instanceof HTMLButtonElement) {
      flashFilesShareButtonState(button, t("files_share_button_copy_error"));
    }
    return;
  }

  openFilesShareModal(normalizedFileId, button);
}

function scheduleFilesDownloadRefresh() {
  if (filesDownloadRefreshTimer) {
    clearTimeout(filesDownloadRefreshTimer);
  }

  filesDownloadRefreshTimer = setTimeout(() => {
    filesDownloadRefreshTimer = null;
    if (hasFilesAuthorizedAccess(state.files.me)) {
      void refreshFilesList();
    }
  }, 1400);
}

function startFilesDownload(fileId, { versionId = "" } = {}) {
  const normalizedFileId = String(fileId || "").trim().toLowerCase();
  const normalizedVersionId = String(versionId || "").trim().toLowerCase();
  if (!normalizedFileId) {
    return;
  }

  const matchedFile = state.files.list.find((entry) => String(entry?.id || "").trim().toLowerCase() === normalizedFileId) || null;
  if (!matchedFile) {
    return;
  }

  const frame = document.createElement("iframe");
  frame.hidden = true;
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("tabindex", "-1");
  const params = new URLSearchParams({ ts: String(Date.now()) });
  if (normalizedVersionId) {
    params.set("version", normalizedVersionId);
  }
  frame.src = `/api/files/${encodeURIComponent(normalizedFileId)}/download?${params.toString()}`;
  document.body.appendChild(frame);
  window.setTimeout(() => {
    frame.remove();
  }, 45000);

  if (!normalizedVersionId) {
    state.files.list = (Array.isArray(state.files.list) ? state.files.list : []).map((file) => {
      if (String(file?.id || "").trim().toLowerCase() !== normalizedFileId) {
        return file;
      }
      return {
        ...file,
        downloadCount: Math.max(0, Number(file.downloadCount) || 0) + 1
      };
    });
  }

  scheduleFilesDownloadRefresh();
  renderFilesList();
}

function handleFilesDownload(fileId, { versionId = "" } = {}) {
  const normalizedFileId = String(fileId || "").trim().toLowerCase();
  const normalizedVersionId = String(versionId || "").trim().toLowerCase();
  if (!normalizedFileId) {
    return;
  }

  const matchedFile = state.files.list.find((entry) => String(entry?.id || "").trim().toLowerCase() === normalizedFileId) || null;
  if (!matchedFile) {
    return;
  }
  if (normalizeFilesBooleanFlag(matchedFile.outdated)) {
    setFilesUploadFeedback(t("files_outdated_download_blocked"), "error");
    renderFilesAccessView();
    return;
  }
  if (normalizeFilesBooleanFlag(matchedFile.caution)) {
    openFilesCautionModal(normalizedFileId, { kind: "caution", versionId: normalizedVersionId });
    return;
  }
  if (normalizeFilesBooleanFlag(matchedFile.untested)) {
    openFilesCautionModal(normalizedFileId, { kind: "untested", versionId: normalizedVersionId });
    return;
  }

  startFilesDownload(normalizedFileId, { versionId: normalizedVersionId });
}

function startFilesRename(fileId) {
  if (!state.files.me?.isAdmin) {
    return;
  }
  const matchedFile = state.files.list.find((entry) => String(entry.id || "") === String(fileId || ""));
  if (!matchedFile) {
    return;
  }

  state.files.rename.fileId = String(fileId);
  state.files.rename.value = getFilesDisplayName(matchedFile);
  state.files.rename.busy = false;
  renderFilesList();
}

function cancelFilesRename({ render = true } = {}) {
  state.files.rename.fileId = "";
  state.files.rename.value = "";
  state.files.rename.busy = false;
  if (render) {
    renderFilesList();
  }
}

async function handleFilesRenameSubmit(formElement) {
  if (!state.files.me?.isAdmin) {
    return;
  }
  if (!(formElement instanceof HTMLFormElement)) {
    return;
  }

  const fileId = String(formElement.dataset.fileId || "").trim();
  if (!fileId || state.files.rename.busy) {
    return;
  }

  const nameInput = formElement.querySelector("input[name=\"displayName\"]");
  const displayName = nameInput instanceof HTMLInputElement
    ? String(nameInput.value || "")
      .replace(/\r\n/g, " ")
      .replace(/\r/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    : "";

  state.files.rename.busy = true;
  state.files.rename.value = displayName;
  renderFilesList();

  try {
    const formData = new FormData();
    formData.append("displayName", displayName);
    await requestJson(`/api/files/${encodeURIComponent(fileId)}`, {
      method: "PATCH",
      body: formData
    });
    setFilesUploadFeedback(t("files_rename_success"), "success");
    cancelFilesRename({ render: false });
    await refreshFilesList();
  } catch (error) {
    state.files.rename.busy = false;
    setFilesUploadFeedback(String(error?.message || t("files_upload_error")), "error");
    renderFilesAccessView();
  }
}

async function handleFilesRenameGroupSubmit() {
  if (!state.files.me?.isAdmin || state.files.groupRename.busy || !state.files.groupRename.open) {
    return;
  }

  const targetGroupKey = String(state.files.groupRename.key || "").trim();
  if (!targetGroupKey || targetGroupKey === "__ungrouped__") {
    closeFilesGroupRenameModal({ force: true });
    return;
  }

  const filesInGroup = getFilesGroupEntriesByKey(targetGroupKey);
  if (!filesInGroup.length) {
    closeFilesGroupRenameModal({ force: true });
    return;
  }

  const currentGroup = normalizeFilesGroup(filesInGroup[0]?.group || "") || normalizeFilesGroup(state.files.groupRename.label || "");
  if (!currentGroup) {
    closeFilesGroupRenameModal({ force: true });
    return;
  }

  const nextValueRaw = elements.filesGroupRenameInput instanceof HTMLInputElement
    ? String(elements.filesGroupRenameInput.value || "")
    : String(state.files.groupRename.value || "");
  state.files.groupRename.value = nextValueRaw;
  const nextGroup = normalizeFilesGroup(nextValueRaw);
  if (!nextGroup) {
    setFilesGroupRenameFeedback(t("files_group_rename_error_required"), "error");
    if (elements.filesGroupRenameInput instanceof HTMLInputElement) {
      elements.filesGroupRenameInput.focus();
      elements.filesGroupRenameInput.select();
    }
    renderFilesGroupRenameModal();
    return;
  }

  if (normalizeSearchText(nextGroup) === normalizeSearchText(currentGroup)) {
    closeFilesGroupRenameModal({ force: true });
    return;
  }

  state.files.groupRename.busy = true;
  setFilesGroupRenameFeedback("", "");
  renderFilesGroupRenameModal();

  let renamed = false;
  try {
    await Promise.all(filesInGroup.map((file) => {
      const fileId = String(file?.id || "").trim();
      if (!fileId) {
        return Promise.resolve();
      }

      const formData = new FormData();
      formData.append("group", nextGroup);
      return requestJson(`/api/files/${encodeURIComponent(fileId)}`, {
        method: "PATCH",
        body: formData
      });
    }));
    state.files.list = (Array.isArray(state.files.list) ? state.files.list : []).map((file) => {
      if (getFilesGroupKey(file?.group || "") !== targetGroupKey) {
        return file;
      }
      return {
        ...file,
        group: nextGroup
      };
    });
    state.files.activeGroupKey = getFilesGroupKey(nextGroup);
    state.files.groupTransition = "";
    state.files.selectedId = "";
    state.files.detailOrigin = "";
    setFilesUploadFeedback(t("files_group_rename_success", { group: nextGroup }), "success");
    renamed = true;
  } catch (error) {
    setFilesGroupRenameFeedback(String(error?.message || t("files_group_manager_error_update")), "error");
  } finally {
    state.files.groupRename.busy = false;
  }

  if (renamed) {
    closeFilesGroupRenameModal({ force: true });
    state.files.transition = "to-list";
    renderFilesAccessView();
    scheduleFilesListPostMutationRefresh();
    await refreshFilesList();
    state.files.transition = "to-list";
    renderFilesAccessView();
    scheduleFilesListPostMutationRefresh();
    return;
  }

  renderFilesGroupRenameModal();
}

async function handleFilesAssignSelectedGroup() {
  if (!state.files.me?.isAdmin || state.files.groupManager.busy) {
    return;
  }

  const selectedIds = state.files.groupManager.selectedIds
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  if (!selectedIds.length) {
    setFilesUploadFeedback(t("files_group_manager_error_select_files"), "error");
    renderFilesAccessView();
    return;
  }

  const groupInput = elements.filesGroupManagerWrap?.querySelector("[data-files-group-input]")
    || elements.filesList?.querySelector("[data-files-group-input]");
  const rawGroupName = groupInput instanceof HTMLInputElement
    ? String(groupInput.value || "")
    : String(state.files.groupManager.targetGroup || "");
  const nextGroup = normalizeFilesGroup(rawGroupName);
  state.files.groupManager.targetGroup = nextGroup || rawGroupName;

  if (!nextGroup) {
    setFilesUploadFeedback(t("files_group_manager_error_group_required"), "error");
    renderFilesAccessView();
    return;
  }

  state.files.groupManager.busy = true;
  setFilesUploadFeedback("", "");
  renderFilesList();

  let updated = false;
  try {
    await Promise.all(selectedIds.map((fileId) => {
      const formData = new FormData();
      formData.append("group", nextGroup);
      return requestJson(`/api/files/${encodeURIComponent(fileId)}`, {
        method: "PATCH",
        body: formData
      });
    }));

    clearFilesGroupManagerState({ clearTargetGroup: false });
    state.files.groupManager.targetGroup = nextGroup;
    if (state.files.groupManager.open) {
      state.files.activeGroupKey = "";
      state.files.groupTransition = "";
    } else {
      state.files.activeGroupKey = getFilesGroupKey(nextGroup);
      state.files.groupTransition = "open";
    }
    setFilesUploadFeedback(
      t("files_group_manager_success", { n: String(selectedIds.length), group: nextGroup }),
      "success"
    );
    updated = true;
  } catch (error) {
    setFilesUploadFeedback(String(error?.message || t("files_group_manager_error_update")), "error");
  } finally {
    state.files.groupManager.busy = false;
  }

  if (updated) {
    await refreshFilesList();
    return;
  }
  renderFilesAccessView();
}

async function handleFilesRemoveSelectedFromGroup() {
  if (!state.files.me?.isAdmin || state.files.groupManager.busy) {
    return;
  }

  const selectedIds = state.files.groupManager.selectedIds
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  if (!selectedIds.length) {
    setFilesUploadFeedback(t("files_group_manager_error_select_files"), "error");
    renderFilesAccessView();
    return;
  }

  state.files.groupManager.busy = true;
  setFilesUploadFeedback("", "");
  renderFilesList();

  let updated = false;
  try {
    await Promise.all(selectedIds.map((fileId) => {
      const formData = new FormData();
      formData.append("group", "");
      return requestJson(`/api/files/${encodeURIComponent(fileId)}`, {
        method: "PATCH",
        body: formData
      });
    }));

    clearFilesGroupManagerState({ clearTargetGroup: false });
    state.files.activeGroupKey = "";
    state.files.groupTransition = "";
    setFilesUploadFeedback(
      t("files_group_manager_remove_success", { n: String(selectedIds.length) }),
      "success"
    );
    updated = true;
  } catch (error) {
    setFilesUploadFeedback(String(error?.message || t("files_group_manager_error_update")), "error");
  } finally {
    state.files.groupManager.busy = false;
  }

  if (updated) {
    await refreshFilesList();
    return;
  }
  renderFilesAccessView();
}

function handleFilesListInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  if (target.id) {
    const dropdowns = Array.from(document.querySelectorAll("[data-files-group-suggest-target]"));
    const linkedDropdown = dropdowns.find((node) => {
      if (!(node instanceof HTMLElement)) {
        return false;
      }
      return String(node.getAttribute("data-files-group-suggest-target") || "") === target.id;
    });
    if (linkedDropdown instanceof HTMLElement) {
      syncFilesGroupSuggestDropdown(linkedDropdown, target.value || "");
    }
  }

  if (!target.matches("[data-files-group-input]")) {
    return;
  }
  state.files.groupManager.targetGroup = String(target.value || "").slice(0, 80);
  syncFilesGroupSuggestions();
  renderFilesList();
}

function handleFilesListChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target instanceof HTMLInputElement && target.matches("[data-files-replace-input]")) {
    const fileId = String(target.getAttribute("data-file-id") || "").trim();
    if (fileId) {
      void handleFilesReplace(fileId, target);
    } else {
      target.value = "";
    }
    return;
  }

  if (!(target instanceof HTMLInputElement) || !target.matches("[data-files-group-select]")) {
    return;
  }

  const fileId = String(target.getAttribute("data-file-id") || "").trim();
  if (!fileId) {
    return;
  }

  const selected = new Set(state.files.groupManager.selectedIds.map((value) => String(value || "").trim()).filter(Boolean));
  if (target.checked) {
    selected.add(fileId);
  } else {
    selected.delete(fileId);
  }
  state.files.groupManager.selectedIds = Array.from(selected);
  renderFilesList();
  renderFilesGroupManagerPanel();
}

function handleFilesListClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const actionTarget = target.closest("[data-files-action]");
  if (!(actionTarget instanceof HTMLElement)) {
    closeAllFilesEditPickers();
    return;
  }

  const action = actionTarget.getAttribute("data-files-action") || "";
  if (action !== "toggle-edit-picker" && !target.closest(".files-edit-picker")) {
    closeAllFilesEditPickers();
  }
  if (action === "toggle-group-suggest-menu") {
    const dropdown = actionTarget.closest("[data-files-group-suggest-dropdown]");
    if (!(dropdown instanceof HTMLElement)) {
      return;
    }
    const shouldOpen = !dropdown.classList.contains("is-open");
    closeAllFilesGroupSuggestMenus({ except: shouldOpen ? dropdown : null });
    setFilesGroupSuggestMenuOpen(dropdown, shouldOpen);
    return;
  }

  if (action === "select-group-suggest-option") {
    const dropdown = actionTarget.closest("[data-files-group-suggest-dropdown]");
    if (!(dropdown instanceof HTMLElement)) {
      return;
    }
    const nextValue = normalizeFilesGroup(actionTarget.getAttribute("data-group-value") || "");
    const linkedInput = getFilesGroupSuggestTargetInput(dropdown);
    if (linkedInput instanceof HTMLInputElement) {
      linkedInput.value = nextValue;
      if (linkedInput.id === "filesGroupManagerInput" || linkedInput.matches("[data-files-group-input]")) {
        state.files.groupManager.targetGroup = nextValue;
        renderFilesList();
        renderFilesGroupManagerPanel();
      } else {
        linkedInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    syncFilesGroupSuggestDropdown(dropdown, nextValue);
    setFilesGroupSuggestMenuOpen(dropdown, false);
    return;
  }

  if (action === "assign-selected-group") {
    void handleFilesAssignSelectedGroup();
    return;
  }
  if (action === "remove-selected-group") {
    void handleFilesRemoveSelectedFromGroup();
    return;
  }
  if (action === "select-all-group-files") {
    if (state.files.groupManager.busy) {
      return;
    }
    state.files.groupManager.selectedIds = getFilesGroupManagerVisibleFileIds();
    renderFilesList();
    renderFilesGroupManagerPanel();
    return;
  }
  if (action === "clear-group-files-selection") {
    if (state.files.groupManager.busy) {
      return;
    }
    state.files.groupManager.selectedIds = [];
    renderFilesList();
    renderFilesGroupManagerPanel();
    return;
  }

  if (action === "select-group") {
    const groupKey = String(actionTarget.getAttribute("data-group-key") || "").trim();
    if (!groupKey) {
      return;
    }
    if (state.files.activeGroupKey === groupKey) {
      return;
    }
    state.files.activeGroupKey = groupKey;
    clearFilesGroupManagerState();
    const groupItemCount = getFilesGroupItemCount(groupKey);
    state.files.groupTransition = groupItemCount > 1 ? "open" : "";
    cancelFilesRename({ render: false });
    renderFilesList();
    renderFilesGroupManagerPanel();
    return;
  }
  if (action === "clear-group-filter") {
    state.files.activeGroupKey = "";
    clearFilesGroupManagerState();
    state.files.groupTransition = "close";
    cancelFilesRename({ render: false });
    renderFilesList();
    renderFilesGroupManagerPanel();
    return;
  }
  if (action === "rename-group") {
    const renameGroupKey = String(actionTarget.getAttribute("data-group-key") || "").trim();
    const renameGroupLabel = String(actionTarget.getAttribute("data-group-label") || "").trim();
    if (!renameGroupKey) {
      return;
    }
    openFilesGroupRenameModal(renameGroupKey, renameGroupLabel);
    return;
  }

  if (action === "back-to-index") {
    const returnToSearch = state.files.detailOrigin === "search" && String(state.files.search.query || "").trim();
    closeFilesDetailModal({ clearLocation: true, render: false });
    if (returnToSearch) {
      state.files.transition = "";
      setFilesSearchOpen(true, { clearQuery: false });
    } else {
      state.files.transition = "to-list";
      renderFilesList();
    }
    return;
  }

  if (action === "close-detail-modal") {
    closeFilesDetailModal();
    return;
  }

  if (action === "start-rename") {
    const renameFileId = actionTarget.getAttribute("data-file-id") || "";
    if (!renameFileId) {
      return;
    }
    startFilesRename(renameFileId);
    return;
  }

  if (action === "cancel-rename") {
    cancelFilesRename();
    return;
  }

  if (action === "open-functions-modal") {
    const targetFileId = actionTarget.getAttribute("data-file-id") || "";
    if (targetFileId) {
      openFilesFunctionsModal(targetFileId);
    }
    return;
  }

  if (action === "toggle-edit-picker") {
    const pickerWrap = actionTarget.closest(".files-edit-picker-wrap");
    if (pickerWrap instanceof HTMLElement) {
      const isOpen = pickerWrap.classList.contains("is-open");
      closeAllFilesEditPickers();
      if (!isOpen) {
        pickerWrap.classList.add("is-open");
      }
    }
    return;
  }

  const fileId = actionTarget.getAttribute("data-file-id") || "";
  if (!fileId) {
    return;
  }

  if (action === "open-detail-search") {
    cancelFilesRename({ render: false });
    state.files.selectedId = fileId;
    state.files.detailOrigin = "search";
    state.files.transition = "to-detail";
    setFilesSearchOpen(false, { clearQuery: false });
    renderFilesList();
    return;
  }

  if (action === "open-detail") {
    cancelFilesRename({ render: false });
    state.files.selectedId = fileId;
    state.files.detailOrigin = "list";
    state.files.transition = "to-detail";
    renderFilesList();
    return;
  }

  if (action === "share") {
    void handleFilesShare(fileId, actionTarget instanceof HTMLButtonElement ? actionTarget : null);
    return;
  }

  if (action === "download") {
    const versionId = String(actionTarget.getAttribute("data-file-version-id") || "").trim();
    handleFilesDownload(fileId, { versionId });
    return;
  }

  if (action === "replace") {
    if (state.files.replace.fileId) {
      return;
    }
    const replaceInputId = String(actionTarget.dataset.filesReplaceInputId || "").trim();
    const replaceInput = replaceInputId ? document.getElementById(replaceInputId) : null;
    if (replaceInput instanceof HTMLInputElement) {
      replaceInput.value = "";
      replaceInput.click();
    }
    return;
  }

  if (action === "edit-metadata") {
    closeAllFilesEditPickers();
    const focusField = String(actionTarget.getAttribute("data-edit-focus") || "").trim();
    openFilesEditModal(fileId, { focusField });
    return;
  }

  if (action === "delete") {
    void handleFilesDelete(fileId);
  }
}

function handleFilesListKeydown(event) {
  const key = String(event.key || "");
  if (key !== "Enter" && key !== " ") {
    return;
  }

  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const actionTarget = target.closest("[data-files-action]");
  if (!(actionTarget instanceof HTMLElement)) {
    return;
  }

  const action = String(actionTarget.getAttribute("data-files-action") || "").trim();
  if (action !== "open-detail") {
    return;
  }

  if (actionTarget.tagName === "BUTTON") {
    return;
  }

  event.preventDefault();
  actionTarget.click();
}

function handleFilesListSubmit(event) {
  const target = event.target;
  if (!(target instanceof HTMLFormElement)) {
    return;
  }

  if (target.matches("[data-files-edit-form]")) {
    event.preventDefault();
    void handleFilesMetadataEdit(target);
    return;
  }

  if (target.matches("[data-files-rename-form]")) {
    event.preventDefault();
    void handleFilesRenameSubmit(target);
  }
}

function handleFilesEditPanelInput(event) {
  handleFilesListInput(event);

  if (!state.files.editModal.message) {
    return;
  }

  setFilesEditModalFeedback("", "");
  renderFilesEditModal();
}

function handleFilesEditPanelClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const actionTarget = target.closest("[data-files-action]");
  if (!(actionTarget instanceof HTMLElement)) {
    return;
  }

  const action = String(actionTarget.getAttribute("data-files-action") || "").trim().toLowerCase();
  if (action === "toggle-group-suggest-menu") {
    const dropdown = actionTarget.closest("[data-files-group-suggest-dropdown]");
    if (!(dropdown instanceof HTMLElement)) {
      return;
    }
    const shouldOpen = !dropdown.classList.contains("is-open");
    closeAllFilesGroupSuggestMenus({ except: shouldOpen ? dropdown : null });
    setFilesGroupSuggestMenuOpen(dropdown, shouldOpen);
    return;
  }

  if (action === "select-group-suggest-option") {
    const dropdown = actionTarget.closest("[data-files-group-suggest-dropdown]");
    if (!(dropdown instanceof HTMLElement)) {
      return;
    }
    const nextValue = normalizeFilesGroup(actionTarget.getAttribute("data-group-value") || "");
    const linkedInput = getFilesGroupSuggestTargetInput(dropdown);
    if (linkedInput instanceof HTMLInputElement) {
      linkedInput.value = nextValue;
      linkedInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    syncFilesGroupSuggestDropdown(dropdown, nextValue);
    setFilesGroupSuggestMenuOpen(dropdown, false);
  }
}

function handleFilesEditPanelSubmit(event) {
  const target = event.target;
  if (!(target instanceof HTMLFormElement) || !target.matches("[data-files-edit-modal-form]")) {
    return;
  }

  event.preventDefault();
  void handleFilesMetadataEdit(target);
}

function queueImagePreload(url, { highPriority = false } = {}) {
  const normalizedUrl = String(url || "").trim();
  if (!normalizedUrl) {
    return Promise.resolve(false);
  }

  const cached = minervaImagePreloadCache.get(normalizedUrl);
  if (cached) {
    return cached;
  }

  const preloadPromise = new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    if ("loading" in image) {
      image.loading = "eager";
    }
    if (highPriority && "fetchPriority" in image) {
      image.fetchPriority = "high";
    }

    let settled = false;
    const finalize = (ok) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(ok);
    };

    image.addEventListener("load", () => finalize(true), { once: true });
    image.addEventListener("error", () => finalize(false), { once: true });
    image.src = normalizedUrl;

    if (image.complete) {
      finalize(true);
    }
  });

  minervaImagePreloadCache.set(normalizedUrl, preloadPromise);
  return preloadPromise;
}

function prewarmStaticSiteImages() {
  const uniqueUrls = [...new Set(
    STATIC_SITE_IMAGE_PRELOAD_URLS
      .map((url) => String(url || "").trim())
      .filter(Boolean)
  )];

  uniqueUrls.forEach((url, index) => {
    void queueImagePreload(url, { highPriority: index < 4 });
  });
}

function prewarmMinervaDetailImages(byKey = state.minervaDetail.fallbackByKey) {
  const urls = new Set();
  const fallbackImageUrl = String(state.minervaDetail.fallbackImageUrl || MINERVA_DETAIL_FALLBACK_IMAGE).trim();
  if (fallbackImageUrl) {
    urls.add(fallbackImageUrl);
  }

  if (byKey && typeof byKey === "object") {
    for (const entry of Object.values(byKey)) {
      if (!entry || typeof entry !== "object") {
        continue;
      }
      const imageUrl = String(entry.imageUrl || "").trim();
      if (imageUrl) {
        urls.add(imageUrl);
      }
      if (urls.size >= MINERVA_DETAIL_IMAGE_PRELOAD_LIMIT) {
        break;
      }
    }
  }

  const preloadUrls = [...urls];
  preloadUrls.forEach((url, index) => {
    void queueImagePreload(url, { highPriority: index === 0 });
  });
}

function getMinervaDetailFigureElement(imageElement) {
  return imageElement instanceof HTMLElement
    ? imageElement.closest(".minerva-detail-figure")
    : null;
}

function setMinervaDetailImageLoadingState(imageElement, isLoading) {
  const figureElement = getMinervaDetailFigureElement(imageElement);
  figureElement?.classList.toggle("is-loading", Boolean(isLoading));
}

function clearMinervaDetailImage(imageElement) {
  if (!(imageElement instanceof HTMLImageElement)) {
    return;
  }

  imageElement.hidden = true;
  imageElement.alt = "";
  imageElement.removeAttribute("src");
  imageElement.removeAttribute("data-fallback-src");
  imageElement.removeAttribute("data-expected-src");
  imageElement.removeAttribute("data-loaded-src");
  setMinervaDetailImageLoadingState(imageElement, false);
}

function finalizeMinervaDetailImageLoad(imageElement) {
  if (!(imageElement instanceof HTMLImageElement)) {
    return;
  }

  const expectedSrc = String(imageElement.dataset.expectedSrc || "").trim();
  const currentSrc = String(imageElement.getAttribute("src") || "").trim();
  if (!expectedSrc || currentSrc !== expectedSrc) {
    return;
  }

  imageElement.dataset.loadedSrc = expectedSrc;
  imageElement.hidden = false;
  setMinervaDetailImageLoadingState(imageElement, false);
}

function applyMinervaDetailImage(imageElement, imageUrl, { alt = "", fallbackSrc = "" } = {}) {
  if (!(imageElement instanceof HTMLImageElement)) {
    return;
  }

  const resolvedImageUrl = String(imageUrl || "").trim();
  if (!resolvedImageUrl) {
    clearMinervaDetailImage(imageElement);
    return;
  }

  const currentSrc = String(imageElement.getAttribute("src") || "").trim();
  const loadedSrc = String(imageElement.dataset.loadedSrc || "").trim();
  imageElement.dataset.fallbackSrc = String(fallbackSrc || resolvedImageUrl).trim() || resolvedImageUrl;
  imageElement.alt = alt;

  if (currentSrc === resolvedImageUrl && loadedSrc === resolvedImageUrl) {
    imageElement.hidden = false;
    setMinervaDetailImageLoadingState(imageElement, false);
    return;
  }

  imageElement.hidden = true;
  imageElement.dataset.expectedSrc = resolvedImageUrl;
  imageElement.removeAttribute("data-loaded-src");
  setMinervaDetailImageLoadingState(imageElement, true);

  if (currentSrc !== resolvedImageUrl) {
    imageElement.removeAttribute("src");
    imageElement.src = resolvedImageUrl;
  }

  if (imageElement.complete && imageElement.naturalWidth > 0) {
    finalizeMinervaDetailImageLoad(imageElement);
  }
}

function handleMinervaDetailImageError(imageElement, fallbackSrc) {
  if (!(imageElement instanceof HTMLImageElement)) {
    return;
  }

  const resolvedFallbackSrc = String(
    fallbackSrc
    || imageElement.dataset.fallbackSrc
    || state.minervaDetail.fallbackImageUrl
    || MINERVA_DETAIL_FALLBACK_IMAGE
  ).trim();

  if (!resolvedFallbackSrc) {
    clearMinervaDetailImage(imageElement);
    return;
  }

  const currentSrc = String(imageElement.getAttribute("src") || "").trim();
  if (currentSrc === resolvedFallbackSrc) {
    clearMinervaDetailImage(imageElement);
    return;
  }

  imageElement.hidden = true;
  imageElement.dataset.expectedSrc = resolvedFallbackSrc;
  imageElement.removeAttribute("data-loaded-src");
  setMinervaDetailImageLoadingState(imageElement, true);
  imageElement.src = resolvedFallbackSrc;

  if (imageElement.complete && imageElement.naturalWidth > 0) {
    finalizeMinervaDetailImageLoad(imageElement);
  }
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
    zoneLabel = "",
    hour12 = false
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
    hour12,
    timeZone
  };

  if (includeSeconds) {
    timeOptions.second = "2-digit";
  }

  const datePart = new Intl.DateTimeFormat(locale, dateOptions).format(date).replace(/,/g, "");
  const timePart = normalizeMeridiemText(
    new Intl.DateTimeFormat(locale, timeOptions).format(date)
  );
  const zonePart = zoneLabel ? ` ${zoneLabel}` : "";
  return `${datePart} ${timePart}${zonePart}`;
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

function shiftEasternDateByDays(date, dayOffset = 0) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = extractTimeZoneParts(date, "America/New_York");
  const shiftedDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + Number(dayOffset || 0), 0, 0, 0));
  return buildEasternDate(
    shiftedDate.getUTCFullYear(),
    shiftedDate.getUTCMonth() + 1,
    shiftedDate.getUTCDate(),
    parts.hour,
    parts.minute
  );
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

  return buildEasternDate(year, month, day, hour, minute);
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
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    includeWeekday: true,
    includeYear: false,
    zoneLabel: getLocalZoneLabel(now),
    hour12: true
  });
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

function formatLastSync(now = new Date()) {
  return formatReadableDateTime(now, {
    includeSeconds: false,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    includeWeekday: true,
    includeYear: false,
    zoneLabel: getLocalZoneLabel(now),
    hour12: true
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
  const timePart = normalizeMeridiemText(new Intl.DateTimeFormat(locale, timeOptions).format(date));
  return `${datePart} | ${timePart} ET`;
}

function formatCompactWeekdayToken(rawWeekday) {
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
      mie: "MIE",
      jue: "JUE",
      vie: "VIE",
      sab: "SAB",
      dom: "DOM"
    };
    return esMap[key] || cleaned.toUpperCase();
  }

  return cleaned.toUpperCase();
}

function formatMinervaCompactTimeToken(date, timeZone) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "--";
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value || "";
  const minute = parts.find((part) => part.type === "minute")?.value || "";
  const dayPeriod = parts.find((part) => part.type === "dayPeriod")?.value || "";
  const period = dayPeriod.trim().slice(0, 1).toLowerCase();
  const minutePart = minute && minute !== "00" ? `:${minute}` : "";
  return `${hour}${minutePart}${period}`.trim();
}

function getMinervaCompactZoneLabel(timeZone) {
  const normalizedZone = String(timeZone || "").toLowerCase();
  if (normalizedZone.includes("new_york") || normalizedZone.includes("detroit") || normalizedZone.includes("indiana")) {
    return "ET";
  }
  if (normalizedZone.includes("chicago") || normalizedZone.includes("winnipeg")) {
    return "CT";
  }
  if (normalizedZone.includes("denver") || normalizedZone.includes("phoenix")) {
    return "MT";
  }
  if (normalizedZone.includes("los_angeles") || normalizedZone.includes("vancouver")) {
    return "PT";
  }
  return "";
}

function formatEtCompact(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "--";
  }

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
  const weekdayPart = formatCompactWeekdayToken(weekdayRaw);
  const dayPart = dateParts.find((part) => part.type === "day")?.value || "";
  let timePart = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York"
  }).format(date).replace(/\s+/g, " ").trim();
  timePart = normalizeMeridiemText(timePart);

  return `${weekdayPart} ${dayPart} ${timePart}`.trim();
}

function formatMinervaLocalCompact(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "--";
  }

  const locale = state.lang === "es" ? "es-ES" : "en-US";
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const dateParts = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "2-digit",
    timeZone: localTimeZone
  }).formatToParts(date);
  const weekdayRaw = dateParts
    .find((part) => part.type === "weekday")
    ?.value
    ?.trim() || "";
  const weekdayPart = formatCompactWeekdayToken(weekdayRaw);
  const dayPart = dateParts.find((part) => part.type === "day")?.value || "";
  const timePart = formatMinervaCompactTimeToken(date, localTimeZone);
  const zoneLabel = getMinervaCompactZoneLabel(localTimeZone);
  return `${weekdayPart} ${dayPart} ${timePart}${zoneLabel ? ` ${zoneLabel}` : ""}`.trim();
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
    const timeValue = parsed ? formatMinervaLocalCompact(parsed) : String(data.nextChange || "--");
    return toCardLine(timeValue);
  }

  const targetDate = isActive ? data.eventEnd : data.eventStart;
  if (targetDate instanceof Date && !Number.isNaN(targetDate.getTime())) {
    return toCardLine(formatMinervaLocalCompact(targetDate));
  }

  return t("window_unknown");
}

function formatMinervaCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function formatMinervaLocationDate(date, mode = "") {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "--";
  }

  void mode;

  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  return formatReadableDateTime(date, {
    includeSeconds: false,
    timeZone: localTimeZone,
    includeWeekday: true,
    includeYear: false,
    zoneLabel: getLocalZoneLabel(date),
    hour12: true
  });
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

function resolveMinervaLocationSlides(data) {
  const defaultMapImage = "assets/images/minerva-route-map.svg";
  if (!data) {
    return [{
      key: "route-default",
      src: defaultMapImage,
      alt: "Appalachia route map",
      showPins: true
    }];
  }

  const location = normalizeLocation(data.location || "--");
  const locationByMapImage = inferLocationFromMapImage(data.locationMapImage || "");
  const mapLocation = location !== "--" ? location : locationByMapImage;
  const localizedMapLocation = localizeLocation(mapLocation);
  const mapImageSrc = resolveMinervaLocationMapImage(data.locationMapImage || "", mapLocation);
  const primarySrc = mapImageSrc || defaultMapImage;
  const slides = [{
    key: mapImageSrc ? "route-known" : "route-default",
    src: primarySrc,
    alt: mapImageSrc
      ? `${localizedMapLocation === "--" ? "Appalachia" : localizedMapLocation} map marker`
      : "Appalachia route map",
    showPins: !mapImageSrc
  }];

  const storeSrc = String(MINERVA_STORE_IMAGE_BY_LOCATION[mapLocation] || "").trim();
  if (storeSrc && storeSrc !== primarySrc) {
    slides.push({
      key: "store",
      src: storeSrc,
      alt: `${localizedMapLocation === "--" ? "Minerva" : localizedMapLocation} store location`,
      showPins: false
    });
  }

  return slides;
}

function syncMinervaLocationSlides(data) {
  const slides = resolveMinervaLocationSlides(data);
  const nextKey = slides.map((slide) => `${slide.key}:${slide.src}`).join("|");
  if (state.minervaLocation.slideKey !== nextKey) {
    state.minervaLocation.slides = slides;
    state.minervaLocation.slideKey = nextKey;
    state.minervaLocation.slideIndex = 0;
  } else {
    state.minervaLocation.slides = slides;
    state.minervaLocation.slideIndex = Math.min(
      state.minervaLocation.slideIndex,
      Math.max(0, slides.length - 1)
    );
  }
}

function renderMinervaLocationSlide(data, activeLocation) {
  if (!elements.minervaLocationMapImage) {
    return;
  }

  syncMinervaLocationSlides(data);
  const slides = state.minervaLocation.slides;
  const activeSlide = slides[state.minervaLocation.slideIndex] || slides[0] || null;
  const hasMultipleSlides = slides.length > 1;

  if (elements.minervaLocationMapPrevBtn) {
    elements.minervaLocationMapPrevBtn.hidden = !hasMultipleSlides;
  }
  if (elements.minervaLocationMapNextBtn) {
    elements.minervaLocationMapNextBtn.hidden = !hasMultipleSlides;
  }

  if (!activeSlide) {
    return;
  }

  const currentSrc = elements.minervaLocationMapImage.dataset.slideSrc
    || elements.minervaLocationMapImage.getAttribute("src")
    || "";
  if (currentSrc !== activeSlide.src) {
    const token = ++state.minervaLocation.transitionToken;
    const preload = new Image();
    elements.minervaLocationMapImage.classList.add("is-switching");
    preload.onload = () => {
      if (token !== state.minervaLocation.transitionToken) {
        return;
      }
      window.setTimeout(() => {
        if (token !== state.minervaLocation.transitionToken) {
          return;
        }
        elements.minervaLocationMapImage.src = activeSlide.src;
        elements.minervaLocationMapImage.alt = activeSlide.alt;
        elements.minervaLocationMapImage.dataset.slideSrc = activeSlide.src;
        requestAnimationFrame(() => {
          elements.minervaLocationMapImage.classList.remove("is-switching");
        });
      }, 120);
    };
    preload.onerror = () => {
      if (token !== state.minervaLocation.transitionToken) {
        return;
      }
      elements.minervaLocationMapImage.classList.remove("is-switching");
    };
    preload.src = activeSlide.src;
  } else {
    elements.minervaLocationMapImage.alt = activeSlide.alt;
    elements.minervaLocationMapImage.dataset.slideSrc = activeSlide.src;
    elements.minervaLocationMapImage.classList.remove("is-switching");
  }

  if (elements.minervaLocationPinsWrap) {
    elements.minervaLocationPinsWrap.hidden = !activeSlide.showPins;
  }
  if (activeSlide.showPins) {
    syncMinervaLocationMapPins(activeLocation);
  }
}

function cycleMinervaLocationSlide(direction) {
  const slides = state.minervaLocation.slides;
  if (!Array.isArray(slides) || slides.length < 2) {
    return;
  }

  state.minervaLocation.slideIndex = (
    state.minervaLocation.slideIndex + direction + slides.length
  ) % slides.length;
  renderMinervaLocationView();
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
    if (elements.minervaLocationMapName) {
      elements.minervaLocationMapName.textContent = "--";
      elements.minervaLocationMapName.hidden = true;
    }
    renderMinervaLocationSlide(null, "--");
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
  renderMinervaLocationSlide(data, location);
  setMinervaLocationCountdownTarget(data.active ? eventEnd : eventStart, data.active ? "leaves" : "arrives");
}

function nextResetUtc(now = new Date()) {
  const reset = new Date(now);
  const daysUntilReset = ((SILO_RESET_DAY_UTC + 7 - now.getUTCDay()) % 7) || 7;
  reset.setUTCDate(now.getUTCDate() + daysUntilReset);
  reset.setUTCHours(0, 0, 0, 0);
  if (reset <= now) {
    reset.setUTCDate(reset.getUTCDate() + 7);
  }
  return reset;
}

function updateClock() {
  elements.utcTime.textContent = formatUtc();

  const nowMs = Date.now();
  const targetUtc = getActiveSiloResetTargetMs(nowMs);

  const totalSeconds = Math.max(0, Math.floor((targetUtc - nowMs) / 1000));
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const ts = formatSiloResetMoment(new Date(targetUtc));

  elements.siloHint.textContent = t("silo_hint", { schedule: ts });
  elements.siloExpiry.textContent = t("reset_in", { d, h, m, s, ts });
  if (state.siloDossier.open) {
    renderSiloDossier();
  }
  updateMinervaLocationCountdown(nowMs);
  updateFilesDeniedCountdown(nowMs);
  updateIntelEmailCooldownCountdown(nowMs);
}

function setSignal(key) {
  state.signalKey = key;
  elements.dataSignal.textContent = t(`signal_${key}`);
  if (state.siloDossier.open) {
    renderSiloDossier();
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const BACKGROUND_SYMBOL_VISIBLE_COUNT = 16;
const BACKGROUND_SYMBOL_GLYPHS = [
  "¤", "¢", "", "", "", "", "", "", "", "", "", "",
  "", "", "", "", "", "", "", "", "", "", "", "",
  "", "", "", "", "", "", "", "", "", "", "", ""
];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function pickRandomArrayItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffleArray(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function createBackgroundSymbolSideSlots(leftRange, rightRange, yBands) {
  return yBands.flatMap((yBand, index) => {
    const leftInset = index % 2 === 0 ? 0 : 2.2;
    const rightInset = index % 2 === 0 ? 0 : 2.2;
    return [
      { x: [leftRange[0] + leftInset, leftRange[1]], y: yBand },
      { x: [rightRange[0], rightRange[1] - rightInset], y: yBand }
    ];
  });
}

function getMeasuredBackgroundSymbolSideSlots(viewportWidth) {
  if (typeof document === "undefined") {
    return [];
  }

  const terminalRect = document.querySelector(".pipboy-terminal")?.getBoundingClientRect();
  if (!terminalRect || terminalRect.width <= 0) {
    return [];
  }

  const gutterGapPx = 18;
  const outerGapPx = 18;
  const leftMin = (outerGapPx / viewportWidth) * 100;
  const leftMax = ((terminalRect.left - gutterGapPx) / viewportWidth) * 100;
  const rightMin = ((terminalRect.right + gutterGapPx) / viewportWidth) * 100;
  const rightMax = 100 - (outerGapPx / viewportWidth) * 100;

  if (leftMax - leftMin < 8 || rightMax - rightMin < 8) {
    return [];
  }

  return createBackgroundSymbolSideSlots(
    [Math.max(1.4, leftMin), Math.min(23, leftMax)],
    [Math.max(77, rightMin), Math.min(98.6, rightMax)],
    [
      [7.5, 16],
      [19.5, 28],
      [31.5, 40],
      [43.5, 52],
      [55.5, 64],
      [67.5, 76],
      [79.5, 86.5],
      [88, 94]
    ]
  );
}

function getBackgroundSymbolSlots(isWideViewport) {
  if (!isWideViewport) {
    return [
      { x: [8, 31], y: [8, 18] },
      { x: [34, 57], y: [8, 18] },
      { x: [61, 84], y: [8, 18] },
      { x: [8, 31], y: [22, 33] },
      { x: [69, 92], y: [22, 33] },
      { x: [7, 30], y: [36, 47] },
      { x: [70, 93], y: [36, 47] },
      { x: [7, 30], y: [50, 61] },
      { x: [70, 93], y: [50, 61] },
      { x: [7, 30], y: [64, 75] },
      { x: [70, 93], y: [64, 75] },
      { x: [8, 31], y: [79, 91] },
      { x: [34, 57], y: [79, 91] },
      { x: [61, 84], y: [79, 91] },
      { x: [22, 47], y: [20, 31] },
      { x: [53, 78], y: [20, 31] }
    ];
  }

  const viewportWidth = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
  const measuredSlots = getMeasuredBackgroundSymbolSideSlots(viewportWidth);
  if (measuredSlots.length) {
    return measuredSlots;
  }

  return createBackgroundSymbolSideSlots(
    [1.5, 20.8],
    [79.2, 98.5],
    [
      [7.5, 16],
      [19.5, 28],
      [31.5, 40],
      [43.5, 52],
      [55.5, 64],
      [67.5, 76],
      [79.5, 86.5],
      [88, 94]
    ]
  );
}

function moveBackgroundSymbolWithinSlot(symbol) {
  const minX = Number.parseFloat(symbol.dataset.bgSlotMinX);
  const maxX = Number.parseFloat(symbol.dataset.bgSlotMaxX);
  const minY = Number.parseFloat(symbol.dataset.bgSlotMinY);
  const maxY = Number.parseFloat(symbol.dataset.bgSlotMaxY);

  if (![minX, maxX, minY, maxY].every(Number.isFinite)) {
    return;
  }

  symbol.style.setProperty("--x", `${randomBetween(minX, maxX).toFixed(2)}%`);
  symbol.style.setProperty("--y", `${randomBetween(minY, maxY).toFixed(2)}%`);
}

function assignBackgroundSymbolSlot(symbol, slot) {
  symbol.dataset.bgSlotMinX = String(slot.x[0]);
  symbol.dataset.bgSlotMaxX = String(slot.x[1]);
  symbol.dataset.bgSlotMinY = String(slot.y[0]);
  symbol.dataset.bgSlotMaxY = String(slot.y[1]);
  moveBackgroundSymbolWithinSlot(symbol);
}

function normalizeBackgroundSymbolNodes() {
  const container = document.querySelector(".bg-symbols");
  if (!container) {
    return [];
  }

  let symbols = Array.from(container.querySelectorAll(".bg-symbol"));
  symbols.slice(BACKGROUND_SYMBOL_VISIBLE_COUNT).forEach((symbol) => symbol.remove());
  symbols = symbols.slice(0, BACKGROUND_SYMBOL_VISIBLE_COUNT);

  while (symbols.length < BACKGROUND_SYMBOL_VISIBLE_COUNT) {
    const symbol = document.createElement("span");
    symbol.className = "bg-symbol";
    container.appendChild(symbol);
    symbols.push(symbol);
  }

  return symbols;
}

function getActiveBackgroundGlyphs(symbols) {
  return symbols
    .map((symbol) => symbol.textContent.trim())
    .filter(Boolean);
}

function pickNextBackgroundGlyph(symbol, symbols) {
  const currentGlyph = symbol.textContent.trim();
  const activeGlyphs = new Set(getActiveBackgroundGlyphs(symbols));
  const inactiveGlyphs = BACKGROUND_SYMBOL_GLYPHS.filter((glyph) => !activeGlyphs.has(glyph));
  const candidates = inactiveGlyphs.length
    ? inactiveGlyphs
    : BACKGROUND_SYMBOL_GLYPHS.filter((glyph) => glyph !== currentGlyph);
  return pickRandomArrayItem(candidates.length ? candidates : BACKGROUND_SYMBOL_GLYPHS);
}

function cycleBackgroundSymbolGlyph(symbol, symbols) {
  const nextGlyph = pickNextBackgroundGlyph(symbol, symbols);
  if (nextGlyph) {
    symbol.textContent = nextGlyph;
  }
  moveBackgroundSymbolWithinSlot(symbol);
}

function wireBackgroundSymbolCycling(symbol, symbols) {
  if (symbol.dataset.bgSymbolCycling === "true") {
    return;
  }

  symbol.dataset.bgSymbolCycling = "true";
  symbol.addEventListener("animationiteration", (event) => {
    if (event.animationName === "bgSymbolPulse") {
      cycleBackgroundSymbolGlyph(symbol, symbols);
    }
  });
}

function randomizeBackgroundSymbols() {
  const symbols = normalizeBackgroundSymbolNodes();
  if (!symbols.length) {
    return;
  }

  const initialGlyphs = shuffleArray(BACKGROUND_SYMBOL_GLYPHS);
  const viewportWidth = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
  const isWideViewport = viewportWidth >= 1100;
  const slots = shuffleArray(getBackgroundSymbolSlots(isWideViewport));

  symbols.forEach((symbol, index) => {
    const slot = slots[index % slots.length];

    symbol.textContent = initialGlyphs[index % initialGlyphs.length] || pickRandomArrayItem(BACKGROUND_SYMBOL_GLYPHS);
    assignBackgroundSymbolSlot(symbol, slot);
    symbol.style.setProperty("--s", `${randomBetween(1.65, 2.75).toFixed(2)}rem`);
    symbol.style.setProperty("--f", `${randomBetween(29, 48).toFixed(2)}s`);
    symbol.style.setProperty("--p", `${randomBetween(7.8, 10.8).toFixed(2)}s`);
    symbol.style.setProperty("--d", `${(-(index * 0.62 + randomBetween(0, 1.7))).toFixed(2)}s`);
    symbol.style.setProperty("--o", randomBetween(0.12, 0.19).toFixed(3));
    wireBackgroundSymbolCycling(symbol, symbols);
  });
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

const loaderPercentTimers = new Map();

function animateLoaderPercent(overlay, active) {
  if (!overlay) {
    return;
  }

  const readout = overlay.querySelector("[data-loader-percent]");
  if (!readout) {
    return;
  }

  const existingTimer = loaderPercentTimers.get(overlay);
  if (existingTimer) {
    clearInterval(existingTimer);
    loaderPercentTimers.delete(overlay);
  }

  if (!active) {
    readout.textContent = "0%";
    return;
  }

  // Fake but honest-looking progress: fast start, asymptotic crawl to 99%.
  const rate = Number.parseFloat(readout.dataset.loaderRate) || 1.6;
  let value = 0;
  let last = performance.now();
  readout.textContent = "0%";
  loaderPercentTimers.set(overlay, setInterval(() => {
    const now = performance.now();
    const dt = Math.min(0.4, (now - last) / 1000);
    last = now;
    value += (99 - value) * dt * rate;
    readout.textContent = `${Math.min(99, Math.floor(value))}%`;
  }, 80));
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
  animateLoaderPercent(elements.syncOverlay, active);
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
  animateLoaderPercent(elements.classifiedLoadOverlay, active);
}

function setLanguageMenuOpen(active) {
  if (!elements.langDropdown || !elements.langToggleBtn || !elements.langMenu) {
    return;
  }

  elements.langDropdown.classList.toggle("is-open", active);
  elements.langToggleBtn.setAttribute("aria-expanded", active ? "true" : "false");
  elements.langMenu.hidden = !active;
}

function setDropsLangMenuOpen(active) {
  if (!elements.dropsLangDropdown || !elements.dropsLangToggleBtn || !elements.dropsLangMenu) {
    return;
  }

  elements.dropsLangDropdown.classList.toggle("is-open", active);
  elements.dropsLangToggleBtn.setAttribute("aria-expanded", active ? "true" : "false");
  elements.dropsLangMenu.hidden = !active;
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

function getDropsLangLabel(value) {
  const normalized = value === "es" ? "es" : "en";
  if (elements.dropsLangSelect instanceof HTMLSelectElement) {
    const matchedOption = Array.from(elements.dropsLangSelect.options).find((option) => option.value === normalized);
    const matchedLabel = String(matchedOption?.textContent || "").trim();
    if (matchedLabel) {
      return matchedLabel;
    }
  }
  return normalized === "es" ? "Español" : "English";
}

function syncDropsLangMenu() {
  if (elements.dropsLangCurrent) {
    elements.dropsLangCurrent.textContent = getDropsLangLabel(elements.dropsLangSelect?.value || "en");
  }

  if (!Array.isArray(elements.dropsLangOptions)) {
    return;
  }

  const selectedValue = elements.dropsLangSelect?.value === "es" ? "es" : "en";
  elements.dropsLangOptions.forEach((option) => {
    const selected = option.dataset.dropsLang === selectedValue;
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
    elements.hackOpenClassifiedBtn.hidden = !canOpenClassifiedArchive();
  }
}

function showHackOverlay() {
  if (!elements.hackOverlay || document.body.classList.contains("is-booting")) {
    return;
  }

  state.easterEgg.triggerClicks = 0;
  state.easterEgg.triggerWindowStart = 0;

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
  // Close hack overlay first so classified loading never renders behind its blur layer.
  hideHackOverlay();
  showClassifiedLoadOverlay(true);

  const classifiedLoadMs = 950;
  setTimeout(() => {
    showClassifiedLoadOverlay(false);
    showClassifiedPage();
  }, classifiedLoadMs);
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
      const wikiUrl = normalizeWikiUrl(item?.WikiUrl || "");
      entries.push({
        listNumber,
        name,
        normalizedName: normalizePlanName(name),
        normalizedRaw: normalizeSearchText(name),
        price: Number.isFinite(price) ? price : null,
        wikiUrl: wikiUrl || null
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

function buildFallbackMinervaEventByIndex(eventIndex, eventStart) {
  const normalizedIndex = Math.max(0, Number(eventIndex) || 0);
  const phase = mod(normalizedIndex, 4);
  const safeStart = eventStart instanceof Date && !Number.isNaN(eventStart.getTime())
    ? eventStart
    : buildFallbackCycleDate(0);
  const eventEnd = shiftEasternDateByDays(safeStart, MINERVA_FALLBACK_EVENT_ACTIVE_DAYS[phase]);

  return {
    eventIndex: normalizedIndex,
    listNumber: mod(normalizedIndex, CYCLE_WEEKS) + 1,
    location: CYCLE_LOCATIONS[phase],
    eventStart: safeStart,
    eventEnd,
    phase
  };
}

function nextFallbackMinervaEventStart(eventStart, eventIndex) {
  const safeStart = eventStart instanceof Date && !Number.isNaN(eventStart.getTime())
    ? eventStart
    : buildFallbackCycleDate(0);
  const phase = mod(Number(eventIndex) || 0, 4);
  return shiftEasternDateByDays(safeStart, MINERVA_FALLBACK_EVENT_START_GAP_DAYS[phase]);
}

function resolveFallbackMinervaEventWindow(now = new Date()) {
  let eventIndex = 0;
  let eventStart = buildFallbackCycleDate(0);

  for (let guard = 0; guard < MINERVA_FALLBACK_EVENT_SEARCH_LIMIT; guard += 1) {
    const currentEvent = buildFallbackMinervaEventByIndex(eventIndex, eventStart);
    const nextStart = nextFallbackMinervaEventStart(eventStart, eventIndex);

    if (!(nextStart instanceof Date) || Number.isNaN(nextStart.getTime())) {
      return {
        ...currentEvent,
        active: now >= currentEvent.eventStart && now < currentEvent.eventEnd
      };
    }

    if (now < currentEvent.eventStart) {
      return {
        ...currentEvent,
        active: false
      };
    }

    if (now < currentEvent.eventEnd) {
      return {
        ...currentEvent,
        active: true
      };
    }

    if (now < nextStart) {
      const nextEvent = buildFallbackMinervaEventByIndex(eventIndex + 1, nextStart);
      return {
        ...nextEvent,
        active: false
      };
    }

    eventIndex += 1;
    eventStart = nextStart;
  }

  const fallbackEvent = buildFallbackMinervaEventByIndex(eventIndex, eventStart);
  return {
    ...fallbackEvent,
    active: now >= fallbackEvent.eventStart && now < fallbackEvent.eventEnd
  };
}

function nextAvailabilityForList(listNumber, now = new Date()) {
  const listValue = Number(listNumber);
  if (!Number.isFinite(listValue) || listValue < 1) {
    return null;
  }

  const targetCycleIndex = mod(listValue - 1, CYCLE_WEEKS);
  const currentWindow = resolveFallbackMinervaEventWindow(now);
  let eventIndex = Number(currentWindow?.eventIndex) || 0;
  let eventStart = currentWindow?.eventStart instanceof Date && !Number.isNaN(currentWindow.eventStart.getTime())
    ? currentWindow.eventStart
    : buildFallbackCycleDate(0);

  for (let guard = 0; guard < CYCLE_WEEKS + 1; guard += 1) {
    const candidate = buildFallbackMinervaEventByIndex(eventIndex, eventStart);
    if (mod(candidate.listNumber - 1, CYCLE_WEEKS) === targetCycleIndex) {
      const isActive = now >= candidate.eventStart && now < candidate.eventEnd;
      const msUntil = candidate.eventStart.getTime() - now.getTime();
      const daysUntil = Math.max(0, Math.ceil(msUntil / MS_DAY));

      return {
        ...candidate,
        isActive,
        daysUntil,
        saleKey: candidate.phase === 3 ? "classified_sale_big" : "classified_sale_standard"
      };
    }

    eventStart = nextFallbackMinervaEventStart(eventStart, eventIndex);
    eventIndex += 1;
  }

  return null;
}

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

function handleSecretTriggerTap() {
  if (elements.hackOverlay?.classList.contains("is-active")) {
    state.easterEgg.triggerClicks = 0;
    state.easterEgg.triggerWindowStart = 0;
    return;
  }

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

async function fetchSiloDataFromApi(timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(SILO_API_URL, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const codes = payload && typeof payload.codes === "object" ? payload.codes : {};
    const resetTargetRaw = String(payload?.resetTargetUtc || "").trim();
    const resetTargetMs = resetTargetRaw ? Date.parse(resetTargetRaw) : NaN;

    return {
      codes: {
        Alpha: typeof codes.Alpha === "string" ? codes.Alpha : null,
        Bravo: typeof codes.Bravo === "string" ? codes.Bravo : null,
        Charlie: typeof codes.Charlie === "string" ? codes.Charlie : null
      },
      isExpired: Boolean(payload?.isExpired),
      resetTargetUtc: Number.isFinite(resetTargetMs) ? resetTargetMs : null,
      source: String(payload?.source || "").trim() || "https://nukacrypt.com/"
    };
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

function formatSiloCodeForDisplay(code) {
  const digits = typeof code === "string" ? code.replace(/\D/g, "") : "";
  const match = digits.match(/^(\d{3})(\d{2})(\d{3})$/);

  if (!match) {
    return "--- -- ---";
  }

  return `${match[1]} ${match[2]} ${match[3]}`;
}

function getSiloCodeClipboardValue(code) {
  const digits = typeof code === "string" ? code.replace(/\D/g, "") : "";
  return /^\d{8}$/.test(digits) ? digits : "";
}

function getSiloCodeCopyToast() {
  let toast = document.getElementById("siloCodeCopyToast");
  if (toast) {
    return toast;
  }

  toast = document.createElement("div");
  toast.id = "siloCodeCopyToast";
  toast.className = "silo-code-copy-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.setAttribute("aria-atomic", "true");
  document.body.appendChild(toast);
  return toast;
}

function isSiloCodeCopyMobileToast() {
  if (window.matchMedia?.("(max-width: 720px), (hover: none), (pointer: coarse)")?.matches) {
    return true;
  }
  return false;
}

function positionSiloCodeCopyToast(toast, card, point) {
  if (!(toast instanceof HTMLElement)) {
    return;
  }

  const useMobileToast = isSiloCodeCopyMobileToast();
  toast.classList.toggle("is-mobile", useMobileToast);
  toast.classList.toggle("is-desktop", !useMobileToast);
  toast.classList.remove("is-right-of-cursor", "is-left-of-cursor");

  if (useMobileToast) {
    toast.style.left = "";
    toast.style.top = "";
    return;
  }

  const cardRect = card instanceof HTMLElement ? card.getBoundingClientRect() : null;
  const pointX = Number(point?.clientX);
  const pointY = Number(point?.clientY);
  const hasPointerPoint = Number.isFinite(pointX) && Number.isFinite(pointY) && (pointX > 0 || pointY > 0);
  const baseX = hasPointerPoint ? pointX : (cardRect ? cardRect.right : window.innerWidth / 2);
  const baseY = hasPointerPoint ? pointY : (cardRect ? cardRect.top + cardRect.height / 2 : window.innerHeight / 2);
  const gap = 26;
  const margin = 10;

  toast.style.left = "0px";
  toast.style.top = "0px";
  const width = toast.offsetWidth || 240;
  const height = toast.offsetHeight || 36;
  let left = baseX + gap;
  let top = baseY - height / 2;
  let opensRight = true;

  if (left + width + margin > window.innerWidth) {
    left = baseX - width - gap;
    opensRight = false;
  }
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
  top = Math.max(margin, Math.min(top, window.innerHeight - height - margin));

  toast.classList.toggle("is-right-of-cursor", opensRight);
  toast.classList.toggle("is-left-of-cursor", !opensRight);
  toast.style.left = `${Math.round(left)}px`;
  toast.style.top = `${Math.round(top)}px`;
}

function showSiloCodeCopyToast(card, message, kind, point) {
  const toast = getSiloCodeCopyToast();
  const ownerId = card?.dataset?.siloCopyId || "";
  const isError = kind === "error";
  const arrow = document.createElement("span");
  arrow.className = "silo-code-copy-toast-arrow";
  arrow.setAttribute("aria-hidden", "true");

  const signal = document.createElement("span");
  signal.className = "silo-code-copy-toast-signal";
  signal.setAttribute("aria-hidden", "true");

  const copy = document.createElement("span");
  copy.className = "silo-code-copy-toast-copy";

  const status = document.createElement("span");
  status.className = "silo-code-copy-toast-status";
  status.textContent = t(isError ? "silo_code_copy_status_error" : "silo_code_copy_status_success");

  const body = document.createElement("span");
  body.className = "silo-code-copy-toast-message";
  body.textContent = message;

  copy.append(status, body);
  toast.dataset.ownerId = ownerId;
  toast.replaceChildren(arrow, signal, copy);
  toast.classList.toggle("is-error", isError);
  toast.classList.toggle("is-success", !isError);
  toast.classList.add("is-visible");
  positionSiloCodeCopyToast(toast, card, point);
}

function resetSiloCodeCopyState(card) {
  if (!(card instanceof HTMLElement)) {
    return;
  }

  card.classList.remove("is-copy-confirmed", "is-copy-error");
  const toast = document.getElementById("siloCodeCopyToast");
  if (toast?.dataset?.ownerId === card.dataset.siloCopyId) {
    toast.classList.remove("is-visible");
    delete toast.dataset.ownerId;
  }
  delete card.dataset.copyResetTimer;
}

function flashSiloCodeCopyState(card, site, kind = "success", point = null) {
  if (!(card instanceof HTMLElement)) {
    return;
  }

  const previousTimerId = Number.parseInt(card.dataset.copyResetTimer || "", 10);
  if (Number.isFinite(previousTimerId) && previousTimerId > 0) {
    clearTimeout(previousTimerId);
  }

  const isError = kind === "error";
  card.classList.toggle("is-copy-confirmed", !isError);
  card.classList.toggle("is-copy-error", isError);

  showSiloCodeCopyToast(
    card,
    t(isError ? "silo_code_copy_failed" : "silo_code_copied", { site }),
    kind,
    point
  );

  const timerId = window.setTimeout(() => {
    if (card.isConnected) {
      resetSiloCodeCopyState(card);
    }
  }, 1900);
  card.dataset.copyResetTimer = String(timerId);
}

async function handleSiloCodeCopy(card, site, code, event = null) {
  const clipboardValue = getSiloCodeClipboardValue(code);
  if (!clipboardValue) {
    return;
  }

  try {
    await copyTextToClipboard(clipboardValue);
    flashSiloCodeCopyState(card, site, "success", event);
  } catch (_error) {
    flashSiloCodeCopyState(card, site, "error", event);
  }
}

function renderSiloFromState() {
  elements.siloCodes.innerHTML = "";

  if (state.silo.error) {
    elements.siloCodes.innerHTML = `<div class="error">${t("silo_error")}</div>`;
    if (state.siloDossier.open) {
      renderSiloDossier();
    }
    return;
  }

  const codes = state.silo.codes || {
    Alpha: null,
    Bravo: null,
    Charlie: null
  };
  const cards = [];

  for (const site of ["Alpha", "Bravo", "Charlie"]) {
    const rawCode = codes[site];
    const displayCode = formatSiloCodeForDisplay(rawCode);
    const clipboardValue = getSiloCodeClipboardValue(rawCode);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "code-card silo-code-copy-card";
    card.dataset.siloCopyId = `silo-${site.toLowerCase()}`;
    card.disabled = !clipboardValue;
    card.setAttribute("aria-label", t("silo_code_copy_label", { site, code: displayCode }));

    const siteLabel = document.createElement("div");
    siteLabel.className = "site";
    const siteIcon = createIconTag(SILO_SITE_GLYPHS[site] || "");
    siteLabel.appendChild(siteIcon);
    siteLabel.append(`SITE ${site.toUpperCase()}`);

    const codeValue = document.createElement("div");
    codeValue.className = "code";
    codeValue.textContent = displayCode;

    card.appendChild(siteLabel);
    card.appendChild(codeValue);
    card.addEventListener("click", (event) => {
      handleSiloCodeCopy(card, site, rawCode, event);
    });
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
  if (state.siloDossier.open) {
    renderSiloDossier();
  }
}

async function refreshSiloPanel() {
  const previousResetTarget = state.silo.resetTargetUtc;

  try {
    let nextSiloData;

    try {
      nextSiloData = await fetchSiloDataFromApi(12000);
    } catch (_apiError) {
      const { text, source } = await fetchFromCandidates(SOURCE_URLS.silo, 25000);
      const parsed = parseSiloData(text);
      nextSiloData = {
        codes: parsed.codes,
        isExpired: parsed.isExpired,
        resetTargetUtc: countdownToUtc(parsed.resetCountdown),
        source
      };
    }

    const hasAtLeastOne = Object.values(nextSiloData.codes || {}).some(Boolean);

    state.silo = {
      error: !hasAtLeastOne,
      codes: nextSiloData.codes,
      isExpired: nextSiloData.isExpired,
      resetTargetUtc: nextSiloData.resetTargetUtc || previousResetTarget || null,
      source: nextSiloData.source
    };

    renderSiloFromState();
    return { ok: hasAtLeastOne };
  } catch (error) {
    state.silo = {
      error: true,
      codes: null,
      isExpired: false,
      resetTargetUtc: previousResetTarget || null,
      source: state.silo.source || "https://nukacrypt.com/"
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

function parseOptionalPrice(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === "string" && !value.trim()) {
    return null;
  }

  const price = Number(value);
  return Number.isFinite(price) ? price : null;
}

function mapArchiveMinervaItem(entry) {
  return {
    name: String(entry?.Name || "").trim() || "--",
    price: parseOptionalPrice(entry?.Price),
    url: normalizeWikiUrl(entry?.WikiUrl || "")
  };
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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
    prewarmMinervaDetailImages(embeddedByKey);
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
      prewarmMinervaDetailImages(byKey);
      return byKey;
    } catch (error) {
      state.minervaDetail.fallbackByKey = {};
      prewarmMinervaDetailImages({});
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

  prewarmMinervaDetailImages(byKey);

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
        if (detail.imageUrl) {
          void queueImagePreload(detail.imageUrl);
        }
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
    clearMinervaDetailImage(elements.minervaDetailImage);
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
    clearMinervaDetailImage(elements.minervaDetailImage);
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
    void queueImagePreload(detailImageUrl, { highPriority: true });
    applyMinervaDetailImage(elements.minervaDetailImage, detailImageUrl, {
      alt: `${item.name || item.Name} image`,
      fallbackSrc: fallbackImageUrl || detailImageUrl
    });
  } else {
    clearMinervaDetailImage(elements.minervaDetailImage);
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
  clearMinervaDetailImage(elements.minervaDetailImage);
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

function mergeMinervaArchiveItems(data, lists = []) {
  const liveData = data && typeof data === "object" ? data : {};
  if (!Array.isArray(lists) || !lists.length) {
    return liveData;
  }

  let listNumber = Number(liveData?.listNumber);
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
    items: inventory.map((entry) => mapArchiveMinervaItem(entry)),
    archiveSource: "local_lists"
  };
}

function parseMinervaInfoApiDateAt18(dateValue) {
  const normalized = String(dateValue || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return null;
  }

  const [year, month, day] = normalized.split("-").map((part) => Number(part));
  return buildEasternDate(year, month, day, 12, 0);
}

function normalizeMinervaInfoImagePath(fileName) {
  const cleaned = String(fileName || "").trim();
  if (!cleaned) {
    return "";
  }
  return `${MINERVA_INFO_LOCAL_IMAGE_BASE}/${cleaned}`;
}

function resolveMinervaLocationMapImage(imagePath, location = "") {
  const normalizedLocation = normalizeLocation(location);
  const localByLocation = normalizedLocation !== "--"
    ? String(MINERVA_LOCATION_MAP_BY_LOCATION[normalizedLocation] || "").trim()
    : "";
  if (localByLocation) {
    return localByLocation;
  }

  const cleaned = String(imagePath || "").trim();
  if (!cleaned) {
    return "";
  }

  const pathWithoutQuery = cleaned.split("#")[0].split("?")[0];
  const fileName = pathWithoutQuery.split("/").pop() || "";
  const localByFileName = /^minerva_(foundation|crater|atlas|whitespring)\.(png|jpg|jpeg)$/i.test(fileName)
    ? normalizeMinervaInfoImagePath(fileName)
    : "";
  if (localByFileName) {
    return localByFileName;
  }

  const inferredLocation = inferLocationFromMapImage(cleaned);
  if (inferredLocation !== "--") {
    return String(MINERVA_LOCATION_MAP_BY_LOCATION[inferredLocation] || "").trim();
  }

  return cleaned;
}

function parseMinervaInfoApi(payload, lists = []) {
  const itemsRaw = Array.isArray(payload?.data?.items) ? payload.data.items : [];
  if (!itemsRaw.length) {
    return null;
  }

  const firstItem = itemsRaw[0];
  let location = normalizeLocation(firstItem?.location_name || "");
  let eventStart = parseMinervaInfoApiDateAt18(firstItem?.date_start);
  let eventEnd = parseMinervaInfoApiDateAt18(firstItem?.date_end);
  const saleType = Number(firstItem?.Type_list);
  if (saleType === 1 && eventEnd instanceof Date && !Number.isNaN(eventEnd.getTime())) {
    eventEnd = shiftEasternDateByDays(eventEnd, -1);
  }
  const now = new Date();
  let active = Boolean(eventStart && eventEnd && now >= eventStart && now < eventEnd);
  let locationMapImage = resolveMinervaLocationMapImage(firstItem?.location_img, location)
    || MINERVA_LOCATION_MAP_BY_LOCATION[location]
    || "";

  let items = itemsRaw.map((item) => {
    const price = parseOptionalPrice(item?.gold);
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

  if (!active && eventEnd instanceof Date && !Number.isNaN(eventEnd.getTime()) && now >= eventEnd) {
    const nextEvent = resolveFallbackMinervaEventWindow(now);
    if (nextEvent && !nextEvent.active) {
      location = nextEvent.location;
      eventStart = nextEvent.eventStart;
      eventEnd = nextEvent.eventEnd;
      listNumber = nextEvent.listNumber;
      locationMapImage = MINERVA_LOCATION_MAP_BY_LOCATION[location] || "";
      const nextListData = lists.find((entry) => Number(entry?.ListNumber) === listNumber);
      const nextInventory = Array.isArray(nextListData?.Inventory) ? nextListData.Inventory : [];
      items = nextInventory
        .map((item) => mapArchiveMinervaItem(item))
        .filter((item) => item.name && item.name !== "--");
    }
  }

  return mergeMinervaArchiveItems({
    location,
    listNumber,
    active,
    nextChange: null,
    eventStart,
    eventEnd,
    items,
    mode: "live_info",
    locationMapImage
  }, lists);
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

function normalizeMinervaIntelApiPayload(payload, lists = []) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const eventStartMs = Date.parse(String(payload.eventStart || ""));
  const eventEndMs = Date.parse(String(payload.eventEnd || ""));
  const items = Array.isArray(payload.items)
    ? payload.items.map((item) => {
      const price = parseOptionalPrice(item?.price);
      return {
        name: String(item?.name || "").trim() || "--",
        price: Number.isFinite(price) ? price : null,
        url: normalizeWikiUrl(item?.url || "")
      };
    }).filter((item) => item.name && item.name !== "--")
    : [];

  let listNumber = Number(payload.listNumber);
  if (!Number.isFinite(listNumber) || listNumber < 1) {
    listNumber = inferListNumber(items, lists);
  }

  const location = normalizeLocation(payload.location || inferLocationFromMapImage(payload.locationMapImage || ""));
  const source = String(payload.source || "").trim().toLowerCase();

  return mergeMinervaArchiveItems({
    location,
    listNumber,
    active: Boolean(payload.active),
    nextChange: String(payload.nextChange || "").trim() || null,
    eventStart: Number.isFinite(eventStartMs) ? new Date(eventStartMs) : null,
    eventEnd: Number.isFinite(eventEndMs) ? new Date(eventEndMs) : null,
    items,
    mode: source.includes("minerva-info") ? "live_info" : source.includes("whereisminerva") ? "live" : "fallback",
    locationMapImage: resolveMinervaLocationMapImage(payload.locationMapImage || "", location)
      || MINERVA_LOCATION_MAP_BY_LOCATION[location]
      || "",
    source
  }, lists);
}

async function fetchMinervaIntelFromServer(lists = []) {
  try {
    const payload = await requestJson("/api/intel/minerva");
    return normalizeMinervaIntelApiPayload(payload, lists);
  } catch {
    return null;
  }
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
  const cycleIndex = mod(weekNumber, CYCLE_WEEKS);
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

function buildFallbackMinerva(lists) {
  const cycle = resolveFallbackMinervaEventWindow(new Date());
  const listData = lists.find((entry) => Number(entry.ListNumber) === cycle.listNumber);
  const inventory = Array.isArray(listData?.Inventory) ? listData.Inventory : [];

  const items = inventory.map((item) => ({
    name: item.Name,
    price: parseOptionalPrice(item?.Price),
    url: item.WikiUrl ? `${WIKI_BASE}${item.WikiUrl}` : null
  }));

  return {
    location: cycle.location,
    listNumber: cycle.listNumber,
    active: Boolean(cycle.active),
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
    const priceValue = parseOptionalPrice(item?.price ?? item?.Price);
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

  const serverIntel = await fetchMinervaIntelFromServer(lists);
  if (serverIntel) {
    state.minerva = {
      error: false,
      data: serverIntel
    };
    renderMinervaFromState();
    return {
      ok: true,
      source: serverIntel.mode === "fallback" ? "fallback" : "live"
    };
  }

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
  if (elements.tabStatusText) {
    elements.tabStatusText.textContent = t("tab_status");
  } else {
    elements.tabStatus.textContent = t("tab_status");
  }
  elements.tabIntel.textContent = t("tab_intel");
  if (elements.tabDrops) {
    elements.tabDrops.textContent = t("tab_drop");
  }
  elements.tabData.textContent = t("tab_data");
  if (elements.discordBotInviteLabel) {
    elements.discordBotInviteLabel.textContent = t("discord_bot_invite_label");
  }
  if (elements.discordBotInviteHint) {
    elements.discordBotInviteHint.textContent = t("discord_bot_invite_hint");
  }
  if (elements.discordBotInviteBtn) {
    elements.discordBotInviteBtn.removeAttribute("title");
    elements.discordBotInviteBtn.setAttribute("aria-label", t("discord_bot_invite_title"));
  }
  if (elements.intelBotInviteBadge) {
    elements.intelBotInviteBadge.textContent = t("discord_bot_modal_badge");
  }
  if (elements.intelBotInviteTitle) {
    elements.intelBotInviteTitle.textContent = t("discord_bot_modal_title");
  }
  if (elements.intelBotInviteBody) {
    elements.intelBotInviteBody.textContent = t("discord_bot_modal_body");
  }
  if (elements.intelBotInviteCancelBtn) {
    elements.intelBotInviteCancelBtn.textContent = t("discord_bot_modal_cancel");
  }
  if (elements.intelBotInviteConfirmBtn) {
    elements.intelBotInviteConfirmBtn.textContent = t("discord_bot_modal_confirm");
  }
  elements.langLabel.textContent = t("lang_label");
  renderFilesDecisionTabBadge();
  renderIntelBotInviteModal();
  renderIntelEmailModal();

  elements.labelUtc.textContent = t("label_utc");
  elements.labelLastSync.textContent = t("label_last_sync");
  elements.labelDataLink.textContent = t("label_data_link");
  elements.refreshBtn.textContent = t("refresh_button");

  elements.siloTitle.textContent = t("silo_title");
  elements.siloHint.textContent = t("silo_hint", {
    schedule: formatSiloResetMoment(new Date(getActiveSiloResetTargetMs()))
  });
  elements.siloSourcePrefix.textContent = t("silo_source_prefix");
  elements.siloSourceSuffix.textContent = t("silo_source_suffix");
  if (elements.siloDossierOverlay) {
    if (state.siloDossier.open) {
      renderSiloDossier();
    } else {
      elements.siloDossierEyebrow.textContent = t("silo_dossier_eyebrow");
      elements.siloDossierTitle.textContent = t("silo_dossier_title");
      elements.siloDossierSummary.textContent = t("silo_dossier_loading");
      elements.siloDossierSourceLink.textContent = t("silo_dossier_open_source");
      elements.siloDossierCloseBtn.textContent = t("silo_dossier_close");
      elements.siloDossierResetLabel.textContent = t("silo_dossier_reset_label");
      elements.siloDossierCountdownLabel.textContent = t("silo_dossier_countdown_label");
      elements.siloDossierStatusLabel.textContent = t("silo_dossier_status_label");
      elements.siloDossierSignalLabel.textContent = t("silo_dossier_signal_label");
      elements.siloDossierBackBtn.textContent = t("silo_dossier_back");
    }
  } else {
    state.siloDossier.open = false;
  }

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
  elements.minervaLocationMapPrevBtn?.setAttribute("aria-label", t("minerva_location_map_prev"));
  elements.minervaLocationMapNextBtn?.setAttribute("aria-label", t("minerva_location_map_next"));
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
  elements.classifiedPlayersBtn.textContent = t("classified_players_button");
  renderClassifiedIntelButtons();
  elements.classifiedMinervaTitle.textContent = t("classified_minerva_title");
  if (elements.classifiedMinervaHint) {
    elements.classifiedMinervaHint.textContent = t("classified_minerva_hint");
  }
  elements.classifiedSearchLabel.textContent = t("classified_search_label");
  elements.classifiedSearchInput.placeholder = t("classified_search_placeholder");
  elements.classifiedSearchHint.textContent = t("classified_search_hint");
  setClassifiedSearchOpen(state.classifiedSearch.open);
  renderClassifiedPlayerCountsModal();
  renderClassifiedNukaIntelModal();
  renderClassifiedAxolotlModal();
  if (typeof window.updateAtomicShopLanguage === "function") {
    window.updateAtomicShopLanguage();
  }
  if (elements.classifiedInlineStatus && !state.classifiedDetail.open) {
    elements.classifiedInlineStatus.textContent = t("minerva_detail_loading");
  }

  elements.filesUnauthorizedTitle.textContent = t("files_unauthorized_title");
  elements.filesUnauthorizedSubtitle.textContent = t("files_unauthorized_subtitle");
  elements.filesUnauthorizedBadge.textContent = t("files_unauthorized_badge");
  elements.filesAuthCharacterCaption.textContent = t("files_auth_character_caption");
  elements.filesAuthConsoleStatus.textContent = t("files_auth_console_status");
  elements.filesUnauthorizedKicker.textContent = t("files_unauthorized_kicker");
  elements.filesUnauthorizedStateLabel.textContent = t("files_unauthorized_state_label");
  elements.filesUnauthorizedStateValue.textContent = t("files_unauthorized_state_value");
  elements.filesUnauthorizedGateLabel.textContent = t("files_unauthorized_gate_label");
  elements.filesUnauthorizedGateValue.textContent = t("files_unauthorized_gate_value");
  elements.filesUnauthorizedTraceLabel.textContent = t("files_unauthorized_trace_label");
  elements.filesUnauthorizedTraceValue.textContent = t("files_unauthorized_trace_value");
  elements.filesUnauthorizedDirectiveTitle.textContent = t("files_unauthorized_directive_title");
  elements.filesUnauthorizedDirectiveLine1.textContent = t("files_unauthorized_directive_line_1");
  elements.filesUnauthorizedDirectiveLine2.textContent = t("files_unauthorized_directive_line_2");
  elements.filesUnauthorizedDirectiveLine3.textContent = t("files_unauthorized_directive_line_3");
  elements.filesRestrictedBadge.textContent = t("files_restricted_badge");
  elements.filesRestrictedIncident.textContent = t("files_restricted_incident", { code: "FR-000000" });
  elements.filesRestrictedTitle.textContent = t("files_restricted_title");
  elements.filesRestrictedSubtitle.textContent = t("files_restricted_subtitle");
  if (elements.filesRestrictedPublicShareNote) {
    elements.filesRestrictedPublicShareNote.textContent = t("files_share_restricted_public_note");
  }
  elements.filesRestrictedIdentityLabel.textContent = t("files_restricted_identity_label");
  elements.filesRestrictedDiscordLabel.textContent = t("files_restricted_discord_label");
  elements.filesRestrictedClearanceLabel.textContent = t("files_restricted_clearance_label");
  elements.filesRestrictedStatusLabel.textContent = t("files_restricted_status_label");
  elements.filesRestrictedTimeLabel.textContent = t("files_restricted_time_label");
  elements.filesRestrictedIdentityValue.textContent = t("files_unknown_value");
  elements.filesRestrictedDiscordValue.textContent = t("files_unknown_value");
  elements.filesRestrictedClearanceValue.textContent = t("files_session_clearance_unauthorized");
  elements.filesRestrictedStatusValue.textContent = getFilesAccessRequestStatusLabel(state.files.me?.accessRequestStatus || "none");
  elements.filesRestrictedTimeValue.textContent = t("files_unknown_value");
  elements.filesRestrictedDirectiveTitle.textContent = t("files_restricted_directive_title");
  elements.filesRestrictedDirectiveLine1.textContent = t("files_restricted_directive_line_1");
  elements.filesRestrictedDirectiveLine2.textContent = t("files_restricted_directive_line_2");
  elements.filesRestrictedDirectiveLine3.textContent = t("files_restricted_directive_line_3");
  elements.filesRestrictedReasonLabel.textContent = t("files_restricted_reason_label");
  elements.filesRestrictedReasonInput.placeholder = t("files_restricted_reason_placeholder");
  elements.filesRestrictedReasonHint.textContent = t("files_restricted_reason_hint");
  elements.filesRestrictedRetryBtn.textContent = t("files_restricted_retry_button");
  elements.filesRestrictedLogoutBtn.textContent = t("files_logout_button");
  elements.filesDeniedBadge.textContent = t("files_denied_badge");
  elements.filesDeniedTitle.textContent = t("files_denied_title");
  elements.filesDeniedSubtitle.textContent = t("files_denied_subtitle");
  if (elements.filesDeniedReasonLabel) {
    elements.filesDeniedReasonLabel.textContent = t("files_denied_reason_label");
  }
  if (elements.filesDeniedReasonValue) {
    elements.filesDeniedReasonValue.textContent = t("files_unknown_value");
  }
  elements.filesDeniedStatusLabel.textContent = t("files_denied_status_label");
  elements.filesDeniedStatusValue.textContent = t("files_denied_status_value");
  elements.filesDeniedNextWindowLabel.textContent = t("files_denied_next_window_label");
  elements.filesDeniedNextWindowValue.textContent = t("files_unknown_value");
  elements.filesDeniedCountdownLabel.textContent = t("files_denied_countdown_label");
  elements.filesDeniedCountdownValue.textContent = t("files_unknown_value");
  elements.filesDeniedDirectiveTitle.textContent = t("files_denied_directive_title");
  elements.filesDeniedDirectiveLine1.textContent = t("files_denied_directive_line_1");
  elements.filesDeniedDirectiveLine2.textContent = t("files_denied_directive_line_2");
  elements.filesDeniedDirectiveLine3.textContent = t("files_denied_directive_line_3");
  if (elements.filesDeniedDirectiveLine4) {
    elements.filesDeniedDirectiveLine4.textContent = t("files_denied_directive_line_4");
  }
  elements.filesDeniedLogoutBtn.textContent = t("files_logout_button");
  if (elements.filesDisclaimerGateBadge) {
    elements.filesDisclaimerGateBadge.textContent = t("files_disclaimer_gate_badge");
  }
  if (elements.filesDisclaimerGateTitle) {
    elements.filesDisclaimerGateTitle.textContent = t("files_disclaimer_gate_title");
  }
  if (elements.filesDisclaimerGateIntro) {
    elements.filesDisclaimerGateIntro.textContent = t("files_disclaimer_gate_intro");
  }
  if (elements.filesDisclaimerGateBody1) {
    elements.filesDisclaimerGateBody1.textContent = t("files_disclaimer_modal_body_1");
  }
  if (elements.filesDisclaimerGateBody2) {
    elements.filesDisclaimerGateBody2.textContent = t("files_disclaimer_modal_body_2");
  }
  if (elements.filesDisclaimerAgreeBtn) {
    elements.filesDisclaimerAgreeBtn.textContent = t("files_disclaimer_gate_agree_button");
  }
  if (elements.filesDisclaimerDeclineBtn) {
    elements.filesDisclaimerDeclineBtn.textContent = t("files_disclaimer_gate_decline_button");
  }
  if (elements.filesDisclaimerDeclinedTitle) {
    elements.filesDisclaimerDeclinedTitle.textContent = t("files_disclaimer_gate_declined_title");
  }
  if (elements.filesDisclaimerDeclinedMessage) {
    elements.filesDisclaimerDeclinedMessage.textContent = t("files_disclaimer_gate_declined_message");
  }
  if (elements.filesDisclaimerContactBtn) {
    elements.filesDisclaimerContactBtn.textContent = t("files_disclaimer_gate_contact_button");
  }
  if (elements.filesDisclaimerContactTitle) {
    elements.filesDisclaimerContactTitle.textContent = t("files_disclaimer_gate_contact_title");
  }
  if (elements.filesDisclaimerContactHint) {
    elements.filesDisclaimerContactHint.textContent = t("files_disclaimer_gate_contact_hint");
  }
  if (elements.filesDisclaimerContactLabel) {
    elements.filesDisclaimerContactLabel.textContent = t("files_disclaimer_gate_contact_label");
  }
  if (elements.filesDisclaimerContactInput) {
    elements.filesDisclaimerContactInput.placeholder = t("files_disclaimer_gate_contact_placeholder");
  }
  if (elements.filesDisclaimerContactCancelBtn) {
    elements.filesDisclaimerContactCancelBtn.textContent = t("files_disclaimer_gate_contact_cancel_button");
  }
  if (elements.filesDisclaimerContactSendBtn) {
    elements.filesDisclaimerContactSendBtn.textContent = t("files_disclaimer_gate_contact_send_button");
  }
  if (elements.filesDisclaimerAcceptLoaderText) {
    elements.filesDisclaimerAcceptLoaderText.textContent = t("files_disclaimer_gate_accept_loading");
  }
  if (!state.files.accessRequestMessage) {
    elements.filesRestrictedRequestFeedback.hidden = true;
    elements.filesRestrictedRequestFeedback.textContent = "";
    elements.filesRestrictedRequestFeedback.classList.remove("is-error", "is-success");
  }
  elements.filesNotAuthorizedMessage.textContent = t("files_not_authorized_message");
  elements.filesLoginBtn.textContent = t("files_login_button");
  elements.filesLogoutBtn.textContent = t("files_logout_button");
  elements.filesSessionLogoutBtn.textContent = t("files_logout_button");
  elements.filesSessionTitle.textContent = t("files_profile_title");
  elements.filesSessionUserLabel.textContent = t("files_session_user_label");
  elements.filesSessionIdLabel.textContent = t("files_session_id_label");
  elements.filesSessionClearanceLabel.textContent = t("files_session_clearance_label");
  elements.filesSessionStateLabel.textContent = t("files_session_state_label");
  if (elements.filesSessionTimerLabel) {
    elements.filesSessionTimerLabel.textContent = t("files_session_access_expires_label");
  }
  elements.filesSessionBadge.textContent = t("files_unknown_value");
  setFilesSessionRankEffect(elements.filesSessionUser, t("files_unknown_value"));
  elements.filesSessionId.textContent = t("files_unknown_value");
  setFilesSessionRankEffect(elements.filesSessionClearance, t("files_unknown_value"));
  elements.filesSessionState.textContent = t("files_unknown_value");
  elements.filesSessionBadge.classList.remove("is-admin");
  if (elements.filesAdminToolsTitle) {
    elements.filesAdminToolsTitle.textContent = t("files_admin_tools_title");
  }
  if (elements.filesAdminToolsHint) {
    elements.filesAdminToolsHint.textContent = t("files_admin_tools_hint");
  }
  if (elements.filesPublicSharesToolsTitle) {
    elements.filesPublicSharesToolsTitle.textContent = t("files_public_shares_tools_title");
  }
  if (elements.filesPublicSharesToolsHint) {
    elements.filesPublicSharesToolsHint.textContent = t("files_public_shares_tools_hint");
  }
  if (elements.filesAdminConsoleModalBtnText) {
    elements.filesAdminConsoleModalBtnText.textContent = t("files_admin_console_title");
  }
  if (elements.filesAdminConsoleModalBtnHint) {
    elements.filesAdminConsoleModalBtnHint.textContent = t("files_admin_tools_console_hint");
  }
  if (elements.filesAccessControlModalBtnText) {
    elements.filesAccessControlModalBtnText.textContent = t("files_admin_requests_title");
  }
  if (elements.filesAccessControlModalBtnHint) {
    elements.filesAccessControlModalBtnHint.textContent = t("files_admin_tools_access_hint");
  }
  if (elements.filesAdminPublicSharesModalBtnText) {
    elements.filesAdminPublicSharesModalBtnText.textContent = t("files_admin_public_shares_title");
  }
  if (elements.filesAdminPublicSharesModalBtnHint) {
    elements.filesAdminPublicSharesModalBtnHint.textContent = t("files_admin_tools_global_public_shares_hint");
  }
  if (elements.filesPublicSharesModalBtnText) {
    elements.filesPublicSharesModalBtnText.textContent = t("files_public_shares_title");
  }
  if (elements.filesPublicSharesModalBtnHint) {
    elements.filesPublicSharesModalBtnHint.textContent = t("files_admin_tools_public_shares_hint");
  }
  if (elements.filesBotAdminModalBtnText) {
    elements.filesBotAdminModalBtnText.textContent = t("files_bot_admin_modal_title");
  }
  if (elements.filesBotAdminFloatingBtnLabel) {
    elements.filesBotAdminFloatingBtnLabel.textContent = t("files_bot_admin_fab_label");
  }
  if (elements.filesBotAdminFloatingBtnHint) {
    elements.filesBotAdminFloatingBtnHint.textContent = t("files_bot_admin_fab_hint");
  }
  if (elements.filesBotAdminFloatingBtn) {
    elements.filesBotAdminFloatingBtn.removeAttribute("title");
    elements.filesBotAdminFloatingBtn.setAttribute("aria-label", t("files_bot_admin_modal_title"));
  }
  if (elements.filesUploadModalCloseBtn) {
    elements.filesUploadModalCloseBtn.textContent = t("files_admin_modal_close");
  }
  if (elements.filesEditModalCloseBtn) {
    elements.filesEditModalCloseBtn.textContent = "X";
    elements.filesEditModalCloseBtn.setAttribute("aria-label", t("files_admin_modal_close"));
    elements.filesEditModalCloseBtn.removeAttribute("title");
  }
  if (elements.filesAdminRequestsModalCloseBtn) {
    elements.filesAdminRequestsModalCloseBtn.textContent = t("files_admin_modal_close");
  }
  if (elements.filesPublicSharesModalCloseBtn) {
    elements.filesPublicSharesModalCloseBtn.textContent = t("files_admin_modal_close");
  }
  if (elements.filesBotAdminModalCloseBtn) {
    elements.filesBotAdminModalCloseBtn.textContent = t("files_admin_modal_close");
  }
  elements.filesUploadTitle.textContent = t("files_admin_console_title");
  if (elements.filesEditTitle) {
    elements.filesEditTitle.textContent = t("files_edit_modal_title");
  }
  if (elements.filesEditHint) {
    elements.filesEditHint.textContent = t("files_edit_modal_hint");
  }
  elements.filesAdminRequestsTitle.textContent = t("files_admin_requests_title");
  elements.filesAdminRequestsHint.textContent = t("files_admin_requests_hint");
  if (elements.filesPublicSharesBadge) {
    elements.filesPublicSharesBadge.textContent = t("files_public_shares_badge");
  }
  if (elements.filesPublicSharesTitle) {
    elements.filesPublicSharesTitle.textContent = t("files_public_shares_title");
  }
  if (elements.filesPublicSharesHint) {
    elements.filesPublicSharesHint.textContent = t("files_public_shares_hint");
  }
  if (elements.filesPublicSharesConsoleLabel) {
    elements.filesPublicSharesConsoleLabel.textContent = t("files_public_shares_console_label");
  }
  if (elements.filesPublicSharesConsoleHint) {
    elements.filesPublicSharesConsoleHint.textContent = t("files_public_shares_console_hint");
  }
  if (elements.filesAdminRequestsConsoleLabel) {
    elements.filesAdminRequestsConsoleLabel.textContent = t("files_admin_requests_console_label");
  }
  if (elements.filesAdminRequestsConsoleHint) {
    elements.filesAdminRequestsConsoleHint.textContent = t("files_admin_requests_console_hint");
  }
  if (elements.filesAdminRequestsRegistryLabel) {
    elements.filesAdminRequestsRegistryLabel.textContent = t("files_admin_requests_registry_label");
  }
  if (elements.filesAdminRequestsRegistryHint) {
    elements.filesAdminRequestsRegistryHint.textContent = t("files_admin_requests_registry_hint");
  }
  if (elements.filesBotAdminBadge) {
    elements.filesBotAdminBadge.textContent = t("files_bot_admin_modal_badge");
  }
  if (elements.filesBotAdminTitle) {
    elements.filesBotAdminTitle.textContent = t("files_bot_admin_modal_title");
  }
  if (elements.filesBotAdminHint) {
    elements.filesBotAdminHint.textContent = t("files_bot_admin_modal_hint");
  }
  if (elements.filesBotAdminStatusLabel) {
    elements.filesBotAdminStatusLabel.textContent = t("files_bot_admin_summary_status");
  }
  if (elements.filesBotAdminServersLabel) {
    elements.filesBotAdminServersLabel.textContent = t("files_bot_admin_summary_servers");
  }
  if (elements.filesBotAdminUsersLabel) {
    elements.filesBotAdminUsersLabel.textContent = t("files_bot_admin_summary_users");
  }
  if (elements.filesBotAdminChannelsLabel) {
    elements.filesBotAdminChannelsLabel.textContent = t("files_bot_admin_summary_channels");
  }
  if (elements.filesBotAdminOrphansLabel) {
    elements.filesBotAdminOrphansLabel.textContent = t("files_bot_admin_summary_orphans");
  }
  if (elements.filesBotAdminDiagnosticsBtn) {
    elements.filesBotAdminDiagnosticsBtn.textContent = t("files_bot_admin_diagnostics_button");
  }
  if (elements.filesBotAdminDiagnosticsModalBadge) {
    elements.filesBotAdminDiagnosticsModalBadge.textContent = t("files_bot_admin_diagnostics_modal_badge");
  }
  if (elements.filesBotAdminDiagnosticsModalTitle) {
    elements.filesBotAdminDiagnosticsModalTitle.textContent = t("files_bot_admin_diagnostics_title");
  }
  if (elements.filesBotAdminDiagnosticsModalHint) {
    elements.filesBotAdminDiagnosticsModalHint.textContent = t("files_bot_admin_diagnostics_modal_hint");
  }
  if (elements.filesBotAdminDiagnosticsModalCloseBtn) {
    elements.filesBotAdminDiagnosticsModalCloseBtn.textContent = t("files_bot_admin_diagnostics_modal_close");
  }
  if (elements.filesBotAdminServerModalBadge) {
    elements.filesBotAdminServerModalBadge.textContent = t("files_bot_admin_server_modal_badge");
  }
  if (elements.filesBotAdminServerModalHint) {
    elements.filesBotAdminServerModalHint.textContent = t("files_bot_admin_server_modal_hint");
  }
  if (elements.filesBotAdminServerModalCloseBtn) {
    elements.filesBotAdminServerModalCloseBtn.textContent = t("files_admin_modal_close");
  }
  if (elements.filesBotAdminSearchLabel) {
    elements.filesBotAdminSearchLabel.textContent = t("files_bot_admin_search_label");
  }
  if (elements.filesBotAdminSearchInput) {
    elements.filesBotAdminSearchInput.placeholder = t("files_bot_admin_search_placeholder");
  }
  if (elements.filesBotAdminSortLabel) {
    elements.filesBotAdminSortLabel.textContent = t("files_bot_admin_sort_label");
  }
  if (elements.filesBotAdminSortMembers) {
    elements.filesBotAdminSortMembers.textContent = t("files_bot_admin_sort_members");
  }
  if (elements.filesBotAdminSortSubscriptions) {
    elements.filesBotAdminSortSubscriptions.textContent = t("files_bot_admin_sort_subscriptions");
  }
  if (elements.filesBotAdminSortName) {
    elements.filesBotAdminSortName.textContent = t("files_bot_admin_sort_name");
  }
  if (elements.filesBotAdminSortSelect?.options?.length >= 3) {
    elements.filesBotAdminSortSelect.options[0].textContent = t("files_bot_admin_sort_members");
    elements.filesBotAdminSortSelect.options[1].textContent = t("files_bot_admin_sort_subscriptions");
    elements.filesBotAdminSortSelect.options[2].textContent = t("files_bot_admin_sort_name");
  }
  syncFilesBotAdminSortMenu();
  if (elements.filesBotAdminFilterLabel) {
    elements.filesBotAdminFilterLabel.textContent = t("files_bot_admin_filter_label");
  }
  if (elements.filesBotAdminFilterAll) {
    elements.filesBotAdminFilterAll.textContent = t("files_bot_admin_filter_all");
  }
  if (elements.filesBotAdminFilterSubscribed) {
    elements.filesBotAdminFilterSubscribed.textContent = t("files_bot_admin_filter_subscribed");
  }
  if (elements.filesBotAdminFilterEmpty) {
    elements.filesBotAdminFilterEmpty.textContent = t("files_bot_admin_filter_empty");
  }
  elements.filesAdminRequestsSearchLabel.textContent = t("files_admin_requests_search_label");
  elements.filesAdminRequestsSearchInput.placeholder = t("files_admin_requests_search_placeholder");
  elements.filesAdminRequestsFilterLabel.textContent = t("files_admin_requests_filter_label");
  elements.filesAdminRequestsFilterPending.textContent = t("files_admin_requests_filter_pending");
  elements.filesAdminRequestsFilterApproved.textContent = t("files_admin_requests_filter_approved");
  elements.filesAdminRequestsFilterDeclined.textContent = t("files_admin_requests_filter_declined");
  elements.filesAdminRequestsFilterAuthorized.textContent = t("files_admin_requests_filter_authorized");
  elements.filesAdminRequestsFilterAll.textContent = t("files_admin_requests_filter_all");
  if (elements.filesAdminRequestsFilter?.options?.length >= 5) {
    elements.filesAdminRequestsFilter.options[0].textContent = t("files_admin_requests_filter_pending");
    elements.filesAdminRequestsFilter.options[1].textContent = t("files_admin_requests_filter_approved");
    elements.filesAdminRequestsFilter.options[2].textContent = t("files_admin_requests_filter_declined");
    elements.filesAdminRequestsFilter.options[3].textContent = t("files_admin_requests_filter_authorized");
    elements.filesAdminRequestsFilter.options[4].textContent = t("files_admin_requests_filter_all");
  }
  syncFilesAdminRequestsFilterMenu();
  elements.filesAdminRequestsRefreshBtn.textContent = t("files_admin_requests_refresh_button");
  if (elements.filesPublicSharesRefreshBtn) {
    elements.filesPublicSharesRefreshBtn.textContent = t("files_public_shares_refresh_button");
  }
  renderFilesPublicSharesPanel();
  renderFilesBotAdminPanel();
  elements.filesBrowserTitle.textContent = t("files_file_index_title");
  elements.filesSearchLabel.textContent = t("files_search_label");
  elements.filesSearchInput.placeholder = t("files_search_placeholder");
  elements.filesSearchHint.textContent = t("files_search_hint");
  if (elements.filesGroupManagerToggleText) {
    const managerTextKey = state.files.groupManager.open
      ? "files_group_manager_toggle_close"
      : "files_group_manager_toggle_open";
    elements.filesGroupManagerToggleText.textContent = t(managerTextKey);
  }
  elements.filesUploadFileLabel.textContent = t("files_upload_file_label");
  if (elements.filesUploadAssetsLabel) {
    elements.filesUploadAssetsLabel.textContent = t("files_upload_assets_label");
  }
  if (elements.filesUploadAssetsHint) {
    elements.filesUploadAssetsHint.textContent = t("files_upload_assets_hint");
  }
  if (elements.filesUploadDossierLabel) {
    elements.filesUploadDossierLabel.textContent = t("files_upload_dossier_label");
  }
  if (elements.filesUploadDossierHint) {
    elements.filesUploadDossierHint.textContent = t("files_upload_dossier_hint");
  }
  if (elements.filesUploadImageLabel) {
    elements.filesUploadImageLabel.textContent = t("files_upload_image_label");
  }
  if (elements.filesUploadGroupLabel) {
    elements.filesUploadGroupLabel.textContent = t("files_upload_group_label");
  }
  elements.filesUploadDescLabel.textContent = t("files_upload_description_label");
  elements.filesUploadBtn.textContent = t("files_upload_button");
  if (elements.filesGroupInput) {
    elements.filesGroupInput.placeholder = t("files_upload_group_placeholder");
  }
  syncFilesGroupSuggestions();
  elements.filesDescriptionInput.placeholder = t("files_upload_description_placeholder");
  if (elements.filesUploadOutdatedLabel) {
    elements.filesUploadOutdatedLabel.textContent = t("files_upload_outdated_label");
  }
  if (elements.filesUploadUntestedLabel) {
    elements.filesUploadUntestedLabel.textContent = t("files_upload_untested_label");
  }
  if (elements.filesUploadCautionLabel) {
    elements.filesUploadCautionLabel.textContent = t("files_upload_caution_label");
  }
  refreshFilesDescriptionEditors();
  elements.filesEmptyState.textContent = t("files_empty_state");
  elements.filesDeleteTitle.textContent = t("files_delete_modal_title");
  elements.filesDeleteMessage.textContent = t("files_delete_modal_body", { name: t("files_unknown_value") });
  elements.filesDeleteCancelBtn.textContent = t("files_delete_modal_cancel");
  elements.filesDeleteConfirmBtn.textContent = t("files_delete_modal_confirm");
  if (elements.filesGroupRenameTitle) {
    elements.filesGroupRenameTitle.textContent = t("files_group_rename_modal_title");
  }
  if (elements.filesGroupRenameMessage) {
    elements.filesGroupRenameMessage.textContent = t("files_group_rename_modal_body", { group: t("files_group_default") });
  }
  if (elements.filesGroupRenameLabel) {
    elements.filesGroupRenameLabel.textContent = t("files_group_rename_modal_label");
  }
  if (elements.filesGroupRenameInput) {
    elements.filesGroupRenameInput.placeholder = t("files_group_rename_modal_placeholder");
  }
  if (elements.filesGroupRenameCancelBtn) {
    elements.filesGroupRenameCancelBtn.textContent = t("files_group_rename_modal_cancel");
  }
  if (elements.filesGroupRenameConfirmBtn) {
    elements.filesGroupRenameConfirmBtn.textContent = t("files_group_rename_modal_confirm");
  }
  if (elements.filesDisclaimerBtnText) {
    elements.filesDisclaimerBtnText.textContent = t("files_disclaimer_button");
  }
  if (elements.filesDisclaimerTitle) {
    elements.filesDisclaimerTitle.textContent = t("files_disclaimer_modal_title");
  }
  if (elements.filesDisclaimerBody1) {
    elements.filesDisclaimerBody1.textContent = t("files_disclaimer_modal_body_1");
  }
  if (elements.filesDisclaimerBody2) {
    elements.filesDisclaimerBody2.textContent = t("files_disclaimer_modal_body_2");
  }
  if (elements.filesDisclaimerCloseBtn) {
    elements.filesDisclaimerCloseBtn.textContent = t("files_disclaimer_modal_close");
  }

  if (elements.minervaAwaiting) {
    elements.minervaAwaiting.textContent = t("minerva_awaiting");
  }

  elements.footerText.textContent = t("footer_text");
  renderVisitCounter();

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
  if (state.classifiedDetail.open && state.classifiedDetail.item) {
    void openClassifiedInlineDetail(state.classifiedDetail.item);
  } else {
    renderClassifiedInlineDetail();
  }
  renderFilesAccessView();
  setFilesSearchOpen(state.files.search.open);
  renderFilesDeleteModal();
  renderFilesAdminModals();
  renderFilesGroupRenameModal();
  renderFilesCautionModal();
  renderFilesDisclaimerModal();
  if (document.body.classList.contains("is-classified")) {
    elements.mainTitle.textContent = t("classified_main_title");
  } else if (document.body.classList.contains("is-drops")) {
    elements.mainTitle.textContent = t("drops_main_title");
  } else if (document.body.classList.contains("is-files")) {
    elements.mainTitle.textContent = t("files_main_title");
  } else {
    elements.mainTitle.textContent = t("main_title");
  }

  syncTopTabForCurrentView();
  renderDropsDeleteModal();
  renderDropsUploadTelemetry();

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
    ? { pre: 20, bloom: 70, step: 90, ready: 110, post: 80, fade: 160, type: 0 }
    : { pre: 90, bloom: 180, step: 150, ready: 260, post: 240, fade: 380, type: 8 };

  const bootSteps = [
    { text: elements.bootLine1?.textContent || t("boot_line_1"), progress: 32 },
    { text: elements.bootLine2?.textContent || t("boot_line_2"), progress: 62 },
    { text: elements.bootLine3?.textContent || t("boot_line_3"), progress: 88 },
    { text: elements.bootReady?.textContent || t("boot_ready"), progress: 100, ready: true }
  ];

  if (elements.bootLog) {
    elements.bootLog.replaceChildren();
    elements.bootLog.scrollTop = 0;
  }
  if (elements.bootBar) {
    elements.bootBar.style.width = "0%";
  }
  if (elements.bootPercent) {
    elements.bootPercent.textContent = "0%";
  }
  if (elements.bootHint) {
    elements.bootHint.textContent = t("boot_hint_initializing");
  }

  await sleep(timing.pre);
  elements.bootOverlay.classList.add("is-blooming");
  await sleep(timing.bloom);
  elements.bootOverlay.classList.add("is-boot-running");

  const setBootProgress = (value) => {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    if (elements.bootBar) {
      elements.bootBar.style.width = `${clamped}%`;
    }
    if (elements.bootPercent) {
      elements.bootPercent.textContent = `${clamped}%`;
    }
  };

  let bootProgressShown = 0;
  for (const step of bootSteps) {
    if (elements.bootHint) {
      elements.bootHint.textContent = step.text;
    }

    if (elements.bootLog) {
      const line = document.createElement("div");
      line.className = `boot-log-line is-typing${step.ready ? " is-ready" : ""}`;
      const text = document.createElement("span");
      text.className = "boot-log-text";
      text.setAttribute("aria-hidden", "true");
      const srText = document.createElement("span");
      srText.className = "boot-sr";
      srText.textContent = step.text;
      const leader = document.createElement("span");
      leader.className = "boot-log-leader";
      const status = document.createElement("span");
      status.className = "boot-log-status";
      status.textContent = step.ready ? "READY" : "OK";
      line.append(text, srText, leader, status);
      elements.bootLog.appendChild(line);

      if (timing.type > 0) {
        for (let i = 1; i <= step.text.length; i += 1) {
          text.textContent = step.text.slice(0, i);
          setBootProgress(bootProgressShown + ((step.progress - bootProgressShown) * i) / step.text.length);
          await sleep(timing.type);
        }
      } else {
        text.textContent = step.text;
        setBootProgress(step.progress);
      }

      line.classList.remove("is-typing");
      line.classList.add("is-done");
    } else {
      setBootProgress(step.progress);
    }

    bootProgressShown = step.progress;
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
  const hackInteractiveRoot = elements.hackOverlay?.querySelector(".hack-core") || null;
  const intelBotInviteRoot = elements.intelBotInviteCore || null;
  const intelEmailRoot = elements.intelEmailForm || null;
  const classifiedPlayersModalRoot = elements.classifiedPlayersCore || null;
  const classifiedIntelModalRoot = elements.classifiedIntelCore || null;
  const filesBotAdminLeaveModalRoot = elements.filesBotAdminLeaveOverlay?.querySelector(".files-bot-admin-leave-core") || null;
  const filesBotAdminDiagnosticsModalRoot = elements.filesBotAdminDiagnosticsOverlay?.querySelector(".files-bot-admin-diagnostics-core") || null;
  const filesBotAdminServerModalRoot = elements.filesBotAdminServerOverlay?.querySelector(".files-bot-admin-server-core") || null;
  const filesGroupRenameModalRoot = elements.filesGroupRenameOverlay?.querySelector(".files-group-rename-core") || null;
  const filesCautionModalRoot = elements.filesCautionOverlay?.querySelector(".files-caution-core") || null;
  const filesShareModalRoot = elements.filesShareOverlay?.querySelector(".files-share-core") || null;
  const filesDisclaimerModalRoot = elements.filesDisclaimerOverlay?.querySelector(".files-disclaimer-core") || null;
  const filesUploadModalRoot = elements.filesUploadOverlay?.querySelector(".files-admin-modal-core") || null;
  const filesEditModalRoot = elements.filesEditOverlay?.querySelector(".files-admin-modal-core") || null;
  const filesAdminRequestsModalRoot = elements.filesAdminRequestsOverlay?.querySelector(".files-admin-modal-core") || null;
  const filesPublicSharesModalRoot = elements.filesPublicSharesOverlay?.querySelector(".files-admin-modal-core") || null;
  const filesBotAdminModalRoot = elements.filesBotAdminOverlay?.querySelector(".files-admin-modal-core") || null;
  const shouldBlockBackgroundForActiveOverlay = (target) => {
    if (document.body.classList.contains("is-syncing") && elements.syncOverlay?.classList.contains("is-active")) {
      return true;
    }
    if (document.body.classList.contains("is-classified-loading") && elements.classifiedLoadOverlay?.classList.contains("is-active")) {
      return true;
    }
    if (elements.classifiedPlayersOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(classifiedPlayersModalRoot instanceof Node)) {
        return true;
      }
      return !classifiedPlayersModalRoot.contains(target);
    }
    if (elements.classifiedIntelOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(classifiedIntelModalRoot instanceof Node)) {
        return true;
      }
      return !classifiedIntelModalRoot.contains(target);
    }
    if (elements.intelBotInviteOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(intelBotInviteRoot instanceof Node)) {
        return true;
      }
      return !intelBotInviteRoot.contains(target);
    }
    if (elements.intelEmailOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(intelEmailRoot instanceof Node)) {
        return true;
      }
      return !intelEmailRoot.contains(target);
    }
    if (elements.filesBotAdminLeaveOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(filesBotAdminLeaveModalRoot instanceof Node)) {
        return true;
      }
      return !filesBotAdminLeaveModalRoot.contains(target);
    }
    if (elements.filesBotAdminDiagnosticsOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(filesBotAdminDiagnosticsModalRoot instanceof Node)) {
        return true;
      }
      return !filesBotAdminDiagnosticsModalRoot.contains(target);
    }
    if (elements.filesBotAdminServerOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(filesBotAdminServerModalRoot instanceof Node)) {
        return true;
      }
      return !filesBotAdminServerModalRoot.contains(target);
    }
    if (elements.filesGroupRenameOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(filesGroupRenameModalRoot instanceof Node)) {
        return true;
      }
      return !filesGroupRenameModalRoot.contains(target);
    }
    if (elements.filesCautionOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(filesCautionModalRoot instanceof Node)) {
        return true;
      }
      return !filesCautionModalRoot.contains(target);
    }
    if (elements.filesShareOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(filesShareModalRoot instanceof Node)) {
        return true;
      }
      return !filesShareModalRoot.contains(target);
    }
    if (elements.filesDisclaimerOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(filesDisclaimerModalRoot instanceof Node)) {
        return true;
      }
      return !filesDisclaimerModalRoot.contains(target);
    }
    if (elements.filesUploadOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(filesUploadModalRoot instanceof Node)) {
        return true;
      }
      return !filesUploadModalRoot.contains(target);
    }
    if (elements.filesEditOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(filesEditModalRoot instanceof Node)) {
        return true;
      }
      return !filesEditModalRoot.contains(target);
    }
    if (elements.filesAdminRequestsOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(filesAdminRequestsModalRoot instanceof Node)) {
        return true;
      }
      return !filesAdminRequestsModalRoot.contains(target);
    }
    if (elements.filesPublicSharesOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(filesPublicSharesModalRoot instanceof Node)) {
        return true;
      }
      return !filesPublicSharesModalRoot.contains(target);
    }
    if (elements.filesBotAdminOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node) || !(filesBotAdminModalRoot instanceof Node)) {
        return true;
      }
      return !filesBotAdminModalRoot.contains(target);
    }
    if (elements.siloDossierOverlay?.classList.contains("is-active")) {
      if (!(target instanceof Node)) {
        return true;
      }
      return target !== elements.siloDossierOverlay && !elements.siloDossierOverlay.contains(target);
    }
    if (!document.body.classList.contains("is-hacking")) {
      return false;
    }
    if (!elements.hackOverlay?.classList.contains("is-active")) {
      return false;
    }
    if (!(target instanceof Node) || !hackInteractiveRoot) {
      return true;
    }
    return !hackInteractiveRoot.contains(target);
  };
  const blockBackgroundForActiveOverlay = (event) => {
    if (!shouldBlockBackgroundForActiveOverlay(event.target)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

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
  elements.dropsLangSelect?.addEventListener("change", () => {
    syncDropsLangMenu();
  });
  elements.dropsLangToggleBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = elements.dropsLangDropdown?.classList.contains("is-open");
    setLanguageMenuOpen(false);
    setDropsLangMenuOpen(!isOpen);
  });
  elements.dropsLangOptions?.forEach((option) => {
    option.addEventListener("click", () => {
      const targetLang = option.dataset.dropsLang === "es" ? "es" : "en";
      if (elements.dropsLangSelect) {
        elements.dropsLangSelect.value = targetLang;
        elements.dropsLangSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
      setDropsLangMenuOpen(false);
    });
  });
  syncDropsLangMenu();
  setDropsLangMenuOpen(false);
  elements.dropsDeleteCancelBtn?.addEventListener("click", () => {
    closeDropsDeleteModal();
  });
  elements.dropsDeleteConfirmBtn?.addEventListener("click", () => {
    void confirmDropsDeleteModal();
  });
  elements.dropsDeleteOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.dropsDeleteOverlay) {
      closeDropsDeleteModal();
    }
  });
  elements.discordBotInviteBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    openIntelBotInviteModal();
  });
  elements.intelBotInviteCancelBtn?.addEventListener("click", () => {
    closeIntelBotInviteModal();
  });
  elements.intelBotInviteConfirmBtn?.addEventListener("click", () => {
    closeIntelBotInviteModal();
  });
  elements.intelBotInviteOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.intelBotInviteOverlay) {
      closeIntelBotInviteModal();
    }
  });
  elements.siloEmailBtn?.addEventListener("click", () => {
    openIntelEmailModal("silo", elements.siloEmailBtn);
  });
  elements.minervaEmailBtn?.addEventListener("click", () => {
    openIntelEmailModal("minerva", elements.minervaEmailBtn);
  });
  elements.intelEmailForm?.addEventListener("submit", (event) => {
    void submitIntelEmailSubscription(event);
  });
  elements.intelEmailInput?.addEventListener("input", () => {
    elements.intelEmailInput?.classList.remove("is-invalid");
    if (state.intelEmail.messageKind === "error") {
      setIntelEmailFeedback("", "");
    }
  });
  elements.intelEmailCancelBtn?.addEventListener("click", () => {
    closeIntelEmailModal();
  });
  elements.intelEmailLoginBtn?.addEventListener("click", () => {
    loginForIntelEmailSubscription();
  });
  elements.intelEmailUnsubscribeBtn?.addEventListener("click", () => {
    void unsubscribeIntelEmailSubscription();
  });
  elements.intelEmailTestConfirmationBtn?.addEventListener("click", () => {
    void sendIntelEmailAdminTest("confirmation");
  });
  elements.intelEmailTestIntelBtn?.addEventListener("click", () => {
    void sendIntelEmailAdminTest("intel");
  });
  elements.intelEmailAdminSubscribersBtn?.addEventListener("click", () => {
    toggleIntelEmailAdminSubscribers();
  });
  elements.intelEmailAdminSubscribersList?.addEventListener("click", (event) => {
    const button = event.target instanceof Element
      ? event.target.closest("[data-subscription-id][data-feed]")
      : null;
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }
    void removeIntelEmailAdminSubscription(button.dataset.subscriptionId || "", button.dataset.feed || "");
  });
  elements.intelEmailCloseIconBtn?.addEventListener("click", () => {
    closeIntelEmailModal();
  });
  elements.intelEmailOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.intelEmailOverlay) {
      closeIntelEmailModal();
    }
  });
  elements.classifiedPlayersBtn?.addEventListener("click", () => {
    void openClassifiedPlayerCountsModal();
  });
  elements.classifiedPlayersRefreshBtn?.addEventListener("click", () => {
    void fetchClassifiedPlayerCounts({ force: true });
  });
  elements.classifiedPlayersRangeButtons?.forEach((button) => {
    button.addEventListener("click", () => {
      state.classifiedPlayers.range = normalizeClassifiedPlayerRange(button.dataset.playerRange || "");
      renderClassifiedPlayerCountsModal();
    });
  });
  elements.classifiedPlayersChartFrame?.addEventListener("mousemove", (event) => {
    updateClassifiedPlayerChartHover(event.clientX);
  });
  elements.classifiedPlayersChartFrame?.addEventListener("mouseleave", () => {
    hideClassifiedPlayerChartHover();
  });
  elements.classifiedPlayersCloseBtn?.addEventListener("click", () => {
    closeClassifiedPlayerCountsModal();
  });
  elements.classifiedPlayersOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.classifiedPlayersOverlay) {
      closeClassifiedPlayerCountsModal();
    }
  });
  elements.classifiedIntelButtons?.forEach((button) => {
    button.addEventListener("click", () => {
      void openClassifiedNukaIntelModal(button.dataset.classifiedIntel || "dailyOps");
    });
  });
  elements.classifiedIntelRefreshBtn?.addEventListener("click", () => {
    void fetchClassifiedNukaIntel({
      force: true,
      silent: hasClassifiedNukaIntelForPanel(state.classifiedNukaIntel.data, state.classifiedNukaIntel.activeKey)
    });
  });
  elements.classifiedIntelCloseBtn?.addEventListener("click", () => {
    closeClassifiedNukaIntelModal();
  });
  elements.classifiedIntelCloseIconBtn?.addEventListener("click", () => {
    closeClassifiedNukaIntelModal();
  });
  elements.classifiedIntelOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.classifiedIntelOverlay) {
      closeClassifiedNukaIntelModal();
    }
  });
  elements.classifiedAxolotlBtn?.addEventListener("click", () => {
    openClassifiedAxolotlModal();
  });
  elements.classifiedAxolotlCloseBtn?.addEventListener("click", () => {
    closeClassifiedAxolotlModal();
  });
  elements.classifiedAxolotlCloseIconBtn?.addEventListener("click", () => {
    closeClassifiedAxolotlModal();
  });
  elements.classifiedAxolotlOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.classifiedAxolotlOverlay) {
      closeClassifiedAxolotlModal();
    }
  });
  elements.siloDossierCloseBtn?.addEventListener("click", () => {
    hideSiloDossier({ updateHash: true });
  });
  elements.siloDossierBackBtn?.addEventListener("click", () => {
    hideSiloDossier({ updateHash: true });
  });
  elements.siloDossierOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.siloDossierOverlay) {
      hideSiloDossier({ updateHash: true });
    }
  });
  elements.minervaLocationCardBtn?.addEventListener("click", openMinervaLocationView);
  elements.minervaLocationBackBtn?.addEventListener("click", closeMinervaLocationView);
  elements.minervaLocationMapPrevBtn?.addEventListener("click", () => {
    cycleMinervaLocationSlide(-1);
  });
  elements.minervaLocationMapNextBtn?.addEventListener("click", () => {
    cycleMinervaLocationSlide(1);
  });
  if (elements.tabStatus) {
    elements.tabStatus.classList.add("secret-trigger");
    elements.tabStatus.addEventListener("click", () => {
      showFilesPage({ updateHash: true });
    });
  }
  if (elements.tabIntel) {
    elements.tabIntel.classList.add("secret-trigger");
    elements.tabIntel.addEventListener("click", () => {
      showIntelPage({ updateHash: true });
    });
  }
  if (elements.tabDrops) {
    elements.tabDrops.classList.add("secret-trigger");
    elements.tabDrops.addEventListener("click", () => {
      showDropsPage({ updateHash: true });
    });
  }
  if (elements.tabData) {
    elements.tabData.classList.add("secret-trigger");
    elements.tabData.addEventListener("click", handleSecretTriggerTap);
  }
  elements.filesLoginForm?.addEventListener("submit", (event) => {
    if (!openDiscordLoginPopup()) {
      return;
    }
    event.preventDefault();
  });
  elements.filesLogoutBtn?.addEventListener("click", () => {
    void handleFilesLogout();
  });
  elements.filesSessionLogoutBtn?.addEventListener("click", () => {
    void handleFilesLogout();
  });
  elements.filesRestrictedLogoutBtn?.addEventListener("click", () => {
    void handleFilesLogout();
  });
  elements.filesDeniedLogoutBtn?.addEventListener("click", () => {
    void handleFilesLogout();
  });
  elements.dropsUploadForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    void handleDropsUploadSubmit();
  });
  elements.dropsUploadPickerBtn?.addEventListener("click", () => {
    elements.dropsUploadInput?.click();
  });
  elements.dropsUploadInput?.addEventListener("change", () => {
    syncDropsUploadFileName();
  });
  elements.dropsExpiryModeHoursBtn?.addEventListener("click", () => {
    setDropsExpiryMode("hours");
  });
  elements.dropsExpiryModeDateBtn?.addEventListener("click", () => {
    setDropsExpiryMode("datetime");
  });
  elements.dropsExpiresHoursInput?.addEventListener("focus", () => {
    if (state.drops.expiryMode !== "hours") {
      setDropsExpiryMode("hours");
    }
  });
  elements.dropsExpiresAtInput?.addEventListener("focus", () => {
    if (state.drops.expiryMode !== "datetime") {
      setDropsExpiryMode("datetime");
    }
  });
  elements.dropsExpiresAtInput?.addEventListener("input", () => {
    if (state.drops.expiryMode !== "datetime") {
      setDropsExpiryMode("datetime");
    }
  });
  initDropsDatetimePicker();
  elements.dropsRefreshBtn?.addEventListener("click", () => {
    void refreshDrops();
  });
  elements.dropsList?.addEventListener("click", (event) => {
    void handleDropsListClick(event);
  });
  elements.filesRestrictedRetryBtn?.addEventListener("click", () => {
    void handleFilesAccessRequest();
  });
  elements.filesDisclaimerAgreeBtn?.addEventListener("click", () => {
    void submitFilesDisclaimerDecision("accepted");
  });
  elements.filesDisclaimerDeclineBtn?.addEventListener("click", () => {
    void submitFilesDisclaimerDecision("declined");
  });
  elements.filesDisclaimerContactBtn?.addEventListener("click", () => {
    openFilesDisclaimerContactView();
  });
  elements.filesDisclaimerContactCancelBtn?.addEventListener("click", () => {
    closeFilesDisclaimerContactView({ clearText: false });
  });
  elements.filesDisclaimerContactSendBtn?.addEventListener("click", () => {
    void submitFilesDisclaimerReevaluation();
  });
  elements.filesDisclaimerContactInput?.addEventListener("input", () => {
    state.files.disclaimerGate.contactText = String(elements.filesDisclaimerContactInput?.value || "");
    if (elements.filesDisclaimerContactInput) {
      elements.filesDisclaimerContactInput.classList.remove("is-invalid");
    }
    if (state.files.disclaimerGate.messageKind === "error" && state.files.disclaimerGate.message) {
      const required = t("files_disclaimer_gate_contact_required");
      const tooLong = t("files_disclaimer_gate_contact_too_long");
      if (state.files.disclaimerGate.message === required || state.files.disclaimerGate.message === tooLong) {
        setFilesDisclaimerGateFeedback("", "");
        renderFilesAccessView();
      }
    }
  });
  elements.filesRestrictedReasonInput?.addEventListener("input", () => {
    const value = String(elements.filesRestrictedReasonInput.value || "").trim();
    if (value) {
      elements.filesRestrictedReasonInput.classList.remove("is-invalid");
      if (state.files.accessRequestMessageKind === "error") {
        const reasonRequired = t("files_restricted_reason_required");
        const reasonTooLong = t("files_restricted_reason_too_long");
        if (state.files.accessRequestMessage === reasonRequired || state.files.accessRequestMessage === reasonTooLong) {
          setFilesRestrictedRequestFeedback("", "");
          renderFilesAccessView();
        }
      }
    }
  });
  elements.filesUploadForm?.addEventListener("submit", (event) => {
    void handleFilesUpload(event);
  });
  elements.filesGroupRenameInput?.addEventListener("input", () => {
    state.files.groupRename.value = String(elements.filesGroupRenameInput?.value || "");
    if (state.files.groupRename.messageKind === "error" && state.files.groupRename.message) {
      setFilesGroupRenameFeedback("", "");
      renderFilesGroupRenameModal();
    }
  });
  elements.filesGroupRenameForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    void handleFilesRenameGroupSubmit();
  });
  elements.filesGroupRenameCancelBtn?.addEventListener("click", () => {
    closeFilesGroupRenameModal();
  });
  elements.filesGroupRenameOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.filesGroupRenameOverlay) {
      closeFilesGroupRenameModal();
    }
  });
  elements.filesAdminConsoleModalBtn?.addEventListener("click", () => {
    const isOpen = normalizeFilesAdminModalType(state.files.adminModal.active) === "upload";
    setFilesAdminModalOpen(isOpen ? "" : "upload");
  });
  elements.filesAccessControlModalBtn?.addEventListener("click", () => {
    const isOpen = normalizeFilesAdminModalType(state.files.adminModal.active) === "requests";
    setFilesAdminModalOpen(isOpen ? "" : "requests");
  });
  elements.filesPublicSharesModalBtn?.addEventListener("click", () => {
    const isOpen = normalizeFilesAdminModalType(state.files.adminModal.active) === "publicShares"
      && normalizeFilesPublicSharesMode(state.files.publicShares.mode) === "mine";
    setFilesAdminModalOpen(isOpen ? "" : "publicShares", { publicSharesMode: "mine" });
  });
  elements.filesAdminPublicSharesModalBtn?.addEventListener("click", () => {
    const isOpen = normalizeFilesAdminModalType(state.files.adminModal.active) === "publicShares"
      && normalizeFilesPublicSharesMode(state.files.publicShares.mode) === "admin";
    setFilesAdminModalOpen(isOpen ? "" : "publicShares", { publicSharesMode: "admin" });
  });
  elements.filesBotAdminModalBtn?.addEventListener("click", () => {
    const isOpen = normalizeFilesAdminModalType(state.files.adminModal.active) === "bot";
    setFilesAdminModalOpen(isOpen ? "" : "bot");
  });
  elements.filesBotAdminFloatingBtn?.addEventListener("click", () => {
    const isOpen = normalizeFilesAdminModalType(state.files.adminModal.active) === "bot";
    setFilesAdminModalOpen(isOpen ? "" : "bot");
  });
  elements.filesUploadModalCloseBtn?.addEventListener("click", () => {
    closeFilesAdminModal();
  });
  elements.filesEditModalCloseBtn?.addEventListener("click", () => {
    closeFilesAdminModal();
  });
  elements.filesFunctionsModalCloseBtn?.addEventListener("click", () => {
    closeFilesFunctionsModal();
  });
  elements.filesFunctionsOverlay?.addEventListener("click", (e) => {
    if (e.target === elements.filesFunctionsOverlay) {
      closeFilesFunctionsModal();
    }
  });
  elements.filesAdminRequestsModalCloseBtn?.addEventListener("click", () => {
    closeFilesAdminModal();
  });
  elements.filesPublicSharesModalCloseBtn?.addEventListener("click", () => {
    closeFilesAdminModal();
  });
  elements.filesBotAdminModalCloseBtn?.addEventListener("click", () => {
    closeFilesAdminModal();
  });
  elements.filesDisclaimerBtn?.addEventListener("click", () => {
    if (state.files.disclaimerModal.open) {
      closeFilesDisclaimerModal();
      return;
    }
    openFilesDisclaimerModal();
  });
  elements.filesDisclaimerCloseBtn?.addEventListener("click", () => {
    closeFilesDisclaimerModal();
  });
  elements.filesDisclaimerOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.filesDisclaimerOverlay) {
      if (isDesktopModalViewport()) {
        return;
      }
      closeFilesDisclaimerModal();
    }
  });
  elements.filesUploadOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.filesUploadOverlay) {
      if (isDesktopModalViewport()) {
        return;
      }
      closeFilesAdminModal();
    }
  });
  elements.filesEditOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.filesEditOverlay) {
      if (isDesktopModalViewport()) {
        return;
      }
      closeFilesAdminModal();
    }
  });
  elements.filesAdminRequestsOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.filesAdminRequestsOverlay) {
      if (isDesktopModalViewport()) {
        return;
      }
      closeFilesAdminModal();
    }
  });
  elements.filesPublicSharesOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.filesPublicSharesOverlay) {
      if (isDesktopModalViewport()) {
        return;
      }
      closeFilesAdminModal();
    }
  });
  elements.filesBotAdminOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.filesBotAdminOverlay) {
      if (isDesktopModalViewport()) {
        return;
      }
      closeFilesAdminModal();
    }
  });
  elements.filesAdminRequestsSearchInput?.addEventListener("input", () => {
    state.files.adminRequests.query = String(elements.filesAdminRequestsSearchInput.value || "");
    renderFilesAdminRequestsPanel();
  });
  elements.filesBotAdminSearchInput?.addEventListener("input", () => {
    state.files.botAdmin.query = String(elements.filesBotAdminSearchInput.value || "");
    renderFilesBotAdminPanel();
  });
  elements.filesBotAdminSortBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = elements.filesBotAdminSortDropdown?.classList.contains("is-open");
    setFilesBotAdminSortMenuOpen(!isOpen);
  });
  elements.filesBotAdminSortOptions?.forEach((option) => {
    option.addEventListener("click", () => {
      const nextSort = normalizeFilesBotAdminGuildSort(option.dataset.filesBotSort || "members");
      setFilesBotAdminSortValue(nextSort, { render: true, closeMenu: true });
    });
  });
  elements.filesBotAdminSortSelect?.addEventListener("change", () => {
    setFilesBotAdminSortValue(elements.filesBotAdminSortSelect.value, { render: true, closeMenu: false });
  });
  elements.filesBotAdminFilterOptions?.forEach((option) => {
    option.addEventListener("click", () => {
      state.files.botAdmin.filter = normalizeFilesBotAdminGuildFilter(option.dataset.filesBotFilter || "all");
      renderFilesBotAdminPanel();
    });
  });
  elements.filesAdminRequestsFilterBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = elements.filesAdminRequestsFilterDropdown?.classList.contains("is-open");
    setFilesAdminRequestsFilterMenuOpen(!isOpen);
  });
  elements.filesAdminRequestsFilterOptions?.forEach((option) => {
    option.addEventListener("click", () => {
      const nextFilter = normalizeFilesAdminRequestsFilter(option.dataset.filter || "pending");
      setFilesAdminRequestsFilterValue(nextFilter, { render: true, closeMenu: true });
    });
  });
  elements.filesAdminRequestsFilter?.addEventListener("change", () => {
    setFilesAdminRequestsFilterValue(elements.filesAdminRequestsFilter.value, { render: true, closeMenu: false });
  });
  elements.filesAdminRequestsRefreshBtn?.addEventListener("click", () => {
    void refreshFilesAdminRequests();
  });
  elements.filesPublicSharesRefreshBtn?.addEventListener("click", () => {
    void refreshFilesPublicShares();
  });
  elements.filesBotAdminRefreshBtn?.addEventListener("click", () => {
    void refreshFilesBotAdminOverview();
  });
  elements.filesBotAdminSyncBtn?.addEventListener("click", () => {
    const trigger = elements.filesBotAdminSyncBtn;
    if (trigger instanceof HTMLElement) {
      trigger.dataset.filesBotAction = "sync";
      trigger.dataset.actionKey = "sync";
      void handleFilesBotAdminAction(trigger);
      trigger.removeAttribute("data-files-bot-action");
      trigger.removeAttribute("data-action-key");
    }
  });
  elements.filesBotAdminDiagnosticsBtn?.addEventListener("click", () => {
    openFilesBotAdminDiagnosticsModal();
  });
  elements.filesBotAdminServerModalBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const actionTarget = target.closest("[data-files-bot-action]");
    if (actionTarget instanceof HTMLElement) {
      void handleFilesBotAdminAction(actionTarget);
    }
  });
  elements.filesBotAdminInviteLink?.addEventListener("click", (event) => {
    const inviteLink = normalizeFilesBotAdminOverview(state.files.botAdmin.overview)?.inviteLink
      || state.publicConfig.botInviteLink
      || "";
    if (!inviteLink) {
      event.preventDefault();
      setFilesBotAdminFeedback(t("files_bot_admin_invite_unavailable"), "error");
      renderFilesBotAdminPanel();
    }
  });
  elements.filesBotAdminServerList?.addEventListener("click", handleFilesBotAdminServerListClick);
  elements.filesSearchToggleBtn?.addEventListener("click", () => {
    const nextOpen = !state.files.search.open;
    setFilesSearchOpen(nextOpen, { focusInput: nextOpen, clearQuery: !nextOpen });
  });
  elements.filesGroupManagerToggleBtn?.addEventListener("click", () => {
    const nextOpen = !state.files.groupManager.open;
    setFilesGroupManagerOpen(nextOpen, { focusInput: nextOpen, clearSelection: !nextOpen });
  });
  elements.filesSearchInput?.addEventListener("input", () => {
    state.files.search.query = String(elements.filesSearchInput.value || "");
    renderFilesList();
    if (state.files.groupManager.open) {
      renderFilesGroupManagerPanel();
    }
  });
  elements.filesSearchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setFilesSearchOpen(false, { clearQuery: true });
    }
  });
  elements.filesUploadInput?.addEventListener("change", () => {
    if (elements.filesUploadInput?.files?.length) {
      const hadMissingFileError = state.files.uploadMissingFileError;
      setFilesUploadInputInvalid(false, { isMissingFileError: false });
      if (hadMissingFileError) {
        setFilesUploadFeedback("", "");
      }
      renderFilesAccessView();
    }
  });
  elements.filesImageInput?.addEventListener("change", () => {
    if (elements.filesImageInput?.files?.length) {
      setFilesUploadFeedback("", "");
      renderFilesAccessView();
    }
  });
  elements.filesGroupInput?.addEventListener("input", () => {
    if (state.files.uploadMessageKind === "error") {
      setFilesUploadFeedback("", "");
      renderFilesAccessView();
    }
    syncFilesGroupSuggestions();
  });
  elements.filesEditPanel?.addEventListener("input", handleFilesEditPanelInput);
  elements.filesEditPanel?.addEventListener("click", handleFilesEditPanelClick);
  elements.filesEditPanel?.addEventListener("submit", handleFilesEditPanelSubmit);
  elements.filesUploadPanel?.addEventListener("click", handleFilesListClick);
  elements.filesDetailOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.filesDetailOverlay) {
      closeFilesDetailModal();
      return;
    }
    handleFilesListClick(event);
  });
  elements.filesDetailOverlay?.addEventListener("change", handleFilesListChange);
  elements.filesDetailModalCloseBtn?.addEventListener("click", () => {
    closeFilesDetailModal();
  });
  elements.filesList?.addEventListener("click", handleFilesListClick);
  elements.filesList?.addEventListener("keydown", handleFilesListKeydown);
  elements.filesList?.addEventListener("input", handleFilesListInput);
  elements.filesList?.addEventListener("change", handleFilesListChange);
  elements.filesList?.addEventListener("submit", handleFilesListSubmit);
  elements.filesGroupManagerWrap?.addEventListener("click", handleFilesListClick);
  elements.filesGroupManagerWrap?.addEventListener("input", handleFilesListInput);
  elements.filesGroupManagerWrap?.addEventListener("change", handleFilesListChange);
  elements.filesSearchResults?.addEventListener("click", handleFilesListClick);
  elements.filesAdminRequestsList?.addEventListener("click", handleFilesAdminRequestsListClick);
  elements.filesAdminRequestsList?.addEventListener("input", handleFilesAdminRequestsListInput);
  elements.filesPublicSharesList?.addEventListener("click", handleFilesPublicSharesListClick);
  elements.filesDeleteCancelBtn?.addEventListener("click", () => {
    closeFilesDeleteModal();
  });
  elements.filesDeleteConfirmBtn?.addEventListener("click", () => {
    void confirmFilesDeleteModal();
  });
  elements.filesDeleteOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.filesDeleteOverlay) {
      closeFilesDeleteModal();
    }
  });
  elements.filesCautionRejectBtn?.addEventListener("click", () => {
    closeFilesCautionModal();
  });
  elements.filesCautionConfirmBtn?.addEventListener("click", () => {
    confirmFilesCautionDownload();
  });
  elements.filesCautionOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.filesCautionOverlay) {
      closeFilesCautionModal();
    }
  });
  elements.filesShareCancelBtn?.addEventListener("click", () => {
    closeFilesShareModal();
  });
  elements.filesSharePrivateBtn?.addEventListener("click", () => {
    void copyPrivateFilesShareLink();
  });
  elements.filesSharePublicBtn?.addEventListener("click", () => {
    showPublicFilesShareForm();
  });
  elements.filesShareCodeInput?.addEventListener("input", () => {
    if (!(elements.filesShareCodeInput instanceof HTMLInputElement)) {
      return;
    }
    elements.filesShareCodeInput.value = elements.filesShareCodeInput.value.replace(/\D/g, "").slice(0, 4);
    elements.filesShareCodeInput.classList.remove("is-invalid");
    if (state.files.shareModal.feedbackKind === "error") {
      setFilesShareFeedback("", "");
    }
  });
  elements.filesSharePublicForm?.addEventListener("submit", (event) => {
    void submitPublicFilesShare(event);
  });
  elements.filesShareOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.filesShareOverlay) {
      closeFilesShareModal();
    }
  });
  elements.filesBotAdminLeaveCancelBtn?.addEventListener("click", () => {
    closeFilesBotAdminLeaveModal();
  });
  elements.filesBotAdminLeaveConfirmBtn?.addEventListener("click", () => {
    void confirmFilesBotAdminLeaveModal();
  });
  elements.filesBotAdminLeaveOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.filesBotAdminLeaveOverlay) {
      closeFilesBotAdminLeaveModal();
    }
  });
  elements.filesBotAdminDiagnosticsModalCloseBtn?.addEventListener("click", () => {
    closeFilesBotAdminDiagnosticsModal();
  });
  elements.filesBotAdminServerModalCloseBtn?.addEventListener("click", () => {
    closeFilesBotAdminServerModal();
  });
  elements.hackAbortBtn.addEventListener("click", hideHackOverlay);
  elements.hackRetryBtn.addEventListener("click", startNewHackSession);
  elements.hackOpenClassifiedBtn.addEventListener("click", showClassifiedPage);
  elements.classifiedBackBtn.addEventListener("click", hideClassifiedPage);
  elements.minervaDetailBackBtn?.addEventListener("click", closeMinervaDetail);
  elements.minervaDetailImage?.addEventListener("load", () => {
    finalizeMinervaDetailImageLoad(elements.minervaDetailImage);
  });
  elements.minervaDetailImage?.addEventListener("error", () => {
    handleMinervaDetailImageError(
      elements.minervaDetailImage,
      elements.minervaDetailImage?.dataset?.fallbackSrc
    );
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
    scheduleClassifiedMinervaSearchResultsRender();
  });
  elements.classifiedSearchResults?.addEventListener("click", (event) => {
    const trigger = event.target instanceof Element
      ? event.target.closest("[data-classified-search-detail]")
      : null;
    if (!trigger || !elements.classifiedSearchResults.contains(trigger)) {
      return;
    }

    event.preventDefault();
    void openClassifiedInlineDetail({
      name: trigger.dataset.name || "",
      price: trigger.dataset.price || "",
      wikiUrl: trigger.dataset.wikiUrl || ""
    });
  });
  elements.classifiedSearchToggleBtn?.addEventListener("click", () => {
    const nextOpen = !state.classifiedSearch.open;
    setClassifiedSearchOpen(nextOpen, { focusInput: nextOpen, clearQuery: !nextOpen });
  });
  elements.classifiedSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setClassifiedSearchOpen(false, { clearQuery: true });
    }
  });
  elements.classifiedInlineCloseBtn?.addEventListener("click", () => {
    closeClassifiedInlineDetail();
  });
  elements.classifiedInlineImage?.addEventListener("load", () => {
    finalizeMinervaDetailImageLoad(elements.classifiedInlineImage);
  });
  elements.classifiedInlineImage?.addEventListener("error", () => {
    handleMinervaDetailImageError(
      elements.classifiedInlineImage,
      elements.classifiedInlineImage?.dataset?.fallbackSrc
    );
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
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (elements.langDropdown && target instanceof Node && !elements.langDropdown.contains(target)) {
      setLanguageMenuOpen(false);
    }
    if (elements.dropsLangDropdown && target instanceof Node && !elements.dropsLangDropdown.contains(target)) {
      setDropsLangMenuOpen(false);
    }
    if (elements.filesAdminRequestsFilterDropdown && target instanceof Node && !elements.filesAdminRequestsFilterDropdown.contains(target)) {
      setFilesAdminRequestsFilterMenuOpen(false);
    }
    if (elements.filesBotAdminSortDropdown && target instanceof Node && !elements.filesBotAdminSortDropdown.contains(target)) {
      setFilesBotAdminSortMenuOpen(false);
    }
    if (target instanceof Node) {
      const openGroupDropdowns = Array.from(document.querySelectorAll("[data-files-group-suggest-dropdown].is-open"));
      for (const dropdown of openGroupDropdowns) {
        if (!(dropdown instanceof HTMLElement)) {
          continue;
        }
        if (!dropdown.contains(target)) {
          setFilesGroupSuggestMenuOpen(dropdown, false);
        }
      }
    }
  });
  document.addEventListener("touchmove", blockBackgroundForActiveOverlay, { passive: false });
  document.addEventListener("wheel", blockBackgroundForActiveOverlay, { passive: false });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (elements.langDropdown?.classList.contains("is-open")) {
      setLanguageMenuOpen(false);
      return;
    }

    if (elements.dropsLangDropdown?.classList.contains("is-open")) {
      setDropsLangMenuOpen(false);
      return;
    }

    if (elements.filesFunctionsOverlay?.classList.contains("is-active")) {
      closeFilesFunctionsModal();
      return;
    }

    if (elements.classifiedPlayersOverlay?.classList.contains("is-active")) {
      closeClassifiedPlayerCountsModal();
      return;
    }

    if (elements.classifiedIntelOverlay?.classList.contains("is-active")) {
      closeClassifiedNukaIntelModal();
      return;
    }

    if (elements.classifiedAxolotlOverlay?.classList.contains("is-active")) {
      closeClassifiedAxolotlModal();
      return;
    }

    if (elements.intelBotInviteOverlay?.classList.contains("is-active")) {
      closeIntelBotInviteModal();
      return;
    }

    if (elements.intelEmailOverlay?.classList.contains("is-active")) {
      closeIntelEmailModal();
      return;
    }

    if (elements.filesBotAdminLeaveOverlay?.classList.contains("is-active")) {
      closeFilesBotAdminLeaveModal();
      return;
    }

    if (elements.filesBotAdminDiagnosticsOverlay?.classList.contains("is-active")) {
      return;
    }

    if (elements.filesBotAdminServerOverlay?.classList.contains("is-active")) {
      return;
    }

    if (elements.filesBotAdminSortDropdown?.classList.contains("is-open")) {
      setFilesBotAdminSortMenuOpen(false);
      return;
    }

    if (elements.filesAdminRequestsFilterDropdown?.classList.contains("is-open")) {
      setFilesAdminRequestsFilterMenuOpen(false);
      return;
    }

    const openGroupDropdown = document.querySelector("[data-files-group-suggest-dropdown].is-open");
    if (openGroupDropdown instanceof HTMLElement) {
      setFilesGroupSuggestMenuOpen(openGroupDropdown, false);
      return;
    }

    if (elements.filesDisclaimerOverlay?.classList.contains("is-active")) {
      if (!isDesktopModalViewport()) {
        closeFilesDisclaimerModal();
      }
      return;
    }

    if (elements.filesCautionOverlay?.classList.contains("is-active")) {
      closeFilesCautionModal();
      return;
    }

    if (elements.filesShareOverlay?.classList.contains("is-active")) {
      closeFilesShareModal();
      return;
    }

    if (elements.filesDetailOverlay?.classList.contains("is-active")) {
      closeFilesDetailModal();
      return;
    }

    if (elements.hackOverlay.classList.contains("is-active")) {
      hideHackOverlay();
      return;
    }

    if (elements.siloDossierOverlay?.classList.contains("is-active")) {
      hideSiloDossier({ updateHash: true });
      return;
    }

    if (elements.filesDeleteOverlay?.classList.contains("is-active")) {
      closeFilesDeleteModal();
      return;
    }

    if (elements.dropsDeleteOverlay?.classList.contains("is-active")) {
      closeDropsDeleteModal();
      return;
    }

    if (elements.filesGroupRenameOverlay?.classList.contains("is-active")) {
      closeFilesGroupRenameModal();
      return;
    }

    if (
      elements.filesUploadOverlay?.classList.contains("is-active")
      || elements.filesEditOverlay?.classList.contains("is-active")
      || elements.filesAdminRequestsOverlay?.classList.contains("is-active")
      || elements.filesPublicSharesOverlay?.classList.contains("is-active")
      || elements.filesBotAdminOverlay?.classList.contains("is-active")
    ) {
      if (!isDesktopModalViewport()) {
        closeFilesAdminModal();
      }
      return;
    }

    if (state.files.disclaimerGate.contactOpen && elements.filesDisclaimerGateView && !elements.filesDisclaimerGateView.hidden) {
      closeFilesDisclaimerContactView({ clearText: false });
      return;
    }

    if (document.body.classList.contains("is-files") && state.files.search.open) {
      setFilesSearchOpen(false, { clearQuery: true });
      return;
    }

    if (document.body.classList.contains("is-classified")) {
      hideClassifiedPage();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && state.view === "files" && document.body.classList.contains("is-files")) {
      void pollFilesIdentityLive({ force: true });
    }
  });
  window.addEventListener("resize", () => {
    renderFilesAdminModals();
    syncFilesAuthorizedVisitCounterMobileCard();
    if (state.classifiedSearch.open) {
      unlockClassifiedArchiveCardSize();
      refreshClassifiedArchiveCardBaseSize(true);
      lockClassifiedArchiveCardSize();
      return;
    }
    refreshClassifiedArchiveCardBaseSize();
  });
  window.addEventListener("hashchange", () => {
    syncFilesLoginReturnToField();
    applyViewFromHash();
  });
  window.addEventListener("message", handleDiscordAuthPopupMessage);
}

async function init() {
  randomizeBackgroundSymbols();
  setupBackgroundParallax();
  wireEvents();
  setupVisitCounterEyeTracking();

  const initialLang = detectInitialLanguage();
  applyLanguage(initialLang, false);
  mountFilesDescriptionEditor(elements.filesDescriptionInput);
  void loadPublicConfig();
  renderVisitCounter();
  void loadVisitCounter();
  state.files.me = buildGuestFilesProfile();
  renderDropsAdminTabVisibility();
  if (!getHashView()) {
    setHashView("intel", { replace: true });
  }
  applyViewFromHash();
  if (state.view !== "files") {
    void refreshFilesIdentityBadgeOnly();
  }
  prewarmStaticSiteImages();
  prewarmMinervaDetailImages();
  void loadMinervaDetailFallback();
  setSignal("booting");

  await startBootSequence();

  updateClock();
  setInterval(updateClock, 1000);
  setInterval(updateFilesAccessTimers, 1000);
  await refreshIntel();
}

init();
