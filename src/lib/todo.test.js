import {test, expect} from "vitest";
import {itemTitle, listItemHTML} from "./render.js";
import {defaultTab, tabsFor, tabOf, tabIcon} from "./tabs.js";

// To-Do list items: string or object forms, default tab, plain-list rendering (DOM behaviour: component tests)
test("itemTitle", () => {
  expect(itemTitle("Do it")).toBe("Do it");
  expect(itemTitle({title: "T <b>b</b>"})).toBe("T <b>b</b>");
  expect(itemTitle({})).toBe("");
});

test("default tab: highlight -> todo, otherwise news", () => {
  expect(defaultTab({kind: "list", items: ["a", {title: "b", text: "c"}]})).toBe("news");
  expect(defaultTab({kind: "list", highlight: true, items: ["a"]})).toBe("todo");
});

test("plain lists render an object as title + due badge + details", () => {
  const h = listItemHTML({title: "Pay", due: "1 Dec", text: "<i>soon</i>"});
  expect(h.startsWith("Pay") && h.includes('class="tc-due">1 Dec<') && h.includes('<div class="nt"><i>soon</i></div>')).toBe(true);
  expect(listItemHTML("text")).toBe("text");
  expect(listItemHTML({title: "x", due: "<b>"})).toContain("&lt;b>"); // due is escaped
});

test("tabs: empty default tabs dropped, unknown tab -> first, overview -> news", () => {
  const D1 = {sections: [{kind: "list", items: ["x"]}, {kind: "list", tab: "overview", items: ["y"]}, {kind: "links", tab: "zzz"}, {kind: "schedule"}]};
  expect(tabsFor(D1).map(x => x.id).join()).toBe("news"); // schedule without weeks and the empty info tab are dropped
  expect(tabOf(D1, D1.sections[1])).toBe("news");
  expect(tabOf({tabs: [{id: "a", title: "A"}], sections: []}, {kind: "list", items: ["x"]})).toBe("a");
  expect(tabIcon("nope")).toBe("M12 10.5v3");
});
