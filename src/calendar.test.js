// Run: node src/calendar.test.js [set]   (default: aie when present, else sample). Pure helpers: calendar ranges, week lookup, day info
// with deviations, year data, subgroup filtering (defaults, per-course choice, "all", unknown values) and the .ics respecting it.
const fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
const root = path.join(__dirname, "..");
const store = {}, ctx = vm.createContext({window: {}, console, localStorage: {getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }}});
for (const f of ["strings", "util", "semester", "groups", "schedule", "calendar", "daymodal", "plan", "render"]) vm.runInContext(fs.readFileSync(path.join(root, "src", f + ".js"), "utf8"), ctx, {filename: f});
const run = code => vm.runInContext(code, ctx);
const set = process.argv[2] || (fs.existsSync(path.join(root, "data", "aie")) ? "aie" : "sample");
vm.runInContext(fs.readFileSync(path.join(root, "data", set, "data.js"), "utf8"), ctx);
run("var N = normalize(window.HUB_DATA), SEMS = flatten(N); var first = SEMS.find(s => (s.weeks || {}).segments); var V = semesterView(N, first); V.groupKey = 'k:' + first.id;");
const d = s => `new Date('${s}T12:00')`;

// ranges
const months = run("calMonths(V)");
assert(months.length, "calendar has months");
const m1 = months[0], m2 = months[months.length - 1], mid = months[Math.floor(months.length / 2)];
assert.deepStrictEqual(run(`nearestMonth(V, ${d("1999-01-01")})`), m1, "before the range: first month");
assert.deepStrictEqual(run(`nearestMonth(V, ${d("2099-01-01")})`), m2, "after the range: last month");
assert.deepStrictEqual(run(`nearestMonth(V, new Date(${mid[0]}, ${mid[1]}, 15))`), mid, "inside: that month");
assert.strictEqual(run(`iso(mondayOfDate(${d("2026-11-08")}))`), "2026-11-02", "Sunday belongs to the week starting Monday");
assert.strictEqual(run(`iso(mondayOfDate(${d("2026-11-02")}))`), "2026-11-02");
assert.strictEqual(run(`iso(clampDate(${d("2000-01-01")}, calRange(V)[0], calRange(V)[1]))`), run("iso(calRange(V)[0])"));

// week lookup + day info (aie-specific facts when that set is loaded)
const w1 = run("first.weeks.segments[0].start");
assert.strictEqual(run(`weekNumberOf(V, parseDate('${w1}'))`), 1, "first Monday is week 1");
assert.strictEqual(run(`weekNumberOf(V, addDays(parseDate('${w1}'), 6))`), 1, "Sunday of week 1");
assert.strictEqual(run(`weekNumberOf(V, addDays(parseDate('${w1}'), -1))`), null, "before the term");
const info = k => run(`dayInfo(V, '${k}')`);
if (set.startsWith("aie")) {
  assert.strictEqual(run(`weekNumberOf(V, ${d("2026-11-04")})`), 6);
  assert.strictEqual(run(`weekNumberOf(V, ${d("2026-12-25")})`), null, "winter vacation");
  assert.strictEqual(run(`weekNumberOf(V, ${d("2027-01-12")})`), 13, "weeks resume after the break");
  const wed = info("2026-11-04");
  assert(wed.week === 6 && wed.parity === "even", "4 Nov is an even teaching week");
  assert(wed.sessions.some(s => s.course === "hc" && s.status === "cancel"), "cancelled Human-Centric AI shown with its deviation");
  assert(wed.sessions.some(s => s.extra && s.course === "de"), "extra recovery session");
  const off = info("2026-12-01");
  assert(off.off && off.sessions.every(s => s.status === "cancel"), "day off cancels its sessions");
  const vac = info("2026-12-25");
  assert(vac.period && vac.period.kind === "vac" && vac.week === null && vac.sessions.length === 0, "vacation day");
  const exam = info("2027-01-25");
  assert(exam.period && exam.period.kind === "exam", "exam session day");
  const sat = info("2026-11-07");
  assert(sat.sessions.length === 0 && !sat.off, "an empty weekend");
}

// year data merges the semesters of the year
const yd = run("V.year");
assert(yd.semesters.length >= 1 && Array.isArray(yd.periods), "year data");
if (set.startsWith("aie")) assert.strictEqual(yd.semesters.length, 2, "Year 1 has two semesters with calendars");
assert.strictEqual(run(`(semOfDate(SEMS, '${w1}') || {}).id`), run("first.id"), "semOfDate finds the semester of its first day");
assert.strictEqual(run("semOfDate(SEMS, '1999-01-01')"), null);

// subgroups: discovery, defaults, per-course choice, "all", unknown values, no control without groups, .ics follows the choice
const gs = run("discoverGroups(V)");
if (gs.length) {
  const c = gs[0].course, g0 = gs[0].groups;
  const count = () => run("(() => { let n = 0; for (let w = 1; w <= weekCount(V); w++) n += weekSessions(V, w).length; return n; })()");
  const ics = () => (run("buildIcs(V, new Date('2026-01-01T00:00:00Z'))").match(/BEGIN:VEVENT/g) || []).length;
  run("resetGroups(V)");
  const dflt = run(`groupFor(V, '${c}')`);
  assert.strictEqual(dflt, "all", "default is all subgroups");
  const base = count(), baseIcs = ics();
  run("setAllGroups(V, 'all')");
  assert.strictEqual(count(), base, "'all' equals the default");
  run(`setGroup(V, '${c}', '${g0[0]}')`);
  assert(count() < base, "choosing one subgroup shows fewer sessions");
  assert(ics() < baseIcs, ".ics exports fewer with one subgroup");
  assert.strictEqual(run(`groupFor(V, '${c}')`), g0[0], "per-course choice");
  assert(!run("weekSessions(V, 2)").some(s => s.course === c && s.group && s.group !== g0[0]), "other subgroups hidden for that course");
  run(`setGroup(V, '${c}', '99')`);
  assert.notStrictEqual(run(`groupFor(V, '${c}')`), "99", "unknown stored value ignored");
  run(`setGroup(V, '${c}', '${g0[0]}')`);
  assert(JSON.parse(store["k:" + run("first.id")])[c] === g0[0], "choice persisted to storage");
  run("V.groupSel = undefined"); // a fresh load reads storage back
  assert.strictEqual(run(`groupFor(V, '${c}')`), g0[0], "applied on load");
  run("resetGroups(V)");
  assert.strictEqual(run(`groupFor(V, '${c}')`), dflt, "reset restores the defaults");
  assert(run("groupSummary(V)").length > 0, "summary chip text");
  console.log(`${set}: subgroups ${gs.map(g => g.course + ":" + g.groups).join(" ")} - ok`);
} else console.log(`${set}: no grouped sessions (no subgroup control) - ok`);
// a view without any group data never filters and shows no control
run("var L = {courses: [{id: 'x', title: 'X'}], timetable: [{course: 'x', type: 'course', day: 0, start: 8, end: 9, rules: [{weeks: [[1, 1]], mode: 'online'}]}]}");
assert.strictEqual(run("discoverGroups(L).length"), 0, "no grouped sessions: no control");
assert.strictEqual(run("visible(L, L.timetable[0])"), true);
assert.strictEqual(run("groupFor(L, 'x')"), "all");
console.log("calendar helpers - ok");
