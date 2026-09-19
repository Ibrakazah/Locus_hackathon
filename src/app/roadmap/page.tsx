'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Button, PathIndicator, TaskCard } from '@/components/ui';
import { useAppStore, useHydrated } from '@/lib/store';
import { CATALOG, getProgram } from '@/data/catalog';
import { recommend } from '@/lib/engine';
import { buildRoadmap } from '@/lib/roadmap';

export default function RoadmapPage() {
  const hydrated = useHydrated();
  const profile = useAppStore((s) => s.profile);
  const goalId = useAppStore((s) => s.goalProgramId);
  const done = useAppStore((s) => s.done);
  const toggleTask = useAppStore((s) => s.toggleTask);
  const tasks = useMemo(() => {
    if (!hydrated) return [];
    const now = new Date();
    const recs = recommend(profile, CATALOG, now);
    const goal = goalId ? getProgram(goalId) : undefined;
    const prev = Object.entries(done).filter(([, v]) => v).map(([id]) => ({
      id, programId: null as string | null, title: '', deadline: null as string | null, kind: 'info' as const, done: true, source: '',
    }));
    return buildRoadmap({ profile, goal, recs, prev, now });
  }, [hydrated, profile, goalId, done]);
  if (!hydrated) return <p className="text-center text-sm text-muted">Загрузка…</p>;
  const open = tasks.filter((t) => !t.done).length;
  const pct = tasks.length ? Math.round(((tasks.length - open) / tasks.length) * 100) : 0;

  return (
    <main className="flex flex-col gap-8">
      <PathIndicator step={6} label="Roadmap" />
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-5xl tracking-[-0.01em]">Твой план</h2>
        <span className="font-mono text-[11px] text-faint">{pct}%</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">Открыто задач: {open} из {tasks.length}</span>
        <div className="h-px flex-1 bg-line">
          <div className="h-px bg-ink transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {tasks.map((t, i) => (
          <div key={t.id} style={{ ['--i' as string]: Math.min(i, 6) }} className="rise">
            <TaskCard title={t.title} deadline={t.deadline} done={t.done} source={t.source} onToggle={() => toggleTask(t.id)} />
          </div>
        ))}
      </div>
      <Link href="/next-step"><Button full>Следующее действие →</Button></Link>
    </main>
  );
}