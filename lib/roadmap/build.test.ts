import { describe, it, expect } from "vitest";
import { buildRoadmap } from "./build";
import { nextStep } from "./nextStep";
import type { Profile, Recommendation } from "../store/types";

const NOW = new Date("2026-09-19T12:00:00+06:00");

const T1: Profile = {
  route: "kz",
  grade: 11,
  fields: ["it"],
  funding: "grant_only",
  exams: { ent: { status: "taken", score: 96 } },
  kz: { entProfile: "math-physics" },
};

const goal: Recommendation = {
  programId: "p1",
  admissionFit: "fits",
  reach: false,
  reasons: ["подходит"],
  sortScore: 0.9,
  gaps: [{ type: "score_gap", description: "+3 до порога" }],
};

describe("buildRoadmap", () => {
  it("gap → задача с детерминированным id", () => {
    const tasks = buildRoadmap({ profile: T1, goal, prev: [], now: NOW });
    expect(tasks.some((t) => t.id === "p1:score_gap")).toBe(true);
  });

  it("дубликаты gap одного типа не дают дублей id", () => {
    const dup: Recommendation = {
      programId: "p1",
      admissionFit: "close",
      reach: false,
      reasons: [],
      sortScore: 0.5,
      gaps: [
        { type: "score_gap", description: "a" },
        { type: "score_gap", description: "b" },
      ],
    };
    const tasks = buildRoadmap({ profile: T1, goal: dup, prev: [], now: NOW });
    const ids = tasks.filter((t) => t.id === "p1:score_gap");
    expect(ids).toHaveLength(1);
  });

  it("11 класс в сентябре: нет задачи «конкурс гранта», есть подготовка", () => {
    const tasks = buildRoadmap({ profile: T1, goal, prev: [], now: NOW });
    expect(tasks.some((t) => t.kind === "grant")).toBe(false);
    expect(tasks.some((t) => t.kind === "study")).toBe(true);
  });

  it("всегда есть базовые задачи: экзамен, документы, подача", () => {
    const tasks = buildRoadmap({ profile: T1, goal, prev: [], now: NOW });
    const ids = tasks.map((t) => t.id);
    expect(ids).toContain("base:exam_registration");
    expect(ids).toContain("base:documents");
    expect(ids).toContain("base:application");
  });

  it("идемпотентность: второй прогон с prev сохраняет done и id", () => {
    const t1 = buildRoadmap({ profile: T1, goal, prev: [], now: NOW });
    const done = t1.map((t) => ({ ...t, done: true }));
    const t2 = buildRoadmap({ profile: T1, goal, prev: done, now: NOW });
    expect(t2.every((t) => t.done)).toBe(true);
    expect(t2.map((t) => t.id).sort()).toEqual(t1.map((t) => t.id).sort());
  });

  it("сортировка по deadline, задачи без срока в конце", () => {
    const tasks = buildRoadmap({ profile: T1, goal, prev: [], now: NOW });
    const keys = tasks.map((t) => t.deadline ?? "9999");
    expect([...keys].sort()).toEqual(keys);
  });

  it("nextStep = первая невыполненная", () => {
    const tasks = buildRoadmap({ profile: T1, goal, prev: [], now: NOW });
    const step = nextStep(tasks);
    expect(step).not.toBeNull();
    expect(step!.done).toBe(false);
  });

  it("NIS + UK до 15.10.2026: есть deadline_alert UCAS", () => {
    const nisUk: Profile = {
      route: "abroad",
      grade: 11,
      fields: [],
      funding: "grant_or_contract",
      isNis: true,
      exams: {},
      abroad: { countries: ["uk"] },
    };
    const tasks = buildRoadmap({ profile: nisUk, goal: null, prev: [], now: NOW });
    const alert = tasks.find((t) => t.kind === "application" && t.alert);
    expect(alert).toBeDefined();
    expect(alert!.deadline).toBe("2026-10-15");
  });
});
