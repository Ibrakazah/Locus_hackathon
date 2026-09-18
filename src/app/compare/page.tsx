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
  const get = (i: number) => ps[i];
  const rows: { label: string; vals: string[] }[] = [
    { label: 'Город', vals: ps.map((p) => p.city) },
    { label: 'Язык', vals: ps.map((p) => p.language) },
    { label: 'Стоимость/год', vals: ps.map((p) => `${p.tuitionPerYear.toLocaleString('ru-RU')} ${p.currency}`) },
    { label: 'Грант', vals: ps.map((p) => p.grantPassScore ? `от ${p.grantPassScore.score} (${p.grantPassScore.year})` : 'проходные — проверить') },
    { label: 'Дедлайн', vals: ps.map((p) => p.closesAt?.slice(0, 10) ?? '—') },
  ];
  // условные строки по треку
  if (ps.some((p) => p.track === 'ent')) rows.push({ label: 'ЕНТ мин.', vals: ps.map((p) => p.admission.entMin ? String(p.admission.entMin) : '—') });
  if (ps.some((p) => p.track === 'sat')) rows.push({ label: 'SAT мин.', vals: ps.map((p) => p.admission.satMin ? String(p.admission.satMin) : p.reach ? 'обязателен, порога нет' : '—') });
  if (ps.some((p) => p.track === 'ielts_gpa' || p.track === 'nufyp')) rows.push({ label: 'IELTS мин.', vals: ps.map((p) => p.admission.ieltsMin ? `${p.admission.ieltsMin.overall} (${p.admission.ieltsMin.kind})` : '—') });
  void get;
  return rows;
}

function CompareInner() {
  const hydrated = useHydrated();
  const params = useSearchParams();
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const setGoal = useAppStore((s) => s.setGoal);
  if (!hydrated) return <p>Загрузка…</p>;
  const recs = recommend(profile, CATALOG, new Date());
  const a = params.get('a') ?? recs[0]?.programId;
  const b = params.get('b') ?? recs[1]?.programId;
  if (!a || !b) return <p>Нет программ для сравнения</p>;
  const pa = getProgram(a)!;
  const ua = getUniversity(pa.universityId)!;
  const rows = rowsFor([a, b]);
  const ra = recs.find((r) => r.programId === a);
  const rb = recs.find((r) => r.programId === b);

  const choose = (id: string) => { setGoal(id); router.push('/roadmap'); };

  return (
    <main className="flex flex-col gap-4">
      <PathIndicator step={5} label="Сравнение" />
      <div className="grid grid-cols-2 gap-2">
        {[pa, getProgram(b)!].map((p) => {
          const u = getUniversity(p.universityId)!;
          return (
            <Card key={p.id}>
              <p className="font-display text-sm font-extrabold">{u.name}</p>
              <p className="text-xs text-smoke">{p.title}</p>
            </Card>
          );
        })}
      </div>
      <div className="flex gap-2">
        {ra && <Badge kind={ra.matchLevel} />}
        {rb && <Badge kind={rb.matchLevel} />}
      </div>
      <Card>
        {rows.map((r) => (
          <div key={r.label} className="border-b border-ink/10 py-2 last:border-0">
            <p className="font-display text-[11px] font-bold uppercase text-smoke">{r.label}</p>
            <div className="grid grid-cols-2 gap-2 text-sm font-medium">
              <span>{r.vals[0]}</span><span>{r.vals[1]}</span>
            </div>
          </div>
        ))}
      </Card>
      <p className="text-xs text-smoke">Порядок строк — по приоритету «{profile.priority}». На мобиле две колонки ~170px.</p>
      <div className="flex flex-col gap-2">
        <Button onClick={() => choose(a)}>Сделать целью: {ua.name} →</Button>
        <Button variant="ghost" onClick={() => choose(b)}>Сделать целью: {getUniversity(getProgram(b)!.universityId)!.name}</Button>
      </div>
      <Link href="/roadmap" className="text-center text-xs font-bold uppercase text-smoke">К плану без цели →</Link>
    </main>
  );
}

export default function ComparePage() {
  return <Suspense fallback={<p>Загрузка…</p>}><CompareInner /></Suspense>;
}
