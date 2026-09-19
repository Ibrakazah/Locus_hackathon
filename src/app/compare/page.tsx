'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { Badge, Button, Card, PathIndicator } from '@/components/ui';
import { useAppStore, useHydrated } from '@/lib/store';
import { CATALOG, getProgram, getUniversity } from '@/data/catalog';
import { recommend } from '@/lib/engine';

function rowsFor(ids: string[]): { label: string; vals: string[] }[] {
  const ps = ids.map((id) => getProgram(id)!);
  const rows: { label: string; vals: string[] }[] = [
    { label: 'Город', vals: ps.map((p) => p.city) },
    { label: 'Язык', vals: ps.map((p) => p.language) },
    { label: 'Стоимость/год', vals: ps.map((p) => `${p.tuitionPerYear.toLocaleString('ru-RU')} ${p.currency}`) },
    { label: 'Грант', vals: ps.map((p) => p.grantPassScore ? `от ${p.grantPassScore.score} (${p.grantPassScore.year})` : 'проходные — проверить') },
    { label: 'Дедлайн', vals: ps.map((p) => p.closesAt?.slice(0, 10) ?? '—') },
  ];
  if (ps.some((p) => p.track === 'ent')) rows.push({ label: 'ЕНТ, мин.', vals: ps.map((p) => p.admission.entMin ? String(p.admission.entMin) : '—') });
  if (ps.some((p) => p.track === 'sat')) rows.push({ label: 'SAT, мин.', vals: ps.map((p) => p.admission.satMin ? String(p.admission.satMin) : p.reach ? 'обязателен, порога нет' : '—') });
  if (ps.some((p) => p.track === 'ielts_gpa' || p.track === 'nufyp')) rows.push({ label: 'IELTS, мин.', vals: ps.map((p) => p.admission.ieltsMin ? `${p.admission.ieltsMin.overall} (${p.admission.ieltsMin.kind})` : '—') });
  return rows;
}

function CompareInner() {
  const hydrated = useHydrated();
  const params = useSearchParams();
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const setGoal = useAppStore((s) => s.setGoal);
  if (!hydrated) return <p className="text-center text-sm text-muted">Загрузка…</p>;
  const recs = recommend(profile, CATALOG, new Date());
  const a = params.get('a') ?? recs[0]?.programId;
  const b = params.get('b') ?? recs[1]?.programId;
  if (!a || !b) return <p className="text-center text-sm text-muted">Нет программ для сравнения</p>;
  const pa = getProgram(a);
  const pb = getProgram(b);
  if (!pa || !pb) return <p className="text-center text-sm text-muted">Не найдены программы для сравнения</p>;
  const ua = getUniversity(pa.universityId)!;
  const ub = getUniversity(pb.universityId)!;
  const rows = rowsFor([a, b]);
  const ra = recs.find((r) => r.programId === a);
  const rb = recs.find((r) => r.programId === b);

  const choose = (id: string) => { setGoal(id); router.push('/roadmap'); };

  return (
    <main className="flex flex-col gap-8">
      <PathIndicator step={5} label="Сравнение" />
      <h2 className="font-serif text-5xl tracking-[-0.01em]">Сравнение</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[pa, pb].map((p) => {
          const u = getUniversity(p.universityId)!;
          const r = recs.find((x) => x.programId === p.id);
          return (
            <Card key={p.id} className="rise">
              <p className="text-lg font-semibold tracking-tight">{u.name}</p>
              <p className="mt-0.5 text-sm text-muted">{p.title}</p>
              <div className="mt-3">{r && <Badge kind={r.matchLevel} />}</div>
            </Card>
          );
        })}
      </div>
      <Card>
        {rows.map((r) => (
          <div key={r.label} className="border-b border-line py-3 last:border-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-faint">{r.label}</p>
            <div className="mt-1 grid grid-cols-2 gap-2 text-sm font-semibold">
              <span>{r.vals[0]}</span><span>{r.vals[1]}</span>
            </div>
          </div>
        ))}
      </Card>
      <div className="flex flex-col gap-2">
        <Button full onClick={() => choose(a)}>Цель: {ua.name} →</Button>
        <Button full variant="ghost" onClick={() => choose(b)}>Цель: {ub.name}</Button>
      </div>
      <Link href="/roadmap" className="text-center text-xs text-faint">К плану без цели →</Link>
    </main>
  );
}

export default function ComparePage() {
  return <Suspense fallback={<p className="text-center text-sm text-muted">Загрузка…</p>}><CompareInner /></Suspense>;
}