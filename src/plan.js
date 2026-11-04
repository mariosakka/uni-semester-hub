// Study plan and contact directory: HTML builders reading the courses data (no DOM access, node-testable).
// Needs esc (util.js) and ITEMS (render.js) at call time; D is a semester view (semesterView) with D.programme.

const HOURS = [["course", "plan.abbr.course"], ["seminar", "plan.abbr.seminar"], ["lab", "plan.abbr.lab"], ["project", "plan.abbr.project"]]; // [field, abbreviation key]
const hoursText = h => HOURS.filter(([k]) => h && h[k]).map(([k, a]) => `${t(a)}${h[k]}`).join(" ") || t("plan.unknown");
// "–" when no ECTS are known, "≥N ECTS" when only some are, "N ECTS" when all are (unknown is never summed as 0)
const ectsLabel = cs => {
  const known = (cs || []).filter(c => +c.ects), n = known.reduce((t, c) => t + +c.ects, 0);
  return !known.length ? t("plan.unknown") : known.length < cs.length ? t("plan.ectsAtLeast", {n}) : t("plan.ects", {n});
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
  return (comps.length ? `<div class="tw"><table class="tbl"><thead><tr><th>${esc(t("plan.component"))}</th><th>${esc(t("plan.weight"))}</th><th>${esc(t("plan.note"))}</th></tr></thead><tbody>` +
      comps.map(x => `<tr><td>${esc(x.name)}</td><td>${x.weight != null ? x.weight + "%" : esc(t("plan.unknown"))}</td><td>${esc(x.note || "")}</td></tr>`).join("") +
      `</tbody>${allW ? `<tfoot><tr><td>${esc(t("plan.total"))}</td><td colspan="2">${total}%${total === 100 ? "" : esc(t("plan.notHundred"))}</td></tr></tfoot>` : ""}</table></div>` : "") +
    (g.passRule ? `<p><b>${esc(t("plan.passRule"))}</b> ${esc(g.passRule)}</p>` : "") +
    (g.notes ? `<p class="note">${esc(g.notes)}</p>` : "");
}

function subjectBlock(c) {
  const bits = [esc(t("plan.ects", {n: c.ects || t("plan.unknownEcts")})), c.evaluation && esc(t("plan.evaluation", {value: c.evaluation})), esc(t("plan.hoursWeek", {value: hoursText(c.hours)}))].filter(Boolean).join(" · ");
  const ppl = people(c), links = (c.links || []).map(l => `<a href="${esc(l.url)}">${esc(l.label)}</a>`).join(" · ");
  return `<details class="subj c-${esc(c.color || "grey")}"><summary><b>${esc(c.title)}</b> <span class="chead">${bits}</span></summary>` +
    (gradingHTML(c) || `<p class="note">${esc(t("plan.noGrading"))}</p>`) +
    (links ? `<p>${links}</p>` : "") + (ppl.length ? `<ul>${ppl.map(p => `<li>${ITEMS.contacts(p)}</li>`).join("")}</ul>` : "") + `</details>`;
}

function studyplanHTML(D) {
  const P = D.programme, cs = D.courses || [], dash = t("plan.unknown");
  const overview = P.years.map(y => `<h4>${esc(y.title || "")}</h4><div class="plansems">` + y.semesters.map(s =>
    `<a class="plansem ${s.id === D.id ? "on" : ""}" href="#${esc(s.id)}/plan" aria-label="${esc((y.title ? y.title + " · " : "") + s.title)}"><b>${esc(s.title)}</b> · ${esc(ectsLabel(s.courses))}` +
    ((s.courses || []).map(c => `<div class="pl">${esc(c.title)} <small>${esc(c.ects || t("plan.unknownEcts"))}</small></div>`).join("") || `<div class="pl">${esc(t("plan.noSubjectsListed"))}</div>`) + `</a>`).join("") + `</div>`).join("");
  const table = cs.length ? `<div class="tw"><table class="tbl"><thead><tr><th>${esc(t("plan.col.subject"))}</th><th>${esc(t("plan.col.ects"))}</th><th>${esc(t("plan.col.eval"))}</th><th>${esc(t("plan.col.hours"))}</th><th>${esc(t("plan.col.grading"))}</th><th>${esc(t("plan.col.teachers"))}</th></tr></thead><tbody>` +
    cs.map(c => `<tr><td>${esc(c.title)}</td><td>${esc(c.ects || dash)}</td><td>${esc(c.evaluation || dash)}</td><td>${esc(hoursText(c.hours))}</td>` +
      `<td>${gradingSummary(c) || esc(dash)}</td><td>${(c.teachers || []).map(p => esc(p.name)).join(", ") || esc(dash)}</td></tr>`).join("") +
    `</tbody><tfoot><tr><td>${esc(t("plan.total"))}</td><td colspan="5">${esc(ectsLabel(cs))}</td></tr></tfoot></table></div>` : `<p class="note">${esc(t("plan.noSubjects"))}</p>`;
  return `<h3>${esc(t("plan.wholeProgramme"))}</h3>${overview}<h3>${esc(((P.years.find(y => y.id === D.yearId) || {}).title || "") + (P.years.length > 1 ? " · " : "") + (D.title || t("plan.thisSemester")))}</h3>${table}` +
    (cs.length ? `<h3>${esc(t("plan.perSubject"))}</h3>${cs.map(subjectBlock).join("")}` : "");
}

function directoryHTML(D) {
  const prog = (D.sections || []).filter(s => s.kind === "contacts").flatMap(s => s.items || []);
  const subj = (D.courses || []).filter(c => people(c).length);
  return (prog.length ? `<h3>${esc(t("plan.programme"))}</h3><ul>${prog.map(p => `<li>${ITEMS.contacts(p)}</li>`).join("")}</ul>` : "") +
    (subj.length ? `<h3>${esc(t("plan.bySubject"))}</h3>` + subj.map(c => `<h4>${esc(c.title)}</h4><ul>${people(c).map(p => `<li>${ITEMS.contacts(p)}</li>`).join("")}</ul>`).join("") : "") ||
    `<p class="note">${esc(t("plan.noContacts"))}</p>`;
}
