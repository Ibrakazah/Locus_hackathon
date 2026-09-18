"use client";

import { Input, Slider } from "@/components/ui";
import { PRIORITY_LABELS, QUOTA_LABELS } from "@/lib/engine/profile";
import type { PriorityKey, QuotaKey } from "@/lib/engine/profile";
import type { StepProps } from "./shared";

const BUDGET_OPTIONS = [
  { value: "both", label: "Рассматриваю и грант, и платное" },
  { value: "grant", label: "Только грант" },
  { value: "contract", label: "Только платно" },
];

const QUOTAS = Object.keys(QUOTA_LABELS) as QuotaKey[];

const PRIORITIES: PriorityKey[] = [
  "rating",
  "price",
  "city",
  "campus",
  "employment",
  "science",
];

export function BudgetStep({ state, dispatch }: StepProps) {
  const wantsPaid = state.profile.studyBudget !== "grant";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium">Финансирование</p>
        <div className="flex flex-col gap-2">
          {BUDGET_OPTIONS.map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-center gap-3 border-2 border-ink bg-paper px-4 py-2.5 text-sm font-bold transition-all has-checked:bg-mint has-checked:shadow-brutal-xs"
            >
              <input
                type="radio"
                name="studyBudget"
                className="h-5 w-5 accent-ink"
                checked={state.profile.studyBudget === o.value}
                onChange={() => dispatch({ type: "SET_FIELD", path: "studyBudget", value: o.value })}
              />
              {o.label}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs font-medium text-smoke">
          Конкурс грантов идёт не на специальность, а на группу образовательных программ.
          Проходные баллы на топ-направления (медицина, IT, право) могут быть 100+.
        </p>
      </div>

      {state.profile.studyBudget !== "contract" && (
        <div>
          <p className="mb-2 text-sm font-medium">Право на квоту при присуждении гранта</p>
          <div className="flex flex-col gap-2">
            {QUOTAS.map((q) => (
              <label
                key={q}
                className="flex cursor-pointer items-center gap-3 border-2 border-ink bg-paper px-4 py-2 text-sm font-bold transition-all has-checked:bg-mint has-checked:shadow-brutal-xs"
              >
                <input
                  type="radio"
                  name="quota"
                  className="h-5 w-5 accent-ink"
                  checked={state.profile.quota === q}
                  onChange={() => dispatch({ type: "SET_FIELD", path: "quota", value: q })}
                />
                {QUOTA_LABELS[q]}
              </label>
            ))}
          </div>
        </div>
      )}

      {wantsPaid && (
        <Input
          type="number"
          name="paidBudget"
          label="Максимум, который готов платить в год (₸)"
          min={0}
          step={100000}
          value={state.profile.paidBudget === null ? "" : String(state.profile.paidBudget)}
          onChange={(e) =>
            dispatch({
              type: "SET_FIELD",
              path: "paidBudget",
              value: e.target.value === "" ? null : Number(e.target.value),
            })
          }
          hint="Если не укажешь — учтём среднюю стоимость платных программ вузов."
        />
      )}

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