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
    out.push({m, w, label: w ? "" : hit ? hit.label : "No classes"});
  }
  return out;
}
// entry for the week containing today; before/after the timeline: the first/last entry
function currentIndex(T, today = new Date()) {
  const i = T.findIndex(e => today < addDays(e.m, 7));
  return i < 0 ? T.length - 1 : i;
}
const isNow = (e, today = new Date()) => today >= e.m && today < addDays(e.m, 7);
const parityOf = w => (w % 2 ? "odd" : "even");

const courseOf = (D, id) => (D.courses || []).find(c => c.id === id) || {id, title: id, color: "grey"};
const sessionTitle = (D, e) => { const c = courseOf(D, e.course); return `${c.short || c.title} (${e.type}${e.group ? " SG" + e.group : ""})`; };

function visible(D, e) { // no preference set for this course = show every subgroup
  const g = ((D.meta || {}).me || {}).groups || {}, mine = g[e.course] ?? g.default;
  return !e.group || mine === undefined || mine === String(e.group);
}

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
      room: rule.room ?? e.room ?? "", mode, status, note, u, key, date: addDays(m, e.day), extra: false, type: e.type});
  }
  for (const x of D.extraSessions || []) {
    const day = keys.indexOf(x.date);
    if (day < 0) continue;
    out.push({course: x.course, title: sessionTitle(D, x), day, start: x.start, end: x.end, teacher: x.teacher || "", room: x.room || "",
      mode: x.mode, status: "dev", note: x.note || "", u: false, key: x.date, date: addDays(m, day), extra: true, type: x.type});
  }
  return out;
}

const place = s => s.mode === "online" ? "Online" : (s.room || "In person");

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
  const name = (D.meta || {}).title || "Timetable", ts = now.toISOString().replace(/[-:]|\.\d+/g, "");
  const out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//uni-hub//EN", "CALSCALE:GREGORIAN", fold("X-WR-CALNAME:" + icsEsc(name))];
  for (let w = 1; w <= weekCount(D); w++) for (const s of weekSessions(D, w)) {
    if (s.status === "cancel") continue;
    out.push("BEGIN:VEVENT", `UID:${s.course}-${s.type}-${s.start}-${s.key}@uni-hub`, `DTSTAMP:${ts}`,
      `DTSTART:${stamp(s.date, s.start)}`, `DTEND:${stamp(s.date, s.end)}`,
      fold("SUMMARY:" + icsEsc(s.title + (s.mode === "online" ? " [online]" : ""))), fold("LOCATION:" + icsEsc(place(s))),
      fold("DESCRIPTION:" + icsEsc(s.teacher + (s.note ? "\n" + s.note + (s.u ? " (unconfirmed)" : "") : ""))), "END:VEVENT");
  }
  out.push("END:VCALENDAR");
  return out.join("\r\n");
}

// iOS Safari only starts a blob download if the link is in the DOM and the URL outlives the click, so: append, click,
// revoke 10 s later. Without `download` support (very old browsers) the .ics opens as a data: URL, which iOS offers to add to Calendar.
function downloadIcs(D) {
  const text = buildIcs(D), a = document.createElement("a"), name = ((D.meta || {}).calendarFilename || "timetable") + (D.legacy || !D.id ? "" : "-" + D.id) + ".ics";
  if (!("download" in a) || !window.URL || !URL.createObjectURL) { location.href = "data:text/calendar;charset=utf-8," + encodeURIComponent(text); return; }
  a.href = URL.createObjectURL(new Blob([text], {type: "text/calendar;charset=utf-8"}));
  a.download = name; a.style.display = "none";
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

function renderSchedule(box, D, i) {
  const T = timeline(D), real = currentIndex(T);
  if (i === undefined) i = real;
  const e = T[i], w = e.w, m = e.m, live = isNow(T[real]);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"], sess = w ? weekSessions(D, w) : [];
  const [H0, H1] = hourRange(D), RH = 64, offs = D.daysOff || {};
  const head = days.map((d, k) => `<div class="sh">${d} ${fmtDate(addDays(m, k))}</div>`).join("");
  const times = Array.from({length: H1 - H0}, (_, k) => `<div>${H0 + k}:00</div>`).join("");
  // an extra session beside a cancelled one: cancelled takes the left half, extra the right half
  const side = s => s.extra ? "left:50%;" : s.status === "cancel" && sess.some(x => x.extra && x.day === s.day && x.start < s.end && x.end > s.start) ? "right:50%;" : "";
  const inner = s => `<b>${fmtTime(s.start)}–${fmtTime(s.end)}</b> <span class="t">${esc(s.title)}</span>` +
    `<small>${esc(s.teacher)}<br>${s.status === "cancel" ? "NOT HELD" : esc(place(s))}</small>` +
    (s.note ? `<span class="badge">${s.status === "cancel" ? "✕" : "⚠"} ${esc(s.note)}${s.u ? " ?" : ""}</span>` : "");
  const cls = s => `c-${courseOf(D, s.course).color || "grey"} ${s.status === "cancel" ? "cx" : ""} ${s.status === "dev" ? "dev" : ""}`;
  const dayOff = k => !w ? e.label : offs[iso(addDays(m, k))]; // vacation week: every day shows the label
  // phone layout: the same sessions as a day-by-day list (CSS shows the grid or the agenda, never both)
  const agenda = `<div class="agenda">` + days.map((d, k) => {
    const off = dayOff(k), list = sess.filter(s => s.day === k).sort((x, y) => x.start - y.start);
    return `<div class="ag ${off ? "off" : ""}"><h3>${d} ${fmtDate(addDays(m, k))}${off ? ` <span class="agoff">${esc(off)}</span>` : ""}</h3>` +
      (list.map(s => `<div class="acard ${cls(s)}">${inner(s)}</div>`).join("") || (off ? "" : `<p class="note">No classes</p>`)) + `</div>`;
  }).join("") + `</div>`;
  const cols = days.map((_, d) => {
    const off = dayOff(d);
    return `<div class="sc ${off ? "off" : ""}" style="height:${(H1 - H0) * RH}px">` + (off ? `<div class="dayoff">${esc(off)}</div>` : "") +
      sess.filter(s => s.day === d).map(s =>
    `<div class="ev ${cls(s)}" style="${side(s)}top:${(s.start - H0) * RH}px;height:${(s.end - s.start) * RH - 4}px">${inner(s)}</div>`).join("") + `</div>`;
  }).join("");
  const devs = sess.filter(s => s.note);
  const title = w ? `Week ${w} · ${parityOf(w)} week` : esc(e.label);
  box.innerHTML =
    `<div class="swk"><button id="pw" ${i <= 0 ? "disabled" : ""}>◀</button><b>${title} · ${fmtDate(m)} – ${fmtDate(addDays(m, 4))}</b>` +
    (i === real && live ? `<span class="chip">this week</span>` : "") +
    `<button id="nw" ${i >= T.length - 1 ? "disabled" : ""}>▶</button>${i !== real ? `<button id="tw">${live ? "This week" : "Nearest week"}</button>` : ""}<button id="ics">Download .ics (all weeks)</button></div>` +
    `<div class="sched"><div class="sh"></div>${head}<div class="sc times" style="height:${(H1 - H0) * RH}px">${times}</div>${cols}</div>${agenda}` +
    (live ? "" : `<p class="note">Today is outside the weeks shown (before the term or after it); showing the nearest week.</p>`) +
    `<p class="note">Orange dashed = differs from the timetable · greyed = not held · hatched = day off or vacation · "?" = unconfirmed report.</p>` +
    (devs.length ? `<ul>${devs.map(s => `<li><b>${days[s.day]} ${fmtDate(s.date)}</b> ${esc(s.title)}: ${esc(s.note)}</li>`).join("")}</ul>` : "") +
    `<details><summary>How to add to Google / Outlook</summary><p class="note">Download the .ics. Google Calendar: Settings → Import &amp; export → Import. ` +
    `Outlook: Add calendar → Upload from file (or File → Open &amp; Export → Import/Export). It is a snapshot: later changes aren't synced, ` +
    `so re-download and delete the old import if things change. Times are saved as local time.</p></details>`;
  box.querySelector("#pw").onclick = () => renderSchedule(box, D, i - 1);
  box.querySelector("#nw").onclick = () => renderSchedule(box, D, i + 1);
  if (box.querySelector("#tw")) box.querySelector("#tw").onclick = () => renderSchedule(box, D, real);
  box.querySelector("#ics").onclick = () => downloadIcs(D);
}
