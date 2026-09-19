import type { Profile, Recommendation } from './types';
import { CATALOG, getUniversity } from '@/data/catalog';

export const FIELD_LABEL: Record<string, string> = {
  medicine: 'Медицина',
  it: 'IT / Инженерия',
  business: 'Бизнес / Экономика',
  law: 'Право',
  humanities: 'Гуманитарные науки',
  science: 'Естественные науки',
  creative: 'Творческие',
  undecided: 'Не определился',
};

export const LANGUAGE_LABEL: Record<string, string> = {
  kz: 'Казахский',
  ru: 'Русский',
  en: 'Английский',
  multi: 'Несколько языков',
  any: 'Любой',
};

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}

export function diagnosis(profile: Profile, recs: Recommendation[]): { strengths: string[]; limits: string[]; goal: string } {
  const strengths: string[] = [];
  const limits: string[] = [];
  if (profile.ent?.score != null) strengths.push(`ЕНТ ${profile.ent.score} — есть база для сравнения с порогом`);
  else limits.push('ЕНТ не сдан — сначала регистрация и пробный');
  if (profile.ielts?.score != null) strengths.push(`IELTS ${profile.ielts.score} — открывает NU и зарубежные треки`);
  else if (profile.interestedInNu) limits.push('Для NU нужен IELTS или NUET');
  if (profile.gpa != null) strengths.push(`GPA ${profile.gpa}/5.0 заполнен`);
  const fits = recs.filter((r) => r.matchLevel === 'fits').length;
  if (fits === 1) strengths.push('1 программа — проходишь по порогу');
  else if (fits >= 2) strengths.push(`${fits} программы — проходишь по порогу`);
  else limits.push('Пока нет подходящих — работаем через close-варианты и подготовку');
  if (profile.budgetUsd != null) strengths.push(`Бюджет $${profile.budgetUsd.toLocaleString('ru-RU')}/год задан — фильтр честный`);
  // Всегда: напоминание, что порог ≠ грант
  limits.push('Порог — это минимум для участия в конкурсе, не гарантия гранта.');
  const top = recs[0];
  const topName = top ? programName(top) : null;
  const matchDesc = top?.matchLevel === 'fits' ? 'ты проходишь порог' : top?.matchLevel === 'close' ? 'ты близко к порогу — нужен рывок' : 'пока не проходишь — нужен план Б';
  const goal = topName ? `Твоя цель — ${topName}. ${matchDesc.charAt(0).toUpperCase() + matchDesc.slice(1)}.` : 'Цель пока не выбрана — заполни анкету.';
  return { strengths, limits, goal };
}

function programName(r: Recommendation): string {
  const p = CATALOG.find((x) => x.id === r.programId);
  const u = getUniversity(r.universityId);
  if (!u) return r.programId;
  const title = p?.title ?? r.programId;
  // Не повторять название вуза, если оно уже есть в начале названия программы
  if (title.toLowerCase().startsWith(u.name.toLowerCase())) return title;
  return `${u.name} — ${title}`;
}
