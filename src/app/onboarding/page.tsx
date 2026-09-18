"use client";

// Страница визарда (роль UI + FLOW взаимодействуют здесь).

import { useRouter } from "next/navigation";
import { useWizard, isStepComplete } from "@/lib/flow/wizard";
import { STEPS, STEP_INDEX } from "@/lib/flow/steps";
import { ProfileStep } from "./steps/profile";
import { ScoresStep } from "./steps/scores";
import { CareerStep } from "./steps/career";
import { BudgetStep } from "./steps/budget";
import { ConstraintsStep } from "./steps/constraints";
import { Button, Progress, Badge, Card } from "@/components/ui";

export default function OnboardingPage() {
  const router = useRouter();
  const { state, dispatch, totals } = useWizard();
  const currentIndex = STEP_INDEX[state.step];
  const current = STEPS[currentIndex];
  const complete = isStepComplete(state, state.step);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black uppercase tracking-tight sm:text-3xl">
            {current.title}
          </h1>
          <p className="mt-1 text-sm font-medium text-smoke">{current.subtitle}</p>
        </div>
        <Badge tone="emerald">
          Шаг {currentIndex + 1} / {STEPS.length}
        </Badge>
      </div>

      <Progress value={(currentIndex + 1) / STEPS.length} aria-label="Прогресс визарда" />

      <Card>
        <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
          {state.step === "profile" && <ProfileStep state={state} dispatch={dispatch} totals={totals} />}
          {state.step === "scores" && <ScoresStep state={state} dispatch={dispatch} totals={totals} />}
          {state.step === "career" && <CareerStep state={state} dispatch={dispatch} totals={totals} />}
          {state.step === "budget" && <BudgetStep state={state} dispatch={dispatch} totals={totals} />}
          {state.step === "constraints" && <ConstraintsStep state={state} dispatch={dispatch} totals={totals} />}

          <div className="mt-2 flex items-center justify-between gap-3 border-t-2 border-ink/10 pt-5">
            <Button variant="ghost" onClick={() => dispatch({ type: "BACK" })} disabled={currentIndex === 0}>
              ← Назад
            </Button>
            <Button
              onClick={() => {
                if (state.step === "constraints") {
                  dispatch({ type: "NEXT" });
                  router.push("/results");
                } else {
                  dispatch({ type: "NEXT" });
                }
              }}
              disabled={!complete}
            >
              {state.step === "constraints" ? "Показать результаты" : "Далее →"}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}