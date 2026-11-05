// npm run test:data: the data-validator selftest plus the validation of every tracked data set
import {execFileSync} from "node:child_process";
import {existsSync} from "node:fs";
const run = (...a) => { console.log("$ node " + a.join(" ")); execFileSync("node", a, {stdio: "inherit"}); };
run("scripts/validate.mjs", "--selftest");
for (const set of ["sample", "aie"]) if (existsSync(`public/data/${set}/data.js`)) run("scripts/validate.mjs", `public/data/${set}/data.js`);
