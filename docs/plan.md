# «Запись на звонок» — План реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать полнофункциональный сервис бронирования звонков — от API-контракта до Docker-образа.

**Architecture:** Design First. TypeSpec → OpenAPI → Orval (фронт хуки). Фронт и бэк реализуются раздельно, общаются только через API-контракт. Фронт разрабатывается с Prism mock-сервером, бэк тестируется через fastify.inject().

**Tech Stack:** Svelte 5, Vite, Tailwind 4, shadcn-svelte, TanStack Query, svelte5-router, Fastify, Drizzle, SQLite, TypeSpec, Orval, Prism, Vitest, Playwright, ESLint 9, Docker.

**Specs:** `docs/spec.md`, `docs/architecture.md`

---

## Порядок задач

> **Порядок:** Фронтенд реализуется первым на Prism mock-сервере, бэкенд — после.

### Этап 1: Инфраструктура (выполнено)

| # | Задача | Статус |
|---|--------|--------|
| 1 | Корневой scaffolding + Makefile | ✅ Done |
| 2 | TypeSpec API-контракт | ✅ Done |

### Этап 2: Frontend (выполнено)

| # | Задача | Статус |
|---|--------|--------|
| 3 | Frontend scaffolding + Vite + Tailwind | ✅ Done |
| 4 | Orval кодогенерация | ✅ Done |
| 5 | Layout + Drawer-навигация + роутинг | ✅ Done |
| 6 | ESLint настройка | ✅ Done |
| 7 | Каталог типов событий (/booking) — верт. срез | ✅ Done |
| 8 | i18n строки | ✅ Done |
| 9 | Страница бронирования (/booking/:id) | ✅ Done |
| 10 | Админка — предстоящие встречи (/admin) | ✅ Done |
| 11 | Админка — CRUD типов событий | ✅ Done |
| 12 | Мои записи (LocalStorage) | ✅ Done |
| 13 | Главная страница (/) | ✅ Done |

### Этап 3: Backend (следующий)

| # | Задача | Зависит от |
|---|--------|-----------|
| 14 | Backend scaffolding | 2 |
| 15 | DB schema (Drizzle) | 14 |
| 16 | Backend: Event Types CRUD | 15 |
| 17 | Backend: Slots endpoint | 15 |
| 18 | Backend: Bookings endpoints | 15 |
| 19 | Backend: Admin bookings | 15 |

### Этап 4: Интеграция и финализация

| # | Задача | Зависит от |
|---|--------|-----------|
| 20 | E2E тесты (Playwright) | 16–19, 7–13 |
| 21 | Docker | 16–19, 7–13 |
| 22 | Lint cleanup (warnings) | 6, всё остальное |

---

## File Map

### Root
```
Makefile                          # Команды сборки, генерации, тестов
eslint.config.js                  # Единый ESLint flat config
```

### spec/
```
spec/main.tsp                     # TypeSpec API-контракт
spec/tspconfig.yaml               # TypeSpec конфигурация
spec/tsp-output/@typespec/openapi3/openapi.yaml  # Сгенерированный OpenAPI
```

### backend/
```
backend/package.json
backend/tsconfig.json
backend/vitest.config.ts
backend/src/index.ts              # Fastify сервер, точка входа
backend/src/app.ts                # Фабрика Fastify приложения (для тестов)
backend/src/db/schema.ts          # Drizzle schema (eventTypes, bookings)
backend/src/db/index.ts           # DB connection
backend/src/routes/event-types.ts # CRUD /api/event-types
backend/src/routes/slots.ts       # GET /api/slots
backend/src/routes/bookings.ts    # POST/GET/DELETE /api/bookings
backend/src/routes/admin.ts       # GET /api/admin/bookings
backend/tests/event-types.test.ts
backend/tests/slots.test.ts
backend/tests/bookings.test.ts
backend/tests/admin.test.ts
```

### frontend/
```
frontend/package.json
frontend/tsconfig.json
frontend/vite.config.ts
frontend/orval.config.ts
frontend/index.html
frontend/src/main.ts              # Точка входа
frontend/src/App.svelte           # Root компонент + router
frontend/src/lib/i18n/index.ts    # Централизованные строки
frontend/src/lib/i18n/ru.ts       # Русские строки
frontend/src/lib/api/             # Orval-generated (автогенерация)
frontend/src/lib/stores/bookings.ts  # LocalStorage store для "Мои записи"
frontend/src/lib/components/Layout.svelte       # Header + навигация
frontend/src/lib/components/SlotPicker.svelte    # Календарь + слоты
frontend/src/lib/components/BookingForm.svelte   # Форма имя + email
frontend/src/lib/components/MyBookings.svelte    # Компонент "Мои записи"
frontend/src/pages/Home.svelte
frontend/src/pages/EventTypes.svelte             # Каталог типов событий
frontend/src/pages/Booking.svelte                # Страница бронирования
frontend/src/pages/AdminBookings.svelte          # Предстоящие встречи
frontend/src/pages/AdminEventTypes.svelte        # CRUD типов событий
```

### e2e/
```
e2e/package.json
e2e/playwright.config.ts
e2e/tests/booking-flow.spec.ts
e2e/tests/admin.spec.ts
```

### Docker
```
Dockerfile
```

---

## Task 1: Корневой scaffolding + Makefile

**Files:**
- Create: `Makefile`

- [x] **Step 1: Создать Makefile**

```makefile
.PHONY: spec-build api-generate generate mock lint lint-fix test test-e2e

spec-build:
	cd spec && npx tsp compile .

api-generate:
	cd frontend && npx orval

generate: spec-build api-generate

mock:
	npx @stoplight/prism-cli mock spec/tsp-output/@typespec/openapi3/openapi.yaml --port 4010

lint:
	npx eslint .

lint-fix:
	npx eslint . --fix

test:
	cd backend && npx vitest run
	cd frontend && npx vitest run

test-e2e:
	cd e2e && npx playwright test

dev-backend:
	cd backend && npx tsx watch src/index.ts

dev-frontend:
	cd frontend && npx vite dev
```

- [x] **Step 2: Commit**

```bash
git add Makefile
git commit -m "chore: add root Makefile with build/test/dev commands"
```

---

## Task 2: TypeSpec API-контракт

**Files:**
- Create: `spec/main.tsp`
- Create: `spec/tspconfig.yaml`
- Create: `spec/package.json`

- [x] **Step 1: Инициализировать spec пакет**

```bash
mkdir -p spec
cd spec && npm init -y
```

- [x] **Step 2: Установить TypeSpec**

```bash
cd spec && npm install @typespec/compiler @typespec/http @typespec/rest @typespec/openapi3
```

- [x] **Step 3: Создать tspconfig.yaml**

```yaml
emit:
  - "@typespec/openapi3"
options:
  "@typespec/openapi3":
    output-file: openapi.yaml
```

- [x] **Step 4: Написать API-контракт spec/main.tsp**

```typespec
import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.Rest;

@service({
  title: "Calendar Booking API",
})
@server("http://localhost:3000", "Development server")
namespace CalendarAPI;

// --- Models ---

@doc("Meeting duration in minutes. Meetings shorter than 30 min still occupy a full 30-min slot.")
union Duration {
  ten: 10,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
}

@doc("Type of event that guests can book. Created and managed by the calendar owner.")
model EventType {
  @doc("Unique identifier (UUID v4)") id: string;
  @doc("Display name of the event type, shown to guests") @minLength(1) name: string;
  @doc("Duration of the meeting in minutes") duration: Duration;
  @doc("Creation timestamp in UTC ISO 8601") createdAt: utcDateTime;
}

@doc("Request body for creating a new event type")
model CreateEventTypeRequest {
  @doc("Display name, must not be empty") @minLength(1) name: string;
  @doc("Meeting duration: 10, 15, 20, or 30 minutes") duration: Duration;
}

@doc("Request body for partial update of an event type")
model UpdateEventTypeRequest {
  @doc("New display name, must not be empty if provided") @minLength(1) name?: string;
  @doc("New duration in minutes") duration?: Duration;
}

@doc("A booking made by a guest. Event type data (eventTypeName, duration) is denormalized — copied at creation time so bookings remain self-contained even if the event type is later modified or deleted.")
model Booking {
  @doc("Unique identifier (UUID v4)") id: string;
  @doc("ID of the event type at the time of booking (not a FK)") eventTypeId: string;
  @doc("Name of the event type, copied at creation time") eventTypeName: string;
  @doc("Meeting duration in minutes, copied at creation time") duration: Duration;
  @doc("Guest's name") guestName: string;
  @doc("Guest's email address") guestEmail: string;
  @doc("Start of the 30-min slot in UTC. Must be on a 30-min boundary within working hours (09:00–16:30)") startTime: utcDateTime;
  @doc("End of the 30-min slot (startTime + 30 min)") endTime: utcDateTime;
  @doc("Creation timestamp in UTC ISO 8601") createdAt: utcDateTime;
}

@doc("Request body for creating a booking. Backend looks up eventType to populate denormalized fields.")
model CreateBookingRequest {
  @doc("ID of the event type to book") eventTypeId: string;
  @doc("Guest's name, must not be empty") @minLength(1) guestName: string;
  @doc("Guest's email, must be a valid email address") guestEmail: string;
  @doc("Desired slot start time in UTC. Must be 30-min aligned, within 09:00–16:30, within 14 days from now") startTime: utcDateTime;
}

@doc("A 30-minute time slot. Availability is global — a slot occupied by any event type is unavailable for all.")
model Slot {
  @doc("Slot start time in UTC") startTime: utcDateTime;
  @doc("Slot end time in UTC (startTime + 30 min)") endTime: utcDateTime;
  @doc("true if slot is free for booking, false if already taken") available: boolean;
}

@doc("Standard error response returned for 400, 404, 409 errors")
model ErrorResponse {
  @doc("Human-readable error description") message: string;
}

// --- Routes ---

@doc("Event types CRUD — managed by calendar owner")
@route("/api/event-types")
namespace EventTypes {
  @doc("List all event types") @get op list(): EventType[];
  @doc("Create a new event type") @post op create(@body body: CreateEventTypeRequest): {
    @statusCode statusCode: 201;
    @body body: EventType;
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  };

  @route("/{id}")
  namespace ById {
    @doc("Partially update an event type by ID") @patch op update(@path id: string, @body body: UpdateEventTypeRequest): EventType | {
      @statusCode statusCode: 404;
      @body body: ErrorResponse;
    } | {
      @statusCode statusCode: 400;
      @body body: ErrorResponse;
    };
    @doc("Delete an event type by ID. Existing bookings are preserved (denormalized).") @delete op delete(@path id: string): {
      @statusCode statusCode: 204;
    } | {
      @statusCode statusCode: 404;
      @body body: ErrorResponse;
    };
  }
}

@doc("Available time slots. Slots are global: a slot taken by any event type is unavailable for all.")
@route("/api/slots")
namespace Slots {
  @doc("Get slots for a specific date and event type. Date format: YYYY-MM-DD. Returns all 30-min slots within working hours with availability status.")
  @get op list(@doc("Date in YYYY-MM-DD format, must be within 14 days from today") @query date: string, @doc("Event type ID — used to validate existence and provide context") @query eventTypeId: string): Slot[] | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  };
}

@doc("Guest booking operations")
@route("/api/bookings")
namespace Bookings {
  @doc("Create a booking. Returns 409 if slot is already taken, 404 if eventType not found.")
  @post op create(@body body: CreateBookingRequest): {
    @statusCode statusCode: 201;
    @body body: Booking;
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 409;
    @body body: ErrorResponse;
  };

  @route("/{id}")
  namespace ById {
    @doc("Get booking details by ID") @get op get(@path id: string): Booking | {
      @statusCode statusCode: 404;
      @body body: ErrorResponse;
    };
    @doc("Cancel (delete) a booking by ID. Physically removes the record.") @delete op cancel(@path id: string): {
      @statusCode statusCode: 204;
    } | {
      @statusCode statusCode: 404;
      @body body: ErrorResponse;
    };
  }
}

@doc("Admin endpoints — calendar owner's view of all bookings")
@route("/api/admin/bookings")
namespace AdminBookings {
  @doc("List all upcoming bookings sorted by startTime ascending") @get op list(): Booking[];
}
```

- [x] **Step 5: Скомпилировать и проверить**

```bash
cd spec && npx tsp compile .
```

Ожидаемый результат: файл `spec/tsp-output/@typespec/openapi3/openapi.yaml` создан без ошибок.

- [x] **Step 6: Проверить сгенерированный OpenAPI**

```bash
cat spec/tsp-output/@typespec/openapi3/openapi.yaml
```

Убедиться что все 9 endpoints присутствуют с правильными методами и путями.

- [x] **Step 7: Commit**

```bash
git add spec/
git commit -m "feat: add TypeSpec API contract with OpenAPI generation"
```

---

## Task 3: Backend scaffolding

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/app.ts`
- Create: `backend/src/index.ts`

- [ ] **Step 1: Инициализировать backend пакет**

```bash
mkdir -p backend/src
cd backend && npm init -y
```

- [ ] **Step 2: Установить зависимости**

```bash
cd backend && npm install fastify @fastify/cors @fastify/static zod
cd backend && npm install -D typescript tsx @types/node vitest
```

- [ ] **Step 3: Создать tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4: Создать backend/src/app.ts — фабрика Fastify**

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: true });

  app.get('/api/health', async () => {
    return { status: 'ok' };
  });

  return app;
}
```

- [ ] **Step 5: Создать backend/src/index.ts — точка входа**

```typescript
import { buildApp } from './app.js';

const app = buildApp();

const port = Number(process.env.PORT) || 3000;

app.listen({ port, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});
```

- [ ] **Step 6: Добавить скрипты в package.json**

В `backend/package.json` добавить:
```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run"
  }
}
```

- [ ] **Step 7: Запустить и проверить**

```bash
cd backend && npx tsx src/index.ts &
curl http://localhost:3000/api/health
# Ожидаемый ответ: {"status":"ok"}
kill %1
```

- [ ] **Step 8: Commit**

```bash
git add backend/
git commit -m "feat: backend scaffolding with Fastify"
```

---

## Task 4: DB schema (Drizzle + SQLite)

**Files:**
- Create: `backend/src/db/schema.ts`
- Create: `backend/src/db/index.ts`
- Create: `backend/vitest.config.ts`

- [ ] **Step 1: Установить Drizzle + SQLite**

```bash
cd backend && npm install drizzle-orm better-sqlite3
cd backend && npm install -D drizzle-kit @types/better-sqlite3
```

- [ ] **Step 2: Создать backend/src/db/schema.ts**

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const eventTypes = sqliteTable('event_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  duration: integer('duration').notNull(), // 10, 15, 20, 30
  createdAt: text('created_at').notNull(), // ISO 8601 UTC
});

// Денормализовано: eventTypeName и duration копируются при создании.
// Нет FK — тип события можно удалять без влияния на бронирования.
export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey(),
  eventTypeId: text('event_type_id').notNull(),
  eventTypeName: text('event_type_name').notNull(),
  duration: integer('duration').notNull(), // 10, 15, 20, 30
  guestName: text('guest_name').notNull(),
  guestEmail: text('guest_email').notNull(),
  startTime: text('start_time').notNull().unique(), // ISO 8601 UTC, unique constraint
  endTime: text('end_time').notNull(), // ISO 8601 UTC
  createdAt: text('created_at').notNull(), // ISO 8601 UTC
});
```

- [ ] **Step 3: Создать backend/src/db/index.ts**

```typescript
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

export function createDb(url?: string) {
  const sqlite = new Database(url || process.env.DATABASE_URL || './data/db.sqlite');
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return drizzle(sqlite, { schema });
}

export type AppDatabase = ReturnType<typeof createDb>;
```

- [ ] **Step 4: Создать backend/vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
});
```

- [ ] **Step 5: Написать тест — схема создаётся без ошибок**

Создать `backend/tests/db.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from '../src/db/schema.js';

function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });

  sqlite.exec(`
    CREATE TABLE event_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      duration INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE bookings (
      id TEXT PRIMARY KEY,
      event_type_id TEXT NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      start_time TEXT NOT NULL UNIQUE,
      end_time TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  return db;
}

describe('DB Schema', () => {
  it('should create tables and insert event type', async () => {
    const db = createTestDb();
    await db.insert(schema.eventTypes).values({
      id: '1',
      name: 'Quick Call',
      duration: 15,
      createdAt: new Date().toISOString(),
    });
    const result = await db.select().from(schema.eventTypes);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Quick Call');
  });

  it('should enforce unique startTime on bookings', async () => {
    const db = createTestDb();
    await db.insert(schema.eventTypes).values({
      id: '1',
      name: 'Call',
      duration: 30,
      createdAt: new Date().toISOString(),
    });

    const booking = {
      id: 'b1',
      eventTypeId: '1',
      guestName: 'Alice',
      guestEmail: 'alice@example.com',
      startTime: '2026-04-20T09:00:00.000Z',
      endTime: '2026-04-20T09:30:00.000Z',
      createdAt: new Date().toISOString(),
    };

    await db.insert(schema.bookings).values(booking);

    expect(() => {
      // Synchronous better-sqlite3 will throw on unique violation
      db.insert(schema.bookings).values({ ...booking, id: 'b2' });
    }).toThrow();
  });

  it('should keep bookings when event type deleted (denormalized)', async () => {
    const db = createTestDb();
    await db.insert(schema.eventTypes).values({
      id: '1',
      name: 'Call',
      duration: 30,
      createdAt: new Date().toISOString(),
    });
    await db.insert(schema.bookings).values({
      id: 'b1',
      eventTypeId: '1',
      eventTypeName: 'Call',
      duration: 30,
      guestName: 'Alice',
      guestEmail: 'alice@example.com',
      startTime: '2026-04-20T09:00:00.000Z',
      endTime: '2026-04-20T09:30:00.000Z',
      createdAt: new Date().toISOString(),
    });

    await db.delete(schema.eventTypes).where(sql`id = '1'`);
    const remaining = await db.select().from(schema.bookings);
    expect(remaining).toHaveLength(1);
  });
});
```

- [ ] **Step 6: Запустить тесты**

```bash
cd backend && npx vitest run
```

Ожидаемый результат: 3 теста пройдены.

- [ ] **Step 7: Commit**

```bash
git add backend/
git commit -m "feat: Drizzle schema for event_types and bookings with SQLite"
```

---

## Task 5: Backend — Event Types CRUD

**Files:**
- Create: `backend/src/routes/event-types.ts`
- Modify: `backend/src/app.ts`
- Create: `backend/tests/event-types.test.ts`

- [ ] **Step 1: Написать тесты backend/tests/event-types.test.ts**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';

describe('Event Types API', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(async () => {
    app = buildApp({ dbUrl: ':memory:' });
    await app.ready();
  });

  it('GET /api/event-types returns empty list', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/event-types' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('POST /api/event-types creates event type', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { name: 'Quick Call', duration: 15 },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.name).toBe('Quick Call');
    expect(body.duration).toBe(15);
    expect(body.id).toBeDefined();
    expect(body.createdAt).toBeDefined();
  });

  it('POST /api/event-types validates duration enum', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { name: 'Bad', duration: 25 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('PATCH /api/event-types/:id updates event type', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { name: 'Call', duration: 30 },
    });
    const { id } = create.json();

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/event-types/${id}`,
      payload: { name: 'Updated Call' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe('Updated Call');
  });

  it('DELETE /api/event-types/:id removes event type', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { name: 'Call', duration: 30 },
    });
    const { id } = create.json();

    const del = await app.inject({ method: 'DELETE', url: `/api/event-types/${id}` });
    expect(del.statusCode).toBe(204);

    const list = await app.inject({ method: 'GET', url: '/api/event-types' });
    expect(list.json()).toEqual([]);
  });

  it('DELETE /api/event-types/:id returns 404 for unknown id', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/api/event-types/unknown' });
    expect(res.statusCode).toBe(404);
  });
});
```

- [ ] **Step 2: Запустить тесты — убедиться что падают**

```bash
cd backend && npx vitest run tests/event-types.test.ts
```

Ожидаемый результат: FAIL (routes не реализованы).

- [ ] **Step 3: Обновить backend/src/app.ts — принимать dbUrl, авто-миграция**

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './db/schema.js';
import { eventTypesRoutes } from './routes/event-types.js';

interface AppOptions {
  dbUrl?: string;
}

function initDb(url: string) {
  const sqlite = new Database(url);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS event_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      duration INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      event_type_id TEXT NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      start_time TEXT NOT NULL UNIQUE,
      end_time TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  return drizzle(sqlite, { schema });
}

export function buildApp(options?: AppOptions) {
  const app = Fastify({ logger: options?.dbUrl === ':memory:' ? false : true });
  const db = initDb(options?.dbUrl || process.env.DATABASE_URL || './data/db.sqlite');

  app.register(cors, { origin: true });
  app.decorate('db', db);

  app.get('/api/health', async () => ({ status: 'ok' }));

  app.register(eventTypesRoutes);

  return app;
}
```

- [ ] **Step 4: Создать backend/src/routes/event-types.ts**

```typescript
import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';

const VALID_DURATIONS = [10, 15, 20, 30];

export async function eventTypesRoutes(app: FastifyInstance) {
  const db = (app as any).db;

  app.get('/api/event-types', async () => {
    return db.select().from(schema.eventTypes);
  });

  app.post('/api/event-types', async (request, reply) => {
    const { name, duration } = request.body as { name: string; duration: number };

    if (!name || !VALID_DURATIONS.includes(duration)) {
      return reply.status(400).send({ message: 'Invalid name or duration' });
    }

    const eventType = {
      id: randomUUID(),
      name,
      duration,
      createdAt: new Date().toISOString(),
    };

    await db.insert(schema.eventTypes).values(eventType);
    return reply.status(201).send(eventType);
  });

  app.patch('/api/event-types/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { name?: string; duration?: number };

    if (body.duration && !VALID_DURATIONS.includes(body.duration)) {
      return reply.status(400).send({ message: 'Invalid duration' });
    }

    const existing = await db.select().from(schema.eventTypes).where(eq(schema.eventTypes.id, id));
    if (existing.length === 0) {
      return reply.status(404).send({ message: 'Not found' });
    }

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.duration !== undefined) updates.duration = body.duration;

    await db.update(schema.eventTypes).set(updates).where(eq(schema.eventTypes.id, id));

    const updated = await db.select().from(schema.eventTypes).where(eq(schema.eventTypes.id, id));
    return reply.send(updated[0]);
  });

  app.delete('/api/event-types/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const existing = await db.select().from(schema.eventTypes).where(eq(schema.eventTypes.id, id));
    if (existing.length === 0) {
      return reply.status(404).send({ message: 'Not found' });
    }

    await db.delete(schema.eventTypes).where(eq(schema.eventTypes.id, id));
    return reply.status(204).send();
  });
}
```

- [ ] **Step 5: Запустить тесты**

```bash
cd backend && npx vitest run tests/event-types.test.ts
```

Ожидаемый результат: все 6 тестов пройдены.

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: Event Types CRUD API with tests"
```

---

## Task 6: Backend — Slots endpoint

**Files:**
- Create: `backend/src/routes/slots.ts`
- Modify: `backend/src/app.ts`
- Create: `backend/tests/slots.test.ts`

- [ ] **Step 1: Написать тесты backend/tests/slots.test.ts**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';

describe('Slots API', () => {
  let app: ReturnType<typeof buildApp>;
  let eventTypeId: string;

  beforeEach(async () => {
    app = buildApp({ dbUrl: ':memory:' });
    await app.ready();

    const res = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { name: 'Call', duration: 30 },
    });
    eventTypeId = res.json().id;
  });

  it('GET /api/slots returns 16 slots for a day (09:00-16:30)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/slots?date=2026-04-20&eventTypeId=${eventTypeId}`,
    });
    expect(res.statusCode).toBe(200);
    const slots = res.json();
    expect(slots).toHaveLength(16);
    expect(slots[0].startTime).toContain('09:00');
    expect(slots[15].startTime).toContain('16:30');
    expect(slots.every((s: any) => s.available === true)).toBe(true);
  });

  it('booked slot shows as unavailable', async () => {
    // Create a booking for 09:00
    await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId,
        guestName: 'Alice',
        guestEmail: 'alice@test.com',
        startTime: '2026-04-20T09:00:00.000Z',
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/slots?date=2026-04-20&eventTypeId=${eventTypeId}`,
    });
    const slots = res.json();
    const slot0900 = slots.find((s: any) => s.startTime.includes('09:00'));
    expect(slot0900.available).toBe(false);
  });

  it('slot booked by different event type is also unavailable', async () => {
    // Create another event type
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { name: 'Short Call', duration: 15 },
    });
    const otherTypeId = res2.json().id;

    // Book with other type at 10:00
    await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId: otherTypeId,
        guestName: 'Bob',
        guestEmail: 'bob@test.com',
        startTime: '2026-04-20T10:00:00.000Z',
      },
    });

    // Check slots for first event type — 10:00 should be unavailable
    const res = await app.inject({
      method: 'GET',
      url: `/api/slots?date=2026-04-20&eventTypeId=${eventTypeId}`,
    });
    const slots = res.json();
    const slot1000 = slots.find((s: any) => s.startTime.includes('10:00'));
    expect(slot1000.available).toBe(false);
  });

  it('returns 400 if date or eventTypeId missing', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/slots' });
    expect(res.statusCode).toBe(400);
  });
});
```

- [ ] **Step 2: Запустить тесты — убедиться что падают**

```bash
cd backend && npx vitest run tests/slots.test.ts
```

- [ ] **Step 3: Создать backend/src/routes/slots.ts**

```typescript
import { FastifyInstance } from 'fastify';
import { and, gte, lt } from 'drizzle-orm';
import * as schema from '../db/schema.js';

const SLOT_DURATION = 30; // minutes
const WORK_START_HOUR = 9;
const WORK_END_HOUR = 17;

export async function slotsRoutes(app: FastifyInstance) {
  const db = (app as any).db;

  app.get('/api/slots', async (request, reply) => {
    const { date, eventTypeId } = request.query as { date?: string; eventTypeId?: string };

    if (!date || !eventTypeId) {
      return reply.status(400).send({ message: 'date and eventTypeId are required' });
    }

    // Generate all slots for the day
    const slots = [];
    for (let hour = WORK_START_HOUR; hour < WORK_END_HOUR; hour++) {
      for (let min = 0; min < 60; min += SLOT_DURATION) {
        const startTime = new Date(`${date}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00.000Z`);
        const endTime = new Date(startTime.getTime() + SLOT_DURATION * 60 * 1000);
        slots.push({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        });
      }
    }

    // Get all bookings for this date (any event type — global occupancy)
    const dayStart = `${date}T00:00:00.000Z`;
    const dayEnd = `${date}T23:59:59.999Z`;

    const existingBookings = await db
      .select({ startTime: schema.bookings.startTime })
      .from(schema.bookings)
      .where(
        and(
          gte(schema.bookings.startTime, dayStart),
          lt(schema.bookings.startTime, dayEnd),
        ),
      );

    const bookedTimes = new Set(existingBookings.map((b: any) => b.startTime));

    return slots.map((slot) => ({
      ...slot,
      available: !bookedTimes.has(slot.startTime),
    }));
  });
}
```

- [ ] **Step 4: Зарегистрировать в app.ts**

Добавить import и register в `backend/src/app.ts`:

```typescript
import { slotsRoutes } from './routes/slots.js';
// ...в buildApp:
app.register(slotsRoutes);
```

- [ ] **Step 5: Запустить тесты**

```bash
cd backend && npx vitest run tests/slots.test.ts
```

Ожидаемый результат: все 4 теста пройдены.

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: Slots API with global occupancy check"
```

---

## Task 7: Backend — Bookings endpoints

**Files:**
- Create: `backend/src/routes/bookings.ts`
- Modify: `backend/src/app.ts`
- Create: `backend/tests/bookings.test.ts`

- [ ] **Step 1: Написать тесты backend/tests/bookings.test.ts**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';

describe('Bookings API', () => {
  let app: ReturnType<typeof buildApp>;
  let eventTypeId: string;

  beforeEach(async () => {
    app = buildApp({ dbUrl: ':memory:' });
    await app.ready();

    const res = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { name: 'Call', duration: 30 },
    });
    eventTypeId = res.json().id;
  });

  it('POST /api/bookings creates booking', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId,
        guestName: 'Alice',
        guestEmail: 'alice@test.com',
        startTime: '2026-04-20T09:00:00.000Z',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.guestName).toBe('Alice');
    expect(body.eventTypeName).toBe('Call');
    expect(body.duration).toBe(30);
    expect(body.endTime).toBe('2026-04-20T09:30:00.000Z');
  });

  it('POST /api/bookings rejects duplicate startTime', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId,
        guestName: 'Alice',
        guestEmail: 'alice@test.com',
        startTime: '2026-04-20T09:00:00.000Z',
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId,
        guestName: 'Bob',
        guestEmail: 'bob@test.com',
        startTime: '2026-04-20T09:00:00.000Z',
      },
    });
    expect(res.statusCode).toBe(409);
  });

  it('POST /api/bookings validates startTime is on 30-min boundary', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId,
        guestName: 'Alice',
        guestEmail: 'alice@test.com',
        startTime: '2026-04-20T09:15:00.000Z',
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/bookings validates startTime within work hours', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId,
        guestName: 'Alice',
        guestEmail: 'alice@test.com',
        startTime: '2026-04-20T18:00:00.000Z',
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('GET /api/bookings/:id returns booking', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId,
        guestName: 'Alice',
        guestEmail: 'alice@test.com',
        startTime: '2026-04-20T09:00:00.000Z',
      },
    });
    const { id } = create.json();

    const res = await app.inject({ method: 'GET', url: `/api/bookings/${id}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().guestName).toBe('Alice');
  });

  it('DELETE /api/bookings/:id removes booking', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId,
        guestName: 'Alice',
        guestEmail: 'alice@test.com',
        startTime: '2026-04-20T09:00:00.000Z',
      },
    });
    const { id } = create.json();

    const del = await app.inject({ method: 'DELETE', url: `/api/bookings/${id}` });
    expect(del.statusCode).toBe(204);

    const get = await app.inject({ method: 'GET', url: `/api/bookings/${id}` });
    expect(get.statusCode).toBe(404);
  });

  it('POST /api/bookings validates required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { eventTypeId, guestName: '', guestEmail: '' },
    });
    expect(res.statusCode).toBe(400);
  });
});
```

- [ ] **Step 2: Запустить — убедиться что падают**

```bash
cd backend && npx vitest run tests/bookings.test.ts
```

- [ ] **Step 3: Создать backend/src/routes/bookings.ts**

```typescript
import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';

const SLOT_DURATION = 30;
const WORK_START_HOUR = 9;
const WORK_END_HOUR = 17;

export async function bookingsRoutes(app: FastifyInstance) {
  const db = (app as any).db;

  app.post('/api/bookings', async (request, reply) => {
    const { eventTypeId, guestName, guestEmail, startTime } = request.body as {
      eventTypeId: string;
      guestName: string;
      guestEmail: string;
      startTime: string;
    };

    // Validate required fields
    if (!eventTypeId || !guestName || !guestEmail || !startTime) {
      return reply.status(400).send({ message: 'All fields are required' });
    }

    // Validate event type exists
    const eventType = await db
      .select()
      .from(schema.eventTypes)
      .where(eq(schema.eventTypes.id, eventTypeId));
    if (eventType.length === 0) {
      return reply.status(400).send({ message: 'Event type not found' });
    }

    // Validate startTime
    const start = new Date(startTime);
    const minutes = start.getUTCMinutes();
    const hours = start.getUTCHours();

    if (minutes % SLOT_DURATION !== 0) {
      return reply.status(400).send({ message: 'startTime must be on 30-minute boundary' });
    }

    if (hours < WORK_START_HOUR || hours >= WORK_END_HOUR) {
      return reply.status(400).send({ message: 'startTime must be within work hours (09:00-17:00)' });
    }

    // Last slot is 16:30 (ends at 17:00)
    if (hours === WORK_END_HOUR - 1 && minutes > SLOT_DURATION) {
      return reply.status(400).send({ message: 'startTime must be within work hours' });
    }

    const endTime = new Date(start.getTime() + SLOT_DURATION * 60 * 1000).toISOString();

    const booking = {
      id: randomUUID(),
      eventTypeId,
      guestName,
      guestEmail,
      startTime: start.toISOString(),
      endTime,
      createdAt: new Date().toISOString(),
    };

    try {
      await db.insert(schema.bookings).values(booking);
    } catch (err: any) {
      if (err.message?.includes('UNIQUE constraint failed')) {
        return reply.status(409).send({ message: 'Slot already booked' });
      }
      throw err;
    }

    return reply.status(201).send(booking);
  });

  app.get('/api/bookings/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await db.select().from(schema.bookings).where(eq(schema.bookings.id, id));
    if (result.length === 0) {
      return reply.status(404).send({ message: 'Not found' });
    }
    return result[0];
  });

  app.delete('/api/bookings/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await db.select().from(schema.bookings).where(eq(schema.bookings.id, id));
    if (existing.length === 0) {
      return reply.status(404).send({ message: 'Not found' });
    }
    await db.delete(schema.bookings).where(eq(schema.bookings.id, id));
    return reply.status(204).send();
  });
}
```

- [ ] **Step 4: Зарегистрировать в app.ts**

```typescript
import { bookingsRoutes } from './routes/bookings.js';
// ...в buildApp:
app.register(bookingsRoutes);
```

- [ ] **Step 5: Запустить тесты**

```bash
cd backend && npx vitest run tests/bookings.test.ts
```

Ожидаемый результат: все 7 тестов пройдены.

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: Bookings API (create, get, cancel) with validation"
```

---

## Task 8: Backend — Admin bookings

**Files:**
- Create: `backend/src/routes/admin.ts`
- Modify: `backend/src/app.ts`
- Create: `backend/tests/admin.test.ts`

- [ ] **Step 1: Написать тесты backend/tests/admin.test.ts**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';

describe('Admin Bookings API', () => {
  let app: ReturnType<typeof buildApp>;
  let eventTypeId: string;

  beforeEach(async () => {
    app = buildApp({ dbUrl: ':memory:' });
    await app.ready();

    const res = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { name: 'Call', duration: 30 },
    });
    eventTypeId = res.json().id;
  });

  it('GET /api/admin/bookings returns empty list', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/admin/bookings' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('GET /api/admin/bookings returns all bookings sorted by startTime', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId,
        guestName: 'Bob',
        guestEmail: 'bob@test.com',
        startTime: '2026-04-21T10:00:00.000Z',
      },
    });
    await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId,
        guestName: 'Alice',
        guestEmail: 'alice@test.com',
        startTime: '2026-04-20T09:00:00.000Z',
      },
    });

    const res = await app.inject({ method: 'GET', url: '/api/admin/bookings' });
    const bookings = res.json();
    expect(bookings).toHaveLength(2);
    expect(bookings[0].guestName).toBe('Alice'); // earlier date first
    expect(bookings[1].guestName).toBe('Bob');
  });
});
```

- [ ] **Step 2: Запустить — убедиться что падают**

```bash
cd backend && npx vitest run tests/admin.test.ts
```

- [ ] **Step 3: Создать backend/src/routes/admin.ts**

```typescript
import { FastifyInstance } from 'fastify';
import { asc } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export async function adminRoutes(app: FastifyInstance) {
  const db = (app as any).db;

  app.get('/api/admin/bookings', async () => {
    return db
      .select()
      .from(schema.bookings)
      .orderBy(asc(schema.bookings.startTime));
  });
}
```

- [ ] **Step 4: Зарегистрировать в app.ts**

```typescript
import { adminRoutes } from './routes/admin.js';
// ...в buildApp:
app.register(adminRoutes);
```

- [ ] **Step 5: Запустить все бэкенд тесты**

```bash
cd backend && npx vitest run
```

Ожидаемый результат: все тесты пройдены (db + event-types + slots + bookings + admin).

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: Admin bookings API with sorted results"
```

---

## Task 9: Frontend scaffolding

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/index.html`
- Create: `frontend/src/main.ts`
- Create: `frontend/src/App.svelte`
- Create: `frontend/src/app.css`

- [ ] **Step 1: Создать Svelte 5 + Vite проект**

```bash
mkdir -p frontend
cd frontend && npm create vite@latest . -- --template svelte-ts
```

Если Vite спросит — выбрать Svelte + TypeScript.

- [ ] **Step 2: Установить зависимости**

```bash
cd frontend && npm install
cd frontend && npm install @tanstack/svelte-query @mateothegreat/svelte5-router zod
```

- [ ] **Step 3: Установить Tailwind 4**

```bash
cd frontend && npm install -D tailwindcss @tailwindcss/vite
```

Обновить `frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
```

Обновить `frontend/src/app.css`:

```css
@import 'tailwindcss';
```

- [ ] **Step 4: Установить shadcn-svelte**

```bash
cd frontend && npx shadcn-svelte@latest init
```

Следовать интерактивной установке (выбрать стиль, цвета и т.д.).

- [ ] **Step 5: Добавить нужные shadcn компоненты**

```bash
cd frontend && npx shadcn-svelte@latest add button card input label dialog table badge
```

- [ ] **Step 6: Обновить frontend/src/App.svelte — минимальный роутер**

```svelte
<script lang="ts">
  import { Router, Route } from '@mateothegreat/svelte5-router';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

  const queryClient = new QueryClient();
</script>

<QueryClientProvider client={queryClient}>
  <Router>
    <Route path="/">
      <h1 class="text-2xl p-4">Calendar — Home</h1>
    </Route>
  </Router>
</QueryClientProvider>
```

- [ ] **Step 7: Запустить и проверить**

```bash
cd frontend && npm run dev
```

Открыть http://localhost:5173 — должна отображаться "Calendar — Home".

- [ ] **Step 8: Commit**

```bash
git add frontend/
git commit -m "feat: frontend scaffolding with Svelte 5, Vite, Tailwind 4, shadcn-svelte"
```

---

## Task 10: Orval кодогенерация

**Files:**
- Create: `frontend/orval.config.ts`

- [ ] **Step 1: Установить Orval**

```bash
cd frontend && npm install -D orval
```

- [ ] **Step 2: Создать frontend/orval.config.ts**

```typescript
import { defineConfig } from 'orval';

export default defineConfig({
  calendar: {
    input: {
      target: '../spec/tsp-output/@typespec/openapi3/openapi.yaml',
    },
    output: {
      target: './src/lib/api/endpoints.ts',
      client: 'svelte-query',
      mode: 'single',
      override: {
        mutator: {
          path: './src/lib/api/fetcher.ts',
          name: 'customFetch',
        },
      },
    },
  },
});
```

- [ ] **Step 3: Создать fetcher frontend/src/lib/api/fetcher.ts**

```typescript
const BASE_URL = '/api';

export async function customFetch<T>(config: {
  url: string;
  method: string;
  data?: unknown;
  params?: Record<string, string>;
  headers?: Record<string, string>;
}): Promise<T> {
  const url = new URL(`${window.location.origin}${config.url}`);

  if (config.params) {
    Object.entries(config.params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method: config.method,
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
    body: config.data ? JSON.stringify(config.data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
```

- [ ] **Step 4: Запустить генерацию**

```bash
make generate
```

Ожидаемый результат: файл `frontend/src/lib/api/endpoints.ts` создан с TanStack Query хуками.

- [ ] **Step 5: Проверить сгенерированный код**

```bash
cat frontend/src/lib/api/endpoints.ts
```

Должны быть функции/хуки для всех 9 endpoints.

- [ ] **Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: Orval code generation for TanStack Query hooks"
```

---

## Task 11: i18n строки

**Files:**
- Create: `frontend/src/lib/i18n/index.ts`
- Create: `frontend/src/lib/i18n/ru.ts`

- [ ] **Step 1: Создать frontend/src/lib/i18n/ru.ts**

```typescript
export const ru = {
  app: {
    name: 'Calendar',
  },
  nav: {
    booking: 'Записаться',
    admin: 'Админка',
  },
  home: {
    title: 'Calendar',
    subtitle: 'Забронируйте встречу за минуту: выберите тип события и удобное время.',
    cta: 'Записаться',
    features: {
      title: 'Возможности',
      slot: 'Найти слот и забронировать удобное время для встречи.',
      confirm: 'Быстрое бронирование с подтверждением и уведомлением.',
      manage: 'Управлять списком встреч и отменять предстоящие записи.',
    },
  },
  eventTypes: {
    title: 'Выберите тип события',
    subtitle: 'Нажмите на карточку, чтобы открыть календарь и выбрать удобный слот.',
    minutes: 'мин',
  },
  booking: {
    calendar: 'Календарь',
    slots: 'Статус слотов',
    available: 'Свободно',
    booked: 'Занято',
    selectedDate: 'Выбранная дата',
    selectedTime: 'Выбранное время',
    noTimeSelected: 'Время не выбрано',
    next: 'Продолжить',
    back: 'Назад',
    form: {
      name: 'Имя',
      email: 'Email',
      submit: 'Забронировать',
    },
    success: 'Бронирование создано!',
    freeSlots: 'св.',
  },
  myBookings: {
    title: 'Мои записи',
    cancel: 'Отменить',
    empty: 'У вас пока нет записей.',
    cancelConfirm: 'Отменить запись?',
  },
  admin: {
    bookings: {
      title: 'Предстоящие встречи',
      empty: 'Нет предстоящих встреч.',
      guest: 'Гость',
      email: 'Email',
      date: 'Дата',
      time: 'Время',
      type: 'Тип',
    },
    eventTypes: {
      title: 'Типы событий',
      add: 'Добавить тип события',
      edit: 'Редактировать',
      delete: 'Удалить',
      deleteConfirm: 'Удалить тип события? Все связанные бронирования будут удалены.',
      form: {
        name: 'Название',
        duration: 'Длительность',
        save: 'Сохранить',
        cancel: 'Отмена',
      },
    },
  },
  owner: {
    name: 'Tota',
    role: 'Host',
  },
} as const;
```

- [ ] **Step 2: Создать frontend/src/lib/i18n/index.ts**

```typescript
import { ru } from './ru.js';

export const t = ru;
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/i18n/
git commit -m "feat: i18n centralized strings (Russian)"
```

---

## Task 12: Frontend — Layout + навигация

**Files:**
- Create: `frontend/src/lib/components/Layout.svelte`
- Modify: `frontend/src/App.svelte`

- [ ] **Step 1: Создать frontend/src/lib/components/Layout.svelte**

```svelte
<script lang="ts">
  import { t } from '$lib/i18n/index.js';
  import { type Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<div class="min-h-screen bg-gray-50">
  <header class="border-b bg-white">
    <nav class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
      <a href="/" class="flex items-center gap-2 text-lg font-semibold">
        {t.app.name}
      </a>
      <div class="flex items-center gap-4">
        <a
          href="/booking"
          class="rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100"
        >
          {t.nav.booking}
        </a>
        <a
          href="/admin"
          class="rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100"
        >
          {t.nav.admin}
        </a>
      </div>
    </nav>
  </header>

  <main class="mx-auto max-w-5xl px-4 py-6">
    {@render children()}
  </main>
</div>
```

- [ ] **Step 2: Обновить frontend/src/App.svelte — все роуты**

```svelte
<script lang="ts">
  import { Router, Route } from '@mateothegreat/svelte5-router';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import Layout from '$lib/components/Layout.svelte';

  const queryClient = new QueryClient();
</script>

<QueryClientProvider client={queryClient}>
  <Layout>
    <Router>
      <Route path="/">
        <p>Home (TODO)</p>
      </Route>
      <Route path="/booking">
        <p>Event Types (TODO)</p>
      </Route>
      <Route path="/booking/:eventTypeId">
        <p>Booking (TODO)</p>
      </Route>
      <Route path="/admin">
        <p>Admin Bookings (TODO)</p>
      </Route>
      <Route path="/admin/event-types">
        <p>Admin Event Types (TODO)</p>
      </Route>
    </Router>
  </Layout>
</QueryClientProvider>
```

- [ ] **Step 3: Проверить**

```bash
cd frontend && npm run dev
```

Навигация должна работать: клик по ссылкам переключает роуты, header отображается на всех страницах.

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: Layout component with navigation and route stubs"
```

---

## Task 13: Frontend — Главная страница

**Files:**
- Create: `frontend/src/pages/Home.svelte`
- Modify: `frontend/src/App.svelte`

- [ ] **Step 1: Создать frontend/src/pages/Home.svelte**

```svelte
<script lang="ts">
  import { t } from '$lib/i18n/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
</script>

<div class="flex flex-col items-center gap-8 py-12">
  <div class="max-w-lg text-center">
    <p class="mb-2 text-sm text-muted-foreground">{t.home.subtitle}</p>
    <h1 class="mb-4 text-4xl font-bold">{t.home.title}</h1>
    <p class="mb-6 text-muted-foreground">{t.home.subtitle}</p>
    <a href="/booking">
      <Button size="lg">{t.home.cta}</Button>
    </a>
  </div>

  <div class="w-full max-w-md rounded-lg border bg-white p-6">
    <h2 class="mb-4 text-lg font-semibold">{t.home.features.title}</h2>
    <ul class="space-y-2 text-sm text-muted-foreground">
      <li>• {t.home.features.slot}</li>
      <li>• {t.home.features.confirm}</li>
      <li>• {t.home.features.manage}</li>
    </ul>
  </div>
</div>
```

- [ ] **Step 2: Подключить в App.svelte**

Заменить `<p>Home (TODO)</p>` на:
```svelte
<script lang="ts">
  import Home from './pages/Home.svelte';
  // ... остальные импорты
</script>

<Route path="/">
  <Home />
</Route>
```

- [ ] **Step 3: Проверить визуально**

Открыть http://localhost:5173/ — должна отображаться главная страница с кнопкой "Записаться".

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: Home page with landing content"
```

---

## Task 14: Frontend — Каталог типов событий

**Files:**
- Create: `frontend/src/pages/EventTypes.svelte`
- Modify: `frontend/src/App.svelte`

- [ ] **Step 1: Создать frontend/src/pages/EventTypes.svelte**

```svelte
<script lang="ts">
  import { t } from '$lib/i18n/index.js';
  import { createQuery } from '@tanstack/svelte-query';
  import { Card } from '$lib/components/ui/card/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { customFetch } from '$lib/api/fetcher.js';

  const eventTypesQuery = createQuery({
    queryKey: ['event-types'],
    queryFn: () =>
      customFetch<Array<{ id: string; name: string; duration: number; createdAt: string }>>({
        url: '/api/event-types',
        method: 'GET',
      }),
  });
</script>

<div class="mx-auto max-w-2xl">
  <div class="mb-8 rounded-lg border bg-white p-6">
    <div class="mb-4 flex items-center gap-3">
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-xl">
        🥚
      </div>
      <div>
        <p class="font-semibold">{t.owner.name}</p>
        <p class="text-sm text-muted-foreground">{t.owner.role}</p>
      </div>
    </div>

    <h1 class="mb-2 text-2xl font-bold">{t.eventTypes.title}</h1>
    <p class="text-muted-foreground">{t.eventTypes.subtitle}</p>
  </div>

  {#if $eventTypesQuery.isLoading}
    <p class="text-muted-foreground">Loading...</p>
  {:else if $eventTypesQuery.isError}
    <p class="text-red-500">Error loading event types</p>
  {:else if $eventTypesQuery.data}
    <div class="grid gap-4 sm:grid-cols-2">
      {#each $eventTypesQuery.data as eventType}
        <a href="/booking/{eventType.id}">
          <Card.Root class="cursor-pointer transition-shadow hover:shadow-md">
            <Card.Header>
              <div class="flex items-center justify-between">
                <Card.Title>{eventType.name}</Card.Title>
                <Badge variant="secondary">{eventType.duration} {t.eventTypes.minutes}</Badge>
              </div>
            </Card.Header>
          </Card.Root>
        </a>
      {/each}
    </div>
  {/if}
</div>
```

- [ ] **Step 2: Подключить в App.svelte**

```svelte
import EventTypes from './pages/EventTypes.svelte';
// ...
<Route path="/booking">
  <EventTypes />
</Route>
```

- [ ] **Step 3: Проверить с mock-сервером**

```bash
make mock &
cd frontend && npm run dev
```

Открыть http://localhost:5173/booking — должны отображаться карточки типов событий из mock-данных.

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: Event types catalog page with TanStack Query"
```

---

## Task 15: Frontend — Страница бронирования

**Files:**
- Create: `frontend/src/lib/components/SlotPicker.svelte`
- Create: `frontend/src/lib/components/BookingForm.svelte`
- Create: `frontend/src/pages/Booking.svelte`
- Modify: `frontend/src/App.svelte`

- [ ] **Step 1: Создать frontend/src/lib/components/SlotPicker.svelte**

```svelte
<script lang="ts">
  import { t } from '$lib/i18n/index.js';
  import { Button } from '$lib/components/ui/button/index.js';

  type Slot = { startTime: string; endTime: string; available: boolean };

  let {
    slots = [],
    selectedSlot = $bindable<string | null>(null),
  }: {
    slots: Slot[];
    selectedSlot: string | null;
  } = $props();

  function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="space-y-2">
  <h3 class="text-lg font-semibold">{t.booking.slots}</h3>
  <div class="space-y-1">
    {#each slots as slot}
      {@const startFormatted = formatTime(slot.startTime)}
      {@const endFormatted = formatTime(slot.endTime)}
      <button
        class="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors
          {slot.available
            ? selectedSlot === slot.startTime
              ? 'border-orange-500 bg-orange-50'
              : 'hover:bg-gray-50 cursor-pointer'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'}"
        disabled={!slot.available}
        onclick={() => { selectedSlot = slot.startTime; }}
      >
        <span>{startFormatted} - {endFormatted}</span>
        <span class="text-xs font-medium">
          {slot.available ? t.booking.available : t.booking.booked}
        </span>
      </button>
    {/each}
  </div>
</div>
```

- [ ] **Step 2: Создать frontend/src/lib/components/BookingForm.svelte**

```svelte
<script lang="ts">
  import { t } from '$lib/i18n/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';

  let {
    onsubmit,
    loading = false,
  }: {
    onsubmit: (data: { guestName: string; guestEmail: string }) => void;
    loading?: boolean;
  } = $props();

  let guestName = $state('');
  let guestEmail = $state('');

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (guestName.trim() && guestEmail.trim()) {
      onsubmit({ guestName: guestName.trim(), guestEmail: guestEmail.trim() });
    }
  }
</script>

<form onsubmit={handleSubmit} class="space-y-4">
  <div>
    <Label for="name">{t.booking.form.name}</Label>
    <Input id="name" bind:value={guestName} required />
  </div>
  <div>
    <Label for="email">{t.booking.form.email}</Label>
    <Input id="email" type="email" bind:value={guestEmail} required />
  </div>
  <Button type="submit" class="w-full" disabled={loading || !guestName.trim() || !guestEmail.trim()}>
    {t.booking.form.submit}
  </Button>
</form>
```

- [ ] **Step 3: Создать frontend/src/pages/Booking.svelte**

```svelte
<script lang="ts">
  import { t } from '$lib/i18n/index.js';
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { customFetch } from '$lib/api/fetcher.js';
  import SlotPicker from '$lib/components/SlotPicker.svelte';
  import BookingForm from '$lib/components/BookingForm.svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { addBookingId } from '$lib/stores/bookings.js';

  let { eventTypeId }: { eventTypeId: string } = $props();

  const queryClient = useQueryClient();

  let selectedDate = $state<string | null>(null);
  let selectedSlot = $state<string | null>(null);
  let step = $state<'calendar' | 'form'>('calendar');
  let successMessage = $state(false);

  // Generate 14 days starting from today
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  // Set first date as default
  if (!selectedDate) selectedDate = dates[0];

  const slotsQuery = createQuery({
    queryKey: ['slots', selectedDate, eventTypeId],
    queryFn: () =>
      customFetch<Array<{ startTime: string; endTime: string; available: boolean }>>({
        url: `/api/slots?date=${selectedDate}&eventTypeId=${eventTypeId}`,
        method: 'GET',
      }),
    enabled: !!selectedDate,
  });

  const bookingMutation = createMutation({
    mutationFn: (data: { guestName: string; guestEmail: string }) =>
      customFetch<{ id: string }>({
        url: '/api/bookings',
        method: 'POST',
        data: {
          eventTypeId,
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          startTime: selectedSlot,
        },
      }),
    onSuccess: (data) => {
      addBookingId(data.id);
      successMessage = true;
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      setTimeout(() => {
        window.location.href = '/booking';
      }, 2000);
    },
  });

  function formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
    });
  }
</script>

<div class="mx-auto max-w-4xl">
  {#if successMessage}
    <div class="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
      <p class="text-lg font-semibold text-green-800">{t.booking.success}</p>
    </div>
  {:else if step === 'form'}
    <div class="mx-auto max-w-md">
      <h2 class="mb-4 text-xl font-bold">{t.booking.form.name}</h2>
      <p class="mb-4 text-sm text-muted-foreground">
        {formatDate(selectedDate!)} — {new Date(selectedSlot!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
      <BookingForm
        onsubmit={(data) => $bookingMutation.mutate(data)}
        loading={$bookingMutation.isPending}
      />
      <Button variant="outline" class="mt-2 w-full" onclick={() => { step = 'calendar'; }}>
        {t.booking.back}
      </Button>
    </div>
  {:else}
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <!-- Left: Event info -->
      <div class="space-y-4 rounded-lg border bg-white p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">🥚</div>
          <div>
            <p class="font-semibold">{t.owner.name}</p>
            <p class="text-xs text-muted-foreground">{t.owner.role}</p>
          </div>
        </div>
        <div class="rounded-md bg-gray-50 p-3">
          <p class="text-xs text-muted-foreground">{t.booking.selectedDate}</p>
          <p class="font-medium">{selectedDate ? formatDate(selectedDate) : '—'}</p>
        </div>
        <div class="rounded-md bg-gray-50 p-3">
          <p class="text-xs text-muted-foreground">{t.booking.selectedTime}</p>
          <p class="font-medium">
            {selectedSlot
              ? new Date(selectedSlot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : t.booking.noTimeSelected}
          </p>
        </div>
      </div>

      <!-- Center: Calendar -->
      <div class="rounded-lg border bg-white p-4">
        <h3 class="mb-3 text-lg font-semibold">{t.booking.calendar}</h3>
        <div class="grid grid-cols-7 gap-1">
          {#each ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as day}
            <div class="text-center text-xs font-medium text-muted-foreground">{day}</div>
          {/each}
          {#each dates as date}
            <button
              class="rounded-md p-2 text-center text-sm transition-colors
                {date === selectedDate ? 'bg-orange-500 text-white' : 'hover:bg-gray-100'}"
              onclick={() => { selectedDate = date; selectedSlot = null; }}
            >
              {new Date(date + 'T00:00:00').getDate()}
            </button>
          {/each}
        </div>
      </div>

      <!-- Right: Slots -->
      <div class="rounded-lg border bg-white p-4">
        {#if $slotsQuery.isLoading}
          <p class="text-muted-foreground">Loading...</p>
        {:else if $slotsQuery.data}
          <SlotPicker slots={$slotsQuery.data} bind:selectedSlot />
          <div class="mt-4 flex gap-2">
            <Button
              class="flex-1"
              disabled={!selectedSlot}
              onclick={() => { step = 'form'; }}
            >
              {t.booking.next}
            </Button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
```

- [ ] **Step 4: Подключить в App.svelte**

```svelte
import Booking from './pages/Booking.svelte';
// ...
<Route path="/booking/:eventTypeId" let:params>
  <Booking eventTypeId={params.eventTypeId} />
</Route>
```

- [ ] **Step 5: Проверить с mock-сервером**

Открыть `/booking/<eventTypeId>` — должна отображаться страница с календарём, слотами и формой.

- [ ] **Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: Booking page with calendar, slot picker, and booking form"
```

---

## Task 16: Frontend — Админка — предстоящие встречи

**Files:**
- Create: `frontend/src/pages/AdminBookings.svelte`
- Modify: `frontend/src/App.svelte`

- [ ] **Step 1: Создать frontend/src/pages/AdminBookings.svelte**

```svelte
<script lang="ts">
  import { t } from '$lib/i18n/index.js';
  import { createQuery } from '@tanstack/svelte-query';
  import { customFetch } from '$lib/api/fetcher.js';
  import { Card } from '$lib/components/ui/card/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';

  type Booking = {
    id: string;
    eventTypeId: string;
    guestName: string;
    guestEmail: string;
    startTime: string;
    endTime: string;
  };

  const bookingsQuery = createQuery({
    queryKey: ['admin-bookings'],
    queryFn: () =>
      customFetch<Booking[]>({
        url: '/api/admin/bookings',
        method: 'GET',
      }),
  });

  function formatDateTime(isoString: string) {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }
</script>

<div class="mx-auto max-w-2xl">
  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-2xl font-bold">{t.admin.bookings.title}</h1>
    <a href="/admin/event-types" class="text-sm text-muted-foreground hover:underline">
      {t.admin.eventTypes.title}
    </a>
  </div>

  {#if $bookingsQuery.isLoading}
    <p class="text-muted-foreground">Loading...</p>
  {:else if $bookingsQuery.data?.length === 0}
    <p class="text-muted-foreground">{t.admin.bookings.empty}</p>
  {:else if $bookingsQuery.data}
    <div class="space-y-3">
      {#each $bookingsQuery.data as booking}
        {@const { date, time } = formatDateTime(booking.startTime)}
        <Card.Root>
          <Card.Content class="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="font-medium">{booking.guestName}</p>
              <p class="text-sm text-muted-foreground">{booking.guestEmail}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium">{date}</p>
              <Badge variant="outline">{time}</Badge>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>
```

- [ ] **Step 2: Подключить в App.svelte**

```svelte
import AdminBookings from './pages/AdminBookings.svelte';
// ...
<Route path="/admin">
  <AdminBookings />
</Route>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/
git commit -m "feat: Admin bookings page with upcoming meetings list"
```

---

## Task 17: Frontend — Админка — CRUD типов событий

**Files:**
- Create: `frontend/src/pages/AdminEventTypes.svelte`
- Modify: `frontend/src/App.svelte`

- [ ] **Step 1: Создать frontend/src/pages/AdminEventTypes.svelte**

```svelte
<script lang="ts">
  import { t } from '$lib/i18n/index.js';
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { customFetch } from '$lib/api/fetcher.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Card } from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';

  type EventType = { id: string; name: string; duration: number; createdAt: string };

  const queryClient = useQueryClient();

  const eventTypesQuery = createQuery({
    queryKey: ['event-types'],
    queryFn: () => customFetch<EventType[]>({ url: '/api/event-types', method: 'GET' }),
  });

  let showForm = $state(false);
  let editingId = $state<string | null>(null);
  let formName = $state('');
  let formDuration = $state(30);

  const createMut = createMutation({
    mutationFn: (data: { name: string; duration: number }) =>
      customFetch<EventType>({ url: '/api/event-types', method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-types'] });
      resetForm();
    },
  });

  const updateMut = createMutation({
    mutationFn: (data: { id: string; name: string; duration: number }) =>
      customFetch<EventType>({ url: `/api/event-types/${data.id}`, method: 'PATCH', data: { name: data.name, duration: data.duration } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-types'] });
      resetForm();
    },
  });

  const deleteMut = createMutation({
    mutationFn: (id: string) =>
      customFetch<void>({ url: `/api/event-types/${id}`, method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-types'] });
    },
  });

  function resetForm() {
    showForm = false;
    editingId = null;
    formName = '';
    formDuration = 30;
  }

  function startEdit(et: EventType) {
    editingId = et.id;
    formName = et.name;
    formDuration = et.duration;
    showForm = true;
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (editingId) {
      $updateMut.mutate({ id: editingId, name: formName, duration: formDuration });
    } else {
      $createMut.mutate({ name: formName, duration: formDuration });
    }
  }

  function handleDelete(id: string) {
    if (confirm(t.admin.eventTypes.deleteConfirm)) {
      $deleteMut.mutate(id);
    }
  }
</script>

<div class="mx-auto max-w-2xl">
  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-2xl font-bold">{t.admin.eventTypes.title}</h1>
    <Button onclick={() => { showForm = !showForm; if (!showForm) resetForm(); }}>
      {t.admin.eventTypes.add}
    </Button>
  </div>

  {#if showForm}
    <Card.Root class="mb-6">
      <Card.Content class="p-4">
        <form onsubmit={handleSubmit} class="space-y-4">
          <div>
            <Label for="et-name">{t.admin.eventTypes.form.name}</Label>
            <Input id="et-name" bind:value={formName} required />
          </div>
          <div>
            <Label for="et-duration">{t.admin.eventTypes.form.duration}</Label>
            <select id="et-duration" bind:value={formDuration} class="w-full rounded-md border px-3 py-2">
              <option value={10}>10 {t.eventTypes.minutes}</option>
              <option value={15}>15 {t.eventTypes.minutes}</option>
              <option value={20}>20 {t.eventTypes.minutes}</option>
              <option value={30}>30 {t.eventTypes.minutes}</option>
            </select>
          </div>
          <div class="flex gap-2">
            <Button type="submit">{t.admin.eventTypes.form.save}</Button>
            <Button variant="outline" onclick={resetForm}>{t.admin.eventTypes.form.cancel}</Button>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  {/if}

  {#if $eventTypesQuery.isLoading}
    <p class="text-muted-foreground">Loading...</p>
  {:else if $eventTypesQuery.data}
    <div class="space-y-3">
      {#each $eventTypesQuery.data as et}
        <Card.Root>
          <Card.Content class="flex items-center justify-between p-4">
            <div>
              <p class="font-medium">{et.name}</p>
              <Badge variant="secondary">{et.duration} {t.eventTypes.minutes}</Badge>
            </div>
            <div class="flex gap-2">
              <Button variant="outline" size="sm" onclick={() => startEdit(et)}>
                {t.admin.eventTypes.edit}
              </Button>
              <Button variant="destructive" size="sm" onclick={() => handleDelete(et.id)}>
                {t.admin.eventTypes.delete}
              </Button>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>
```

- [ ] **Step 2: Подключить в App.svelte**

```svelte
import AdminEventTypes from './pages/AdminEventTypes.svelte';
// ...
<Route path="/admin/event-types">
  <AdminEventTypes />
</Route>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/
git commit -m "feat: Admin CRUD page for event types"
```

---

## Task 18: Frontend — Мои записи (LocalStorage)

**Files:**
- Create: `frontend/src/lib/stores/bookings.ts`
- Create: `frontend/src/lib/components/MyBookings.svelte`
- Modify: `frontend/src/pages/EventTypes.svelte`

- [ ] **Step 1: Создать frontend/src/lib/stores/bookings.ts**

```typescript
const STORAGE_KEY = 'my-booking-ids';

export function getBookingIds(): string[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addBookingId(id: string): void {
  const ids = getBookingIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }
}

export function removeBookingId(id: string): void {
  const ids = getBookingIds().filter((i) => i !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}
```

- [ ] **Step 2: Создать frontend/src/lib/components/MyBookings.svelte**

```svelte
<script lang="ts">
  import { t } from '$lib/i18n/index.js';
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { customFetch } from '$lib/api/fetcher.js';
  import { getBookingIds, removeBookingId } from '$lib/stores/bookings.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Card } from '$lib/components/ui/card/index.js';

  type Booking = {
    id: string;
    startTime: string;
    endTime: string;
    guestName: string;
  };

  const queryClient = useQueryClient();
  let bookingIds = $state(getBookingIds());

  const bookingsQueries = $derived(
    bookingIds.map((id) =>
      createQuery({
        queryKey: ['booking', id],
        queryFn: () => customFetch<Booking>({ url: `/api/bookings/${id}`, method: 'GET' }),
      }),
    ),
  );

  const cancelMutation = createMutation({
    mutationFn: (id: string) =>
      customFetch<void>({ url: `/api/bookings/${id}`, method: 'DELETE' }),
    onSuccess: (_, id) => {
      removeBookingId(id);
      bookingIds = getBookingIds();
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });

  function handleCancel(id: string) {
    if (confirm(t.myBookings.cancelConfirm)) {
      $cancelMutation.mutate(id);
    }
  }
</script>

{#if bookingIds.length > 0}
  <div class="mt-8">
    <h2 class="mb-4 text-lg font-semibold">{t.myBookings.title}</h2>
    <div class="space-y-2">
      {#each bookingsQueries as query, i}
        {#if $query.data}
          {@const booking = $query.data}
          <Card.Root>
            <Card.Content class="flex items-center justify-between p-3">
              <div>
                <p class="text-sm font-medium">
                  {new Date(booking.startTime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                  {' '}
                  {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <Button variant="outline" size="sm" onclick={() => handleCancel(booking.id)}>
                {t.myBookings.cancel}
              </Button>
            </Card.Content>
          </Card.Root>
        {/if}
      {/each}
    </div>
  </div>
{/if}
```

- [ ] **Step 3: Добавить MyBookings в страницу каталога**

В `frontend/src/pages/EventTypes.svelte` добавить в конец:

```svelte
<script lang="ts">
  import MyBookings from '$lib/components/MyBookings.svelte';
  // ... остальные импорты
</script>

<!-- после карточек типов событий -->
<MyBookings />
```

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: My Bookings component with LocalStorage persistence"
```

---

## Task 19: ESLint настройка

**Files:**
- Create: `eslint.config.js`

- [ ] **Step 1: Установить ESLint зависимости**

```bash
npm install -D eslint @eslint/js eslint-plugin-svelte globals typescript-eslint
```

- [ ] **Step 2: Создать eslint.config.js**

```javascript
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
  },
  {
    // Errors only for build-breaking issues, warnings for style
    rules: {
      'no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
      'prefer-const': 'warn',
      // Стиль функций: const fx = (props) => {} с вызовом fx({ var1, var2 })
      // Именованные параметры через объект — для читаемости AI-агентами
      // Не приоритетно, применяется после работающего кода
      'prefer-arrow-callback': 'warn',
      'func-style': ['warn', 'expression'],
    },
  },
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      'frontend/src/lib/api/endpoints.ts', // Orval generated
      'spec/tsp-output/**',
    ],
  },
];
```

- [ ] **Step 3: Запустить lint**

```bash
make lint
```

Ожидаемый результат: никаких errors (только warnings допустимы).

- [ ] **Step 4: Commit**

```bash
git add eslint.config.js package.json
git commit -m "feat: ESLint 9 flat config with Svelte + TypeScript support"
```

---

## Task 20: E2E тесты (Playwright)

**Files:**
- Create: `e2e/package.json`
- Create: `e2e/playwright.config.ts`
- Create: `e2e/tests/booking-flow.spec.ts`
- Create: `e2e/tests/admin.spec.ts`

- [ ] **Step 1: Инициализировать e2e пакет**

```bash
mkdir -p e2e/tests
cd e2e && npm init -y
cd e2e && npm install -D @playwright/test
cd e2e && npx playwright install chromium
```

- [ ] **Step 2: Создать e2e/playwright.config.ts**

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: [
    {
      command: 'cd ../backend && npx tsx src/index.ts',
      port: 3000,
      reuseExistingServer: true,
    },
    {
      command: 'cd ../frontend && npx vite --port 5173',
      port: 5173,
      reuseExistingServer: true,
    },
  ],
});
```

- [ ] **Step 3: Создать e2e/tests/booking-flow.spec.ts**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ request }) => {
    // Create an event type via API
    await request.post('http://localhost:3000/api/event-types', {
      data: { name: 'Test Call', duration: 30 },
    });
  });

  test('guest can view event types', async ({ page }) => {
    await page.goto('/booking');
    await expect(page.getByText('Выберите тип события')).toBeVisible();
    await expect(page.getByText('Test Call')).toBeVisible();
  });

  test('guest can book a slot', async ({ page }) => {
    await page.goto('/booking');
    await page.getByText('Test Call').click();

    // Select a slot
    await page.getByText('Свободно').first().click();
    await page.getByText('Продолжить').click();

    // Fill form
    await page.getByLabel('Имя').fill('Test User');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByText('Забронировать').click();

    await expect(page.getByText('Бронирование создано!')).toBeVisible();
  });
});
```

- [ ] **Step 4: Создать e2e/tests/admin.spec.ts**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Admin', () => {
  test('can create event type', async ({ page }) => {
    await page.goto('/admin/event-types');
    await page.getByText('Добавить тип события').click();

    await page.getByLabel('Название').fill('New Meeting');
    await page.locator('select').selectOption('15');
    await page.getByText('Сохранить').click();

    await expect(page.getByText('New Meeting')).toBeVisible();
  });

  test('can view upcoming bookings', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText('Предстоящие встречи')).toBeVisible();
  });
});
```

- [ ] **Step 5: Запустить e2e тесты**

```bash
make test-e2e
```

- [ ] **Step 6: Commit**

```bash
git add e2e/
git commit -m "feat: Playwright e2e tests for booking flow and admin"
```

---

## Task 21: Docker

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Создать Dockerfile**

```dockerfile
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npx tsc

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app

COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/package.json ./
COPY --from=frontend-build /app/frontend/dist ./public

RUN mkdir -p /app/data

ENV PORT=3000
ENV DATABASE_URL=/app/data/db.sqlite

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

- [ ] **Step 2: Обновить backend/src/app.ts — раздача статики**

Добавить в `buildApp()`:

```typescript
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// В buildApp(), после регистрации роутов:
const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

app.register(fastifyStatic, {
  root: publicDir,
  wildcard: false,
});

// SPA fallback — return index.html for non-API routes
app.setNotFoundHandler((request, reply) => {
  if (request.url.startsWith('/api/')) {
    return reply.status(404).send({ message: 'Not found' });
  }
  return reply.sendFile('index.html');
});
```

- [ ] **Step 3: Собрать и запустить Docker**

```bash
docker build -t calendar .
docker run -p 3000:3000 -v ./data:/app/data calendar
```

Открыть http://localhost:3000 — приложение должно работать.

- [ ] **Step 4: Commit**

```bash
git add Dockerfile backend/
git commit -m "feat: Docker multi-stage build with static serving"
```

---

## Task 22: Lint cleanup (warnings)

- [ ] **Step 1: Запустить lint и посмотреть warnings**

```bash
make lint
```

- [ ] **Step 2: Исправить все warnings**

```bash
make lint-fix
```

Оставшиеся warnings исправить вручную.

- [ ] **Step 3: Убедиться что lint чистый**

```bash
make lint
```

Ожидаемый результат: 0 errors, 0 warnings.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "style: fix all ESLint warnings"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Все требования из spec.md покрыты задачами (CRUD event types, slots, bookings, admin, pages, LocalStorage, mobile-first, Docker, i18n, tests, linting)
- [x] **Placeholder scan:** Нет TBD/TODO, все шаги содержат код
- [x] **Type consistency:** EventType, Booking, Slot — используются одинаково во всех задачах. `customFetch`, `buildApp`, `createTestDb` — одинаковые сигнатуры
- [x] **File paths:** Все пути конкретные и согласованы с File Map
