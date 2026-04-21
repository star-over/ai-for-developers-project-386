# CI: GitHub Actions Quality Gate

## Цель

Автоматическая проверка при каждом push в GitHub: линтинг, типы, тесты, билд.

## Решения

- Один job, последовательные шаги (простота важнее параллелизма)
- Все проверки через `make check` — CI и pre-commit hook идентичны
- Node 22 LTS, версия фиксируется в `.nvmrc`
- Кэширование npm по 4 lockfile'ам (root, frontend, backend, e2e)

## Новые/изменённые файлы

### `.nvmrc` (новый)

Содержит `22`. Используется и CI (`node-version-file`), и локально (nvm).

### `.github/workflows/ci.yml` (новый)

Триггер: `push` на любую ветку.

Шаги:
1. `actions/checkout@v4`
2. `actions/setup-node@v4` — версия из `.nvmrc`, кэш npm по 4 lockfile'ам
3. `npm ci` в root, frontend, backend, e2e
4. `make check`

### `Makefile` (изменение)

- Добавить таргет `build`: `cd frontend && npm run build`
- Расширить `check`: `check: lint typecheck test build`
- Добавить `build` в `.PHONY`

## Порядок проверок в `make check`

1. `lint` — быстрый, ловит синтаксические ошибки
2. `typecheck` — проверка типов frontend (svelte-check) + backend (tsc)
3. `test` — unit-тесты backend + frontend (vitest)
4. `build` — сборка frontend (vite build)

## Что НЕ входит

- E2e тесты (Playwright) — требуют запущенных серверов, отдельная задача
- Матрица версий Node — избыточно
- Параллельные jobs — избыточно для текущего размера проекта
