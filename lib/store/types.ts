// Роль: STORE (ветка B)
// ВРЕМЕННОЕ зеркало контракта до слияния ветки A (lib/types/index.ts).
// TODO(B): после мержа A удалить этот файл и импортировать типы из lib/types.

export type Route = "kz" | "abroad" | "undecided";
export type Grade = 9 | 10 | 11 | "graduate";
export type Funding = "grant_only" | "grant_or_contract" | "contract_ok";
export type Priority = "prestige" | "cost" | "language"; // 'distance' убран: нет входных данных
export type Field =
  | "medicine"
  | "it"
  | "business"
  | "law"
  | "humanities"
  | "science"
  | "creative"
  | "undecided";

export type ExamKind = "ent" | "ielts" | "toefl" | "sat" | "act" | "nuet";

// Объединение: «не сдавал, 90 баллов» невозможно
export type ExamResult =
  | { status: "not_taken"; plannedDate?: string }
  | {
      status: "taken" | "trial";
      score: number;
      date?: string;
      sections?: Partial<Record<string, number>>;
    };

export type BudgetRange = "lt5k" | "5to15k" | "15to30k" | "gt30k";

// Комбинации профильных предметов ЕНТ (adaptive_flow, [проверить testcenter.kz])
export type EntProfileCombo =
  | "math-physics"
  | "math-informatics"
  | "math-geography"
  | "bio-chem"
  | "bio-geography"
  | "lang-worldhistory"
  | "worldhistory-law"
  | "worldhistory-geography"
  | "kazlit"
  | "ruslit"
  | "chem-physics"
  | "creative";

export interface Profile {
  route: Route;
  grade: Grade | null;
  fields: Field[];
  funding: Funding;
  priority?: Priority;
  exams: Partial<Record<ExamKind, ExamResult>>;
  isNis?: boolean;
  interests?: string[];
  kz?: {
    entProfile?: EntProfileCombo | null;
    interestedInNu?: boolean;
    gpa?: number | null;
    language?: "kz" | "ru" | "en" | "any";
    quota?: "yes" | "no" | "unsure";
  };
  abroad?: {
    countries: string[];
    gpa?: number | null;
    foundationOk?: boolean;
    budgetUsd?: BudgetRange;
  };
}

export const EMPTY_PROFILE: Profile = {
  route: "kz",
  grade: null,
  fields: [],
  funding: "grant_or_contract",
  exams: {},
};

export type GapType =
  | "score_gap"
  | "exam_planned"
  | "subject_mismatch"
  | "missing_exam"
  | "funding_gap"
  | "budget_gap"
  | "deadline_alert";

export interface Gap {
  type: GapType;
  description: string;
  source?: string;
}

export type AdmissionFit = "fits" | "close" | "fails";

export interface Recommendation {
  programId: string;
  admissionFit: AdmissionFit;
  grantNote?: string;
  reasons: string[];
  gaps: Gap[];
  sortScore: number;
  reach: boolean;
}

export type TaskKind =
  | "exam_registration"
  | "study"
  | "documents"
  | "application"
  | "grant"
  | "research";

export interface RoadmapTask {
  id: string;
  title: string;
  deadline?: string;
  plannedDate?: string;
  done: boolean;
  kind: TaskKind;
  source?: string;
  alert?: boolean;
}

export interface RankChange {
  programId: string;
  from: number;
  to: number;
  reason: string;
}
