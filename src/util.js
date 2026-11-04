// Small helpers shared by the other scripts (plain globals, no modules, so it works from file://).
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = k => { const [y, m, d] = k.split("-"); return new Date(+y, m - 1, +d); }; // not Date(string): old Safari rejects some ISO forms
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const fmtDate = d => d.toLocaleDateString("en-GB", {day: "numeric", month: "short"});
const fmtTime = h => `${Math.floor(h)}:${pad(Math.round((h % 1) * 60))}`;
const inRanges = (w, ranges) => ranges.some(([a, b]) => w >= a && w <= b);
