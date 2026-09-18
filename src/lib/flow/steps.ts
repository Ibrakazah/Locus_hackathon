// Роль: FLOW
// Описание шагов визарда. Чистая конфигурация — рендером занимается UI.
// Порядок вопросов построен по правилам приёма в РК: сначала «кто ты»,
// затем баллы ЕНТ + комбинация профильных предметов, направление,
// финансирование (грант/платно/квота) и ограничения.

export type StepKey =
  | "profile"
  | "scores"
  | "career"
  | "budget"
  | "constraints";

export interface StepConfig {
  key: StepKey;
  title: string;
  subtitle: string;
  /** Поля, обязательные для перехода дальше */
  requiredFields: string[];
}

export const STEPS: StepConfig[] = [
  {
    key: "profile",
    title: "Кто ты",
    subtitle: "Класс, город и язык обучения",
    requiredFields: ["city", "grade"],
  },
  {
    key: "scores",
    title: "Баллы ЕНТ",
    subtitle: "Сумма до 140 + комбинация профильных предметов",
    requiredFields: ["entScores.combo"],
  },
  {
    key: "career",
    title: "Направление подготовки",
    subtitle: "Группа образовательных программ под твои предметы",
    requiredFields: ["careerField"],
  },
  {
    key: "budget",
    title: "Грант или платно",
    subtitle: "Финансирование, квота и потолок оплаты",
    requiredFields: ["studyBudget"],
  },
  {
    key: "constraints",
    title: "Ограничения",
    subtitle: "Регион, общежитие, военная кафедра",
    requiredFields: ["regionPref"],
  },
];

export const STEP_INDEX: Record<StepKey, number> = {
  profile: 0,
  scores: 1,
  career: 2,
  budget: 3,
  constraints: 4,
};

/** Для каждого шага — список полей профиля, которые он заполняет (для прогресса). */
export const STEP_FIELDS: Record<StepKey, string[]> = {
  profile: ["city", "grade", "language"],
  scores: ["entScores"],
  career: ["careerField"],
  budget: ["studyBudget", "quota", "paidBudget"],
  constraints: ["regionPref", "needsDorm", "needsMilitaryDept"],
};