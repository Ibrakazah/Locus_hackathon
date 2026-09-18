// Роль: TEXT (ветка B)
// Детерминированные шаблоны объяснений (в т.ч. fallback для app/api/explain).

import type { Recommendation } from "../store/types";

export function templateExplanation(rec: Recommendation): string {
  const parts: string[] = [...rec.reasons];
  if (rec.gaps.length) {
    parts.push(`Что улучшить: ${rec.gaps.map((g) => g.description).join("; ")}`);
  }
  if (rec.grantNote) parts.push(rec.grantNote);
  return parts.join(" ");
}
