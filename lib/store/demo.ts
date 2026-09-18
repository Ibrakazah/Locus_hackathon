// Роль: STORE (ветка B) — демонстрационный профиль для кнопки «Попробовать на примере».
// Не персональные данные: обобщённый кейс, чтобы прогнать путь без анкеты.

import type { Profile } from "./types";

export const DEMO_PROFILE: Profile = {
  route: "kz",
  grade: 11,
  fields: ["it"],
  funding: "grant_or_contract",
  priority: "prestige",
  exams: {
    ent: { status: "taken", score: 96 },
    ielts: { status: "taken", score: 6.5 },
  },
  kz: {
    entProfile: "math-physics",
    interestedInNu: true,
    gpa: 4.7,
    language: "ru",
    quota: "no",
  },
};
