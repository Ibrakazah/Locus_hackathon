'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, PathIndicator } from '@/components/ui';
import { useAppStore, useHydrated } from '@/lib/store';
import { CATALOG, getProgram, getUniversity } from '@/data/catalog';
import { recommend } from '@/lib/engine';
import { fmtDate } from '@/lib/text';
import { buildRoadmap, nextStep } from '@/lib/roadmap';
import { diagnosis } from '@/lib/text';
import { buildReportText } from '@/lib/report';

const FIT_LABEL: Record<string, string> = {
  fits: 'проходишь порог',
  close: 'близко к порогу',
  fails: 'пока не проходишь',
};

export default function ReportPage() {
  const hydrated = useHydrated();
  const profile = useAppStore((s) => s.profile);
  const goalId = useAppStore((s) => s.goalProgramId);
  const done = useAppStore((s) => s.done);
  const reset = useAppStore((s) => s.reset);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const data = useMemo(() => {
    if (!hydrated) return null;
    const now = new Date();
    const recs = recommend(profile, CATALOG, now);
    const goal = goalId ? getProgram(goalId) : undefined;
    const prev = Object.entries(done).filter(([, v]) => v).map(([id]) => ({
      id, programId: null as string | null, title: '', deadline: null as string | null, kind: 'info' as const, done: true, source: '',
    }));
    const tasks = buildRoadmap({ profile, goal, recs, prev, now });
    return { recs, tasks, next: nextStep(tasks) };
  }, [hydrated, profile, goalId, done]);
  if (!hydrated || !data) return <p className="text-center text-sm text-muted">Загрузка…</p>;

  const { recs, tasks, next } = data;
  const d = diagnosis(profile, recs);
  const top = recs.slice(0, 3);
  const doneCount = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const goalProgram = goalId ? getProgram(goalId) : undefined;
  const soon = [...tasks].filter((t) => !t.done && t.deadline).sort((a, b) => a.deadline! > b.deadline! ? 1 : -1).slice(0, 3);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildReportText({ profile, recs, tasks, goalProgramId: goalId }));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="flex flex-col gap-6">
      <PathIndicator step={8} label="Итог: финальный отчёт" />

      <section className="glass btn-glow !border-violet-400/40 flex flex-col items-center gap-3 rounded-3xl p-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-300">✨ ИИ-отчёт готов</p>
        <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          Твой маршрут <span className="grad-text">собран</span>
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          Ниже — единый итог: диагноз, куда подходишь, что делать следующим шагом. Всё по твоей анкете, без выдуманных гарантий.
        </p>
        <Button onClick={copy} className="max-w-xs">{copied ? '✓ Скопировано' : '📋 Копировать отчёт'}</Button>
      </section>

      <Card>
        <h3 className="text-sm font-bold">🎯 Цель маршрута</h3>
        <p className="mt-1 text-base font-semibold">
          {goalProgram ? `${getUniversity(goalProgram.universityId)?.name} — ${goalProgram.title}` : recs[0] ? `${getUniversity(recs[0].universityId)?.name} — ${CATALOG.find((x) => x.id === recs[0].programId)?.title ?? recs[0].programId}` : 'не выбрана'}
        </p>
        <p className="mt-1 text-xs text-faint">{d.goal}</p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-emerald-400/20">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">💪 Сильные стороны</h3>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm">{d.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
        </Card>
        <Card className="border-amber-400/20">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">🎯 Ограничения</h3>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-muted">{d.limits.map((s) => <li key={s}>{s}</li>)}</ul>
        </Card>
      </div>

      <section>
        <h3 className="mb-2 text-base font-bold">🏆 Топ-3 для тебя</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {top.map((r, i) => {
            const p = CATALOG.find((x) => x.id === r.programId)!;
            const u = getUniversity(r.universityId)!;
            return (
              <Card key={r.programId} className="flex flex-col gap-2">
                <p className="text-xs font-bold text-faint">#{i + 1}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge kind={r.matchLevel} />
                  {r.reach && <Badge kind="reach" />}
                </div>
                <p className="text-sm font-bold">{u.name}</p>
                <p className="text-xs text-muted">{p.title}</p>
                {r.gaps.length > 0
                  ? <p className="text-[11px] font-semibold text-amber-300">Не хватает: {r.gaps[0].description.slice(0, 60)}{r.gaps[0].description.length > 60 ? '…' : ''}</p>
                  : <p className="text-[11px] text-faint">{FIT_LABEL[r.matchLevel]} · {r.grantNote}</p>
                }
              </Card>
            );
          })}
        </div>
      </section>

      <Card>
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Прогресс по плану · {doneCount} из {tasks.length}</span>
          <span className="font-bold text-violet-300">{pct}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-sm text-muted">
          {soon.map((t) => (
            <li key={t.id}>{t.title}{t.deadline ? ` — до ${fmtDate(t.deadline)}` : ''}</li>
          ))}
        </ul>
      </Card>

      {next && (
        <Card className="!border-violet-400/40 py-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-300">⚡ Следующий шаг</p>
          <p className="mt-2 text-lg font-bold">{next.title}{next.deadline ? ` · до ${fmtDate(next.deadline)}` : ''}</p>
        </Card>
      )}

      <Card className="border-amber-400/20">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">⚠️ Честно</h3>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-muted">
          <li>Порог — это минимум для участия в конкурсе, а не гарантия гранта.</li>
          <li>Факты без источника помечены [демо-данные] — проверь перед подачей.</li>
          <li>Это ориентир для разговора с приёмной комиссией, а не официальный документ.</li>
        </ul>
      </Card>

      <div className="flex flex-col gap-2">
        <Button onClick={() => { reset(); router.push('/'); }}>🔄 Начать заново</Button>
        <Link href="/next-step"><Button variant="ghost">← Следующее действие</Button></Link>
        <Link href="/"><Button variant="ghost">На главную</Button></Link>
      </div>
    </main>
  );
}