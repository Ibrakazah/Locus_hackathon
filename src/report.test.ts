import { describe, expect, it } from 'vitest';
import { CATALOG } from '@/data/catalog';
import { PERSONAS } from '@/data/personas';
import { recommend } from '@/lib/engine';
import { buildRoadmap } from '@/lib/roadmap';
import { buildReportText } from '@/lib/report';

const now = new Date('2026-09-19T12:00:00+06:00');

describe('buildReportText', () => {
  const profile = PERSONAS[0]!.profile;
  const recs = recommend(profile, CATALOG, now);
  const prev = Object.entries({}).map(() => ({ id: '', programId: null as string | null, title: '', deadline: null as string | null, kind: 'info' as const, done: true, source: '' }));
  const tasks = buildRoadmap({ profile, goal: undefined, recs, prev, now });
  const text = buildReportText({ profile, recs, tasks, goalProgramId: null });

  it('собирает цель, диагноз, топ-3 и следующий шаг', () => {
    expect(text).toContain('ПЕРСОНАЛЬНЫЙ МАРШРУТ ПОСТУПЛЕНИЯ');
    expect(text).toContain('ЦЕЛЬ:');
    expect(text).toContain('1. ДИАГНОЗ');
    expect(text).toContain('2. ТОП-3 ВАРИАНТА');
    expect(text).toContain('3. ПЛАН:');
    expect(text).toContain('СЛЕДУЮЩИЙ ШАГ');
    expect(text).toContain('ОГОВОРКИ');
  });

  it('не обещает грант без оговорки', () => {
    expect(text).toContain('не гарантия гранта');
    expect(text).toContain('[демо-данные]');
  });

  it('всегда есть 3 варианта в топ-3', () => {
    const block = text.split('3. ПЛАН:')[0]!;
    for (const n of [1, 2, 3]) {
      expect(block).toContain(`${n}. `);
    }
  });
});