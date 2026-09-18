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
  if (!hydrated) return <p>Загрузка…</p>;
  const open = tasks.filter((t) => !t.done).length;

  return (
    <main className="flex flex-col gap-4">
      <PathIndicator step={6} label="Roadmap" />
      <p className="text-sm font-bold">Открыто задач: {open} из {tasks.length}. Галочки переживают пересчёт и перезагрузку.</p>
      {tasks.map((t) => (
        <TaskCard key={t.id} title={t.title} deadline={t.deadline} done={t.done} source={t.source} onToggle={() => toggleTask(t.id)} />
      ))}
      <Link href="/next-step"><Button>Следующее действие →</Button></Link>
    </main>
  );
}
