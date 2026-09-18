// Роль: FLOW
// Описание шагов визарда. Чистая конфигурация — рендером занимается UI.

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
    title: "О себе",
    subtitle: "Класс, город и язык обучения",
    requiredFields: ["city"],
  },
  {
    key: "scores",
    title: "Баллы ЕНТ",
    subtitle: "Реальные или прогноз — честность важна",
    requiredFields: [],
  },
  {
    key: "career",
    title: "Направление",
    subtitle: "Куда хочешь расти?",
    requiredFields: [],
  },
  {
    key: "budget",
    title: "Бюджет и приоритеты",
    subtitle: "Грант или контракт, что важнее всего",
    requiredFields: [],
  },
  {
    key: "constraints",
    title: "Ограничения",
    subtitle: "Регион, общежитие, военная кафедра",
    requiredFields: [],
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
  career: ["careerField", "skills"],
  budget: ["studyBudget", "priorities"],
  constraints: ["regionPref", "needsDorm", "needsMilitaryDept"],
};