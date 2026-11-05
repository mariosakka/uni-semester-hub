import {t} from "./strings.js";
import {pad, iso, parseDate, addDays, fmtTime, inRanges} from "./util.js";
import {visible} from "./groups.js";
import {weekNumberOf} from "./calendar.js";
// Weekly timetable: pure logic (weekSessions, buildIcs, sessionInfo, legendInfo, layoutLanes); the view is src/components/schedule/.
export const weekCount = D => D.weeks.segments.reduce((n, s) => n + s.count, 0);

export function mondayOf(D, w) { // week numbers run consecutively through the segments
  for (const s of D.weeks.segments) {
    if (w <= s.count) return addDays(parseDate(s.start), 7 * (w - 1));
    w -= s.count;
  }
}

// Picker timeline: every calendar week from the first teaching week, including breaks and the
// exam/break weeks that follow the last teaching week. w = teaching week number, or null.
export function timeline(D) {
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
export function currentIndex(T, today = new Date()) {
  const i = T.findIndex(e => today < addDays(e.m, 7));
  return i < 0 ? T.length - 1 : i;
}
export const isNow = (e, today = new Date()) => today >= e.m && today < addDays(e.m, 7);

export const courseOf = (D, id) => (D.courses || []).find(c => c.id === id) || {id, title: id, color: "grey"};
export const TYPE_KEYS = {course: "type.course", lab: "type.lab", project: "type.project", seminar: "type.seminar"};
export const typeName = type => TYPE_KEYS[type] ? t(TYPE_KEYS[type]) : type;
export const LETTER_KEYS = {course: "plan.abbr.course", lab: "plan.abbr.lab", project: "plan.abbr.project", seminar: "plan.abbr.seminar"};
export const typeLetter = type => LETTER_KEYS[type] ? t(LETTER_KEYS[type]) : String(type || "").charAt(0).toUpperCase();
export const shortName = (D, id) => { const c = courseOf(D, id); return c.short || c.title; };
export const sessionTitle = (D, e) => { const c = courseOf(D, e.course); return `${c.short || c.title} (${typeName(e.type)}${e.group ? " " + t("schedule.subgroup", {n: e.group}) : ""})`; };

// every session of week w, with status ok | dev (differs from the timetable) | cancel
export function weekSessions(D, w) {
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
    const room = rule.room ?? e.room ?? "";
    out.push({course: e.course, title: sessionTitle(D, e), name: shortName(D, e.course), day: e.day, start: e.start, end: e.end, teacher: e.teacher || "",
      room, baseMode: rule.mode, baseRoom: room, mode, status, note, u, key, date: addDays(m, e.day), extra: false, type: e.type, group: e.group ? String(e.group) : ""});
  }
  for (const x of D.extraSessions || []) {
    const day = keys.indexOf(x.date);
    if (day < 0) continue;
    out.push({course: x.course, title: sessionTitle(D, x), name: shortName(D, x.course), day, start: x.start, end: x.end, teacher: x.teacher || "", room: x.room || "",
      baseMode: "", baseRoom: "", mode: x.mode, status: "dev", note: x.note || "", u: false, key: x.date, date: addDays(m, day), extra: true, type: x.type, group: x.group ? String(x.group) : ""});
  }
  return out;
}

export const placeFor = (mode, room) => mode === "online" ? t("schedule.online") : (room || t("schedule.inPerson"));
export const place = s => placeFor(s.mode, s.room);

// stable id of a session (card <-> modal, focus return after a re-render)
export const sessionKey = s => [s.course, s.type, s.group || 0, s.key, s.start].join("-");
export const cardAria = (D, s) => [courseOf(D, s.course).title, typeName(s.type) + (s.group ? " " + t("schedule.subgroup", {n: s.group}) : ""),
  fmtTime(s.start) + "–" + fmtTime(s.end), s.status === "cancel" ? t("modal.notHeld") : place(s)].join(", ");

// everything the session modal shows, as data
export function sessionInfo(D, s) {
  const c = courseOf(D, s.course), w = weekNumberOf(D, s.date);
  return {course: c, type: s.type, typeName: typeName(s.type), group: s.group, date: s.date, key: s.key, start: s.start, end: s.end,
    week: w, parity: w ? (w % 2 ? "odd" : "even") : null, place: place(s), basePlace: placeFor(s.baseMode, s.baseRoom),
    modeDiffers: !s.extra && !!s.baseMode && s.baseMode !== s.mode,
    status: s.status === "cancel" ? "cancel" : s.extra ? "extra" : s.status === "dev" ? "dev" : "ok", note: s.note, u: s.u, teacher: s.teacher,
    ects: c.ects, evaluation: c.evaluation};
}

// hour range of the grid, stable across weeks
export function hourRange(D) {
  const all = [...(D.timetable || []).filter(e => visible(D, e)), ...(D.extraSessions || [])];
  if (!all.length) return [8, 18];
  return [Math.floor(Math.min(...all.map(e => e.start))), Math.ceil(Math.max(...all.map(e => e.end)))];
}

export const icsEsc = s => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
export const fold = l => l.match(/.{1,73}/gu).join("\r\n ");
export const stamp = (d, h) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(Math.floor(h))}${pad(Math.round((h % 1) * 60))}00`;

// iCalendar text with one event per session (cancelled ones left out); floating local time
export function buildIcs(D, now = new Date()) {
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
export function downloadIcs(D) {
  const text = buildIcs(D), a = document.createElement("a"), name = ((D.meta || {}).calendarFilename || t("ics.fileName")) + (D.legacy || !D.id ? "" : "-" + D.id) + ".ics";
  if (!("download" in a) || !window.URL || !URL.createObjectURL) { location.href = "data:text/calendar;charset=utf-8," + encodeURIComponent(text); return; }
  a.href = URL.createObjectURL(new Blob([text], {type: "text/calendar;charset=utf-8"}));
  a.download = name; a.style.display = "none";
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

// legend contents as data: course types in use, whether subgroups/rooms occur, courses shown
export function legendInfo(D) {
  const rows = [...(D.timetable || []).filter(e => visible(D, e)), ...(D.extraSessions || [])], used = new Set(rows.map(e => e.course));
  return {
    types: ["course", "lab", "project", "seminar"].filter(ty => rows.some(e => e.type === ty)),
    hasGroups: rows.some(e => e.group),
    room: (rows.find(e => e.room) || (D.timetable || []).flatMap(e => e.rules || []).find(r => r.room) || {}).room || "",
    courses: (D.courses || []).filter(c => used.has(c.id))};
}

// sessions that overlap in time (other subgroups, an extra session next to a cancelled one) share the column side by side:
// Map session -> [lane, lane count of its overlap cluster]
export function layoutLanes(sess) {
  const lanes = new Map();
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
  return lanes;
}
