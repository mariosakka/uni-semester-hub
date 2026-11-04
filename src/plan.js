// Study plan and contact directory: HTML builders reading the courses data (no DOM access, node-testable).
// Needs esc (util.js) and ITEMS (render.js) at call time; D is a semester view (semesterView) with D.programme.

const HOURS = [["course", "C"], ["seminar", "S"], ["lab", "L"], ["project", "P"]];
const hoursText = h => HOURS.filter(([k]) => h && h[k]).map(([k, a]) => `${a}${h[k]}`).join(" ") || "–";
// "–" when no ECTS are known, "≥N ECTS" when only some are, "N ECTS" when all are (unknown is never summed as 0)
const ectsLabel = cs => {
  const known = (cs || []).filter(c => +c.ects), n = known.reduce((t, c) => t + +c.ects, 0);
  return !known.length ? "–" : known.length < cs.length ? `≥${n} ECTS` : `${n} ECTS`;
};

// "Final exam 60%, Project 40%" or "" when no components are given
const gradingSummary = c => ((c.grading || {}).components || []).map(x => esc(x.name) + (x.weight != null ? ` ${x.weight}%` : "")).join(", ");

const people = c => [...(c.teachers || []), ...(c.contacts || [])];
const peopleLine = list => list.map(p => ITEMS.contacts(p)).join("; ");

function gradingHTML(c) {
  const g = c.grading;
  if (!g) return "";
  const comps = g.components || [];
  const allW = comps.length && comps.every(x => x.weight != null), total = comps.reduce((n, x) => n + (+x.weight || 0), 0);
  return (comps.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Component</th><th>Weight</th><th>Note</th></tr></thead><tbody>` +
      comps.map(x => `<tr><td>${esc(x.name)}</td><td>${x.weight != null ? x.weight + "%" : "–"}</td><td>${esc(x.note || "")}</td></tr>`).join("") +
      `</tbody>${allW ? `<tfoot><tr><td>Total</td><td colspan="2">${total}%${total === 100 ? "" : " ⚠ not 100%"}</td></tr></tfoot>` : ""}</table></div>` : "") +
    (g.passRule ? `<p><b>Pass rule:</b> ${esc(g.passRule)}</p>` : "") +
    (g.notes ? `<p class="note">${esc(g.notes)}</p>` : "");
}

function subjectBlock(c) {
  const bits = [`${c.ects || "?"} ECTS`, c.evaluation && `evaluation ${esc(c.evaluation)}`, `hours/week ${hoursText(c.hours)}`].filter(Boolean).join(" · ");
  const ppl = people(c), links = (c.links || []).map(l => `<a href="${esc(l.url)}">${esc(l.label)}</a>`).join(" · ");
  return `<details class="subj c-${esc(c.color || "grey")}"><summary><b>${esc(c.title)}</b> <span class="chead">${bits}</span></summary>` +
    (gradingHTML(c) || `<p class="note">No grading details recorded yet.</p>`) +
    (links ? `<p>${links}</p>` : "") + (ppl.length ? `<ul>${ppl.map(p => `<li>${ITEMS.contacts(p)}</li>`).join("")}</ul>` : "") + `</details>`;
}

function studyplanHTML(D) {
  const P = D.programme, cs = D.courses || [];
  const overview = P.years.map(y => `<h4>${esc(y.title || "")}</h4><div class="plansems">` + y.semesters.map(s =>
    `<a class="plansem ${s.id === D.id ? "on" : ""}" href="#${esc(s.id)}/plan" aria-label="${esc((y.title ? y.title + " · " : "") + s.title)}"><b>${esc(s.title)}</b> · ${ectsLabel(s.courses)}` +
    ((s.courses || []).map(c => `<div class="pl">${esc(c.title)} <small>${c.ects || "?"}</small></div>`).join("") || `<div class="pl">no subjects listed yet</div>`) + `</a>`).join("") + `</div>`).join("");
  const table = cs.length ? `<div class="tw"><table class="tbl"><thead><tr><th>Subject</th><th>ECTS</th><th>Eval.</th><th>Hours/week</th><th>Grading</th><th>Teachers</th></tr></thead><tbody>` +
    cs.map(c => `<tr><td>${esc(c.title)}</td><td>${c.ects || "–"}</td><td>${esc(c.evaluation || "–")}</td><td>${hoursText(c.hours)}</td>` +
      `<td>${gradingSummary(c) || "–"}</td><td>${(c.teachers || []).map(t => esc(t.name)).join(", ") || "–"}</td></tr>`).join("") +
    `</tbody><tfoot><tr><td>Total</td><td colspan="5">${ectsLabel(cs)}</td></tr></tfoot></table></div>` : `<p class="note">No subjects listed for this semester yet.</p>`;
  return `<h3>Whole programme</h3>${overview}<h3>${esc(((P.years.find(y => y.id === D.yearId) || {}).title || "") + (P.years.length > 1 ? " · " : "") + (D.title || "This semester"))}</h3>${table}` +
    (cs.length ? `<h3>Per subject</h3>${cs.map(subjectBlock).join("")}` : "");
}

function directoryHTML(D) {
  const prog = (D.sections || []).filter(s => s.kind === "contacts").flatMap(s => s.items || []);
  const subj = (D.courses || []).filter(c => people(c).length);
  return (prog.length ? `<h3>Programme</h3><ul>${prog.map(p => `<li>${ITEMS.contacts(p)}</li>`).join("")}</ul>` : "") +
    (subj.length ? `<h3>By subject</h3>` + subj.map(c => `<h4>${esc(c.title)}</h4><ul>${people(c).map(p => `<li>${ITEMS.contacts(p)}</li>`).join("")}</ul>`).join("") : "") ||
    `<p class="note">No contacts listed.</p>`;
}
