import {test, expect} from "vitest";
import {normalize, flatten, autoSemester, semesterView, parseRoute} from "./semester.js";
import {parseDate} from "./util.js";

const sem = (id, start, extra = {}) => ({id, title: id, weeks: start ? {segments: [{start, count: 12}]} : undefined, ...extra});
const V2 = {meta: {title: "P"}, common: [{kind: "list", items: ["c"]}], years: [
  {id: "y1", title: "Y1", semesters: [sem("y1s1", "2026-09-28", {sections: [{kind: "list"}]}), sem("y1s2", "2027-03-01")]},
  {id: "y2", title: "Y2", semesters: [sem("y2s1", null, {courses: [{id: "a"}]}), sem("y2s2", "2028-03-01")]}]};
const N = normalize(V2), S = flatten(N);

test("flatten keeps year ids", () => {
  expect(S.map(s => s.id)).toEqual(["y1s1", "y1s2", "y2s1", "y2s2"]);
  expect(S[2].yearId).toBe("y2");
});

test("autoSemester", () => {
  const at = d => autoSemester(S, new Date(d + "T12:00")).id;
  expect(at("2026-01-01")).toBe("y1s1"); // before the first semester
  expect(at("2026-11-04")).toBe("y1s1");
  expect(at("2027-02-20")).toBe("y1s1"); // inter-semester break stays on the previous one
  expect(at("2027-03-01")).toBe("y1s2"); // starts on its first day
  expect(at("2028-01-01")).toBe("y1s2"); // undated placeholder is never automatic
  expect(at("2030-01-01")).toBe("y2s2"); // after the last
  expect(autoSemester([{id: "x"}], new Date()).id).toBe("x"); // no dates: first
});

test("normalize wraps legacy flat data", () => {
  const L = normalize({meta: {semester: "Sem 1", academicYear: "2026"}, weeks: {segments: [{start: "2026-09-28", count: 1}]}, sections: []});
  expect(L.legacy && L.years[0].semesters[0].id === "s1" && L.years[0].title === "2026" && L.years[0].semesters[0].title === "Sem 1" && !("meta" in L.years[0].semesters[0])).toBe(true);
});

test("semesterView scopes common and own sections", () => {
  const V = semesterView(N, S[0]);
  expect(V.sections.map(s => [s._scope, s._i])).toEqual([["common", 0], ["y1s1", 0]]);
  expect(V.meta.title).toBe("P");
});

test("parseRoute", () => {
  const route = (h, a) => parseRoute(h, S, S[a]);
  expect([route("#y1s2/plan", 0).sem.id, route("#y1s2/plan", 0).tab]).toEqual(["y1s2", "plan"]);
  expect([route("#schedule", 1).sem.id, route("#schedule", 1).tab]).toEqual(["y1s2", "schedule"]); // old #tab links
  expect([route("", 0).sem.id, route("", 0).tab]).toEqual(["y1s1", ""]);
});

test("parseDate builds local dates", () => expect(parseDate("2026-09-28").getDate()).toBe(28));
