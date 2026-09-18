// Роль: EXTRACURRICULARS (ветка B)
// Человекочитаемые подписи для типов/фита/формата/цены.

import type { ActivityFit, ActivityType } from "./types";

export const TYPE_LABEL: Record<ActivityType, string> = {
  hackathon: "Хакатон",
  olympiad: "Олимпиада",
  competition: "Конкурс",
  research: "Исследование",
  volunteering: "Волонтёрство",
  leadership: "Лидерство",
  sport: "Спорт",
  course: "Курс",
};

export const FIT_LABEL: Record<ActivityFit, string> = {
  high: "Отлично подходит",
  medium: "Подходит",
  low: "На подумать",
};

export const FIT_STYLE: Record<ActivityFit, string> = {
  high: "bg-mint text-ink",
  medium: "bg-sun text-ink",
  low: "bg-paper text-ink",
};

export const FORMAT_LABEL: Record<string, string> = {
  online: "онлайн",
  offline: "офлайн",
  hybrid: "гибрид",
};

export const PRICE_LABEL: Record<string, string> = {
  free: "бесплатно",
  paid: "платно",
};
