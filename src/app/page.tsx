"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { PERSONAS } from "@/data/personas";

export default function HomePage() {
  const router = useRouter();

  const handlePersona = (personaId: string) => {
    const persona = PERSONAS.find((p) => p.id === personaId);
    if (persona) {
      sessionStorage.setItem("locus:persona", JSON.stringify(persona.profile));
      router.push("/recommendations");
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-4 py-12 sm:px-6">
      <section className="flex flex-col items-start gap-6">
        <h1 className="font-display text-4xl font-black uppercase leading-[1.05] tracking-tight sm:text-5xl">
          3 минуты → <span className="marker">3 варианта</span> и план
        </h1>
        <p className="max-w-xl border-l-4 border-mint pl-4 text-lg font-medium text-smoke">
          Персональный маршрут поступления: куда, почему этот вариант подходит, и что делать
          следующим шагом.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <Link href="/profile">
          <Button size="lg" className="w-full">
            Начать анкету
          </Button>
        </Link>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-extrabold uppercase tracking-tight">
          Попробовать на примере
        </h2>
        <div className="flex flex-col gap-3">
          {PERSONAS.map((p) => (
            <Card key={p.id}>
              <button
                type="button"
                onClick={() => handlePersona(p.id)}
                className="flex w-full flex-col items-start gap-2 text-left"
              >
                <p className="font-display text-base font-extrabold">{p.name}</p>
                <p className="text-sm font-medium text-smoke">{p.description}</p>
                <span className="mt-1 font-display text-xs font-bold uppercase text-mint-deep">
                  Попробовать →
                </span>
              </button>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-[3px] border-ink bg-ink p-5 text-cream shadow-brutal sm:p-6">
        <h2 className="font-display text-lg font-extrabold uppercase tracking-tight">
          Честно про баллы и гранты
        </h2>
        <p className="mt-2 max-w-xl text-sm font-medium text-cream/80">
          Порог — это минимум для участия, а не гарантия гранта. Мы показываем
          и порог направления, и реальные блокеры.
        </p>
      </section>
    </main>
  );
}
