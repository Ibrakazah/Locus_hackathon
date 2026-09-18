// Роль: ENGINE
// Типы профиля абитуриента. Чистые данные — сериализуются между server/client.
// Критерии приведены по Типовым правилам приёма в ОВПО РК (ЕНТ-2026).

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

/** Класс / путь абитуриента по состоянию на текущий учебный год */
export type Grade = "10" | "11" | "college" | "adult";

export const GRADE_LABELS: Record<Grade, string> = {
  "10": "10 класс (поступлю через год)",
  "11": "11 класс — выпускник",
  college: "Колледж (сокращённая программа)",
  adult: "Выпускник прошлых лет",
};

/** 13 официальных комбинаций профильных предметов ЕНТ */
export type EntComboKey =
  | "math-phys"
  | "bio-chem"
  | "math-info"
  | "kk-lit"
  | "ru-lit"
  | "lang-history"
  | "bio-geo"
  | "math-geo"
  | "history-law"
  | "history-geo"
  | "geo-lang"
  | "chem-phys"
  | "creative";

export interface EntCombo {
  key: EntComboKey;
  label: string;
  /** Направления, для которых эта комбинация типична */
  fields: CareerField[];
}

export const ENT_COMBOS: EntCombo[] = [
  { key: "math-phys", label: "Математика + Физика", fields: ["engineering", "science"] },
  { key: "bio-chem", label: "Биология + Химия", fields: ["medicine", "agriculture", "science"] },
  { key: "math-info", label: "Математика + Информатика", fields: ["it", "engineering", "science"] },
  { key: "kk-lit", label: "Казахский язык + Казахская литература", fields: ["education", "humanities"] },
  { key: "ru-lit", label: "Русский язык + Русская литература", fields: ["education", "humanities"] },
  { key: "lang-history", label: "Иностранный язык + Всемирная история", fields: ["business", "humanities", "law"] },
  { key: "bio-geo", label: "Биология + География", fields: ["agriculture", "education", "science"] },
  { key: "math-geo", label: "Математика + География", fields: ["engineering", "agriculture"] },
  { key: "history-law", label: "Всемирная история + Основы права", fields: ["law", "business"] },
  { key: "history-geo", label: "Всемирная история + География", fields: ["humanities", "business"] },
  { key: "geo-lang", label: "География + Иностранный язык", fields: ["business", "humanities"] },
  { key: "chem-phys", label: "Химия + Физика", fields: ["engineering", "science"] },
  { key: "creative", label: "Творческий экзамен (2 профильных)", fields: ["creative"] },
];

export function comboByKey(key: EntComboKey): EntCombo {
  return ENT_COMBOS.find((c) => c.key === key) as EntCombo;
}

/** Категория квоты при присуждении гранта (по Типовым правилам) */
export type QuotaKey = "none" | "village" | "orphan" | "disability" | "other";

export const QUOTA_LABELS: Record<QuotaKey, string> = {
  none: "Нет льгот",
  village: "Выпускник сельской школы",
  orphan: "Ребёнок-сирота / без попечения родителей",
  disability: "Лицо с инвалидностью",
  other: "Другая льготная категория",
};

export interface EntScores {
  math: number; // мат. грамотность, 0..10
  reading: number; // грамотность чтения, 0..10
  history: number; // история Казахстана, 0..20
  profile1: number; // профильный предмет 1, 0..50
  profile2: number; // профильный предмет 2, 0..50
  combo: EntComboKey; // выбранная комбинация профильных предметов
  /** true — прогноз/желаемые баллы, false — реальные баллы сертификата */
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
  grade: Grade;
  city: string;
  language: "kk" | "ru";
  entScores: EntScores;
  careerField: CareerField;
  studyBudget: StudyBudget;
  /** Право на квоту при конкурсе грантов */
  quota: QuotaKey;
  /** Максимум, который готов платить в год, ₸ (для платного) */
  paidBudget: number | null;
  priorities: Record<PriorityKey, number>; // 0..100
  regionPref: RegionPref;
  needsDorm: boolean;
  needsMilitaryDept: boolean;
}

export const EMPTY_PROFILE: ApplicantProfile = {
  grade: "11",
  city: "",
  language: "ru",
  entScores: {
    math: 0,
    reading: 0,
    history: 0,
    profile1: 0,
    profile2: 0,
    combo: "math-info",
    isEstimate: true,
  },
  careerField: "it",
  studyBudget: "both",
  quota: "none",
  paidBudget: null,
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
};

/** Максимум по каждому блоку ЕНТ */
export const ENT_MAX: Record<keyof Pick<EntScores, "math" | "reading" | "history" | "profile1" | "profile2">, number> = {
  math: 10,
  reading: 10,
  history: 20,
  profile1: 50,
  profile2: 50,
};

/** Минимальный балл по предмету, ниже которого результат не допускается к конкурсу */
export const ENT_MIN: Record<keyof Pick<EntScores, "math" | "reading" | "history" | "profile1" | "profile2">, number> = {
  math: 3,
  reading: 3,
  history: 5,
  profile1: 5,
  profile2: 5,
};

export const MAX_ENT = 140;

export function entTotal(scores: EntScores): number {
  return scores.math + scores.reading + scores.history + scores.profile1 + scores.profile2;
}

/** Закрыты ли минимумы по отдельным блокам (обязательное условие конкурса) */
export function entMinsOk(scores: EntScores): boolean {
  return (
    scores.math >= ENT_MIN.math &&
    scores.reading >= ENT_MIN.reading &&
    scores.history >= ENT_MIN.history &&
    scores.profile1 >= ENT_MIN.profile1 &&
    scores.profile2 >= ENT_MIN.profile2
  );
}

/** Повышенный порог по направлению подготовки (2026): педагогика и право 75, медицина 70 */
export function directionThreshold(field: CareerField): number {
  switch (field) {
    case "education":
    case "law":
      return 75;
    case "medicine":
      return 70;
    default:
      return 0;
  }
}