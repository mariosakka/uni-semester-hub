// npm test: runs every pure-logic test (src/**/*.test.cjs) plus the schedule test for both data sets and the validators
import {execFileSync} from "node:child_process";
import {readdirSync, statSync} from "node:fs";
import {join} from "node:path";
const walk = d => readdirSync(d).flatMap(f => statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]);
const run = (...a) => { console.log("$ node " + a.join(" ")); execFileSync("node", a, {stdio: "inherit"}); };
for (const f of walk("src").filter(f => f.endsWith(".test.cjs"))) { run(f); if (f.endsWith("schedule.test.cjs")) run(f, "sample"); }
run("scripts/validate.mjs", "--selftest"); run("scripts/validate.mjs", "public/data/sample/data.js"); run("scripts/validate.mjs", "public/data/aie/data.js");
