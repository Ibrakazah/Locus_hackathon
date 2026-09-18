// Роль: ROADMAP (ветка B)
// ЗАГЛУШКА recommend() на время отсутствия ветки A.
// TODO(B): удалить после слияния A; импортировать recommend из lib/engine.

import type { Recommendation } from "../store/types";

export function recommendStub(): Recommendation[] {
  return [
    {
      programId: "nu-regular-cs",
      admissionFit: "fits",
      grantNote: "Грант: проходные баллы прошлого года — проверить",
      reasons: [
        "IELTS закрывает порог NU Regular (6.0)",
        "GPA выше минимума 4.0/5.0",
        "Совпадает с направлением IT",
      ],
      gaps: [],
      sortScore: 0.92,
      reach: true,
    },
    {
      programId: "kbtu-cs",
      admissionFit: "close",
      reasons: ["Профиль подходит по направлению", "Нужно уточнить требования к SAT/IELTS"],
      gaps: [{ type: "missing_exam", description: "Проверить требование IELTS/SAT для KBTU" }],
      sortScore: 0.74,
      reach: false,
    },
    {
      programId: "kaznu-it",
      admissionFit: "fits",
      grantNote: "Грант: по данным прошлого года проходной был выше порога [демо-данные]",
      reasons: ["ЕНТ выше порога 65 для национальных вузов", "Комбинация math-physics открывает IT"],
      gaps: [],
      sortScore: 0.7,
      reach: false,
    },
  ];
}
