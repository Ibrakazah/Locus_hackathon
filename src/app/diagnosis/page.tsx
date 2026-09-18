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
  if (!hydrated) return <p>Загрузка…</p>;
  const now = new Date();
  const recs = recommend(profile, CATALOG, now);
  const d = diagnosis(profile, recs);
  return (
    <main className="flex flex-col gap-4">
      <PathIndicator step={3} label="Диагностика" />
      <Card>
        <h2 className="font-display font-extrabold uppercase">Сильные стороны</h2>
        <ul className="mt-2 list-disc pl-5 text-sm font-medium">{d.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
      </Card>
      <Card>
        <h2 className="font-display font-extrabold uppercase">Ограничения</h2>
        <ul className="mt-2 list-disc pl-5 text-sm font-medium">{d.limits.map((s) => <li key={s}>{s}</li>)}</ul>
      </Card>
      <Card><p className="font-bold">{d.goal}</p></Card>
      <Link href="/recommendations"><Button>К рекомендациям →</Button></Link>
    </main>
  );
}
