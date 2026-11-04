// Run: node src/schedule.test.js [set]   (default: sample). Per semester: week resolution, .ics, study plan and directory HTML.
const fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
const root = path.join(__dirname, "..");
const ctx = vm.createContext({window: {}, console});
for (const f of ["util", "semester", "schedule", "calendar", "plan", "render"]) vm.runInContext(fs.readFileSync(path.join(root, "src", f + ".js"), "utf8"), ctx, {filename: f});
const set = process.argv[2] || "sample";
vm.runInContext(fs.readFileSync(path.join(root, "data", set, "data.js"), "utf8"), ctx);
const run = code => vm.runInContext(code, ctx);

run("var N = normalize(window.HUB_DATA), SEMS = flatten(N);");
const count = run("SEMS.length");
assert(count >= 1, "at least one semester");
let timetabled = 0;
for (let i = 0; i < count; i++) {
  const V = "semesterView(N, SEMS[" + i + "])";
  const html = run(`studyplanHTML(${V}) + directoryHTML(${V})`);
  assert(typeof html === "string" && html.includes("Whole programme"), `semester ${i} study plan renders`);
  if (!run(`!!(${V}.weeks && ${V}.weeks.segments)`)) continue; // placeholder semester: no timetable
  timetabled++;
  const n = run(`weekCount(${V})`);
  assert(n >= 1, "weekCount");
  for (let w = 1; w <= n; w++) { // every week resolves without throwing and sessions stay inside Mon-Fri
    const s = run(`weekSessions(${V}, ${w})`);
    assert(s.every(x => x.day >= 0 && x.day <= 4 && x.end > x.start), `semester ${i} week ${w} sessions`);
  }
  assert(run(`timeline(${V}).length`) >= n, "timeline covers every teaching week");
  const ics = run(`buildIcs(${V}, new Date('2026-01-01T00:00:00Z'))`);
  const begins = (ics.match(/BEGIN:VEVENT/g) || []).length;
  assert.strictEqual(begins, (ics.match(/END:VEVENT/g) || []).length, "balanced VEVENT");
  assert(ics.startsWith("BEGIN:VCALENDAR") && ics.endsWith("END:VCALENDAR"), "calendar envelope");
  assert(ics.split("\r\n").every(l => l.length <= 75), "lines folded to <=75 chars");
  assert.strictEqual(new Set(ics.match(/UID:.*/g)).size, begins, "unique UIDs");
  if (run(`!!(${V}.calendar && ${V}.calendar.semesters)`)) assert.strictEqual(run(`defaultSemester(${V}, new Date('2000-01-01'))`), 0, "defaultSemester before start");
  console.log(`${set}: semester ${run("SEMS[" + i + "].id")}: ${n} weeks, ${begins} ics events - ok`);
  if (set.startsWith("aie") && timetabled === 1) { // spot checks on known deviations (first timetabled semester)
    const wk = w => run(`weekSessions(${V}, ${w})`);
    const w6 = wk(6), w10 = wk(10);
    assert(w6.some(s => s.key === "2026-11-04" && s.course === "hc" && s.status === "cancel"), "4 Nov hc cancelled");
    assert(w6.some(s => s.extra && s.course === "de" && s.start === 18), "extra recovery lab");
    assert(!w6.some(s => s.course === "ml" && s.group === "1"), "SG1 ML lab hidden");
    assert(w10.filter(s => s.status === "cancel").length === 3, "30 Nov + 1 Dec cancel 3 sessions");
    assert(w10.find(s => s.course === "fai" && s.type === "lab" && s.key === "2026-12-04").mode === "online", "4 Dec lab online");
    console.log("aie spot checks ok");
  }
}
assert(timetabled >= 1, "at least one semester with a timetable");
