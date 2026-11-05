// Run: node src/plan.test.js   Study plan helpers (stat strip, bars).
const vm = require("vm"), assert = require("assert");
const ctx = vm.createContext({window: {}, console, Intl});
require("../../scripts/loadlib.cjs")(ctx, ["strings", "util", "semester", "plan"]);
const run = code => vm.runInContext(code, ctx), json = code => JSON.parse(run(`JSON.stringify(${code})`)); // json(): plain objects (vm objects have another prototype)

// helpers
assert.deepStrictEqual(json(`planStats([{evaluation:"E",hours:{course:2,lab:2}},{evaluation:"V (continuous)",hours:{course:1}},{evaluation:"P"},{}])`),
  {subjects: 4, hours: 5, hoursKnown: 2, exams: 1, continuous: 1, other: 1});
assert.deepStrictEqual(json("planStats([])"), {subjects: 0, hours: 0, hoursKnown: 0, exams: 0, continuous: 0, other: 0});
assert.strictEqual(run("barPct(5, 10)"), 50);
assert.strictEqual(run("barPct(20, 10)"), 100, "clamped");
assert.strictEqual(run("barPct('x', 10)"), 0);
assert.strictEqual(run("barPct(5, 0)"), 100, "no max: full bar, never NaN");

// unknown ECTS are never summed as 0
assert.strictEqual(run("ectsLabel([{ects:5},{}])"), "≥5 ECTS");
assert.strictEqual(run("ectsLabel([{}])"), run("t('plan.unknown')"));
console.log("plan ok");
