import { describe, it, expect } from "vitest";
import { diffRankings } from "./rankings";
import type { Recommendation } from "../store/types";

function rec(programId: string, sortScore: number): Recommendation {
  return {
    programId,
    admissionFit: "fits",
    reasons: [],
    gaps: [],
    sortScore,
    reach: false,
  };
}

const before = [rec("a", 0.9), rec("b", 0.8), rec("c", 0.7)];
const after = [rec("b", 0.9), rec("a", 0.8), rec("c", 0.7)];

describe("diffRankings", () => {
  it("фиксирует перемещение с from/to", () => {
    const changes = diffRankings(before, after, { funding: "contract_ok" });
    const a = changes.find((c) => c.programId === "a");
    expect(a).toMatchObject({ from: 0, to: 1 });
    expect(a!.reason).toContain("финанс");
  });

  it("выпавшая программа получает to: -1", () => {
    const changes = diffRankings(before, [before[0], before[2]], { fields: ["it"] });
    const b = changes.find((c) => c.programId === "b");
    expect(b).toMatchObject({ from: 1, to: -1 });
  });

  it("новая программа получает from: -1", () => {
    const changes = diffRankings(before, [...before, rec("d", 0.5)], { priority: "cost" });
    const d = changes.find((c) => c.programId === "d");
    expect(d).toMatchObject({ from: -1, to: 3 });
  });

  it("без changed — обобщённая причина", () => {
    const changes = diffRankings(before, after);
    expect(changes[0].reason).toBe("вводные изменились");
  });

  it("без изменений порядка — пусто", () => {
    expect(diffRankings(before, before, { funding: "contract_ok" })).toEqual([]);
  });
});
