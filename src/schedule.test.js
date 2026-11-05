// Run: node src/schedule.test.js [set]   (default: sample). Per semester: week resolution, .ics, study plan and directory HTML.
const fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
const root = path.join(__dirname, "..");
const ctx = vm.createContext({window: {}, console});
for (const f of ["strings", "util", "semester", "groups", "schedule", "calendar", "daymodal", "plan", "render"]) vm.runInContext(fs.readFileSync(path.join(root, "src", f + ".js"), "utf8"), ctx, {filename: f});
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
  assert(typeof html === "string" && html.length > 0 && !html.includes("Whole programme"), `semester ${i} study plan renders`);
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
  console.log(`${set}: semester ${run("SEMS[" + i + "].id")}: ${n} weeks, ${begins} ics events - ok`);
  if (set.startsWith("aie") && timetabled === 1) { // spot checks on known deviations (first timetabled semester)
    run(`var VV = ${V}; setGroup(VV, 'ml', '2')`); // default is all subgroups; pick SG2 for ML to check the filter (one persistent view)
    const wk = w => run(`weekSessions(VV, ${w})`);
    const w6 = wk(6), w10 = wk(10);
    assert(w6.some(s => s.key === "2026-11-04" && s.course === "hc" && s.status === "cancel"), "4 Nov hc cancelled");
    assert(w6.some(s => s.extra && s.course === "de" && s.start === 18), "extra recovery lab");
    assert(!w6.some(s => s.course === "ml" && s.group === "1") && w6.some(s => s.course === "ml" && s.group === "2"), "SG1 ML lab hidden, SG2 shown");
    run("resetGroups(VV)");
    // session modal data + card labels
    const find = (w, fn) => `weekSessions(VV, ${w}).find(${fn})`;
    const hcInfo = run(`sessionInfo(VV, ${find(6, "s => s.key === '2026-11-04' && s.course === 'hc' && s.type === 'course'")})`);
    assert.strictEqual(hcInfo.status, "cancel", "cancelled session status");
    assert.strictEqual(hcInfo.week, 6); assert.strictEqual(hcInfo.parity, "even");
    const mlInfo = run(`sessionInfo(VV, ${find(6, "s => s.key === '2026-11-05' && s.course === 'ml' && s.type === 'lab'")})`);
    assert(mlInfo.status === "dev" && mlInfo.u === true, "deviation, unconfirmed");
    assert(mlInfo.modeDiffers && mlInfo.place === "Online" && mlInfo.basePlace === "CB205", "base vs actual place");
    assert.strictEqual(mlInfo.ects, 5);
    const extraInfo = run(`sessionInfo(VV, ${find(6, "s => s.extra")})`);
    assert(extraInfo.status === "extra" && !extraInfo.modeDiffers, "extra session");
    assert.strictEqual(run("typeLetter('lab') + typeLetter('course') + typeLetter('project') + typeLetter('seminar')"), "LCPS", "type letters");
    assert.strictEqual(run("typeLetter('workshop')"), "W", "unknown type: first letter");
    assert.strictEqual(run(`cardAria(VV, ${find(6, "s => s.course === 'hc' && s.key === '2026-11-04' && s.type === 'course'")})`), "Human-Centric AI for Energy Management, course, 17:00–18:00, Not held", "card aria text");
    assert(run(`weekSessions(VV, 6).every(s => s.name && typeof s.baseMode === "string")`), "short name + base mode on every session");
    assert(new Set(run("weekSessions(VV, 6).map(sessionKey)")).size === run("weekSessions(VV, 6).length"), "unique session keys");
    assert(w10.filter(s => s.status === "cancel").length === 3, "30 Nov + 1 Dec cancel 3 sessions");
    assert(w10.find(s => s.course === "fai" && s.type === "lab" && s.key === "2026-12-04").mode === "online", "4 Dec lab online");
    console.log("aie spot checks ok");
  }
}
assert(timetabled >= 1, "at least one semester with a timetable");
