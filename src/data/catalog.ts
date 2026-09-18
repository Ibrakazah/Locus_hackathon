import type { Program, University } from '@/lib/types';

// Каталог 12 программ. У каждого факта source или demo:true.
// Валюты: KZ — KZT, зарубеж — USD.

export const UNIVERSITIES: University[] = [
  { id: 'nu', name: 'Nazarbayev University', city: 'Астана', country: 'KZ', website: 'https://nu.edu.kz', source: 'https://nu.edu.kz/admissions', demo: false },
  { id: 'kbtu', name: 'KBTU', city: 'Алматы', country: 'KZ', website: 'https://kbtu.edu.kz', source: 'https://kbtu.edu.kz', demo: true },
  { id: 'kimep', name: 'KIMEP', city: 'Алматы', country: 'KZ', source: 'https://www.kimep.kz', demo: true },
  { id: 'sdu', name: 'SDU', city: 'Каскелен', country: 'KZ', source: 'https://sdu.edu.kz', demo: true },
  { id: 'aitu', name: 'Astana IT University', city: 'Астана', country: 'KZ', source: 'https://astanait.edu.kz', demo: true },
  { id: 'metu', name: 'METU Ankara', city: 'Анкара', country: 'TR', source: 'Google Sheets команды', demo: true },
  { id: 'bilkent', name: 'Bilkent Ankara', city: 'Анкара', country: 'TR', source: 'Google Sheets команды', demo: true },
  { id: 'sabanci', name: 'Sabancı Istanbul', city: 'Стамбул', country: 'TR', source: 'Google Sheets команды', demo: true },
  { id: 'koc', name: 'Koç Istanbul', city: 'Стамбул', country: 'TR', source: 'Google Sheets команды', demo: true },
  { id: 'ucl', name: 'UCL', city: 'Лондон', country: 'UK', website: 'https://www.ucl.ac.uk', source: 'https://www.ucl.ac.uk/prospective-students/undergraduate', demo: true },
  { id: 'manchester', name: 'University of Manchester', city: 'Манчестер', country: 'UK', website: 'https://www.manchester.ac.uk', source: 'https://www.manchester.ac.uk/study/undergraduate', demo: true },
  { id: 'mit', name: 'MIT', city: 'Кембридж', country: 'US', website: 'https://mitadmissions.org/apply/firstyear/tests-scores/', source: 'https://mitadmissions.org/apply/firstyear/tests-scores/', demo: false },
  { id: 'asu', name: 'Arizona State University', city: 'Темпе', country: 'US', website: 'https://admission.asu.edu/apply/international/first-year', source: 'https://admission.asu.edu/apply/international/first-year', demo: false },
  { id: 'tulane', name: 'Tulane University', city: 'Новый Орлеан', country: 'US', website: 'https://admission.tulane.edu/international', source: 'https://admission.tulane.edu/international', demo: false },
];

const NU_WINDOW = { opensAt: '2026-09-27T00:00:00+06:00', closesAt: '2027-08-17T14:00:00+06:00', intakeYear: 2027 };

export const CATALOG: Program[] = [
  {
    id: 'nu-cs-regular', universityId: 'nu', title: 'NU Computer Science (Regular IELTS+GPA)',
    track: 'ielts_gpa', intake: 'regular', ...NU_WINDOW, language: 'en', city: 'Астана', country: 'KZ',
    fields: ['it', 'science'], tuitionPerYear: 15000, currency: 'USD', reach: false,
    admission: { ieltsMin: { overall: 6.0, kind: 'minimum', writing: 6.0, sectionsMin: 5.5 }, gpaMin: 4.0, untMin: 85 },
    source: 'https://nu.edu.kz/admissions', demo: false, verified: true,
  },
  {
    id: 'nu-nufyp', universityId: 'nu', title: 'NU Foundation (NUFYP)',
    track: 'nufyp', intake: 'regular', ...NU_WINDOW, language: 'en', city: 'Астана', country: 'KZ',
    fields: ['it', 'science', 'business', 'humanities', 'undecided'], tuitionPerYear: 12000, currency: 'USD', reach: false,
    admission: { ieltsMin: { overall: 5.5, kind: 'minimum', writing: 5.5, sectionsMin: 5.0 }, gpaMin: 3.5, untMin: 75 },
    source: 'https://nu.edu.kz/admissions', demo: false, verified: true,
  },
  {
    id: 'nu-midyear-sat', universityId: 'nu', title: 'NU Mid-year (SAT / NUET, платно)',
    track: 'sat', intake: 'midyear', ...NU_WINDOW, language: 'en', city: 'Астана', country: 'KZ',
    fields: ['it', 'science', 'business'], tuitionPerYear: 15000, currency: 'USD', reach: false,
    admission: { satMin: 1150, actMin: 23, nuetMin: { total: 130, each: 60 } },
    source: 'https://nu.edu.kz/admissions', demo: false, verified: true,
  },
  {
    id: 'nu-regular-sat', universityId: 'nu', title: 'NU Regular (SAT-трек)',
    track: 'sat', intake: 'regular', ...NU_WINDOW, language: 'en', city: 'Астана', country: 'KZ',
    fields: ['it', 'science'], tuitionPerYear: 15000, currency: 'USD', reach: false,
    admission: { satMin: 1240, actMin: 26 },
    source: 'https://nu.edu.kz/admissions', demo: true, verified: false,
    note: '[проверить nu.edu.kz: SAT 1240 в regular vs только mid-year]',
  },
  {
    id: 'kbtu-it', universityId: 'kbtu', title: 'KBTU Информационные системы',
    track: 'ent', intake: 'regular', opensAt: null, closesAt: '2027-07-20T00:00:00+06:00', intakeYear: 2027,
    language: 'en', city: 'Алматы', country: 'KZ', fields: ['it', 'science'],
    tuitionPerYear: 3500000, currency: 'KZT', reach: false,
    admission: { entMin: 65 }, grantPassScore: { score: 110, year: 2025, demo: true },
    source: 'https://kbtu.edu.kz', demo: true, verified: false, note: '[проверить: порог и грант KBTU]',
  },
  {
    id: 'kimep-bba', universityId: 'kimep', title: 'KIMEP BBA',
    track: 'ent', intake: 'regular', opensAt: null, closesAt: '2027-07-20T00:00:00+06:00', intakeYear: 2027,
    language: 'en', city: 'Алматы', country: 'KZ', fields: ['business', 'humanities'],
    tuitionPerYear: 4500000, currency: 'KZT', reach: false,
    admission: { entMin: 50, ieltsMin: { overall: 6.0, kind: 'typical' } },
    source: 'https://www.kimep.kz', demo: true, verified: false, note: '[проверить]',
  },
  {
    id: 'sdu-cs', universityId: 'sdu', title: 'SDU Computer Science',
    track: 'ent', intake: 'regular', opensAt: null, closesAt: '2027-07-20T00:00:00+06:00', intakeYear: 2027,
    language: 'en', city: 'Каскелен', country: 'KZ', fields: ['it', 'science'],
    tuitionPerYear: 2500000, currency: 'KZT', reach: false,
    admission: { entMin: 50 }, grantPassScore: { score: 95, year: 2025, demo: true },
    source: 'https://sdu.edu.kz', demo: true, verified: false, note: '[проверить]',
  },
  {
    id: 'aitu-se', universityId: 'aitu', title: 'AITU Software Engineering',
    track: 'ent', intake: 'regular', opensAt: null, closesAt: '2027-07-20T00:00:00+06:00', intakeYear: 2027,
    language: 'en', city: 'Астана', country: 'KZ', fields: ['it'],
    tuitionPerYear: 2800000, currency: 'KZT', reach: false,
    admission: { entMin: 65 },
    source: 'https://astanait.edu.kz', demo: true, verified: false, note: '[проверить: нац. порог 65]',
  },
  {
    id: 'metu-eng', universityId: 'metu', title: 'METU Engineering',
    track: 'sat', intake: 'regular', opensAt: null, closesAt: '2027-06-01T00:00:00+03:00', intakeYear: 2027,
    language: 'en', city: 'Анкара', country: 'TR', fields: ['it', 'science', 'business'],
    tuitionPerYear: 665, currency: 'USD', reach: false,
    admission: { satMin: 1200, toeflMin: 75 },
    source: 'Google Sheets команды', demo: true, verified: false,
  },
  {
    id: 'bilkent-cs', universityId: 'bilkent', title: 'Bilkent CS',
    track: 'sat', intake: 'regular', opensAt: null, closesAt: '2027-06-01T00:00:00+03:00', intakeYear: 2027,
    language: 'en', city: 'Анкара', country: 'TR', fields: ['it', 'science'],
    tuitionPerYear: 15000, currency: 'USD', reach: false,
    admission: { satMin: 1000, toeflMin: 87 },
    source: 'Google Sheets команды', demo: true, verified: false,
  },
  {
    id: 'sabanci-cs', universityId: 'sabanci', title: 'Sabancı CS',
    track: 'sat', intake: 'regular', opensAt: null, closesAt: '2027-06-01T00:00:00+03:00', intakeYear: 2027,
    language: 'en', city: 'Стамбул', country: 'TR', fields: ['it', 'science', 'business'],
    tuitionPerYear: 19000, currency: 'USD', reach: false,
    admission: { satMin: 1100, toeflMin: 80 },
    source: 'Google Sheets команды', demo: true, verified: false,
  },
  {
    id: 'koc-eng', universityId: 'koc', title: 'Koç Engineering',
    track: 'sat', intake: 'regular', opensAt: null, closesAt: '2027-06-01T00:00:00+03:00', intakeYear: 2027,
    language: 'en', city: 'Стамбул', country: 'TR', fields: ['it', 'science'],
    tuitionPerYear: 20000, currency: 'USD', reach: false,
    admission: { satMin: 1180, toeflMin: 80 },
    source: 'Google Sheets команды', demo: true, verified: false,
  },
  {
    id: 'mit-cs', universityId: 'mit', title: 'MIT EECS',
    track: 'sat', intake: 'regular', opensAt: null, closesAt: '2027-01-01T00:00:00-05:00', intakeYear: 2027,
    language: 'en', city: 'Кембридж', country: 'US', fields: ['it', 'science'],
    tuitionPerYear: 92760, currency: 'USD', reach: true,
    grantPassScore: undefined,
    admission: { ieltsMin: { overall: 7.0, kind: 'minimum' } }, // SAT обязателен, порога нет: типично Math 780-800 / ERW 740-780 (набор 2029). COA 2026-27 $92,760. need-blind 100% нужды, merit нет.
    source: 'https://mitadmissions.org/apply/firstyear/tests-scores/', demo: true, verified: false,
    note: '[проверить: даты подачи demo (EA тесты до 30 нояб / RA до 31 дек)]',
  },
  {
    id: 'asu-cs', universityId: 'asu', title: 'ASU Computer Science',
    track: 'ielts_gpa', intake: 'regular', opensAt: null, closesAt: '2027-05-01T00:00:00-07:00', intakeYear: 2027,
    language: 'en', city: 'Темпе', country: 'US', fields: ['it', 'science', 'business'],
    tuitionPerYear: 69906, currency: 'USD', reach: false,
    admission: { gpaMin: 3.0, ieltsMin: { overall: 6.0, kind: 'minimum' } }, // SAT/ACT необязателен. Fulton/Nursing 6.5, Cronkite 7.0. Merit NAMU при приёме — сумма расходится: demo.
    source: 'https://admission.asu.edu/apply/international/first-year', demo: true, verified: false,
    note: '[проверить: перевод 5-балльной шкалы GPA; дедлайны Fall 2026 demo; сумма NAMU demo]',
  },
  {
    id: 'tulane-cs', universityId: 'tulane', title: 'Tulane Computer Science',
    track: 'ielts_gpa', intake: 'regular', opensAt: null, closesAt: '2026-11-10T00:00:00-06:00', intakeYear: 2027,
    language: 'en', city: 'Новый Орлеан', country: 'US', fields: ['it', 'science', 'business', 'humanities'],
    tuitionPerYear: 98710, currency: 'USD', reach: true,
    admission: { toeflMin: 95, ieltsMin: { overall: 6.5, kind: 'typical' } }, // SAT R&W ≥600 заменяет англ. тест. SAT необязателен (demo). COA $98,710; need-based до $30k; Global Scholarships до полной (топ-20%, ED 1 нояб / EA 10 нояб).
    source: 'https://admission.tulane.edu/international', demo: true, verified: false,
    note: '[проверить]',
  },
  {
    id: 'ucl-cs', universityId: 'ucl', title: 'UCL Computer Science',
    track: 'ielts_gpa', intake: 'regular', opensAt: null, closesAt: '2027-01-29T00:00:00+00:00', intakeYear: 2027,
    language: 'en', city: 'Лондон', country: 'UK', fields: ['it', 'science'],
    tuitionPerYear: 36000, currency: 'USD', reach: true,
    admission: { ieltsMin: { overall: 6.5, kind: 'typical' } }, // UCAS через ucas.com; NIS = A-Level по UK ENIC
    source: 'https://www.ucl.ac.uk/prospective-students/undergraduate', demo: true, verified: false,
    note: '[проверить: точный IELTS и стоимость]',
  },
  {
    id: 'manchester-cs', universityId: 'manchester', title: 'Manchester Computer Science',
    track: 'ielts_gpa', intake: 'regular', opensAt: null, closesAt: '2027-01-29T00:00:00+00:00', intakeYear: 2027,
    language: 'en', city: 'Манчестер', country: 'UK', fields: ['it', 'science', 'business'],
    tuitionPerYear: 34000, currency: 'USD', reach: false,
    admission: { ieltsMin: { overall: 6.0, kind: 'minimum' } },
    source: 'https://www.manchester.ac.uk/study/undergraduate', demo: true, verified: false,
    note: '[проверить: точный IELTS и стоимость]',
  },
];

export function getProgram(id: string): Program | undefined {
  return CATALOG.find((p) => p.id === id);
}
export function getUniversity(id: string): University | undefined {
  return UNIVERSITIES.find((u) => u.id === id);
}
