// Роль: ENGINE
// Диагностика профиля: 5 осей 0..100 + текстовый вывод "сильные/слабые стороны".
// Оси построены на критериях приёма в РК (ЕНТ-2026, гранты, квоты).

import type { ApplicantProfile, PriorityKey } from "./profile";
import { entTotal, entMinsOk, comboByKey, MAX_ENT } from "./profile";

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

export function diagnoseProfile(profile: ApplicantProfile): Diagnosis {
  const total = entTotal(profile.entScores);
  const minsOk = entMinsOk(profile.entScores);
  const combo = comboByKey(profile.entScores.combo);
  const comboMatches = combo.fields.includes(profile.careerField);

  const academic = Math.round(Math.min(total / MAX_ENT, 1) * 100);
  const finance = financeScore(profile);
  const location = profile.regionPref === "any" ? 100 : 60;
  const career = comboMatches ? 75 : 40;
  const campus = profile.needsDorm ? 45 : profile.needsMilitaryDept ? 40 : 55;

  const axes: AxisScore[] = [
    { key: "academic", value: academic, percentile: Math.round(academic * 0.9), label: "Академика" },
    { key: "finance", value: finance, percentile: finance, label: "Финансы" },
    { key: "location", value: location, percentile: location, label: "Локация" },
    { key: "career", value: career, percentile: Math.min(career + 10, 100), label: "Карьера" },
    { key: "campus", value: campus, percentile: campus, label: "Кампус" },
  ];

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (academic >= 70) strengths.push("Высокий суммарный балл ЕНТ — конкурентоспособен на грант в топ-вузах.");
  else if (academic >= 40) weaknesses.push("Средний/низкий балл — грант в нац. вузах под вопросом, смотри порог направления.");
  else weaknesses.push("Нет заполненных баллов ЕНТ — начни с реальных или прогнозных результатов.");

  if (total > 0 && !minsOk)
    weaknesses.push("Не закрыт минимум по одному из предметов ЕНТ (5/5/5/3/3) — сертификат могут не допустить к конкурсу.");
  if (!comboMatches)
    weaknesses.push(`Комбинация «${combo.label}» не типична для направления «${careerName(profile.careerField)}» — проверь требования вуза.`);
  if (profile.studyBudget === "grant" && profile.quota === "none")
    weaknesses.push("Нужен грант без квоты — конкуренция максимальная, следи за баллами профильных предметов.");
  if (profile.quota !== "none")
    strengths.push("Есть право на квоту — конкурс по гранту идёт в отдельной категории, шансы выше.");
  if (profile.needsDorm) weaknesses.push("Проверь наличие и стоимость общежития в каждом вузе.");
  if (strengths.length === 0) strengths.push("Профиль заполнен — движок уже может подбирать вузы.");

  const summary = `Профиль: ${axes[0].label} ${axes[0].value}/100 · направление «${careerName(profile.careerField)}» · ЕНТ ~${total}/${MAX_ENT} · комбинация: ${combo.label}`;

  return { axes, strengths, weaknesses, summary };
}

function financeScore(profile: ApplicantProfile): number {
  if (profile.studyBudget === "contract") {
    if (profile.paidBudget === null) return 65;
    return profile.paidBudget >= 3000000 ? 80 : profile.paidBudget >= 1500000 ? 55 : 35;
  }
  if (profile.quota !== "none") return 70;
  return 50;
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