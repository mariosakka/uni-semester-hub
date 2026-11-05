// Test helper: evaluates src/lib modules as one shared script scope (import/export stripped) so tests can call any helper by name.
const fs = require("fs"), vm = require("vm"), path = require("path");
const lib = path.join(__dirname, "..", "src", "lib");
const strip = s => s.replace(/^import .*$/gm, "").replace(/^export (default )?/gm, "").replace(/^export \{[^}]*\};?$/gm, "");
module.exports = (ctx, names) => names.forEach(f => vm.runInContext(strip(fs.readFileSync(path.join(lib, f + ".js"), "utf8")), ctx, {filename: f}));
module.exports.strip = strip; module.exports.lib = lib;
