// Роль: ROADMAP/DATA (ветка B)
// Календарь приёмной кампании. Все даты — ДЕМО и требуют проверки по официальным источникам.

import type { Profile } from "../lib/store/types";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  source: string;
  demo: boolean;
}

const VERIFY = "[проверить год и дату: testcenter.kz / nu.edu.kz / ucas.com]";

// Даты из docs/adaptive_flow.md — ни одна не подтверждена официально.
export const CALENDAR: CalendarEvent[] = [
  { id: "ent-jan", title: "ЕНТ (платно, январь)", start: "2027-01-01", source: VERIFY, demo: true },
  { id: "ent-mar", title: "ЕНТ (платно, март)", start: "2027-03-01", source: VERIFY, demo: true },
  {
    id: "ent-main",
    title: "ЕНТ основная сессия (грант, 2 попытки)",
    start: "2027-05-01",
    end: "2027-07-31",
    source: VERIFY,
    demo: true,
  },
  { id: "ent-aug", title: "ЕНТ (платно, август)", start: "2027-08-01", source: VERIFY, demo: true },
  {
    id: "nu-open",
    title: "NU: открытие подачи (цикл 2027/2028)",
    start: "2026-09-27",
    source: VERIFY,
    demo: true,
  },
  {
    id: "nu-close",
    title: "NU: закрытие подачи (граждане РК)",
    start: "2027-08-17",
    source: VERIFY,
    demo: true,
  },
  { id: "ucas-oxbridge", title: "UCAS Oxbridge: дедлайн", start: "2026-10-15", source: VERIFY, demo: true },
  { id: "ucas-main", title: "UCAS: основной дедлайн", start: "2027-01-29", source: VERIFY, demo: true },
];

export function eventsFor(profile: Profile, now: Date): CalendarEvent[] {
  const inKzBranch = profile.route !== "abroad";
  const wantsNu =
    inKzBranch &&
    (profile.kz?.interestedInNu === true ||
      profile.exams.ielts !== undefined ||
      profile.exams.nuet !== undefined);
  const wantsUcas =
    profile.isNis === true && (profile.abroad?.countries ?? []).includes("uk");

  return CALENDAR.filter((event) => {
    const effectiveEnd = new Date(event.end ?? event.start).getTime();
    if (effectiveEnd < now.getTime()) return false; // прошедшие события не показываем
    if (event.id.startsWith("ent-")) return inKzBranch;
    if (event.id.startsWith("nu-")) return wantsNu;
    if (event.id.startsWith("ucas-")) return wantsUcas;
    return false;
  });
}
