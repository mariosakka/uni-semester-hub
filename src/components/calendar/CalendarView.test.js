// @vitest-environment happy-dom
import {readFileSync} from "node:fs";
import {describe, it, expect, afterEach} from "vitest";
import {mount} from "@vue/test-utils";
import {nextTick} from "vue";
import {normalize, flatten, semesterView} from "../../lib/semester.js";
import {useModal} from "../../composables/useModal.js";
import CalendarView from "./CalendarView.vue";
import ModalHost from "./ModalHost.vue";

const w = {};
new Function("window", readFileSync("public/data/aie/data.js", "utf8"))(w);
const N = normalize(w.HUB_DATA), sem = flatten(N).find(s => (s.weeks || {}).segments), semester = semesterView(N, sem);

describe("calendar feature", () => {
  afterEach(() => { useModal().closeModal(); document.body.innerHTML = ""; });

  it("switches modes and renders the legend", async () => {
    const wrap = mount(CalendarView, {props: {semester}});
    expect(wrap.find(".mon .mg").exists()).toBe(true);
    expect(wrap.findAll(".legend .d")).toHaveLength(5);
    await wrap.find("[data-mode=week]").trigger("click");
    expect(wrap.findAll(".wgrid .wday")).toHaveLength(7);
    await wrap.find("[data-mode=year]").trigger("click");
    expect(wrap.findAll(".ysem").length).toBeGreaterThan(0);
  });

  it("opens the day modal from a day and closes it with Escape", async () => {
    const host = mount(ModalHost, {attachTo: document.body});
    const wrap = mount(CalendarView, {props: {semester}, attachTo: document.body});
    await wrap.find("[data-k]").trigger("click");
    expect(host.find(".dm-card[role=dialog]").exists()).toBe(true);
    expect(document.body.classList.contains("modal-open")).toBe(true);
    document.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true}));
    await nextTick();
    expect(host.find(".dm").exists()).toBe(false);
    expect(document.body.classList.contains("modal-open")).toBe(false);
    host.unmount(); wrap.unmount();
  });
});
