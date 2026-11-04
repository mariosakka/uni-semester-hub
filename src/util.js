// Small helpers shared by the other scripts (plain globals, no modules, so it works from file://).
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = k => { const [y, m, d] = k.split("-"); return new Date(+y, m - 1, +d); }; // not Date(string): old Safari rejects some ISO forms
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
// names and formats follow meta.locale (HUB_LOCALE, strings.js)
const fmtDate = d => d.toLocaleDateString(HUB_LOCALE, {day: "numeric", month: "short"});
const dayName = (d, style) => d.toLocaleDateString(HUB_LOCALE, {weekday: style}); // style: "short" | "long" | "narrow"
const fmtLong = d => d.toLocaleDateString(HUB_LOCALE, {weekday: "long", day: "numeric", month: "long", year: "numeric"});
const monthName = (y, m) => new Date(y, m, 1).toLocaleDateString(HUB_LOCALE, {month: "long"});
const fmtTime = h => `${Math.floor(h)}:${pad(Math.round((h % 1) * 60))}`;
const inRanges = (w, ranges) => ranges.some(([a, b]) => w >= a && w <= b);
