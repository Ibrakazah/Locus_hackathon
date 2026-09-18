"use client";

// Roadmap: таймлайн с чек-листами и единственным следующим шагом.

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Progress } from "@/components/ui";
import { useWizard } from "@/lib/flow/wizard";
import { buildRoadmap, nextStep, roadmapProgress } from "@/lib/flow/progress";

const STATUS_TONE: Record<string, "emerald" | "indigo" | "amber"> = {
  done: "emerald",
  active: "indigo",
  todo: "amber",
};

const STATUS_LABEL: Record<string, string> = {
  done: "Готово",
  active: "В процессе",
  todo: "Ожидает",
};

export default function RoadmapPage() {
  const { state } = useWizard();
  const [roadmap, setRoadmap] = useState(() => buildRoadmap(state.profile));

  const next = useMemo(() => nextStep(roadmap), [roadmap]);
  const progress = roadmapProgress(roadmap);

  const toggle = (stepId: string, itemLabel: string) => {
    setRoadmap((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? {
              ...s,
              checklist: s.checklist.map((c) =>
                c.label === itemLabel ? { ...c, done: !c.done } : c,
              ),
            }
          : s,
      ),
    );
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Roadmap поступления</h1>
        <p className="text-sm text-slate-500">
          Настраивается под профиль. Дедлайны 2026–2027 проверяй в источниках.
        </p>
      </header>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Прогресс</CardTitle>
            <CardContent>
              <Progress value={progress} />
            </CardContent>
          </div>
        </CardHeader>
      </Card>

      {next && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950">
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-500">
            Твой следующий шаг
          </p>
          <p className="mt-1 text-lg font-semibold">
            {next.step.title}: {next.item}
          </p>
        </div>
      )}

      <div className="relative flex flex-col gap-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200 dark:before:bg-slate-800">
        {roadmap.map((step) => (
          <div key={step.id} className="relative pl-8">
            <span
              className={`absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 ${
                step.status === "done"
                  ? "border-emerald-500 bg-emerald-500"
                  : step.status === "active"
                    ? "border-indigo-500 bg-indigo-500"
                    : "border-slate-300 bg-white dark:bg-slate-900"
              }`}
            />
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {step.title}
                    <span className="text-sm font-normal text-slate-400">{step.date}</span>
                  </CardTitle>
                </div>
                <Badge tone={STATUS_TONE[step.status]}>{STATUS_LABEL[step.status]}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {step.checklist.map((item) => (
                  <label
                    key={item.label}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <input
                      type="checkbox"
                      className="accent-indigo-600"
                      checked={item.done}
                      onChange={() => toggle(step.id, item.label)}
                    />
                    <span className={item.done ? "line-through opacity-50" : ""}>{item.label}</span>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto text-xs text-indigo-500 hover:underline"
                      >
                        Открыть →
                      </a>
                    )}
                  </label>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <Link href="/results">
          <Button variant="outline">← К подбору вузов</Button>
        </Link>
        <Link href="/onboarding">
          <Button variant="ghost">Изменить анкету</Button>
        </Link>
      </div>
    </main>
  );
}