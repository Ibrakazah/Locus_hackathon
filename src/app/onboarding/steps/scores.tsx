"use client";

import { Input, Badge } from "@/components/ui";
import type { StepProps } from "./shared";

const MAX_ENT = 140;
const SCORE_FIELDS: { key: "math" | "reading" | "history" | "profile1" | "profile2"; label: string; hint: string }[] = [
  { key: "math", label: "Математическая грамотность", hint: "0–20" },
  { key: "reading", label: "Грамотность чтения", hint: "0–20" },
  { key: "history", label: "История Казахстана", hint: "0–20" },
  { key: "profile1", label: "Профильный предмет 1", hint: "0–40" },
  { key: "profile2", label: "Профильный предмет 2", hint: "0–40" },
];

function maxFor(key: string): number {
  return key === "profile1" || key === "profile2" ? 40 : 20;
}

export function ScoresStep({ state, dispatch, totals }: StepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Badge tone={totals.ent >= 65 ? "emerald" : "amber"}>
          Итого: {totals.ent} / {MAX_ENT}
        </Badge>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={state.profile.entScores.isEstimate}
            onChange={(e) =>
              dispatch({ type: "SET_FIELD", path: "entScores.isEstimate", value: e.target.checked })
            }
          />
          Это прогноз (желаемые баллы)
        </label>
      </div>

      {SCORE_FIELDS.map((f) => (
        <Input
          key={f.key}
          type="number"
          name={`ent-${f.key}`}
          label={`${f.label} · ${f.hint}`}
          min={0}
          max={maxFor(f.key)}
          value={String(state.profile.entScores[f.key])}
          onChange={(e) =>
            dispatch({
              type: "SET_ENT_SCORE",
              field: f.key,
              value: Math.min(maxFor(f.key), Math.max(0, Number(e.target.value) || 0)),
            })
          }
        />
      ))}
      <p className="text-xs text-slate-500">
        Порог участия: нац. вузы 65+, медицина 70+, педагогика и право 75+.
      </p>
    </div>
  );
}