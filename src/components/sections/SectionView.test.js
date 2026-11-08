// @vitest-environment happy-dom
import {test, expect} from "vitest";
import {mount} from "@vue/test-utils";
import {readFileSync} from "node:fs";
import {normalize, flatten, semesterView} from "../../lib/semester.js";
import {HubKey} from "../../injection.js";
import SectionView from "../SectionView.vue";

const data = new Function("window", readFileSync("public/data/sample/data.js", "utf8") + "\nreturn window.HUB_DATA;")({});
const N = normalize(data), D = semesterView(N, flatten(N)[0]);
const hub = {base: "data/sample/"};
const view = sec => mount(SectionView, {props: {sec, semester: D}, global: {provide: {[HubKey]: hub}}});

test("todo cards: rich title, details toggle, no checkbox", async () => {
  const w = view(D.sections.find(s => s.kind === "list" && s.highlight));
  expect(w.find("input[type=checkbox]").exists()).toBe(false);
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
  expect(course.findAll("details.cgroup").length).toBeGreaterThan(0); // contacts and/or data groups
});
