// Роль: DATA
// Типы данных по вузам Казахстана.
// Группы образовательных программ соответствуют КТА (классификатор 2026).

export type UniversityKind =
  | "national" // национальные ОВПО (порог 65+)
  | "international" // международные (NU)
  | "research"
  | "classical"
  | "technical"
  | "medical"
  | "pedagogical";

/** Группа образовательных программ для ЕНТ / грантов */
export const PROGRAM_GROUPS = {
  pedagogical: "6B01 Педагогические науки",
  it: "6B06 Информационно-коммуникационные технологии",
  engineering: "6B07 Инженерные, обрабатывающие и строительные отрасли",
  science: "6B05 Естественные науки, математика и статистика",
  humanities: "6B02 Искусство и гуманитарные науки",
  social: "6B03 Социальные науки, журналистика и информация",
  health: "6B09 Здравоохранение и социальное обеспечение",
  agriculture: "6B10 Сельское хозяйство и биоресурсы",
  business: "6B04 Бизнес, управление и право",
  services: "6B11 Услуги",
} as const;

export type ProgramGroup = keyof typeof PROGRAM_GROUPS;

export interface Program {
  code: string;
  name: string;
  group: ProgramGroup;
  /** Профильные предметы ЕНТ для участия в конкурсе */
  profileSubjects: string[];
  years: number;
  grantMinScore?: number;
  paidMinScore?: number;
  tuitionPerYear?: number;
}

export interface Deadline {
  label: string;
  start?: string;
  end: string;
  source: string;
  notes?: string;
}

export interface University {
  id: string;
  name: string;
  nameKz: string;
  nameEn: string;
  short: string;
  city: string;
  region: string;
  kinds: UniversityKind[];
  website: string;
  foundingYear: number;
  rating: number;
  accreditation: boolean;
  /** Порог участия (по Типовым правилам приёма) */
  minEntScore: number;
  admissionExams: string[];
  grantPlaces: number;
  hasContract: boolean;
  tuitionRange: { min: number; max: number };
  dormitory: boolean;
  dormitoryCost?: number;
  library: boolean;
  sportFacilities: boolean;
  militaryDept: boolean;
  /** Доля трудоустройства выпускников за 6 мес, 0..1 */
  employmentRate6m: number;
  scienceIndex?: number;
  programs: Program[];
  deadlines: Deadline[];
  sourceUpdated: string;
}