import {t} from "./strings.js";
import {courseOf} from "./schedule.js";
// Subgroup selection. The user's subgroup per course is discovered from the timetable, chosen in the Schedule toolbar, stored per
// data set + semester, and read by visible() (schedule.js) so every list of sessions (grid, agenda, calendar, modal, .ics) agrees.
// D (a semester view) carries: D.groupKey (storage key, set by main.js), D.groupSel (cached explicit choices). With nothing stored every subgroup is shown.
export const groupMem = {}; // in-memory fallback when localStorage is blocked (Safari private mode): choices last until reload

// courses that have grouped sessions: [{course, groups: ["1", "2"]}]; cached per D (the timetable never changes after load)
const groupMaps = new WeakMap();
export function groupMap(D) {
  if (groupMaps.has(D)) return groupMaps.get(D);
  const by = {};
  (D.timetable || []).forEach(e => { if (e.group) (by[e.course] ||= new Set()).add(String(e.group)); });
  groupMaps.set(D, by);
  Object.keys(by).forEach(c => { by[c] = [...by[c]].sort(); });
  return by;
}
export const discoverGroups = D => Object.entries(groupMap(D)).map(([course, groups]) => ({course, groups}));

export function loadGroupSel(key) {
  try { const v = JSON.parse(localStorage.getItem(key) || "null"); if (v && typeof v === "object" && !Array.isArray(v)) return v; } catch { /* blocked or corrupt */ }
  return groupMem[key] || {};
}
export const groupSel = D => D.groupSel || (D.groupSel = D.groupKey ? loadGroupSel(D.groupKey) : {});
export function saveGroupSel(D) {
  if (!D.groupKey) return;
  groupMem[D.groupKey] = D.groupSel;
  try { localStorage.setItem(D.groupKey, JSON.stringify(D.groupSel)); } catch { /* ticks last until reload */ }
}

// "all" or the subgroup value that applies to a course: the stored choice, else "all";
// unknown values (a subgroup the timetable does not have) are ignored, courses without grouped sessions are never filtered
export function groupFor(D, course) {
  const known = groupMap(D)[course];
  if (!known) return "all";
  const sel = groupSel(D);
  const ok = v => v === "all" || (v !== undefined && v !== null && known.includes(String(v)));
  return ok(sel[course]) ? String(sel[course]) : "all";
}

// the single filtering rule: ungrouped sessions always show; grouped ones only for the selected subgroup (or when "all")
export function visible(D, e) {
  if (!e.group) return true;
  const g = groupFor(D, e.course);
  return g === "all" || g === String(e.group);
}

export function setGroup(D, course, value) { groupSel(D)[course] = value; saveGroupSel(D); }
export function setAllGroups(D, value) { // value "all" or a subgroup; a course lacking that subgroup keeps showing all of its groups
  const sel = groupSel(D);
  discoverGroups(D).forEach(g => { sel[g.course] = g.groups.includes(value) ? value : "all"; });
  saveGroupSel(D);
}
export function resetGroups(D) { D.groupSel = {}; saveGroupSel(D); }

// compact chip text, e.g. "SG2 · Foundations: SG1" or "All subgroups"
export function groupSummary(D) {
  const list = discoverGroups(D).map(g => ({c: courseOf(D, g.course), v: groupFor(D, g.course)}));
  if (!list.length) return "";
  if (list.every(x => x.v === "all")) return t("schedule.groups.all");
  const label = v => v === "all" ? t("schedule.groups.all") : t("schedule.subgroup", {n: v}), count = {};
  list.forEach(x => { count[x.v] = (count[x.v] || 0) + 1; });
  const base = Object.keys(count).sort((a, b) => count[b] - count[a] || a.localeCompare(b))[0]; // most common choice
  return [label(base), ...list.filter(x => x.v !== base).map(x => t("schedule.groups.exception", {course: x.c.short || x.c.title, group: label(x.v)}))].join(" · ");
}
