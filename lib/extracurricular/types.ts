// Роль: EXTRACURRICULARS (ветка B)
// Типы каталога активностей и результата матчинга.

import type { Field } from "../store/types";

export type ActivityType =
  | "hackathon"
  | "olympiad"
  | "competition"
  | "research"
  | "volunteering"
  | "leadership"
  | "sport"
  | "course";

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  /** Направления профиля, которые эта активность усиливает. */
  fields: Field[];
  /** [min, max]; 'graduate' = открыто вверх (подходит и выпускникам). */
  gradeRange: [number, number | "graduate"];
  format: "online" | "offline" | "hybrid";
  city?: string;
  language: "kz" | "ru" | "en";
  price: "free" | "paid";
  deadline?: string;
  dates?: string;
  /** Что активность даёт заявке (отображается на карточке). */
  gain: string;
  /** Вес активности для профиля (1 — слабо, 3 — сильно). */
  intensity: 1 | 2 | 3;
  url: string;
  demo: boolean;
}

export type ActivityFit = "high" | "medium" | "low";

export interface MatchedActivity {
  activity: Activity;
  fit: ActivityFit;
  /** Детерминированная причина (fallback для LLM). */
  why: string;
}
