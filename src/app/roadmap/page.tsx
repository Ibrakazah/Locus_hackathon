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
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight">Roadmap поступления</h1>
        <p className="text-sm font-medium text-smoke">
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
        <div className="border-[3px] border-ink bg-mint p-5 shadow-brutal">
          <p className="font-display text-xs font-black uppercase tracking-wide">
            Твой следующий шаг
          </p>
          <p className="mt-1 font-display text-lg font-extrabold">
            {next.step.title}: {next.item}
          </p>
        </div>
      )}

      <div className="relative flex flex-col gap-5 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-[3px] before:bg-ink">
        {roadmap.map((step) => (
          <div key={step.id} className="relative pl-10">
            <span
              className={`absolute left-0 top-1.5 h-6 w-6 border-[3px] border-ink ${
                step.status === "done"
                  ? "bg-mint"
                  : step.status === "active"
                    ? "bg-sun"
                    : "bg-paper"
              }`}
            />
            <Card>
              <CardHeader>
                <div>
<CardTitle className="flex items-center gap-2">
                      {step.title}
                      <span className="font-display text-sm font-bold text-smoke">{step.date}</span>
                    </CardTitle>
                </div>
                <Badge tone={STATUS_TONE[step.status]}>{STATUS_LABEL[step.status]}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {step.checklist.map((item) => (
<label
                      key={item.label}
                      className="flex cursor-pointer items-center gap-3 px-2 py-1.5 text-sm font-medium hover:bg-mint-soft"
                    >
                      <input
                        type="checkbox"
                        className="h-5 w-5 shrink-0 accent-ink"
                        checked={item.done}
                        onChange={() => toggle(step.id, item.label)}
                      />
                      <span className={item.done ? "line-through opacity-50" : ""}>{item.label}</span>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto font-display text-xs font-extrabold uppercase text-mint-deep hover:underline"
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