import { describe, it, expect } from "vitest";
import { eventsFor } from "./calendar";
import type { Profile } from "../lib/store/types";

const NOW = new Date("2026-09-19T12:00:00+06:00");

const kz11: Profile = {
  route: "kz",
  grade: 11,
  fields: ["it"],
  funding: "grant_only",
  exams: { ent: { status: "not_taken" } },
  kz: { interestedInNu: true },
};

const nisUk: Profile = {
  route: "abroad",
  grade: 11,
  fields: [],
  funding: "grant_or_contract",
  isNis: true,
  exams: {},
  abroad: { countries: ["uk"] },
};

describe("eventsFor", () => {
  it("КЗ 11 класс: есть сессии ЕНТ и окно NU, нет UCAS", () => {
    const ids = eventsFor(kz11, NOW).map((e) => e.id);
    expect(ids).toContain("ent-main");
    expect(ids).toContain("nu-open");
    expect(ids).not.toContain("ucas-oxbridge");
  });

  it("Зарубеж: нет ЕНТ-событий", () => {
    const ids = eventsFor(nisUk, NOW).map((e) => e.id);
    expect(ids).not.toContain("ent-main");
  });

  it("NIS + UK: есть UCAS Oxbridge с дедлайном в будущем", () => {
    const ox = eventsFor(nisUk, NOW).find((e) => e.id === "ucas-oxbridge");
    expect(ox).toBeDefined();
    expect(new Date(ox!.end ?? ox!.start).getTime()).toBeGreaterThan(NOW.getTime());
  });

  it("все события помечены demo:true (нет подтверждённых дат)", () => {
    expect(eventsFor(kz11, NOW).every((e) => e.demo)).toBe(true);
  });
});
