"use client";

import { Input, Select } from "@/components/ui";
import { getCities } from "@/lib/data";
import type { StepProps } from "./shared";

const GRADES = [
  { value: "10", label: "10 класс" },
  { value: "11", label: "11 класс (выпускной)" },
  { value: "12", label: "12 класс / колледж" },
];

export function ProfileStep({ state, dispatch }: StepProps) {
  const cities = getCities();
  return (
    <div className="flex flex-col gap-4">
      <Select
        name="grade"
        label="Класс"
        value={String(state.profile.grade)}
        onChange={(e) =>
          dispatch({ type: "SET_FIELD", path: "grade", value: Number(e.target.value) })
        }
        options={GRADES}
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