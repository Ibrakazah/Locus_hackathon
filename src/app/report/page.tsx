'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, PathIndicator } from '@/components/ui';
import { useAppStore, useHydrated } from '@/lib/store';
import { CATALOG, getProgram, getUniversity } from '@/data/catalog';
import { recommend } from '@/lib/engine';
import { buildRoadmap, nextStep } from '@/lib/roadmap';
import { diagnosis } from '@/lib/text';
import { buildReportText } from '@/lib/report';

const FIT_LABEL: Record<string, string> = {
  fits: 'проходишь порог',
  close: 'близко к порогу',
  fails: 'пока не проходишь',
};

export default function ReportPage() {
  const hydrated = useHydrated();
  const profile = useAppStore((s) => s.profile);
  const goalId = useAppStore((s) => s.goalProgramId);
  const done = useAppStore((s) => s.done);
  const reset = useAppStore((s) => s.reset);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const data = useMemo(() => {
    if (!hydrated) return null;
    const now = new Date();
    const recs = recommend(profile, CATALOG, now);
    const goal = goalId ? getProgram(goalId) : undefined;
    const prev = Object.entries(done).filter(([, v]) => v).map(([id]) => ({
      id, programId: null as string | null, title: '', deadline: null as string | null, kind: 'info' as const, done: true, source: '',
    }));
    const tasks = buildRoadmap({ profile, goal, recs, prev, now });
    return { recs, tasks, next: nextStep(tasks) };
  }, [hydrated, profile, goalId, done]);
  if (!hydrated || !data) return <p className="text-center text-sm text-muted">Загрузка…</p>;

  const { recs, tasks, next } = data;
  const d = diagnosis(profile, recs);
  const top = recs.slice(0, 3);
  const doneCount = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const goalProgram = goalId ? getProgram(goalId) : undefined;
  const soon = [...tasks].filter((t) => !t.done && t.deadline).sort((a, b) => a.deadline! > b.deadline! ? 1 : -1).slice(0, 3);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildReportText({ profile, recs, tasks, goalProgramId: goalId }));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="flex flex-col gap-10">
      <PathIndicator step={8} label="Итог: финальный отчёт" />

      <section className="flex flex-col items-start gap-6 py-10">
        <span className="rounded-full border border-line bg-paper px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          ИИ-отчёт
        </span>
        <h2 className="font-serif text-6xl leading-[0.95] tracking-[-0.02em] sm:text-7xl">
          Твой маршрут <span className="italic">собран</span>
        </h2>
        <p className="max-w-md text-base leading-relaxed text-muted">
          Единый итог: диагноз, куда подходишь, что делать следующим шагом. Всё по твоей анкете, без выдуманных гарантий.
        </p>
        <Button className="mt-2" onClick={copy}>{copied ? 'Скопировано ✓' : 'Копировать отчёт'}</Button>
      </section>

      <Card>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Цель маршрута</h3>
        <p className="mt-2 text-xl font-semibold tracking-tight">
          {goalProgram ? `${getUniversity(goalProgram.universityId)?.name} — ${goalProgram.title}` : recs[0] ? `${getUniversity(recs[0].universityId)?.name} — ${CATALOG.find((x) => x.id === recs[0].programId)?.title ?? 'лидер анкеты'}` : 'не выбрана'}
        </p>
        <p className="mt-1 text-sm text-muted">{d.goal}</p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Сильные стороны</h3>
          <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">{d.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
        </Card>
        <Card>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Ограничения</h3>
          <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-muted">{d.limits.map((s) => <li key={s}>{s}</li>)}</ul>
        </Card>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Топ-3 для тебя</h3>
          <span className="font-mono text-[11px] text-faint">{top.length} программ</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {top.map((r, i) => {
            const p = CATALOG.find((x) => x.id === r.programId)!;
            const u = getUniversity(r.universityId)!;
            return (
              <Card key={r.programId} className="rise flex flex-col gap-4" >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-2xl italic">{['I', 'II', 'III'][i]}</span>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Badge kind={r.matchLevel} />
                    {r.reach && <Badge kind="reach" />}
                  </div>
                </div>
                <div>
                  <p className="text-base font-semibold tracking-tight">{u.name}</p>
                  <p className="mt-0.5 text-sm text-muted">{p.title}</p>
                </div>
                <p className="mt-auto text-xs leading-relaxed text-muted">
                  {r.gaps.length ? `Блокеры: ${r.gaps.length}` : 'Блокеров нет — осталась подача'}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      <Card>
        <div className="flex items-baseline justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Прогресс по плану</h3>
          <span className="font-mono text-[11px] text-faint">{doneCount} из {tasks.length} · {pct}%</span>
        </div>
        <div className="mt-3 h-px w-full bg-line">
          <div className="h-px bg-ink transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <ul className="mt-4 flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted">
          {soon.map((t) => (
            <li key={t.id}>{t.title}{t.deadline ? ` — до ${t.deadline.slice(0, 10)}` : ''}</li>
          ))}
        </ul>
      </Card>

      {next && (
        <Card className="flex items-center justify-between gap-4 border-ink py-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Следующий шаг</p>
            <p className="mt-1 text-lg font-semibold tracking-tight">{next.title}{next.deadline ? ` · до ${next.deadline.slice(0, 10)}` : ''}</p>
          </div>
          <span className="font-mono text-2xl text-faint">→</span>
        </Card>
      )}

      <Card>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Честно</h3>
        <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-muted">
          <li>Порог — это минимум для участия в конкурсе, а не гарантия гранта.</li>
          <li>Факты без источника помечены [демо-данные] — проверь перед подачей.</li>
          <li>Это ориентир для разговора с приёмной комиссией, а не официальный документ.</li>
        </ul>
      </Card>

      <div className="flex flex-col gap-2">
        <Button full onClick={() => { reset(); router.push('/'); }}>Начать заново</Button>
        <Link href="/next-step"><Button full variant="ghost">← Следующее действие</Button></Link>
        <Link href="/"><Button full variant="ghost">На главную</Button></Link>
      </div>
    </main>
  );
}