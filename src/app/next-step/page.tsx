'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Button, Card, PathIndicator, TaskCard } from '@/components/ui';
import { useAppStore, useHydrated } from '@/lib/store';
import { CATALOG, getProgram } from '@/data/catalog';
import { recommend } from '@/lib/engine';
import { buildRoadmap, nextStep } from '@/lib/roadmap';

export default function NextStepPage() {
  const hydrated = useHydrated();
  const profile = useAppStore((s) => s.profile);
  const goalId = useAppStore((s) => s.goalProgramId);
  const done = useAppStore((s) => s.done);
  const toggleTask = useAppStore((s) => s.toggleTask);
  const reset = useAppStore((s) => s.reset);
  const { tasks, step } = useMemo(() => {
    if (!hydrated) return { tasks: [], step: null };
    const now = new Date();
    const recs = recommend(profile, CATALOG, now);
    const goal = goalId ? getProgram(goalId) : undefined;
    const prev = Object.entries(done).filter(([, v]) => v).map(([id]) => ({
      id, programId: null as string | null, title: '', deadline: null as string | null, kind: 'info' as const, done: true, source: '',
    }));
    const t = buildRoadmap({ profile, goal, recs, prev, now });
    return { tasks: t, step: nextStep(t) };
  }, [hydrated, profile, goalId, done]);
  if (!hydrated) return <p className="text-center text-sm text-muted">Загрузка…</p>;
  const pct = tasks.length ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100) : 0;

  return (
    <main className="flex flex-col gap-8">
      <PathIndicator step={7} label="Следующее действие" />
      <Card className="rise flex flex-col items-center gap-4 border-ink py-14 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">Сделай сейчас</p>
        {step ? (
          <>
            <h2 className="max-w-md font-serif text-4xl leading-tight tracking-[-0.01em]">{step.title}</h2>
            <div className="w-full max-w-md">
              <TaskCard title={step.deadline ? `Дедлайн: ${step.deadline.slice(0, 10)}` : step.source} deadline={null} done={step.done} source={step.source} onToggle={() => toggleTask(step.id)} />
            </div>
          </>
        ) : (
          <h2 className="font-serif text-4xl tracking-[-0.01em]">Всё выполнено</h2>
        )}
      </Card>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">Прогресс · {pct}%</span>
        <div className="h-px flex-1 bg-line">
          <div className="h-px bg-ink transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Link href="/report"><Button full>Итоговый отчёт →</Button></Link>
        <Link href="/roadmap"><Button full variant="ghost">← Весь план</Button></Link>
        <button onClick={reset} className="text-xs text-faint">Сбросить всё</button>
      </div>
    </main>
  );
}