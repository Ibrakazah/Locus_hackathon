// Роль: ROADMAP (ветка B)
// Таблица Gap → задача (docs/adaptive_flow.md, §13.4).

import type { Gap, Profile, TaskKind } from "../store/types";

export interface GapTaskSpec {
  title: string;
  kind: TaskKind;
  alert?: boolean;
  plannedDate?: string;
}

function firstNotTakenPlannedDate(profile: Profile): string | undefined {
  for (const result of Object.values(profile.exams)) {
    if (result && result.status === "not_taken" && result.plannedDate) {
      return result.plannedDate;
    }
  }
  return undefined;
}

export function gapTaskSpec(gap: Gap, profile: Profile): GapTaskSpec {
  switch (gap.type) {
    case "exam_planned": {
      const planned = firstNotTakenPlannedDate(profile);
      return {
        title: planned
          ? `Зарегистрироваться на экзамен к ${planned}`
          : "Зарегистрироваться на экзамен",
        kind: "exam_registration",
        plannedDate: planned,
      };
    }
    case "score_gap":
      return { title: `Подтянуть балл: ${gap.description}`, kind: "study" };
    case "subject_mismatch":
      return { title: "Сменить комбинацию ЕНТ или направление", kind: "research" };
    case "missing_exam":
      return { title: gap.description, kind: "exam_registration" };
    case "funding_gap":
      return { title: "План подъёма балла или смежные программы", kind: "research" };
    case "budget_gap":
      return { title: "Страны дешевле / стипендии [проверить]", kind: "research" };
    case "deadline_alert":
      return { title: gap.description, kind: "application", alert: true };
  }
}
