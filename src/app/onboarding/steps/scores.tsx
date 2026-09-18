"use client";

import { Input, Badge, Select } from "@/components/ui";
import {
  ENT_MAX,
  ENT_MIN,
  ENT_COMBOS,
  entMinsOk,
  MAX_ENT,
} from "@/lib/engine/profile";
import type { EntScores } from "@/lib/engine/profile";
import type { StepProps } from "./shared";

const SCORE_FIELDS: {
  key: keyof Pick<EntScores, "math" | "reading" | "history" | "profile1" | "profile2">;
  label: string;
}[] = [
  { key: "history", label: "История Казахстана" },
  { key: "math", label: "Математическая грамотность" },
  { key: "reading", label: "Грамотность чтения" },
  { key: "profile1", label: "Профильный предмет 1" },
  { key: "profile2", label: "Профильный предмет 2" },
];

function belowMin(
  scores: EntScores,
  key: (typeof SCORE_FIELDS)[number]["key"],
): boolean {
  return scores[key] > 0 && scores[key] < ENT_MIN[key];
}

export function ScoresStep({ state, dispatch, totals }: StepProps) {
  const scores = state.profile.entScores;
  const minsOk = entMinsOk(scores);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Badge tone={totals.ent >= 65 ? "emerald" : "amber"}>
          Итого: {totals.ent} / {MAX_ENT}
        </Badge>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={scores.isEstimate}
            onChange={(e) =>
              dispatch({ type: "SET_FIELD", path: "entScores.isEstimate", value: e.target.checked })
            }
          />
          Это прогноз (желаемые баллы)
        </label>
      </div>

      <Select
        name="ent-combo"
        label="Комбинация профильных предметов ЕНТ"
        value={scores.combo}
        onChange={(e) => dispatch({ type: "SET_FIELD", path: "entScores.combo", value: e.target.value })}
        options={ENT_COMBOS.map((c) => ({ value: c.key, label: c.label }))}
        hint="Комбинацию нельзя поменять в течение года — от неё зависят направления."
      />

      {SCORE_FIELDS.map((f) => (
        <Input
          key={f.key}
          type="number"
          name={`ent-${f.key}`}
          label={`${f.label} · макс ${ENT_MAX[f.key]} б`}
          min={0}
          max={ENT_MAX[f.key]}
          value={String(scores[f.key])}
          hint={belowMin(scores, f.key) ? `Меньше ${ENT_MIN[f.key]} — результат не допустят к конкурсу` : `Порог по предмету: ${ENT_MIN[f.key]}`}
          onChange={(e) =>
            dispatch({
              type: "SET_ENT_SCORE",
              field: f.key,
              value: Math.min(ENT_MAX[f.key], Math.max(0, Number(e.target.value) || 0)),
            })
          }
        />
      ))}

      {totalEntered(scores) > 0 && !minsOk && (
        <p className="border-2 border-ink bg-sun px-3 py-2 text-sm font-bold shadow-brutal-xs">
          Минимум не закрыт хотя бы по одному предмету — даже при сумме 100+ сертификат
          не допустят к конкурсу. Минимумы: история и профильные ≥ 5, чтение и мат. грамотность ≥ 3.
        </p>
      )}

      <p className="text-xs font-medium text-smoke">
        Порог участия: нац. вузы 65+, остальные 50+, педагогика и право 75+, медицина 70+.
      </p>
    </div>
  );
}

function totalEntered(scores: EntScores): number {
  return (
    scores.math +
    scores.reading +
    scores.history +
    scores.profile1 +
    scores.profile2
  );
}