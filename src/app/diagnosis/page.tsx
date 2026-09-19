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
    <main className="flex flex-col gap-6">
      <PathIndicator step={3} label="Диагностика" />
      <h2 className="font-serif text-5xl tracking-[-0.01em]">Разбор профиля</h2>
      <Card className="rise">
        <h3 className="text-sm font-semibold tracking-tight">Сильные стороны</h3>
        <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">{d.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
      </Card>
      <Card className="rise">
        <h3 className="text-sm font-semibold tracking-tight">Ограничения</h3>
        <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-muted">{d.limits.map((s) => <li key={s}>{s}</li>)}</ul>
      </Card>
      <Card className="rise flex items-center justify-center border-ink py-8 text-center">
        <p className="max-w-md text-lg font-semibold tracking-tight">{d.goal}</p>
      </Card>
      <Link href="/recommendations"><Button full>К рекомендациям →</Button></Link>
    </main>
  );
}