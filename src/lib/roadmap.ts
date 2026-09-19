import type { Profile, Program, Recommendation, RoadmapTask, TaskKind } from './types';
import { CALENDAR, daysUntil } from '@/data/calendar';

const LEAD_DAYS = { exam: 60, documents: 30, application: 14 } as const;

function iso(date: Date): string { return date.toISOString(); }
function backFrom(closesAt: string | null, days: number, now: Date): string {
  if (!closesAt) {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return iso(d);
  }
  const d = new Date(new Date(closesAt).getTime() - days * 86400000);
  return iso(d);
}

const GAP_TASK: Record<string, { title: (g: string) => string; kind: TaskKind }> = {
  score_gap: { title: (d) => `Подтянуть балл: ${d}`, kind: 'exam' },
  exam_planned: { title: (d) => `Записаться на экзамен: ${d}`, kind: 'exam' },
  subject_mismatch: { title: (d) => `Сменить комбинацию или направление: ${d}`, kind: 'info' as TaskKind },
  missing_exam: { title: (d) => `${d}`, kind: 'exam' },
  funding_gap: { title: (d) => `${d}`, kind: 'finance' as TaskKind },
  budget_gap: { title: (d) => `${d}`, kind: 'finance' as TaskKind },
  activity_gap: { title: (d) => `${d}`, kind: 'info' as TaskKind },
  timeline_ok: { title: (d) => `${d}`, kind: 'info' as TaskKind },
  deadline_alert: { title: (d) => `Срочно: ${d}`, kind: 'application' },
};

export interface BuildArgs {
  profile: Profile;
  goal: Program | undefined;
  recs: Recommendation[];
  prev: RoadmapTask[];
  now: Date;
}

export function roadmapMode(profile: Profile, now: Date): 'preparation' | 'active' {
  const m = now.getMonth() + 1;
  if (profile.grade === 11 && (m >= 9 || m <= 4)) return 'preparation';
  return 'active';
}

export function buildRoadmap({ profile, goal, recs, prev, now }: BuildArgs): RoadmapTask[] {
  const doneById = new Map(prev.filter((t) => t.done).map((t) => [t.id, true]));
  const tasks: RoadmapTask[] = [];
  const goalRec = goal ? recs.find((r) => r.programId === goal.id) : undefined;
  const scope = goalRec ? [goalRec] : recs.slice(0, 3);

  for (const r of scope) {
    for (const g of r.gaps) {
      const meta = GAP_TASK[g.type] ?? { title: (d: string) => d, kind: 'info' as TaskKind };
      tasks.push({
        id: g.roadmapTaskId,
        programId: r.programId,
        title: meta.title(g.description),
        deadline: backFrom(goal?.closesAt ?? null, LEAD_DAYS[meta.kind === 'info' || meta.kind === 'finance' ? 'documents' : meta.kind] ?? 30, now),
        kind: meta.kind,
        done: false,
        source: g.source ?? '[демо-данные]',
      });
    }
  }

  // базовые задачи
  const closes = goal?.closesAt ?? null;
  tasks.push(
    { id: `base:apply:${goal?.id ?? 'any'}`, programId: goal?.id ?? null, title: goal ? `Подать заявку: ${goal.title}` : 'Подать заявки в топ-3', deadline: backFrom(closes, LEAD_DAYS.application, now), kind: 'application', done: false, source: goal?.source ?? '[демо-данные]' },
    { id: 'base:documents', programId: null, title: 'Собрать документы: удостоверение, фото, аттестат', deadline: backFrom(closes, LEAD_DAYS.documents, now), kind: 'documents', done: false, source: '[демо-данные]' },
  );
  if (profile.grade === 11 && roadmapMode(profile, now) === 'preparation') {
    tasks.push({ id: 'base:trial-ent', programId: null, title: 'Пробный ЕНТ (январь 2027) — без конкурса гранта до мая', deadline: CALENDAR.find((c) => c.id === 'ent-jan')!.date, kind: 'exam', done: false, source: 'testcenter.kz' });
  }
  // NU-алерт: открытие в будущем
  if (profile.interestedInNu) {
    const opens = CALENDAR.find((c) => c.id === 'nu-opens')!;
    const d = daysUntil(now, opens.date);
    if (d > 0) {
      tasks.push({ id: 'base:nu-opens', programId: null, title: `NU открывается через ${d} дн. — подготовить IELTS/GPA`, deadline: opens.date, kind: 'application', done: false, source: opens.source });
    }
  }
  // UCAS-алерт
  if (profile.isNis && (profile.abroadCountries ?? []).includes('UK')) {
    const ucas = CALENDAR.find((c) => c.id === 'ucas-oxbridge')!;
    const d = daysUntil(now, ucas.date);
    if (d > 0 && d <= 60) {
      tasks.push({ id: 'base:ucas', programId: null, title: `UCAS Oxbridge: ${ucas.date.slice(0, 10)} — осталось ${d} дн.: Personal Statement`, deadline: ucas.date, kind: 'application', done: false, source: ucas.source });
    }
  }

  // prev: выполненные сохраняются по id; дедуп
  const seen = new Set<string>();
  const out = tasks.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)))
    .map((t) => ({ ...t, done: doneById.get(t.id) ?? false }));
  out.sort((a, b) => {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });
  return out;
}

export function nextStep(tasks: RoadmapTask[]): RoadmapTask | null {
  const open = tasks.filter((t) => !t.done && t.deadline).sort((a, b) => (a.deadline! > b.deadline! ? 1 : -1));
  return open[0] ?? tasks.find((t) => !t.done) ?? null;
}
