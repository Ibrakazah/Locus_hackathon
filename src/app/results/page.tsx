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
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-3xl font-black uppercase tracking-tight">
            Твой маршрут поступления
          </h1>
          <div className="flex gap-3">
            <Link href="/roadmap">
              <Button size="sm">Roadmap →</Button>
            </Link>
            <Link href="/onboarding">
              <Button variant="secondary" size="sm">
                Изменить анкету
              </Button>
            </Link>
          </div>
        </div>
        <p className="border-l-4 border-mint pl-3 text-sm font-medium text-smoke">{diagnosis.summary}</p>
      </header>

      {!hasData && (
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-smoke">
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
            <h2 className="mb-3 font-display text-xl font-black uppercase tracking-tight">
              Диагностика профиля
            </h2>
            <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
              {diagnosis.axes.map((axis) => (
                <div key={axis.key} className="flex flex-col gap-1.5 border-2 border-ink bg-paper p-3 shadow-brutal-xs">
                  <span className="font-display text-[11px] font-extrabold uppercase text-smoke">{axis.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-xl font-black">{axis.value}</span>
                    <span className="text-xs font-bold text-smoke">/100</span>
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
            <h2 className="mb-3 font-display text-xl font-black uppercase tracking-tight">
              Подходящие вузы
            </h2>
            <div className="flex flex-col gap-5">
              {matches.map((m, i) => (
                <Card key={m.university.id} className={m.eligible ? "" : "opacity-80"}>
                  <CardHeader>
                    <div>
                      <p className="font-display text-xs font-black text-mint-deep">
                        #{i + 1} · {m.university.city}
                      </p>
                      <CardTitle>
                        {m.university.short} — {m.program.name}
                      </CardTitle>
                      <p className="text-sm font-medium text-smoke">
                        {m.university.name}
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
                        <div className="flex items-center gap-3">
                          <Progress value={m.score / 100} className="flex-1" />
                          <span className="font-display text-sm font-black">{m.score}%</span>
                        </div>
                        <ul className="list-inside list-disc text-sm font-medium text-smoke">
                          {m.reasons.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <ul className="list-inside list-disc text-sm font-medium text-smoke">
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