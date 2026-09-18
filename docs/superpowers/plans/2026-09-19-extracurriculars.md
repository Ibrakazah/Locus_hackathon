# Extracurriculars Page — Implementation Plan

> **For agentic workers:** use superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** Страница `/extracurriculars` — персонализированный каталог extracurriculars (хакатоны, олимпиады, конкурсы, research, волонтёрство, лидерство) по профилю абитуриента. Сортировка/фит rule-based, текст «почему» — LLM через `app/api/explain` (с fallback).

**Stack:** Next.js 16 App Router, TS strict, Tailwind v4, Zustand (существующий store). Без новых зависимостей.

**Design Read:** продуктовая страница-каталог (feed), neo-brutalist на токенах `app/globals.css` (cream/ink/mint, Montserrat, `shadow-brutal-*`). Dials: VARIANCE 5 / MOTION 3 / DENSITY 6. Один акцент (mint), квадратные углы, mobile-first.

## Global Constraints

- Логика — чистые функции (`matchActivities`), время только `now: Date`.
- Никаких процентов/гарантий. Фит: `high «отлично подходит» / medium «подходит» / low «на подумать»`.
- Все данные каталога `demo: true` + `url`-источник + `[проверить дату]`.
- LLM-текст без чисел/процентов/дат (отбраковка `hasUnknownNumber`), fallback на rule-based `why`.
- `npm test`, `npm run lint`, `npm run build` зелёные перед PR.

---

## Task 1: Типы (`lib/extracurricular/types.ts`)

```ts
import type { Field } from "../store/types";
export type ActivityType = 'hackathon'|'olympiad'|'competition'|'research'|'volunteering'|'leadership'|'sport'|'course';
export interface Activity {
  id: string; title: string; type: ActivityType;
  fields: Field[]; gradeRange: [number, number | 'graduate'];
  format: 'online'|'offline'|'hybrid'; city?: string; language: 'kz'|'ru'|'en';
  price: 'free'|'paid'; deadline?: string; dates?: string; gain: string;
  intensity: 1|2|3; url: string; demo: boolean;
}
export type ActivityFit = 'high'|'medium'|'low';
export interface MatchedActivity { activity: Activity; fit: ActivityFit; why: string }
```

## Task 2: Движок (`lib/extracurricular/match.ts`)

- [ ] `matchActivities(profile, catalog, now): MatchedActivity[]`
- [ ] Фильтр по grade (open-ended `'graduate'`), fallback ≥3 (ослабляем grade → fields).
- [ ] fit = пересечение `fields`; route-взвешивание (abroad → research/leadership/volunteering; kz → olympiad/hackathon).
- [ ] Сортировка: deadline → fit-rank → intensity desc.
- [ ] `why` — детерминированный текст (fallback для LLM).

## Task 3: Каталог (`data/activities.ts`)

~16-20 позиций, все `demo:true`, `url`-источник, `[проверить]`. Типы: hackathon (AI/Fintech/Web3), olympiad (химия/физика/математика/инф), competition (дебаты, кейсы), research (NU-программы), volunteering, leadership, sport, course.

## Task 4: `app/api/explain/route.ts` — расширить под activity

- [ ] Body `{ kind?: 'recommendation'|'activity'; recommendation?; activity?: { activity, profile, why } }`.
- [ ] Промпт «1-2 предложения, без чисел/процентов/дат».
- [ ] fallback: recommendation → `templateExplanation`; activity → `activity.why`.
- [ ] Сохранить `hasUnknownNumber`.

## Task 5: UI

- [ ] `components/shared/ActivityCard.tsx` — бейджи type/format/price, title, gain, deadline, fit-бейдж, `why`, кнопка «Уточнить ИИ» (POST /api/explain), ссылка.
- [ ] `components/shared/ActivityFilters.tsx` — чипы тип/формат/город/фит.
- [ ] `app/extracurriculars/page.tsx` — hero-полоса, чипы, сетка `grid-cols-1 md:2 lg:3`, состояния skeleton/empty/error, `useHydrated`.
- [ ] `app/page.tsx` — ссылка.

## Task 6: Гайд

`docs/EXTRACURRICULARS.md` — как поставить `EXPLAIN_API_KEY`, как прогнать, как мержить.

## Проверка

`npm test` (matchActivities: grade/fit/sort/fallback/route), `npm run lint`, `npm run build`, smoke `/extracurriculars` 200, `POST /api/explain {kind:'activity'}` без ключа → rule.
