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
- **@mateothegreat/svelte5-router** (SPA роутинг)
- **Orval** (генерация TanStack Query хуков из OpenAPI)

### Backend
- **Node.js** + **Fastify**
- **Drizzle ORM** (работа с БД)
- **SQLite** (база данных)

### Валидация
- **Zod** (фронтенд + бэкенд) — единые схемы валидации данных
- Фронтенд: валидация форм для мгновенной обратной связи
- Бэкенд: авторитетная валидация входящих данных
- Zod-схемы: `.describe()` на каждом поле + кастомные сообщения об ошибках — для контекста AI-агентов

### API-контракт
- **TypeSpec** → **OpenAPI 3.x**
- **Prism** (mock-сервер из OpenAPI spec — разработка фронта без реального бэкенда)

### Тестирование
- **Vitest** (unit-тесты, фронт + бэк)
- **@testing-library/svelte** (компонентные тесты)
- **Playwright** (e2e тесты)
- Бэкенд: `fastify.inject()` для тестирования роутов без поднятия сервера

### Линтинг
- **ESLint 9** (flat config, единый `eslint.config.js`)
- **eslint-plugin-svelte** (фронтенд)
- **@eslint/js** recommended (бэкенд)
- Стиль: Airbnb
- **Политика:** errors — только то, что ломает билд. Форматирование и стиль — warnings
- **Порядок работы:** при имплементации фокус на errors, warnings устраняются отдельным этапом
- **Стиль функций (warning):** новые функции оформлять как `const fx = (props) => {}` с вызовом `fx({ var1, var2 })` — именованные параметры через объект для читаемости AI-агентами. Не приоритетно, применяется после работающего кода

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
│   ├── src/
│   │   ├── routes/              # Fastify роуты
│   │   ├── db/                  # Drizzle schema + миграции
│   │   └── index.ts
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
1. **С mock-сервером (Prism):** `prism mock openapi.yaml` — фронт работает без реального бэкенда, Prism отдаёт ответы по OpenAPI spec
2. **С реальным бэкендом:** фронт подключается к запущенному бэкенду

## Pipeline генерации кода

```
spec/main.tsp → tsp compile → openapi.yaml → orval → frontend/src/lib/api/
```

### Makefile

```makefile
spec-build:
	cd spec && tsp compile .

api-generate:
	cd frontend && orval

generate: spec-build api-generate

mock:
	prism mock spec/openapi.yaml

lint:
	npx eslint .

lint-fix:
	npx eslint . --fix

test:
	cd frontend && npx vitest run
	cd backend && npx vitest run

test-e2e:
	cd e2e && npx playwright test
```

- `make generate` — обновляет всё от контракта до клиентского кода
- `make mock` — запуск Prism mock-сервера
- `make lint` / `make lint-fix` — проверка / автоисправление
- `make test` — unit-тесты фронт + бэк
- `make test-e2e` — e2e тесты

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
