// Роль: ROADMAP (ветка B)

import type { RoadmapTask } from "../store/types";

/** Ближайшая невыполненная задача (или null). */
export function nextStep(tasks: RoadmapTask[]): RoadmapTask | null {
  const open = tasks
    .filter((t) => !t.done)
    .sort(
      (a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999") || a.id.localeCompare(b.id),
    );
  return open[0] ?? null;
}
