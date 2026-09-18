"use client";

import { Badge } from "@/components/ui";
import type { CareerField } from "@/lib/engine/profile";
import { careerName } from "@/lib/engine/scoring";
import { comboByKey } from "@/lib/engine/profile";
import type { StepProps } from "./shared";

const FIELDS: { field: CareerField; hint: string }[] = [
  { field: "it", hint: "Математика + Информатика" },
  { field: "engineering", hint: "Математика + Физика / Химия" },
  { field: "medicine", hint: "Биология + Химия" },
  { field: "science", hint: "Математика + Физика / Химия + Биология" },
  { field: "business", hint: "История + Право / Математика" },
  { field: "education", hint: "Язык + Литература / Математика" },
  { field: "humanities", hint: "Язык + Литература / История + География" },
  { field: "law", hint: "Всемирная история + Основы права" },
  { field: "agriculture", hint: "Биология + География / Химия" },
  { field: "creative", hint: "Творческий экзамен (2 профильных)" },
];

export function CareerStep({ state, dispatch }: StepProps) {
  const combo = comboByKey(state.profile.entScores.combo);
  const matchesCombo = combo.fields.includes(state.profile.careerField);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium">Выбери направление подготовки</p>
        <div className="flex flex-wrap gap-2">
          {FIELDS.map(({ field, hint }) => {
            const active = state.profile.careerField === field;
            return (
              <button
                key={field}
                type="button"
                title={hint}
                onClick={() => dispatch({ type: "SET_FIELD", path: "careerField", value: field })}
                className={`border-2 border-ink px-4 py-2 font-display text-sm font-bold transition-all ${
                  active
                    ? "bg-mint shadow-brutal-xs"
                    : "bg-paper hover:bg-mint-soft"
                }`}
              >
                {careerName(field)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-2 border-ink bg-cream px-4 py-3 text-sm font-medium shadow-brutal-xs">
        <p className="font-display font-extrabold">Твоя комбинация ЕНТ: {combo.label}</p>
        {matchesCombo ? (
          <p className="mt-1 text-smoke">
            Подходит для выбранного направления — конкурс по группе программ будет доступен.
          </p>
        ) : (
          <p className="mt-1 font-bold">
            Эта комбинация не типична для «{careerName(state.profile.careerField)}». Проверь
            требования вуза: возможно, понадобится сменить комбинацию до регистрации на ЕНТ.
          </p>
        )}
      </div>

      {state.profile.careerField === "creative" && (
        <div className="flex items-center gap-2 text-sm font-medium text-smoke">
          <Badge tone="indigo">Творческий экзамен</Badge>
          Участие — по результатам творческого экзамена в вузе (порог по экзамену ≥ 5).
        </div>
      )}
    </div>
  );
}