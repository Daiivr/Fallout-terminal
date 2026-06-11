(function siloDossierPage() {
  const SILO_API_URL = "/api/intel/silo";
  const SILO_RESET_DAY_UTC = 4;
  const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
  const TICK_INTERVAL_MS = 1000;
  const STORAGE_LANG_KEY = "pipboy_lang";
  const loader = window.createDossierLoader?.({ minDelayMs: 860 }) || {
    ready() {},
    fail() {}
  };
  const STRINGS = {
    en: {
      pageTitle: "Silo Intel | Fallout Codex",
      loaderKicker: "FALLOUT CODEX // RELAY SYNC",
      loaderTitle: "SYNCING NUCLEAR INTEL",
      loaderCopy: "Decrypting silo telemetry and assembling launch fragments...",
      eyebrow: "NUCLEAR COMMAND INTEL",
      title: "APPALACHIAN SILO STATUS",
      summaryLoading: "Loading silo telemetry...",
      summaryLive: "Live silo launch telemetry is stable. Review every code fragment before authorizing a strike.",
      summaryExpired: "The current launch keyset is marked expired. Wait for the next rotation before running a silo.",
      summaryError: "Live silo telemetry is unavailable right now. Review the last known reset window and try again shortly.",
      briefingLoading: "The relay is still assembling the current authorization packet.",
      briefingLive: "All three silos are broadcasting valid launch fragments through the Fallout Codex relay.",
      briefingExpired: "Upstream marks the current silo keys as expired. Hold launch prep until the fresh set propagates.",
      briefingError: "The relay could not confirm live silo telemetry. The intel feed is showing the safest known fallback window.",
      alpha: "SITE ALPHA",
      bravo: "SITE BRAVO",
      charlie: "SITE CHARLIE",
      resetLabel: "RESET TARGET",
      countdownLabel: "COUNTDOWN",
      statusLabel: "STATUS",
      updatedLabel: "LAST RELAY",
      back: "RETURN TO FALLOUT CODEX",
      chipClearance: "CLEARANCE OMEGA",
      chipGrid: "APPALACHIA GRID",
      sideLabel: "TACTICAL READOUT",
      sideValue: "ALPHA / BRAVO / CHARLIE",
      keysHeading: "LAUNCH KEYCODES",
      telemetryHeading: "RESET TELEMETRY",
      footerNote: "COMMUNITY DATA ONLY. NOT AFFILIATED WITH BETHESDA.",
      briefingKicker: "TACTICAL BRIEFING",
      briefingBadge: "LIVE INTEL",
      statusLoading: "SYNCING",
      statusLive: "CODES VALID",
      statusExpired: "AWAITING REFRESH",
      statusError: "SIGNAL LOST",
      relayOnline: "FALLOUT CODEX ONLINE",
      relayPartial: "FALLOUT CODEX DEGRADED",
      relayLoading: "FALLOUT CODEX SYNCING",
      sourceFallback: "NUKACRYPT",
      updatedPending: "PENDING",
      siloCodeCopyLabel: "Copy {site} silo code {code}",
      siloCodeCopyTooltip: "CLICK TO COPY",
      siloCodeCopyStatusSuccess: "COPY CONFIRMED",
      siloCodeCopyStatusError: "COPY FAILED",
      siloCodeCopied: "{site} Silo Code copied to clipboard",
      siloCodeCopyFailed: "Unable to copy {site} Silo Code",
      unknown: "--"
    },
    es: {
      pageTitle: "Intel de Silos | Fallout Codex",
      loaderKicker: "FALLOUT CODEX // SINCRONIA DEL RELAY",
      loaderTitle: "SINCRONIZANDO INTEL NUCLEAR",
      loaderCopy: "Descifrando telemetria de silos y ensamblando fragmentos de lanzamiento...",
      eyebrow: "INTEL DE COMANDO NUCLEAR",
      title: "ESTADO DE LOS SILOS DE APPALACHIA",
      summaryLoading: "Cargando telemetria de los silos...",
      summaryLive: "La telemetria en vivo de lanzamiento esta estable. Revisa cada fragmento antes de autorizar un ataque.",
      summaryExpired: "El set actual de claves de lanzamiento esta marcado como vencido. Espera la proxima rotacion antes de correr un silo.",
      summaryError: "La telemetria en vivo de los silos no esta disponible ahora mismo. Revisa la ultima ventana conocida y vuelve a intentar pronto.",
      briefingLoading: "El relay todavia esta armando el paquete actual de autorizacion.",
      briefingLive: "Los tres silos estan transmitiendo fragmentos validos a traves del relay de Fallout Codex.",
      briefingExpired: "La fuente marca las claves actuales como vencidas. Deten la preparacion hasta que llegue el set nuevo.",
      briefingError: "El relay no pudo confirmar la telemetria en vivo del silo. El intel muestra la ventana de respaldo mas segura conocida.",
      alpha: "SITIO ALPHA",
      bravo: "SITIO BRAVO",
      charlie: "SITIO CHARLIE",
      resetLabel: "OBJETIVO DE REINICIO",
      countdownLabel: "CUENTA REGRESIVA",
      statusLabel: "ESTADO",
      updatedLabel: "ULTIMO RELAY",
      back: "VOLVER A FALLOUT CODEX",
      chipClearance: "ACCESO OMEGA",
      chipGrid: "RED APPALACHIA",
      sideLabel: "LECTURA TACTICA",
      sideValue: "ALPHA / BRAVO / CHARLIE",
      keysHeading: "CLAVES DE LANZAMIENTO",
      telemetryHeading: "TELEMETRIA DE REINICIO",
      footerNote: "SOLO DATOS DE LA COMUNIDAD. NO AFILIADO CON BETHESDA.",
      briefingKicker: "BRIEFING TACTICO",
      briefingBadge: "INTEL EN VIVO",
      statusLoading: "SINCRONIZANDO",
      statusLive: "CODIGOS VALIDOS",
      statusExpired: "ESPERANDO REINICIO",
      statusError: "SENAL PERDIDA",
      relayOnline: "FALLOUT CODEX EN LINEA",
      relayPartial: "FALLOUT CODEX DEGRADADO",
      relayLoading: "FALLOUT CODEX SINCRONIZANDO",
      sourceFallback: "NUKACRYPT",
      updatedPending: "PENDIENTE",
      siloCodeCopyLabel: "Copiar codigo de silo {site}: {code}",
      siloCodeCopyTooltip: "CLICK PARA COPIAR",
      siloCodeCopyStatusSuccess: "COPIA CONFIRMADA",
      siloCodeCopyStatusError: "FALLO LA COPIA",
      siloCodeCopied: "Codigo de Silo {site} copiado al portapapeles",
      siloCodeCopyFailed: "No se pudo copiar el Codigo de Silo {site}",
      unknown: "--"
    }
  };

  const state = {
    lang: detectLanguage(),
    loading: true,
    error: false,
    data: null,
    lastRelayAt: null
  };

  const elements = {
    dossierEyebrow: document.getElementById("dossierEyebrow"),
    dossierTitle: document.getElementById("dossierTitle"),
    dossierSummary: document.getElementById("dossierSummary"),
    dossierChipClearance: document.getElementById("dossierChipClearance"),
    dossierChipGrid: document.getElementById("dossierChipGrid"),
    dossierRelayValue: document.getElementById("dossierRelayValue"),
    dossierSideLabel: document.getElementById("dossierSideLabel"),
    dossierSideValue: document.getElementById("dossierSideValue"),
    dossierBackTop: document.getElementById("dossierBackTop"),
    dossierAlphaLabel: document.getElementById("dossierAlphaLabel"),
    dossierBravoLabel: document.getElementById("dossierBravoLabel"),
    dossierCharlieLabel: document.getElementById("dossierCharlieLabel"),
    dossierCodeAlpha: document.getElementById("dossierCodeAlpha"),
    dossierCodeBravo: document.getElementById("dossierCodeBravo"),
    dossierCodeCharlie: document.getElementById("dossierCodeCharlie"),
    dossierResetLabel: document.getElementById("dossierResetLabel"),
    dossierResetValue: document.getElementById("dossierResetValue"),
    dossierCountdownLabel: document.getElementById("dossierCountdownLabel"),
    dossierCountdownValue: document.getElementById("dossierCountdownValue"),
    dossierStatusLabel: document.getElementById("dossierStatusLabel"),
    dossierStatusValue: document.getElementById("dossierStatusValue"),
    dossierUpdatedLabel: document.getElementById("dossierUpdatedLabel"),
    dossierUpdatedValue: document.getElementById("dossierUpdatedValue"),
    dossierBriefingKicker: document.getElementById("dossierBriefingKicker"),
    dossierBriefingBadge: document.getElementById("dossierBriefingBadge"),
    dossierBriefing: document.getElementById("dossierBriefing"),
    dossierKeysTitle: document.getElementById("dossierKeysTitle"),
    dossierTelemetryTitle: document.getElementById("dossierTelemetryTitle"),
    dossierFooterNote: document.getElementById("dossierFooterNote")
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

  function formatCode(code) {
    const digits = String(code || "").replace(/\D/g, "");
    const match = digits.match(/^(\d{3})(\d{2})(\d{3})$/);
    return match ? `${match[1]} ${match[2]} ${match[3]}` : "--- -- ---";
  }

  function getSiloCodeClipboardValue(code) {
    const digits = String(code || "").replace(/\D/g, "");
    return /^\d{8}$/.test(digits) ? digits : "";
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

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) {
      throw new Error("Clipboard copy failed");
    }
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

  function normalizeMeridiemText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b([ap])\s*\.\s*m\s*\./gi, (_match, token) => `${token.toLowerCase()}m`)
      .replace(/\b([AP])M\b/g, (_match, token) => `${token.toLowerCase()}m`);
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

  function formatAbsoluteUtc(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return t("unknown");
    }

    const locale = state.lang === "es" ? "es-ES" : "en-US";
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const datePart = new Intl.DateTimeFormat(locale, {
      timeZone: zone,
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).format(date);
    return `${normalizeMeridiemText(datePart)} ${getLocalZoneLabel(date)}`.trim();
  }

  function formatLocalTimestamp(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return t("updatedPending");
    }

    const locale = state.lang === "es" ? "es-ES" : "en-US";
    return normalizeMeridiemText(new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      year: "numeric",
      month: "short",
      day: "2-digit"
    }).format(date));
  }

  function formatCountdown(targetDate) {
    if (!(targetDate instanceof Date) || Number.isNaN(targetDate.getTime())) {
      return t("unknown");
    }

    const totalSeconds = Math.max(0, Math.floor((targetDate.getTime() - Date.now()) / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  function normalizePayload(payload) {
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
      resetTargetUtc: Number.isFinite(resetTargetMs) ? new Date(resetTargetMs) : nextResetUtc(),
      source: String(payload?.source || "").trim() || "https://nukacrypt.com/"
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
    elements.dossierEyebrow.textContent = t("eyebrow");
    elements.dossierTitle.textContent = t("title");
    elements.dossierChipClearance.textContent = t("chipClearance");
    elements.dossierChipGrid.textContent = t("chipGrid");
    elements.dossierAlphaLabel.textContent = t("alpha");
    elements.dossierBravoLabel.textContent = t("bravo");
    elements.dossierCharlieLabel.textContent = t("charlie");
    elements.dossierResetLabel.textContent = t("resetLabel");
    elements.dossierCountdownLabel.textContent = t("countdownLabel");
    elements.dossierStatusLabel.textContent = t("statusLabel");
    elements.dossierUpdatedLabel.textContent = t("updatedLabel");
    elements.dossierSideLabel.textContent = t("sideLabel");
    elements.dossierSideValue.textContent = t("sideValue");
    elements.dossierBriefingKicker.textContent = t("briefingKicker");
    elements.dossierBriefingBadge.textContent = t("briefingBadge");
    elements.dossierBackTop.textContent = t("back");
    elements.dossierKeysTitle.textContent = t("keysHeading");
    elements.dossierTelemetryTitle.textContent = t("telemetryHeading");
    elements.dossierFooterNote.textContent = t("footerNote");
  }

  function setIntelState(statusState, relayState) {
    elements.dossierStatusValue.dataset.state = statusState;
    elements.dossierRelayValue.dataset.state = relayState;
  }

  function getSiloCodeRows() {
    return [
      { site: "Alpha", label: elements.dossierAlphaLabel, code: elements.dossierCodeAlpha },
      { site: "Bravo", label: elements.dossierBravoLabel, code: elements.dossierCodeBravo },
      { site: "Charlie", label: elements.dossierCharlieLabel, code: elements.dossierCodeCharlie }
    ].map((entry) => ({
      ...entry,
      row: entry.code?.closest(".silo-key-row")
    })).filter((entry) => entry.row);
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
    return Boolean(window.matchMedia?.("(max-width: 720px), (hover: none), (pointer: coarse)")?.matches);
  }

  function positionSiloCodeCopyToast(toast, row, point) {
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

    const rowRect = row instanceof HTMLElement ? row.getBoundingClientRect() : null;
    const pointX = Number(point?.clientX);
    const pointY = Number(point?.clientY);
    const hasPointerPoint = Number.isFinite(pointX) && Number.isFinite(pointY) && (pointX > 0 || pointY > 0);
    const baseX = hasPointerPoint ? pointX : (rowRect ? rowRect.right : window.innerWidth / 2);
    const baseY = hasPointerPoint ? pointY : (rowRect ? rowRect.top + rowRect.height / 2 : window.innerHeight / 2);
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

  function showSiloCodeCopyToast(row, message, kind, point) {
    const toast = getSiloCodeCopyToast();
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
    status.textContent = t(isError ? "siloCodeCopyStatusError" : "siloCodeCopyStatusSuccess");

    const body = document.createElement("span");
    body.className = "silo-code-copy-toast-message";
    body.textContent = message;

    copy.append(status, body);
    toast.dataset.ownerId = row?.dataset?.siloCopyId || "";
    toast.replaceChildren(arrow, signal, copy);
    toast.classList.toggle("is-error", isError);
    toast.classList.toggle("is-success", !isError);
    toast.classList.add("is-visible");
    positionSiloCodeCopyToast(toast, row, point);
  }

  function resetSiloCodeCopyState(row) {
    if (!(row instanceof HTMLElement)) {
      return;
    }

    row.classList.remove("is-copy-confirmed", "is-copy-error");
    const toast = document.getElementById("siloCodeCopyToast");
    if (toast?.dataset?.ownerId === row.dataset.siloCopyId) {
      toast.classList.remove("is-visible");
      delete toast.dataset.ownerId;
    }
    delete row.dataset.copyResetTimer;
  }

  function flashSiloCodeCopyState(row, site, kind = "success", point = null) {
    if (!(row instanceof HTMLElement)) {
      return;
    }

    const previousTimerId = Number.parseInt(row.dataset.copyResetTimer || "", 10);
    if (Number.isFinite(previousTimerId) && previousTimerId > 0) {
      clearTimeout(previousTimerId);
    }

    const isError = kind === "error";
    row.classList.toggle("is-copy-confirmed", !isError);
    row.classList.toggle("is-copy-error", isError);
    showSiloCodeCopyToast(
      row,
      t(isError ? "siloCodeCopyFailed" : "siloCodeCopied", { site }),
      kind,
      point
    );

    const timerId = window.setTimeout(() => {
      if (row.isConnected) {
        resetSiloCodeCopyState(row);
      }
    }, 1900);
    row.dataset.copyResetTimer = String(timerId);
  }

  async function handleSiloCodeCopy(row, site, code, event = null) {
    const clipboardValue = getSiloCodeClipboardValue(code);
    if (!clipboardValue) {
      return;
    }

    try {
      await copyTextToClipboard(clipboardValue);
      flashSiloCodeCopyState(row, site, "success", event);
    } catch (_error) {
      flashSiloCodeCopyState(row, site, "error", event);
    }
  }

  function syncSiloCodeCopyRows() {
    const codes = state.data?.codes || {};
    for (const entry of getSiloCodeRows()) {
      const rawCode = codes[entry.site];
      const displayCode = formatCode(rawCode);
      const clipboardValue = getSiloCodeClipboardValue(rawCode);
      entry.row.dataset.siloSite = entry.site;
      entry.row.dataset.siloCode = rawCode || "";
      entry.row.dataset.siloCopyId = `dossier-silo-${entry.site.toLowerCase()}`;
      entry.row.dataset.tooltip = clipboardValue ? t("siloCodeCopyTooltip") : "";
      entry.row.classList.toggle("is-copy-disabled", !clipboardValue);
      if (clipboardValue) {
        entry.row.setAttribute("role", "button");
        entry.row.setAttribute("tabindex", "0");
        entry.row.setAttribute("aria-label", t("siloCodeCopyLabel", { site: entry.site, code: displayCode }));
      } else {
        entry.row.removeAttribute("role");
        entry.row.removeAttribute("tabindex");
        entry.row.removeAttribute("aria-label");
      }
    }
  }

  function render() {
    applyStaticText();

    const data = state.data;
    const resetTarget = data?.resetTargetUtc instanceof Date ? data.resetTargetUtc : nextResetUtc();
    elements.dossierCodeAlpha.textContent = formatCode(data?.codes?.Alpha);
    elements.dossierCodeBravo.textContent = formatCode(data?.codes?.Bravo);
    elements.dossierCodeCharlie.textContent = formatCode(data?.codes?.Charlie);
    syncSiloCodeCopyRows();
    elements.dossierResetValue.textContent = formatAbsoluteUtc(resetTarget);
    elements.dossierCountdownValue.textContent = formatCountdown(resetTarget);
    elements.dossierUpdatedValue.textContent = formatLocalTimestamp(state.lastRelayAt);

    if (state.loading && !data) {
      elements.dossierSummary.textContent = t("summaryLoading");
      elements.dossierBriefing.textContent = t("briefingLoading");
      elements.dossierStatusValue.textContent = t("statusLoading");
      elements.dossierRelayValue.textContent = t("relayLoading");
      setIntelState("loading", "loading");
      return;
    }

    if (state.error || !data) {
      elements.dossierSummary.textContent = t("summaryError");
      elements.dossierBriefing.textContent = t("briefingError");
      elements.dossierStatusValue.textContent = t("statusError");
      elements.dossierRelayValue.textContent = t("relayPartial");
      setIntelState("error", "error");
      return;
    }

    if (data.isExpired) {
      elements.dossierSummary.textContent = t("summaryExpired");
      elements.dossierBriefing.textContent = t("briefingExpired");
      elements.dossierStatusValue.textContent = t("statusExpired");
      elements.dossierRelayValue.textContent = t("relayOnline");
      setIntelState("expired", "online");
      return;
    }

    elements.dossierSummary.textContent = t("summaryLive");
    elements.dossierBriefing.textContent = t("briefingLive");
    elements.dossierStatusValue.textContent = t("statusLive");
    elements.dossierRelayValue.textContent = t("relayOnline");
    setIntelState("live", "online");
  }

  async function loadIntel() {
    state.loading = true;
    render();

    try {
      const response = await fetch(SILO_API_URL, {
        cache: "no-store",
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      state.data = normalizePayload(payload);
      state.error = !Object.values(state.data.codes || {}).some(Boolean);
      state.lastRelayAt = new Date();
    } catch (_error) {
      state.error = true;
      state.data = {
        codes: {
          Alpha: null,
          Bravo: null,
          Charlie: null
        },
        isExpired: false,
        resetTargetUtc: nextResetUtc(),
        source: "https://nukacrypt.com/"
      };
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
    for (const entry of getSiloCodeRows()) {
      entry.row.addEventListener("click", (event) => {
        void handleSiloCodeCopy(entry.row, entry.row.dataset.siloSite || entry.site, entry.row.dataset.siloCode || "", event);
      });
      entry.row.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }
        event.preventDefault();
        void handleSiloCodeCopy(entry.row, entry.row.dataset.siloSite || entry.site, entry.row.dataset.siloCode || "", event);
      });
    }
    window.setInterval(() => {
      render();
    }, TICK_INTERVAL_MS);
    window.setInterval(() => {
      void loadIntel();
    }, REFRESH_INTERVAL_MS);
  });
})();
