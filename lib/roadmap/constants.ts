// Роль: ROADMAP (ветка B)
// Константы сроков и датозависимых правил.

export const LEAD_EXAM_DAYS = 90;
export const LEAD_DOCS_DAYS = 60;
export const LEAD_APPLY_DAYS = 30;

// Демо-даты (совпадают с data/calendar.ts). TODO(B): брать из календаря/Program после A.
export const NU_OPEN = "2026-09-27";
export const UCAS_OXBRIDGE = "2026-10-15";

export function daysBefore(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** ISO-остаток дней от now до даты (>=0). */
export function daysUntil(now: Date, iso: string): number {
  const target = new Date(`${iso}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((target - now.getTime()) / 86_400_000));
}
