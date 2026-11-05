// @vitest-environment happy-dom
import {test, expect, vi} from "vitest";
import {mount} from "@vue/test-utils";
import {readFileSync} from "node:fs";
import {normalize, flatten, semesterView} from "../../lib/semester.js";
import {HubKey} from "../../injection.js";
import SectionView from "../SectionView.vue";

const data = new Function("window", readFileSync("public/data/sample/data.js", "utf8") + "\nreturn window.HUB_DATA;")({});
const N = normalize(data), D = semesterView(N, flatten(N)[0]);
const save = vi.fn(), done = new Set();
const hub = {base: "data/sample/", store: () => ({done, save})};
const view = sec => mount(SectionView, {props: {sec, semester: D}, global: {provide: {[HubKey]: hub}}});

test("todo cards: progress chip, rich title, tick persists, details toggle", async () => {
  const sec = D.sections.find(s => s.kind === "list" && s.highlight);
  const w = view(sec);
  const total = sec.items.filter(it => typeof it === "string" ? it.startsWith("[ ] ") : it.check === true).length;
  expect(w.find(".tprog").text()).toBe(`0 / ${total} done`);
  const box = w.find(".tcard.task input[type=checkbox]");
  await box.setValue(true);
  expect(save).toHaveBeenCalled();
  expect(done.size).toBe(1);
  expect(w.find(".tprog").text()).toBe(`1 / ${total} done`);
  const chev = w.find(".tc-chev");
  const before = chev.attributes("aria-expanded");
  await chev.trigger("click");
  expect(chev.attributes("aria-expanded")).not.toBe(before);
});

test("news and a course section render trusted markup", () => {
  const news = view(D.sections.find(s => s.kind === "news"));
  expect(news.findAll(".news li").length).toBeGreaterThan(0);
  const course = view(D.sections.find(s => s.kind === "course"));
  expect(course.find("p.chead").exists()).toBe(true);
});
