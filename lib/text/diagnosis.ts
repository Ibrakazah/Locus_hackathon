// Роль: TEXT (ветка B)
// Детерминированная диагностика профиля. Без LLM.

import type { Field, Funding, Profile, Recommendation, Route } from "../store/types";

export interface Diagnosis {
  strengths: string[];
  limits: string[];
  goal: string;
}

const FIELD_LABEL: Record<Field, string> = {
  medicine: "Медицина",
  it: "IT",
  business: "Бизнес",
  law: "Право",
  humanities: "Гуманитарные науки",
  science: "Естественные науки",
  creative: "Творческие направления",
  undecided: "направление не выбрано",
};

const ROUTE_LABEL: Record<Route, string> = {
  kz: "в Казахстане",
  abroad: "за рубежом",
  undecided: "в Казахстане или за рубежом",
};

const FUNDING_LABEL: Record<Funding, string> = {
  grant_only: "на грант",
  grant_or_contract: "грант или контракт",
  contract_ok: "на платное",
};

export function diagnosis(profile: Profile, recs: Recommendation[]): Diagnosis {
  const strengths: string[] = [];
  const limits: string[] = [];

  const ielts = profile.exams.ielts;
  if (ielts && ielts.status !== "not_taken") {
    strengths.push(
      ielts.score >= 6
        ? `IELTS ${ielts.score} — закрывает порог NU Regular (6.0)`
        : `IELTS ${ielts.score} — результат есть, но ниже порога NU (6.0)`,
    );
  }

  const ent = profile.exams.ent;
  if (ent && ent.status !== "not_taken") {
    strengths.push(`ЕНТ ${ent.score} — результат есть`);
  }

  if (profile.grade === 11) strengths.push("11 класс: ещё есть время на подготовку");
  if (recs.some((r) => r.reach)) strengths.push("Есть вариант с конкурсным отбором");

  const examKeys = Object.keys(profile.exams) as (keyof Profile["exams"])[];
  if (examKeys.length === 0) {
    limits.push("Экзамены не указаны — нельзя оценить допуск");
  } else {
    const notTaken = examKeys.filter((k) => profile.exams[k]?.status === "not_taken");
    if (notTaken.length) limits.push(`Не сданы экзамены: ${notTaken.join(", ")}`);
  }

  if (profile.fields.length === 0 || profile.fields.includes("undecided")) {
    limits.push("Направление не выбрано");
  }
  if (profile.funding === "grant_only") {
    limits.push("Только грант: проходные баллы конкурса выше порога");
  }

  const field = FIELD_LABEL[profile.fields[0] ?? "undecided"];
  const goal = `Бакалавриат: ${field} ${ROUTE_LABEL[profile.route]} ${FUNDING_LABEL[profile.funding]}`;

  return { strengths, limits, goal };
}
