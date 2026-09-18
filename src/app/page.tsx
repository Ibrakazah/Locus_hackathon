'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
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
    <main className="flex flex-col gap-10">
      <section className="flex flex-col items-center gap-6 py-10 text-center">
        <span className="glass rounded-full px-4 py-1.5 text-xs font-semibold text-violet-200">
          ✨ AI-сервис поступления · LOCUS 2026
        </span>
        <h1 className="max-w-xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Три минуты — <span className="grad-text">три варианта</span> и план
        </h1>
        <p className="max-w-md text-base leading-relaxed text-muted">
          Персональный маршрут поступления: куда, почему этот вариант подходит, и что делать следующим шагом.
        </p>
        <div className="w-full max-w-xs">
          <Link href="/profile"><Button>🚀 Начать анкету</Button></Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-center text-lg font-bold">Попробовать на примере</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {PERSONAS.map((p, i) => (
            <Card key={p.id} className="rise transition-all hover:bg-white/[0.07]" >
              <button
                type="button"
                onClick={() => tryPersona(p.id)}
                style={{ ['--i' as string]: i }}
                className="flex w-full flex-col items-start gap-2 text-left"
              >
                <p className="text-base font-bold">{p.label}</p>
                <p className="text-sm text-muted">{p.hint}</p>
                <span className="mt-1 bg-gradient-to-r from-violet-300 to-blue-400 bg-clip-text text-xs font-bold uppercase tracking-wider text-transparent">
                  Попробовать →
                </span>
              </button>
            </Card>
          ))}
        </div>
      </section>

      <section className="glass rounded-3xl p-6 text-center">
        <h2 className="text-base font-bold">🤝 Честно про баллы и гранты</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Порог — это минимум для участия, а не гарантия гранта. Мы показываем
          и порог направления, и реальные блокеры.
        </p>
      </section>
    </main>
  );
}
