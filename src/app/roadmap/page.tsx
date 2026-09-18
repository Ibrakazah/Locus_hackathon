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
    <main className="flex flex-col gap-5">
      <PathIndicator step={6} label="Roadmap" />
      <h2 className="text-center text-2xl font-extrabold tracking-tight">🗺️ Твой <span className="grad-text">план</span></h2>
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Открыто задач: {open} из {tasks.length}</span>
          <span className="font-bold text-violet-300">{pct}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {tasks.map((t, i) => (
          <div key={t.id} style={{ ['--i' as string]: Math.min(i, 6) }} className="rise">
            <TaskCard title={t.title} deadline={t.deadline} done={t.done} source={t.source} onToggle={() => toggleTask(t.id)} />
          </div>
        ))}
      </div>
      <Link href="/next-step"><Button>Следующее действие ✨ →</Button></Link>
    </main>
  );
}
