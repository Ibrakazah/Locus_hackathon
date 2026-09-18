"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Button, Card, Badge } from "@/components/ui";

interface CompareItem {
  id: string;
  name: string;
  city: string;
  program: string;
  language: string;
  tuitionPerYear: string;
  grantAvailable: boolean;
  deadline: string;
  admissionFit: "fits" | "close" | "fails";
  reasons: string[];
}

const MOCK_COMPARE: Record<string, CompareItem> = {
  "nu-ielts": {
    id: "nu-ielts",
    name: "Nazarbayev University",
    city: "Астана",
    program: "Computer Science",
    language: "Английский",
    tuitionPerYear: "$15,000",
    grantAvailable: false,
    deadline: "17 августа 2026",
    admissionFit: "fits",
    reasons: ["IELTS 6.5 закрывает порог 6.0", "GPA 4.7/5.0 > минимума 4.0"],
  },
  "kbtu-it": {
    id: "kbtu-it",
    name: "KBTU",
    city: "Алматы",
    program: "Информационные технологии",
    language: "Английский",
    tuitionPerYear: "~2,500,000 ₸",
    grantAvailable: true,
    deadline: "август 2026",
    admissionFit: "close",
    reasons: ["Топ-технический вуз", "Есть грант"],
  },
  "kimep-business": {
    id: "kimep-business",
    name: "KIMEP University",
    city: "Алматы",
    program: "Business Administration",
    language: "Английский",
    tuitionPerYear: "~3,000,000 ₸",
    grantAvailable: true,
    deadline: "август 2026",
    admissionFit: "fits",
    reasons: ["Международный стандарт", "Сильные связи с бизнесом"],
  },
  "sdu-cs": {
    id: "sdu-cs",
    name: "SDU",
    city: "Алматы",
    program: "Computer Science",
    language: "Русский/Английский",
    tuitionPerYear: "~1,500,000 ₸",
    grantAvailable: true,
    deadline: "август 2026",
    admissionFit: "fits",
    reasons: ["Современная программа", "Доступная стоимость"],
  },
  "astana-it": {
    id: "astana-it",
    name: "Astana IT University",
    city: "Астана",
    program: "Software Engineering",
    language: "Английский",
    tuitionPerYear: "~2,000,000 ₸",
    grantAvailable: true,
    deadline: "август 2026",
    admissionFit: "fits",
    reasons: ["Узкая специализация IT", "Партнёрства с компаниями"],
  },
};

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

function CompareContent() {
  const searchParams = useSearchParams();
  const ids = searchParams.get("ids")?.split(",") ?? [];
  const items = ids.map((id) => MOCK_COMPARE[id]).filter(Boolean);

  if (items.length < 2) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
        <Card>
          <p className="text-sm font-medium text-smoke">
            Выбери минимум 2 программы для сравнения на странице рекомендаций.
          </p>
          <div className="mt-4">
            <Link href="/recommendations">
              <Button>К рекомендациям</Button>
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  const rows = [
    { label: "Город", get: (i: CompareItem) => i.city },
    { label: "Язык", get: (i: CompareItem) => i.language },
    { label: "Стоимость/год", get: (i: CompareItem) => i.tuitionPerYear },
    { label: "Грант", get: (i: CompareItem) => (i.grantAvailable ? "Есть" : "Нет") },
    { label: "Дедлайн", get: (i: CompareItem) => i.deadline },
    { label: "Уровень допуска", get: (i: CompareItem) => FIT_LABEL[i.admissionFit] },
  ];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-black uppercase tracking-tight sm:text-3xl">
          Сравнение
        </h1>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full border-[3px] border-ink">
          <thead>
            <tr className="border-b-[3px] border-ink bg-ink text-cream">
              <th className="p-3 text-left font-display text-xs font-extrabold uppercase">
                Параметр
              </th>
              {items.map((item) => (
                <th
                  key={item.id}
                  className="border-l-[3px] border-ink p-3 text-left font-display text-xs font-extrabold uppercase"
                >
                  {item.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b-2 border-ink/20">
                <td className="p-3 font-display text-xs font-bold uppercase text-smoke">
                  {row.label}
                </td>
                {items.map((item) => (
                  <td
                    key={item.id}
                    className="border-l-[3px] border-ink/20 p-3 text-sm font-medium"
                  >
                    {row.get(item)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-b-2 border-ink/20">
              <td className="p-3 font-display text-xs font-bold uppercase text-smoke">
                Причины
              </td>
              {items.map((item) => (
                <td
                  key={item.id}
                  className="border-l-[3px] border-ink/20 p-3"
                >
                  <ul className="list-inside list-disc text-xs font-medium text-smoke">
                    {item.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-between pt-4">
        <Link href="/recommendations">
          <Button variant="outline">← К рекомендациям</Button>
        </Link>
        <Link href="/roadmap">
          <Button>Сделать целью →</Button>
        </Link>
      </div>
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
          <p className="text-sm font-medium text-smoke">Загрузка...</p>
        </main>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
