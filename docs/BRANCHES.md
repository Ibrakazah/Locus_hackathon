# Ветки команды (защита от merge-конфликтов)

Работаем только в своей ветке. Ветки созданы от `main`, файлы поделены без пересечений.

| Ветка | Владелец | Можно трогать | НЕ трогать |
|---|---|---|---|
| `ui` | Ибрахим | `src/app/**` (кроме `onboarding/steps/**`), `src/components/ui/**`, `public/**` | `src/lib/**`, `src/lib/data/**` |
| `flow-engine` | flow+engine | `src/lib/flow/**`, `src/lib/engine/**`, `src/app/onboarding/steps/**` | страницы, дизайн-система, данные |
| `data` | data | `src/lib/data/**`, `docs/**`, `README.md` | код движка и страниц |

## Правила

1. Прямой пуш в `main` запрещён — только через PR из своей ветки.
2. Перед PR: `npm run build` и `npm run lint` зелёные, ветка подтянута (`git pull origin main`).
3. Типы `src/lib/engine/profile.ts` — контракт между ветками. Менять только PR с аппрувом flow+engine.
4. `package.json` (новые зависимости) — только через PR в `main` с обсуждением (см. `docs/TECH_STACK.md`).
5. Каждый PR получает preview-деплой на Vercel — ссылку кидаем в чат команды.

## Команды

```bash
git fetch origin
git checkout ui          # своя ветка
# ... работа ...
git add -A; git commit -m "ui: что сделано"
git push -u origin ui
```
