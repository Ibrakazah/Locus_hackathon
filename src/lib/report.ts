import type { Profile, Recommendation, RoadmapTask } from './types';
import { CATALOG, getUniversity } from '@/data/catalog';
import { diagnosis } from './text';
import { nextStep } from './roadmap';

export interface ReportArgs {
  profile: Profile;
  recs: Recommendation[];
  tasks: RoadmapTask[];
  goalProgramId: string | null;
}

const FIT_LABEL: Record<Recommendation['matchLevel'], string> = {
  fits: 'проходишь порог',
  close: 'близко к порогу',
  fails: 'пока не проходишь',
};

export function buildReportText({ profile, recs, tasks, goalProgramId }: ReportArgs): string {
  const d = diagnosis(profile, recs);
  const top = recs.slice(0, 3);
  const goal = goalProgramId ?? top[0]?.programId ?? null;
  const goalName = goal ? (CATALOG.find((p) => p.id === goal)?.title ?? goal) : null;
  const done = tasks.filter((t) => t.done).length;
  const next = nextStep(tasks);
  const lines: string[] = [];

  lines.push('ПЕРСОНАЛЬНЫЙ МАРШРУТ ПОСТУПЛЕНИЯ');
  lines.push('Собрано автоматически на основе анкеты и движка рекомендаций.');
  lines.push('');
  lines.push(`ЦЕЛЬ: ${goalName ?? 'пока не выбрана'}`);
  lines.push('');
  lines.push('1. ДИАГНОЗ');
  if (d.strengths.length) lines.push(...d.strengths.map((s) => `  + ${s}`));
  if (d.limits.length) lines.push(...d.limits.map((s) => `  - ${s}`));
  lines.push('');
  lines.push('2. ТОП-3 ВАРИАНТА');
  top.forEach((r, i) => {
    const p = CATALOG.find((x) => x.id === r.programId);
    const u = getUniversity(r.universityId);
    const name = u ? `${u.name} — ${p?.title ?? r.programId}` : r.programId;
    lines.push(`  ${i + 1}. ${name}. [${FIT_LABEL[r.matchLevel]}]`);
    lines.push(`     причины: ${r.reasons.join('; ')}`);
    if (r.gaps.length) lines.push(`     блокеры: ${r.gaps.map((g) => g.description).join('; ')}`);
    if (!r.gaps.length) lines.push(`     блокеров нет: ${r.grantNote}`);
  });
  lines.push('');
  lines.push(`3. ПЛАН: выполнено ${done} из ${tasks.length}`);
  for (const t of tasks.slice(0, 8)) {
    lines.push(`  ${t.done ? '[x]' : '[ ]'} ${t.title}${t.deadline ? ` — до ${t.deadline.slice(0, 10)}` : ''}`);
  }
  lines.push('');
  if (next) {
    lines.push('СЛЕДУЮЩИЙ ШАГ');
    lines.push(`  ${next.title}${next.deadline ? ` — до ${next.deadline.slice(0, 10)}` : ''}`);
    lines.push('');
  }
  lines.push('ОГОВОРКИ');
  lines.push('  - Порог — это минимум для участия, а не гарантия гранта.');
  lines.push('  - Факты без источника помечены [демо-данные] — проверь перед подачей.');
  lines.push('  - Это ориентир для разговора с приёмной комиссией, а не официальный документ.');
  return lines.join('\n');
}