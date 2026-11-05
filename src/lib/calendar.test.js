// Pure helpers: calendar ranges, week lookup, day info with deviations, year data, subgroup filtering (defaults, per-course choice,
// "all", unknown values) and the .ics respecting it. Data sets: public/data/<set>/data.js.
import {readFileSync} from "node:fs";
import {describe, it, expect, vi} from "vitest";
import {t, tx} from "./strings.js";
import {iso, addDays, parseDate} from "./util.js";
import {normalize, flatten, semesterView, semOfDate} from "./semester.js";
import {weekCount, weekSessions, buildIcs} from "./schedule.js";
import {discoverGroups, groupFor, setGroup, setAllGroups, resetGroups, groupSummary, visible} from "./groups.js";
import {calMonths, calRange, clampDate, mondayOfDate, nearestMonth, weekNumberOf, dayInfo, dayState, dayTip, dayClass} from "./calendar.js";

const store = {};
vi.stubGlobal("localStorage", {getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }});

const d = s => new Date(`${s}T12:00`);
const loadSet = name => { const w = {}; new Function("window", readFileSync(new URL(`../../public/data/${name}/data.js`, import.meta.url), "utf8"))(w); return w.HUB_DATA; };

describe.each(["aie", "sample"])("calendar helpers (%s)", set => {
  const N = normalize(loadSet(set)), SEMS = flatten(N), first = SEMS.find(s => (s.weeks || {}).segments);
  const V = semesterView(N, first); V.groupKey = "k:" + first.id;
  const aie = set === "aie", info = k => dayInfo(V, k);

  it("ranges", () => {
    const months = calMonths(V);
    expect(months.length).toBeGreaterThan(0);
    const m1 = months[0], m2 = months[months.length - 1], mid = months[Math.floor(months.length / 2)];
    expect(nearestMonth(V, d("1999-01-01"))).toEqual(m1);
    expect(nearestMonth(V, d("2099-01-01"))).toEqual(m2);
    expect(nearestMonth(V, new Date(mid[0], mid[1], 15))).toEqual(mid);
    expect(iso(mondayOfDate(d("2026-11-08")))).toBe("2026-11-02"); // Sunday belongs to the week starting Monday
    expect(iso(mondayOfDate(d("2026-11-02")))).toBe("2026-11-02");
    expect(iso(clampDate(d("2000-01-01"), ...calRange(V)))).toBe(iso(calRange(V)[0]));
  });

  it("week lookup", () => {
    const w1 = parseDate(first.weeks.segments[0].start);
    expect(weekNumberOf(V, w1)).toBe(1);
    expect(weekNumberOf(V, addDays(w1, 6))).toBe(1);
    expect(weekNumberOf(V, addDays(w1, -1))).toBeNull();
  });

  it.runIf(aie)("day info with deviations, deadlines and exams", () => {
    expect(weekNumberOf(V, d("2026-11-04"))).toBe(6);
    expect(weekNumberOf(V, d("2026-12-25"))).toBeNull(); // winter vacation
    expect(weekNumberOf(V, d("2027-01-12"))).toBe(13); // weeks resume after the break
    const wed = info("2026-11-04");
    expect([wed.week, wed.parity]).toEqual([6, "even"]);
    expect(wed.sessions.some(s => s.course === "hc" && s.status === "cancel")).toBe(true);
    expect(wed.sessions.some(s => s.extra && s.course === "de")).toBe(true);
    const off = info("2026-12-01");
    expect(off.off).toBeTruthy();
    expect(off.sessions.every(s => s.status === "cancel")).toBe(true);
    const vac = info("2026-12-25");
    expect(vac.period.kind).toBe("vac");
    expect(vac.week).toBeNull();
    expect(vac.sessions).toHaveLength(0);
    expect(info("2027-01-25").period.kind).toBe("exam");
    const sat = info("2026-11-07");
    expect([sat.sessions.length, !!sat.off, sat.keys.length]).toEqual([0, false, 0]);
    expect(off.keys).toHaveLength(1);
    expect(off.keys[0].kind).toBe("task");
    expect(dayClass(dayState(V, "2026-12-01"), "2026-12-01", "")).toMatch(/key task/);
    expect(dayClass(dayState(V, "2027-01-20"), "2027-01-20", "")).toMatch(/key exam/);
    expect(dayState(V, "2027-01-18").ev.length + dayState(V, "2027-01-22").ev.length).toBe(2);
    expect(dayState(V, "2027-01-23").ev).toHaveLength(0); // range markers cover from..to only
    expect(dayTip(dayState(V, "2026-12-01"))).toContain("Research 1");
  });

  it("year data merges the semesters of the year", () => {
    expect(Array.isArray(V.year.keyDates)).toBe(true);
    if (aie) expect(V.year.keyDates.some(k => k.from === "2027-01-18" && k.kind === "exam")).toBe(true);
    expect(tx("calendar.legend.task") + t("calendar.legend.keyExam") + t("modal.deadlines")).toBe("DeadlineExam / presentationDeadlines");
    expect(V.year.semesters.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(V.year.periods)).toBe(true);
    if (aie) expect(V.year.semesters).toHaveLength(2);
    expect((semOfDate(SEMS, first.weeks.segments[0].start) || {}).id).toBe(first.id);
    expect(semOfDate(SEMS, "1999-01-01")).toBeNull();
  });

  it("subgroups: defaults, choice, persistence, reset, .ics", () => {
    const gs = discoverGroups(V);
    if (!gs.length) return; // no grouped sessions: no subgroup control
    const c = gs[0].course, g0 = gs[0].groups;
    const count = () => { let n = 0; for (let w = 1; w <= weekCount(V); w++) n += weekSessions(V, w).length; return n; };
    const ics = () => (buildIcs(V, new Date("2026-01-01T00:00:00Z")).match(/BEGIN:VEVENT/g) || []).length;
    resetGroups(V);
    const dflt = groupFor(V, c);
    expect(dflt).toBe("all");
    const base = count(), baseIcs = ics();
    setAllGroups(V, "all");
    expect(count()).toBe(base);
    setGroup(V, c, g0[0]);
    expect(count()).toBeLessThan(base);
    expect(ics()).toBeLessThan(baseIcs);
    expect(groupFor(V, c)).toBe(g0[0]);
    expect(weekSessions(V, 2).some(s => s.course === c && s.group && s.group !== g0[0])).toBe(false);
    setGroup(V, c, "99");
    expect(groupFor(V, c)).not.toBe("99"); // unknown stored value ignored
    setGroup(V, c, g0[0]);
    expect(JSON.parse(store["k:" + first.id])[c]).toBe(g0[0]);
    V.groupSel = undefined; // a fresh load reads storage back
    expect(groupFor(V, c)).toBe(g0[0]);
    resetGroups(V);
    expect(groupFor(V, c)).toBe(dflt);
    expect(groupSummary(V).length).toBeGreaterThan(0);
  });
});

describe("a view without group data", () => {
  const L = {courses: [{id: "x", title: "X"}], timetable: [{course: "x", type: "course", day: 0, start: 8, end: 9, rules: [{weeks: [[1, 1]], mode: "online"}]}]};
  it("never filters and shows no control", () => {
    expect(discoverGroups(L)).toHaveLength(0);
    expect(visible(L, L.timetable[0])).toBe(true);
    expect(groupFor(L, "x")).toBe("all");
  });
});
