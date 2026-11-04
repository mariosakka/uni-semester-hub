// Section renderers. Item strings and titles are trusted HTML written by the data author.
const link = (url, text) => `<a href="${esc(url)}">${text}</a>`;

// news: date badge, title, text, tags. "new" = dated within the last 7 days (local dates, future-dated items are not new)
function newsItem(it, D) {
  const d = parseDate(it.date), now = new Date(), age = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - d) / 864e5);
  const c = it.course ? courseOf(D, it.course) : null, yr = d.getFullYear() === now.getFullYear() ? "" : ` ${d.getFullYear()}`;
  return `<time class="nd" datetime="${esc(it.date)}">${fmtDate(d)}${yr}</time><div class="nb"><b>${it.title}</b>` +
    (age >= 0 && age <= 7 ? ' <span class="tag off">new</span>' : "") + (it.text ? `<div class="nt">${it.text}</div>` : "") +
    (it.source ? ` <span class="tag">${esc(it.source)}</span>` : "") + (it.unconfirmed ? ' <span class="tag unc">? unconfirmed</span>' : "") +
    (c ? ` <span class="tag ctag c-${esc(c.color || "grey")}">${esc(c.short || c.title)}</span>` : "") + `</div>`;
}

const ITEMS = { // kind -> how one item becomes <li> content
  list: t => t,
  news: newsItem,
  links: i => link(i.url, i.label) + (i.note ? ` – ${i.note}` : ""),
  contacts: i => [`<b>${i.name}</b>`, i.role, i.email && link("mailto:" + i.email, esc(i.email)), i.phone && link("tel:" + i.phone.replace(/[^\d+]/g, ""), esc(i.phone)), i.note].filter(Boolean).join(" · ")
};

function tableHTML(sec) {
  return `<div class="tw"><table class="tbl"><thead><tr>${sec.columns.map(c => `<th>${c}</th>`).join("")}</tr></thead>` +
    `<tbody>${sec.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function courseHead(D, sec) {
  const c = courseOf(D, sec.course), bits = [];
  if ((c.teachers || []).length) bits.push(c.teachers.map(t => esc(t.name) + (t.role ? ` (${esc(t.role)})` : "")).join(", "));
  if (c.ects) bits.push(`${c.ects} ECTS`);
  if (c.evaluation) bits.push(`evaluation <b>${esc(c.evaluation)}</b>`);
  const ppl = [...(c.teachers || []).filter(t => t.email || t.phone || t.note), ...(c.contacts || [])], gs = gradingSummary(c);
  return (bits.length ? `<p class="chead">${bits.join(" · ")}</p>` : "") +
    (gs ? `<p class="chead">Grading: ${gs}${(c.grading || {}).passRule ? " · " + esc(c.grading.passRule) : ""}</p>` : "") +
    (ppl.length ? `<p class="chead">Contacts: ${peopleLine(ppl)}</p>` : "");
}

// store(scope) -> {done, save}: done = Set of ticked item ids, persisted through save()
function renderSections(app, D, set, store) {
  (D.sections || []).forEach(sec => {
    if (sec.kind === "schedule" && !((D.weeks || {}).segments || []).length) return; // semester without a timetable
    if (sec.kind === "calendar" && !((D.calendar || {}).months || (D.calendar || {}).semesters || []).length) return;
    const {done, save} = store(sec._scope), s = document.createElement("section"), id = sec.id || sec._i;
    const title = sec.title || (sec.kind === "course" ? courseOf(D, sec.course).title : "");
    if (sec.kind === "course") s.className = `course c-${courseOf(D, sec.course).color || "grey"}`;
    if (sec.highlight) s.classList.add("todo");
    if (sec.pinned) s.dataset.pinned = "1";
    s.dataset.tab = sec.tab || defaultTab(sec);
    s.innerHTML = `<h2>${title}</h2>`;
    if (sec.kind === "schedule" || sec.kind === "calendar") {
      s.classList.add("custom", "builtin");
      const box = document.createElement("div"); s.append(box);
      if (sec.kind === "schedule") renderSchedule(box, D);
      else renderCalendar(box, D, defaultSemester(D), `data/${set}/`);
    } else if (sec.kind === "studyplan" || sec.kind === "directory") {
      s.insertAdjacentHTML("beforeend", sec.kind === "studyplan" ? studyplanHTML(D) : directoryHTML(D));
    } else if (sec.kind === "table") {
      s.insertAdjacentHTML("beforeend", tableHTML(sec));
    } else {
      if (sec.kind === "course") s.insertAdjacentHTML("beforeend", courseHead(D, sec));
      const ul = document.createElement("ul"), fmt = ITEMS[sec.kind] || ITEMS.list;
      let items = sec.items || [];
      if (sec.kind === "news") { ul.className = "news"; items = [...items].sort((a, b) => b.date.localeCompare(a.date)); } // stable: ties keep file order
      items.forEach((it, ii) => {
        const li = document.createElement("li"), key = `${id}:${ii}`;
        const text = fmt(it, D);
        if (typeof it === "string" && it.startsWith("[ ] ")) {
          li.className = "check" + (done.has(key) ? " done" : "");
          li.innerHTML = `<label><input type="checkbox" ${done.has(key) ? "checked" : ""}> ${text.slice(4)}</label>`;
          li.querySelector("input").onchange = e => {
            e.target.checked ? done.add(key) : done.delete(key);
            li.classList.toggle("done", e.target.checked);
            save();
          };
        } else li.innerHTML = text;
        ul.append(li);
      });
      s.append(ul);
    }
    app.append(s);
  });
}

// Tabs: a section goes to its `tab` id, else to a default tab by kind. D.tabs ([{id,title}]) overrides the default tab list.
const AUTO_TAB = {news: "news", schedule: "schedule", calendar: "calendar", course: "courses", studyplan: "plan", directory: "contacts", contacts: "contacts", links: "info", table: "info"};
const DEFAULT_TABS = [["news", "News"], ["todo", "To-Do"], ["schedule", "Schedule"], ["calendar", "Calendar"], ["courses", "Courses"], ["plan", "Study plan"], ["contacts", "Contacts"], ["info", "Info"]];

// a list with a tickable item or `highlight` is a to-do list, any other list is news
const defaultTab = sec => sec.kind === "list" ? ((sec.highlight || (sec.items || []).some(t => typeof t === "string" && t.startsWith("[ ] "))) ? "todo" : "news") : AUTO_TAB[sec.kind] || "news";

// returns the tab list for D and moves sections with an unknown tab into the first one
function setupTabs(D) {
  const secs = [...document.querySelectorAll("#app section")];
  let tabs = D.tabs || DEFAULT_TABS.map(([id, title]) => ({id, title}));
  if (!tabs.some(t => t.id === "overview")) secs.forEach(s => { if (s.dataset.tab === "overview") s.dataset.tab = "news"; }); // old data sets
  if (!D.tabs) tabs = tabs.filter(t => secs.some(s => s.dataset.tab === t.id)); // drop empty default tabs
  const ids = tabs.map(t => t.id);
  secs.forEach(s => { if (!ids.includes(s.dataset.tab)) s.dataset.tab = ids[0]; });
  return tabs;
}

const ICON = { // one 24px outline path per tab id; custom tabs get a dot
  news: "M4 5h13v14H6a2 2 0 01-2-2zM17 9h3v8a2 2 0 01-2 2M8 9h5M8 13h5", todo: "M5 4h14v16H5zM8.5 9l1.5 1.5L13 7.5M8.5 15l1.5 1.5 3-3M15 10h1M15 16h1", schedule: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4", courses: "M4 19V5a1 1 0 011-1h13v14H6a2 2 0 00-2 2zM4 19a2 2 0 002 2h14",
  plan: "M5 4h14v16H5zM9 9h6M9 13h6M9 17h3", contacts: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  info: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v6M12 7.5v.01"
};
const icon = id => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON[id] || "M12 10.5v3"}"/></svg>`;

// sidebar nav: mark tab `cur` (first tab if unknown) and show only its sections; links point at #<semesterId>/<tab>
function showTab(tabs, cur, semId) {
  document.body.classList.toggle("tabbed", tabs.length > 0);
  if (cur === "overview" && !tabs.some(t => t.id === "overview")) cur = "news"; // old links
  if (!tabs.some(t => t.id === cur)) cur = (tabs[0] || {}).id;
  document.getElementById("tabs").innerHTML = tabs.map(t => `<a href="#${esc(semId)}/${esc(t.id)}"${t.id === cur ? ' class="on" aria-current="page"' : ""}>${icon(t.id)}${t.title}</a>`).join("");
  document.querySelectorAll("#app section").forEach(s => s.classList.toggle("on", s.dataset.tab === cur));
  return cur;
}

// filter box: hides non-matching items; built-in schedule/calendar and pinned sections stay visible
function applyFilter(q) {
  q = q.toLowerCase();
  document.body.classList.toggle("searching", !!q); // searching shows matches from every tab
  document.querySelectorAll("#app section").forEach(s => {
    let any = false;
    s.querySelectorAll("li, tbody tr").forEach(el => {
      const m = el.textContent.toLowerCase().includes(q);
      el.classList.toggle("hide", !m);
      any ||= m;
    });
    s.classList.toggle("hide", !any && !s.classList.contains("builtin") && !s.dataset.pinned);
  });
}
