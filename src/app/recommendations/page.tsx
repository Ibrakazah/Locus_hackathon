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
    <main className="flex flex-col gap-5">
      <PathIndicator step={4} label="Рекомендации" />
      <h2 className="text-center text-2xl font-extrabold tracking-tight">🎓 Куда <span className="grad-text">подходишь</span></h2>
      <div className="flex flex-wrap justify-center gap-2">
        {cities.map((c) => <Chip key={c} active={city === c} onClick={() => setCity(c)}>{c === 'all' ? 'Все города' : c}</Chip>)}
      </div>
      <button onClick={() => setWhatIf(true)} className="self-center text-xs font-semibold text-violet-300 hover:text-violet-200">
        ⚙️ Изменить вводные (what-if)
      </button>
      {diff && (
        <Card>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Что изменилось</h3>
          <ul className="mt-2 flex flex-col gap-1 text-sm">{diff.slice(0, 5).map((d) => (
            <li key={d.programId}>{d.programId}: {d.from + 1} → {d.to + 1}. {d.reason}</li>
          ))}</ul>
        </Card>
      )}
      {shown.map((r, i) => {
        const p = CATALOG.find((x) => x.id === r.programId)!;
        const u = getUniversity(r.universityId)!;
        return (
          <Card
            key={r.programId}
            style={{ ['--i' as string]: Math.min(i, 5) }}
            className={`rise transition-all ${sel.includes(r.programId) ? '!border-violet-400/60 shadow-[0_0_24px_rgba(139,92,246,0.3)]' : ''}`}
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge kind={r.matchLevel} />
              {r.reach && <Badge kind="reach" />}
              {p.demo ? <Badge kind="demo" /> : <Badge kind="source" />}
            </div>
            <h3 className="mt-3 text-lg font-bold">{u.name}</h3>
            <p className="text-sm text-muted">{p.title}</p>
            <p className="mt-1 text-xs text-faint">{u.city} · {p.language.toUpperCase()} · {p.tuitionPerYear.toLocaleString('ru-RU')} {p.currency}/год</p>
            {r.reach && <p className="mt-2 rounded-xl bg-violet-500/10 p-2 text-xs font-semibold text-violet-200">Совпадение с требованиями не равно шансу поступления.</p>}
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm">{r.reasons.map((x) => <li key={x}>{x}</li>)}</ul>
            {r.gaps.length > 0 && (
              <ul className="mt-1 flex flex-col gap-1 text-sm text-muted">{r.gaps.map((g) => <li key={g.roadmapTaskId}>• {g.description}</li>)}</ul>
            )}
            <p className="mt-1 text-xs text-faint">{r.grantNote}</p>
            <p className="mt-1 text-[11px] text-faint">Источник: {p.source}{p.note ? ` ${p.note}` : ''}</p>
            <div className="mt-3 border-t border-line pt-3">
              <Chip active={sel.includes(r.programId)} onClick={() => toggleSel(r.programId)}>
                {sel.includes(r.programId) ? '✓ В сравнении' : '⚖️ В сравнение'}
              </Chip>
            </div>
          </Card>
        );
      })}
      <div className="flex flex-col gap-2">
        <Link href={sel.length === 2 ? `/compare?a=${sel[0]}&b=${sel[1]}` : '/compare'}>
          <Button>Сравнить {sel.length === 2 ? '(2) ⚖️' : ''} →</Button>
        </Link>
        <Link href="/roadmap"><Button variant="ghost">Пропустить сравнение →</Button></Link>
      </div>
      <Sheet open={whatIf} onClose={() => setWhatIf(false)} title="Изменить вводные">
        <label className="flex flex-col gap-2 text-sm font-semibold">Бюджет $/год
          <input value={newBudget} onChange={(e) => setNewBudget(e.target.value)} type="number" className="glass min-h-[44px] rounded-2xl px-4 text-base outline-none focus:border-violet-400/60" />
        </label>
        <div className="mt-4 flex gap-2">
          {(['cost', 'prestige', 'language'] as Priority[]).map((v) => (
            <Chip key={v} active={newPriority === v} onClick={() => setNewPriority(v)}>{v}</Chip>
          ))}
        </div>
        <div className="mt-4"><Button onClick={applyWhatIf}>✨ Пересчитать</Button></div>
      </Sheet>
    </main>
  );
}
