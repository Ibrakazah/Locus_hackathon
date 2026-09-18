"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useHydrated } from "@/lib/store/useHydrated";
import { DEMO_PROFILE } from "@/lib/store/demo";
import { buildRoadmap } from "@/lib/roadmap/build";
import { nextStep } from "@/lib/roadmap/nextStep";
import { recommendStub } from "@/lib/roadmap/recommendStub";
import { WhatIfSheet } from "@/components/shared/WhatIfSheet";

export default function RoadmapPage() {
  const hydrated = useHydrated();
  const profile = useAppStore((s) => s.profile);
  const goalProgramId = useAppStore((s) => s.goalProgramId);
  const tasks = useAppStore((s) => s.tasks);
  const setTasks = useAppStore((s) => s.setTasks);
  const toggleTask = useAppStore((s) => s.toggleTask);
  const setProfile = useAppStore((s) => s.setProfile);

  const recs = useMemo(() => recommendStub(), []);
  const goal = useMemo(
    () => recs.find((r) => r.programId === goalProgramId) ?? recs[0],
    [recs, goalProgramId],
  );

  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [costMode, setCostMode] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    setTasks(
      buildRoadmap({ profile, goal, prev: useAppStore.getState().tasks, now: new Date() }),
    );
  }, [hydrated, profile, goal, setTasks]);

  if (!hydrated) {
    return <p className="p-6 text-sm text-smoke">Загрузка…</p>;
  }

  const step = nextStep(tasks);
  const doneCount = tasks.filter((t) => t.done).length;
  const isEmpty = tasks.length === 0;

  const afterOrder = costMode ? [...recs].reverse() : recs;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8">
      <p className="font-display text-xs font-bold uppercase tracking-widest text-mint-deep">
        Шаг 6 из 7 · Roadmap
      </p>
      <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
        План действий
      </h1>

      <div className="flex items-center justify-between border-2 border-ink bg-paper px-4 py-2 text-xs font-bold uppercase shadow-brutal-xs">
        <span>
          Выполнено: {doneCount} / {tasks.length}
        </span>
        <button
          type="button"
          onClick={() => setWhatIfOpen(true)}
          className="border-2 border-ink bg-mint-soft px-3 py-1"
        >
          Что если?
        </button>
      </div>

      {step && (
        <div className="border-2 border-ink bg-mint p-4 shadow-brutal-sm">
          <p className="font-display text-xs font-bold uppercase tracking-wide text-ink/70">
            Следующий шаг
          </p>
          <p className="mt-1 font-display text-lg font-bold">{step.title}</p>
          {step.deadline && <p className="text-xs text-ink/70">до {step.deadline}</p>}
        </div>
      )}

      {isEmpty ? (
        <div className="border-2 border-dashed border-ink bg-mint-soft p-4 text-sm">
          <p>Нет задач: заполните профиль (или загрузите демо).</p>
          <button
            type="button"
            onClick={() => setProfile(DEMO_PROFILE)}
            className="mt-3 border-2 border-ink bg-ink px-4 py-2 font-display text-xs font-bold uppercase text-cream shadow-brutal-xs"
          >
            Загрузить демо-профиль
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li
              key={t.id}
              className={`flex items-start gap-3 border-2 p-3 shadow-brutal-xs ${
                t.alert ? "border-danger bg-paper" : "border-ink bg-paper"
              }`}
            >
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggleTask(t.id)}
                className="mt-1 h-5 w-5 accent-[#27ea9a]"
                aria-label={t.title}
              />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold ${t.done ? "line-through opacity-50" : ""}`}>
                  {t.title}
                </p>
                <p className="text-xs text-smoke">
                  {t.deadline ? `до ${t.deadline} · ` : ""}
                  {t.kind} · {t.source ?? "[демо-данные]"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/next-step"
          className="border-2 border-ink bg-ink px-5 py-3 font-display text-sm font-bold uppercase text-cream shadow-brutal-sm"
        >
          К следующему шагу
        </Link>
        <button
          type="button"
          onClick={() => setCostMode((v) => !v)}
          className="border-2 border-ink bg-paper px-5 py-3 font-display text-sm font-bold uppercase shadow-brutal-sm"
        >
          Демо: приоритет = {costMode ? "стоимость" : "престиж"}
        </button>
      </div>

      <WhatIfSheet
        open={whatIfOpen}
        onClose={() => setWhatIfOpen(false)}
        before={recs}
        after={afterOrder}
        changed={{ priority: costMode ? "cost" : "prestige" }}
      />
    </div>
  );
}
