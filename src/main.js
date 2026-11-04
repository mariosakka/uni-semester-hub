// Loads data/<set>/data.js (?set=<name>, default "sample"), then routes #<semesterId>/<tab> and renders the selected semester.
const metaSet = document.querySelector('meta[name="hub-default-set"]');
const SET = new URLSearchParams(location.search).get("set") || (metaSet && metaSet.content) || "sample";
const appEl = document.getElementById("app");

function fail(msg) { appEl.innerHTML = ""; const p = document.createElement("p"); p.textContent = msg; appEl.append(p); }

// footer from meta: logos (linked, with optional background badge), programme line, author, disclaimer; nothing for absent keys
function renderFoot(M) {
  const foot = document.getElementById("foot"), el = (tag, cls) => Object.assign(document.createElement(tag), cls ? {className: cls} : {});
  const web = u => /^https?:\/\//.test(u || ""); // only http(s) links from data
  const logos = (M.logos || []).filter(l => l.src);
  if (logos.length) {
    const row = el("div", "logos");
    logos.forEach(l => {
      const box = el(web(l.url) ? "a" : "span", "logo"), img = el("img");
      if (web(l.url)) box.href = l.url;
      if (l.bg) box.style.background = l.bg;
      img.src = `data/${SET}/${l.src}`; img.alt = l.alt || ""; img.loading = "lazy";
      box.append(img); row.append(box);
    });
    foot.append(row);
  }
  const line = M.programmeLine || M.programme;
  if (line) foot.append(Object.assign(el("p"), {textContent: line}));
  const a = M.author;
  if (a && a.name) {
    const p = el("p"); p.append("Made by ");
    if (web(a.url)) p.append(Object.assign(el("a"), {href: a.url, textContent: a.name})); else p.append(a.name);
    foot.append(p);
  }
  if (M.disclaimer) foot.append(Object.assign(el("p", "dis"), {textContent: M.disclaimer}));
}

function boot(raw) {
  const N = normalize(raw), M = N.meta, SEMS = flatten(N), auto = autoSemester(SEMS);
  document.title = M.title || "Semester hub";
  document.getElementById("title").textContent = M.title || "Semester hub";
  renderFoot(M);

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
    menu.setAttribute("aria-label", open ? "Close menu" : "Open menu");
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
    document.getElementById("sems").innerHTML = SEMS.length < 2 ? "" : `<h2>Semester</h2>` +
      (years.length > 1 ? sel("ysel", "Year", years.map(y => opt(y.id, esc(y.title), y.id === sem.yearId)).join("")) : "") +
      sel("ssel", "Semester", ss.map(x => opt(x.id, esc(x.title) + (x === auto ? " · now" : ""), x === sem)).join(""));
  }
  document.getElementById("sems").onchange = e => {
    let id = e.target.value;
    if (e.target.id === "ysel") { const ys = SEMS.filter(s => s.yearId === id); id = (ys.find(s => s === auto) || ys[0]).id; } // that year's automatic or first semester
    location.hash = `#${id}/${curTab ? curTab.id : ""}`; // a tab the new semester lacks falls back to its first tab in showTab()
    setNav(false);
  };

  // top bar (phones, drawer closed): "Year · Semester · tab"
  const setHead = () => {
    document.getElementById("ptitle").innerHTML = qEl.value ? "Search results" : (curTab ? curTab.title : "");
    const sem = shown, y = N.years.length > 1 ? yearTitle(sem) : "";
    document.getElementById("bar-sem").textContent = qEl.value ? "Search results" : [y, sem.title, curTab && curTab.title].filter(Boolean).join(" · ");
  };

  function route() {
    const r = parseRoute(location.hash, SEMS, auto), sem = r.sem;
    if (sem !== shown) { // (re)build the page for this semester
      shown = sem;
      const V = semesterView(N, sem);
      appEl.innerHTML = "";
      renderSections(appEl, V, SET, store);
      tabs = setupTabs(V);
      document.getElementById("subtitle").textContent = sem.subtitle ?? M.subtitle ?? "";
      applyFilter(qEl.value);
    }
    renderSems(sem);
    curTab = tabs.find(t => t.id === showTab(tabs, r.tab, sem.id));
    setHead();
    if (!document.body.classList.contains("searching")) window.scrollTo(0, 0);
  }

  qEl.oninput = e => { applyFilter(e.target.value); setHead(); };
  qEl.onkeydown = e => { if (e.key === "Enter") { qEl.blur(); setNav(false); } }; // phones: Enter closes the drawer to show the results
  addEventListener("hashchange", route); // registered once; route() re-renders only when the semester changes
  route();
}

if (!/^\w[\w.-]*$/.test(SET)) fail("Invalid data set name.");
else {
  const s = document.createElement("script");
  s.src = `data/${SET}/data.js`;
  s.onload = () => boot(window.HUB_DATA);
  s.onerror = () => fail(`Data set "${SET}" not found (expected data/${SET}/data.js).`);
  document.head.append(s);
}
