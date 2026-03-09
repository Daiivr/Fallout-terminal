(function termsDossierPage() {
  const STORAGE_LANG_KEY = "pipboy_lang";
  const loader = window.createDossierLoader?.({ minDelayMs: 700 }) || {
    ready() {},
    fail() {}
  };
  const CONTENT = {
    en: {
      pageTitle: "Terms of Service | Fallout Codex Bot",
      metaDescription:
        "Terms of Service for the Fallout Codex Discord bot, including intended use, server admin responsibilities, uptime disclaimers, and limits of liability.",
      loaderKicker: "FALLOUT CODEX // BOT DIRECTIVE",
      loaderTitle: "LOADING SERVICE TERMS",
      loaderCopy: "Syncing operational directives, server rules, and usage conditions...",
      langLabel: "LANGUAGE",
      eyebrow: "FALLOUT CODEX // BOT OPERATIONS DIRECTIVE",
      title: "TERMS OF SERVICE",
      summary:
        "These Terms of Service govern the use of the Fallout Codex Discord bot, including its intel broadcasts, slash commands, preview tools, and linked intel pages used to support the bot.",
      chips: ["DISCORD BOT", "FALLOUT 76 INTEL", "LAST UPDATED MARCH 9, 2026"],
      side: {
        label: "SERVICE SCOPE",
        value: "LIVE SERVER ALERTS",
        copy:
          "Covers bot subscriptions, slash commands such as intel subscribe, preview, status, and language, plus the related Fallout Codex support pages linked from the bot."
      },
      actions: {
        primary: "VIEW PRIVACY POLICY",
        secondary: "RETURN TO FALLOUT CODEX"
      },
      navKicker: "SECTION INDEX",
      footerNote:
        "These terms describe the Fallout Codex bot's current service model as of March 9, 2026.",
      stats: [
        ["INTENDED USE", "SILO + MINERVA ALERTS", "The bot is built to deliver Fallout 76 intel to Discord channels chosen by a server."],
        ["MINIMUM PERMISSIONS", "VIEW, SEND, EMBED", "Server admins must configure the bot with the permissions needed for the selected channels."],
        ["SOURCE MODEL", "BEST-EFFORT INTEL", "Broadcasts rely on third-party and community-maintained Fallout 76 data sources."],
        ["AFFILIATION", "UNOFFICIAL PROJECT", "Fallout Codex is a community project and is not affiliated with Bethesda or Discord."]
      ],
      sections: [
        {
          id: "terms-acceptance",
          kicker: "01 // ACCEPTANCE",
          title: "Agreement to these terms",
          copies: [
            "By inviting, configuring, or using the Fallout Codex Discord bot, you agree to these Terms of Service. If you do not agree, do not use the bot and remove it from your server."
          ],
          navLabel: "Agreement to These Terms"
        },
        {
          id: "terms-use",
          kicker: "02 // INTENDED USE",
          title: "What the bot is for",
          copies: [
            "The bot is designed to provide Fallout 76 community intel, including Appalachian silo code alerts, Minerva sale updates, slash command previews, server language preferences, and interactive plan detail lookups."
          ],
          list: [
            "Intel posting commands are intended for legitimate server administration and information sharing.",
            "The bot may change commands, embed layouts, or update behavior as the project evolves.",
            "Using the bot does not grant ownership rights over the bot, its code, or its branding."
          ],
          navLabel: "Intended Use"
        },
        {
          id: "terms-admin",
          kicker: "03 // SERVER ADMIN RESPONSIBILITIES",
          title: "What server owners and moderators must do",
          list: [
            "Invite the bot only to servers where you are authorized to manage apps and channel settings.",
            "Grant only the permissions needed for the channels where you want intel updates posted.",
            "Choose appropriate channels for subscriptions and manage who is allowed to use bot commands in your server.",
            "Ensure use of the bot complies with Discord's Terms of Service, Community Guidelines, and your own server rules."
          ],
          navLabel: "Server Admin Responsibilities"
        },
        {
          id: "terms-restrictions",
          kicker: "04 // RESTRICTIONS",
          title: "What you may not do",
          list: [
            "Use the bot to spam, harass, abuse, or disrupt other users, servers, or services.",
            "Attempt to break, overload, reverse engineer, or intentionally interfere with the bot or its upstream intel sources.",
            "Use the bot in violation of applicable law, Discord policy, or third-party rights.",
            "Impersonate the bot or misrepresent unofficial Fallout Codex outputs as official game or company communications."
          ],
          navLabel: "Restrictions"
        },
        {
          id: "terms-availability",
          kicker: "05 // AVAILABILITY + ACCURACY",
          title: "No guarantee of uptime or perfect intel",
          copies: [
            "The bot is provided on a best-effort basis. Intel may depend on third-party or community-maintained sources such as NukaCrypt, WhereIsMinerva, and Fallout Fandom references. Those sources may change, fail, delay updates, or return incomplete data.",
            "The bot may go offline, skip an update, post late, or temporarily display incorrect or outdated information. Use the service at your own discretion."
          ],
          navLabel: "Availability and Accuracy"
        },
        {
          id: "terms-suspension",
          kicker: "06 // SUSPENSION + TERMINATION",
          title: "When access can be removed",
          copies: [
            "The operator may suspend, limit, or discontinue the bot at any time, with or without notice, including for abuse, maintenance, source failures, legal concerns, or project shutdown."
          ],
          navLabel: "Suspension and Termination"
        },
        {
          id: "terms-liability",
          kicker: "07 // DISCLAIMERS + LIABILITY",
          title: "Service provided as-is",
          copies: [
            "The Fallout Codex bot is provided \"as is\" and \"as available\" without warranties of accuracy, reliability, uptime, fitness for a particular purpose, or uninterrupted operation.",
            "To the fullest extent allowed by law, the operator is not liable for indirect, incidental, consequential, or special damages, including server disruption, missed alerts, moderation actions, or losses caused by inaccurate or delayed intel."
          ],
          navLabel: "Disclaimers and Liability"
        },
        {
          id: "terms-affiliation",
          kicker: "08 // INTELLECTUAL PROPERTY + AFFILIATION",
          title: "Unofficial community project",
          copies: [
            "Fallout Codex is an unofficial fan-made project. It is not affiliated with, endorsed by, or sponsored by Bethesda Softworks, ZeniMax, Discord, or any official game publisher. Fallout-related names, marks, and assets remain the property of their respective owners."
          ],
          navLabel: "Affiliation and IP"
        },
        {
          id: "terms-changes",
          kicker: "09 // CHANGES",
          title: "Updates to these terms",
          copies: [
            "These Terms of Service may be revised as the bot changes. Continued use of the bot after changes are published means you accept the updated terms."
          ],
          note: "If your server does not agree with revised terms, remove the bot and delete existing subscriptions.",
          navLabel: "Updates to the Terms"
        }
      ]
    },
    es: {
      pageTitle: "Terminos de Servicio | Fallout Codex Bot",
      metaDescription:
        "Terminos de Servicio para el bot de Discord Fallout Codex, incluyendo uso previsto, responsabilidades de administradores, avisos de disponibilidad y limites de responsabilidad.",
      loaderKicker: "FALLOUT CODEX // DIRECTIVA DEL BOT",
      loaderTitle: "CARGANDO TERMINOS DEL SERVICIO",
      loaderCopy: "Sincronizando directivas operativas, reglas del servidor y condiciones de uso...",
      langLabel: "IDIOMA",
      eyebrow: "FALLOUT CODEX // DIRECTIVA DE OPERACIONES DEL BOT",
      title: "TERMINOS DE SERVICIO",
      summary:
        "Estos Terminos de Servicio regulan el uso del bot de Discord Fallout Codex, incluyendo sus emisiones de intel, comandos slash, herramientas de preview y paginas de intel enlazadas que apoyan al bot.",
      chips: ["BOT DE DISCORD", "INTEL DE FALLOUT 76", "ACTUALIZADO 9 DE MARZO DE 2026"],
      side: {
        label: "ALCANCE DEL SERVICIO",
        value: "ALERTAS EN SERVIDORES",
        copy:
          "Cubre suscripciones del bot, comandos slash como intel subscribe, preview, status y language, ademas de las paginas de apoyo de Fallout Codex enlazadas desde el bot."
      },
      actions: {
        primary: "VER POLITICA DE PRIVACIDAD",
        secondary: "VOLVER A FALLOUT CODEX"
      },
      navKicker: "INDICE DE SECCIONES",
      footerNote:
        "Estos terminos describen el modelo actual de servicio del bot Fallout Codex al 9 de marzo de 2026.",
      stats: [
        ["USO PREVISTO", "ALERTAS DE SILOS + MINERVA", "El bot esta hecho para enviar intel de Fallout 76 a canales de Discord elegidos por un servidor."],
        ["PERMISOS MINIMOS", "VER, ENVIAR, EMBED", "Los administradores deben configurar el bot con los permisos necesarios para los canales elegidos."],
        ["MODELO DE FUENTES", "INTEL DE MEJOR ESFUERZO", "Las emisiones dependen de fuentes de Fallout 76 mantenidas por terceros y por la comunidad."],
        ["AFILIACION", "PROYECTO NO OFICIAL", "Fallout Codex es un proyecto comunitario y no esta afiliado con Bethesda ni con Discord."]
      ],
      sections: [
        {
          id: "terms-acceptance",
          kicker: "01 // ACEPTACION",
          title: "Aceptacion de estos terminos",
          copies: [
            "Al invitar, configurar o usar el bot de Discord Fallout Codex, aceptas estos Terminos de Servicio. Si no estas de acuerdo, no uses el bot y retiralo de tu servidor."
          ],
          navLabel: "Aceptacion de estos terminos"
        },
        {
          id: "terms-use",
          kicker: "02 // USO PREVISTO",
          title: "Para que existe el bot",
          copies: [
            "El bot esta disenado para proporcionar intel comunitario de Fallout 76, incluyendo alertas de codigos de silos de Appalachia, actualizaciones de ventas de Minerva, previews de comandos slash, preferencias de idioma del servidor y consultas interactivas de detalles de planos."
          ],
          list: [
            "Los comandos de publicacion de intel estan pensados para administracion legitima del servidor y para compartir informacion.",
            "El bot puede cambiar comandos, disenos de embeds o comportamiento a medida que evoluciona el proyecto.",
            "Usar el bot no concede derechos de propiedad sobre el bot, su codigo o su marca."
          ],
          navLabel: "Uso previsto"
        },
        {
          id: "terms-admin",
          kicker: "03 // RESPONSABILIDADES DE ADMINISTRACION",
          title: "Lo que deben hacer duenos y moderadores",
          list: [
            "Invita el bot solo a servidores donde estes autorizado para gestionar aplicaciones y ajustes de canal.",
            "Concede solo los permisos necesarios para los canales donde quieras publicar actualizaciones de intel.",
            "Elige canales apropiados para las suscripciones y gestiona quien puede usar los comandos del bot en tu servidor.",
            "Asegura que el uso del bot cumple con los Terminos de Servicio de Discord, sus Community Guidelines y las reglas de tu servidor."
          ],
          navLabel: "Responsabilidades de administracion"
        },
        {
          id: "terms-restrictions",
          kicker: "04 // RESTRICCIONES",
          title: "Lo que no puedes hacer",
          list: [
            "Usar el bot para spam, acoso, abuso o para interrumpir a otros usuarios, servidores o servicios.",
            "Intentar romper, sobrecargar, hacer ingenieria inversa o interferir intencionalmente con el bot o con sus fuentes de intel.",
            "Usar el bot violando la ley aplicable, las politicas de Discord o derechos de terceros.",
            "Suplantar al bot o presentar resultados no oficiales de Fallout Codex como comunicaciones oficiales del juego o de una empresa."
          ],
          navLabel: "Restricciones"
        },
        {
          id: "terms-availability",
          kicker: "05 // DISPONIBILIDAD + EXACTITUD",
          title: "Sin garantia de uptime ni de intel perfecto",
          copies: [
            "El bot se ofrece bajo un modelo de mejor esfuerzo. El intel puede depender de fuentes de terceros o mantenidas por la comunidad como NukaCrypt, WhereIsMinerva y referencias de Fallout Fandom. Esas fuentes pueden cambiar, fallar, retrasar actualizaciones o devolver datos incompletos.",
            "El bot puede quedar fuera de linea, saltarse una actualizacion, publicar tarde o mostrar temporalmente informacion incorrecta o desactualizada. Usa el servicio bajo tu propio criterio."
          ],
          navLabel: "Disponibilidad y exactitud"
        },
        {
          id: "terms-suspension",
          kicker: "06 // SUSPENSION + TERMINACION",
          title: "Cuando puede retirarse el acceso",
          copies: [
            "El operador puede suspender, limitar o descontinuar el bot en cualquier momento, con o sin aviso, incluyendo por abuso, mantenimiento, fallos de fuentes, cuestiones legales o cierre del proyecto."
          ],
          navLabel: "Suspension y terminacion"
        },
        {
          id: "terms-liability",
          kicker: "07 // AVISOS + RESPONSABILIDAD",
          title: "Servicio entregado tal cual",
          copies: [
            "El bot Fallout Codex se proporciona \"tal cual\" y \"segun disponibilidad\", sin garantias de exactitud, confiabilidad, uptime, idoneidad para un fin concreto o funcionamiento ininterrumpido.",
            "En la maxima medida permitida por la ley, el operador no sera responsable por danos indirectos, incidentales, consecuenciales o especiales, incluyendo interrupciones del servidor, alertas perdidas, acciones de moderacion o perdidas causadas por intel inexacto o tardio."
          ],
          navLabel: "Avisos y responsabilidad"
        },
        {
          id: "terms-affiliation",
          kicker: "08 // PROPIEDAD INTELECTUAL + AFILIACION",
          title: "Proyecto comunitario no oficial",
          copies: [
            "Fallout Codex es un proyecto fan-made no oficial. No esta afiliado, respaldado ni patrocinado por Bethesda Softworks, ZeniMax, Discord ni por ningun publicador oficial del juego. Los nombres, marcas y recursos relacionados con Fallout siguen siendo propiedad de sus respectivos duenos."
          ],
          navLabel: "Afiliacion y PI"
        },
        {
          id: "terms-changes",
          kicker: "09 // CAMBIOS",
          title: "Actualizaciones a estos terminos",
          copies: [
            "Estos Terminos de Servicio pueden revisarse a medida que cambie el bot. El uso continuado del bot despues de que se publiquen cambios significa que aceptas los terminos actualizados."
          ],
          note: "Si tu servidor no esta de acuerdo con terminos revisados, elimina el bot y borra las suscripciones existentes.",
          navLabel: "Actualizaciones a los terminos"
        }
      ]
    }
  };

  const elements = {
    metaDescription: document.getElementById("legalMetaDescription"),
    pageEyebrow: document.getElementById("legalPageEyebrow"),
    pageTitle: document.getElementById("legalPageTitle"),
    pageSummary: document.getElementById("legalPageSummary"),
    chipRow: document.getElementById("legalChipRow"),
    langLabel: document.getElementById("legalLangLabel"),
    langButtons: Array.from(document.querySelectorAll("[data-lang-option]")),
    sideLabel: document.getElementById("legalSideLabel"),
    sideValue: document.getElementById("legalSideValue"),
    sideCopy: document.getElementById("legalSideCopy"),
    primaryAction: document.getElementById("legalPrimaryAction"),
    secondaryAction: document.getElementById("legalSecondaryAction"),
    statGrid: document.getElementById("legalStatGrid"),
    mainContent: document.getElementById("legalMainContent"),
    navKicker: document.getElementById("legalNavKicker"),
    navList: document.getElementById("legalNavList"),
    footerNote: document.getElementById("legalFooterNote")
  };

  function normalizeLanguage(value) {
    return String(value || "").trim().toLowerCase().startsWith("es") ? "es" : "en";
  }

  function detectLanguage() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("lang");
    const fromStorage = safeStorageGet(STORAGE_LANG_KEY);
    return normalizeLanguage(fromQuery || fromStorage || navigator.language || "en");
  }

  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_error) {
      return "";
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_error) {
      return;
    }
  }

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    if (typeof text === "string") {
      element.textContent = text;
    }
    return element;
  }

  function renderChips(chips) {
    elements.chipRow.replaceChildren(...chips.map((chip) => createElement("span", "legal-chip", chip)));
  }

  function renderStats(stats) {
    const nodes = stats.map(([label, value, copy]) => {
      const card = createElement("article", "legal-stat-card");
      card.append(
        createElement("p", "legal-stat-label", label),
        createElement("p", "legal-stat-value", value),
        createElement("p", "legal-stat-copy", copy)
      );
      return card;
    });
    elements.statGrid.replaceChildren(...nodes);
  }

  function renderSections(sections) {
    const nodes = sections.map((section) => {
      const card = createElement("section", "legal-section-card");
      card.id = section.id;
      card.append(
        createElement("p", "legal-section-kicker", section.kicker),
        createElement("h2", "legal-section-title", section.title)
      );

      for (const copy of section.copies || []) {
        card.append(createElement("p", "legal-section-copy", copy));
      }

      if (Array.isArray(section.list) && section.list.length) {
        const list = createElement("ul", "legal-section-list");
        for (const item of section.list) {
          list.append(createElement("li", "", item));
        }
        card.append(list);
      }

      if (section.note) {
        card.append(createElement("p", "legal-section-note", section.note));
      }

      return card;
    });

    elements.mainContent.replaceChildren(...nodes);
  }

  function renderNav(sections) {
    const nodes = sections.map((section, index) => {
      const link = createElement("a", "legal-nav-link");
      link.href = `#${section.id}`;
      link.append(
        createElement("strong", "", String(index + 1).padStart(2, "0")),
        createElement("span", "", section.navLabel)
      );
      return link;
    });

    elements.navList.replaceChildren(...nodes);
  }

  function applyLanguage(lang, persist = true) {
    const normalized = normalizeLanguage(lang);
    const dictionary = CONTENT[normalized] || CONTENT.en;

    document.documentElement.lang = normalized;
    document.title = dictionary.pageTitle;
    window.setDossierLoaderText?.({
      kicker: dictionary.loaderKicker,
      title: dictionary.loaderTitle,
      copy: dictionary.loaderCopy
    });
    elements.metaDescription?.setAttribute("content", dictionary.metaDescription);
    elements.pageEyebrow.textContent = dictionary.eyebrow;
    elements.pageTitle.textContent = dictionary.title;
    elements.pageSummary.textContent = dictionary.summary;
    elements.langLabel.textContent = dictionary.langLabel;
    elements.sideLabel.textContent = dictionary.side.label;
    elements.sideValue.textContent = dictionary.side.value;
    elements.sideCopy.textContent = dictionary.side.copy;
    elements.primaryAction.textContent = dictionary.actions.primary;
    elements.secondaryAction.textContent = dictionary.actions.secondary;
    elements.navKicker.textContent = dictionary.navKicker;
    elements.footerNote.textContent = dictionary.footerNote;

    renderChips(dictionary.chips);
    renderStats(dictionary.stats);
    renderSections(dictionary.sections);
    renderNav(dictionary.sections);

    elements.langButtons.forEach((button) => {
      const isActive = button.dataset.langOption === normalized;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    if (persist) {
      safeStorageSet(STORAGE_LANG_KEY, normalized);
    }
  }

  elements.langButtons.forEach((button) => {
    button.addEventListener("click", () => applyLanguage(button.dataset.langOption || "en"));
  });

  applyLanguage(detectLanguage(), false);
  loader.ready();
})();
