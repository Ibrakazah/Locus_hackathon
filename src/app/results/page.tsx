"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Progress } from "@/components/ui";
import { useWizard } from "@/lib/flow/wizard";
import { diagnoseProfile } from "@/lib/engine/scoring";
import { matchUniversities } from "@/lib/engine/matching";
import { getAllUniversities } from "@/lib/data";
import { entTotal } from "@/lib/engine/profile";

const CATEGORY_TONE: Record<string, "emerald" | "indigo" | "amber"> = {
  safety: "emerald",
  match: "indigo",
  reach: "amber",
};

const CATEGORY_LABEL: Record<string, string> = {
  safety: "Безопасно",
  match: "Реалистично",
  reach: "Амбиция",
};

export default function ResultsPage() {
  const { state } = useWizard();
  const profile = state.profile;

  const { diagnosis, matches } = useMemo(() => {
    const diag = diagnoseProfile(profile);
    const unis = getAllUniversities();
    return { diagnosis: diag, matches: matchUniversities(profile, unis) };
  }, [profile]);

  const hasData = entTotal(profile.entScores) > 0;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Твой маршрут поступления</h1>
          <div className="flex gap-2">
          <Link href="/roadmap">
            <Button size="sm" variant="outline">
              Roadmap →
            </Button>
          </Link>
          <Link href="/onboarding">
            <Button variant="outline" size="sm">
              Изменить анкету
            </Button>
          </Link>
        </div>
        </div>
        <p className="text-slate-500 dark:text-slate-400">{diagnosis.summary}</p>
      </header>

      {!hasData && (
        <Card>
          <CardContent>
            <p className="text-sm text-slate-500">
              Сначала заполни баллы ЕНТ в анкете — без них подбор невозможен.
            </p>
            <div className="mt-4">
              <Link href="/onboarding">
                <Button>Заполнить анкету</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {hasData && (
        <>
          <section aria-label="Диагностика">
            <div className="mb-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
              {diagnosis.axes.map((axis) => (
                <div key={axis.key} className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-slate-500">{axis.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold">{axis.value}</span>
                    <span className="text-xs text-slate-400">/100</span>
                  </div>
                  <Progress value={axis.value / 100} />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex flex-wrap gap-2">
                {diagnosis.strengths.map((s) => (
                  <Badge key={s} tone="emerald">
                    {s}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {diagnosis.weaknesses.map((w) => (
                  <Badge key={w} tone="amber">
                    {w}
                  </Badge>
                ))}
              </div>
            </div>
          </section>

          <section aria-label="Подбор вузов">
            <h2 className="mb-3 text-xl font-semibold">Подходящие вузы</h2>
            <div className="flex flex-col gap-4">
              {matches.map((m) => (
                <Card key={m.university.id} className={m.eligible ? "" : "opacity-70"}>
                  <CardHeader>
                    <div>
                      <CardTitle>{m.university.short} — {m.program.name}</CardTitle>
                      <p className="text-sm text-slate-500">
                        {m.university.name} · {m.university.city}
                      </p>
                    </div>
                    {m.eligible ? (
                      <Badge tone={CATEGORY_TONE[m.matchCategory]}>{CATEGORY_LABEL[m.matchCategory]}</Badge>
                    ) : (
                      <Badge tone="red">Не проходит</Badge>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {m.eligible ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Progress value={m.score / 100} className="flex-1" />
                          <span className="text-sm font-bold">{m.score}%</span>
                        </div>
                        <ul className="list-inside list-disc text-sm text-slate-600 dark:text-slate-300">
                          {m.reasons.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <ul className="list-inside list-disc text-sm text-slate-600 dark:text-slate-300">
                        {m.blockers.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}