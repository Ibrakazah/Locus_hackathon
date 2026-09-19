import type { Profile } from '@/lib/types';

// Персоны из docs/personas.txt под псевдонимами, без реальных имён.
// Неизвестные экзамены персоны 3 не заполняем (undefined) — движок ставит gap missing_exam.
export interface Persona {
  id: string;
  label: string;
  hint: string;
  profile: Profile;
}

function base(over: Partial<Profile>): Profile {
  return {
    route: 'kz', grade: 11, fields: ['undecided'], funding: 'grant_or_contract',
    priority: 'cost', city: null, interests: [], abroadCountries: [], budgetUsd: null,
    ent: { status: 'not_taken', score: null, profile: null },
    ielts: { status: 'not_taken', score: null },
    toefl: { status: 'not_taken', score: null },
    sat: { status: 'not_taken', score: null },
    act: { status: 'not_taken', score: null },
    nuet: { status: 'not_taken', score: null },
    isNis: false, interestedInNu: false, gpa: null, language: 'any', quota: 'unsure', foundationOk: false,
    ...over,
  };
}

export const PERSONAS: Persona[] = [
  {
    id: 'persona-chem', label: 'Химия и медицина',
    hint: 'Олимпиады, дебаты, SAT 1560 · US/UK',
    profile: base({
      route: 'abroad', grade: 11, fields: ['medicine', 'science'], funding: 'grant_or_contract',
      priority: 'prestige', abroadCountries: ['US', 'UK'], budgetUsd: 30000,
      sat: { status: 'taken', score: 1560 },
      ielts: { status: 'taken', score: 7.5, sections: { listening: 8, reading: 7.5, writing: 7, speaking: 7.5 } },
      gpa: 4.8, interests: ['olympiad', 'debate', 'volunteering'],
    }),
  },
  {
    id: 'persona-robotics', label: 'Робототехника',
    hint: 'FIRST, проекты, SAT 1480 · US/Турция',
    profile: base({
      route: 'abroad', grade: 11, fields: ['it'], funding: 'grant_or_contract',
      priority: 'cost', abroadCountries: ['US', 'TR'], budgetUsd: 15000,
      sat: { status: 'taken', score: 1480 },
      ielts: { status: 'taken', score: 7.0, sections: { listening: 7, reading: 7, writing: 6.5, speaking: 7 } },
      gpa: 4.6, interests: ['robotics', 'first', 'projects'],
    }),
  },
  {
    id: 'persona-leadership', label: 'Лидерство и бизнес',
    hint: 'Без сданных экзаменов · UK/Турция',
    profile: base({
      route: 'abroad', grade: 10, fields: ['business', 'humanities'], funding: 'grant_or_contract',
      priority: 'language', abroadCountries: ['UK', 'TR'], budgetUsd: 10000,
      // sat/ielts намеренно undefined — движок ставит missing_exam
      gpa: null, interests: ['leadership', 'volunteering'],
    }),
  },
];
