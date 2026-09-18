// Роль: ENGINE
// Матчинг вузов: жёсткие фильтры + взвешенная оценка 0..100 + объяснения "почему".

import type { University, Program, ProgramGroup } from "@/lib/data/types";
import type { ApplicantProfile, CareerField, PriorityKey, RegionPref } from "./profile";
import { entTotal } from "./profile";
import { priorityWeights } from "./scoring";

export interface MatchResult {
  university: University;
  program: Program;
  score: number; // 0..100
  matchCategory: "reach" | "match" | "safety";
  reasons: string[];
  blockers: string[]; // причины фильтрации (если notEligible)
  eligible: boolean;
}

const CAREER_TO_GROUP: Record<CareerField, ProgramGroup[]> = {
  it: ["it"],
  medicine: ["health"],
  engineering: ["engineering"],
  education: ["pedagogical"],
  humanities: ["humanities"],
  law: ["business"],
  agriculture: ["agriculture"],
  business: ["business"],
  creative: ["humanities"],
  science: ["science", "it"],
};

function regionMatches(regionPref: RegionPref, city: string): boolean {
  const astana = city.toLowerCase() === "астана";
  const almaty = city.toLowerCase() === "алматы";
  if (regionPref === "any") return true;
  if (regionPref === "astana") return astana;
  if (regionPref === "almaty") return almaty;
  return !astana && !almaty;
}

function programScoreFor(university: University, profile: ApplicantProfile): Program | undefined {
  const groups = CAREER_TO_GROUP[profile.careerField];
  return university.programs.find((p) => groups.includes(p.group));
}

export function matchUniversities(
  profile: ApplicantProfile,
  universities: University[],
): MatchResult[] {
  const total = entTotal(profile.entScores);
  const weights = priorityWeights(profile);
  const results: MatchResult[] = [];

  for (const uni of universities) {
    const program = programScoreFor(uni, profile);
    const blockers: string[] = [];

    if (!program) {
      blockers.push("Нет программы под выбранное направление");
    }
    if (total < uni.minEntScore) {
      blockers.push(`Нужен минимум ${uni.minEntScore} баллов (сейчас ~${total})`);
    }
    if (profile.regionPref !== "any" && !regionMatches(profile.regionPref, uni.city)) {
      blockers.push(`Регион: ты ограничил(а) ${profile.regionPref}`);
    }
    if (profile.studyBudget === "contract" && !uni.hasContract) {
      blockers.push("Платное отделение недоступно");
    }
    if (program?.paidMinScore && profile.studyBudget === "contract" && total < program.paidMinScore) {
      blockers.push(`Платное: нужен минимум ${program.paidMinScore} баллов`);
    }

    if (blockers.length > 0) {
      results.push({
        university: uni,
        program: program ?? uni.programs[0],
        score: 0,
        matchCategory: "match",
        reasons: [],
        blockers,
        eligible: false,
      });
      continue;
    }

    // TS narrowing: без программы вуз уже отфильтрован выше
    if (!program) continue;

    // Взвешенная оценка по осям
    const candidateScore = total;
    const price =
      program.tuitionPerYear ?? (uni.tuitionRange.min + uni.tuitionRange.max) / 2;
    const priceScore = Math.max(0, 100 - Math.round(price / 40000));
    const cityScore = profile.regionPref === "any" ? 85 : regionMatches(profile.regionPref, uni.city) ? 100 : 40;
    const campusScore = (uni.dormitory ? 60 : 0) + (uni.sportFacilities ? 20 : 0) + (uni.library ? 20 : 0);
    const employmentScore = Math.round(uni.employmentRate6m * 100);
    const isAffordableForGrant = profile.studyBudget === "grant";

    const weighted =
      weights.rating * uni.rating +
      weights.price * priceScore +
      weights.city * cityScore +
      weights.campus * campusScore +
      weights.employment * employmentScore +
      weights.science * (uni.scienceIndex ?? 40);

    // Учесть реалистичность баллов
    const threshold = program.grantMinScore ?? uni.minEntScore;
    const margin = candidateScore - threshold;
    const safetyBoost = margin >= 10 ? 8 : margin >= 0 ? 3 : -12;

    let score = Math.round(Math.min(weighted + safetyBoost, 100));
    score = Math.max(score, 0);

    const category: MatchResult["matchCategory"] =
      margin >= 10 ? "safety" : margin >= 0 ? "match" : "reach";

    const reasons: string[] = [];
    reasons.push(createReason("rating", profile, uni));
    if (isAffordableForGrant && margin >= 0)
      reasons.push(`Твой прогноз ${total} ${margin >= 0 ? "проходит" : "не дотягивает"} на грант (мин. ${threshold})`);
    if (profile.needsDorm && uni.dormitory)
      reasons.push("Есть общежитие");
    if (uni.militaryDept && profile.needsMilitaryDept)
      reasons.push("Есть военная кафедра");
    if (employmentScore >= 85) reasons.push(`Трудоустройство ~${employmentScore}% за 6 мес`);
    if (reasons.length === 0) reasons.push("Подходит по базовым критериям профиля");

    results.push({
      university: uni,
      program,
      score,
      matchCategory: category,
      reasons,
      blockers: [],
      eligible: true,
    });
  }

  return results
    .sort((a, b) => (a.eligible === b.eligible ? b.score - a.score : a.eligible ? -1 : 1))
    .slice(0, 10);
}

function createReason(axis: PriorityKey, profile: ApplicantProfile, uni: University): string {
  switch (axis) {
    case "rating":
      return `Рейтинг ${uni.rating}/100 (${uni.kinds.includes("national") ? "нац. вуз" : "частный/межд."})`;
    case "employment":
      return `Трудоустройство ~${Math.round(uni.employmentRate6m * 100)}%`;
    case "science":
      return `Научный индекс ${uni.scienceIndex ?? "—"}`;
    case "city":
      return `Город ${uni.city}`;
    case "campus":
      return uni.dormitory ? "Есть общежитие и кампус" : "Кампус без общежития";
    default:
      return `Стоимость от ${Intl.NumberFormat("ru-RU").format(uni.tuitionRange.min)} ₸/год`;
  }
}