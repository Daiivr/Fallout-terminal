(function dossierLoaderBootstrap() {
  function setDossierLoaderText(values = {}) {
    const kicker = document.getElementById("dossierLoaderKicker");
    const title = document.getElementById("dossierLoaderTitle");
    const copy = document.getElementById("dossierLoaderCopy");

    if (kicker && typeof values.kicker === "string") {
      kicker.textContent = values.kicker;
    }
    if (title && typeof values.title === "string") {
      title.textContent = values.title;
    }
    if (copy && typeof values.copy === "string") {
      copy.textContent = values.copy;
    }
  }

  function createDossierLoader(options = {}) {
    const body = document.body;
    const overlay = document.getElementById("dossierLoader");
    const minDelayMs = Number.isFinite(Number(options.minDelayMs)) ? Number(options.minDelayMs) : 820;
    const removeDelayMs = Number.isFinite(Number(options.removeDelayMs)) ? Number(options.removeDelayMs) : 520;
    const startTime = Date.now();
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    let windowLoaded = document.readyState === "complete";
    let contentReady = false;
    let finished = false;
    let finalizeTimer = null;

    body?.classList.add("is-dossier-loading");

    function cleanupOverlay() {
      if (!overlay) {
        return;
      }
      overlay.classList.add("is-hidden");
      window.setTimeout(() => {
        overlay.remove();
      }, reducedMotion ? 0 : removeDelayMs);
    }

    function finishNow() {
      if (finished) {
        return;
      }
      finished = true;
      if (finalizeTimer) {
        window.clearTimeout(finalizeTimer);
        finalizeTimer = null;
      }
      body?.classList.remove("is-dossier-loading");
      body?.classList.add("is-dossier-ready");
      cleanupOverlay();
    }

    function maybeFinish() {
      if (finished || !contentReady || !windowLoaded) {
        return;
      }

      const elapsed = Date.now() - startTime;
      const waitMs = reducedMotion ? 0 : Math.max(0, minDelayMs - elapsed);

      if (!waitMs) {
        finishNow();
        return;
      }

      if (finalizeTimer) {
        return;
      }

      finalizeTimer = window.setTimeout(() => {
        finalizeTimer = null;
        finishNow();
      }, waitMs);
    }

    if (!windowLoaded) {
      window.addEventListener("load", () => {
        windowLoaded = true;
        maybeFinish();
      }, { once: true });
    }

    return {
      ready() {
        contentReady = true;
        maybeFinish();
      },
      fail() {
        contentReady = true;
        maybeFinish();
      }
    };
  }

  window.setDossierLoaderText = setDossierLoaderText;
  window.createDossierLoader = createDossierLoader;
})();
