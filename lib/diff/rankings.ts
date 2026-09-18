// Роль: DIFF (ветка B)
// Сравнение двух ранжирований рекомендаций: что поднялось, что упало и почему.

import type { Profile, RankChange, Recommendation } from "../store/types";

function reasonFor(changed?: Partial<Profile>): string {
  if (!changed) return "вводные изменились";
  if (changed.funding) return "изменился тип финансирования";
  if (changed.exams) return "изменились результаты экзаменов";
  if (changed.fields) return "изменилось направление";
  if (changed.abroad?.budgetUsd) return "изменился бюджет";
  if (changed.priority) return "изменился приоритет";
  return "вводные изменились";
}

export function diffRankings(
  before: Recommendation[],
  after: Recommendation[],
  changed?: Partial<Profile>,
): RankChange[] {
  const beforeRank = new Map(before.map((r, i) => [r.programId, i]));
  const afterRank = new Map(after.map((r, i) => [r.programId, i]));
  const reason = reasonFor(changed);
  const out: RankChange[] = [];

  for (const [programId, to] of afterRank) {
    const from = beforeRank.get(programId) ?? -1;
    if (from !== to) out.push({ programId, from, to, reason });
  }
  for (const [programId, from] of beforeRank) {
    if (!afterRank.has(programId)) out.push({ programId, from, to: -1, reason });
  }

  return out;
}
