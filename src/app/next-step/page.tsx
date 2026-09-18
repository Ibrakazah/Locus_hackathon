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
  if (!hydrated) return <p>Загрузка…</p>;
  const pct = tasks.length ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100) : 0;

  return (
    <main className="flex flex-col gap-4">
      <PathIndicator step={7} label="Следующее действие" />
      <Card className="border-[4px] bg-mint-soft">
        <p className="font-display text-xs font-extrabold uppercase text-mint-deep">Сделай сейчас</p>
        {step ? (
          <TaskCard title={step.title} deadline={step.deadline} done={step.done} source={step.source} onToggle={() => toggleTask(step.id)} />
        ) : (
          <p className="font-bold">Всё выполнено 🎉</p>
        )}
      </Card>
      <div className="border-[3px] border-ink bg-paper p-3">
        <p className="font-display text-xs font-extrabold uppercase">Прогресс {pct}%</p>
        <div className="mt-1 h-3 border border-ink bg-cream"><div className="h-full bg-mint" style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="flex flex-col gap-2">
        <Link href="/roadmap"><Button variant="ghost">← Весь план</Button></Link>
        <Link href="/"><Button>На главную</Button></Link>
        <button onClick={reset} className="text-xs font-bold uppercase text-smoke">Сбросить всё</button>
      </div>
    </main>
  );
}
