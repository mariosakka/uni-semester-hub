// Programme -> years -> semesters: pure helpers (normalize, flatten, autoSemester, semesterView, parseRoute).

// legacy flat data (no `years`) becomes one year with one semester
function normalize(D) {
  const meta = D.meta || {};
  if (D.years) return {meta, common: D.common || [], years: D.years.map(y => ({id: y.id, title: y.title, semesters: y.semesters || []})), legacy: false};
  const {meta: _m, ...sem} = D;
  sem.id = "s1"; sem.title = meta.semester || "Semester";
  return {meta, common: [], years: [{id: "y1", title: meta.academicYear || "", semesters: [sem]}], legacy: true};
}

const flatten = N => N.years.flatMap(y => y.semesters.map(s => ({...s, yearId: y.id})));

// first day of a semester: its first teaching week, else its first calendar period; null = never automatic
function semStart(s) {
  const w = ((s.weeks || {}).segments || [])[0], ps = ((s.calendar || {}).periods || []).map(p => p.from).sort();
  return w ? w.start : ps[0] || null;
}

// the last semester that has started; the first one before any has; the first one if none has dates
function autoSemester(list, today = new Date()) {
  const dated = list.filter(semStart).sort((a, b) => semStart(a).localeCompare(semStart(b)));
  if (!dated.length) return list[0];
  const t = iso(today);
  return [...dated].reverse().find(s => semStart(s) <= t) || dated[0];
}

// what the existing renderers read: the semester's fields plus programme meta and common sections
function semesterView(N, sem) {
  const scoped = (arr, scope) => (arr || []).map((s, i) => ({...s, _scope: scope, _i: i}));
  return {...sem, meta: N.meta, legacy: N.legacy, programme: N,
    sections: [...scoped(N.common, "common"), ...scoped(sem.sections, N.legacy ? "legacy" : sem.id)]};
}

// "#<semesterId>/<tab>"; a lone "#<tab>" (old links) means the automatic semester
function parseRoute(hash, sems, auto) {
  const [a, b] = hash.replace(/^#/, "").split("/");
  const sem = sems.find(s => s.id === a);
  return sem ? {sem, tab: b || ""} : {sem: auto, tab: a || ""};
}
