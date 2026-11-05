// Weekly timetable: pure logic (weekSessions, buildIcs) + DOM rendering (renderSchedule).
const weekCount = D => D.weeks.segments.reduce((n, s) => n + s.count, 0);

function mondayOf(D, w) { // week numbers run consecutively through the segments
  for (const s of D.weeks.segments) {
    if (w <= s.count) return addDays(parseDate(s.start), 7 * (w - 1));
    w -= s.count;
  }
}

// Picker timeline: every calendar week from the first teaching week, including breaks and the
// exam/break weeks that follow the last teaching week. w = teaching week number, or null.
function timeline(D) {
  const segs = D.weeks.segments, nums = {}, out = [];
  let k = 0;
  for (const sg of segs) for (let i = 0; i < sg.count; i++) nums[iso(addDays(parseDate(sg.start), 7 * i))] = ++k;
  const ps = ((D.calendar || {}).periods || []).filter(p => p.kind !== "teach");
  const lastSeg = segs[segs.length - 1];
  let end = addDays(parseDate(lastSeg.start), 7 * lastSeg.count - 1);
  for (let again = true; again;) { // extend through consecutive break/exam periods
    again = false;
    for (const p of ps) if (parseDate(p.from) <= addDays(end, 1) && parseDate(p.to) > end) { end = parseDate(p.to); again = true; }
  }
  for (let m = parseDate(segs[0].start); m <= end; m = addDays(m, 7)) {
    const w = nums[iso(m)] || null;
    const fri = addDays(m, 4), hit = ps.filter(p => p.from <= iso(fri) && p.to >= iso(m)).sort((x, y) => y.from.localeCompare(x.from))[0];
    out.push({m, w, label: w ? "" : hit ? hit.label : t("schedule.noClasses")});
  }
  return out;
}
// entry for the week containing today; before/after the timeline: the first/last entry
function currentIndex(T, today = new Date()) {
  const i = T.findIndex(e => today < addDays(e.m, 7));
  return i < 0 ? T.length - 1 : i;
}
const isNow = (e, today = new Date()) => today >= e.m && today < addDays(e.m, 7);

const courseOf = (D, id) => (D.courses || []).find(c => c.id === id) || {id, title: id, color: "grey"};
const TYPE_KEYS = {course: "type.course", lab: "type.lab", project: "type.project", seminar: "type.seminar"};
const typeName = type => TYPE_KEYS[type] ? t(TYPE_KEYS[type]) : type;
const sessionTitle = (D, e) => { const c = courseOf(D, e.course); return `${c.short || c.title} (${typeName(e.type)}${e.group ? " " + t("schedule.subgroup", {n: e.group}) : ""})`; };

// every session of week w, with status ok | dev (differs from the timetable) | cancel
function weekSessions(D, w) {
  const m = mondayOf(D, w), keys = [0, 1, 2, 3, 4].map(d => iso(addDays(m, d))), out = [];
  for (const e of D.timetable || []) {
    if (!visible(D, e)) continue;
    if ((e.parity === "even" && w % 2) || (e.parity === "odd" && !(w % 2))) continue;
    const rule = (e.rules || []).find(r => inRanges(w, r.weeks));
    if (!rule) continue; // weeks without a rule: not held
    const key = keys[e.day], off = (D.daysOff || {})[key];
    const dev = (D.deviations || []).find(d => d.date === key && d.course === e.course && (!d.type || d.type === e.type));
    let mode = rule.mode, status = "ok", note = "", u = false;
    if (off) { status = "cancel"; note = off; }
    else if (dev) {
      note = dev.note || ""; u = !!dev.unconfirmed; status = dev.change === "cancel" ? "cancel" : "dev";
      if (dev.change === "online" || dev.change === "in-person") mode = dev.change;
    }
    out.push({course: e.course, title: sessionTitle(D, e), day: e.day, start: e.start, end: e.end, teacher: e.teacher || "",
      room: rule.room ?? e.room ?? "", mode, status, note, u, key, date: addDays(m, e.day), extra: false, type: e.type, group: e.group ? String(e.group) : ""});
  }
  for (const x of D.extraSessions || []) {
    const day = keys.indexOf(x.date);
    if (day < 0) continue;
    out.push({course: x.course, title: sessionTitle(D, x), day, start: x.start, end: x.end, teacher: x.teacher || "", room: x.room || "",
      mode: x.mode, status: "dev", note: x.note || "", u: false, key: x.date, date: addDays(m, day), extra: true, type: x.type, group: x.group ? String(x.group) : ""});
  }
  return out;
}

const place = s => s.mode === "online" ? t("schedule.online") : (s.room || t("schedule.inPerson"));

// hour range of the grid, stable across weeks
function hourRange(D) {
  const all = [...(D.timetable || []).filter(e => visible(D, e)), ...(D.extraSessions || [])];
  if (!all.length) return [8, 18];
  return [Math.floor(Math.min(...all.map(e => e.start))), Math.ceil(Math.max(...all.map(e => e.end)))];
}

const icsEsc = s => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const fold = l => l.match(/.{1,73}/gu).join("\r\n ");
const stamp = (d, h) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(Math.floor(h))}${pad(Math.round((h % 1) * 60))}00`;

// iCalendar text with one event per session (cancelled ones left out); floating local time
function buildIcs(D, now = new Date()) {
  const name = (D.meta || {}).title || t("ics.calendarName"), ts = now.toISOString().replace(/[-:]|\.\d+/g, "");
  const out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//uni-hub//EN", "CALSCALE:GREGORIAN", fold("X-WR-CALNAME:" + icsEsc(name))];
  for (let w = 1; w <= weekCount(D); w++) for (const s of weekSessions(D, w)) {
    if (s.status === "cancel") continue;
    out.push("BEGIN:VEVENT", `UID:${s.course}-${s.type}-g${s.group || 0}-${s.start}-${s.key}@uni-hub`, `DTSTAMP:${ts}`,
      `DTSTART:${stamp(s.date, s.start)}`, `DTEND:${stamp(s.date, s.end)}`,
      fold("SUMMARY:" + icsEsc(s.title + (s.mode === "online" ? t("schedule.onlineTag") : ""))), fold("LOCATION:" + icsEsc(place(s))),
      fold("DESCRIPTION:" + icsEsc(s.teacher + (s.note ? "\n" + s.note + (s.u ? t("ics.unconfirmed") : "") : ""))), "END:VEVENT");
  }
  out.push("END:VCALENDAR");
  return out.join("\r\n");
}

// iOS Safari only starts a blob download if the link is in the DOM and the URL outlives the click, so: append, click,
// revoke 10 s later. Without `download` support (very old browsers) the .ics opens as a data: URL, which iOS offers to add to Calendar.
function downloadIcs(D) {
  const text = buildIcs(D), a = document.createElement("a"), name = ((D.meta || {}).calendarFilename || t("ics.fileName")) + (D.legacy || !D.id ? "" : "-" + D.id) + ".ics";
  if (!("download" in a) || !window.URL || !URL.createObjectURL) { location.href = "data:text/calendar;charset=utf-8," + encodeURIComponent(text); return; }
  a.href = URL.createObjectURL(new Blob([text], {type: "text/calendar;charset=utf-8"}));
  a.download = name; a.style.display = "none";
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

// swatches reuse the CSS of the real blocks; one legend under both the grid and the phone agenda
function scheduleLegendHTML(D) {
  const lg = (cls, label, mark = "") => `<span class="d ${cls}">${mark}${esc(label)}</span>`; // same chips as the calendar legend
  const used = new Set([...(D.timetable || []).filter(e => visible(D, e)), ...(D.extraSessions || [])].map(e => e.course));
  return `<div class="legend" role="group" aria-label="${esc(t("schedule.legend.label"))}">` +
    lg("sdev", t("schedule.legend.differs")) + lg("scx", t("schedule.legend.notHeld")) + lg("off", t("schedule.legend.dayOff")) +
    lg("sunc", t("schedule.legend.unconfirmed"), "? ") + lg("sextra", t("schedule.legend.extra")) +
    (D.courses || []).filter(c => used.has(c.id)).map(c => lg(`cs c-${esc(c.color || "grey")}`, c.short || c.title)).join("") + `</div>`;
}

// subgroup chooser: a disclosure under the toolbar (inline on wide screens, a bottom sheet on phones, see CSS)
function groupsHTML(D) {
  const gs = discoverGroups(D);
  if (!gs.length) return "";
  const all = [...new Set(gs.flatMap(g => g.groups))].sort();
  const opt = (v, text, on) => `<option value="${esc(v)}"${on ? " selected" : ""}>${esc(text)}</option>`;
  return `<div class="gwrap"><button type="button" id="gbtn" aria-expanded="${D._gopen ? "true" : "false"}" aria-controls="gpanel">${esc(t("schedule.groups.button"))}</button>` +
    `<span class="chip gchip">${esc(groupSummary(D))}</span>` +
    `<div id="gpanel" class="gpanel" role="group" aria-label="${esc(t("schedule.groups.title"))}"${D._gopen ? "" : " hidden"}><h3>${esc(t("schedule.groups.title"))}</h3>` +
    gs.map(g => { const c = courseOf(D, g.course), cur = groupFor(D, g.course);
      return `<label class="grow c-${esc(c.color || "grey")}"><span>${esc(c.short || c.title)}</span><select data-c="${esc(g.course)}">` +
        opt("all", t("schedule.groups.all"), cur === "all") + g.groups.map(v => opt(v, t("schedule.groups.option", {n: v}), cur === v)).join("") + `</select></label>`; }).join("") +
    `<div class="gpre"><button type="button" data-p="all">${esc(t("schedule.groups.presetAll"))}</button>` +
    all.map(v => `<button type="button" data-p="${esc(v)}">${esc(t("schedule.groups.presetN", {n: v}))}</button>`).join("") +
    `<button type="button" data-p="reset">${esc(t("schedule.groups.reset"))}</button></div>` +
    `<button type="button" id="gclose">${esc(t("schedule.groups.close"))}</button></div></div>`;
}

let closeGroups = null; // closes the open chooser of the schedule currently shown; Esc and outside clicks are handled once, here
if (typeof document !== "undefined" && document.addEventListener) { // (node tests load this file without a DOM)
  document.addEventListener("keydown", e => { if (e.key === "Escape" && closeGroups) closeGroups(true); });
  document.addEventListener("click", e => { if (closeGroups && !e.target.closest(".gwrap")) closeGroups(false); });
}

function wireGroups(box, D, rerender) {
  const btn = box.querySelector("#gbtn"), panel = box.querySelector("#gpanel");
  if (!btn) { closeGroups = null; return; }
  const open = on => { D._gopen = on; panel.hidden = !on; btn.setAttribute("aria-expanded", String(on)); };
  closeGroups = refocus => { if (panel.hidden) return; open(false); if (refocus) btn.focus(); };
  const changed = focus => { D._gfocus = focus; (D.refresh || rerender)(); }; // the new render restores focus to `focus`
  btn.onclick = () => { open(panel.hidden); if (!panel.hidden) panel.querySelector("select").focus(); };
  box.querySelector("#gclose").onclick = () => closeGroups(true);
  panel.onchange = e => { const sel = e.target.closest("select[data-c]"); if (sel) { setGroup(D, sel.dataset.c, sel.value); changed(`select[data-c="${sel.dataset.c}"]`); } };
  panel.onclick = e => {
    const b = e.target.closest("button[data-p]");
    if (!b) return;
    if (b.dataset.p === "reset") resetGroups(D); else setAllGroups(D, b.dataset.p);
    changed(`button[data-p="${b.dataset.p}"]`);
  };
  if (D._gfocus) { const f = panel.querySelector(D._gfocus); D._gfocus = null; if (f && !panel.hidden) f.focus(); }
}

// Cards wrap their text; the hour rows grow (CSS variable --rh) until every card fits, so nothing is cut off.
// Measuring needs the grid to be visible (it is hidden on other tabs and on phones, where the agenda shows), so a
// ResizeObserver re-fits when the grid is shown or its width changes; fonts loading changes line breaks too.
const BASE_RH = 64, MAX_RH = 240;
function fitSchedule(box) {
  const grid = box.querySelector(".sched");
  if (!grid) return;
  if (!grid.dataset.watched) {
    grid.dataset.watched = "1";
    let lastW = -1;
    if (window.ResizeObserver) new ResizeObserver(() => { const w = grid.clientWidth; if (w !== lastW) { lastW = w; fitSchedule(box); } }).observe(grid);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitSchedule(box));
  }
  if (!grid.clientWidth) return; // not visible now
  grid.style.setProperty("--rh", BASE_RH + "px");
  let rh = BASE_RH;
  grid.querySelectorAll(".ev").forEach(ev => { rh = Math.max(rh, Math.ceil((ev.scrollHeight + 5) / (+ev.dataset.dur || 1))); });
  grid.style.setProperty("--rh", Math.min(rh, MAX_RH) + "px");
}

function renderSchedule(box, D, i) {
  const T = timeline(D), real = currentIndex(T);
  if (i === undefined) i = D._wi === undefined ? real : D._wi;
  D._wi = i; // the shown week, kept for refresh() after a subgroup change
  const e = T[i], w = e.w, m = e.m, live = isNow(T[real]);
  const days = [0, 1, 2, 3, 4].map(k => dayName(addDays(m, k), "short")), sess = w ? weekSessions(D, w) : [];
  const [H0, H1] = hourRange(D), offs = D.daysOff || {};
  const head = days.map((d, k) => `<div class="sh">${d} ${fmtDate(addDays(m, k))}</div>`).join("");
  const times = Array.from({length: H1 - H0}, (_, k) => `<div>${H0 + k}:00</div>`).join("");
  // sessions that overlap in time (other subgroups, an extra session next to a cancelled one) share the column side by side
  const lanes = new Map(); // session -> [lane, lane count of its overlap cluster]
  for (let d = 0; d < 5; d++) {
    let cluster = [], end = -1;
    const flush = () => {
      const free = []; // end time of the last session placed in each lane
      cluster.forEach(x => { let l = free.findIndex(e => e <= x.start); if (l < 0) l = free.length; free[l] = x.end; lanes.set(x, [l]); });
      cluster.forEach(x => lanes.get(x).push(free.length)); cluster = []; end = -1;
    };
    sess.filter(x => x.day === d).sort((x, y) => x.start - y.start || x.end - y.end).forEach(x => { if (cluster.length && x.start >= end) flush(); cluster.push(x); end = Math.max(end, x.end); });
    if (cluster.length) flush();
  }
  const side = x => { const [l, n] = lanes.get(x) || [0, 1]; return n > 1 ? `left:${100 * l / n}%;right:${100 * (n - l - 1) / n}%;font-size:.72rem;` : ""; };
  const inner = (s, narrow = false) => `<b>${fmtTime(s.start)}–${fmtTime(s.end)}</b> <span class="t">${esc(s.title)}</span>` +
    (s.status === "cancel" && s.note ? "" : `<small>${esc(s.teacher)}<br>${s.status === "cancel" ? esc(t("schedule.notHeld")) : esc(place(s))}</small>`) + // a cancelled session with a note: the note says why, no extra lines
    (s.note ? (narrow ? `<span class="badge" title="${esc(s.note)}">${s.status === "cancel" ? "✕" : "⚠"}${s.u ? " ?" : ""}</span>` // narrow lane: the full note is in the list under the grid
      : `<span class="badge">${s.status === "cancel" ? "✕" : "⚠"} ${esc(s.note)}${s.u ? " ?" : ""}</span>`) : "");
  const cls = s => `c-${courseOf(D, s.course).color || "grey"} ${s.status === "cancel" ? "cx" : ""} ${s.status === "dev" ? "dev" : ""}`;
  const dayOff = k => !w ? e.label : offs[iso(addDays(m, k))]; // vacation week: every day shows the label
  // phone layout: the same sessions as a day-by-day list (CSS shows the grid or the agenda, never both)
  const agenda = `<div class="agenda">` + days.map((d, k) => {
    const off = dayOff(k), list = sess.filter(s => s.day === k).sort((x, y) => x.start - y.start);
    return `<div class="ag ${off ? "off" : ""}"><h3>${d} ${fmtDate(addDays(m, k))}${off ? ` <span class="agoff">${esc(off)}</span>` : ""}</h3>` +
      (list.map(s => `<div class="acard ${cls(s)}">${inner(s)}</div>`).join("") || (off ? "" : `<p class="note">${esc(t("schedule.noClasses"))}</p>`)) + `</div>`;
  }).join("") + `</div>`;
  const cols = days.map((_, d) => {
    const off = dayOff(d);
    return `<div class="sc ${off ? "off" : ""}" style="height:calc(var(--rh) * ${H1 - H0})">` + (off ? `<div class="dayoff">${esc(off)}</div>` : "") +
      sess.filter(s => s.day === d).map(s =>
    `<div class="ev ${cls(s)}${(lanes.get(s) || [0, 1])[1] > 2 ? " dense" : ""}" title="${esc(fmtTime(s.start) + "–" + fmtTime(s.end) + " " + s.title + (s.note ? " – " + s.note : ""))}" data-dur="${s.end - s.start}" style="${side(s)}top:calc(var(--rh) * ${s.start - H0});height:calc(var(--rh) * ${s.end - s.start} - 4px)">${inner(s, (lanes.get(s) || [0, 1])[1] > 1)}</div>`).join("") + `</div>`;
  }).join("");
  const devs = sess.filter(s => s.note);
  const title = w ? esc(t(w % 2 ? "schedule.weekOdd" : "schedule.weekEven", {n: w})) : esc(e.label);
  box.innerHTML = scheduleLegendHTML(D) +
    `<div class="swk"><button id="pw" aria-label="${esc(t("schedule.prev"))}" ${i <= 0 ? "disabled" : ""}>◀</button><b>${title} · ${fmtDate(m)} – ${fmtDate(addDays(m, 4))}</b>` +
    (i === real && live ? `<span class="chip">${esc(t("schedule.thisWeek"))}</span>` : "") +
    `<button id="nw" aria-label="${esc(t("schedule.next"))}" ${i >= T.length - 1 ? "disabled" : ""}>▶</button>${i !== real ? `<button id="tw">${esc(t("schedule.backToCurrent"))}</button>` : ""}<button id="ics">${esc(t("schedule.download"))}</button></div>` + groupsHTML(D) +
    `<div class="sched"><div class="sh"></div>${head}<div class="sc times" style="height:calc(var(--rh) * ${H1 - H0})">${times}</div>${cols}</div>${agenda}` +
    (live ? "" : `<p class="note">${esc(t("schedule.outside"))}</p>`) +
    (devs.length ? `<ul>${devs.map(s => `<li><b>${days[s.day]} ${fmtDate(s.date)}</b> ${esc(s.title)}: ${esc(s.note)}</li>`).join("")}</ul>` : "") +
    `<details><summary>${esc(t("schedule.help.title"))}</summary><p class="note">${esc(t("schedule.help.body"))}</p></details>`;
  fitSchedule(box);
  box.querySelector("#pw").onclick = () => renderSchedule(box, D, i - 1);
  box.querySelector("#nw").onclick = () => renderSchedule(box, D, i + 1);
  if (box.querySelector("#tw")) box.querySelector("#tw").onclick = () => renderSchedule(box, D, real);
  box.querySelector("#ics").onclick = () => downloadIcs(D);
  wireGroups(box, D, () => renderSchedule(box, D, i));
}
