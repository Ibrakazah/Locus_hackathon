// Пороги. Один раз зафиксированы здесь. Спорные помечены verified:false.
export const ENT_MIN_BY_FIELD: Record<string, number> = {
  law: 75, // testcenter.kz / Википедия ЕНТ [проверить testcenter.kz]
  medicine: 70,
  science_agro: 60, // с/х, ветеринария, биоресурсы
  national: 65, // нац. вузы (it/business/humanities в нац. ОВПО)
  other: 50, // остальные платные
};

export function entThresholdFor(fields: string[]): number {
  if (fields.includes('law')) return ENT_MIN_BY_FIELD.law;
  if (fields.includes('medicine')) return ENT_MIN_BY_FIELD.medicine;
  if (fields.includes('science')) return ENT_MIN_BY_FIELD.national; // упрощение: science в нац. = 65
  if (fields.includes('it') || fields.includes('business') || fields.includes('humanities'))
    return ENT_MIN_BY_FIELD.national;
  return ENT_MIN_BY_FIELD.other;
}

// NU. Источник правды — adaptive_flow.md (по аудиту 19.09.2026).
// onboarding-research §5.3 противоречит (SAT/NUET только mid-year; NIS BBB).
// Все спорные значения: verified:false + [проверить nu.edu.kz].
export const NU = {
  regular: {
    ielts: { overall: 6.0, writing: 6.0, sectionsMin: 5.5 },
    gpa: 4.0, // из 5.0
    unt: 85,
    sat: 1240, // verified:false — спор с §5.3
    act: 26, // verified:false
    nuet: { total: 120, each: 50 }, // verified:false
    nis: 'ABB', // verified:false (в §5.3 BBB)
    verified: false,
    note: '[проверить nu.edu.kz: SAT/NUET в regular и NIS ABB vs BBB]',
  },
  midyear: {
    sat: 1150,
    act: 23,
    nuet: { total: 130, each: 60 },
    verified: true,
  },
  nufyp: {
    ielts: { overall: 5.5, writingReading: 5.5, ls: 5.0 },
    gpa: 3.5,
    unt: 75,
    verified: true,
  },
} as const;

export const CLOSE_MARGIN_ENT = 5; // в пределах 5 баллов => close
