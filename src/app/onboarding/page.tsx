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
import { Button, Progress, Badge } from "@/components/ui";

export default function OnboardingPage() {
  const router = useRouter();
  const { state, dispatch, totals } = useWizard();
  const currentIndex = STEP_INDEX[state.step];
  const current = STEPS[currentIndex];
  const complete = isStepComplete(state, state.step);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{current.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{current.subtitle}</p>
        </div>
        <Badge tone="indigo">
          Шаг {currentIndex + 1} из {STEPS.length}
        </Badge>
      </div>

      <Progress
        value={(currentIndex + 1) / STEPS.length}
        aria-label="Прогресс визарда"
      />

      <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
        {state.step === "profile" && <ProfileStep state={state} dispatch={dispatch} totals={totals} />}
        {state.step === "scores" && <ScoresStep state={state} dispatch={dispatch} totals={totals} />}
        {state.step === "career" && <CareerStep state={state} dispatch={dispatch} totals={totals} />}
        {state.step === "budget" && <BudgetStep state={state} dispatch={dispatch} totals={totals} />}
        {state.step === "constraints" && <ConstraintsStep state={state} dispatch={dispatch} totals={totals} />}

        <div className="mt-2 flex items-center justify-between">
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
            {state.step === "constraints" ? "Готово — показать результаты" : "Далее →"}
          </Button>
        </div>
      </form>
    </main>
  );
}