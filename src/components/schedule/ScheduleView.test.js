// @vitest-environment happy-dom
import {test, expect} from "vitest";
import {mount} from "@vue/test-utils";
import {readFileSync} from "node:fs";
import {normalize, flatten, semesterView} from "../../lib/semester.js";
import {useModal} from "../../composables/useModal.js";
import ScheduleView from "./ScheduleView.vue";

const data = new Function("window", readFileSync("public/data/sample/data.js", "utf8") + "\nreturn window.HUB_DATA;")({});
const N = normalize(data), D = flatten(N).map(s => semesterView(N, s)).find(V => V.weeks && V.weeks.segments);

test("renders week row, legend, grid and agenda; stepping weeks changes the title and opens a session", async () => {
  const w = mount(ScheduleView, {props: {semester: D}, attachTo: document.body});
  for (const sel of [".swk", ".legend", ".sched", ".agenda"]) expect(w.find(sel).exists(), sel).toBe(true);
  while (!w.find("#pw").element.disabled) await w.find("#pw").trigger("click"); // first week
  const first = w.find(".swk b").text();
  await w.find("#nw").trigger("click");
  expect(w.find(".swk b").text()).not.toBe(first);
  await w.find("#pw").trigger("click");
  const card = w.find(".ev");
  expect(card.exists()).toBe(true);
  await card.trigger("click");
  expect(useModal().modal.kind).toBe("session");
  w.unmount();
});
