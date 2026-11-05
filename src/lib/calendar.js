import {pad, parseDate, addDays} from "./util.js";
import {weekCount, mondayOf, weekSessions} from "./schedule.js";
// Academic calendar helpers (node-tested): ranges, week lookup, per-day state and the day-modal data. Rendering: components/calendar/.
export const CAL_MODES = [["week", "calendar.mode.week"], ["month", "calendar.mode.month"], ["year", "calendar.mode.year"]]; // [mode, string key]
export const kd = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

// months the semester's calendar shows ([[year, month0], ...]); a legacy calendar.semesters list is merged
export const calMonths = D => { const C = D.calendar || {}; return C.semesters ? C.semesters.flatMap(x => x.months) : (C.months || []); };
// first and last day (Dates) of those months
export function calRange(D) {
  const ms = calMonths(D), f = ms[0], l = ms[ms.length - 1];
  return [new Date(f[0], f[1], 1), new Date(l[0], l[1] + 1, 0)];
}
export const clampDate = (d, lo, hi) => d < lo ? lo : d > hi ? hi : d;
export const mondayOfDate = d => addDays(d, -((d.getDay() + 6) % 7));
// the month to show: the month of `date`, or the nearest month of the range when `date` is outside it
export function nearestMonth(D, date) { const [lo, hi] = calRange(D), c = clampDate(date, lo, hi); return [c.getFullYear(), c.getMonth()]; }

// teaching week number of a date (null in breaks, outside the term, or without a timetable)
export function weekNumberOf(D, date) {
  if (!D.weeks || !(D.weeks.segments || []).length) return null;
  for (let w = 1, n = weekCount(D); w <= n; w++) { const m = mondayOf(D, w); if (date >= m && date < addDays(m, 7)) return w; }
  return null;
}

// what a calendar source (a semester, or the merged year) says about one day
export function dayState(src, k) {
  const p = ((src.calendar || {}).periods || []).find(x => k >= x.from && k <= x.to) || null;
  return {p, off: (src.daysOff || {})[k] || "", ev: (src.keyDates || []).filter(e => k >= e.from && k <= (e.to || e.from))};
}
export const dayTip = st => [st.p && st.p.label, st.off, ...st.ev.map(e => e.label)].filter(Boolean).join(" · ");
export function dayClass(st, k, today) {
  const wk = (parseDate(k).getDay() + 6) % 7 >= 5, kind = st.p && (st.p.kind === "break" || st.p.kind === "vac" ? "off" : st.p.kind);
  return ["d", kind || "", st.off ? "off" : "", wk ? "we" : "", st.ev.length ? "key " + st.ev[0].kind : "", k === today ? "today" : ""].join(" ");
}

// everything the day modal shows, as data: period, day off, deadlines/exams, sessions (with deviations), news dated that day
export function dayInfo(D, key) {
  const date = parseDate(key), st = dayState(D, key), w = weekNumberOf(D, date);
  const sessions = w ? weekSessions(D, w).filter(s => s.key === key).sort((a, b) => a.start - b.start) : [];
  const news = (D.sections || []).filter(s => s.kind === "news").flatMap(s => (s.items || []).filter(i => i.date === key));
  return {key, date, week: w, parity: w ? (w % 2 ? "odd" : "even") : null, period: st.p, off: st.off, keys: st.ev, sessions, news};
}
