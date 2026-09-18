# Branch B «state-roadmap» — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:executing-plans (или subagent-driven-development). Шаги — по чекбоксам.

**Goal:** Реализовать зону ветки B: Zustand-store, roadmap, diff, тексты, календарь, экраны diagnosis/roadmap/next-step, WhatIfSheet и API explain — поверх контракта ветки A (пока на временном зеркале типов).

**Stack:** Next.js 16 (App Router), TypeScript strict, Tailwind v4, Zustand (persist `route-v1`), Vitest.

**Структура (буквально по плану):** корневые `lib/`, `data/`, `app/`, `components/`. Старый `src/**` выводится из эксплуатации отдельным PR.

## Global Constraints

- Работаем только в своей ветке и зонах: `lib/store/`, `lib/roadmap/`, `lib/diff/`, `lib/text/`, `data/calendar.ts`, `app/api/explain/`, `app/diagnosis`, `app/roadmap`, `app/next-step`, `components/shared/WhatIfSheet.tsx`. Чужие зоны (`lib/types`, `lib/engine`, `app/layout`, `tailwind.config`) не трогаем.
- Никаких процентов и гарантий. Уровни допуска: `fits` / `close` / `fails`. Грант — отдельная строка без галочки.
- Каждый факт: `source` (URL) или `demo: true` + `[проверить]`.
- Логика — чистые функции, время только параметром `now: Date`. Остаток дней считается от `now`.
- Секретов нет (`.env*` в `.gitignore`), `npm run build` и `npm run lint` зелёные перед PR.
- Коммиты: `feat(store): …` / `feat(roadmap): …` / `feat(ui): …`. PR маленькие, чужие не мешаем.
- Контракт: `recommend(profile, catalog, now): Recommendation[]`; `buildRoadmap({profile, goal, prev, now}): RoadmapTask[]`; `nextStep(tasks): RoadmapTask | null`; `diffRankings(before, after, changed?): RankChange[]`; Store: `useAppStore { profile, setProfile(patch), goalProgramId, setGoal(id), tasks, toggleTask(id), reset() }`.

---

## Task 0: Сетап ветки, зависимости, доки

**Files:** Modify `package.json`, `docs/TECH_STACK.md`, Create `vitest.config.ts`, `docs/adaptive_flow.md`

- [x] Step 1: reset личной ветки на origin/main + force-push.
- [x] Step 2: `npm i zustand`, `npm i -D vitest @types/node@^24`; script `"test": "vitest run"`; обновить TECH_STACK.
- [x] Step 3: `vitest.config.ts`.
- [x] Step 4: скопировать `adaptive_flow.md` в `docs/`.
- [ ] Step 5: `npm run lint && npm run build` зелёные; commit.

---

## Task 1: Зеркало контракта + Store (PR1, от него зависит C)

**Files:** Create `lib/store/types.ts`, `lib/store/index.ts`; Test `lib/store/store.test.ts`

**Produces:** `useAppStore`, `Profile`, `RoadmapTask`, `Recommendation`, `RankChange`.

- [ ] Step 1: тест `lib/store/store.test.ts` (setProfile мержит, setGoal/toggleTask, reset).
- [ ] Step 2: `npm test` → FAIL.
- [ ] Step 3: `lib/store/types.ts` — зеркало контракта (Route, Grade, Funding, Priority без `distance`, Field, ExamKind, ExamResult-объединение с `plannedDate`, BudgetRange, EntProfileCombo, Profile, GapType c `deadline_alert`, Gap, Recommendation, TaskKind, RoadmapTask, RankChange) + `EMPTY_PROFILE`. Шапка: `// TODO(B): удалить после слияния A, импортировать из lib/types`.
- [ ] Step 4: `lib/store/index.ts` — Zustand `create` + `persist`, name `route-v1`, version 1, `partialize: {profile, goalProgramId, doneTasks}`, `tasks` в памяти.
- [ ] Step 5: `npm test` PASS; `npm run lint && npm run build` зелёные.
- [ ] Step 6: commit + push + PR в main.

---

## Task 2: `data/calendar.ts`

**Files:** Create `data/calendar.ts`; Test `data/calendar.test.ts`

**Produces:** `CALENDAR`, `eventsFor(profile, now)`.

- [ ] Step 1: тест (КЗ 11 кл → есть `ent-main`, нет `ucas-oxbridge`; NIS+UK → есть `ucas-oxbridge` в будущем).
- [ ] Step 2: FAIL.
- [ ] Step 3: реализация — события ЕНТ янв/мар/авг (платно), основная май–июль, NU 27.09.2026→17.08.2027, UCAS Oxbridge 15.10.2026, UCAS основной 29.01.2027; всё `demo: true` + `[проверить год и дату]`; фильтр по route/exams/isNis/countries.
- [ ] Step 4: PASS. Step 5: commit `feat(roadmap): calendar.ts`.

---

## Task 3: Roadmap (`lib/roadmap/`)

**Files:** Create `lib/roadmap/constants.ts`, `gapTasks.ts`, `build.ts`, `nextStep.ts`, `recommendStub.ts`; Test `lib/roadmap/build.test.ts`

**Produces:** `buildRoadmap`, `nextStep`, `recommendStub`.

- [ ] Step 1: тест (gap→id `p1:score_gap`; 11 кл в сентябре → нет `grant`-задачи, есть `study`; идемпотентность с prev сохраняет done и id; сортировка по deadline, undefined в конце; nextStep = первая невыполненная).
- [ ] Step 2: FAIL.
- [ ] Step 3: `constants.ts` — `LEAD_EXAM_DAYS=90`, `LEAD_DOCS_DAYS=60`, `LEAD_APPLY_DAYS=30`, `daysBefore`.
- [ ] Step 4: `gapTasks.ts` — таблица GapType→{title, kind} по §13.4; `deadline_alert` → `application` + `alert:true`.
- [ ] Step 5: `build.ts` — gap-задачи + базовые (регистрация/документы/подача) назад от `goal.program.closesAt` + датозависимые правила (grade 11 & мес 9..4 → prep, грант скрыт до мая; NU-окно из будущего → счётчик от now; UCAS urgent если isNis&UK&now<2026-10-15) + merge prev по id + сортировка. `source` или `[демо-данные]`.
- [ ] Step 6: `nextStep.ts`.
- [ ] Step 7: `recommendStub.ts` (TODO удалить после A).
- [ ] Step 8: PASS; lint/build. Step 9: commit.

---

## Task 4: Diff (`lib/diff/rankings.ts`)

**Files:** Create `lib/diff/rankings.ts`; Test `lib/diff/rankings.test.ts`

- [ ] Step 1: тест (смена бюджета меняет порядок → RankChange + reason; выпавшая → to:-1; пустой changed → «вводные изменились»).
- [ ] Step 2: реализация `diffRankings(before, after, changed?)` + `reasonFor`.
- [ ] Step 3: PASS → commit.

---

## Task 5: Тексты (`lib/text/`)

**Files:** Create `lib/text/diagnosis.ts`, `lib/text/reasons.ts`; Test `lib/text/diagnosis.test.ts`

- [ ] Step 1: тест (IELTS 6.5 + NU → strength; пустые экзамены → limit; goal-строка route+field+funding).
- [ ] Step 2: реализация только детерминированными шаблонами.
- [ ] Step 3: PASS → commit.

---

## Task 6: Экраны + WhatIfSheet (GATE)

**Gate:** Next.js падает при одновременных `src/app` и `app/`. Нужны (1) удаление старого `src/` и (2) `app/layout.tsx` от ветки C.

**Files:** Create `lib/store/useHydrated.ts`, `app/diagnosis/page.tsx`, `app/roadmap/page.tsx`, `app/next-step/page.tsx`, `components/shared/WhatIfSheet.tsx`

- [ ] Step 1: `useHydrated()`.
- [ ] Step 2: `app/diagnosis` — strengths/limits/goal из lib/text, кнопки «Дальше»/«Изменить».
- [ ] Step 3: `app/roadmap` — TaskCard по deadline, чекбокс `toggleTask`.
- [ ] Step 4: `app/next-step` — крупная карточка «Сделай сейчас» + прогресс.
- [ ] Step 5: `WhatIfSheet` — diff при смене одного из 5 параметров.
- [ ] Step 6: ручная проверка на 375px. Step 7: commit.

---

## Task 7: `app/api/explain/route.ts`

- [ ] Step 1: без `EXPLAIN_API_KEY` → шаблон из lib/text.
- [ ] Step 2: с ключом — дешёвая модель, JSON-схема, отбраковка чисел/дат вне payload.
- [ ] Step 3: ключ только из env. Step 4: build + curl без ключа → шаблон; commit.

---

## Task 8 (отложено): Свап стабов на контракт A

- [ ] После слияния A: удалить `lib/store/types.ts` и `lib/roadmap/recommendStub.ts`, заменить импорты на `lib/types` / `lib/engine`; `npm test` — сигнатуры сходятся. Commit.

---

## Порядок PR

1. PR1: Task 0+1 (deps + store) — срочно, от него зависит C.
2. PR2: Task 2+3. 3. PR3: Task 4+5. 4. PR4: Task 6 (после gate). 5. PR5: Task 7. 6. PR6: Task 8 (после A).

## Открытые зависимости

- `onboarding-research (2).md` и `message (1).txt` — не найдены на машине, нужны для C (personas) и сверки A.
- Команда: удалить `src/` и создать `app/layout.tsx` (gate Task 6).
- Ветка A: контракт `lib/types` + `lib/engine/recommend()`.
