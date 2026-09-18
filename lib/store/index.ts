"use client";

// Роль: STORE (ветка B)
// Zustand + persist. Персистим только profile, goalProgramId и done-статусы задач.
// Рекомендации и roadmap не персистятся — пересчитываются из профиля и цели.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Profile, RoadmapTask } from "./types";
import { EMPTY_PROFILE } from "./types";

export { EMPTY_PROFILE } from "./types";

export interface StoreState {
  profile: Profile;
  goalProgramId: string | null;
  tasks: RoadmapTask[];
  doneTasks: Record<string, boolean>;
  setProfile: (patch: Partial<Profile>) => void;
  setGoal: (id: string | null) => void;
  setTasks: (tasks: RoadmapTask[]) => void;
  toggleTask: (id: string) => void;
  reset: () => void;
}

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useAppStore = create<StoreState>()(
  persist(
    (set) => ({
      profile: EMPTY_PROFILE,
      goalProgramId: null,
      tasks: [],
      doneTasks: {},
      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
      setGoal: (id) => set({ goalProgramId: id }),
      setTasks: (tasks) =>
        set((s) => ({
          tasks: tasks.map((t) => ({ ...t, done: s.doneTasks[t.id] ?? t.done })),
        })),
      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
          doneTasks: { ...s.doneTasks, [id]: !s.doneTasks[id] },
        })),
      reset: () =>
        set({ profile: EMPTY_PROFILE, goalProgramId: null, tasks: [], doneTasks: {} }),
    }),
    {
      name: "route-v1",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : noopStorage,
      ),
      // done-статусы выводим из tasks в момент записи
      partialize: (s) => ({
        profile: s.profile,
        goalProgramId: s.goalProgramId,
        doneTasks: {
          ...s.doneTasks,
          ...Object.fromEntries(s.tasks.filter((t) => t.done).map((t) => [t.id, true])),
        },
      }),
    },
  ),
);
