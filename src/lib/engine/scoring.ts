// Роль: ENGINE
// Диагностика профиля: 5 осей 0..100 + текстовый вывод "сильные/слабые стороны".

import type { ApplicantProfile, PriorityKey } from "./profile";
import { entTotal } from "./profile";

export type AxisKey = "academic" | "finance" | "location" | "career" | "campus";

export interface AxisScore {
  key: AxisKey;
  value: number; // 0..100
  percentile: number; // 0..100 — место среди абитуриентов (модель)
  label: string;
}

/** Сильные и слабые стороны, которые покажем в карточке диагностики */
export interface Diagnosis {
  axes: AxisScore[];
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

const MAX_ENT = 140;

export function diagnoseProfile(profile: ApplicantProfile): Diagnosis {
  const total = entTotal(profile.entScores);

  const academic = Math.round(Math.min(total / MAX_ENT, 1) * 100);
  const finance =
    profile.studyBudget === "grant"
      ? 40
      : profile.studyBudget === "contract"
        ? 70
        : 55;
  const location = profile.regionPref === "any" ? 100 : 60;
  const career = profile.skills.length > 0 ? Math.round(50 + profile.skills.length * 8) : 40;
  const campus = profile.needsDorm ? 45 : profile.needsMilitaryDept ? 40 : 55;
  const champus = campus;

  const axes: AxisScore[] = [
    { key: "academic", value: academic, percentile: Math.round(academic * 0.9), label: "Академика" },
    { key: "finance", value: finance, percentile: finance, label: "Финансы" },
    { key: "location", value: location, percentile: location, label: "Локация" },
    { key: "career", value: career, percentile: Math.min(career + 10, 100), label: "Карьера" },
    { key: "campus", value: champus, percentile: champus, label: "Кампус" },
  ];

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (academic >= 70) strengths.push("Высокий общий балл ЕНТ — конкурентоспособен на грант в топ-вузах.");
  else if (academic >= 40) weaknesses.push("Средний/низкий балл — грант в нац. вузах под вопросом.");
  else weaknesses.push("Нет результатов ЕНТ — начни с диагностики по предметам.");
  if (profile.skills.length >= 2) strengths.push("Богатый профиль активности — бонус к мотивационным письмам.");
  if (profile.studyBudget === "grant")
    weaknesses.push("Нужен грант — конкуренция выше, следи за баллами профильных предметов.");
  if (profile.needsDorm && !strengths.includes("Хороший вариант с общежитием")) {
    weaknesses.push("Проверь наличие и стоимость общежития в каждом вузе.");
  }
  if (strengths.length === 0) strengths.push("Профиль заполнен — движок уже может подбирать вузы.");

  const summary = `Профиль: ${axisName(axes[0])} ${axes[0].value}/100 · ${
    profile.careerField
      ? `сфера «${careerName(profile.careerField)}»`
      : "направление ещё не выбрано"
  } · балл ЕНТ ~${total}/140`;

  return { axes, strengths, weaknesses, summary };
}

function axisName(axis: AxisScore): string {
  return axis.label;
}

export function careerName(field: ApplicantProfile["careerField"]): string {
  const map: Record<ApplicantProfile["careerField"], string> = {
    it: "IT и данные",
    medicine: "Медицина",
    engineering: "Инженерия",
    education: "Педагогика",
    humanities: "Гуманитарные науки",
    law: "Право",
    agriculture: "Сельское хозяйство",
    business: "Бизнес и экономика",
    creative: "Творческие профессии",
    science: "Наука",
  };
  return map[field] ?? field;
}

/** Веса осей из приоритетов профиля (для матчинга) */
export function priorityWeights(profile: ApplicantProfile): Record<PriorityKey, number> {
  const p = profile.priorities;
  const total = Object.values(p).reduce((a, b) => a + b, 0) || 1;
  return {
    rating: p.rating / total,
    price: p.price / total,
    city: p.city / total,
    campus: p.campus / total,
    employment: p.employment / total,
    science: p.science / total,
  };
}