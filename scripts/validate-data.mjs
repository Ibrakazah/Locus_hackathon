import fs from 'node:fs';

const file = 'src/data/catalog.ts';
const src = fs.readFileSync(file, 'utf8');
const errors = [];

if (/\bNaN\b/.test(src)) errors.push('NaN в каталоге');

// Программы: нарезаем по id: 'xxx' внутри CATALOG-секции
const catSection = src.split('export const CATALOG')[1];
const idMatches = [...catSection.matchAll(/id:\s*'([^']+)'/g)].map((m) => ({ id: m[1], idx: m.index }));
const required = ['universityId', 'title', 'track', 'intake', 'tuitionPerYear', 'currency', 'reach', 'admission', 'source', 'demo', 'verified'];
for (let i = 0; i < idMatches.length; i++) {
  const { id, idx } = idMatches[i];
  const end = i + 1 < idMatches.length ? idMatches[i + 1].idx : idx + 2000;
  const block = catSection.slice(idx, end);
  for (const k of required) {
    if (!block.includes(`${k}:`) && !block.includes(`${k} :`)) errors.push(`program ${id}: нет поля ${k}`);
  }
  if (!block.includes('closesAt') && !block.includes('NU_WINDOW')) errors.push(`program ${id}: нет closesAt`);
  if (!block.includes('intakeYear') && !block.includes('NU_WINDOW')) errors.push(`program ${id}: нет intakeYear`);
}
if (idMatches.length < 10 || idMatches.length > 20) errors.push(`программ: ${idMatches.length}, нужно 10-20`);

// Университеты
const uniSection = src.split('export const UNIVERSITIES')[1].split('];')[0];
const uniIds = [...uniSection.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);
for (const id of uniIds) {
  const seg = uniSection.split(`'${id}'`)[1] ?? '';
  const nextId = uniIds[uniIds.indexOf(id) + 1];
  const block = nextId ? seg.split(`'${nextId}'`)[0] : seg;
  // блок университета — до следующего id; проверяем короткий хвост после id
  const tail = seg.slice(0, 600);
  if (!tail.includes('source:')) errors.push(`university ${id}: нет source`);
  if (!tail.includes('demo:')) errors.push(`university ${id}: нет demo`);
  if (!tail.includes('country:')) errors.push(`university ${id}: нет country`);
  void block;
}

if (errors.length) {
  console.error('validate-data FAILED:');
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}
console.log(`validate-data OK: programs=${idMatches.length} universities=${uniIds.length}`);
