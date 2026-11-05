// Academic calendar: Week / Month / Year views over calendar periods, days off, deadline/exam markers (keyDates) and (week view) the timetable.
// Every day is a <button>; activating one opens the day-details modal (daymodal.js). Pure helpers first (node-tested), DOM below.
const CAL_MODES = [["week", "calendar.mode.week"], ["month", "calendar.mode.month"], ["year", "calendar.mode.year"]]; // [mode, string key]
const kd = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

// months the semester's calendar shows ([[year, month0], ...]); a legacy calendar.semesters list is merged
const calMonths = D => { const C = D.calendar || {}; return C.semesters ? C.semesters.flatMap(x => x.months) : (C.months || []); };
// first and last day (Dates) of those months
function calRange(D) {
  const ms = calMonths(D), f = ms[0], l = ms[ms.length - 1];
  return [new Date(f[0], f[1], 1), new Date(l[0], l[1] + 1, 0)];
}
const clampDate = (d, lo, hi) => d < lo ? lo : d > hi ? hi : d;
const mondayOfDate = d => addDays(d, -((d.getDay() + 6) % 7));
// the month to show: the month of `date`, or the nearest month of the range when `date` is outside it
function nearestMonth(D, date) { const [lo, hi] = calRange(D), c = clampDate(date, lo, hi); return [c.getFullYear(), c.getMonth()]; }

// teaching week number of a date (null in breaks, outside the term, or without a timetable)
function weekNumberOf(D, date) {
  if (!D.weeks || !(D.weeks.segments || []).length) return null;
  for (let w = 1, n = weekCount(D); w <= n; w++) { const m = mondayOf(D, w); if (date >= m && date < addDays(m, 7)) return w; }
  return null;
}

// what a calendar source (a semester, or the merged year) says about one day
function dayState(src, k) {
  const p = ((src.calendar || {}).periods || []).find(x => k >= x.from && k <= x.to) || null;
  return {p, off: (src.daysOff || {})[k] || "", ev: (src.keyDates || []).filter(e => k >= e.from && k <= (e.to || e.from))};
}
const dayTip = st => [st.p && st.p.label, st.off, ...st.ev.map(e => e.label)].filter(Boolean).join(" · ");
function dayClass(st, k, today) {
  const wk = (parseDate(k).getDay() + 6) % 7 >= 5, kind = st.p && (st.p.kind === "break" || st.p.kind === "vac" ? "off" : st.p.kind);
  return ["d", kind || "", st.off ? "off" : "", wk ? "we" : "", st.ev.length ? "key " + st.ev[0].kind : "", k === today ? "today" : ""].join(" ");
}

// everything the day modal shows, as data: period, day off, deadlines/exams, sessions (with deviations), news dated that day
function dayInfo(D, key) {
  const date = parseDate(key), st = dayState(D, key), w = weekNumberOf(D, date);
  const sessions = w ? weekSessions(D, w).filter(s => s.key === key).sort((a, b) => a.start - b.start) : [];
  const news = (D.sections || []).filter(s => s.kind === "news").flatMap(s => (s.items || []).filter(i => i.date === key));
  return {key, date, week: w, parity: w ? (w % 2 ? "odd" : "even") : null, period: st.p, off: st.off, keys: st.ev, sessions, news};
}

// ---- rendering ----
function cellHTML(st, k, today, inner, extra = "") {
  const tip = dayTip(st);
  return `<button type="button" class="${dayClass(st, k, today)}${extra}" data-k="${k}" aria-label="${esc(fmtLong(parseDate(k)) + (tip ? " · " + tip : ""))}"` +
    `${tip ? ` title="${esc(tip)}"` : ""}${k === today ? ' aria-current="date"' : ""}>${inner}</button>`;
}

function monthHTML(src, y, m, today) {
  const lead = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  let h = `<div class="mon"><h3>${esc(monthName(y, m))} ${y}</h3><div class="mg">` + [0, 1, 2, 3, 4, 5, 6].map(k => `<i class="wd">${esc(dayName(new Date(2024, 0, 1 + k), "narrow"))}</i>`).join("") + "<i></i>".repeat(lead);
  for (let d = 1; d <= days; d++) { const k = kd(y, m, d); h += cellHTML(dayState(src, k), k, today, d); } // 2024-01-01 is a Monday
  return h + "</div></div>";
}

// seven large day cells Monday..Sunday: day label, period / day-off label, deadline/exam markers, that day's sessions as compact lines
function weekHTML(D, start, today) {
  const w = weekNumberOf(D, start), by = {};
  (w ? weekSessions(D, w) : []).forEach(s => (by[s.key] ||= []).push(s));
  return `<div class="wgrid">` + [0, 1, 2, 3, 4, 5, 6].map(i => {
    const date = addDays(start, i), k = iso(date), st = dayState(D, k), label = st.off || (st.p && st.p.label) || "";
    const lines = (by[k] || []).sort((a, b) => a.start - b.start).map(s => {
      const c = courseOf(D, s.course), cx = s.status === "cancel";
      return `<span class="sl c-${esc(c.color || "grey")}${cx ? " cx" : ""}${s.status === "dev" ? " dev" : ""}">${fmtTime(s.start)} ${esc(c.short || c.title)} · ${esc(cx ? t("modal.notHeld") : place(s))}</span>`;
    }).join("");
    return cellHTML(st, k, today, `<span class="wn"><b>${esc(dayName(date, "short"))}</b> ${esc(fmtDate(date))}</span>` +
      (label ? `<span class="wl">${esc(label)}</span>` : "") + (st.ev.length ? `<span class="wk">${st.ev.map(e => `<span class="km ${e.kind}" title="${esc(e.label)}">●</span>`).join("")}</span>` : "") + lines, " wday");
  }).join("") + `</div>`;
}

// the whole academic year: every semester of the year with its months (semester boundaries = the headings and the period colours)
function yearHTML(D, today) {
  const Y = D.year || {semesters: [{title: "", months: calMonths(D)}], periods: (D.calendar || {}).periods || [], daysOff: D.daysOff, keyDates: D.keyDates};
  const src = {calendar: {periods: Y.periods}, daysOff: Y.daysOff, keyDates: Y.keyDates};
  return Y.semesters.map(s => `<h3 class="ysem">${esc(s.title)}</h3><div class="months">${s.months.map(([y, m]) => monthHTML(src, y, m, today)).join("")}</div>`).join("");
}

// base = folder of the data set, used to resolve the optional image / pdf paths. View state (mode, anchor) lives on the box.
function renderCalendar(box, D, base = "") {
  const [lo, hi] = calRange(D), now = new Date(), today = iso(now);
  const S = box._cal || (box._cal = {mode: "month", anchor: clampDate(now, lo, hi)});
  const mode = S.mode, a = S.anchor;
  let body, title, from, to, atStart, atEnd;
  if (mode === "week") {
    const st = mondayOfDate(a); from = iso(st); to = iso(addDays(st, 6)); title = `${fmtDate(st)} – ${fmtDate(addDays(st, 6))}`;
    body = weekHTML(D, st, today); atStart = addDays(st, -1) < lo; atEnd = addDays(st, 7) > hi;
  } else if (mode === "month") {
    const [y, m] = nearestMonth(D, a); from = kd(y, m, 1); to = kd(y, m, new Date(y, m + 1, 0).getDate()); title = `${monthName(y, m)} ${y}`;
    body = `<div class="months one">${monthHTML(D, y, m, today)}</div>`; atStart = new Date(y, m, 0) < lo; atEnd = new Date(y, m + 1, 1) > hi;
  } else {
    title = (D.year || {}).title || ""; from = "0000-00-00"; to = "9999-99-99"; body = yearHTML(D, today); atStart = atEnd = true;
  }
  const btn = (attrs, label, text) => `<button type="button" ${attrs} aria-label="${esc(label)}">${text}</button>`;
  box.innerHTML =
    `<div class="cmodes" role="group" aria-label="${esc(t("calendar.modes"))}">${CAL_MODES.map(([k, key]) => `<button type="button" data-mode="${k}" aria-pressed="${k === mode}">${esc(t(key))}</button>`).join("")}</div>` +
    (mode === "year" ? `<div class="cnav"><b>${esc(title)}</b></div>` :
      `<div class="cnav">${btn(`data-nav="-1"${atStart ? " disabled" : ""}`, t("calendar.prev"), "◀")}<b>${esc(title)}</b>${btn(`data-nav="1"${atEnd ? " disabled" : ""}`, t("calendar.next"), "▶")}` +
      `<button type="button" data-today>${esc(t("calendar.today"))}</button></div>`) +
    `<div class="legend"><span class="d teach">${esc(t("calendar.legend.teaching"))}</span><span class="d exam">${esc(t("calendar.legend.exams"))}</span><span class="d off">${esc(t("calendar.legend.dayOff"))}</span><span class="d key task">${esc(t("calendar.legend.task"))}</span><span class="d key exam">${esc(t("calendar.legend.keyExam"))}</span></div>` +
    `<div class="cbody">${body}</div>` +
    (D.calendar && D.calendar.note ? `<p class="note">${D.calendar.note}</p>` : "") +
    (D.calendar && D.calendar.image ? `<a href="${esc(base + (D.calendar.pdf || D.calendar.image))}"><img class="calimg" src="${esc(base + D.calendar.image)}" alt="${esc(t("calendar.imageAlt"))}"></a>` : "") +
    (D.calendar && D.calendar.pdf ? `<p class="note">${tx("calendar.officialDoc", {link: `<a href="${esc(base + D.calendar.pdf)}">${esc(D.calendar.pdf)}</a>`})}</p>` : "");
  const again = focus => { box._focus = focus; renderCalendar(box, D, base); };
  box.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => { S.mode = b.dataset.mode; again(`[data-mode="${b.dataset.mode}"]`); });
  box.querySelectorAll("[data-nav]").forEach(b => b.onclick = () => {
    const dir = +b.dataset.nav, [y, m] = nearestMonth(D, a);
    S.anchor = clampDate(mode === "week" ? addDays(a, 7 * dir) : new Date(y, m + dir, 1), lo, hi);
    again(`[data-nav="${b.dataset.nav}"]`);
  });
  const td = box.querySelector("[data-today]");
  if (td) td.onclick = () => { S.anchor = clampDate(new Date(), lo, hi); again("[data-today]"); };
  box.querySelector(".cbody").onclick = e => { const d = e.target.closest("button.d[data-k]"); if (d) openDayModal(D, d.dataset.k, d, box); };
  if (box._focus) { const el = box.querySelector(box._focus); box._focus = null; if (el && !el.disabled) el.focus(); }
}
