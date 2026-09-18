import type { Profile, Recommendation } from './types';
import { CATALOG, getUniversity } from '@/data/catalog';

export function diagnosis(profile: Profile, recs: Recommendation[]): { strengths: string[]; limits: string[]; goal: string } {
  const strengths: string[] = [];
  const limits: string[] = [];
  if (profile.ent?.score != null) strengths.push(`ЕНТ ${profile.ent.score} — есть база для сравнения с порогом`);
  else limits.push('ЕНТ не сдан — сначала регистрация и пробный');
  if (profile.ielts?.score != null) strengths.push(`IELTS ${profile.ielts.score} — открывает NU и зарубежные треки`);
  else if (profile.interestedInNu) limits.push('Для NU нужен IELTS или NUET');
  if (profile.gpa != null) strengths.push(`GPA ${profile.gpa}/5.0 заполнен`);
  const fits = recs.filter((r) => r.matchLevel === 'fits').length;
  if (fits > 0) strengths.push(`${fits} вариант(а) проходишь по порогу`);
  else limits.push('Пока нет fits — работаем через close-варианты и подготовку');
  if (profile.budgetUsd != null) strengths.push(`Бюджет $${profile.budgetUsd.toLocaleString('ru-RU')}/год задан — фильтр честный`);
  const top = recs[0];
  const topName = top ? programName(top) : null;
  const goal = topName ? `Цель: ${topName} — ${top!.matchLevel === 'fits' ? 'проходишь порог' : top!.matchLevel === 'close' ? 'близко, нужен рывок' : 'пока не проходишь, нужен план Б'}.` : 'Цель пока не выбрана.';
  return { strengths, limits, goal };
}

function programName(r: Recommendation): string {
  const p = CATALOG.find((x) => x.id === r.programId);
  const u = getUniversity(r.universityId);
  return u ? `${u.name} — ${p?.title ?? r.programId}` : r.programId;
}
