'use client';
import Link from 'next/link';
import { Button, Card, PathIndicator } from '@/components/ui';
import { useHydrated, useAppStore } from '@/lib/store';
import { CATALOG } from '@/data/catalog';
import { recommend } from '@/lib/engine';
import { diagnosis } from '@/lib/text';

export default function DiagnosisPage() {
  const hydrated = useHydrated();
  const profile = useAppStore((s) => s.profile);
  if (!hydrated) return <p className="text-center text-sm text-muted">Загрузка…</p>;
  const now = new Date();
  const recs = recommend(profile, CATALOG, now);
  const d = diagnosis(profile, recs);
  return (
    <main className="flex flex-col gap-4">
      <PathIndicator step={3} label="Диагностика" />
      <h2 className="text-center text-2xl font-extrabold tracking-tight">🔍 Разбор профиля</h2>
      <Card className="rise border-emerald-400/20" >
        <h3 className="text-sm font-bold text-emerald-300">💪 Сильные стороны</h3>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed">{d.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
      </Card>
      <Card className="rise border-amber-400/20" >
        <h3 className="text-sm font-bold text-amber-300">🎯 Ограничения</h3>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed text-muted">{d.limits.map((s) => <li key={s}>{s}</li>)}</ul>
      </Card>
      <Card className="rise btn-glow !border-violet-400/30" ><p className="text-center font-semibold">{d.goal}</p></Card>
      <Link href="/recommendations"><Button>К рекомендациям →</Button></Link>
    </main>
  );
}
