import {t} from "./strings.js";
import {esc} from "./util.js";
import {ITEMS} from "./render.js";
// Study plan / directory pure helpers (rendered by components/plan/*.vue). Needs esc (util.js) and ITEMS (render.js) at call time.

export const HOURS = [["course", "plan.abbr.course", "plan.hours.course"], ["seminar", "plan.abbr.seminar", "plan.hours.seminar"], ["lab", "plan.abbr.lab", "plan.hours.lab"], ["project", "plan.abbr.project", "plan.hours.project"]]; // [field, abbreviation key, name key]
export const EVAL = {E: ["exam", "plan.eval.exam"], V: ["cont", "plan.eval.cont"], P: ["proj", "plan.eval.proj"]}; // first letter of `evaluation` -> [css class, name key]
export const evalCode = c => String(c.evaluation || "").trim().charAt(0).toUpperCase();
export const hoursSum = h => HOURS.reduce((n, [k]) => n + (+(h || {})[k] || 0), 0);
// "–" when no ECTS are known, "≥N ECTS" when only some are, "N ECTS" when all are (unknown is never summed as 0)
export const ectsLabel = cs => {
  const known = (cs || []).filter(c => +c.ects), n = known.reduce((t, c) => t + +c.ects, 0);
  return !known.length ? t("plan.unknown") : known.length < cs.length ? t("plan.ectsAtLeast", {n}) : t("plan.ects", {n});
};
// counts for the stat strip; hoursKnown = subjects that have weekly hours (partial totals are shown as "≥N")
export function planStats(cs) {
  cs = cs || [];
  const withHours = cs.filter(c => hoursSum(c.hours) > 0);
  return {subjects: cs.length, hours: withHours.reduce((n, c) => n + hoursSum(c.hours), 0), hoursKnown: withHours.length,
    exams: cs.filter(c => evalCode(c) === "E").length, continuous: cs.filter(c => evalCode(c) === "V").length,
    other: cs.filter(c => c.evaluation && evalCode(c) !== "E" && evalCode(c) !== "V").length};
}
export const barPct = (v, max) => Math.max(0, Math.min(100, Math.round(100 * (+v || 0) / (max || 1)))); // bar width in %

// "Final exam 60%, Project 40%" or "" when no components are given
export const gradingSummary = c => ((c.grading || {}).components || []).map(x => esc(x.name) + (x.weight != null ? ` ${x.weight}%` : "")).join(", ");

export const people = c => [...(c.teachers || []), ...(c.contacts || [])];
export const peopleLine = list => list.map(p => ITEMS.contacts(p)).join("; ");
