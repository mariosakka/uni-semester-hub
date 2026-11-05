// Study plan (selected semester only) and contact directory: HTML builders reading the courses data (no DOM access except planToggle, node-testable).
// Needs esc (util.js) and ITEMS (render.js) at call time; D is a semester view (semesterView) with D.programme.

const HOURS = [["course", "plan.abbr.course", "plan.hours.course"], ["seminar", "plan.abbr.seminar", "plan.hours.seminar"], ["lab", "plan.abbr.lab", "plan.hours.lab"], ["project", "plan.abbr.project", "plan.hours.project"]]; // [field, abbreviation key, name key]
const EVAL = {E: ["exam", "plan.eval.exam"], V: ["cont", "plan.eval.cont"], P: ["proj", "plan.eval.proj"]}; // first letter of `evaluation` -> [css class, name key]
const evalCode = c => String(c.evaluation || "").trim().charAt(0).toUpperCase();
const hoursSum = h => HOURS.reduce((n, [k]) => n + (+(h || {})[k] || 0), 0);
// "–" when no ECTS are known, "≥N ECTS" when only some are, "N ECTS" when all are (unknown is never summed as 0)
const ectsLabel = cs => {
  const known = (cs || []).filter(c => +c.ects), n = known.reduce((t, c) => t + +c.ects, 0);
  return !known.length ? t("plan.unknown") : known.length < cs.length ? t("plan.ectsAtLeast", {n}) : t("plan.ects", {n});
};
// counts for the stat strip; hoursKnown = subjects that have weekly hours (partial totals are shown as "≥N")
function planStats(cs) {
  cs = cs || [];
  const withHours = cs.filter(c => hoursSum(c.hours) > 0);
  return {subjects: cs.length, hours: withHours.reduce((n, c) => n + hoursSum(c.hours), 0), hoursKnown: withHours.length,
    exams: cs.filter(c => evalCode(c) === "E").length, continuous: cs.filter(c => evalCode(c) === "V").length,
    other: cs.filter(c => c.evaluation && evalCode(c) !== "E" && evalCode(c) !== "V").length};
}
const barPct = (v, max) => Math.max(0, Math.min(100, Math.round(100 * (+v || 0) / (max || 1)))); // bar width in %

// "Final exam 60%, Project 40%" or "" when no components are given
const gradingSummary = c => ((c.grading || {}).components || []).map(x => esc(x.name) + (x.weight != null ? ` ${x.weight}%` : "")).join(", ");

const people = c => [...(c.teachers || []), ...(c.contacts || [])];
const peopleLine = list => list.map(p => ITEMS.contacts(p)).join("; ");

function gradingHTML(c) {
  const g = c.grading;
  if (!g) return "";
  const comps = g.components || [];
  const allW = comps.length && comps.every(x => x.weight != null), total = comps.reduce((n, x) => n + (+x.weight || 0), 0);
  return (comps.length ? `<div class="tw"><table class="tbl"><thead><tr><th>${esc(t("plan.component"))}</th><th>${esc(t("plan.weight"))}</th><th>${esc(t("plan.note"))}</th></tr></thead><tbody>` +
      comps.map(x => `<tr><td>${esc(x.name)}</td><td>${x.weight != null ? `<span class="gbar" aria-hidden="true"><i style="width:${barPct(x.weight, 100)}%"></i></span>${esc(x.weight)}%` : esc(t("plan.unknown"))}</td><td>${esc(x.note || "")}</td></tr>`).join("") +
      `</tbody>${allW ? `<tfoot><tr><td>${esc(t("plan.total"))}</td><td colspan="2">${total}%${total === 100 ? "" : esc(t("plan.notHundred"))}</td></tr></tfoot>` : ""}</table></div>` : "") +
    (g.passRule ? `<p><b>${esc(t("plan.passRule"))}</b> ${esc(g.passRule)}</p>` : "") +
    (g.notes ? `<p class="note">${esc(g.notes)}</p>` : "");
}

// one subject = a <tbody>: the main row (cells carry data-label for the phone card layout) + a hidden detail row opened by .ptog
function subjectRow(c, i, maxEcts) {
  const id = `pd-${i}`, dash = esc(t("plan.unknown")), lab = k => esc(t(k));
  const ev = EVAL[evalCode(c)], hrs = HOURS.filter(([k]) => +(c.hours || {})[k] > 0), tot = hoursSum(c.hours);
  const comps = (c.grading || {}).components || [], tch = c.teachers || [];
  return `<tbody class="prow c-${esc(c.color || "grey")}"><tr class="pm">` +
    `<td class="psub" data-label="${lab("plan.col.subject")}"><button type="button" class="ptog" aria-expanded="false" aria-controls="${id}">${esc(c.title)}</button>` +
      (c.description ? `<p class="pdesc">${esc(c.description)}</p>` : "") + `</td>` +
    `<td class="pe" data-label="${lab("plan.col.ects")}">${+c.ects ? `<span class="ppill">${esc(c.ects)}</span><span class="pbar" aria-hidden="true"><i style="width:${barPct(c.ects, maxEcts)}%"></i></span>` : dash}</td>` +
    `<td class="pv" data-label="${lab("plan.col.eval")}">${!c.evaluation ? dash : ev ? `<span class="pev ${ev[0]}"><b>${esc(evalCode(c))}</b> ${esc(t(ev[1]))}</span>` : `<span class="pev oth">${esc(c.evaluation)}</span>`}</td>` +
    `<td class="ph" data-label="${lab("plan.col.hours")}">${hrs.length ? hrs.map(([k, a, n]) => `<span class="hc" role="img" aria-label="${esc(t("plan.hoursChip", {kind: t(n), n: c.hours[k]}))}" title="${esc(t("plan.hoursChip", {kind: t(n), n: c.hours[k]}))}">${esc(t(a))}${esc(c.hours[k])}</span>`).join("") + `<span class="htot">${esc(t("plan.hoursTotalShort", {n: tot}))}</span>` : dash}</td>` +
    `<td class="pg" data-label="${lab("plan.col.grading")}">${comps.length ? comps.map(x => `<span class="gchip">${esc(x.name)}${x.weight != null ? ` ${esc(x.weight)}%` : ""}</span>`).join("") : dash}</td>` +
    `<td class="pt" data-label="${lab("plan.col.teachers")}">${tch.length ? tch.map(p => `<div>${esc(p.name)}${p.role ? ` <span class="prole">(${esc(p.role)})</span>` : ""}</div>`).join("") : dash}</td></tr>` +
    `<tr class="pd" id="${id}" hidden><td colspan="6">${gradingHTML(c) || `<p class="note">${lab("plan.noGrading")}</p>`}</td></tr></tbody>`;
}

// click handler for the subject toggles (attached once to the study-plan section)
function planToggle(e) {
  const b = e.target.closest && e.target.closest(".ptog");
  if (!b) return;
  const open = b.getAttribute("aria-expanded") !== "true", row = document.getElementById(b.getAttribute("aria-controls"));
  b.setAttribute("aria-expanded", String(open));
  if (row) row.hidden = !open;
}

function studyplanHTML(D) {
  const P = D.programme, cs = D.courses || [];
  const heading = `<h3>${esc(((P.years.find(y => y.id === D.yearId) || {}).title || "") + (P.years.length > 1 ? " · " : "") + (D.title || t("plan.thisSemester")))}</h3>`;
  if (!cs.length) return `${heading}<p class="note">${esc(t("plan.noSubjects"))}</p>`;
  const st = planStats(cs), maxE = Math.max(10, ...cs.map(c => +c.ects || 0));
  const tile = (v, k, title) => `<li${title ? ` title="${esc(title)}"` : ""}><b>${esc(v)}</b><span>${esc(t(k))}</span></li>`;
  const hoursVal = !st.hoursKnown ? t("plan.unknown") : st.hoursKnown < st.subjects ? t("plan.atLeast", {n: st.hours}) : String(st.hours);
  return heading + `<ul class="pstats">` + tile(ectsLabel(cs), "plan.stat.ects") + tile(st.subjects, "plan.stat.subjects") + tile(st.exams, "plan.stat.exams") +
    tile(st.continuous, "plan.stat.cont") + (st.other ? tile(st.other, "plan.stat.other") : "") + tile(hoursVal, "plan.stat.hours") + `</ul>` +
    `<table class="ptbl"><thead><tr>` + ["plan.col.subject", "plan.col.ects", "plan.col.eval", "plan.col.hours", "plan.col.grading", "plan.col.teachers"].map(k => `<th scope="col">${esc(t(k))}</th>`).join("") + `</tr></thead>` +
    cs.map((c, i) => subjectRow(c, i, maxE)).join("") + `</table>`;
}

function directoryHTML(D) {
  const prog = (D.sections || []).filter(s => s.kind === "contacts").flatMap(s => s.items || []);
  const subj = (D.courses || []).filter(c => people(c).length);
  return (prog.length ? `<h3>${esc(t("plan.programme"))}</h3><ul>${prog.map(p => `<li>${ITEMS.contacts(p)}</li>`).join("")}</ul>` : "") +
    (subj.length ? `<h3>${esc(t("plan.bySubject"))}</h3>` + subj.map(c => `<h4>${esc(c.title)}</h4><ul>${people(c).map(p => `<li>${ITEMS.contacts(p)}</li>`).join("")}</ul>`).join("") : "") ||
    `<p class="note">${esc(t("plan.noContacts"))}</p>`;
}
