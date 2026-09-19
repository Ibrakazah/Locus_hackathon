import type { RankChange, Recommendation } from './types';

export function diffRankings(
  before: Recommendation[],
  after: Recommendation[],
  changed?: string,
): RankChange[] {
  const bi = new Map(before.map((r, i) => [r.programId, i]));
  const ai = new Map(after.map((r, i) => [r.programId, i]));
  const ids = new Set([...bi.keys(), ...ai.keys()]);
  const out: RankChange[] = [];
  for (const id of ids) {
    const from = bi.get(id) ?? -1;
    const to = ai.get(id) ?? -1;
    if (from === to) continue;
    out.push({ programId: id, from, to, reason: reasonFor(changed) });
  }
  out.sort((a, b) => a.to - b.to);
  return out;
}

function reasonFor(changed?: string): string {
  if (!changed) return 'Порядок изменился из-за новых вводных';
  if (changed.includes('budget')) return 'Бюджет вырос — программа стала проходить по цене';
  if (changed.includes('priority')) return 'Приоритет изменился — веса сортировки пересчитаны';
  if (changed.includes('ent') || changed.includes('sat') || changed.includes('ielts'))
    return 'Балл экзамена изменился — уровень допуска пересчитан';
  if (changed.includes('route') || changed.includes('countr')) return 'Маршрут изменился — пул программ другой';
  return `Изменено поле ${changed} — рекомендации пересчитаны`;
}
