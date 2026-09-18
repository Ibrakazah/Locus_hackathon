'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { HeroBackground } from '@/components/hero-bg';
import { PERSONAS } from '@/data/personas';
import { useAppStore } from '@/lib/store';

export default function HomePage() {
  const router = useRouter();
  const setProfile = useAppStore((s) => s.setProfile);
  const setGoal = useAppStore((s) => s.setGoal);

  const tryPersona = (id: string) => {
    const p = PERSONAS.find((x) => x.id === id)!;
    setProfile({ ...p.profile });
    setGoal(null);
    router.push('/recommendations');
  };

  return (
    <main className="relative flex flex-col gap-24 overflow-hidden">
      <HeroBackground />
      <div className="relative flex flex-col gap-24">
        <section className="py-16 sm:py-24">
          <div className="relative flex flex-col items-start gap-8">
          <span className="rounded-full border border-line bg-paper px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            AI-сервис поступления · LOCUS 2026
          </span>
          <h1 className="max-w-3xl font-serif text-6xl leading-[0.95] tracking-[-0.02em] sm:text-7xl">
            Три минуты — три варианта <span className="italic">и план</span>
          </h1>
          <p className="max-w-md text-base leading-relaxed text-muted">
            Персональный маршрут поступления: куда, почему этот вариант подходит, и что делать следующим шагом.
          </p>
          <Link href="/profile" className="mt-2 w-full max-w-[280px]">
            <Button full>Начать анкету</Button>
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">Примеры</h2>
          <span className="font-mono text-[11px] text-faint">3 сценария</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {PERSONAS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => tryPersona(p.id)}
              style={{ ['--i' as string]: i }}
              className="group rise flex flex-col gap-6 rounded-xl border border-line bg-paper p-6 text-left transition-colors hover:border-ink"
            >
              <div className="flex flex-1 flex-col gap-2">
                <p className="text-lg font-semibold tracking-tight">{p.label}</p>
                <p className="text-sm leading-relaxed text-muted">{p.hint}</p>
              </div>
              <span className="flex items-center gap-2 text-[13px] font-semibold">
                <span className="border-b border-ink">Попробовать</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-line bg-paper p-8">
        <h2 className="text-sm font-semibold tracking-tight">Честно про баллы и гранты</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Порог — это минимум для участия в конкурсе, а не гарантия гранта. Мы показываем и порог направления, и реальные блокеры, и факты без источника помечаем как демо-данные.
        </p>
      </section>
    </div>
    </main>
  );
}