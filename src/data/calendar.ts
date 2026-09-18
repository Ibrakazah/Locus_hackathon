// Календарь. Всё demo:true + [проверить год и дату].
export interface CalendarEvent {
  id: string;
  label: string;
  date: string; // ISO
  source: string;
  demo: boolean;
}

export const CALENDAR: CalendarEvent[] = [
  { id: 'ent-jan', label: 'ЕНТ январская сессия (платно)', date: '2027-01-15T00:00:00+06:00', source: 'testcenter.kz', demo: true },
  { id: 'ent-mar', label: 'ЕНТ мартовская сессия (платно)', date: '2027-03-10T00:00:00+06:00', source: 'testcenter.kz', demo: true },
  { id: 'ent-main', label: 'ЕНТ основная сессия (грант, 2 попытки)', date: '2027-05-15T00:00:00+06:00', source: 'testcenter.kz', demo: true },
  { id: 'nu-opens', label: 'NU: открытие приёма', date: '2026-09-27T00:00:00+06:00', source: 'https://nu.edu.kz/admissions', demo: true },
  { id: 'nu-closes', label: 'NU: закрытие приёма (граждане РК)', date: '2027-08-17T14:00:00+06:00', source: 'https://nu.edu.kz/admissions', demo: true },
  { id: 'ucas-oxbridge', label: 'UCAS Oxbridge дедлайн', date: '2026-10-15T00:00:00+01:00', source: 'https://www.ucas.com', demo: true },
];

export function daysUntil(from: Date, iso: string): number {
  const ms = new Date(iso).getTime() - from.getTime();
  return Math.ceil(ms / 86400000);
}
