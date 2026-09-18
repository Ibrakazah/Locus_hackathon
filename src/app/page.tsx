import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import { getUniversityCount } from "@/lib/data";

export const dynamic = "force-static";

const STEPS = [
  { n: "01", title: "Анкета", text: "Класс, баллы ЕНТ и комбинация профильных предметов" },
  { n: "02", title: "Диагностика", text: "5 осей профиля: академика, финансы, локация, карьера, кампус" },
  { n: "03", title: "Подбор вузов", text: "Минимум 3 вуза с объяснением «почему» и честными блокерами" },
  { n: "04", title: "Roadmap", text: "Таймлайн с дедлайнами и один чёткий следующий шаг" },
];

export default function HomePage() {
  const count = getUniversityCount();
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 sm:py-16">
      <section className="flex flex-col items-start gap-6">
        <Badge tone="emerald">LOCUS Hackathon 2026 · Кейс 2</Badge>
        <h1 className="font-display text-4xl font-black uppercase leading-[1.05] tracking-tight sm:text-6xl">
          Твой личный маршрут <span className="marker">поступления</span> в вуз
        </h1>
        <p className="max-w-2xl border-l-4 border-mint pl-4 text-lg font-medium text-smoke">
          Анкета по правилам ЕНТ → диагностика → подбор вузов Казахстана с обоснованием →
          roadmap с дедлайнами → один чёткий следующий шаг.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/onboarding">
            <Button size="lg">Построить маршрут</Button>
          </Link>
          <Link href="/results">
            <Button size="lg" variant="secondary">
              Смотреть результаты
            </Button>
          </Link>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="border-2 border-ink bg-paper px-4 py-2 shadow-brutal-xs">
            <span className="font-display text-2xl font-black">{count}</span>
            <span className="ml-2 font-display text-xs font-bold uppercase text-smoke">
              вузов в базе
            </span>
          </div>
          <div className="border-2 border-ink bg-paper px-4 py-2 shadow-brutal-xs">
            <span className="font-display text-2xl font-black">140</span>
            <span className="ml-2 font-display text-xs font-bold uppercase text-smoke">
              макс. балл ЕНТ
            </span>
          </div>
          <div className="border-2 border-ink bg-paper px-4 py-2 shadow-brutal-xs">
            <span className="font-display text-2xl font-black">13</span>
            <span className="ml-2 font-display text-xs font-bold uppercase text-smoke">
              комбинаций предметов
            </span>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="font-display text-2xl font-black uppercase tracking-tight sm:text-3xl">
          Как это работает
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <Card key={s.n} className="flex flex-col gap-2">
              <span className="inline-flex w-fit border-2 border-ink bg-mint px-2 py-0.5 font-display text-sm font-black shadow-brutal-xs">
                {s.n}
              </span>
              <h3 className="font-display text-lg font-extrabold uppercase">{s.title}</h3>
              <p className="text-sm font-medium text-smoke">{s.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-[3px] border-ink bg-ink p-6 text-cream shadow-brutal sm:p-8">
        <h2 className="font-display text-2xl font-black uppercase tracking-tight sm:text-3xl">
          Честно про баллы и гранты
        </h2>
        <p className="mt-3 max-w-3xl font-medium text-cream/80">
          Порог — это минимум для участия, а не гарантия гранта. На топ-направления
          (медицина, IT, право) проходные баллы прошлого года — 100+. Мы показываем
          и порог направления, и минимумы по предметам, и реальные блокеры.
        </p>
        <div className="mt-5">
          <Link href="/onboarding">
            <Button size="lg">Начать анкету</Button>
          </Link>
        </div>
      </section>
    </main>
  );
}