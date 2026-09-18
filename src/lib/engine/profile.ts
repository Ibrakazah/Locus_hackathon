// Роль: ENGINE
// Типы профиля абитуриента. Чистые данные — сериализуются между server/client.

export type StudyBudget = "both" | "grant" | "contract";

export type CareerField =
  | "it"
  | "medicine"
  | "engineering"
  | "education"
  | "humanities"
  | "law"
  | "agriculture"
  | "business"
  | "creative"
  | "science";

export type RegionPref = "any" | "almaty" | "astana" | "other";

export interface EntScores {
  math: number;
  reading: number;
  history: number;
  profile1: number;
  profile2: number;
  /** true — реальные баллы, false — прогноз для подготовки */
  isEstimate: boolean;
}

export type PriorityKey =
  | "rating"
  | "price"
  | "city"
  | "campus"
  | "employment"
  | "science";

export const PRIORITY_LABELS: Record<PriorityKey, string> = {
  rating: "Рейтинг вуза",
  price: "Стоимость обучения",
  city: "Город",
  campus: "Кампус и общежитие",
  employment: "Трудоустройство",
  science: "Наука и исследования",
};

export interface ApplicantProfile {
  grade: 9 | 10 | 11 | 12;
  city: string;
  language: "kk" | "ru";
  entScores: EntScores;
  careerField: CareerField;
  studyBudget: StudyBudget;
  priorities: Record<PriorityKey, number>; // 0..100
  regionPref: RegionPref;
  needsDorm: boolean;
  needsMilitaryDept: boolean;
  skills: string[];
}

export const EMPTY_PROFILE: ApplicantProfile = {
  grade: 11,
  city: "",
  language: "ru",
  entScores: { math: 0, reading: 0, history: 0, profile1: 0, profile2: 0, isEstimate: true },
  careerField: "it",
  studyBudget: "both",
  priorities: {
    rating: 70,
    price: 50,
    city: 50,
    campus: 50,
    employment: 60,
    science: 40,
  },
  regionPref: "any",
  needsDorm: false,
  needsMilitaryDept: false,
  skills: [],
};

export function entTotal(scores: EntScores): number {
  return scores.math + scores.reading + scores.history + scores.profile1 + scores.profile2;
}