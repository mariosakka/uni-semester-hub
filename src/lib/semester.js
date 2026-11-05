import {t} from "./strings.js";
import {iso, parseDate, addDays} from "./util.js";
// Programme -> years -> semesters: pure helpers (normalize, flatten, autoSemester, semesterView, parseRoute).

// legacy flat data (no `years`) becomes one year with one semester
export function normalize(D) {
  const meta = D.meta || {};
  if (D.years) return {meta, common: D.common || [], years: D.years.map(y => ({id: y.id, title: y.title, semesters: y.semesters || []})), legacy: false};
  const sem = {...D}; delete sem.meta;
  sem.id = "s1"; sem.title = meta.semester || t("nav.semester");
  return {meta, common: [], years: [{id: "y1", title: meta.academicYear || "", semesters: [sem]}], legacy: true};
}

export const flatten = N => N.years.flatMap(y => y.semesters.map(s => ({...s, yearId: y.id})));

// first day of a semester: its first teaching week, else its first calendar period; null = never automatic
export function semStart(s) {
  const w = ((s.weeks || {}).segments || [])[0], ps = ((s.calendar || {}).periods || []).map(p => p.from).sort();
  return w ? w.start : ps[0] || null;
}

// the last semester that has started; the first one before any has; the first one if none has dates
export function autoSemester(list, today = new Date()) {
  const dated = list.filter(semStart).sort((a, b) => semStart(a).localeCompare(semStart(b)));
  if (!dated.length) return list[0];
  const t = iso(today);
  return [...dated].reverse().find(s => semStart(s) <= t) || dated[0];
}

// first and last day (YYYY-MM-DD) a semester covers: its weeks and calendar periods; null when it has neither
export function semRange(s) {
  const days = [];
  ((s.weeks || {}).segments || []).forEach(g => { days.push(g.start, iso(addDays(parseDate(g.start), 7 * g.count - 1))); });
  ((s.calendar || {}).periods || []).forEach(p => days.push(p.from, p.to));
  days.sort();
  return days.length ? [days[0], days[days.length - 1]] : null;
}
// the semester (of a flattened list) whose range contains the day, else null
export const semOfDate = (list, key) => list.find(s => { const r = semRange(s); return r && key >= r[0] && key <= r[1]; }) || null;

// the academic year of a semester for the Calendar's Year view: its semesters' months plus merged periods / days off / deadline markers
export function yearData(N, sem) {
  const y = N.years.find(x => x.id === sem.yearId) || {title: "", semesters: [sem]}, out = {title: y.title || "", semesters: [], periods: [], daysOff: {}, keyDates: []};
  y.semesters.forEach(s => {
    const C = s.calendar || {}, months = C.semesters ? C.semesters.flatMap(x => x.months) : (C.months || []);
    if (months.length) out.semesters.push({id: s.id, title: s.title, months});
    out.periods.push(...(C.periods || [])); out.keyDates.push(...(s.keyDates || []));
    Object.assign(out.daysOff, s.daysOff || {});
  });
  return out;
}

// what the existing renderers read: the semester's fields plus programme meta and common sections
export function semesterView(N, sem) {
  const scoped = (arr, scope) => (arr || []).map((s, i) => ({...s, _scope: scope, _i: i}));
  return {...sem, meta: N.meta, legacy: N.legacy, programme: N, year: yearData(N, sem),
    sections: [...scoped(N.common, "common"), ...scoped(sem.sections, N.legacy ? "legacy" : sem.id)]};
}

// "#<semesterId>/<tab>"; a lone "#<tab>" (old links) means the automatic semester
export function parseRoute(hash, sems, auto) {
  const [a, b] = hash.replace(/^#/, "").split("/");
  const sem = sems.find(s => s.id === a);
  return sem ? {sem, tab: b || ""} : {sem: auto, tab: a || ""};
}
