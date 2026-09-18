"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Chip } from "@/components/ui";

interface Recommendation {
  id: string;
  name: string;
  city: string;
  country: string;
  program: string;
  admissionFit: "fits" | "close" | "fails";
  reach: boolean;
  reasons: string[];
  gaps: string[];
  grantNote?: string;
  source?: string;
  demo?: boolean;
}

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "nu-ielts",
    name: "Nazarbayev University",
    city: "Астана",
    country: "KZ",
    program: "Computer Science (Regular)",
    admissionFit: "fits",
    reach: false,
    reasons: ["IELTS 6.5 закрывает порог 6.0", "GPA 4.7/5.0 > минимума 4.0"],
    gaps: [],
    grantNote: "NU не участвует в гос. гранте — обучение платное ($15,000/год)",
    source: "nu.edu.kz",
  },
  {
    id: "kbtu-it",
    name: "KBTU",
    city: "Алматы",
    country: "KZ",
    program: "Информационные технологии",
    admissionFit: "close",
    reach: false,
    reasons: ["Топ-технический вуз Казахстана", "Сильная IT-программа"],
    gaps: ["Нужен ЕНТ с профильными математика+информатика"],
    source: "kbtu.edu.kz",
    demo: true,
  },
  {
    id: "kimep-business",
    name: "KIMEP University",
    city: "Алматы",
    country: "KZ",
    program: "Business Administration",
    admissionFit: "fits",
    reach: false,
    reasons: ["Международный стандарт образования", "Сильные связи с бизнесом"],
    gaps: ["IELTS 6.0 для подачи"],
    grantNote: "Проходной балл на грант ~85 [демо-данные]",
    source: "kimep.kz",
    demo: true,
  },
  {
    id: "sdu-cs",
    name: "SDU",
    city: "Алматы",
    country: "KZ",
    program: "Computer Science",
    admissionFit: "fits",
    reach: false,
    reasons: ["Современная программа", "Доступная стоимость"],
    gaps: [],
    source: "sdu.edu.kz",
  },
  {
    id: "astana-it",
    name: "Astana IT University",
    city: "Астана",
    country: "KZ",
    program: "Software Engineering",
    admissionFit: "fits",
    reach: false,
    reasons: ["Узкая специализация IT", "Партнёрства с компаниями"],
    gaps: [],
    source: "astanait.edu.kz",
    demo: true,
  },
];

const FIT_TONE: Record<string, "emerald" | "amber" | "red"> = {
  fits: "emerald",
  close: "amber",
  fails: "red",
};

const FIT_LABEL: Record<string, string> = {
  fits: "Проходишь порог",
  close: "Близко",
  fails: "Не проходишь",
};

export default function RecommendationsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    const profileRaw = sessionStorage.getItem("locus:profile") || sessionStorage.getItem("locus:persona");
    if (!profileRaw) {
      setRecommendations(MOCK_RECOMMENDATIONS);
      return;
    }
    setRecommendations(MOCK_RECOMMENDATIONS);
  }, []);

  const cities = [...new Set(recommendations.map((r) => r.city))];
  const filtered = cityFilter
    ? recommendations.filter((r) => r.city === cityFilter)
    : recommendations;

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id].slice(0, 2)
    );
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-black uppercase tracking-tight sm:text-3xl">
          Рекомендации
        </h1>
        <p className="text-sm font-medium text-smoke">
          Минимум 3 варианта с объяснением «почему»
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Chip
          variant={cityFilter === null ? "selected" : "default"}
          onClick={() => setCityFilter(null)}
        >
          Все города
        </Chip>
        {cities.map((c) => (
          <Chip
            key={c}
            variant={cityFilter === c ? "selected" : "default"}
            onClick={() => setCityFilter(c)}
          >
            {c}
          </Chip>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map((rec) => (
          <Card
            key={rec.id}
            className={`cursor-pointer transition-all ${
              selected.includes(rec.id) ? "ring-2 ring-mint" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => toggleSelect(rec.id)}
              className="w-full text-left"
            >
              <CardHeader>
                <div>
                  <p className="font-display text-xs font-black text-mint-deep">
                    {rec.city}, {rec.country}
                  </p>
                  <CardTitle>{rec.name}</CardTitle>
                  <CardDescription>{rec.program}</CardDescription>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge tone={FIT_TONE[rec.admissionFit]}>
                    {FIT_LABEL[rec.admissionFit]}
                  </Badge>
                  {rec.reach && (
                    <Badge tone="amber">Конкурсный отбор</Badge>
                  )}
                  {rec.demo && (
                    <Badge tone="slate">демо-данные</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <ul className="list-inside list-disc text-sm font-medium text-smoke">
                  {rec.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                {rec.gaps.length > 0 && (
                  <ul className="list-inside list-disc text-sm font-medium text-danger">
                    {rec.gaps.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                )}
                {rec.grantNote && (
                  <p className="border-l-4 border-sun pl-3 text-xs font-medium text-smoke">
                    {rec.grantNote}
                  </p>
                )}
                {rec.source && (
                  <p className="text-xs text-smoke">
                    Источник: <span className="font-bold">{rec.source}</span>
                  </p>
                )}
              </CardContent>
            </button>
          </Card>
        ))}
      </div>

      {selected.length >= 2 && (
        <div className="fixed bottom-0 inset-x-0 border-t-[3px] border-ink bg-cream p-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <span className="text-sm font-bold">
              Выбрано {selected.length}/2 для сравнения
            </span>
            <Link
              href={`/compare?ids=${selected.join(",")}`}
            >
              <Button>Сравнить</Button>
            </Link>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Link href="/profile">
          <Button variant="outline">← Изменить анкету</Button>
        </Link>
        <Link href="/roadmap">
          <Button variant="ghost">Roadmap →</Button>
        </Link>
      </div>
    </main>
  );
}
