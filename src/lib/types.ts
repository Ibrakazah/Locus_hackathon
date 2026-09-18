// Источник правды. Контракт веток A/B/C. Чистые типы, без логики.
export type Country = 'KZ' | 'US' | 'UK' | 'TR' | 'KR' | 'OTHER';
export type Route = 'kz' | 'abroad' | 'undecided';
export type Grade = 9 | 10 | 11 | 'graduate';
export type Funding = 'grant_only' | 'grant_or_contract' | 'contract_ok';
export type Field =
  | 'medicine' | 'it' | 'business' | 'law'
  | 'humanities' | 'science' | 'creative' | 'undecided';
export type Priority = 'prestige' | 'cost' | 'language';
export type ExamStatus = 'taken' | 'trial' | 'not_taken';
export type ExamKind = 'ent' | 'ielts' | 'toefl' | 'sat' | 'act' | 'nuet' | 'nis' | 'none';
export type ProgramTrack = 'ent' | 'ielts_gpa' | 'sat' | 'nuet' | 'nufyp';
export type Intake = 'regular' | 'midyear' | 'nondegree';
export type MatchLevel = 'fits' | 'close' | 'fails';
export type GapType =
  | 'score_gap' | 'exam_planned' | 'subject_mismatch' | 'missing_exam'
  | 'funding_gap' | 'budget_gap' | 'activity_gap' | 'timeline_ok' | 'deadline_alert';
export type TaskKind = 'exam' | 'documents' | 'application' | 'finance' | 'info';

export interface ExamResult {
  status: ExamStatus;
  score: number | null; // not_taken => null, никогда 0
  sections?: Partial<Record<string, number | null>>; // IELTS: listening/reading/writing/speaking; NUET: math/critical; UNT: math_lit/reading/history
  plannedDate?: string | null; // ISO, для not_taken
}

export interface Profile {
  route: Route;
  grade: Grade | null;
  fields: Field[];
  funding: Funding;
  priority?: Priority;
  city?: string | null; // только фильтр UI, не входит в формулу
  interests?: string[]; // теги активностей, только для reasons
  abroadCountries?: Country[];
  budgetUsd?: number | null;
  ent?: ExamResult & { profile?: string | null };
  ielts?: ExamResult;
  toefl?: ExamResult;
  sat?: ExamResult;
  act?: ExamResult;
  nuet?: ExamResult;
  isNis?: boolean;
  interestedInNu?: boolean;
  gpa?: number | null; // шкала 5.0
  language?: 'kz' | 'ru' | 'en' | 'any';
  quota?: 'yes' | 'no' | 'unsure';
  foundationOk?: boolean;
}

export interface University {
  id: string;
  name: string;
  city: string;
  country: Country;
  website?: string;
  source: string; // URL либо 'Google Sheets команды'
  demo: boolean; // true => непроверенное, показывать бейдж
}

export interface IeltsMin {
  overall: number;
  kind: 'minimum' | 'typical'; // typical: ниже => close, не fails
  writing?: number;
  sectionsMin?: number;
}

export interface Program {
  id: string;
  universityId: string;
  title: string;
  track: ProgramTrack;
  intake: Intake;
  opensAt: string | null; // ISO
  closesAt: string | null; // ISO
  intakeYear: number;
  language: 'kz' | 'ru' | 'en' | 'multi';
  city: string;
  country: Country;
  fields: Field[];
  tuitionPerYear: number; // USD для зарубеж, KZT для KZ — см. currency
  currency: 'KZT' | 'USD';
  reach: boolean; // конкурсный holistic-приём: совпадение != шанс
  grantPassScore?: { score: number; year: number; demo: boolean };
  admission: {
    entMin?: number;
    ieltsMin?: IeltsMin;
    toeflMin?: number;
    satMin?: number;
    actMin?: number;
    nuetMin?: { total: number; each: number };
    nisMin?: string; // 'ABB' | 'BBB'
    gpaMin?: number; // шкала 5.0
    untMin?: number;
  };
  source: string;
  demo: boolean;
  verified: boolean; // false + [проверить ...] для спорных
  note?: string; // напр. '[проверить nu.edu.kz]'
}

export interface Gap {
  type: GapType;
  description: string;
  roadmapTaskId: string; // `${programId}:${type}`
  source?: string;
}

export interface Recommendation {
  programId: string;
  universityId: string;
  matchLevel: MatchLevel;
  reasons: string[];
  gaps: Gap[];
  reach: boolean;
  sortScore: number; // 0..1
  grantNote: string; // строка про грант без галочки
}

export interface RoadmapTask {
  id: string; // `${programId}:${gap.type}` или `base:...`
  programId: string | null;
  title: string;
  deadline: string | null; // ISO
  kind: TaskKind;
  done: boolean;
  source: string; // URL или '[демо-данные]'
}

export interface RankChange {
  programId: string;
  from: number; // индекс в before, -1 если не было
  to: number; // индекс в after, -1 если выпала
  reason: string;
}

// Сигнатуры контракта:
// recommend(profile, catalog, now): Recommendation[]
// buildRoadmap({ profile, goal, prev, now }): RoadmapTask[]
// nextStep(tasks): RoadmapTask | null
// diffRankings(before, after, changed?): RankChange[]
