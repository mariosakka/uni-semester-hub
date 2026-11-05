import {test, expect, vi, afterEach} from "vitest";
import {readdirSync, readFileSync} from "node:fs";
import {join, relative} from "node:path";
import * as S from "./strings.js";
import {monthName, dayName} from "./util.js";

const {HUB_STRINGS, setStrings, t, tx} = S; // HUB_LOCALE is a live binding: read it as S.HUB_LOCALE

// Static scan: every t()/tx() key used in src/**/*.{js,vue} and index.html exists in HUB_STRINGS, no UI text left behind.
const root = join(import.meta.dirname, "..", "..");
const walk = d => readdirSync(d, {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
const files = walk(join(root, "src")).filter(f => /\.(js|vue)$/.test(f) && !/(strings|\.test)\.js$/.test(f)).map(f => [relative(root, f), readFileSync(f, "utf8")]);
files.push(["index.html", readFileSync(join(root, "index.html"), "utf8")]);
const keys = new Set(Object.keys(HUB_STRINGS));

afterEach(() => setStrings({}));

test("every key used in the source is defined", () => {
  const missing = [], used = new Set();
  const note = (file, key) => { used.add(key); if (!keys.has(key)) missing.push(`${file}: ${key}`); };
  for (const [file, text] of files) {
    for (const m of text.matchAll(/\btx?\(\s*["']([\w.]+)["']/g)) note(file, m[1]); // t("key") / tx("key")
    for (const m of text.matchAll(/\bdata-t="([\w.]+)"/g)) note(file, m[1]);
    for (const m of text.matchAll(/\bdata-ta="([^"]+)"/g)) m[1].split(";").forEach(p => note(file, p.split("=")[1]));
    for (const m of text.matchAll(/["']((?:tab|type|plan\.abbr|schedule|calendar|nav|news|course|plan|ics|footer|err|doc|day|cal|sub|session)\.[\w.]+)["']/g)) // keys in lookup tables
      if (keys.has(m[1])) used.add(m[1]);
  }
  expect(missing, "keys used but not defined").toEqual([]);
  const unused = [...keys].filter(k => !used.has(k));
  if (unused.length) console.warn("WARN unused string keys: " + unused.join(", "));
});

test("no hard-coded English in attributes", () => {
  for (const [file, text] of files)
    for (const m of text.matchAll(/(?:placeholder|aria-label|alt|title)="([A-Z][a-z]+[^"$]*)"/g)) expect.fail(`${file}: hard-coded attribute text "${m[1]}"`);
});

test("interpolation and tx", () => {
  expect(t("nav.year")).toBe("Year");
  expect(t("nav.semesterNow", {title: "Semester 1"})).toBe("Semester 1 · now");
  expect(t("nav.semesterNow")).toBe("{title} · now"); // missing var stays visible
  expect(tx("course.grading", {value: "<b>x</b>"})).toBe("Grading: <b>x</b>"); // tx keeps caller HTML
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  expect(t("no.such.key")).toBe("no.such.key"); // missing key never throws
  warn.mockRestore();
});

test("overrides, locale and fallbacks", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  setStrings({strings: {"nav.year": "An <b>x</b> & y", "nav.nope": "z", "nav.semester": 5}, locale: "ro-RO"});
  expect(t("nav.year")).toBe("An <b>x</b> & y"); // override (plain text)
  expect(tx("nav.year")).toBe("An &lt;b>x&lt;/b> &amp; y"); // tx escapes an overridden template
  expect(t("nav.semester")).toBe("Semester"); // non-string override ignored
  expect(warn.mock.calls.some(c => c[0].includes("nav.nope")) && warn.mock.calls.some(c => c[0].includes("nav.semester"))).toBe(true);
  expect(S.HUB_LOCALE).toBe("ro-RO");
  expect(monthName(2026, 10)).toMatch(/noiembrie/i);
  expect(dayName(new Date(2026, 10, 2), "long")).toMatch(/luni/i);
  warn.mockClear();
  setStrings({locale: "xx-not-a-locale-zzzz!", strings: "nope"});
  expect(S.HUB_LOCALE).toBe("en-GB");
  expect(warn).toHaveBeenCalledTimes(2);
  setStrings(null); setStrings(undefined); setStrings({});
  expect(t("nav.year")).toBe("Year");
  warn.mockRestore();
});
