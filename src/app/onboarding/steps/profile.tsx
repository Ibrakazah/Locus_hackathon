"use client";

import { Input, Select } from "@/components/ui";
import { GRADE_LABELS } from "@/lib/engine/profile";
import { getCities } from "@/lib/data";
import type { Grade } from "@/lib/engine/profile";
import type { StepProps } from "./shared";

export function ProfileStep({ state, dispatch }: StepProps) {
  const cities = getCities();
  const gradeKey = state.profile.grade as Grade;

  return (
    <div className="flex flex-col gap-4">
      <Select
        name="grade"
        label="Кто ты сейчас"
        value={gradeKey}
        onChange={(e) =>
          dispatch({ type: "SET_FIELD", path: "grade", value: e.target.value })
        }
        options={Object.entries(GRADE_LABELS).map(([value, label]) => ({ value, label }))}
      />
      <Select
        name="language"
        label="Язык обучения"
        value={state.profile.language}
        onChange={(e) =>
          dispatch({ type: "SET_FIELD", path: "language", value: e.target.value })
        }
        options={[
          { value: "ru", label: "Русский" },
          { value: "kk", label: "Казахский" },
        ]}
        hint="Есть ЕНТ на казахском и на русском языке."
      />
      <Input
        name="city"
        label="Твой город"
        list="cities"
        placeholder="Например, Алматы"
        value={state.profile.city}
        onChange={(e) => dispatch({ type: "SET_FIELD", path: "city", value: e.target.value })}
        hint="Город учтём при подборе вузов и вариантов с общежитием."
      />
      <datalist id="cities">
        {cities.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </div>
  );
}