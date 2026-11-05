// Loads data/<set>/data.js (?set=<name>, default from <meta name="hub-default-set">), then mounts the app (routes #<semesterId>/<tab>).
import {createApp, h} from "vue";
import "./styles/base.css";
import App from "./App.vue";
import {HUB_LOCALE, setStrings, t} from "./lib/strings.js";
import {normalize, flatten, autoSemester, semesterView, semOfDate} from "./lib/semester.js";
import {scheduleTarget} from "./lib/shared.js";

const metaSet = document.querySelector('meta[name="hub-default-set"]');
const SET = new URLSearchParams(location.search).get("set") || (metaSet && metaSet.content) || "sample";
document.title = t("doc.title");

const fail = msg => createApp({render: () => h("div", {id: "content"}, h("main", {id: "app"}, h("p", msg)))}).mount("#root");

function boot(raw) {
  setStrings(raw && raw.meta); // before anything renders: overrides + locale
  document.documentElement.lang = HUB_LOCALE;
  const N = normalize(raw), SEMS = flatten(N), auto = autoSemester(SEMS);
  document.title = N.meta.title || t("doc.title");

  // tick state: legacy sets keep their old single key; v2 stores ticks per semester plus one shared "common" bucket
  const stores = {};
  const store = scope => stores[scope] ||= (() => {
    const key = scope === "legacy" ? `hub-done:${SET}` : `hub-done:${SET}:${scope}`;
    let done;
    try { done = new Set(JSON.parse(localStorage.getItem(key) || "[]")); } catch { done = new Set(); }
    return {done, save: () => { try { localStorage.setItem(key, JSON.stringify([...done])); } catch {} }}; // blocked storage: ticks last until reload
  })();

  // one view per semester, shared by everything that reads it (the page, the Calendar's day modal and Year view, subgroup choices);
  // viewFor(day) gives the view of the semester a day belongs to, openWeek(w) jumps to a week of the Schedule tab
  const views = {};
  function viewOf(sem) {
    if (views[sem.id]) return views[sem.id];
    const V = views[sem.id] = semesterView(N, sem);
    V.groupKey = N.legacy ? `hub-groups:${SET}` : `hub-groups:${SET}:${sem.id}`;
    V.viewFor = key => { const s = semOfDate(SEMS, key); return s ? viewOf(s) : V; };
    V.openWeek = w => { Object.assign(scheduleTarget, {sem: sem.id, w}); location.hash = `#${sem.id}/schedule`; };
    return V;
  }

  createApp(App, {hub: {set: SET, base: `data/${SET}/`, N, SEMS, auto, store, viewOf}}).mount("#root");
}

if (!/^\w[\w.-]*$/.test(SET)) fail(t("err.invalidSet"));
else {
  const s = document.createElement("script");
  s.src = `data/${SET}/data.js`; // relative to the page, from public/
  s.onload = () => boot(window.HUB_DATA);
  s.onerror = () => fail(t("err.setNotFound", {set: SET}));
  document.head.append(s);
}
