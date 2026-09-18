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
    <main className="flex flex-col gap-5">
      <PathIndicator step={7} label="Следующее действие" />
      <Card className="rise btn-glow !border-violet-400/40 py-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-300">⚡ Сделай сейчас</p>
        {step ? (
          <div className="mt-3 flex flex-col gap-4">
            <h2 className="mx-auto max-w-md text-2xl font-extrabold leading-tight tracking-tight">{step.title}</h2>
            <TaskCard title={step.deadline ? `Дедлайн: ${step.deadline.slice(0, 10)}` : step.source} deadline={null} done={step.done} source={step.source} onToggle={() => toggleTask(step.id)} />
          </div>
        ) : (
          <p className="mt-3 text-2xl font-extrabold">Всё выполнено 🎉</p>
        )}
      </Card>
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Прогресс</span><span className="font-bold text-violet-300">{pct}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Link href="/roadmap"><Button variant="ghost">← Весь план</Button></Link>
        <Link href="/"><Button>На главную</Button></Link>
        <button onClick={reset} className="text-xs text-faint">Сбросить всё</button>
      </div>
    </main>
  );
}
