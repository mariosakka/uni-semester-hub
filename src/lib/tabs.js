import {t} from "./strings.js";

// Tabs: a section goes to its `tab` id, else to a default tab by kind. D.tabs ([{id,title}]) overrides the default tab list.
export const AUTO_TAB = {news: "news", schedule: "schedule", calendar: "calendar", course: "courses", studyplan: "plan", directory: "contacts", contacts: "contacts", links: "info", table: "info"};
export const DEFAULT_TABS = [["news", "tab.news"], ["todo", "tab.todo"], ["schedule", "tab.schedule"], ["calendar", "tab.calendar"], ["courses", "tab.courses"], ["plan", "tab.plan"], ["contacts", "tab.contacts"], ["info", "tab.info"]]; // [id, string key]

// a `highlight` list is a to-do list, any other list is news
export const defaultTab = sec => sec.kind === "list" ? (sec.highlight ? "todo" : "news") : AUTO_TAB[sec.kind] || "news";

// schedule/calendar sections of a semester without that data are not shown
export const sectionShown = (D, sec) =>
  !(sec.kind === "schedule" && !((D.weeks || {}).segments || []).length) &&
  !(sec.kind === "calendar" && !((D.calendar || {}).months || (D.calendar || {}).semesters || []).length);

// tab id a section asks for, old "overview" -> news unless the data set has an overview tab
const rawTab = (D, sec) => {
  const id = sec.tab || defaultTab(sec);
  return id === "overview" && !(D.tabs || []).some(x => x.id === "overview") ? "news" : id;
};

// tab list for D: D.tabs, else the default tabs that have at least one shown section
export function tabsFor(D) {
  const secs = (D.sections || []).filter(s => sectionShown(D, s));
  return D.tabs || DEFAULT_TABS.map(([id, key]) => ({id, title: t(key)})).filter(x => secs.some(s => rawTab(D, s) === x.id));
}

// final tab id of a section (unknown tab -> first tab)
export function tabOf(D, sec) {
  const ids = tabsFor(D).map(x => x.id), id = rawTab(D, sec);
  return ids.includes(id) ? id : ids[0];
}

export const TAB_ICON = { // one 24px outline path per tab id; custom tabs get a dot
  news: "M4 5h13v14H6a2 2 0 01-2-2zM17 9h3v8a2 2 0 01-2 2M8 9h5M8 13h5", todo: "M5 4h14v16H5zM8.5 9l1.5 1.5L13 7.5M8.5 15l1.5 1.5 3-3M15 10h1M15 16h1", schedule: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4", courses: "M4 19V5a1 1 0 011-1h13v14H6a2 2 0 00-2 2zM4 19a2 2 0 002 2h14",
  plan: "M5 4h14v16H5zM9 9h6M9 13h6M9 17h3", contacts: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  info: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v6M12 7.5v.01"
};
export const tabIcon = id => TAB_ICON[id] || "M12 10.5v3";
