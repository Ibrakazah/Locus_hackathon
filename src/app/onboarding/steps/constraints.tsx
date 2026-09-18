"use client";

import type { RegionPref } from "@/lib/engine/profile";
import type { StepProps } from "./shared";

const REGIONS: { value: RegionPref; label: string }[] = [
  { value: "any", label: "Куда угодно" },
  { value: "almaty", label: "Алматы и область" },
  { value: "astana", label: "Астана и область" },
  { value: "other", label: "Другие регионы" },
];

export function ConstraintsStep({ state, dispatch }: StepProps) {
  const toggleField = (path: string) => () => {
    const current = (state.profile as unknown as Record<string, boolean>)[path];
    dispatch({ type: "SET_FIELD", path, value: !current });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium">Регион</p>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => dispatch({ type: "SET_FIELD", path: "regionPref", value: r.value })}
              className={`border-2 border-ink px-4 py-2 font-display text-sm font-bold transition-all ${
                state.profile.regionPref === r.value
                  ? "bg-mint shadow-brutal-xs"
                  : "bg-paper hover:bg-mint-soft"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 border-2 border-ink bg-paper px-4 py-3 text-sm font-bold has-checked:bg-mint-soft">
        <input
          type="checkbox"
          className="h-5 w-5 accent-ink"
          checked={state.profile.needsDorm}
          onChange={toggleField("needsDorm")}
        />
        Нужно общежитие
      </label>
      <label className="flex cursor-pointer items-center gap-3 border-2 border-ink bg-paper px-4 py-3 text-sm font-bold has-checked:bg-mint-soft">
        <input
          type="checkbox"
          className="h-5 w-5 accent-ink"
          checked={state.profile.needsMilitaryDept}
          onChange={toggleField("needsMilitaryDept")}
        />
        Важна военная кафедра
      </label>
    </div>
  );
}