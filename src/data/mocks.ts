import type { Profile, Program, Recommendation, RoadmapTask } from '@/lib/types';
import { CATALOG } from './catalog';

// Моки для веток B/C до слияния движка. Валидны по lib/types.
export const MOCK_PROFILE: Profile = {
  route: 'kz', grade: 11, fields: ['it'], funding: 'contract_ok',
  priority: 'cost', city: null, interests: ['robotics'],
  abroadCountries: [], budgetUsd: null,
  ent: { status: 'not_taken', score: null, profile: 'math-info' },
  ielts: { status: 'taken', score: 6.5, sections: { listening: 6.5, reading: 6.5, writing: 6.0, speaking: 6.0 } },
  toefl: { status: 'not_taken', score: null },
  sat: { status: 'not_taken', score: null },
  act: { status: 'not_taken', score: null },
  nuet: { status: 'not_taken', score: null },
  isNis: false, interestedInNu: true, gpa: 4.7, language: 'en', quota: 'unsure', foundationOk: false,
};

export const MOCK_PROGRAMS: Program[] = CATALOG.filter((p) =>
  ['nu-cs-regular', 'nu-nufyp', 'kbtu-it', 'sdu-cs', 'aitu-se'].includes(p.id),
);

export const MOCK_RECS: Recommendation[] = [
  {
    programId: 'nu-cs-regular', universityId: 'nu', matchLevel: 'fits',
    reasons: ['IELTS 6.5 проходит порог NU 6.0 (Writing 6.0 закрыт)', 'GPA 4.7 проходит порог 4.0/5.0', 'Английский язык обучения совпадает'],
    gaps: [], reach: false, sortScore: 0.92,
    grantNote: 'Грант NU — отдельный конкурс; проходные баллы прошлых лет — проверить [демо-данные].',
  },
  {
    programId: 'nu-nufyp', universityId: 'nu', matchLevel: 'fits',
    reasons: ['IELTS 6.5 выше порога NUFYP 5.5', 'Запасной маршрут в бакалавриат NU'],
    gaps: [], reach: false, sortScore: 0.85,
    grantNote: 'NUFYP платный ($12,000/год); грант — проверить [демо-данные].',
  },
  {
    programId: 'kbtu-it', universityId: 'kbtu', matchLevel: 'close',
    reasons: ['IT-направление совпадает', 'Алматы — крупный хаб'],
    gaps: [{ type: 'exam_planned', description: 'ЕНТ не сдан — нужна регистрация и цель 65+', roadmapTaskId: 'kbtu-it:exam_planned', source: 'testcenter.kz' }],
    reach: false, sortScore: 0.6,
    grantNote: 'Проходной балл на грант 2025 — проверить [демо-данные].',
  },
  {
    programId: 'sdu-cs', universityId: 'sdu', matchLevel: 'close',
    reasons: ['CS-программа на английском', 'Ниже стоимость контракта'],
    gaps: [{ type: 'exam_planned', description: 'ЕНТ не сдан — цель 50+', roadmapTaskId: 'sdu-cs:exam_planned', source: 'testcenter.kz' }],
    reach: false, sortScore: 0.55,
    grantNote: 'Проходной балл на грант 2025 — проверить [демо-данные].',
  },
  {
    programId: 'aitu-se', universityId: 'aitu', matchLevel: 'close',
    reasons: ['Software Engineering в Астане'],
    gaps: [{ type: 'exam_planned', description: 'ЕНТ не сдан — цель 65+', roadmapTaskId: 'aitu-se:exam_planned', source: 'testcenter.kz' }],
    reach: false, sortScore: 0.5,
    grantNote: 'Проходной балл на грант 2025 — проверить [демо-данные].',
  },
];

export const MOCK_TASKS: RoadmapTask[] = [
  { id: 'nu-cs-regular:missing_exam', programId: 'nu-cs-regular', title: 'Подать заявку в NU с 27 сентября 2026', deadline: '2026-09-27T00:00:00+06:00', kind: 'application', done: false, source: 'https://nu.edu.kz/admissions' },
  { id: 'kbtu-it:exam_planned', programId: 'kbtu-it', title: 'Зарегистрироваться на пробный ЕНТ (январь 2027)', deadline: '2026-12-20T00:00:00+06:00', kind: 'exam', done: false, source: 'testcenter.kz' },
  { id: 'base:documents', programId: null, title: 'Собрать документы: удостоверение, фото, аттестат', deadline: '2027-05-01T00:00:00+06:00', kind: 'documents', done: false, source: '[демо-данные]' },
];
