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
  const now = useMemo(() => new Date(), []);
  const recs = useMemo(() => recommend(profile, CATALOG, now), [profile, now]);
  const cities = useMemo(() => ['all', ...Array.from(new Set(recs.map((r) => getUniversity(r.universityId)?.city ?? '')))], [recs]);
  if (!hydrated) return <p className="text-center text-sm text-muted">Загрузка…</p>;

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
    <main className="flex flex-col gap-8">
      <PathIndicator step={4} label="Рекомендации" />
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-5xl tracking-[-0.01em]">Куда подходишь</h2>
        <span className="font-mono text-[11px] text-faint">{shown.length} вариантов</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div className="flex flex-wrap gap-2">
          {cities.map((c) => <Chip key={c} active={city === c} onClick={() => setCity(c)}>{c === 'all' ? 'Все города' : c}</Chip>)}
        </div>
        <button onClick={() => setWhatIf(true)} className="text-[13px] font-semibold text-muted transition-colors hover:text-ink">
          Изменить вводные →
        </button>
      </div>
      {diff && (
        <Card>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Что изменилось</h3>
          <ul className="mt-2 flex flex-col gap-1 text-sm">{diff.slice(0, 5).map((d) => (
            <li key={d.programId} className="font-mono text-xs text-muted">{d.programId}: {d.from + 1} → {d.to + 1}. {d.reason}</li>
          ))}</ul>
        </Card>
      )}
      <div className="flex flex-col gap-4">
        {shown.map((r, i) => {
          const p = CATALOG.find((x) => x.id === r.programId)!;
          const u = getUniversity(r.universityId)!;
          return (
            <Card
              key={r.programId}
              style={{ ['--i' as string]: Math.min(i, 5) }}
              className={`rise transition-colors ${sel.includes(r.programId) ? 'border-ink' : ''}`}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge kind={r.matchLevel} />
                {r.reach && <Badge kind="reach" />}
                {p.demo ? <Badge kind="demo" /> : <Badge kind="source" />}
              </div>
              <div className="mt-4 flex flex-col gap-1">
                <h3 className="text-xl font-semibold tracking-tight">{u.name}</h3>
                <p className="text-sm text-muted">{p.title}</p>
              </div>
              <p className="mt-2 font-mono text-[11px] text-faint">{u.city} · {p.language.toUpperCase()} · {p.tuitionPerYear.toLocaleString('ru-RU')} {p.currency}/год</p>
              {r.reach && <p className="mt-4 rounded-md bg-bone px-3 py-2 text-xs leading-relaxed text-muted">Совпадение с требованиями не равно шансу поступления.</p>}
              <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
                <ul className="flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed">{r.reasons.map((x) => <li key={x}>{x}</li>)}</ul>
                {r.gaps.length > 0 && (
                  <ul className="flex flex-col gap-1 text-sm text-muted">{r.gaps.map((g) => <li key={g.roadmapTaskId}>— {g.description}</li>)}</ul>
                )}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">{r.grantNote}</p>
              <p className="mt-1 font-mono text-[11px] text-faint">Источник: {p.source}{p.note ? ` · ${p.note}` : ''}</p>
              <div className="mt-4">
                <Chip active={sel.includes(r.programId)} onClick={() => toggleSel(r.programId)} className="!px-3 !py-1.5 text-[13px]">
                  {sel.includes(r.programId) ? 'В сравнении ✓' : 'В сравнение'}
                </Chip>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="flex flex-col gap-2">
        <Link href={sel.length === 2 ? `/compare?a=${sel[0]}&b=${sel[1]}` : '/compare'}>
          <Button full>Сравнить {sel.length === 2 ? `(${sel.length})` : ''} →</Button>
        </Link>
        <Link href="/roadmap"><Button full variant="ghost">Пропустить сравнение →</Button></Link>
      </div>
      <Sheet open={whatIf} onClose={() => setWhatIf(false)} title="Изменить вводные">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Бюджет $/год</span>
          <input value={newBudget} onChange={(e) => setNewBudget(e.target.value)} type="number" className="min-h-[44px] rounded-md border border-line bg-paper px-4 text-base outline-none focus:border-ink" />
        </label>
        <div className="mt-5 flex gap-2">
          {(['cost', 'prestige', 'language'] as Priority[]).map((v) => (
            <Chip key={v} active={newPriority === v} onClick={() => setNewPriority(v)}>{v}</Chip>
          ))}
        </div>
        <div className="mt-6"><Button full onClick={applyWhatIf}>Пересчитать</Button></div>
      </Sheet>
    </main>
  );
}