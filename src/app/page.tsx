import Link from "next/link";
import { Badge, Button } from "@/components/ui";
import { getUniversityCount } from "@/lib/data";

export const dynamic = "force-static";

export default function HomePage() {
  const count = getUniversityCount();
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
      <section className="flex flex-col items-start gap-6">
        <Badge tone="indigo">LOCUS Hackathon 2026 · Кейс 2</Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Твой личный маршрут <span className="text-indigo-500">поступления</span> в вуз
        </h1>
        <p className="max-w-xl text-lg text-slate-600 dark:text-slate-300">
          Анкета → диагностика → подбор вузов с обоснованием → roadmap с дедлайнами →
          один чёткий следующий шаг.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/onboarding">
            <Button size="lg">Построить маршрут</Button>
          </Link>
          <Link href="/results">
            <Button size="lg" variant="outline">
              Посмотреть результаты
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          В базе уже {count} вузов Казахстана. Прогресс сохраняется автоматически.
        </p>
      </section>
    </main>
  );
}