// Run: node src/semester.test.js   Pure checks for normalize / flatten / autoSemester / semesterView / parseRoute.
const fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
const ctx = vm.createContext({console});
require("../../scripts/loadlib.cjs")(ctx, ["strings", "util", "semester", "plan"]);
const run = (code, vars = {}) => { Object.assign(ctx, vars); return vm.runInContext(code, ctx); };

const sem = (id, start, extra = {}) => ({id, title: id, weeks: start ? {segments: [{start, count: 12}]} : undefined, ...extra});
const V2 = {meta: {title: "P"}, common: [{kind: "list", items: ["c"]}], years: [
  {id: "y1", title: "Y1", semesters: [sem("y1s1", "2026-09-28", {sections: [{kind: "list"}]}), sem("y1s2", "2027-03-01")]},
  {id: "y2", title: "Y2", semesters: [sem("y2s1", null, {courses: [{id: "a"}]}), sem("y2s2", "2028-03-01")]}]};
const N = run("normalize(D)", {D: V2}), S = run("flatten(N)", {N});
assert.deepStrictEqual(S.map(s => s.id), ["y1s1", "y1s2", "y2s1", "y2s2"]);
assert.strictEqual(S[2].yearId, "y2");
const at = d => run("autoSemester(S, new Date(d + 'T12:00'))", {S, d}).id;
assert.strictEqual(at("2026-01-01"), "y1s1", "before the first semester");
assert.strictEqual(at("2026-11-04"), "y1s1");
assert.strictEqual(at("2027-02-20"), "y1s1", "inter-semester break stays on the previous one");
assert.strictEqual(at("2027-03-01"), "y1s2", "starts on its first day");
assert.strictEqual(at("2028-01-01"), "y1s2", "undated placeholder is never automatic");
assert.strictEqual(at("2030-01-01"), "y2s2", "after the last");
assert.strictEqual(run("autoSemester([{id:'x'}], new Date())", {}).id, "x", "no dates: first");

const L = run("normalize(D)", {D: {meta: {semester: "Sem 1", academicYear: "2026"}, weeks: {segments: [{start: "2026-09-28", count: 1}]}, sections: []}});
assert(L.legacy && L.years[0].semesters[0].id === "s1" && L.years[0].title === "2026" && L.years[0].semesters[0].title === "Sem 1" && !("meta" in L.years[0].semesters[0]));

const V = run("semesterView(N, S[0])", {N, S});
assert.strictEqual(JSON.stringify(V.sections.map(s => [s._scope, s._i])), JSON.stringify([["common", 0], ["y1s1", 0]]));
assert.strictEqual(V.meta.title, "P");
const route = (h, a) => run("parseRoute(h, S, S[a])", {h, S, a});
assert.deepStrictEqual([route("#y1s2/plan", 0).sem.id, route("#y1s2/plan", 0).tab], ["y1s2", "plan"]);
assert.deepStrictEqual([route("#schedule", 1).sem.id, route("#schedule", 1).tab], ["y1s2", "schedule"], "old #tab links");
assert.deepStrictEqual([route("", 0).sem.id, route("", 0).tab], ["y1s1", ""]);
console.log("semester helpers - ok");

// ECTS label: unknown is never summed as 0
assert.strictEqual(run("ectsLabel([{ects:5},{ects:10}])"), "15 ECTS");
assert.strictEqual(run("ectsLabel([{ects:5},{}])"), "≥5 ECTS");
assert.strictEqual(run("ectsLabel([{},{}])"), "–");
assert.strictEqual(run("ectsLabel([])"), "–");
assert.strictEqual(run('parseDate("2026-09-28").getDate()'), 28);
console.log("ects/parseDate ok");
