// Роль: UI
// Верхний навбар в духе референса: кремовый фон, нижний бордер 3px,
// логотип Montserrat Black, mint-подчёркивание активного раздела.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Главная" },
  { href: "/onboarding", label: "Анкета" },
  { href: "/results", label: "Результаты" },
  { href: "/roadmap", label: "Roadmap" },
];

export function SiteNav() {
  const pathname = usePathname();
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b-[3px] border-ink bg-cream">
      <nav className="mx-auto flex h-[60px] w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-xl font-black tracking-tight uppercase sm:text-2xl"
        >
          Локус<span className="text-mint-deep">·</span>Маршрут
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative px-2 py-2 font-display text-[13px] font-bold uppercase tracking-wide transition-colors sm:px-3 sm:text-sm ${
                  active ? "text-ink" : "text-smoke hover:text-ink"
                }`}
              >
                {l.label}
                <span
                  className={`absolute inset-x-2 bottom-0 h-[3px] bg-mint transition-all sm:inset-x-3 ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}