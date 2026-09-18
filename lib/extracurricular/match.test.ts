import { describe, it, expect } from "vitest";
import { matchActivities } from "./match";
import type { Activity } from "./types";
import type { Profile } from "../store/types";

const NOW = new Date("2026-09-19T12:00:00+06:00");

const it11: Profile = {
  route: "kz",
  grade: 11,
  fields: ["it"],
  funding: "grant_or_contract",
  exams: {},
  kz: { language: "ru" },
};

const abroadResearch: Profile = {
  route: "abroad",
  grade: 11,
  fields: ["science"],
  funding: "grant_or_contract",
  exams: {},
  abroad: { countries: ["us"] },
};

function act(partial: Partial<Activity> & { id: string }): Activity {
  return {
    title: partial.id,
    type: "hackathon",
    fields: ["it"],
    gradeRange: [9, "graduate"],
    format: "online",
    language: "ru",
    price: "free",
    gain: "портфолио",
    intensity: 2,
    url: "https://example.org",
    demo: true,
    ...partial,
  };
}

const catalog: Activity[] = [
  act({ id: "hack-it", type: "hackathon", fields: ["it"], deadline: "2026-10-01" }),
  act({ id: "chem-olympiad", type: "olympiad", fields: ["science"], deadline: "2026-11-01" }),
  act({ id: "research-nu", type: "research", fields: ["science"], deadline: "2026-12-01" }),
  act({ id: "debate", type: "competition", fields: ["law", "humanities"], deadline: "2026-09-25" }),
  act({ id: "only-9-10", fields: ["it"], gradeRange: [9, 10] }),
];

describe("matchActivities", () => {
  it("фильтрует по классу", () => {
    const out = matchActivities(it11, catalog, NOW);
    expect(out.some((m) => m.activity.id === "only-9-10")).toBe(false);
    expect(out.some((m) => m.activity.id === "hack-it")).toBe(true);
  });

  it("fit high при совпадении направления", () => {
    const out = matchActivities(it11, catalog, NOW);
    const hack = out.find((m) => m.activity.id === "hack-it");
    expect(hack?.fit).toBe("high");
  });

  it("сортирует по дедлайну (ближайший первым)", () => {
    const out = matchActivities(it11, catalog, NOW);
    const first = out[0].activity.id;
    expect(first).toBe("debate"); // 09-25 ближе 10-01/11-01/12-01
  });

  it("зарубеж повышает research-активности", () => {
    const out = matchActivities(abroadResearch, catalog, NOW);
    const research = out.find((m) => m.activity.id === "research-nu");
    expect(research?.fit).toBe("high");
  });

  it("fallback: при пустом пересечении всё равно возвращает (минимум 3)", () => {
    const empty: Profile = { ...it11, fields: [] };
    const out = matchActivities(empty, catalog, NOW);
    expect(out.length).toBeGreaterThanOrEqual(3);
  });

  it("why содержит причину", () => {
    const out = matchActivities(it11, catalog, NOW);
    const hack = out.find((m) => m.activity.id === "hack-it");
    expect(hack?.why.length).toBeGreaterThan(0);
  });
});
