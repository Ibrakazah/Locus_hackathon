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
              className={`rounded-full border px-4 py-2 text-sm transition ${
                state.profile.regionPref === r.value
                  ? "border-indigo-500 bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  : "border-slate-300 hover:bg-slate-50 dark:border-slate-700"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
        <input
          type="checkbox"
          className="accent-indigo-600"
          checked={state.profile.needsDorm}
          onChange={toggleField("needsDorm")}
        />
        Нужно общежитие
      </label>
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
        <input
          type="checkbox"
          className="accent-indigo-600"
          checked={state.profile.needsMilitaryDept}
          onChange={toggleField("needsMilitaryDept")}
        />
        Важна военная кафедра
      </label>
    </div>
  );
}