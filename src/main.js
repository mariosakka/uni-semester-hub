// Loads data/<set>/data.js (?set=<name>, default "sample"), then routes #<semesterId>/<tab> and renders the selected semester.
const metaSet = document.querySelector('meta[name="hub-default-set"]');
const SET = new URLSearchParams(location.search).get("set") || (metaSet && metaSet.content) || "sample";
const appEl = document.getElementById("app");

// static HTML text comes from the string table: a data-t attribute (key) sets textContent, data-ta (attr=key pairs separated by ;) sets attributes
function applyStatic() {
  document.documentElement.lang = HUB_LOCALE;
  document.querySelectorAll("[data-t]").forEach(el => { el.textContent = t(el.dataset.t); });
  document.querySelectorAll("[data-ta]").forEach(el => el.dataset.ta.split(";").forEach(p => { const [a, k] = p.split("="); el.setAttribute(a, t(k)); }));
}
applyStatic();
document.title = t("doc.title");

function fail(msg) { appEl.innerHTML = ""; const p = document.createElement("p"); p.textContent = msg; appEl.append(p); }

const el = (tag, cls) => Object.assign(document.createElement(tag), cls ? {className: cls} : {});
const web = u => /^https?:\/\//.test(u || ""); // only http(s) links from data

// meta.logos as a row of linked logos, each with an optional background badge (for logos with white artwork); null if there are none
function logoRow(M) {
  const logos = (M.logos || []).filter(l => l.src);
  if (!logos.length) return null;
  const row = el("div", "logos");
  logos.forEach(l => {
    const box = el(web(l.url) ? "a" : "span", "logo"), img = el("img");
    if (web(l.url)) box.href = l.url;
    if (l.bg) box.style.background = l.bg;
    img.src = `data/${SET}/${l.src}`; img.alt = l.alt || "";
    box.append(img); row.append(box);
  });
  return row;
}

// footer from meta: logos, programme line, author, disclaimer; nothing for absent keys
function renderFoot(M) {
  const foot = document.getElementById("foot");
  const logos = logoRow(M);
  if (logos) foot.append(logos);
  const line = M.programmeLine || M.programme;
  if (line) foot.append(Object.assign(el("p"), {textContent: line}));
  const a = M.author;
  if (a && a.name) {
    const p = el("p"), [before, after = ""] = t("footer.madeBy", {name: ""}).split(""); // the name sits where the text puts {name}
    p.append(before);
    if (web(a.url)) p.append(Object.assign(el("a"), {href: a.url, textContent: a.name})); else p.append(a.name);
    p.append(after);
    foot.append(p);
  }
  if (M.disclaimer) foot.append(Object.assign(el("p", "dis"), {textContent: M.disclaimer}));
}

function boot(raw) {
  setStrings(raw && raw.meta); // before anything renders: overrides + locale
  applyStatic();
  const N = normalize(raw), M = N.meta, SEMS = flatten(N), auto = autoSemester(SEMS);
  document.title = M.title || t("doc.title");
  document.getElementById("title").textContent = M.title || t("doc.title");
  renderFoot(M);
  const top = logoRow(M); // same logos at the top of the sidebar
  if (top) document.getElementById("side-logos").append(top);

  // tick state: legacy sets keep their old single key; v2 stores ticks per semester plus one shared "common" bucket
  const stores = {};
  const store = scope => stores[scope] ||= (() => {
    const key = scope === "legacy" ? `hub-done:${SET}` : `hub-done:${SET}:${scope}`;
    let done;
    try { done = new Set(JSON.parse(localStorage.getItem(key) || "[]")); } catch { done = new Set(); }
    return {done, save: () => { try { localStorage.setItem(key, JSON.stringify([...done])); } catch {} }}; // blocked storage: ticks last until reload
  })();

  let shown = null, tabs = [], curTab;
  const qEl = document.getElementById("q"), side = document.getElementById("side"), menu = document.getElementById("menu");
  document.getElementById("prog").textContent = M.programme || M.university || "";

  // phones/tablets: the sidebar is an off-canvas drawer (CSS); on desktop it is always visible and these do nothing visible
  const setNav = (open, refocus) => {
    document.body.classList.toggle("nav-open", open);
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", t(open ? "nav.menuClose" : "nav.menuOpen"));
    if (open) side.focus(); else if (refocus) menu.focus();
  };
  const navOpen = () => document.body.classList.contains("nav-open");
  menu.onclick = () => setNav(!navOpen(), true);
  document.getElementById("scrim").onclick = () => setNav(false, true);
  addEventListener("keydown", e => { if (e.key === "Escape" && navOpen()) setNav(false, true); });
  side.addEventListener("click", e => { if (e.target.closest("a")) setNav(false); });

  // Year / Semester selects below the page list. Semester titles may repeat across years (e.g. "Semester 1" in every year), so the bar and
  // plan show the year title as well. Changing a select navigates through the hash; route() keeps the selects in sync (back/forward).
  const yearTitle = sem => (N.years.find(y => y.id === sem.yearId) || {}).title || "";
  function renderSems(sem) {
    const years = N.years.filter(y => SEMS.some(s => s.yearId === y.id)), ss = SEMS.filter(s => s.yearId === sem.yearId);
    const sel = (id, label, opts) => `<label for="${id}">${label}</label><select id="${id}">${opts}</select>`;
    const opt = (v, text, on) => `<option value="${esc(v)}"${on ? " selected" : ""}>${text}</option>`;
    document.getElementById("sems").innerHTML = SEMS.length < 2 ? "" : `<h2>${esc(t("nav.semesterHeading"))}</h2>` +
      (years.length > 1 ? sel("ysel", esc(t("nav.year")), years.map(y => opt(y.id, esc(y.title), y.id === sem.yearId)).join("")) : "") +
      sel("ssel", esc(t("nav.semester")), ss.map(x => opt(x.id, esc(x === auto ? t("nav.semesterNow", {title: x.title}) : x.title), x === sem)).join(""));
  }
  document.getElementById("sems").onchange = e => {
    let id = e.target.value;
    if (e.target.id === "ysel") { const ys = SEMS.filter(s => s.yearId === id); id = (ys.find(s => s === auto) || ys[0]).id; } // that year's automatic or first semester
    location.hash = `#${id}/${curTab ? curTab.id : ""}`; // a tab the new semester lacks falls back to its first tab in showTab()
    setNav(false);
  };

  // top bar (phones, drawer closed): "Year · Semester · tab"
  const setHead = () => {
    document.getElementById("ptitle").innerHTML = qEl.value ? esc(t("nav.searchResults")) : (curTab ? curTab.title : "");
    const sem = shown, y = N.years.length > 1 ? yearTitle(sem) : "";
    document.getElementById("bar-sem").textContent = qEl.value ? t("nav.searchResults") : [y, sem.title, curTab && curTab.title].filter(Boolean).join(" · ");
  };

  // one view per semester, shared by everything that reads it (the page, the Calendar's day modal and Year view, subgroup choices);
  // viewFor(day) gives the view of the semester a day belongs to, openWeek(w) jumps to a week of the Schedule tab
  const views = {};
  let goto = null; // {sem, w}: a week to show once that semester has been rendered
  function viewOf(sem) {
    if (views[sem.id]) return views[sem.id];
    const V = views[sem.id] = semesterView(N, sem);
    V.groupKey = N.legacy ? `hub-groups:${SET}` : `hub-groups:${SET}:${sem.id}`;
    V.viewFor = key => { const s = semOfDate(SEMS, key); return s ? viewOf(s) : V; };
    V.openWeek = w => {
      if (shown && shown.id === sem.id) V.showWeek && V.showWeek(w); else goto = {sem: sem.id, w};
      location.hash = `#${sem.id}/schedule`;
    };
    return V;
  }

  function route() {
    const r = parseRoute(location.hash, SEMS, auto), sem = r.sem;
    if (sem !== shown) { // (re)build the page for this semester
      shown = sem;
      const V = viewOf(sem);
      appEl.innerHTML = "";
      renderSections(appEl, V, SET, store);
      if (goto && goto.sem === sem.id) { V.showWeek(goto.w); goto = null; }
      tabs = setupTabs(V);
      applyFilter(qEl.value);
    }
    renderSems(sem);
    curTab = tabs.find(t => t.id === showTab(tabs, r.tab, sem.id));
    const canon = `#${sem.id}/${curTab ? curTab.id : ""}`; // a tab the semester lacks (or an old #overview/#y2s1 link) is rewritten to the tab actually shown
    if (location.hash && location.hash !== canon) history.replaceState(null, "", canon);
    setHead();
    if (!document.body.classList.contains("searching")) window.scrollTo(0, 0);
  }

  qEl.oninput = e => { applyFilter(e.target.value); setHead(); };
  qEl.onkeydown = e => { if (e.key === "Enter") { qEl.blur(); setNav(false); } }; // phones: Enter closes the drawer to show the results
  addEventListener("hashchange", route); // registered once; route() re-renders only when the semester changes
  route();
}

if (!/^\w[\w.-]*$/.test(SET)) fail(t("err.invalidSet"));
else {
  const s = document.createElement("script");
  s.src = `data/${SET}/data.js`;
  s.onload = () => boot(window.HUB_DATA);
  s.onerror = () => fail(t("err.setNotFound", {set: SET}));
  document.head.append(s);
}
