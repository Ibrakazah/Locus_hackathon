import type { Gap, MatchLevel, Profile, Program, Recommendation } from './types';
import { entThresholdFor, CLOSE_MARGIN_ENT } from '@/data/thresholds';
import { FIELD_LABEL } from '@/lib/text';

const KZT_PER_USD = 500;

function tuitionUSD(p: Program): number {
  return p.currency === 'USD' ? p.tuitionPerYear : p.tuitionPerYear / KZT_PER_USD;
}

function fieldMatch(profile: Profile, p: Program): number {
  if (profile.fields.includes('undecided')) return 0.7;
  const hit = p.fields.some((f) => profile.fields.includes(f));
  if (hit) return 1;
  // смежное: science<->it
  const related =
    (profile.fields.includes('it') && p.fields.includes('science')) ||
    (profile.fields.includes('science') && p.fields.includes('it'));
  return related ? 0.5 : 0.2;
}

interface Fit { level: MatchLevel; gaps: Gap[]; admissionScore: number }

function gap(pid: string, type: Gap['type'], description: string, source?: string): Gap {
  return { type, description, roadmapTaskId: `${pid}:${type}`, source };
}

function evalEnt(profile: Profile, p: Program): Fit {
  const gaps: Gap[] = [];
  const progMin = p.admission.entMin ?? 50;
  const dirMin = entThresholdFor(profile.fields);
  const threshold = Math.max(progMin, dirMin);
  const ent = profile.ent;
  if (profile.isNis) {
    return { level: 'close', gaps: [gap(p.id, 'missing_exam', 'НИШ: ЕНТ скрыт, проверь IELTS/GPA против порогов NU', p.source)], admissionScore: 0.5 };
  }
  if (!ent || ent.status === 'not_taken' || ent.score == null) {
    gaps.push(gap(p.id, 'exam_planned', `ЕНТ не сдан — зарегистрироваться; цель ${threshold}+`, 'testcenter.kz'));
    return { level: 'close', gaps, admissionScore: 0.5 };
  }
  const s = ent.score;
  if (s >= threshold) return { level: 'fits', gaps, admissionScore: 1 };
  if (s >= threshold - CLOSE_MARGIN_ENT) {
    gaps.push(gap(p.id, 'score_gap', `ЕНТ ${s} < порога ${threshold}: +${threshold - s} баллов. Пробный ЕНТ январь 2027`, 'testcenter.kz'));
    return { level: 'close', gaps, admissionScore: 0.5 };
  }
  gaps.push(gap(p.id, 'score_gap', `ЕНТ ${s} < порога ${threshold}: +${threshold - s} баллов`, 'testcenter.kz'));
  return { level: 'fails', gaps, admissionScore: 0 };
}

function evalIeltsGpa(profile: Profile, p: Program): Fit {
  const gaps: Gap[] = [];
  let score = 1;
  let worst: MatchLevel = 'fits';
  const downgrade = (l: MatchLevel, s: number) => {
    if (l === 'fails') { worst = 'fails'; score = Math.min(score, s); }
    else if (l === 'close' && worst === 'fits') { worst = 'close'; score = Math.min(score, s); }
  };

  const im = p.admission.ieltsMin;
  if (im) {
    const ie = profile.ielts;
    if (!ie || ie.status === 'not_taken' || ie.score == null) {
      gaps.push(gap(p.id, 'missing_exam', `Сдать IELTS (цель ${im.overall}, Writing ${im.writing ?? im.overall}) или NUET`, p.source));
      downgrade('close', 0.5);
    } else if (ie.score >= im.overall) {
      // секции: если требуются, а есть только overall
      const secs = ie.sections ?? {};
      const hasSecs = Object.values(secs).some((v) => v != null);
      if (!hasSecs && (im.writing || im.sectionsMin)) {
        gaps.push(gap(p.id, 'missing_exam', 'Проверь секции IELTS (нужны Writing и L/S/R)', p.source));
        downgrade('close', 0.5);
      } else {
        const w = secs.writing;
        const others = [secs.listening, secs.speaking, secs.reading].filter((v) => v != null) as number[];
        if (im.writing && w != null && w < im.writing) {
          gaps.push(gap(p.id, 'score_gap', `IELTS Writing ${w} < ${im.writing}`, p.source));
          downgrade(im.kind === 'typical' ? 'close' : 'fails', im.kind === 'typical' ? 0.5 : 0);
        }
        if (im.sectionsMin && others.length && Math.min(...others) < im.sectionsMin) {
          gaps.push(gap(p.id, 'score_gap', `Секция IELTS ниже ${im.sectionsMin}`, p.source));
          downgrade(im.kind === 'typical' ? 'close' : 'fails', im.kind === 'typical' ? 0.5 : 0);
        }
      }
    } else {
      gaps.push(gap(p.id, 'score_gap', `IELTS ${ie.score} < ${im.overall}`, p.source));
      downgrade(im.kind === 'typical' ? 'close' : 'fails', im.kind === 'typical' ? 0.5 : 0);
    }
  }
  if (p.admission.toeflMin) {
    const t = profile.toefl;
    if ((!t || t.status === 'not_taken' || t.score == null) && !im) {
      gaps.push(gap(p.id, 'missing_exam', `Сдать TOEFL (цель ${p.admission.toeflMin})`, p.source));
      downgrade('close', 0.5);
    } else if (t && t.score != null && t.score < p.admission.toeflMin) {
      // TOEFL как альтернатива IELTS: не валим если IELTS прошёл
      if (worst === 'fits' && !im) {
        gaps.push(gap(p.id, 'score_gap', `TOEFL ${t.score} < ${p.admission.toeflMin}`, p.source));
        downgrade('fails', 0);
      }
    }
  }
  if (p.admission.gpaMin) {
    if (profile.gpa == null) {
      gaps.push(gap(p.id, 'missing_exam', `Нужен GPA аттестата (цель ${p.admission.gpaMin}/5.0)`, p.source));
      downgrade('close', 0.5);
    } else if (profile.gpa < p.admission.gpaMin) {
      gaps.push(gap(p.id, 'score_gap', `GPA ${profile.gpa} < ${p.admission.gpaMin}`, p.source));
      downgrade('fails', 0);
    }
  }
  return { level: worst, gaps, admissionScore: score };
}

function evalSat(profile: Profile, p: Program): Fit {
  const gaps: Gap[] = [];
  // OR-логика: SAT или NUET (для NU mid-year)
  const satMin = p.admission.satMin;
  const nuetMin = p.admission.nuetMin;
  const sat = profile.sat;
  const nuet = profile.nuet;

  const satTaken = sat && sat.status !== 'not_taken' && sat.score != null;
  const nuetTaken = nuet && nuet.status !== 'not_taken' && nuet.score != null;

  if (!satTaken && !nuetTaken) {
    if (satMin) gaps.push(gap(p.id, 'missing_exam', `Сдать SAT (цель ${satMin}) или перейти на ЕНТ-трек`, p.source));
    else gaps.push(gap(p.id, 'missing_exam', 'Сдать SAT или NUET', p.source));
    return { level: 'close', gaps, admissionScore: 0.5 };
  }
  let best: Fit = { level: 'fails', gaps: [], admissionScore: 0 };
  if (satTaken && satMin) {
    const s = sat!.score!;
    if (s >= satMin) best = { level: 'fits', gaps: [], admissionScore: 1 };
    else {
      const g = gap(p.id, 'score_gap', `SAT ${s} < минимума ${satMin}. Пересдать или перейти на ЕНТ-трек`, p.source);
      best = { level: 'fails', gaps: [g], admissionScore: 0 };
    }
  } else if (satTaken && !satMin) {
    best = { level: 'fits', gaps: [], admissionScore: 1 }; // MIT: SAT обязателен, порога нет
  }
  if (nuetTaken && nuetMin) {
    const n = nuet!.score!;
    const secs = nuet!.sections ?? {};
    const m = secs.math ?? secs.NUET_MATH ?? null;
    const c = secs.critical ?? secs.NUET_CRIT ?? null;
    const eachOk = (m == null || m >= nuetMin.each) && (c == null || c >= nuetMin.each);
    if (n >= nuetMin.total && eachOk) {
      return { level: 'fits', gaps: [], admissionScore: 1 }; // NUET спасает
    }
    if (best.level === 'fails') {
      gaps.push(gap(p.id, 'score_gap', `NUET ${n} < ${nuetMin.total} (каждый ≥${nuetMin.each})`, p.source));
    }
  }
  if (best.level === 'fails') gaps.push(...best.gaps);
  // TOEFL-минимум для Турции как доп. условие — но IELTS его закрывает (альтернативы)
  if (p.admission.toeflMin && best.level === 'fits') {
    const ieltsOk = (profile.ielts?.score ?? 0) >= 5.5 && profile.ielts?.status !== 'not_taken';
    if (!ieltsOk) {
      const t = profile.toefl;
      if (!t || t.status === 'not_taken' || t.score == null) {
        gaps.push(gap(p.id, 'missing_exam', `Сдать TOEFL (цель ${p.admission.toeflMin}) или IELTS`, p.source));
        return { level: 'close', gaps, admissionScore: 0.5 };
      }
      if (t.score < p.admission.toeflMin) {
        gaps.push(gap(p.id, 'score_gap', `TOEFL ${t.score} < ${p.admission.toeflMin}`, p.source));
        return { level: 'close', gaps, admissionScore: 0.5 };
      }
    }
  }
  return { level: best.level, gaps, admissionScore: best.admissionScore };
}

// Градация престижа (стартовые веса — подобраны тестом чувствительности приоритета).
const PRESTIGE: Record<string, number> = {
  mit: 1.0, tulane: 0.9, ucl: 0.9, nu: 0.9, kbtu: 0.8, kimep: 0.6, manchester: 0.6, asu: 0.5,
};
const prestigeFitOf = (universityId: string): number => PRESTIGE[universityId] ?? 0.4;

export function recommend(profile: Profile, catalog: Program[], now: Date): Recommendation[] {
  void now;
  // 1. Пул с ослаблением фильтров
  const routeKz = profile.route === 'kz' || profile.route === 'undecided';
  let pool = catalog.filter((p) => (routeKz ? p.country === 'KZ' : (profile.abroadCountries ?? []).includes(p.country)));
  if (routeKz && !profile.fields.includes('undecided')) {
    const byField = pool.filter((p) => p.fields.some((f) => profile.fields.includes(f)));
    if (byField.length >= 3) pool = byField;
    else if (byField.length > 0) pool = byField; // оставим, добьём ниже
  }
  if (!routeKz && profile.abroadCountries?.length) {
    const byField = pool.filter((p) => profile.fields.includes('undecided') || p.fields.some((f) => profile.fields.includes(f)));
    if (byField.length >= 3) pool = byField;
  }
  // минимум 3 всегда: добираем ближайшими из всего каталога
  let candidates = [...pool];
  if (candidates.length < 3) {
    for (const p of catalog) {
      if (candidates.some((c) => c.id === p.id)) continue;
      candidates.push(p);
      if (candidates.length >= 3) break;
    }
  }

  const recs: Recommendation[] = candidates.map((p) => {
    // 2. admissionFit по треку
    let fit: Fit;
    if (p.track === 'ent') fit = evalEnt(profile, p);
    else if (p.track === 'sat' || p.track === 'nuet') fit = evalSat(profile, p);
    else fit = evalIeltsGpa(profile, p);

    // бюджетный gap для зарубеж
    if (!routeKz && profile.budgetUsd != null && p.country !== 'KZ') {
      const t = tuitionUSD(p);
      if (t > profile.budgetUsd) {
        fit.gaps.push(gap(p.id, 'budget_gap', `Стоимость $${t.toLocaleString('ru-RU')}/год выше бюджета $${profile.budgetUsd.toLocaleString('ru-RU')}: рассмотри Турцию или стипендии [проверить]`, 'Google Sheets команды'));
        if (t > profile.budgetUsd * 1.5) { fit.level = 'fails'; fit.admissionScore = 0; }
        else if (fit.level === 'fits') { fit.level = 'close'; fit.admissionScore = 0.5; }
      }
    }
    // грант-только + низкий ЕНТ
    if (profile.funding === 'grant_only' && p.track === 'ent') {
      if (p.grantPassScore && profile.ent?.score != null && profile.ent.score < p.grantPassScore.score) {
        fit.gaps.push(gap(p.id, 'funding_gap', 'Балл ниже прошлогоднего проходного на грант: план подъёма или смежные программы [демо-данные]', '[демо-данные]'));
      } else if (!p.grantPassScore) {
        // без данных — отдельной строкой, не gap
      }
    }

    // 4. sortScore
    const fm = fieldMatch(profile, p);
    const as = fit.admissionScore;
    const tUSD = tuitionUSD(p);
    let costFit: number;
    if (profile.budgetUsd != null && p.country !== 'KZ') {
      const b = profile.budgetUsd;
      costFit = tUSD <= b ? 1 - 0.2 * (tUSD / b) : Math.max(0, 0.3 - 0.3 * ((tUSD - b) / b));
    } else {
      costFit = Math.max(0, 1 - tUSD / 100000);
    }
    const langFit = profile.language === 'any' || !profile.language ? 0.8 : p.language === profile.language ? 1 : p.language === 'multi' ? 0.8 : 0.4;
    const prestigeFit = prestigeFitOf(p.universityId);
    const pri = profile.priority ?? 'cost';
    const w = pri === 'cost'
      ? { c: 0.5, l: 0.25, p: 0.25 }
      : pri === 'language' ? { c: 0.25, l: 0.5, p: 0.25 } : { c: 0.25, l: 0.25, p: 0.5 };
    const prefs = w.c * costFit + w.l * langFit + w.p * prestigeFit;
    const sortScore = 0.35 * fm + 0.25 * as + 0.4 * prefs;

    // 5. reasons шаблонами
    const reasons: string[] = [];
    if (fit.level === 'fits') reasons.push('Проходишь порог по основному требованию');
    else if (fit.level === 'close') reasons.push('Близко к порогу — хватит точечной подготовки');
    if (fm >= 1) reasons.push(`Направление совпадает: ${profile.fields.map((f) => FIELD_LABEL[f] ?? f).join(', ')}`);
    else if (fm >= 0.5) reasons.push('Смежное направление — требования почти те же');
    if (p.language === 'en' && (profile.language === 'en' || profile.ielts?.score != null)) reasons.push('Обучение на английском совпадает с твоим IELTS');
    if (pri === 'cost' && costFit > 0.7) reasons.push('Проходит по бюджету лучше остальных');
    if (pri === 'prestige' && prestigeFit >= 1) reasons.push('Сильный бренд и конкурс — твой приоритет');
    if (profile.interests?.length && reasons.length < 3) reasons.push(`Активности (${profile.interests.slice(0, 2).join(', ')}) усилят заявку`);
    const finalReasons = reasons.slice(0, 3);
    if (finalReasons.length < 2) finalReasons.push(p.reach ? 'Конкурсный отбор: holistic review' : 'Доступен по твоему маршруту');

    const grantNote = p.grantPassScore
      ? `Грант ${p.grantPassScore.year}: от ${p.grantPassScore.score} баллов${p.grantPassScore.demo ? ' [демо-данные]' : ''} — это ориентир, не гарантия.`
      : p.country === 'KZ'
        ? 'Проходные баллы на грант — проверить [демо-данные].'
        : p.reach
          ? 'Need-based / merit — отдельным конкурсом, без гарантий.'
          : 'Стипендии — отдельным конкурсом [проверить].';

    return {
      programId: p.id, universityId: p.universityId, matchLevel: fit.level,
      reasons: finalReasons, gaps: fit.gaps, reach: p.reach, sortScore,
      grantNote,
    } satisfies Recommendation;
  });

  recs.sort((a, b) => b.sortScore - a.sortScore);
  return recs;
}
