# Extracurriculars — гайд для агентов и людей

Ветка `extracurriculars`. Страница `/extracurriculars`: персонализированный каталог активностей
(хакатоны, олимпиады, конкурсы, research, волонтёрство, лидерство) по профилю абитуриента.

## Что в ветке

| Путь | Что |
|---|---|
| `lib/extracurricular/types.ts` | типы `Activity`, `MatchedActivity` |
| `lib/extracurricular/match.ts` | чистый матчинг: фильтр по классу/дедлайну, fit по направлению, route-взвешивание, сортировка, fallback ≥3 |
| `lib/extracurricular/labels.ts` | подписи типов/фита/формата/цены |
| `data/activities.ts` | демо-каталог (18 позиций), все `demo:true` + `[проверить]` |
| `app/extracurriculars/page.tsx` | страница |
| `components/shared/ActivityCard.tsx`, `ActivityFilters.tsx` | карточка + чипы-фильтры |
| `app/api/explain/route.ts` | расширен: теперь принимает `kind: 'activity'` |

## Как запустить

```bash
npm i
npm run dev          # http://localhost:3000/extracurriculars
```

Страница работает без ключа: текст «почему подходит» считается правилами (`match.ts`).

## LLM-объяснения (опционально, нужен API-ключ)

Кнопка «Уточнить ИИ» на карточке шлёт `POST /api/explain` с `kind: "activity"`. Без ключа
возвращается rule-based `why` (страница полностью рабочая).

**Как поставить ключ (человек/капитан, один раз локально, НЕ в git):**

1. Создай файл `.env.local` в корне репозитория (он уже в `.gitignore`):
   ```bash
   EXPLAIN_API_KEY=sk-ant-...        # ключ Anthropic (или другого провайдера совместимой формы)
   EXPLAIN_MODEL=claude-haiku-4-5-20251001   # необязательно
   ```
2. Перезапусти `npm run dev`.
3. Проверь: `curl -X POST http://localhost:3000/api/explain -H 'content-type: application/json' -d '{"kind":"activity","activity":{"activity":{"id":"x","title":"x","type":"hackathon","fields":["it"],"gradeRange":[9,"graduate"],"format":"online","language":"ru","price":"free","gain":"x","intensity":3,"url":"https://x","demo":true},"profile":{"route":"kz","fields":["it"]},"why":"правило"}}'`
   → вернёт `{"text":"...","source":"llm"}`.

> Ключ НИКОГДА не коммитится. `.env*` в `.gitignore`. Если ключа нет — продукт не ломается,
> просто используется rule-based текст.

## Проверка перед мержем

```bash
npm test        # 31 passed (store, calendar, roadmap, diff, text, extracurricular)
npm run lint    # 0 ошибок
npm run build   # compiled; роут /extracurriculars
```

## Как мержить

1. Ветка отходит от `adlet-AI-GRANDMASTER` (ветка B, PR #2). **Мержить этот PR можно только
   после/вместе с PR #2** — страница зависит от store (`lib/store`) и типов.
2. Данные все `demo:true` — проверять даты перед мержем не нужно, они помечены.
3. Задача на потом (после ветки A): заменить `data/activities.ts` на реальный каталог и убрать
   пометки `demo`.

## Сценарий для проверки вручную

1. Открой `/extracurriculars` → «Загрузить демо-профиль».
2. Убедись, что подборка отсортирована по дедлайну, у IT-профиля хакатоны/олимпиады — «Отлично подходит».
3. Покликай чипы (тип/формат/фит) → список пересчитывается, пустой фильтр показывает «Сбросить фильтры».
4. Нажми «Уточнить ИИ» на карточке → с ключом вернётся LLM-текст, без ключа — правило.
