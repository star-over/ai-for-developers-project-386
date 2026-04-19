# Архитектура: «Запись на звонок»

## Подход

Design First: TypeSpec → OpenAPI → раздельная реализация фронтенда и бэкенда. API-контракт — единый источник правды.

## Стек технологий

### Frontend
- **Svelte 5** (runes)
- **Vite** (сборка)
- **Tailwind 4** (стили)
- **shadcn-svelte** (UI компоненты)
- **@tanstack/svelte-query** (запросы, кеш, инвалидация)
- **@mateothegreat/svelte5-router** (SPA роутинг) — нет `:param` синтаксиса, использовать RegExp; last-match-wins
- **Orval** (генерация TanStack Query хуков из OpenAPI) — параметры передаются как getter-функции `() => params`

### Backend
- **Node.js** + **Fastify**
- **Zod** (валидация запросов)
- **In-memory store** (Map + JSONL seed) — текущий этап
- **Drizzle ORM** + **SQLite** — будущий этап

### Валидация
- **Zod** (фронтенд + бэкенд) — единые схемы валидации данных
- Фронтенд: валидация форм для мгновенной обратной связи
- Бэкенд: авторитетная валидация входящих данных
- Zod-схемы: `.describe()` на каждом поле + кастомные сообщения об ошибках — для контекста AI-агентов

### API-контракт
- **TypeSpec** → **OpenAPI 3.x**
- **Prism** (mock-сервер из OpenAPI spec — разработка фронта без реального бэкенда)

#### TypeSpec: важные детали (v1.11+)
- `@service(#{ title: "..." })` — объектные значения в декораторах через `#{}`, не `{}`
- `@format("uuid")` на id-полях, `@format("email")` на email — дают правильные данные в Prism dynamic mode
- `@extension("additionalProperties", false)` на каждой модели — запрещает лишние поля; требует `import "@typespec/openapi"` + `using TypeSpec.OpenAPI`
- Prism запускать с `--dynamic` флагом — генерирует реалистичные данные по JSON Schema вместо пустых значений

### Тестирование
- **Vitest** (unit-тесты, фронт + бэк)
- **@testing-library/svelte** (компонентные тесты)
- **Playwright** (e2e тесты)
- Бэкенд: `fastify.inject()` для тестирования роутов без поднятия сервера

### Линтинг
- **ESLint 10** (flat config, единый `eslint.config.js` в корне)
- **eslint-plugin-svelte** (фронтенд)
- **typescript-eslint** (фронтенд + бэкенд)
- Стиль: Airbnb
- **Политика:** errors — только то, что ломает билд. Форматирование и стиль — warnings
- **Pre-commit hook:** `make check` (lint + typecheck frontend/backend + vitest) запускается автоматически перед каждым коммитом

### i18n (централизация строк)
- Типизированный TS-модуль (`i18n/index.ts`) — простой объект со строками
- Без внешних библиотек (одноязычный проект)
- При необходимости мультиязычности — миграция на `svelte-i18n`

### Деплой
- **Docker** (multi-stage build)

## Структура проекта

```
project/
├── spec/                        # TypeSpec → OpenAPI
│   ├── main.tsp
│   └── tspconfig.yaml
├── frontend/                    # Svelte 5 SPA
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/      # shadcn-svelte + кастомные
│   │   │   ├── api/             # Orval-generated хуки
│   │   │   ├── i18n/            # Централизованные строки
│   │   │   └── stores/          # Svelte stores
│   │   ├── pages/               # Страницы
│   │   ├── App.svelte
│   │   └── main.ts
│   ├── orval.config.ts
│   └── vite.config.ts
├── backend/
│   ├── data/                    # JSONL seed файлы
│   ├── src/
│   │   ├── routes/              # Fastify роуты (event-types, slots, bookings, admin)
│   │   ├── app.ts               # Фабрика Fastify (для тестов)
│   │   ├── store.ts             # In-memory Map хранилище + JSONL загрузка
│   │   ├── validation.ts        # Zod-схемы валидации
│   │   └── index.ts             # Точка входа
│   ├── tests/                   # Vitest через fastify.inject()
│   └── package.json
├── e2e/                         # Playwright e2e тесты
├── docs/
│   ├── spec.md
│   └── architecture.md
├── Dockerfile
└── Makefile
```

## Разработка фронтенда и бэкенда

Фронтенд и бэкенд — отдельные части приложения. Фронтенд получает данные и выполняет действия **только через API по контракту**. Интерфейс должен корректно работать с отдельно запущенным бэкендом.

### Режимы разработки фронтенда:
1. **С реальным бэкендом (основной):** `make dev-backend` + `make dev-frontend` — Vite proxy направляет `/api` на `localhost:3000`
2. **С mock-сервером (Prism):** `make mock` + изменить proxy target на `localhost:4010` в `vite.config.ts` — для работы без бэкенда

## Pipeline генерации кода

```
spec/main.tsp → tsp compile → openapi.yaml → orval → frontend/src/lib/api/
```

### Makefile

`make help` — список всех команд. Основные:

| Команда | Описание |
|---------|----------|
| `make generate` | TypeSpec → OpenAPI → Orval hooks |
| `make dev-frontend` | Vite dev server (port 5173) |
| `make dev-backend` | Fastify dev server (port 3000) |
| `make mock` | Prism mock server (port 4010) |
| `make lint` / `make lint-fix` | ESLint check / autofix |
| `make typecheck` | TypeScript check (frontend + backend) |
| `make test` | Vitest (frontend + backend) |
| `make test-e2e` | Playwright e2e |
| `make check` | Full quality gate (lint + typecheck + test) |

## Docker

Один Docker-образ. Бэкенд отдаёт API + статику фронтенда.

### Multi-stage build:
1. **Stage 1:** сборка фронтенда (`npm run build` → static files)
2. **Stage 2:** сборка бэкенда
3. **Stage 3:** production образ — Node.js сервер отдаёт API + статику из `dist/`

### Конфигурация (env):
- `PORT` — порт сервера (default: 3000)
- `DATABASE_URL` — путь к SQLite файлу (default: `./data/db.sqlite`)

### Запуск:
```bash
docker build -t calendar .
docker run -p 3000:3000 -v ./data:/app/data calendar
```

SQLite файл персистится через Docker volume.

## Генерация слотов

Бэкенд генерирует слоты на запрошенную дату:
1. Формирует массив слотов: 09:00, 09:30, 10:00, ..., 16:30
2. Проверяет по базе какие заняты (среди всех типов событий)
3. Возвращает массив `{startTime, endTime, available: boolean}`

Защита от race condition: unique constraint на `startTime` в таблице bookings.

---

> Нетривиальные детали реализации (роутинг, Orval, Svelte runes) — см. [`docs/gotchas.md`](./gotchas.md)
