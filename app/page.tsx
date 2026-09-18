// Временный входной экран (ветка C заменит своим app/page.tsx).
// Сейчас нужен, чтобы приложение собиралось после сноса старого src/.

import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <p className="font-display text-xs font-bold uppercase tracking-widest text-mint-deep">
        LOCUS Hackathon 2026 · Кейс 2
      </p>
      <h1 className="font-display text-4xl font-black uppercase leading-tight sm:text-6xl">
        Маршрут поступления
      </h1>
      <p className="max-w-xl text-sm text-smoke sm:text-base">
        Профиль → диагностика → рекомендации → roadmap → следующий шаг. Заглушка входа: экраны
        собираются ветками B и C.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/diagnosis"
          className="border-2 border-ink bg-mint px-5 py-3 font-display text-sm font-bold uppercase shadow-brutal-sm"
        >
          Диагностика (B)
        </Link>
        <Link
          href="/roadmap"
          className="border-2 border-ink bg-paper px-5 py-3 font-display text-sm font-bold uppercase shadow-brutal-sm"
        >
          Roadmap (B)
        </Link>
      </div>
    </div>
  );
}
