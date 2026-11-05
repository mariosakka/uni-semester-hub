// Run: node src/todo.test.js   To-Do list items: string or object forms, tickable detection, default tab, plain-list rendering (DOM behaviour is checked in the browser)
const fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
const ctx = vm.createContext({window: {}, console});
for (const f of ["strings", "util", "semester", "groups", "schedule", "calendar", "daymodal", "plan", "render"]) vm.runInContext(fs.readFileSync(path.join(__dirname, f + ".js"), "utf8"), ctx, {filename: f});
const run = code => vm.runInContext(code, ctx);

assert.strictEqual(run('itemCheck("[ ] Do it")'), true);
assert.strictEqual(run('itemCheck("plain")'), false);
assert.strictEqual(run('itemCheck({title: "x", check: true})'), true);
assert.strictEqual(run('itemCheck({title: "x"})'), false, "check defaults to false");
assert.strictEqual(run('itemCheck({title: "x", check: "yes"})'), false, "only true ticks");
assert.strictEqual(run('itemTitle("[ ] Do it")'), "Do it");
assert.strictEqual(run('itemTitle({title: "T <b>b</b>"})'), "T <b>b</b>");
assert.strictEqual(run('itemTitle({})'), "", "object without a title");
// default tab: any tickable item (either form) or highlight -> To-Do; otherwise News
assert.strictEqual(run('defaultTab({kind: "list", items: ["a", {title: "b", check: true}]})'), "todo");
assert.strictEqual(run('defaultTab({kind: "list", items: ["a", {title: "b", text: "c"}]})'), "news");
assert.strictEqual(run('defaultTab({kind: "list", highlight: true, items: ["a"]})'), "todo");
// plain lists (outside To-Do) render an object as title + due badge + details
const h = run('listItemHTML({title: "Pay", due: "1 Dec", text: "<i>soon</i>"})');
assert(h.startsWith("Pay") && h.includes('class="tc-due">1 Dec<') && h.includes('<div class="nt"><i>soon</i></div>'), "object in a plain list: " + h);
assert.strictEqual(run('listItemHTML("text")'), "text");
assert(run('listItemHTML({title: "x", due: "<b>"})').includes("&lt;b>"), "due is escaped");
assert.strictEqual(run('t("todo.progress", {done: 1, total: 2})'), "1 / 2 done");
console.log("todo items - ok");
