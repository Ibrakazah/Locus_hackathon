"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { useHydrated } from "@/lib/store/useHydrated";
import { DEMO_PROFILE } from "@/lib/store/demo";
import { buildRoadmap } from "@/lib/roadmap/build";
import { nextStep } from "@/lib/roadmap/nextStep";
import { recommendStub } from "@/lib/roadmap/recommendStub";

export default function NextStepPage() {
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

  useEffect(() => {
    if (!hydrated) return;
    setTasks(
      buildRoadmap({
        profile,
        goal,
        prev: useAppStore.getState().tasks,
        now: new Date(),
      }),
    );
  }, [hydrated, profile, goal, setTasks]);

  if (!hydrated) {
    return <p className="p-6 text-sm text-smoke">Загрузка…</p>;
  }

  const step = nextStep(tasks);
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8">
      <p className="font-display text-xs font-bold uppercase tracking-widest text-mint-deep">
        Шаг 7 из 7 · Следующее действие
      </p>
      <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
        Сделай сейчас
      </h1>

      {step ? (
        <div className="border-2 border-ink bg-mint p-6 shadow-brutal">
          <p className="font-display text-2xl font-black leading-tight">{step.title}</p>
          {step.deadline && <p className="mt-1 text-sm text-ink/70">до {step.deadline}</p>}
          <p className="mt-2 text-xs text-ink/70">
            {step.kind} · {step.source ?? "[демо-данные]"}
          </p>
          <button
            type="button"
            onClick={() => toggleTask(step.id)}
            className="mt-4 border-2 border-ink bg-ink px-5 py-3 font-display text-sm font-bold uppercase text-cream shadow-brutal-sm"
          >
            Отметить выполненным
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-ink bg-mint-soft p-4 text-sm">
          <p>Нет активных задач. Загрузите демо-профиль, чтобы увидеть шаг.</p>
          <button
            type="button"
            onClick={() => setProfile(DEMO_PROFILE)}
            className="mt-3 border-2 border-ink bg-ink px-4 py-2 font-display text-xs font-bold uppercase text-cream shadow-brutal-xs"
          >
            Загрузить демо-профиль
          </button>
        </div>
      )}

      <div className="h-3 w-full border-2 border-ink bg-paper">
        <div
          className="h-full bg-mint"
          style={{ width: tasks.length ? `${(doneCount / tasks.length) * 100}%` : "0%" }}
        />
      </div>
      <p className="text-xs text-smoke">
        Прогресс: {doneCount} / {tasks.length} шагов.
      </p>

      <Link
        href="/roadmap"
        className="w-fit border-2 border-ink bg-paper px-5 py-3 font-display text-sm font-bold uppercase shadow-brutal-sm"
      >
        Весь план
      </Link>
    </div>
  );
}
