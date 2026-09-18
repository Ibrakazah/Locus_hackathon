import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore, EMPTY_PROFILE } from "./index";

beforeEach(() => useAppStore.getState().reset());

describe("useAppStore", () => {
  it("setProfile мержит частичный профиль", () => {
    useAppStore.getState().setProfile({ grade: 11 });
    expect(useAppStore.getState().profile.grade).toBe(11);
    expect(useAppStore.getState().profile.route).toBe("kz");
  });

  it("setProfile не затирает вложенные kz/abroad", () => {
    useAppStore.getState().setProfile({
      kz: { entProfile: "math-physics", interestedInNu: true },
      abroad: { countries: ["uk"], gpa: 4.4 },
    });
    useAppStore.getState().setProfile({ kz: { gpa: 4.7 } });
    useAppStore.getState().setProfile({ abroad: { budgetUsd: "5to15k" } });

    const { kz, abroad } = useAppStore.getState().profile;
    expect(kz).toMatchObject({ entProfile: "math-physics", interestedInNu: true, gpa: 4.7 });
    expect(abroad).toMatchObject({ countries: ["uk"], gpa: 4.4, budgetUsd: "5to15k" });
  });

  it("setGoal сохраняет цель", () => {
    useAppStore.getState().setGoal("p1");
    expect(useAppStore.getState().goalProgramId).toBe("p1");
  });

  it("toggleTask переключает done у задачи по id", () => {
    useAppStore.setState({
      tasks: [{ id: "p1:score_gap", title: "x", done: false, kind: "study" }],
    });
    useAppStore.getState().toggleTask("p1:score_gap");
    expect(useAppStore.getState().tasks[0].done).toBe(true);
    expect(useAppStore.getState().doneTasks["p1:score_gap"]).toBe(true);
    useAppStore.getState().toggleTask("p1:score_gap");
    expect(useAppStore.getState().tasks[0].done).toBe(false);
  });

  it("reset возвращает дефолты", () => {
    useAppStore.getState().setGoal("p1");
    useAppStore.getState().setProfile({ grade: 11 });
    useAppStore.getState().reset();
    expect(useAppStore.getState().goalProgramId).toBeNull();
    expect(useAppStore.getState().profile).toEqual(EMPTY_PROFILE);
    expect(useAppStore.getState().tasks).toEqual([]);
  });
});
