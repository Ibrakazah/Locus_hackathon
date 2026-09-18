// Роль: FLOW
// Подсчёт прогресса заполнения профиля и roadmap.

import type { ApplicantProfile } from "@/lib/engine/profile";
import { STEP_FIELDS } from "./steps";

/** Доля заполненных полей профиля: 0..1 */
export function profileCompletion(profile: ApplicantProfile): number {
  const checks: boolean[] = [];
  for (const fields of Object.values(STEP_FIELDS)) {
    for (const field of fields) {
      const value = (profile as unknown as Record<string, unknown>)[field];
      if (field === "entScores") {
        const s = profile.entScores;
        checks.push(Object.values(s).some((v) => v > 0));
      } else if (Array.isArray(value)) {
        checks.push(value.length > 0);
      } else if (typeof value === "object" && value !== null) {
        checks.push(true);
      } else if (typeof value === "string") {
        checks.push(value.trim().length > 0);
      } else {
        checks.push(value !== null && value !== undefined && value !== 0);
      }
    }
  }
  const done = checks.filter(Boolean).length;
  return checks.length === 0 ? 0 : done / checks.length;
}

export interface RoadmapStep {
  id: string;
  title: string;
  date: string;
  status: "done" | "active" | "todo";
  checklist: { label: string; done: boolean; link?: string }[];
}

/** Начальный roadmap — зависит от бюджета и региона. Заполняется ролями DATA/ENGINE. */
export function buildRoadmap(profile: ApplicantProfile): RoadmapStep[] {
  const inGrantSeason = profile.studyBudget !== "contract";
  return [
    {
      id: "ent-register",
      title: "Регистрация на ЕНТ",
      date: "март — апрель",
      status: "todo",
      checklist: [
        { label: "Создать ЛК на testcenter.kz", done: false, link: "https://testcenter.kz" },
        { label: "Выбрать 2 профильных предмета", done: false },
        { label: "Оплатить организационный взнос", done: false },
      ],
    },
    {
      id: "ent-exam",
      title: "Сдать ЕНТ",
      date: "июнь",
      status: "todo",
      checklist: [
        { label: "Допуск: балл ≥ порога (нац. 65+)", done: false },
        { label: "Получить сертификат ЕНТ", done: false },
      ],
    },
    ...(inGrantSeason
      ? [
          {
            id: "grant",
            title: "Подача на грант",
            date: "13–20 июля",
            status: "todo" as const,
            checklist: [
              { label: "Выбрать до 4 групп ОП / вузов", done: false },
              { label: "Подать заявку через eGov/приёмную", done: false, link: "https://egov.kz" },
            ],
          },
        ]
      : []),
    {
      id: "docs",
      title: "Пакет документов",
      date: "20 июня – 25 августа",
      status: "todo",
      checklist: [
        { label: "Аттестат / транскрипт", done: false },
        { label: "Медсправка 075/У", done: false },
        { label: "6 фото 3×4", done: false },
        { label: "Удостоверение личности", done: false },
      ],
    },
    {
      id: "enroll",
      title: "Зачисление",
      date: "до 25 августа",
      status: "todo",
      checklist: [
        { label: "Заключить договор", done: false },
        { label: "Ознакомиться с академическим календарём", done: false },
      ],
    },
  ];
}

/** Единственный следующий шаг — первая невыполненная задача. */
export function nextStep(roadmap: RoadmapStep[]): { step: RoadmapStep; item: string } | null {
  for (const step of roadmap) {
    if (step.status === "done") continue;
    const undone = step.checklist.find((c) => !c.done);
    if (undone) return { step, item: undone.label };
  }
  return null;
}

/** 0..1 общий прогресс roadmap */
export function roadmapProgress(roadmap: RoadmapStep[]): number {
  const all = roadmap.flatMap((s) => s.checklist);
  if (all.length === 0) return 0;
  return all.filter((c) => c.done).length / all.length;
}