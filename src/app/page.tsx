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
    <main className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <h1 className="font-display text-4xl font-black uppercase leading-[1.05]">
          3 минуты → <span className="marker">3 варианта</span> и план
        </h1>
        <p className="border-l-4 border-mint pl-4 font-medium text-smoke">
          Соберём маршрут поступления: куда, почему этот вариант подходит, и что делать следующим шагом.
        </p>
        <Link href="/profile"><Button>Начать анкету</Button></Link>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-extrabold uppercase">Попробовать на примере</h2>
        {PERSONAS.map((p) => (
          <Card key={p.id}>
            <button type="button" onClick={() => tryPersona(p.id)} className="flex w-full flex-col items-start gap-1 text-left">
              <span className="font-display text-base font-extrabold">{p.label}</span>
              <span className="text-sm text-smoke">{p.hint}</span>
              <span className="font-display text-xs font-bold uppercase text-mint-deep">Попробовать →</span>
            </button>
          </Card>
        ))}
      </section>
      <section className="border-[3px] border-ink bg-ink p-4 text-cream shadow-brutal">
        <h2 className="font-display text-sm font-extrabold uppercase">Честно про баллы и гранты</h2>
        <p className="mt-1 text-sm text-cream/80">Порог — минимум для участия, а не гарантия. Грант — отдельной строкой, без галочек и процентов.</p>
      </section>
    </main>
  );
}
