// @vitest-environment happy-dom
import {test, expect} from "vitest";
import {mount} from "@vue/test-utils";
import {readFileSync} from "node:fs";
import {normalize, flatten, semesterView} from "../../lib/semester.js";
import PlanView from "./PlanView.vue";
import DirectoryView from "./DirectoryView.vue";

const data = new Function("window", readFileSync("public/data/sample/data.js", "utf8") + "\nreturn window.HUB_DATA;")({});
const N = normalize(data), D = semesterView(N, flatten(N).find(s => (s.courses || []).length));

test("plan: stat strip, one row per subject, detail row toggles", async () => {
  const w = mount(PlanView, {props: {semester: D}});
  expect(w.findAll(".pstats li").length).toBeGreaterThanOrEqual(5);
  expect(w.findAll("tbody.prow").length).toBe(D.courses.length);
  const btn = w.find(".ptog"), row = w.find("tr.pd");
  expect(row.attributes("hidden")).toBeDefined();
  await btn.trigger("click");
  expect(btn.attributes("aria-expanded")).toBe("true");
  expect(row.attributes("hidden")).toBeUndefined();
});

test("directory: contact links come through RichText", () => {
  const w = mount(DirectoryView, {props: {semester: D}});
  expect(w.findAll("li").length).toBeGreaterThan(0);
  expect(w.find("li a[href^='mailto:']").exists()).toBe(true);
});
