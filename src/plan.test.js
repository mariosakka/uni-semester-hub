// Run: node src/plan.test.js   Study plan helpers (stat strip, bars) and the plan HTML: selected semester only, no links/emails/phones.
const fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
const root = path.join(__dirname, "..");
const ctx = vm.createContext({window: {}, console, Intl});
for (const f of ["strings", "util", "semester", "plan"]) vm.runInContext(fs.readFileSync(path.join(root, "src", f + ".js"), "utf8"), ctx, {filename: f});
const run = code => vm.runInContext(code, ctx), json = code => JSON.parse(run(`JSON.stringify(${code})`)); // json(): plain objects (vm objects have another prototype)

// helpers
assert.deepStrictEqual(json(`planStats([{evaluation:"E",hours:{course:2,lab:2}},{evaluation:"V (continuous)",hours:{course:1}},{evaluation:"P"},{}])`),
  {subjects: 4, hours: 5, hoursKnown: 2, exams: 1, continuous: 1, other: 1});
assert.deepStrictEqual(json("planStats([])"), {subjects: 0, hours: 0, hoursKnown: 0, exams: 0, continuous: 0, other: 0});
assert.strictEqual(run("barPct(5, 10)"), 50);
assert.strictEqual(run("barPct(20, 10)"), 100, "clamped");
assert.strictEqual(run("barPct('x', 10)"), 0);
assert.strictEqual(run("barPct(5, 0)"), 100, "no max: full bar, never NaN");

// HTML for every semester of the sample and the real set: one semester only, no links / emails / phones
for (const set of ["sample", "aie"]) {
  const file = path.join(root, "data", set, "data.js");
  if (!fs.existsSync(file)) continue;
  vm.runInContext(fs.readFileSync(file, "utf8"), ctx);
  run("var N = normalize(window.HUB_DATA), SEMS = flatten(N);");
  for (let i = 0; i < run("SEMS.length"); i++) {
    const html = run(`studyplanHTML(semesterView(N, SEMS[${i}]))`), n = run(`(SEMS[${i}].courses || []).length`);
    assert(!/<a[ >]/.test(html) && !html.includes("@") && !/https?:/.test(html), `${set} semester ${i}: no links, emails or urls in the plan`);
    assert.strictEqual((html.match(/<tbody class="prow/g) || []).length, n, `${set} semester ${i}: one row per subject`);
    assert(!html.includes("Whole programme"), "no programme-wide block");
  }
}
// description is shown (escaped); unknown ECTS show a dash and never "0"
run('window.HUB_DATA = {meta:{title:"t"}, years:[{id:"y",title:"Y",semesters:[{id:"s",title:"S",courses:[{id:"a",title:"A <b>",color:"red",description:"About <i>a</i>"},{id:"b",title:"B",ects:5,evaluation:"E"}]}]}]}; var N2 = normalize(window.HUB_DATA);');
const h = run("studyplanHTML(semesterView(N2, flatten(N2)[0]))");
assert(h.includes("About &lt;i>a&lt;/i>") && h.includes("A &lt;b>"), "text escaped");
assert(h.includes("≥5 ECTS"), "partial total");
console.log("plan ok");
