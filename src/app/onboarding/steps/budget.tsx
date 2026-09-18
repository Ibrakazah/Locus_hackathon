"use client";

import { Slider } from "@/components/ui";
import { PRIORITY_LABELS } from "@/lib/engine/profile";
import type { PriorityKey } from "@/lib/engine/profile";
import type { StepProps } from "./shared";

const BUDGET_OPTIONS = [
  { value: "both", label: "Рассматриваю и грант, и контракт" },
  { value: "grant", label: "Только грант" },
  { value: "contract", label: "Только платно" },
];

const PRIORITIES: PriorityKey[] = [
  "rating",
  "price",
  "city",
  "campus",
  "employment",
  "science",
];

export function BudgetStep({ state, dispatch }: StepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium">Форма обучения</p>
        <div className="flex flex-col gap-2">
          {BUDGET_OPTIONS.map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-sm transition has-checked:border-indigo-500 has-checked:bg-indigo-50 dark:border-slate-800 dark:has-checked:bg-indigo-950"
            >
              <input
                type="radio"
                name="studyBudget"
                className="accent-indigo-600"
                checked={state.profile.studyBudget === o.value}
                onChange={() => dispatch({ type: "SET_FIELD", path: "studyBudget", value: o.value })}
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium">Что для тебя важно при выборе вуза</p>
        <div className="flex flex-col gap-4">
          {PRIORITIES.map((key) => (
            <Slider
              key={key}
              label={PRIORITY_LABELS[key]}
              step={5}
              value={state.profile.priorities[key]}
              onChange={(v) => dispatch({ type: "SET_PRIORITY", key, value: v })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}