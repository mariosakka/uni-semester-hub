// Academic calendar: per-semester month grids from periods / daysOff / keyDates.
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const kd = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

function monthHTML(D, y, m) {
  const C = D.calendar, off = D.daysOff || {}, keys = D.keyDates || [], now = new Date(), today = kd(now.getFullYear(), now.getMonth(), now.getDate());
  const lead = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  let h = `<div class="mon"><h3>${MONTHS[m]} ${y}</h3><div class="mg">` + ["M", "T", "W", "T", "F", "S", "S"].map(d => `<i class="wd">${d}</i>`).join("") + "<i></i>".repeat(lead);
  for (let d = 1; d <= days; d++) {
    const k = kd(y, m, d), wk = (lead + d - 1) % 7 >= 5;
    const p = (C.periods || []).find(p => k >= p.from && k <= p.to);
    const ev = keys.filter(e => k >= e.from && k <= (e.to || e.from));
    const cls = ["d", p ? (p.kind === "break" || p.kind === "vac" ? "off" : p.kind) : "", off[k] ? "off" : "", wk ? "we" : "", ev.length ? "key " + ev[0].kind : "", k === today ? "today" : ""].join(" ");
    const tip = [p && p.label, off[k], ...ev.map(e => e.label)].filter(Boolean).join(" · ");
    h += `<b class="${cls}" title="${esc(tip)}" data-k="${k}" data-tip="${esc(tip)}">${d}</b>`;
  }
  return h + "</div></div>";
}

// base = folder of the data set, used to resolve the optional image / pdf paths
function renderCalendar(box, D, s, base = "") {
  const C = D.calendar, sems = C.semesters || [{months: C.months, note: C.note}], S = sems[s];
  const first = S.months[0], last = S.months[S.months.length - 1], lo = kd(first[0], first[1], 1), hi = kd(last[0], last[1], 31);
  const keys = (D.keyDates || []).filter(e => (e.to || e.from) >= lo && e.from <= hi).sort((a, b) => a.from.localeCompare(b.from));
  const f = k => fmtDate(parseDate(k));
  box.innerHTML =
    (sems.length > 1 ? `<div class="swk">${sems.map((x, i) => `<button data-s="${i}" ${i === s ? "disabled" : ""}>${esc(x.name)}</button>`).join("")}</div>` : "") +
    `<div class="legend"><span class="d teach">Teaching</span><span class="d exam">Exams</span><span class="d off">Vacation / day off</span><span class="d key task">Task / deadline</span><span class="d key exam">Key exam / presentation</span></div>` +
    `<div class="months">${S.months.map(([y, m]) => monthHTML(D, y, m)).join("")}</div>` +
    `<p class="note dayinfo" aria-live="polite">Tap a day for details.</p>` +
    (keys.length ? `<h3>Key dates</h3><ul>${keys.map(e => `<li><b>${f(e.from)}${e.to && e.to !== e.from ? " – " + f(e.to) : ""}</b> ${esc(e.label)}</li>`).join("")}</ul>` : "") +
    (S.note ? `<p class="note">${S.note}</p>` : "") +
    (C.image ? `<a href="${esc(base + (C.pdf || C.image))}"><img class="calimg" src="${esc(base + C.image)}" alt="Official academic calendar"></a>` : "") +
    (C.pdf ? `<p class="note">Official document: <a href="${esc(base + C.pdf)}">${esc(C.pdf)}</a></p>` : "");
  const info = box.querySelector(".dayinfo");
  box.querySelector(".months").onclick = e => { // tooltips don't exist on touch screens: show the day's label below the months
    const d = e.target.closest(".d[data-k]");
    if (d) info.textContent = `${fmtDate(parseDate(d.dataset.k))}: ${d.dataset.tip || "no special event"}`;
  };
  box.querySelectorAll("button").forEach(b => b.onclick = () => renderCalendar(box, D, +b.dataset.s, base));
}

// the semester whose first month has already started (first one if none has)
function defaultSemester(D, today = new Date()) {
  const sems = D.calendar.semesters || [];
  let s = 0;
  sems.forEach((x, i) => { if (today >= new Date(x.months[0][0], x.months[0][1], 1)) s = i; });
  return s;
}
