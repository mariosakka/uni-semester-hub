#!/usr/bin/env node
// Usage: node scripts/validate.mjs data/<set>/data.js   |   --selftest
// Accepts the legacy flat shape and v2 (programme -> years -> semesters), see docs/SCHEMA.md.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// default UI string keys (src/strings.js is a plain script: evaluate it to read HUB_STRINGS)
const STRING_KEYS = (() => {
  const c = { console };
  vm.runInNewContext(readFileSync(new URL('../src/strings.js', import.meta.url), 'utf8'), c);
  return new Set(Object.keys(c.HUB_STRINGS));
})();

const KINDS = ['list', 'news', 'schedule', 'calendar', 'course', 'contacts', 'links', 'table', 'studyplan', 'directory'];
const TABS = ['news', 'todo', 'overview', 'schedule', 'calendar', 'courses', 'plan', 'contacts', 'info'];
const TYPES = ['course', 'lab', 'project', 'seminar'];
const CHANGES = ['cancel', 'online', 'in-person', 'note'];
const PKINDS = ['teach', 'vac', 'exam', 'break'];

const isDate = s => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
};

function checkSections(list, name, e, cid, allowCourse, tabs = TABS, w = () => {}) {
  (list || []).forEach((s, i) => {
    const p = `${name}[${i}]`;
    if (!KINDS.includes(s.kind)) return e(p + '.kind', `unknown kind ${JSON.stringify(s.kind)} (known: ${KINDS})`);
    if (s.kind === 'course') { if (allowCourse) cid(p + '.course', s.course); else e(p, 'course sections are not allowed in common'); }
    if (s.tab !== undefined && !tabs.includes(s.tab)) e(p + '.tab', `unknown tab ${JSON.stringify(s.tab)}`);
    if (s.tab === 'overview' && tabs === TABS) w(p + '.tab', '"overview" is the old name of the News tab; use "news" or "todo"');
    if (s.kind === 'news') {
      if (!Array.isArray(s.items)) e(p + '.items', 'news needs an items array');
      else s.items.forEach((it, j) => {
        const q = `${p}.items[${j}]`;
        if (!isDate(it?.date)) e(q + '.date', `invalid date ${JSON.stringify(it?.date)} (want YYYY-MM-DD)`);
        if (!it?.title || typeof it.title !== 'string') e(q + '.title', 'required');
        if (it?.course !== undefined) { if (allowCourse) cid(q + '.course', it.course); else w(q + '.course', 'courses are per semester; the tag is not resolved in common'); }
      });
    }
    if (s.kind === 'table' && !(Array.isArray(s.columns) && Array.isArray(s.rows))) e(p, 'table needs columns and rows');
  });
}

function checkCourse(c, p, e, warns, pre) {
  const people = (k, list) => {
    if (list === undefined) return;
    if (!Array.isArray(list)) return e(`${p}.${k}`, 'must be an array');
    list.forEach((x, i) => { if (!x || !x.name) e(`${p}.${k}[${i}].name`, 'required'); });
  };
  people('teachers', c.teachers); people('contacts', c.contacts);
  if (c.description !== undefined && typeof c.description !== 'string') e(p + '.description', 'must be a string');
  if (c.hours !== undefined) {
    if (!c.hours || typeof c.hours !== 'object') e(p + '.hours', 'must be an object');
    else for (const [k, v] of Object.entries(c.hours)) if (!(typeof v === 'number' && v >= 0)) e(`${p}.hours.${k}`, 'must be a number >= 0');
  }
  if (c.links !== undefined) {
    if (!Array.isArray(c.links)) e(p + '.links', 'must be an array');
    else c.links.forEach((l, i) => { if (!l?.label || !l?.url) e(`${p}.links[${i}]`, 'needs label and url'); });
  }
  const g = c.grading;
  if (g === undefined) return;
  if (!g || typeof g !== 'object') return e(p + '.grading', 'must be an object');
  if (g.components !== undefined && !Array.isArray(g.components)) return e(p + '.grading.components', 'must be an array');
  let sum = 0, n = 0;
  (g.components || []).forEach((x, i) => {
    const q = `${p}.grading.components[${i}]`;
    if (!x?.name) e(q + '.name', 'required');
    if (x?.weight === undefined) return;
    if (typeof x.weight !== 'number' || x.weight < 0 || x.weight > 100) e(q + '.weight', 'must be a number 0-100');
    else { sum += x.weight; n++; }
  });
  if (n && Math.abs(sum - 100) > 1e-9) warns.push(`${pre}${p}.grading: weights sum to ${sum}, not 100`);
}

// S = the whole legacy file or one v2 semester; pre = error path prefix.
// strict (legacy) requires weeks/courses/timetable; v2 semesters may be placeholders without them.
function checkSemester(S, pre, errs, strict, warns) {
  const e = (p, m) => errs.push(`${pre}${p}: ${m}`);
  const date = (p, s) => { if (!isDate(s)) e(p, `invalid date ${JSON.stringify(s)} (want YYYY-MM-DD)`); };
  const hour = (p, v) => { if (!(typeof v === 'number' && v >= 0 && v <= 24)) e(p, `bad hour ${JSON.stringify(v)}`); };

  const segs = S.weeks?.segments;
  let total = 0;
  if (S.weeks || strict) {
    if (!Array.isArray(segs) || !segs.length) e('weeks.segments', 'required non-empty array');
    else segs.forEach((s, i) => {
      date(`weeks.segments[${i}].start`, s.start);
      if (!Number.isInteger(s.count) || s.count < 1) e(`weeks.segments[${i}].count`, 'must be integer >= 1');
      else total += s.count;
    });
  }

  const ids = new Set();
  if (S.courses !== undefined || strict) {
    if (!Array.isArray(S.courses)) e('courses', 'required array');
    else S.courses.forEach((c, i) => {
      if (!c.id) e(`courses[${i}].id`, 'required');
      else if (ids.has(c.id)) e(`courses[${i}].id`, `duplicate "${c.id}"`);
      ids.add(c.id);
      if (!c.title) e(`courses[${i}].title`, 'required');
      checkCourse(c, `courses[${i}]`, e, warns, pre);
    });
  }
  const cid = (p, id) => { if (!ids.has(id)) e(p, `unknown course id ${JSON.stringify(id)}`); };

  if (S.timetable !== undefined || strict) {
    if (!Array.isArray(S.timetable)) e('timetable', 'required array');
    else S.timetable.forEach((t, i) => {
      const p = `timetable[${i}]`;
      cid(p + '.course', t.course);
      if (!TYPES.includes(t.type)) e(p + '.type', `unknown type ${JSON.stringify(t.type)}`);
      if (![0, 1, 2, 3, 4].includes(t.day)) e(p + '.day', 'must be 0-4');
      hour(p + '.start', t.start); hour(p + '.end', t.end);
      if (t.start >= t.end) e(p, `start (${t.start}) must be < end (${t.end})`);
      if (![undefined, null, 'even', 'odd'].includes(t.parity)) e(p + '.parity', 'null|even|odd');
      (t.rules || []).forEach((r, j) => (r.weeks || []).forEach((w, k) => {
        const q = `${p}.rules[${j}].weeks[${k}]`;
        if (!Array.isArray(w) || w.length !== 2 || !Number.isInteger(w[0]) || !Number.isInteger(w[1])) return e(q, 'must be [from,to]');
        if (w[0] > w[1]) e(q, `inverted [${w}]`);
        if (w[0] < 1 || (total && w[1] > total)) e(q, `outside weeks 1..${total}`);
      }));
    });
  }

  Object.keys(S.daysOff || {}).forEach(d => date(`daysOff.${d}`, d));
  (S.deviations || []).forEach((d, i) => {
    const p = `deviations[${i}]`;
    date(p + '.date', d.date); cid(p + '.course', d.course);
    if (!CHANGES.includes(d.change)) e(p + '.change', `must be one of ${CHANGES}`);
    if (d.type && !TYPES.includes(d.type)) e(p + '.type', 'unknown type');
  });
  (S.extraSessions || []).forEach((x, i) => {
    const p = `extraSessions[${i}]`;
    date(p + '.date', x.date); cid(p + '.course', x.course);
    hour(p + '.start', x.start); hour(p + '.end', x.end);
    if (x.start >= x.end) e(p, 'start must be < end');
  });
  const period = (p, a, b) => {
    date(p + '.from', a); date(p + '.to', b);
    if (isDate(a) && isDate(b) && a > b) e(p, `inverted period ${a} > ${b}`);
  };
  (S.calendar?.periods || []).forEach((x, i) => {
    period(`calendar.periods[${i}]`, x.from, x.to);
    if (!PKINDS.includes(x.kind)) e(`calendar.periods[${i}].kind`, `must be one of ${PKINDS}`);
  });
  const m = S.calendar?.months;
  if (!strict && m !== undefined && (!Array.isArray(m) || m.some(x => !Array.isArray(x) || x.length !== 2 || !Number.isInteger(x[0]) || !Number.isInteger(x[1]) || x[1] < 0 || x[1] > 11)))
    e('calendar.months', 'must be [[year, month0 (0-11)], ...]');
  const tabs = Array.isArray(S.tabs) ? S.tabs.map(t => t.id) : TABS;
  checkSections(S.sections, 'sections', e, cid, true, tabs, (p, m) => warns.push(`${pre}${p}: ${m}`));
}

// meta.strings: object of known key -> string (unknown keys only warn); meta.locale: string
function checkStrings(meta, e, warns) {
  if (meta?.locale !== undefined) {
    let ok = false;
    try { ok = typeof meta.locale === 'string' && Intl.DateTimeFormat.supportedLocalesOf([meta.locale]).length > 0; } catch { ok = false; }
    if (typeof meta.locale !== 'string') e('meta.locale', 'must be a string');
    else if (!ok) warns.push(`meta.locale: ${JSON.stringify(meta.locale)} is not a supported locale (the site falls back to en-GB)`);
  }
  const s = meta?.strings;
  if (s === undefined) return;
  if (!s || typeof s !== 'object' || Array.isArray(s)) return e('meta.strings', 'must be an object of key -> text');
  for (const [k, v] of Object.entries(s)) {
    if (!STRING_KEYS.has(k)) warns.push(`meta.strings.${k}: unknown key (see docs/STRINGS.md); ignored`);
    else if (typeof v !== 'string') e(`meta.strings.${k}`, 'must be a string (plain text)');
  }
}

export function validate(D, warns = []) {
  const errs = [];
  if (!D || typeof D !== 'object') return ['HUB_DATA missing or not an object'];
  const e = (p, m) => errs.push(`${p}: ${m}`);
  if (!D.meta?.title) e('meta.title', 'required');
  checkStrings(D.meta, e, warns);
  if (!D.years) { checkSemester(D, '', errs, true, warns); return errs; }

  checkSections(D.common, 'common', e, null, false, TABS, (p, m) => warns.push(`${p}: ${m}`));
  if (!Array.isArray(D.years) || !D.years.length) { e('years', 'required non-empty array'); return errs; }
  const yids = new Set(), sids = new Set();
  D.years.forEach((y, i) => {
    const yp = `years[${i}]`;
    if (!y.id) e(yp + '.id', 'required');
    else if (yids.has(y.id)) e(yp + '.id', `duplicate "${y.id}"`);
    yids.add(y.id);
    if (!y.title) e(yp + '.title', 'required');
    if (!Array.isArray(y.semesters) || !y.semesters.length) return e(yp + '.semesters', 'required non-empty array');
    y.semesters.forEach((s, j) => {
      const sp = `${yp}.semesters[${j}]`;
      if (!s.id) e(sp + '.id', 'required');
      else if (sids.has(s.id)) e(sp + '.id', `duplicate semester id "${s.id}" (must be unique across the data set)`);
      sids.add(s.id);
      if (!s.title) e(sp + '.title', 'required');
      checkSemester(s, sp + '.', errs, false, warns);
    });
  });
  return errs;
}

const arg = process.argv[2];
if (arg === '--selftest') {
  const ok = {
    meta: { title: 't' }, weeks: { segments: [{ start: '2026-09-28', count: 12 }] },
    courses: [{ id: 'a', title: 'A' }],
    timetable: [{ course: 'a', type: 'course', day: 0, start: 8, end: 10, rules: [{ weeks: [[1, 12]] }] }],
    sections: [{ kind: 'schedule' }],
  };
  const bad = structuredClone(ok);
  Object.assign(bad.timetable[0], { course: 'zz', day: 5, start: 11, rules: [{ weeks: [[5, 20]] }] });
  bad.sections.push({ kind: 'nope' });
  bad.daysOff = { '2026-13-01': 'x' };
  const a = validate(ok), b = validate(bad);
  if (a.length || b.length < 6) { console.error('selftest FAILED', a, b); process.exit(1); }

  const w2 = [];
  const g = validate({ meta: { title: 't' }, years: [{ id: 'y', title: 'Y', semesters: [{ id: 'p', title: 'P', courses: [{ id: 'a', title: 'A', hours: { lab: 2 }, teachers: [{ name: 'T' }], grading: { components: [{ name: 'x', weight: 40 }] } }], sections: [{ kind: 'studyplan' }, { kind: 'directory' }] }] }], common: [{ kind: 'directory' }] }, w2);
  const gb = validate({ meta: { title: 't' }, years: [{ id: 'y', title: 'Y', semesters: [{ id: 'p', title: 'P', courses: [{ id: 'a', title: 'A', hours: { lab: -1 }, contacts: [{}], grading: { components: [{ name: 'x', weight: 140 }] } }], sections: [{ kind: 'list', tab: 'nope' }] }] }] });
  if (g.length || gb.length < 4 || !w2.length) { console.error('selftest v2.1 FAILED', g, gb, w2); process.exit(1); }
  const sem = { ...structuredClone(ok), id: 's1', title: 'S1', meta: undefined,
    calendar: { periods: [{ from: '2026-09-28', to: '2026-12-18', kind: 'teach' }], months: [[2026, 8]] } };
  const v2 = { meta: { title: 't' }, common: [{ kind: 'list', items: ['x'] }], years: [{ id: 'y1', title: 'Y1', semesters: [
    sem, { id: 's2', title: 'S2 (placeholder)', sections: [{ kind: 'list', items: [] }] }] }] };
  const v2bad = structuredClone(v2);
  const [s1, s2] = v2bad.years[0].semesters;
  s2.id = 's1'; s1.calendar.months = [[2026, 12]]; s1.timetable[0].rules = [{ weeks: [[1, 13]] }];
  s1.sections.push({ kind: 'course', course: 'zz' }); v2bad.common.push({ kind: 'course', course: 'a' });
  const c = validate(v2), d = validate(v2bad);
  if (c.length || d.length < 5) { console.error('selftest v2 FAILED', c, d); process.exit(1); }
  const wn = [], n1 = validate({ meta: { title: 't' }, common: [{ kind: 'news', items: [{ date: '2026-11-03', title: 'x', course: 'a' }] }], years: [{ id: 'y', title: 'Y', semesters: [{ id: 'p', title: 'P', courses: [{ id: 'a', title: 'A' }],
    sections: [{ kind: 'news', items: [{ date: '2026-11-03', title: 'x', course: 'a', source: 'official', unconfirmed: true }] }, { kind: 'list', tab: 'overview', items: ['y'] }, { kind: 'list', tab: 'todo', items: ['[ ] z'] }] }] }] }, wn);
  const n2 = validate({ meta: { title: 't' }, years: [{ id: 'y', title: 'Y', semesters: [{ id: 'p', title: 'P', courses: [{ id: 'a', title: 'A' }],
    sections: [{ kind: 'news', items: [{ date: '2026-02-30', title: 'x' }, { date: '2026-11-03' }, { date: '2026-11-03', title: 'x', course: 'zz' }] }, { kind: 'news' }] }] }] });
  if (n1.length || wn.length !== 2 || n2.length !== 4) { console.error('selftest news FAILED', n1, wn, n2); process.exit(1); }
  const ws = [];
  const t1 = validate({ ...structuredClone(ok), meta: { title: 't', locale: 'ro-RO', strings: { 'nav.year': 'An', 'no.such': 'x' } } }, ws);
  const t2 = validate({ ...structuredClone(ok), meta: { title: 't', locale: 5, strings: { 'nav.year': 3 } } });
  const t3 = validate({ ...structuredClone(ok), meta: { title: 't', strings: ['x'] } });
  if (t1.length || ws.length !== 1 || t2.length !== 2 || t3.length !== 1) { console.error('selftest strings FAILED', t1, ws, t2, t3); process.exit(1); }
  console.log(`selftest ok (bad samples produced ${b.length} and ${d.length} errors)`);
} else if (!arg) {
  console.error('usage: node scripts/validate.mjs data/<set>/data.js | --selftest');
  process.exit(2);
} else {
  let D;
  try {
    const ctx = { window: {} };
    vm.runInNewContext(readFileSync(arg, 'utf8'), ctx, { filename: arg });
    D = ctx.window.HUB_DATA;
  } catch (x) { console.error(`cannot load ${arg}: ${x.message}`); process.exit(2); }
  const warns = [], errs = validate(D, warns);
  warns.forEach(m => console.warn('WARN ' + m));
  if (errs.length) { console.error(errs.map(m => 'ERROR ' + m).join('\n') + `\n${errs.length} error(s)`); process.exit(1); }
  console.log(`${arg}: OK`);
}
