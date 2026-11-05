import {test, expect} from "vitest";
import {planStats, barPct, ectsLabel} from "./plan.js";
import {t} from "./strings.js";

test("planStats counts subjects, hours and evaluation kinds", () => {
  expect(planStats([{evaluation: "E", hours: {course: 2, lab: 2}}, {evaluation: "V (continuous)", hours: {course: 1}}, {evaluation: "P"}, {}]))
    .toEqual({subjects: 4, hours: 5, hoursKnown: 2, exams: 1, continuous: 1, other: 1});
  expect(planStats([])).toEqual({subjects: 0, hours: 0, hoursKnown: 0, exams: 0, continuous: 0, other: 0});
});

test("barPct clamps and never returns NaN", () => {
  expect(barPct(5, 10)).toBe(50);
  expect(barPct(20, 10)).toBe(100);
  expect(barPct("x", 10)).toBe(0);
  expect(barPct(5, 0)).toBe(100);
});

test("unknown ECTS are never summed as 0", () => {
  expect(ectsLabel([{ects: 5}, {}])).toBe("≥5 ECTS");
  expect(ectsLabel([{}])).toBe(t("plan.unknown"));
  expect(ectsLabel([{ects: 5}, {ects: 10}])).toBe("15 ECTS");
  expect(ectsLabel([{}, {}])).toBe("–");
  expect(ectsLabel([])).toBe("–");
});
