"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { useHydrated } from "@/lib/store/useHydrated";
import { DEMO_PROFILE } from "@/lib/store/demo";
import { recommendStub } from "@/lib/roadmap/recommendStub";
import { diagnosis } from "@/lib/text/diagnosis";

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="border-2 border-ink bg-paper p-4 shadow-brutal-sm">
      <h2 className="font-display text-xs font-bold uppercase tracking-wide text-smoke">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-smoke">Нет данных.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="text-mint-deep">
                ▸
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function DiagnosisPage() {
  const hydrated = useHydrated();
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);

  if (!hydrated) {
    return <p className="p-6 text-sm text-smoke">Загрузка…</p>;
  }

  const isEmpty = profile.fields.length === 0 && Object.keys(profile.exams).length === 0;
  const d = diagnosis(profile, recommendStub());

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8">
      <p className="font-display text-xs font-bold uppercase tracking-widest text-mint-deep">
        Шаг 3 из 7 · Диагностика
      </p>
      <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
        Что мы видим по профилю
      </h1>

      {isEmpty && (
        <div className="border-2 border-dashed border-ink bg-mint-soft p-4 text-sm">
          <p>Профиль пуст. Загрузите демо-профиль, чтобы увидеть диагностику.</p>
          <button
            type="button"
            onClick={() => setProfile(DEMO_PROFILE)}
            className="mt-3 border-2 border-ink bg-ink px-4 py-2 font-display text-xs font-bold uppercase text-cream shadow-brutal-xs"
          >
            Загрузить демо-профиль
          </button>
        </div>
      )}

      <div className="border-2 border-ink bg-mint p-4 shadow-brutal-sm">
        <h2 className="font-display text-xs font-bold uppercase tracking-wide text-ink/70">Цель</h2>
        <p className="mt-1 font-display text-lg font-bold">{d.goal}</p>
      </div>

      <Block title="Сильные стороны" items={d.strengths} />
      <Block title="Ограничения" items={d.limits} />

      <div className="flex flex-wrap gap-3">
        <Link
          href="/roadmap"
          className="border-2 border-ink bg-ink px-5 py-3 font-display text-sm font-bold uppercase text-cream shadow-brutal-sm"
        >
          К roadmap
        </Link>
        <Link
          href="/next-step"
          className="border-2 border-ink bg-paper px-5 py-3 font-display text-sm font-bold uppercase shadow-brutal-sm"
        >
          Следующий шаг
        </Link>
      </div>
      <p className="text-xs text-smoke">
        Источники: nu.edu.kz, testcenter.kz. Неподтверждённые данные помечены как [демо-данные].
      </p>
    </div>
  );
}
