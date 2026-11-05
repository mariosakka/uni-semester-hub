import {describe, test, expect} from "vitest";
import {readFileSync} from "node:fs";
import {normalize, flatten, semesterView} from "./semester.js";
import {weekCount, weekSessions, timeline, buildIcs, sessionInfo, typeLetter, cardAria, sessionKey, layoutLanes} from "./schedule.js";
import {setGroup, resetGroups} from "./groups.js";

// per semester: week resolution, session data, .ics, lanes (datasets: public/data/<set>/data.js)
const load = set => new Function("window", readFileSync(new URL(`../../public/data/${set}/data.js`, import.meta.url), "utf8") + "\nreturn window.HUB_DATA;")({});

describe.each(["sample", "aie"])("schedule (%s)", set => {
  const N = normalize(load(set)), views = flatten(N).map(s => semesterView(N, s)).filter(V => V.weeks && V.weeks.segments); // placeholder semesters have no timetable

  test("at least one semester with a timetable", () => expect(views.length).toBeGreaterThanOrEqual(1));

  test.each(views.map(V => [V.id, V]))("semester %s: weeks, sessions, ics", (_id, V) => {
    const n = weekCount(V);
    expect(n).toBeGreaterThanOrEqual(1);
    for (let w = 1; w <= n; w++) expect(weekSessions(V, w).every(x => x.day >= 0 && x.day <= 4 && x.end > x.start), `week ${w}`).toBe(true);
    expect(timeline(V).length).toBeGreaterThanOrEqual(n);
    const ics = buildIcs(V, new Date("2026-01-01T00:00:00Z")), begins = (ics.match(/BEGIN:VEVENT/g) || []).length;
    expect((ics.match(/END:VEVENT/g) || []).length).toBe(begins);
    expect(ics.startsWith("BEGIN:VCALENDAR") && ics.endsWith("END:VCALENDAR")).toBe(true);
    expect(ics.split("\r\n").every(l => l.length <= 75)).toBe(true);
    expect(new Set(ics.match(/UID:.*/g)).size).toBe(begins);
  });

  // spot checks on known deviations (first timetabled semester of the real data set)
  test.runIf(set === "aie")("aie spot checks", () => {
    const VV = views[0], wk = w => weekSessions(VV, w);
    setGroup(VV, "ml", "2"); // default is all subgroups; pick SG2 for ML to check the filter
    const w6 = wk(6), w10 = wk(10);
    expect(w6.some(s => s.key === "2026-11-04" && s.course === "hc" && s.status === "cancel")).toBe(true);
    expect(w6.some(s => s.extra && s.course === "de" && s.start === 18)).toBe(true);
    expect(!w6.some(s => s.course === "ml" && s.group === "1") && w6.some(s => s.course === "ml" && s.group === "2")).toBe(true);
    resetGroups(VV);
    const hc = wk(6).find(s => s.key === "2026-11-04" && s.course === "hc" && s.type === "course"), hcInfo = sessionInfo(VV, hc);
    expect(hcInfo.status).toBe("cancel"); expect(hcInfo.week).toBe(6); expect(hcInfo.parity).toBe("even");
    const mlInfo = sessionInfo(VV, wk(6).find(s => s.key === "2026-11-05" && s.course === "ml" && s.type === "lab"));
    expect(mlInfo.status === "dev" && mlInfo.u === true).toBe(true);
    expect(mlInfo.modeDiffers && mlInfo.place === "Online" && mlInfo.basePlace === "CB205").toBe(true);
    expect(mlInfo.ects).toBe(5);
    const extraInfo = sessionInfo(VV, wk(6).find(s => s.extra));
    expect(extraInfo.status === "extra" && !extraInfo.modeDiffers).toBe(true);
    expect(typeLetter("lab") + typeLetter("course") + typeLetter("project") + typeLetter("seminar")).toBe("LCPS");
    expect(typeLetter("workshop")).toBe("W");
    expect(cardAria(VV, hc)).toBe("Human-Centric AI for Energy Management, course, 17:00–18:00, Not held");
    expect(wk(6).every(s => s.name && typeof s.baseMode === "string")).toBe(true);
    expect(new Set(wk(6).map(sessionKey)).size).toBe(wk(6).length);
    expect(w10.filter(s => s.status === "cancel").length).toBe(3);
    expect(w10.find(s => s.course === "fai" && s.type === "lab" && s.key === "2026-12-04").mode).toBe("online");
  });
});

test("layoutLanes", () => {
  const s = (day, start, end) => ({day, start, end}), a = s(0, 9, 11), b = s(0, 10, 12), c = s(0, 12, 13), d = s(1, 9, 10);
  const L = layoutLanes([a, b, c, d]);
  expect([L.get(a), L.get(b), L.get(c), L.get(d)]).toEqual([[0, 2], [1, 2], [0, 1], [0, 1]]);
});
