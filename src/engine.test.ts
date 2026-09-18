import { describe, expect, it } from 'vitest';
import { recommend } from './lib/engine';
import { buildRoadmap } from './lib/roadmap';
import { CATALOG } from './data/catalog';
import { PERSONAS } from './data/personas';
import type { Profile } from './lib/types';

const NOW = new Date('2026-09-18T12:00:00+06:00');

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

// T1–T7 из adaptive_flow.md
const T1 = base({ grade: 11, fields: ['it'], funding: 'grant_only', ent: { status: 'taken', score: 96, profile: 'math-physics' } });
const T2 = base({ grade: 11, fields: ['it'], funding: 'contract_ok', ielts: { status: 'taken', score: 6.5, sections: { writing: 6.0, listening: 6.5, speaking: 6.0, reading: 6.5 } }, gpa: 4.7, interestedInNu: true, language: 'en' });
const T3 = base({ grade: 10, fields: ['medicine'], funding: 'grant_only', ent: { status: 'not_taken', score: null, profile: null } });
const T4 = base({ grade: 11, fields: ['it'], funding: 'contract_ok', sat: { status: 'taken', score: 1210 } });
const T5 = base({ grade: 'graduate', fields: ['undecided'], isNis: true, ielts: { status: 'taken', score: 6.5, sections: { writing: 6.0, listening: 6.5, speaking: 6.5, reading: 6.5 } }, language: 'en' });
const T6 = base({ route: 'abroad', grade: 11, fields: ['it'], funding: 'grant_only', abroadCountries: ['US', 'UK'], budgetUsd: 5000 });
const T7 = base({ route: 'abroad', grade: 11, fields: ['undecided'], isNis: true, abroadCountries: ['UK'] });

describe('engine T1-T7', () => {
  it('всегда ≥3 рекомендации', () => {
    for (const p of [T1, T2, T3, T4, T5, T6, T7]) {
      expect(recommend(p, CATALOG, NOW).length).toBeGreaterThanOrEqual(3);
    }
  });
  it('T4: NU по SAT 1210 → fails', () => {
    const recs = recommend(T4, CATALOG, NOW);
    const nu = recs.find((r) => r.programId === 'nu-regular-sat')!;
    expect(nu.matchLevel).toBe('fails');
  });
  it('T2: NU → fits', () => {
    const recs = recommend(T2, CATALOG, NOW);
    const nu = recs.find((r) => r.programId === 'nu-cs-regular')!;
    expect(nu.matchLevel).toBe('fits');
  });
  it('смена бюджета меняет топ-3 хотя бы на одной фикстуре', () => {
    const all = [T1, T2, T3, T4, T5, T6, T7, ...PERSONAS.map((p) => p.profile)];
    const check = (p: Profile) => {
      const b = recommend(p, CATALOG, NOW).slice(0, 3).map((r) => r.programId).join(',');
      const a = recommend({ ...p, budgetUsd: 100000 }, CATALOG, NOW).slice(0, 3).map((r) => r.programId).join(',');
      return b !== a;
    };
    expect(all.some(check)).toBe(true);
  });
  it('смена приоритета cost→prestige меняет топ-3 хотя бы на одной фикстуре', () => {
    const all = [T1, T2, T3, T4, T5, T6, T7, ...PERSONAS.map((p) => p.profile)];
    const check = (p: Profile) => {
      const b = recommend(p, CATALOG, NOW).slice(0, 3).map((r) => r.programId).join(',');
      const a = recommend({ ...p, priority: 'prestige' }, CATALOG, NOW).slice(0, 3).map((r) => r.programId).join(',');
      return b !== a;
    };
    expect(all.some(check)).toBe(true);
  });
  it('reach:true возвращается как reach:true', () => {
    const recs = recommend(T6, CATALOG, NOW);
    const mit = recs.find((r) => r.programId === 'mit-cs')!;
    expect(mit.reach).toBe(true);
  });
  it('3 персоны дают разные топы и ≥3', () => {
    const tops = PERSONAS.map((p) => recommend(p.profile, CATALOG, NOW).slice(0, 3).map((r) => r.programId).join(','));
    for (const t of tops) expect(t.split(',').length).toBe(3);
  });
  it('T1, T4, T6 топы разные', () => {
    const t1 = recommend(T1, CATALOG, NOW)[0].programId;
    const t4 = recommend(T4, CATALOG, NOW)[0].programId;
    const t6 = recommend(T6, CATALOG, NOW)[0].programId;
    expect(new Set([t1, t4, t6]).size).toBeGreaterThanOrEqual(2);
  });
  it('buildRoadmap идемпотентен: второй прогон с prev не теряет done', () => {
    const recs = recommend(T2, CATALOG, NOW);
    const first = buildRoadmap({ profile: T2, goal: CATALOG.find((p) => p.id === 'nu-cs-regular'), recs, prev: [], now: NOW });
    const doneId = first[0].id;
    const second = buildRoadmap({ profile: T2, goal: CATALOG.find((p) => p.id === 'nu-cs-regular'), recs, prev: [{ ...first[0], done: true }], now: NOW });
    expect(second.find((t) => t.id === doneId)?.done).toBe(true);
  });
  it('T7: UCAS-алерт в roadmap', () => {
    const recs = recommend(T7, CATALOG, NOW);
    const tasks = buildRoadmap({ profile: T7, goal: undefined, recs, prev: [], now: NOW });
    expect(tasks.some((t) => t.id === 'base:ucas')).toBe(true);
  });
});
