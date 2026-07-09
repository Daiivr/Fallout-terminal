// events.js — Fallout 76 Events tab logic
// Loaded before app.js; depends on shared globals from config/state/elements and app helpers at runtime.
let fo76EventsTooltipEl = null;
let fo76EventsTooltipTarget = null;

const FO76_EVENT_TITLE_KEY_BY_NORMALIZED_NAME = new Map([
  ["caps-a-plenty", "fo76_event_name_caps_a_plenty"],
  ["double-mutations", "fo76_event_name_double_mutations"],
  ["double-score", "fo76_event_name_double_score"],
  ["double-xp", "fo76_event_name_double_xp"],
  ["fasnacht", "fo76_event_name_fasnacht"],
  ["fasnacht-day", "fo76_event_name_fasnacht_day"],
  ["fasnacht-event", "fo76_event_name_fasnacht"],
  ["gold-rush", "fo76_event_name_gold_rush"],
  ["holiday-scorched", "fo76_event_name_holiday_scorched"],
  ["invaders-from-beyond", "fo76_event_name_invaders_from_beyond"],
  ["invaders-from-beyond-event", "fo76_event_name_invaders_from_beyond"],
  ["legendary-vendor-sale", "fo76_event_name_legendary_vendor_sale"],
  ["meat-week", "fo76_event_name_meat_week"],
  ["mothman-equinox", "fo76_event_name_mothman_equinox"],
  ["murmrgh-s-special-pick", "fo76_event_name_murmrgh_special_pick"],
  ["mutated-public-events", "fo76_event_name_mutated_public_events"],
  ["scrip-surplus", "fo76_event_name_scrip_surplus"],
  ["spooky-scorched", "fo76_event_name_spooky_scorched"],
  ["summer-sock-hop-mini-season", "fo76_event_name_summer_sock_hop_mini_season"],
  ["the-big-bloom", "fo76_event_name_the_big_bloom"],
  ["the-hunt-for-the-treasure-hunter", "fo76_event_name_treasure_hunter"],
  ["treasure-hunter", "fo76_event_name_treasure_hunter"]
]);

const FO76_EVENT_DESCRIPTION_KEY_BY_DETAIL_KEY = new Map([
  ["caps-a-plenty", "fo76_event_description_caps_a_plenty"],
  ["double-mutations", "fo76_event_description_double_mutations"],
  ["double-score", "fo76_event_description_double_score"],
  ["double-xp", "fo76_event_description_double_xp"],
  ["fasnacht", "fo76_event_description_fasnacht"],
  ["gold-rush", "fo76_event_description_gold_rush"],
  ["holiday-scorched", "fo76_event_description_holiday_scorched"],
  ["invaders-from-beyond", "fo76_event_description_invaders_from_beyond"],
  ["legendary-vendor-sale", "fo76_event_description_legendary_vendor_sale"],
  ["meat-week", "fo76_event_description_meat_week"],
  ["mothman-equinox", "fo76_event_description_mothman_equinox"],
  ["murmrgh-s-special-pick", "fo76_event_description_murmrgh_special_pick"],
  ["mutated-public-events", "fo76_event_description_mutated_public_events"],
  ["scrip-surplus", "fo76_event_description_scrip_surplus"],
  ["spooky-scorched", "fo76_event_description_spooky_scorched"],
  ["the-big-bloom", "fo76_event_description_the_big_bloom"],
  ["treasure-hunter", "fo76_event_description_treasure_hunter"]
]);

function normalizeFo76EventTranslationName(value = "") {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .toLowerCase()
    .replace(/\bfallout\s*76\b/g, "")
    .replace(/\bfo76\b/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9']+/g, "-")
    .replace(/'/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFo76EventTitleTranslation(value = "") {
  const title = String(value || "").trim();
  const minervaMatch = title.match(/\bMinerva\s+(Super\s+)?Sale\s*#\s*(\d+)\b/i);
  if (minervaMatch) {
    return {
      key: minervaMatch[1] ? "fo76_event_name_minerva_super_sale" : "fo76_event_name_minerva_sale",
      params: { n: minervaMatch[2] }
    };
  }

  const normalizedName = normalizeFo76EventTranslationName(title)
    .replace(/^hunt-for-the-treasure-hunter$/, "the-hunt-for-the-treasure-hunter");
  const key = FO76_EVENT_TITLE_KEY_BY_NORMALIZED_NAME.get(normalizedName);
  return key ? { key, params: {} } : null;
}

function localizeFo76EventTitle(value = "") {
  const title = String(value || "").trim();
  const translation = getFo76EventTitleTranslation(title);
  return translation ? t(translation.key, translation.params) : title;
}

function localizeFo76EventDescription(detail = {}) {
  const key = FO76_EVENT_DESCRIPTION_KEY_BY_DETAIL_KEY.get(String(detail?.key || "").trim());
  return key ? t(key) : String(detail?.description || "").trim();
}

function localizeFo76EventInfoDetail(detail = null) {
  if (!detail) {
    return null;
  }
  const title = localizeFo76EventTitle(detail.title);
  return {
    ...detail,
    title,
    description: localizeFo76EventDescription(detail),
    imageAlt: localizeFo76EventTitle(detail.imageAlt || detail.title || title)
  };
}

function normalizeFo76EventEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const title = String(entry.title || "").trim();
  const startDate = String(entry.startDate || "").trim();
  const endDate = String(entry.endDate || startDate).trim();
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return null;
  }

  return {
    id: String(entry.id || `${title}-${startDate}-${endDate}`).trim(),
    key: String(entry.key || `${title}|${startDate}`).trim(),
    title,
    startDate,
    endDate,
    color: String(entry.color || "").trim(),
    sourceUrl: String(entry.sourceUrl || "").trim(),
    image: String(entry.image || "").trim(),
    imageAlt: String(entry.imageAlt || title).trim(),
    detailKey: String(entry.detailKey || "").trim(),
    detailType: String(entry.detailType || "").trim()
  };
}

function normalizeFo76EventInfoDetail(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }
  const key = String(entry.key || "").trim();
  const title = String(entry.title || "").trim();
  const description = String(entry.description || "").trim();
  if (!key || !title || !description) {
    return null;
  }
  const type = String(entry.type || "").trim().toLowerCase() === "weekend" ? "weekend" : "seasonal";
  return {
    key,
    type,
    title,
    description,
    image: String(entry.image || "").trim(),
    imageAlt: String(entry.imageAlt || title).trim()
  };
}

function normalizeFo76EventInfo(payload) {
  const info = payload && typeof payload === "object" ? payload : {};
  const details = Array.isArray(info.details)
    ? info.details.map((entry) => normalizeFo76EventInfoDetail(entry)).filter(Boolean)
    : [];
  return {
    seasonalIntro: Array.isArray(info.seasonalIntro)
      ? info.seasonalIntro.map((line) => String(line || "").trim()).filter(Boolean)
      : [],
    weekendIntro: Array.isArray(info.weekendIntro)
      ? info.weekendIntro.map((line) => String(line || "").trim()).filter(Boolean)
      : [],
    details
  };
}

function normalizeFo76CalendarDay(day, eventById = new Map()) {
  if (!day || typeof day !== "object") {
    return null;
  }

  const date = String(day.date || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  const events = Array.isArray(day.events)
    ? day.events.map((event) => {
      const id = String(event?.id || "").trim();
      const fullEvent = eventById.get(id);
      const title = String(event?.title || fullEvent?.title || "").trim();
      if (!id || !title) {
        return null;
      }
      return {
        id,
        title,
        color: String(event?.color || fullEvent?.color || "").trim(),
        sourceUrl: String(event?.sourceUrl || fullEvent?.sourceUrl || "").trim(),
        isStart: Boolean(event?.isStart),
        isEnd: Boolean(event?.isEnd)
      };
    }).filter(Boolean)
    : [];

  return {
    date,
    events
  };
}

function normalizeFo76EventsPayload(payload) {
  const sourceUrl = String(payload?.sourceUrl || "").trim();
  const events = Array.isArray(payload?.events)
    ? payload.events.map((entry) => normalizeFo76EventEntry(entry)).filter(Boolean)
    : [];
  const eventById = new Map(events.map((event) => [event.id, event]));
  const days = Array.isArray(payload?.days)
    ? payload.days.map((day) => normalizeFo76CalendarDay(day, eventById)).filter(Boolean)
    : [];

  return {
    source: String(payload?.source || "Community calendar").trim() || "Community calendar",
    sourceUrl,
    fetchedAt: String(payload?.fetchedAt || "").trim(),
    cached: Boolean(payload?.cached),
    stale: Boolean(payload?.stale),
    error: String(payload?.error || "").trim(),
    range: {
      startDate: String(payload?.range?.startDate || days[0]?.date || "").trim(),
      endDate: String(payload?.range?.endDate || days[days.length - 1]?.date || "").trim()
    },
    days,
    events,
    eventInfo: normalizeFo76EventInfo(payload?.eventInfo)
  };
}

function getFo76MinervaListNumber(title = "") {
  const match = String(title || "").match(/\bMinerva\s+(?:Super\s+)?Sale\s*#\s*(\d+)\b/i);
  if (!match) {
    return null;
  }
  const listNumber = Number(match[1]);
  return Number.isInteger(listNumber) && listNumber > 0 ? listNumber : null;
}

function getFo76EventAction(event = {}) {
  const minervaListNumber = getFo76MinervaListNumber(event.title);
  if (minervaListNumber) {
    return {
      type: "minerva-list",
      label: t("fo76_events_view_minerva_list"),
      listNumber: minervaListNumber
    };
  }

  if (event.detailKey && event.detailType) {
    return {
      type: "event-info",
      label: t("fo76_events_view_event_info"),
      listNumber: null
    };
  }

  return {
    type: "tracked",
    label: t("fo76_events_no_detail"),
    listNumber: null
  };
}

function fo76DateKeyToUtcDate(dateKey) {
  const [year, month, day] = String(dateKey || "").split("-").map((part) => Number(part));
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function getFo76TodayKey(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatFo76CalendarDay(dateKey, { month = "short", includeWeekday = false } = {}) {
  const date = fo76DateKeyToUtcDate(dateKey);
  if (!date) {
    return dateKey || "--";
  }

  return new Intl.DateTimeFormat(state.lang === "es" ? "es-US" : "en-US", {
    timeZone: "UTC",
    weekday: includeWeekday ? "short" : undefined,
    month,
    day: "2-digit"
  }).format(date);
}

function formatFo76DateRange(startDate, endDate) {
  if (!startDate) {
    return "--";
  }
  if (!endDate || startDate === endDate) {
    return formatFo76CalendarDay(startDate, { includeWeekday: true });
  }
  return `${formatFo76CalendarDay(startDate, { includeWeekday: true })} - ${formatFo76CalendarDay(endDate, { includeWeekday: true })}`;
}

function getFo76EventState(event, todayKey = getFo76TodayKey()) {
  if (event.startDate <= todayKey && event.endDate >= todayKey) {
    return "active";
  }
  if (event.startDate > todayKey) {
    return "upcoming";
  }
  return "past";
}

function compareFo76DateKeys(a, b) {
  return String(a || "").localeCompare(String(b || ""));
}

function buildFo76EventLaneMap(events) {
  const lanes = [];
  const eventLaneMap = new Map();

  events
    .map((event, index) => ({ ...event, sourceIndex: index }))
    .sort((a, b) => (
      compareFo76DateKeys(a.startDate, b.startDate)
      || compareFo76DateKeys(a.endDate, b.endDate)
      || a.sourceIndex - b.sourceIndex
      || a.title.localeCompare(b.title)
    ))
    .forEach((event) => {
      let laneIndex = lanes.findIndex((laneEndDate) => compareFo76DateKeys(laneEndDate, event.startDate) < 0);
      if (laneIndex < 0) {
        laneIndex = lanes.length;
      }
      lanes[laneIndex] = event.endDate;
      eventLaneMap.set(event.id, laneIndex);
    });

  return eventLaneMap;
}

function getFo76WeekSegments(weekDays, events, eventLaneMap = new Map()) {
  const firstDay = weekDays[0]?.date || "";
  const lastDay = weekDays[weekDays.length - 1]?.date || "";
  if (!firstDay || !lastDay) {
    return {
      rowCount: 1,
      segments: []
    };
  }

  const weekDayIndex = new Map(weekDays.map((day, index) => [day.date, index]));
  const overlappingEvents = events
    .map((event, index) => ({ ...event, sourceIndex: index }))
    .filter((event) => compareFo76DateKeys(event.endDate, firstDay) >= 0 && compareFo76DateKeys(event.startDate, lastDay) <= 0)
    .sort((a, b) => (
      compareFo76DateKeys(a.startDate, b.startDate)
      || compareFo76DateKeys(a.endDate, b.endDate)
      || a.sourceIndex - b.sourceIndex
      || a.title.localeCompare(b.title)
    ));

  const segments = [];
  let maxLane = 0;

  for (const event of overlappingEvents) {
    const visibleStart = compareFo76DateKeys(event.startDate, firstDay) < 0 ? firstDay : event.startDate;
    const visibleEnd = compareFo76DateKeys(event.endDate, lastDay) > 0 ? lastDay : event.endDate;
    const startIndex = weekDayIndex.has(visibleStart) ? weekDayIndex.get(visibleStart) : 0;
    const endIndex = weekDayIndex.has(visibleEnd) ? weekDayIndex.get(visibleEnd) : weekDays.length - 1;
    const startCol = startIndex + 1;
    const endCol = endIndex + 2;
    const laneIndex = Number.isInteger(eventLaneMap.get(event.id)) ? eventLaneMap.get(event.id) : 0;
    maxLane = Math.max(maxLane, laneIndex);

    segments.push({
      ...event,
      startCol,
      endCol,
      lane: laneIndex + 1,
      startsInWeek: event.startDate >= firstDay,
      endsInWeek: event.endDate <= lastDay
    });
  }

  return {
    rowCount: segments.length ? maxLane + 1 : 1,
    segments: segments.sort((a, b) => a.lane - b.lane || a.startCol - b.startCol || a.sourceIndex - b.sourceIndex)
  };
}

function buildFo76EventIconMarkup(event, variant) {
  const imageUrl = String(event?.image || "").trim();
  if (!/^https?:\/\//i.test(imageUrl)) {
    return "";
  }
  return `<img class="fo76-events-event-icon fo76-events-${variant}-icon" src="${escapeHtml(imageUrl)}" alt="" loading="lazy" decoding="async" />`;
}

function buildFo76CalendarMarkup(data) {
  const days = Array.isArray(data?.days) ? data.days : [];
  const events = Array.isArray(data?.events) ? data.events : [];
  if (!days.length || !events.length) {
    return `<p class="fo76-events-empty">${escapeHtml(t("fo76_events_empty"))}</p>`;
  }

  const todayKey = getFo76TodayKey();
  const weekdayLabels = state.lang === "es"
    ? ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"]
    : ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const todayDate = fo76DateKeyToUtcDate(todayKey);
  const todayWeekdayIndex = todayDate && days.some((day) => day.date === todayKey)
    ? (todayDate.getUTCDay() + 6) % 7
    : -1;
  const upcoming = events
    .filter((event) => event.endDate >= todayKey)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title))
    .slice(0, 3);
  const weeks = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  const eventLaneMap = buildFo76EventLaneMap(events);

  const upcomingMarkup = upcoming.length
    ? upcoming.map((event) => {
      const stateKey = getFo76EventState(event, todayKey);
      const labelKey = stateKey === "active" ? "fo76_events_active" : "fo76_events_upcoming";
      const action = getFo76EventAction(event);
      const eventTitle = localizeFo76EventTitle(event.title);
      const actionMarkup = action.type === "minerva-list"
        ? `<button type="button" class="fo76-events-agenda-action" data-fo76-event-action="minerva-list" data-minerva-list="${escapeHtml(action.listNumber)}" data-event-title="${escapeHtml(event.title)}">${escapeHtml(action.label)}</button>`
        : action.type === "event-info"
          ? `<button type="button" class="fo76-events-agenda-action" data-fo76-event-action="event-info" data-event-id="${escapeHtml(event.id)}">${escapeHtml(action.label)}</button>`
        : `<span class="fo76-events-agenda-action is-static">${escapeHtml(t("fo76_events_tracked"))}</span>`;
      const agendaIconMarkup = buildFo76EventIconMarkup(event, "agenda");
      return `
        <article class="fo76-events-agenda-item is-${escapeHtml(stateKey)}" style="--event-color:${escapeHtml(event.color || "rgba(139,255,139,1)")};">
          <span class="fo76-events-agenda-media" aria-hidden="true">${agendaIconMarkup || "◆"}</span>
          <div>
            <span class="fo76-events-agenda-state">${escapeHtml(t(labelKey))}</span>
            <h3>${escapeHtml(eventTitle)}</h3>
            <p>${escapeHtml(formatFo76DateRange(event.startDate, event.endDate))}</p>
          </div>
          ${actionMarkup}
        </article>
      `;
    }).join("")
    : `<p class="fo76-events-empty">${escapeHtml(t("fo76_events_no_upcoming"))}</p>`;

  const weekModels = weeks.map((week) => ({
    week,
    model: getFo76WeekSegments(week, events, eventLaneMap)
  }));
  const calendarRowCount = weekModels.reduce((maxRows, entry) => Math.max(maxRows, entry.model.rowCount || 1), 1);

  const calendarMarkup = weekModels.map(({ week, model: weekModel }) => {
    return `
    <div class="fo76-events-week" role="row" style="--event-rows:${calendarRowCount};">
      ${week.map((day, dayIndex) => {
        const isToday = day.date === todayKey;
        const isPast = day.date < todayKey;
        const isWeekend = dayIndex >= 5;
        const isMonthStart = day.date.endsWith("-01");
        const todayTagMarkup = isToday
          ? `<span class="fo76-events-day-today">${escapeHtml(t("fo76_events_today"))}</span>`
          : "";
        return `
          <div class="fo76-events-day${isToday ? " is-today" : ""}${isPast ? " is-past" : ""}${isWeekend ? " is-weekend" : ""}${isMonthStart ? " is-month-start" : ""}" role="gridcell" style="--day-col:${dayIndex + 1};">
            <div class="fo76-events-day-label">${todayTagMarkup}${escapeHtml(formatFo76CalendarDay(day.date))}</div>
          </div>
        `;
      }).join("")}
      ${weekModel.segments.map((event) => {
        const stateKey = getFo76EventState(event, todayKey);
        const eventDateRange = formatFo76DateRange(event.startDate, event.endDate);
        const eventTitle = localizeFo76EventTitle(event.title);
        const eventLabel = `${eventTitle} / ${eventDateRange}`;
        const action = getFo76EventAction(event);
        const minervaData = action.listNumber ? ` data-minerva-list="${escapeHtml(action.listNumber)}"` : "";
        const eventIdData = event.id ? ` data-event-id="${escapeHtml(event.id)}"` : "";
        const showsBarHead = event.startsInWeek || event.startCol === 1;
        const barIconMarkup = showsBarHead ? buildFo76EventIconMarkup(event, "bar") : "";
        return `
          <button
            type="button"
            class="fo76-events-bar is-${escapeHtml(stateKey)}${event.startsInWeek ? " is-start" : " is-carry-in"}${event.endsInWeek ? " is-end" : " is-carry-out"}"
            data-fo76-event-action="${escapeHtml(action.type)}"
            data-event-title="${escapeHtml(event.title)}"
            ${minervaData}
            ${eventIdData}
            data-tooltip-title="${escapeHtml(eventTitle)}"
            data-tooltip-meta="${escapeHtml(eventDateRange)}"
            data-tooltip-action="${escapeHtml(action.label)}"
            data-tooltip-image="${escapeHtml(event.image || "")}"
            style="--start-col:${event.startCol};--end-col:${event.endCol};--event-row:${event.lane + 1};--event-color:${escapeHtml(event.color || "rgba(139,255,139,1)")};"
            aria-label="${escapeHtml(eventLabel)}"
          >
            ${barIconMarkup}<span class="fo76-events-bar-label">${escapeHtml(showsBarHead ? eventTitle : "")}</span>
          </button>
        `;
      }).join("")}
    </div>
    `;
  }).join("");

  return `
    <section class="fo76-events-agenda" aria-label="${escapeHtml(t("fo76_events_next_label"))}">
      <div class="fo76-events-section-head">
        <span>${escapeHtml(t("fo76_events_next_label"))}</span>
        <strong>${escapeHtml(String(upcoming.length))}</strong>
      </div>
      <div class="fo76-events-agenda-list">${upcomingMarkup}</div>
    </section>
    <section class="fo76-events-calendar" aria-label="${escapeHtml(t("fo76_events_calendar_label"))}">
      <div class="fo76-events-weekdays" aria-hidden="true">
        ${weekdayLabels.map((label, index) => `<span${index === todayWeekdayIndex ? " class=\"is-today\"" : ""}>${escapeHtml(label)}</span>`).join("")}
      </div>
      <div class="fo76-events-weeks" role="grid">${calendarMarkup}</div>
    </section>
  `;
}

function getFo76EventsTooltipElement() {
  if (fo76EventsTooltipEl instanceof HTMLElement) {
    return fo76EventsTooltipEl;
  }

  const tooltip = document.createElement("div");
  tooltip.className = "fo76-events-floating-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;

  const head = document.createElement("span");
  head.className = "fo76-events-floating-tooltip-head";

  const icon = document.createElement("img");
  icon.className = "fo76-events-floating-tooltip-icon";
  icon.alt = "";
  icon.decoding = "async";
  icon.hidden = true;
  icon.addEventListener("error", () => {
    icon.dataset.failedSrc = icon.src;
    icon.hidden = true;
  });

  const title = document.createElement("span");
  title.className = "fo76-events-floating-tooltip-title";

  const meta = document.createElement("span");
  meta.className = "fo76-events-floating-tooltip-meta";

  const action = document.createElement("span");
  action.className = "fo76-events-floating-tooltip-action";

  head.append(icon, title);
  tooltip.append(head, meta, action);
  document.body.appendChild(tooltip);
  fo76EventsTooltipEl = tooltip;
  return tooltip;
}

function positionFo76EventsTooltip() {
  if (!(fo76EventsTooltipEl instanceof HTMLElement) || !(fo76EventsTooltipTarget instanceof HTMLElement)) {
    return;
  }

  const targetRect = fo76EventsTooltipTarget.getBoundingClientRect();
  const tooltip = fo76EventsTooltipEl;
  const gapPx = 10;
  const edgePx = 10;
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  let leftPx = targetRect.left + 8;
  let topPx = targetRect.top - tooltipHeight - gapPx;
  let placement = "top";

  if (topPx < edgePx) {
    topPx = targetRect.bottom + gapPx;
    placement = "bottom";
  }

  leftPx = Math.max(edgePx, Math.min(leftPx, window.innerWidth - tooltipWidth - edgePx));
  topPx = Math.max(edgePx, Math.min(topPx, window.innerHeight - tooltipHeight - edgePx));

  tooltip.style.left = `${Math.round(leftPx)}px`;
  tooltip.style.top = `${Math.round(topPx)}px`;
  tooltip.dataset.placement = placement;
}

function showFo76EventsTooltip(target) {
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const tooltip = getFo76EventsTooltipElement();
  const title = tooltip.querySelector(".fo76-events-floating-tooltip-title");
  const meta = tooltip.querySelector(".fo76-events-floating-tooltip-meta");
  const action = tooltip.querySelector(".fo76-events-floating-tooltip-action");
  if (title) {
    title.textContent = target.dataset.tooltipTitle || "";
  }
  if (meta) {
    meta.textContent = target.dataset.tooltipMeta || "";
  }
  if (action) {
    action.textContent = target.dataset.tooltipAction || t("fo76_events_open_event");
  }

  const icon = tooltip.querySelector(".fo76-events-floating-tooltip-icon");
  if (icon instanceof HTMLImageElement) {
    const imageUrl = String(target.dataset.tooltipImage || "").trim();
    const validImageUrl = /^https?:\/\//i.test(imageUrl) ? imageUrl : "";
    if (validImageUrl && icon.src !== validImageUrl) {
      icon.src = validImageUrl;
    }
    icon.hidden = !validImageUrl || icon.dataset.failedSrc === validImageUrl;
  }

  tooltip.style.setProperty("--event-color", getComputedStyle(target).getPropertyValue("--event-color") || "rgba(139,255,139,1)");
  tooltip.hidden = false;
  fo76EventsTooltipTarget = target;
  positionFo76EventsTooltip();
  tooltip.classList.add("is-active");
}

function hideFo76EventsTooltip() {
  fo76EventsTooltipTarget = null;
  if (!(fo76EventsTooltipEl instanceof HTMLElement)) {
    return;
  }
  fo76EventsTooltipEl.classList.remove("is-active");
  fo76EventsTooltipEl.hidden = true;
}

function handleFo76EventsTooltipEnter(event) {
  const target = event.target instanceof Element ? event.target.closest(".fo76-events-bar") : null;
  if (!(target instanceof HTMLElement) || !elements.fo76EventsContent?.contains(target)) {
    return;
  }
  showFo76EventsTooltip(target);
}

function handleFo76EventsTooltipLeave(event) {
  const target = event.target instanceof Element ? event.target.closest(".fo76-events-bar") : null;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const relatedTarget = event.relatedTarget instanceof Element ? event.relatedTarget : null;
  if (relatedTarget && target.contains(relatedTarget)) {
    return;
  }
  hideFo76EventsTooltip();
}

function handleFo76EventIconError(event) {
  const target = event.target;
  if (target instanceof HTMLImageElement && target.classList.contains("fo76-events-event-icon")) {
    target.hidden = true;
  }
}

function renderFo76EventsModal() {
  const modalState = state.fo76Events;
  const data = modalState.data;
  const hasData = Boolean(data?.days?.length);
  const isPage = state.view === "events" && document.body.classList.contains("is-events");
  const isOpen = Boolean(modalState.open || isPage);

  if (elements.fo76EventsBtn) {
    elements.fo76EventsBtn.textContent = t("fo76_events_button");
  }
  if (!elements.fo76EventsOverlay) {
    if (!isPage) {
      state.fo76Events.open = false;
    }
    return;
  }

  if (elements.fo76EventsBadge) {
    elements.fo76EventsBadge.textContent = t("fo76_events_badge");
  }
  if (elements.fo76EventsTitle) {
    elements.fo76EventsTitle.textContent = t("fo76_events_title");
  }
  if (elements.fo76EventsBody) {
    elements.fo76EventsBody.textContent = t("fo76_events_body");
  }
  if (elements.fo76EventsMeta) {
    const rangeText = hasData && data.range?.startDate
      ? `${formatFo76CalendarDay(data.range.startDate)} - ${formatFo76CalendarDay(data.range.endDate)}`
      : "--";
    const syncText = hasData && data.fetchedAt
      ? t("fo76_events_meta_updated", { time: formatFileDateTime(data.fetchedAt), range: rangeText })
      : t("fo76_events_meta_loading");
    elements.fo76EventsMeta.textContent = data?.stale
      ? `${syncText} / ${t("fo76_events_stale")}`
      : syncText;
  }
  if (elements.fo76EventsRefreshBtn) {
    elements.fo76EventsRefreshBtn.textContent = modalState.loading ? t("fo76_events_refreshing") : t("fo76_events_refresh");
    elements.fo76EventsRefreshBtn.disabled = Boolean(modalState.loading);
  }
  if (elements.fo76RoadMapBtn) {
    elements.fo76RoadMapBtn.textContent = t("fo76_roadmap_button");
    elements.fo76RoadMapBtn.setAttribute("aria-label", t("fo76_roadmap_open"));
  }
  if (elements.fo76EventsCloseBtn) {
    elements.fo76EventsCloseBtn.textContent = t("fo76_events_close");
  }
  if (elements.fo76EventsCloseIconBtn) {
    elements.fo76EventsCloseIconBtn.setAttribute("aria-label", t("fo76_events_close"));
  }
  if (elements.fo76EventsCore) {
    elements.fo76EventsCore.setAttribute("role", isPage ? "region" : "dialog");
    elements.fo76EventsCore.setAttribute("aria-modal", isPage ? "false" : "true");
  }
  if (elements.fo76EventsStatus) {
    let statusText = "";
    if (modalState.loading) {
      statusText = t("fo76_events_loading");
    } else if (modalState.error) {
      statusText = modalState.error;
    } else if (!hasData && data?.error) {
      statusText = data.error;
    }
    elements.fo76EventsStatus.hidden = !statusText;
    elements.fo76EventsStatus.textContent = statusText || t("fo76_events_loading");
  }
  if (elements.fo76EventsContent) {
    hideFo76EventsTooltip();
    elements.fo76EventsContent.hidden = !hasData;
    elements.fo76EventsContent.innerHTML = hasData ? buildFo76CalendarMarkup(data) : "";
  }

  elements.fo76EventsOverlay.classList.toggle("is-active", isOpen);
  elements.fo76EventsOverlay.classList.toggle("is-page-view", isPage);
  elements.fo76EventsOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
  syncFo76ModalBodyClass();
  syncTopTabForCurrentView();
}

function closeFo76EventsModal() {
  hideFo76EventsTooltip();
  closeFo76RoadMapModal();
  if (state.view === "events" && document.body.classList.contains("is-events")) {
    showIntelPage({ updateHash: true });
    return;
  }
  state.fo76Events.open = false;
  renderFo76EventsModal();
}

function syncFo76ModalBodyClass() {
  document.body.classList.toggle(
    "is-classified-intel-open",
    Boolean(state.fo76Events.open || state.fo76RoadMap.open || state.fo76MinervaList.open || state.fo76EventInfo.open)
  );
}

const FO76_ROADMAP_LENS_DEFAULT_ZOOM = 2.5;
const FO76_ROADMAP_LENS_MIN_ZOOM = 1.5;
const FO76_ROADMAP_LENS_MAX_ZOOM = 4;
let fo76RoadMapLensPointer = null;

function clampFo76RoadMapLensZoom(value) {
  const zoom = Number(value);
  if (!Number.isFinite(zoom)) {
    return FO76_ROADMAP_LENS_DEFAULT_ZOOM;
  }
  return Math.min(FO76_ROADMAP_LENS_MAX_ZOOM, Math.max(FO76_ROADMAP_LENS_MIN_ZOOM, zoom));
}

function formatFo76RoadMapLensZoom(value) {
  const zoom = clampFo76RoadMapLensZoom(value);
  return Number.isInteger(zoom) ? `${zoom}x` : `${zoom.toFixed(2).replace(/0$/, "")}x`;
}

function renderFo76RoadMapModal() {
  const isOpen = Boolean(state.fo76RoadMap.open);
  const lensZoom = clampFo76RoadMapLensZoom(state.fo76RoadMap.lensZoom);
  const lensZoomText = formatFo76RoadMapLensZoom(lensZoom);
  state.fo76RoadMap.lensZoom = lensZoom;

  if (!elements.fo76RoadMapOverlay) {
    state.fo76RoadMap.open = false;
    return;
  }

  if (elements.fo76RoadMapBadge) {
    elements.fo76RoadMapBadge.textContent = t("fo76_roadmap_badge");
  }
  if (elements.fo76RoadMapTitle) {
    elements.fo76RoadMapTitle.textContent = t("fo76_roadmap_title");
  }
  if (elements.fo76RoadMapBody) {
    elements.fo76RoadMapBody.textContent = t("fo76_roadmap_body");
  }
  if (elements.fo76RoadMapImage) {
    elements.fo76RoadMapImage.setAttribute("alt", t("fo76_roadmap_image_alt"));
  }
  if (elements.fo76RoadMapLensLabel) {
    const label = elements.fo76RoadMapLensLabel.querySelector("span");
    if (label) {
      label.textContent = t("fo76_roadmap_lens_label");
    }
  }
  if (elements.fo76RoadMapLensInput) {
    elements.fo76RoadMapLensInput.value = String(lensZoom);
    elements.fo76RoadMapLensInput.setAttribute("aria-label", t("fo76_roadmap_lens_slider"));
    elements.fo76RoadMapLensInput.setAttribute("title", t("fo76_roadmap_lens_slider"));
  }
  if (elements.fo76RoadMapLensValue) {
    elements.fo76RoadMapLensValue.textContent = t("fo76_roadmap_lens_value", { zoom: lensZoomText });
  }
  if (elements.fo76RoadMapLens) {
    elements.fo76RoadMapLens.style.setProperty("--fo76-roadmap-lens-zoom", String(lensZoom));
  }
  if (elements.fo76RoadMapCloseBtn) {
    elements.fo76RoadMapCloseBtn.textContent = t("fo76_roadmap_close");
  }
  if (elements.fo76RoadMapCloseIconBtn) {
    elements.fo76RoadMapCloseIconBtn.setAttribute("aria-label", t("fo76_roadmap_close"));
  }

  elements.fo76RoadMapOverlay.classList.toggle("is-active", isOpen);
  elements.fo76RoadMapOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
  syncFo76ModalBodyClass();
}

function closeFo76RoadMapModal() {
  state.fo76RoadMap.open = false;
  fo76RoadMapLensPointer = null;
  hideFo76RoadMapLens();
  renderFo76RoadMapModal();
}

function openFo76RoadMapModal() {
  state.fo76RoadMap.open = true;
  renderFo76RoadMapModal();
}

function hideFo76RoadMapLens() {
  fo76RoadMapLensPointer = null;
  elements.fo76RoadMapLens?.classList.remove("is-active");
  if (elements.fo76RoadMapLens) {
    elements.fo76RoadMapLens.hidden = true;
  }
  elements.fo76RoadMapFrame?.classList.remove("is-lens-active");
}

function updateFo76RoadMapLens(clientX, clientY) {
  const frame = elements.fo76RoadMapFrame;
  const image = elements.fo76RoadMapImage;
  const lens = elements.fo76RoadMapLens;
  if (!(frame instanceof HTMLElement) || !(image instanceof HTMLImageElement) || !(lens instanceof HTMLElement)) {
    return;
  }
  const frameRect = frame.getBoundingClientRect();
  const imageRect = image.getBoundingClientRect();
  const isInsideImage = clientX >= imageRect.left
    && clientX <= imageRect.right
    && clientY >= imageRect.top
    && clientY <= imageRect.bottom;
  if (!isInsideImage || imageRect.width <= 0 || imageRect.height <= 0) {
    hideFo76RoadMapLens();
    return;
  }

  fo76RoadMapLensPointer = { clientX, clientY };
  const zoom = clampFo76RoadMapLensZoom(state.fo76RoadMap.lensZoom);
  lens.hidden = false;
  const lensRect = lens.getBoundingClientRect();
  const lensSize = lensRect.width || 240;
  const imageX = clientX - imageRect.left;
  const imageY = clientY - imageRect.top;
  const frameX = clientX - frameRect.left + frame.scrollLeft;
  const frameY = clientY - frameRect.top + frame.scrollTop;
  lens.classList.add("is-active");
  frame.classList.add("is-lens-active");
  lens.style.left = `${frameX}px`;
  lens.style.top = `${frameY}px`;
  lens.style.backgroundImage = `url("${image.currentSrc || image.src}")`;
  lens.style.backgroundSize = `${imageRect.width * zoom}px ${imageRect.height * zoom}px`;
  lens.style.backgroundPosition = `${(lensSize / 2) - (imageX * zoom)}px ${(lensSize / 2) - (imageY * zoom)}px`;
}

function handleFo76RoadMapLensPointerMove(event) {
  updateFo76RoadMapLens(event.clientX, event.clientY);
}

function handleFo76RoadMapLensZoomInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }
  state.fo76RoadMap.lensZoom = clampFo76RoadMapLensZoom(target.value);
  renderFo76RoadMapModal();
  if (fo76RoadMapLensPointer) {
    updateFo76RoadMapLens(fo76RoadMapLensPointer.clientX, fo76RoadMapLensPointer.clientY);
  }
}

function handleFo76RoadMapLensWheel(event) {
  if (!elements.fo76RoadMapFrame?.classList.contains("is-lens-active")) {
    return;
  }
  event.preventDefault();
  const direction = event.deltaY < 0 ? 1 : -1;
  state.fo76RoadMap.lensZoom = clampFo76RoadMapLensZoom(state.fo76RoadMap.lensZoom + (direction * 0.25));
  renderFo76RoadMapModal();
  if (fo76RoadMapLensPointer) {
    updateFo76RoadMapLens(fo76RoadMapLensPointer.clientX, fo76RoadMapLensPointer.clientY);
  }
}

function getFo76EventById(eventId) {
  const id = String(eventId || "").trim();
  const events = Array.isArray(state.fo76Events.data?.events) ? state.fo76Events.data.events : [];
  return events.find((event) => event.id === id) || null;
}

function getFo76EventInfoDetail(event = {}) {
  const detailKey = String(event?.detailKey || "").trim();
  const details = Array.isArray(state.fo76Events.data?.eventInfo?.details)
    ? state.fo76Events.data.eventInfo.details
    : [];
  return details.find((detail) => detail.key === detailKey) || null;
}

function renderFo76EventInfoModal() {
  const modalState = state.fo76EventInfo;
  const event = modalState.event;
  const detail = localizeFo76EventInfoDetail(modalState.detail);
  const isOpen = Boolean(modalState.open);

  if (!elements.fo76EventInfoOverlay) {
    state.fo76EventInfo.open = false;
    return;
  }

  const title = detail?.title || localizeFo76EventTitle(event?.title || "") || t("fo76_events_title");
  const typeLabel = detail?.type === "weekend"
    ? t("fo76_event_info_weekend")
    : t("fo76_event_info_seasonal");

  if (elements.fo76EventInfoBadge) {
    elements.fo76EventInfoBadge.textContent = t("fo76_event_info_badge");
  }
  if (elements.fo76EventInfoTitle) {
    const titleIconMarkup = event ? buildFo76EventIconMarkup(event, "title") : "";
    if (titleIconMarkup) {
      elements.fo76EventInfoTitle.innerHTML = `${titleIconMarkup}${escapeHtml(title)}`;
    } else {
      elements.fo76EventInfoTitle.textContent = title;
    }
  }
  if (elements.fo76EventInfoBody) {
    elements.fo76EventInfoBody.textContent = t("fo76_event_info_body");
  }
  if (elements.fo76EventInfoCloseBtn) {
    elements.fo76EventInfoCloseBtn.textContent = t("fo76_event_info_close");
  }
  if (elements.fo76EventInfoCloseIconBtn) {
    elements.fo76EventInfoCloseIconBtn.setAttribute("aria-label", t("fo76_event_info_close"));
  }

  if (elements.fo76EventInfoContent) {
    const hasDetail = Boolean(event && detail);
    elements.fo76EventInfoContent.hidden = !hasDetail;
    if (hasDetail) {
      const dateRange = formatFo76DateRange(event.startDate, event.endDate);
      const heroIconMarkup = buildFo76EventIconMarkup(event, "hero");
      const mediaMarkup = detail.image
        ? `<figure class="fo76-event-info-figure"><img src="${escapeHtml(detail.image)}" alt="${escapeHtml(detail.imageAlt || title)}" loading="lazy" decoding="async" /></figure>`
        : heroIconMarkup
          ? `<figure class="fo76-event-info-figure is-icon">${heroIconMarkup}</figure>`
          : "";
      const stateKey = getFo76EventState(event);
      const stateChipMarkup = stateKey === "active" || stateKey === "upcoming"
        ? `<span class="is-state is-${escapeHtml(stateKey)}">${escapeHtml(t(stateKey === "active" ? "fo76_events_active" : "fo76_events_upcoming"))}</span>`
        : "";
      elements.fo76EventInfoContent.innerHTML = `
        <div class="fo76-event-info-layout${mediaMarkup ? "" : " is-no-image"}" style="--event-color:${escapeHtml(event.color || "rgba(139,255,139,1)")};">
          ${mediaMarkup}
          <div class="fo76-event-info-copy">
            <div class="fo76-event-info-meta">
              ${stateChipMarkup}
              <span class="is-type">${escapeHtml(typeLabel)}</span>
              <span>${escapeHtml(t("fo76_event_info_window"))}: ${escapeHtml(dateRange)}</span>
            </div>
            <section class="fo76-event-info-notes">
              <h3>${escapeHtml(t("fo76_event_info_description"))}</h3>
              <p>${escapeHtml(detail.description)}</p>
            </section>
          </div>
        </div>
      `;
    } else {
      elements.fo76EventInfoContent.innerHTML = "";
    }
  }

  elements.fo76EventInfoOverlay.classList.toggle("is-active", isOpen);
  elements.fo76EventInfoOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
  syncFo76ModalBodyClass();
}

function closeFo76EventInfoModal() {
  state.fo76EventInfo.open = false;
  state.fo76EventInfo.event = null;
  state.fo76EventInfo.detail = null;
  renderFo76EventInfoModal();
}

function openFo76EventInfoModal(eventId) {
  const event = getFo76EventById(eventId);
  const detail = getFo76EventInfoDetail(event);
  if (!event || !detail) {
    return;
  }
  hideFo76EventsTooltip();
  state.fo76EventInfo.open = true;
  state.fo76EventInfo.event = event;
  state.fo76EventInfo.detail = detail;
  renderFo76EventInfoModal();
}

function normalizeFo76MinervaInventoryItem(item = {}) {
  const name = String(item?.Name || item?.name || "").trim();
  const wikiUrl = normalizeWikiUrl(item?.WikiUrl || item?.wikiUrl || item?.url || "");
  const numericPrice = Number(item?.Price ?? item?.price);
  const price = Number.isFinite(numericPrice) ? numericPrice : null;
  if (!name) {
    return null;
  }
  return {
    Name: name,
    name,
    WikiUrl: wikiUrl,
    url: wikiUrl,
    Price: price,
    price
  };
}

function getFo76MinervaListFromState(listNumber) {
  const numericListNumber = Number(listNumber);
  if (!Number.isInteger(numericListNumber) || numericListNumber < 1 || !Array.isArray(state.minervaLists)) {
    return null;
  }
  return state.minervaLists.find((entry) => Number(entry?.ListNumber) === numericListNumber) || null;
}

function buildFo76MinervaDetailMarkup() {
  const detailState = state.fo76MinervaList.detail;
  const item = detailState.item;
  const detail = detailState.data;

  if (detailState.loading) {
    return `<p class="fo76-minerva-detail-state">${escapeHtml(t("fo76_minerva_detail_loading"))}</p>`;
  }

  if (detailState.error) {
    return `<p class="fo76-minerva-detail-state is-error">${escapeHtml(detailState.error)}</p>`;
  }

  if (!item) {
    return `<p class="fo76-minerva-detail-state">${escapeHtml(t("fo76_minerva_detail_prompt"))}</p>`;
  }

  if (!detail) {
    return `<p class="fo76-minerva-detail-state">${escapeHtml(t("fo76_minerva_detail_prompt"))}</p>`;
  }

  const fallbackImageUrl = state.minervaDetail.fallbackImageUrl || MINERVA_DETAIL_FALLBACK_IMAGE;
  const imageUrl = detail.imageUrl || fallbackImageUrl;
  const itemName = item.name || item.Name || "";
  const whereElse = Array.isArray(detail.whereElse) && detail.whereElse.length
    ? detail.whereElse
    : [t("minerva_detail_no_other_sources")];
  const whereMarkup = whereElse
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");
  const unlocks = detail.unlocks || t("minerva_detail_no_unlocks");

  return `
    <div class="fo76-minerva-detail-card">
      <div class="fo76-minerva-detail-top">
        ${imageUrl ? `<img class="fo76-minerva-detail-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(`${itemName} image`)}" loading="lazy" decoding="async" />` : ""}
        <div class="fo76-minerva-detail-heading">
          <span>${escapeHtml(t("fo76_events_view_minerva_list"))}</span>
          <h3>${escapeHtml(itemName)}</h3>
          <p><span class="fo76-icon" aria-hidden="true">${escapeHtml(GOLD_BULLION_GLYPH)}</span>${escapeHtml(item.price == null ? t("fo76_minerva_detail_no_price") : Number(item.price).toLocaleString())}</p>
        </div>
      </div>
      <div class="fo76-minerva-detail-grid">
        <section>
          <h4>${escapeHtml(t("fo76_minerva_detail_where"))}</h4>
          <ul>${whereMarkup}</ul>
        </section>
        <section>
          <h4>${escapeHtml(t("fo76_minerva_detail_unlocks"))}</h4>
          <p>${escapeHtml(unlocks)}</p>
        </section>
      </div>
    </div>
  `;
}

function renderFo76MinervaListModal() {
  const modalState = state.fo76MinervaList;
  const isOpen = Boolean(modalState.open);

  if (!elements.fo76MinervaListOverlay) {
    state.fo76MinervaList.open = false;
    return;
  }

  if (elements.fo76MinervaListBadge) {
    elements.fo76MinervaListBadge.textContent = t("fo76_minerva_list_badge");
  }
  if (elements.fo76MinervaListTitle) {
    elements.fo76MinervaListTitle.textContent = t("fo76_minerva_list_title", {
      n: String(modalState.listNumber || "--").padStart(2, "0")
    });
  }
  if (elements.fo76MinervaListBody) {
    elements.fo76MinervaListBody.textContent = t("fo76_minerva_list_body");
  }
  if (elements.fo76MinervaListCloseBtn) {
    elements.fo76MinervaListCloseBtn.textContent = t("fo76_minerva_list_close");
  }
  if (elements.fo76MinervaListCloseIconBtn) {
    elements.fo76MinervaListCloseIconBtn.setAttribute("aria-label", t("fo76_minerva_list_close"));
  }

  const listInventory = Array.isArray(modalState.list?.Inventory)
    ? modalState.list.Inventory.map((item) => normalizeFo76MinervaInventoryItem(item)).filter(Boolean)
    : [];
  let statusText = "";
  if (modalState.loading) {
    statusText = t("fo76_minerva_list_loading");
  } else if (modalState.error) {
    statusText = modalState.error;
  } else if (modalState.list && !listInventory.length) {
    statusText = t("fo76_minerva_list_empty");
  }

  if (elements.fo76MinervaListStatus) {
    elements.fo76MinervaListStatus.hidden = !statusText;
    elements.fo76MinervaListStatus.textContent = statusText || t("fo76_minerva_list_loading");
  }

  if (elements.fo76MinervaListContent) {
    const hasContent = !modalState.loading && !modalState.error && listInventory.length;
    elements.fo76MinervaListContent.hidden = !hasContent;
    if (hasContent) {
      const contentHeight = Math.max(286, Math.min(628, 78 + (listInventory.length * 34)));
      elements.fo76MinervaListContent.style.setProperty("--fo76-minerva-content-size", `${contentHeight}px`);
      const selectedUrl = normalizeWikiUrl(modalState.detail.item?.WikiUrl || modalState.detail.item?.url || "");
      const itemsMarkup = listInventory.map((item) => {
        const itemUrl = normalizeWikiUrl(item.WikiUrl || item.url || "");
        const isSelected = itemUrl && selectedUrl && itemUrl === selectedUrl;
        const priceText = item.price == null ? t("fo76_minerva_detail_no_price") : Number(item.price).toLocaleString();
        return `
          <button
            type="button"
            class="fo76-minerva-item-trigger${isSelected ? " is-selected" : ""}"
            data-name="${escapeHtml(item.name)}"
            data-price="${escapeHtml(item.price ?? "")}"
            data-wiki-url="${escapeHtml(itemUrl)}"
          >
            <span class="fo76-minerva-item-name">
              ${isPlanOrPlanoItem(item.name) ? `<span class="fo76-icon" aria-hidden="true">${escapeHtml(PLAN_ITEM_GLYPH)}</span>` : ""}
              ${escapeHtml(item.name)}
            </span>
            <span class="fo76-minerva-item-price"><span class="fo76-icon" aria-hidden="true">${escapeHtml(GOLD_BULLION_GLYPH)}</span>${escapeHtml(priceText)}</span>
          </button>
        `;
      }).join("");
      elements.fo76MinervaListContent.innerHTML = `
        <section class="fo76-minerva-list-panel" aria-label="${escapeHtml(t("fo76_minerva_list_title", { n: String(modalState.listNumber || "--").padStart(2, "0") }))}">
          <div class="fo76-minerva-list-summary">
            <span>${escapeHtml(t("fo76_minerva_list_count", { count: String(listInventory.length) }))}</span>
            <strong>${escapeHtml(localizeFo76EventTitle(modalState.eventTitle) || t("fo76_minerva_list_badge"))}</strong>
          </div>
          <div class="fo76-minerva-items">${itemsMarkup}</div>
        </section>
        <section class="fo76-minerva-detail-panel" aria-live="polite">
          ${buildFo76MinervaDetailMarkup()}
        </section>
      `;
    } else {
      elements.fo76MinervaListContent.style.removeProperty("--fo76-minerva-content-size");
      elements.fo76MinervaListContent.innerHTML = "";
    }
  }

  elements.fo76MinervaListOverlay.classList.toggle("is-active", isOpen);
  elements.fo76MinervaListOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
  syncFo76ModalBodyClass();
}

function closeFo76MinervaListModal() {
  state.fo76MinervaList.detail.requestId += 1;
  state.fo76MinervaList.open = false;
  state.fo76MinervaList.loading = false;
  state.fo76MinervaList.error = "";
  state.fo76MinervaList.listNumber = null;
  state.fo76MinervaList.eventTitle = "";
  state.fo76MinervaList.list = null;
  state.fo76MinervaList.opener = null;
  state.fo76MinervaList.detail.loading = false;
  state.fo76MinervaList.detail.error = "";
  state.fo76MinervaList.detail.item = null;
  state.fo76MinervaList.detail.data = null;
  renderFo76MinervaListModal();
}

async function openFo76MinervaListModal(listNumber, eventTitle = "", opener = null) {
  const numericListNumber = Number(listNumber);
  if (!Number.isInteger(numericListNumber) || numericListNumber < 1) {
    return;
  }

  hideFo76EventsTooltip();
  state.fo76MinervaList.open = true;
  state.fo76MinervaList.loading = true;
  state.fo76MinervaList.error = "";
  state.fo76MinervaList.listNumber = numericListNumber;
  state.fo76MinervaList.eventTitle = String(eventTitle || "").trim();
  state.fo76MinervaList.list = null;
  state.fo76MinervaList.opener = opener instanceof HTMLElement ? opener : null;
  state.fo76MinervaList.detail.requestId += 1;
  state.fo76MinervaList.detail.loading = false;
  state.fo76MinervaList.detail.error = "";
  state.fo76MinervaList.detail.item = null;
  state.fo76MinervaList.detail.data = null;
  renderFo76MinervaListModal();

  await loadMinervaLists();
  const list = getFo76MinervaListFromState(numericListNumber);
  if (state.fo76MinervaList.listNumber !== numericListNumber || !state.fo76MinervaList.open) {
    return;
  }

  state.fo76MinervaList.loading = false;
  state.fo76MinervaList.list = list;
  state.fo76MinervaList.error = list ? "" : t("fo76_minerva_list_error");
  renderFo76MinervaListModal();
}

async function openFo76MinervaItemDetail(item = {}) {
  const normalizedItem = normalizeFo76MinervaInventoryItem(item);
  if (!normalizedItem || !normalizedItem.url) {
    return;
  }

  const detailKey = minervaDetailKeyFromUrl(normalizedItem.url);
  const cacheKey = `${state.lang}:${detailKey}`;
  const requestId = state.fo76MinervaList.detail.requestId + 1;
  state.fo76MinervaList.detail.requestId = requestId;
  state.fo76MinervaList.detail.loading = false;
  state.fo76MinervaList.detail.error = "";
  state.fo76MinervaList.detail.item = normalizedItem;
  state.fo76MinervaList.detail.data = null;
  renderFo76MinervaListModal();

  const cachedDetail = state.minervaDetail.cache[cacheKey];
  if (cachedDetail) {
    if (state.fo76MinervaList.detail.requestId !== requestId) {
      return;
    }
    state.fo76MinervaList.detail.data = cachedDetail;
    renderFo76MinervaListModal();
    return;
  }

  const immediateOffline = resolveOfflineMinervaDetailFromMap(normalizedItem, state.lang);
  if (immediateOffline) {
    if (state.fo76MinervaList.detail.requestId !== requestId) {
      return;
    }
    state.fo76MinervaList.detail.data = immediateOffline;
    state.minervaDetail.cache[cacheKey] = immediateOffline;
    renderFo76MinervaListModal();
    return;
  }

  state.fo76MinervaList.detail.loading = true;
  renderFo76MinervaListModal();

  try {
    const offlineDetail = await resolveOfflineMinervaDetail(normalizedItem, state.lang);
    if (state.fo76MinervaList.detail.requestId !== requestId) {
      return;
    }
    if (offlineDetail) {
      state.fo76MinervaList.detail.loading = false;
      state.fo76MinervaList.detail.error = "";
      state.fo76MinervaList.detail.data = offlineDetail;
      state.minervaDetail.cache[cacheKey] = offlineDetail;
      renderFo76MinervaListModal();
      return;
    }
  } catch {
    // Continue with online fallback.
  }

  try {
    const liveDetail = await fetchMinervaPlanDetail(normalizedItem, state.lang);
    if (state.fo76MinervaList.detail.requestId !== requestId) {
      return;
    }
    const normalizedLive = {
      wikiUrl: normalizeWikiUrl(liveDetail?.wikiUrl || normalizedItem.url),
      imageUrl: liveDetail?.imageUrl || state.minervaDetail.fallbackImageUrl || MINERVA_DETAIL_FALLBACK_IMAGE,
      whereElse: Array.isArray(liveDetail?.whereElse)
        ? liveDetail.whereElse.map((line) => sanitizeDetailText(line)).filter(Boolean)
        : [],
      unlocks: sanitizeDetailText(liveDetail?.unlocks || "")
    };
    state.fo76MinervaList.detail.loading = false;
    state.fo76MinervaList.detail.error = "";
    state.fo76MinervaList.detail.data = normalizedLive;
    state.minervaDetail.cache[cacheKey] = normalizedLive;
    renderFo76MinervaListModal();
    return;
  } catch {
    // Fall through to final error.
  }

  if (state.fo76MinervaList.detail.requestId !== requestId) {
    return;
  }
  state.fo76MinervaList.detail.loading = false;
  state.fo76MinervaList.detail.error = t("fo76_minerva_detail_error");
  state.fo76MinervaList.detail.data = null;
  renderFo76MinervaListModal();
}

function handleFo76EventsContentClick(event) {
  const trigger = event.target instanceof Element ? event.target.closest("[data-fo76-event-action]") : null;
  if (!(trigger instanceof HTMLElement) || !elements.fo76EventsContent?.contains(trigger)) {
    return;
  }
  const action = trigger.dataset.fo76EventAction || "";
  if (action !== "minerva-list") {
    if (action === "event-info") {
      event.preventDefault();
      openFo76EventInfoModal(trigger.dataset.eventId || "");
    }
    return;
  }
  event.preventDefault();
  const listNumber = Number(trigger.dataset.minervaList);
  const eventTitle = trigger.dataset.eventTitle || trigger.dataset.tooltipTitle || "";
  void openFo76MinervaListModal(listNumber, eventTitle, trigger);
}

function handleFo76MinervaListContentClick(event) {
  const trigger = event.target instanceof Element ? event.target.closest(".fo76-minerva-item-trigger") : null;
  if (!(trigger instanceof HTMLElement) || !elements.fo76MinervaListContent?.contains(trigger)) {
    return;
  }
  event.preventDefault();
  void openFo76MinervaItemDetail({
    Name: trigger.dataset.name || "",
    Price: trigger.dataset.price || "",
    WikiUrl: trigger.dataset.wikiUrl || ""
  });
}

async function fetchFo76Events({ force = false } = {}) {
  const requestId = state.fo76Events.requestId + 1;
  state.fo76Events.requestId = requestId;
  state.fo76Events.loading = true;
  state.fo76Events.error = "";
  renderFo76EventsModal();

  try {
    const requestUrl = force ? `${FO76_EVENTS_API_URL}?force=1` : FO76_EVENTS_API_URL;
    const payload = await requestJson(requestUrl, {
      method: "GET",
      cache: "no-store"
    });
    if (state.fo76Events.requestId !== requestId) {
      return;
    }
    state.fo76Events.data = normalizeFo76EventsPayload(payload);
    state.fo76Events.loading = false;
    state.fo76Events.error = "";
    renderFo76EventsModal();
  } catch (error) {
    try {
      const fallbackPayload = await requestJson(FO76_EVENTS_FALLBACK_URL, {
        method: "GET",
        cache: "no-store"
      });
      if (state.fo76Events.requestId !== requestId) {
        return;
      }
      state.fo76Events.data = normalizeFo76EventsPayload({
        ...fallbackPayload,
        cached: true,
        stale: true,
        error: fallbackPayload?.error || "Live event calendar sync failed; serving bundled fallback data."
      });
      state.fo76Events.loading = false;
      state.fo76Events.error = "";
      renderFo76EventsModal();
      return;
    } catch {
      // Fall through to the visible error state.
    }

    if (state.fo76Events.requestId !== requestId) {
      return;
    }
    state.fo76Events.loading = false;
    state.fo76Events.error = t("fo76_events_error");
    renderFo76EventsModal();
  }
}

function openFo76EventsModal() {
  showFo76EventsPage({ updateHash: true });
}
