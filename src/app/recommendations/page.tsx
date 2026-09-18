'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Card, Chip, PathIndicator, Sheet } from '@/components/ui';
import { useAppStore, useHydrated } from '@/lib/store';
import { CATALOG, getUniversity } from '@/data/catalog';
import { recommend } from '@/lib/engine';
import { diffRankings } from '@/lib/diff';
import type { Priority } from '@/lib/types';

export default function RecommendationsPage() {
  const hydrated = useHydrated();
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const [city, setCity] = useState<string>('all');
  const [sel, setSel] = useState<string[]>([]);
  const [whatIf, setWhatIf] = useState(false);
  const [newBudget, setNewBudget] = useState('5000');
  const [newPriority, setNewPriority] = useState<Priority>('prestige');
  const [diff, setDiff] = useState<{ programId: string; from: number; to: number; reason: string }[] | null>(null);
  if (!hydrated) return <p>Загрузка…</p>;

  const now = useMemo(() => new Date(), []);
  const recs = useMemo(() => recommend(profile, CATALOG, now), [profile, now]);
  const cities = useMemo(() => ['all', ...Array.from(new Set(recs.map((r) => getUniversity(r.universityId)?.city ?? '')))], [recs]);
  const shown = recs.filter((r) => city === 'all' || getUniversity(r.universityId)?.city === city).slice(0, 6);

  const toggleSel = (id: string) =>
    setSel((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id].slice(-2)));

  const applyWhatIf = () => {
    const before = recs;
    const after = recommend({ ...profile, budgetUsd: Number(newBudget) || null, priority: newPriority }, CATALOG, now);
    setDiff(diffRankings(before, after, `budget priority`));
    setProfile({ budgetUsd: Number(newBudget) || null, priority: newPriority });
    setWhatIf(false);
  };

  return (
    <main className="flex flex-col gap-4">
      <PathIndicator step={4} label="Рекомендации" />
      <div className="flex flex-wrap gap-2">
        {cities.map((c) => <Chip key={c} active={city === c} onClick={() => setCity(c)}>{c === 'all' ? 'Все города' : c}</Chip>)}
      </div>
      <Button variant="ghost" onClick={() => setWhatIf(true)}>Изменить вводные (what-if)</Button>
      {diff && (
        <Card>
          <h3 className="font-display text-xs font-extrabold uppercase">Что изменилось</h3>
          <ul className="mt-1 text-sm">{diff.slice(0, 5).map((d) => (
            <li key={d.programId}>{d.programId}: {d.from + 1} → {d.to + 1}. {d.reason}</li>
          ))}</ul>
        </Card>
      )}
      {shown.map((r) => {
        const p = CATALOG.find((x) => x.id === r.programId)!;
        const u = getUniversity(r.universityId)!;
        return (
          <Card key={r.programId}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge kind={r.matchLevel} />
              {r.reach && <Badge kind="reach" />}
              {p.demo ? <Badge kind="demo" /> : <Badge kind="source" />}
            </div>
            <h3 className="mt-2 font-display text-base font-extrabold">{u.name} · {p.title}</h3>
            <p className="text-xs text-smoke">{u.city} · {p.language.toUpperCase()} · {p.tuitionPerYear.toLocaleString('ru-RU')} {p.currency}/год</p>
            {r.reach && <p className="mt-1 text-xs font-bold">Совпадение с требованиями не равно шансу поступления.</p>}
            <ul className="mt-2 list-disc pl-5 text-sm">{r.reasons.map((x) => <li key={x}>{x}</li>)}</ul>
            {r.gaps.length > 0 && (
              <ul className="mt-1 text-sm text-smoke">{r.gaps.map((g) => <li key={g.roadmapTaskId}>• {g.description}</li>)}</ul>
            )}
            <p className="mt-1 text-xs text-smoke">{r.grantNote}</p>
            <p className="mt-1 text-[11px] text-smoke">Источник: {p.source}{p.note ? ` ${p.note}` : ''}</p>
            <div className="mt-2"><Chip active={sel.includes(r.programId)} onClick={() => toggleSel(r.programId)}>
              {sel.includes(r.programId) ? '✓ в сравнение' : 'В сравнение'}
            </Chip></div>
          </Card>
        );
      })}
      <div className="flex flex-col gap-2">
        <Link href={sel.length === 2 ? `/compare?a=${sel[0]}&b=${sel[1]}` : '/compare'}>
          <Button>Сравнить {sel.length === 2 ? '(2)' : ''} →</Button>
        </Link>
        <Link href="/roadmap"><Button variant="ghost">Пропустить сравнение →</Button></Link>
      </div>
      <Sheet open={whatIf} onClose={() => setWhatIf(false)} title="Изменить вводные">
        <label className="flex flex-col gap-1 text-sm font-bold">Бюджет $/год
          <input value={newBudget} onChange={(e) => setNewBudget(e.target.value)} type="number" className="border-[3px] border-ink px-3 py-2" />
        </label>
        <div className="mt-3 flex gap-2">
          {(['cost', 'prestige', 'language'] as Priority[]).map((v) => (
            <Chip key={v} active={newPriority === v} onClick={() => setNewPriority(v)}>{v}</Chip>
          ))}
        </div>
        <div className="mt-4"><Button onClick={applyWhatIf}>Пересчитать</Button></div>
      </Sheet>
    </main>
  );
}
