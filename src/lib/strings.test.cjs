// Run: node src/strings.test.js   Static scan: every t()/tx() key used in src/*.js and index.html exists in HUB_STRINGS, no UI text left
// behind unnoticed (unused keys only warn), plus override / fallback / interpolation / locale behaviour.
const fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
const root = path.join(__dirname, "..", "..");
const ctx = vm.createContext({console: {warn: (...a) => warns.push(a.join(" "))}, Intl});
const warns = [];
const run = code => vm.runInContext(code, ctx);
require("../../scripts/loadlib.cjs")(ctx, ["strings", "util"]);

// 1. static scan
const walk = d => fs.readdirSync(d, {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = walk(path.join(root, "src")).filter(f => /\.(js|vue)$/.test(f) && !/strings\.js$/.test(f)).map(f => [path.relative(root, f), fs.readFileSync(f, "utf8")]);
files.push(["index.html", fs.readFileSync(path.join(root, "index.html"), "utf8")]);
const keys = new Set(Object.keys(run("HUB_STRINGS"))), used = new Set(), missing = [];
const note = (file, key) => { used.add(key); if (!keys.has(key)) missing.push(`${file}: ${key}`); };
for (const [file, text] of files) {
  for (const m of text.matchAll(/\btx?\(\s*["']([\w.]+)["']/g)) note(file, m[1]);          // t("key") / tx("key")
  for (const m of text.matchAll(/\bdata-t="([\w.]+)"/g)) note(file, m[1]);                   // data-t="key"
  for (const m of text.matchAll(/\bdata-ta="([^"]+)"/g)) m[1].split(";").forEach(p => note(file, p.split("=")[1])); // data-ta="attr=key;..."
  for (const m of text.matchAll(/["']((?:tab|type|plan\.abbr|schedule|calendar|nav|news|course|plan|ics|footer|err|doc|day|cal|sub|session)\.[\w.]+)["']/g)) // keys listed in lookup tables
    if (keys.has(m[1])) used.add(m[1]);
}
assert.deepStrictEqual(missing, [], "keys used but not defined: " + missing.join(", "));
const unused = [...keys].filter(k => !used.has(k));
if (unused.length) console.warn("WARN unused string keys: " + unused.join(", "));
// no stray literal English in obvious UI spots (innerHTML text nodes would need a real parser; this catches the common regressions)
for (const [file, text] of files) {
  for (const m of text.matchAll(/(?:placeholder|aria-label|alt|title)="([A-Z][a-z]+[^"$]*)"/g)) assert.fail(`${file}: hard-coded attribute text "${m[1]}"`);
}

// 2. behaviour
assert.strictEqual(run('t("nav.year")'), "Year");
assert.strictEqual(run('t("nav.semesterNow", {title: "Semester 1"})'), "Semester 1 · now", "interpolation");
assert.strictEqual(run('t("nav.semesterNow")'), "{title} · now", "missing var stays visible");
assert.strictEqual(run('tx("course.grading", {value: "<b>x</b>"})'), "Grading: <b>x</b>", "tx keeps caller HTML");
run('setStrings({strings: {"nav.year": "An <b>x</b> & y", "nav.nope": "z", "nav.semester": 5}, locale: "ro-RO"})');
assert.strictEqual(run('t("nav.year")'), "An <b>x</b> & y", "override (plain text)");
assert.strictEqual(run('tx("nav.year")'), "An &lt;b>x&lt;/b> &amp; y", "tx escapes an overridden template");
assert.strictEqual(run('t("nav.semester")'), "Semester", "non-string override ignored, falls back");
assert(warns.some(w => w.includes("nav.nope")) && warns.some(w => w.includes("nav.semester")), "warnings for unknown key and non-string");
assert.strictEqual(run("HUB_LOCALE"), "ro-RO");
assert(/noiembrie/i.test(run("monthName(2026, 10)")), "Romanian month name: " + run("monthName(2026, 10)"));
assert(/luni/i.test(run('dayName(new Date(2026, 10, 2), "long")')), "Romanian weekday");
warns.length = 0;
run('setStrings({locale: "xx-not-a-locale-zzzz!", strings: "nope"})');
assert.strictEqual(run("HUB_LOCALE"), "en-GB", "bad locale falls back");
assert.strictEqual(warns.length, 2, "two warnings: " + warns);
run("setStrings(null)"); run("setStrings(undefined)"); run("setStrings({})");
assert.strictEqual(run('t("nav.year")'), "Year", "reset to defaults");
assert.strictEqual(run('t("no.such.key")'), "no.such.key", "missing key never throws");
console.log(`strings ok (${keys.size} keys${unused.length ? `, ${unused.length} unused` : ""})`);
