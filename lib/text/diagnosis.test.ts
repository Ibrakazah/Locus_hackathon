import { describe, it, expect } from "vitest";
import { diagnosis } from "./diagnosis";
import type { Profile, Recommendation } from "../store/types";

const recs: Recommendation[] = [
  {
    programId: "nu",
    admissionFit: "fits",
    reasons: [],
    gaps: [],
    sortScore: 0.9,
    reach: true,
  },
];

describe("diagnosis", () => {
  it("IELTS выше 5.5 попадает в сильные стороны", () => {
    const profile: Profile = {
      route: "kz",
      grade: 11,
      fields: ["it"],
      funding: "grant_only",
      exams: { ielts: { status: "taken", score: 6.5 } },
      kz: { interestedInNu: true },
    };
    const d = diagnosis(profile, recs);
    expect(d.strengths.join(" ")).toMatch(/IELTS/i);
  });

  it("пустые экзамены попадают в ограничения", () => {
    const profile: Profile = {
      route: "kz",
      grade: 11,
      fields: ["it"],
      funding: "grant_only",
      exams: {},
    };
    const d = diagnosis(profile, recs);
    expect(d.limits.join(" ")).toMatch(/экзамен/i);
  });

  it("цель содержит направление, страну и финансирование", () => {
    const profile: Profile = {
      route: "kz",
      grade: 11,
      fields: ["it"],
      funding: "grant_only",
      exams: {},
    };
    const d = diagnosis(profile, recs);
    expect(d.goal).toMatch(/IT/);
    expect(d.goal).toMatch(/Казахстан/i);
    expect(d.goal).toMatch(/грант/i);
  });
});
