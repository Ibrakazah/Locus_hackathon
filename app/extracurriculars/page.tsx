"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useHydrated } from "@/lib/store/useHydrated";
import { DEMO_PROFILE } from "@/lib/store/demo";
import { ACTIVITIES } from "@/data/activities";
import { matchActivities } from "@/lib/extracurricular/match";
import { diagnosis } from "@/lib/text/diagnosis";
import { ActivityCard } from "@/components/shared/ActivityCard";
import { ActivityFilters } from "@/components/shared/ActivityFilters";
import type { ActivityFit, ActivityType } from "@/lib/extracurricular/types";

export default function ExtracurricularsPage() {
  const hydrated = useHydrated();
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);

  const matched = useMemo(() => matchActivities(profile, ACTIVITIES, new Date()), [profile]);

  const [type, setType] = useState<ActivityType | null>(null);
  const [format, setFormat] = useState<"online" | "offline" | "hybrid" | null>(null);
  const [fit, setFit] = useState<ActivityFit | null>(null);

  if (!hydrated) {
    return <p className="p-6 text-sm text-smoke">Загрузка…</p>;
  }

  const profileEmpty = profile.fields.length === 0 && Object.keys(profile.exams).length === 0;
  const d = diagnosis(profile, []);

  const filtered = matched.filter(
    (m) =>
      (!type || m.activity.type === type) &&
      (!format || m.activity.format === format) &&
      (!fit || m.fit === fit),
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8">
      <p className="font-display text-xs font-bold uppercase tracking-widest text-mint-deep">
        Активности · Дополнительно
      </p>
      <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
        Чем усилить профиль
      </h1>
      <p className="max-w-2xl text-sm text-smoke">{d.goal}</p>

      {profileEmpty && (
        <div className="border-2 border-dashed border-ink bg-mint-soft p-4 text-sm">
          <p>Профиль пуст — загрузите демо, чтобы увидеть персональную подборку.</p>
          <button
            type="button"
            onClick={() => setProfile(DEMO_PROFILE)}
            className="mt-3 border-2 border-ink bg-ink px-4 py-2 font-display text-xs font-bold uppercase text-cream shadow-brutal-xs"
          >
            Загрузить демо-профиль
          </button>
        </div>
      )}

      <ActivityFilters
        type={type}
        format={format}
        fit={fit}
        onType={setType}
        onFormat={setFormat}
        onFit={setFit}
      />

      {filtered.length === 0 ? (
        <div className="border-2 border-ink bg-paper p-6 text-sm">
          По выбранным фильтрам ничего нет.
          <button
            type="button"
            onClick={() => {
              setType(null);
              setFormat(null);
              setFit(null);
            }}
            className="ml-2 font-display text-xs font-bold uppercase underline"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <ActivityCard key={m.activity.id} m={m} profile={profile} />
          ))}
        </div>
      )}

      <p className="text-xs text-smoke">
        Все события — демо-данные, даты и ссылки требуют проверки по официальным источникам.
      </p>
    </div>
  );
}
