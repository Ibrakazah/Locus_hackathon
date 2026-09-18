"use client";

import { Badge } from "@/components/ui";
import type { CareerField } from "@/lib/engine/profile";
import { careerName } from "@/lib/engine/scoring";
import type { StepProps } from "./shared";

const FIELDS: CareerField[] = [
  "it",
  "engineering",
  "medicine",
  "science",
  "business",
  "education",
  "humanities",
  "law",
  "agriculture",
  "creative",
];

export function CareerStep({ state, dispatch }: StepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium">Выбери направление</p>
        <div className="flex flex-wrap gap-2">
          {FIELDS.map((f) => {
            const active = state.profile.careerField === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => dispatch({ type: "SET_FIELD", path: "careerField", value: f })}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  active
                    ? "border-indigo-500 bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "border-slate-300 hover:bg-slate-50 dark:border-slate-700"
                }`}
              >
                {careerName(f)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Твои активности / навыки</p>
        <input
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900"
          placeholder="Олимпиады, спорт, волонтёрство, курсы… (через запятую)"
          value={state.profile.skills.join(", ")}
          onChange={(e) =>
            dispatch({
              type: "SET_FIELD",
              path: "skills",
              value: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
        {state.profile.skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {state.profile.skills.map((s) => (
              <Badge key={s} tone="sky">
                {s}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}