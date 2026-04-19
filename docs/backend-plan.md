# Backend — план реализации (in-memory версия)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать серверную часть приложения по API-контракту. In-memory хранилище (Map), данные из JSONL при старте. Drizzle + SQLite — будущий этап.

**Architecture:** Fastify + TypeScript, Zod-валидация, тесты через `fastify.inject()`. CORS не используется — фронтенд подключается через Vite proxy.

**Specs:** `docs/spec.md`, `docs/architecture.md`, `spec/tsp-output/@typespec/openapi3/openapi.yaml`

---

## Порядок задач

| # | Задача | Зависит от |
|---|--------|-----------|
| 3 | Backend scaffolding (Fastify + Zod) | 2 (TypeSpec контракт) |
| 4 | In-memory store + JSONL seed | 3 |
| 5 | Zod-схемы валидации | 3 |
| 6 | Backend: Event Types CRUD | 4, 5 |
| 7 | Backend: Slots endpoint | 4, 5 |
| 8 | Backend: Bookings endpoints | 4, 5 |
| 9 | Backend: Admin bookings | 4 |
| 10 | Vite proxy + переключение фронта на бэкенд | 6–9 |

---

## File Map

```
backend/
  package.json
  tsconfig.json
  vitest.config.ts
  data/
    event-types.jsonl               # Seed: типы событий при старте
    bookings.jsonl                  # Seed: бронирования при старте
  src/
    index.ts                        # Fastify сервер, точка входа
    app.ts                          # Фабрика Fastify приложения (для тестов)
    store.ts                        # In-memory Map хранилище + загрузка JSONL
    validation.ts                   # Zod-схемы валидации
    routes/
      event-types.ts                # CRUD /api/event-types
      slots.ts                      # GET /api/slots
      bookings.ts                   # POST/GET/DELETE /api/bookings
      admin.ts                      # GET /api/admin/bookings
  tests/
    store.test.ts
    event-types.test.ts
    slots.test.ts
    bookings.test.ts
    admin.test.ts
```

---

## Task 3: Backend scaffolding

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/vitest.config.ts`
- Create: `backend/src/app.ts`
- Create: `backend/src/index.ts`

- [ ] **Step 1: Инициализировать backend пакет**

```bash
mkdir -p backend/src backend/data
cd backend && npm init -y
```

- [ ] **Step 2: Установить зависимости**

> Без `@fastify/cors` — фронтенд подключается через Vite proxy.

```bash
cd backend && npm install fastify zod
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

- [ ] **Step 4: Создать backend/vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
});
```

- [ ] **Step 5: Создать backend/src/app.ts — фабрика Fastify**

```typescript
import Fastify from 'fastify';
import { createStore } from './store.js';

interface AppOptions {
  seed?: boolean; // загружать JSONL при старте (default: true для dev, false для тестов)
}

export const buildApp = ({ seed = false }: AppOptions = {}) => {
  const app = Fastify({ logger: !seed ? false : true });
  const store = createStore({ seed });

  app.decorate('store', store);

  app.get('/api/health', async () => ({ status: 'ok' }));

  // routes будут регистрироваться по мере реализации

  return app;
};
```

- [ ] **Step 6: Создать backend/src/index.ts — точка входа**

```typescript
import { buildApp } from './app.js';

const app = buildApp({ seed: true });

const port = Number(process.env.PORT) || 3000;

app.listen({ port, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});
```

- [ ] **Step 7: Добавить скрипты в package.json**

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

- [ ] **Step 8: Запустить и проверить**

```bash
cd backend && npx tsx src/index.ts &
curl http://localhost:3000/api/health
# Ожидаемый ответ: {"status":"ok"}
kill %1
```

- [ ] **Step 9: Commit**

```bash
git add backend/
git commit -m "feat: backend scaffolding with Fastify"
```

---

## Task 4: In-memory store + JSONL seed

**Files:**
- Create: `backend/src/store.ts`
- Create: `backend/data/event-types.jsonl`
- Create: `backend/data/bookings.jsonl`
- Create: `backend/tests/store.test.ts`

> **Принцип:** Map<string, T> как хранилище. JSONL-файлы загружаются при старте сервера.
> В тестах store создаётся пустым (seed: false).

- [ ] **Step 1: Создать JSONL seed-файлы**

`backend/data/event-types.jsonl` — по одному JSON-объекту на строку:

```jsonl
{"id":"et-1","name":"Quick Call","duration":10,"createdAt":"2026-04-01T10:00:00.000Z"}
{"id":"et-2","name":"Consultation","duration":30,"createdAt":"2026-04-01T10:00:00.000Z"}
{"id":"et-3","name":"Interview","duration":20,"createdAt":"2026-04-01T10:00:00.000Z"}
```

`backend/data/bookings.jsonl`:

```jsonl
{"id":"bk-1","eventTypeId":"et-2","eventTypeName":"Consultation","duration":30,"guestName":"Alice","guestEmail":"alice@example.com","startTime":"2026-04-21T09:00:00.000Z","endTime":"2026-04-21T09:30:00.000Z","createdAt":"2026-04-15T12:00:00.000Z"}
{"id":"bk-2","eventTypeId":"et-1","eventTypeName":"Quick Call","duration":10,"guestName":"Bob","guestEmail":"bob@example.com","startTime":"2026-04-21T14:00:00.000Z","endTime":"2026-04-21T14:30:00.000Z","createdAt":"2026-04-15T13:00:00.000Z"}
```

- [ ] **Step 2: Создать backend/src/store.ts**

```typescript
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

export interface EventType {
  id: string;
  name: string;
  duration: 10 | 15 | 20 | 30;
  createdAt: string;
}

export interface Booking {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  duration: 10 | 15 | 20 | 30;
  guestName: string;
  guestEmail: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface Store {
  eventTypes: Map<string, EventType>;
  bookings: Map<string, Booking>;
}

const loadJsonl = <T extends { id: string }>(filePath: string): Map<string, T> => {
  const map = new Map<string, T>();
  try {
    const lines = readFileSync(filePath, 'utf-8').trim().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        const item = JSON.parse(line) as T;
        map.set(item.id, item);
      }
    }
  } catch {
    // файл не найден — пустой store
  }
  return map;
};

export const createStore = ({ seed = false }: { seed?: boolean } = {}): Store => {
  if (!seed) {
    return {
      eventTypes: new Map(),
      bookings: new Map(),
    };
  }

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const dataDir = resolve(__dirname, '..', 'data');

  return {
    eventTypes: loadJsonl<EventType>(resolve(dataDir, 'event-types.jsonl')),
    bookings: loadJsonl<Booking>(resolve(dataDir, 'bookings.jsonl')),
  };
};
```

- [ ] **Step 3: Написать тесты backend/tests/store.test.ts**

```typescript
import { describe, it, expect } from 'vitest';
import { createStore } from '../src/store.js';

describe('Store', () => {
  it('creates empty store when seed=false', () => {
    const store = createStore({ seed: false });
    expect(store.eventTypes.size).toBe(0);
    expect(store.bookings.size).toBe(0);
  });

  it('loads JSONL seed data when seed=true', () => {
    const store = createStore({ seed: true });
    expect(store.eventTypes.size).toBeGreaterThan(0);
    expect(store.bookings.size).toBeGreaterThan(0);
  });

  it('Map operations work correctly', () => {
    const store = createStore();
    store.eventTypes.set('test-1', {
      id: 'test-1',
      name: 'Test',
      duration: 30,
      createdAt: new Date().toISOString(),
    });
    expect(store.eventTypes.get('test-1')?.name).toBe('Test');
    store.eventTypes.delete('test-1');
    expect(store.eventTypes.has('test-1')).toBe(false);
  });
});
```

- [ ] **Step 4: Запустить тесты**

```bash
cd backend && npx vitest run tests/store.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: in-memory store with JSONL seed data"
```

---

## Task 5: Zod-схемы валидации

**Files:**
- Create: `backend/src/validation.ts`

- [ ] **Step 1: Создать backend/src/validation.ts**

```typescript
import { z } from 'zod';

export const DurationSchema = z.enum(['10', '15', '20', '30']).transform(Number)
  .or(z.literal(10).or(z.literal(15)).or(z.literal(20)).or(z.literal(30)))
  .describe('Meeting duration in minutes');

export const CreateEventTypeSchema = z.object({
  name: z.string().min(1, 'Name must not be empty').describe('Display name of the event type'),
  duration: DurationSchema.describe('Meeting duration: 10, 15, 20, or 30 minutes'),
});

export const UpdateEventTypeSchema = z.object({
  name: z.string().min(1, 'Name must not be empty').optional().describe('New display name'),
  duration: DurationSchema.optional().describe('New duration in minutes'),
});

export const CreateBookingSchema = z.object({
  eventTypeId: z.string().uuid('Invalid event type ID').describe('ID of the event type to book'),
  guestName: z.string().min(1, 'Name must not be empty').describe('Guest name'),
  guestEmail: z.string().email('Invalid email address').describe('Guest email'),
  startTime: z.string().datetime('Invalid datetime format').describe('Slot start time in UTC ISO 8601'),
});

export const SlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format').describe('Date for slot lookup'),
  eventTypeId: z.string().min(1, 'eventTypeId is required').describe('Event type ID'),
});
```

- [ ] **Step 2: Commit**

```bash
git add backend/
git commit -m "feat: Zod validation schemas for all endpoints"
```

---

## Task 6: Backend — Event Types CRUD

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
    app = buildApp(); // пустой store, без seed
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

- [ ] **Step 2: Создать backend/src/routes/event-types.ts**

> Работает с `app.store` (Map), не с БД.

```typescript
import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { CreateEventTypeSchema, UpdateEventTypeSchema } from '../validation.js';
import type { EventType } from '../store.js';

export const eventTypesRoutes = async (app: FastifyInstance) => {
  const { store } = app as any;

  app.get('/api/event-types', async () => {
    return Array.from(store.eventTypes.values());
  });

  app.post('/api/event-types', async (request, reply) => {
    const parsed = CreateEventTypeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.issues[0].message });
    }

    const eventType: EventType = {
      id: randomUUID(),
      name: parsed.data.name,
      duration: parsed.data.duration as EventType['duration'],
      createdAt: new Date().toISOString(),
    };

    store.eventTypes.set(eventType.id, eventType);
    return reply.status(201).send(eventType);
  });

  app.patch('/api/event-types/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = store.eventTypes.get(id);
    if (!existing) {
      return reply.status(404).send({ message: 'Not found' });
    }

    const parsed = UpdateEventTypeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.issues[0].message });
    }

    const updated = { ...existing, ...parsed.data };
    store.eventTypes.set(id, updated);
    return reply.send(updated);
  });

  app.delete('/api/event-types/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!store.eventTypes.has(id)) {
      return reply.status(404).send({ message: 'Not found' });
    }
    store.eventTypes.delete(id);
    return reply.status(204).send();
  });
};
```

- [ ] **Step 3: Зарегистрировать в app.ts**

```typescript
import { eventTypesRoutes } from './routes/event-types.js';
// ...в buildApp:
app.register(eventTypesRoutes);
```

- [ ] **Step 4: Запустить тесты**

```bash
cd backend && npx vitest run tests/event-types.test.ts
```

Ожидаемый результат: все 6 тестов пройдены.

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: Event Types CRUD API with Zod validation"
```

---

## Task 7: Backend — Slots endpoint

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
    app = buildApp(); // пустой store
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

  it('slot booked by different event type is also unavailable (global)', async () => {
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { name: 'Short Call', duration: 15 },
    });
    const otherTypeId = res2.json().id;

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

- [ ] **Step 2: Создать backend/src/routes/slots.ts**

> Генерация 16 слотов (09:00–16:30), пометка занятых из Map bookings.

```typescript
import { FastifyInstance } from 'fastify';
import { SlotsQuerySchema } from '../validation.js';
import type { Store } from '../store.js';

const SLOT_DURATION = 30;
const WORK_START_HOUR = 9;
const WORK_END_HOUR = 17;

export const slotsRoutes = async (app: FastifyInstance) => {
  const { store } = app as any as { store: Store };

  app.get('/api/slots', async (request, reply) => {
    const parsed = SlotsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.issues[0].message });
    }

    const { date, eventTypeId } = parsed.data;

    // Проверяем что eventType существует
    if (!store.eventTypes.has(eventTypeId)) {
      return reply.status(400).send({ message: 'Event type not found' });
    }

    // Генерируем все слоты дня
    const slots = [];
    for (let hour = WORK_START_HOUR; hour < WORK_END_HOUR; hour++) {
      for (let min = 0; min < 60; min += SLOT_DURATION) {
        const startTime = new Date(
          `${date}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00.000Z`,
        );
        const endTime = new Date(startTime.getTime() + SLOT_DURATION * 60 * 1000);
        slots.push({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        });
      }
    }

    // Глобальная занятость — собираем все startTime бронирований на эту дату
    const bookedTimes = new Set<string>();
    for (const booking of store.bookings.values()) {
      if (booking.startTime.startsWith(date)) {
        bookedTimes.add(booking.startTime);
      }
    }

    return slots.map((slot) => ({
      ...slot,
      available: !bookedTimes.has(slot.startTime),
    }));
  });
};
```

- [ ] **Step 3: Зарегистрировать в app.ts**

```typescript
import { slotsRoutes } from './routes/slots.js';
// ...в buildApp:
app.register(slotsRoutes);
```

- [ ] **Step 4: Запустить тесты**

```bash
cd backend && npx vitest run tests/slots.test.ts
```

Ожидаемый результат: все 4 теста пройдены.

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: Slots API with global occupancy check"
```

---

## Task 8: Backend — Bookings endpoints

**Files:**
- Create: `backend/src/routes/bookings.ts`
- Modify: `backend/src/app.ts`
- Create: `backend/tests/bookings.test.ts`

> Ключевая бизнес-логика: денормализация (копируем eventTypeName, duration),
> проверка конфликта слотов (409), валидация startTime (30-min boundary, рабочие часы, 14 дней).

- [ ] **Step 1: Написать тесты backend/tests/bookings.test.ts**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';

describe('Bookings API', () => {
  let app: ReturnType<typeof buildApp>;
  let eventTypeId: string;

  beforeEach(async () => {
    app = buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { name: 'Call', duration: 30 },
    });
    eventTypeId = res.json().id;
  });

  it('POST /api/bookings creates booking with denormalized fields', async () => {
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

  it('POST /api/bookings rejects duplicate startTime (409)', async () => {
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

  it('POST /api/bookings returns 404 if eventType not found', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        eventTypeId: '00000000-0000-0000-0000-000000000000',
        guestName: 'Alice',
        guestEmail: 'alice@test.com',
        startTime: '2026-04-20T09:00:00.000Z',
      },
    });
    expect(res.statusCode).toBe(404);
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

  it('DELETE /api/bookings/:id removes booking physically', async () => {
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

- [ ] **Step 2: Создать backend/src/routes/bookings.ts**

> Конфликт слотов: проверяем Map bookings по startTime. Денормализация: копируем name и duration из eventType.

```typescript
import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { CreateBookingSchema } from '../validation.js';
import type { Store, Booking } from '../store.js';

const SLOT_DURATION = 30;
const WORK_START_HOUR = 9;
const WORK_END_HOUR = 17;

export const bookingsRoutes = async (app: FastifyInstance) => {
  const { store } = app as any as { store: Store };

  app.post('/api/bookings', async (request, reply) => {
    const parsed = CreateBookingSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.issues[0].message });
    }

    const { eventTypeId, guestName, guestEmail, startTime } = parsed.data;

    // Проверяем что eventType существует
    const eventType = store.eventTypes.get(eventTypeId);
    if (!eventType) {
      return reply.status(404).send({ message: 'Event type not found' });
    }

    // Валидация startTime: 30-min boundary, рабочие часы
    const start = new Date(startTime);
    const minutes = start.getUTCMinutes();
    const hours = start.getUTCHours();

    if (minutes % SLOT_DURATION !== 0) {
      return reply.status(400).send({ message: 'startTime must be on 30-minute boundary' });
    }

    if (hours < WORK_START_HOUR || (hours === WORK_END_HOUR - 1 && minutes > SLOT_DURATION) || hours >= WORK_END_HOUR) {
      return reply.status(400).send({ message: 'startTime must be within work hours (09:00–16:30)' });
    }

    // Проверка конфликта: есть ли бронирование с таким же startTime
    const startIso = start.toISOString();
    for (const booking of store.bookings.values()) {
      if (booking.startTime === startIso) {
        return reply.status(409).send({ message: 'Slot already taken' });
      }
    }

    const endTime = new Date(start.getTime() + SLOT_DURATION * 60 * 1000).toISOString();

    // Денормализация: копируем eventTypeName и duration
    const booking: Booking = {
      id: randomUUID(),
      eventTypeId,
      eventTypeName: eventType.name,
      duration: eventType.duration,
      guestName,
      guestEmail,
      startTime: startIso,
      endTime,
      createdAt: new Date().toISOString(),
    };

    store.bookings.set(booking.id, booking);
    return reply.status(201).send(booking);
  });

  app.get('/api/bookings/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const booking = store.bookings.get(id);
    if (!booking) {
      return reply.status(404).send({ message: 'Not found' });
    }
    return booking;
  });

  app.delete('/api/bookings/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!store.bookings.has(id)) {
      return reply.status(404).send({ message: 'Not found' });
    }
    store.bookings.delete(id);
    return reply.status(204).send();
  });
};
```

- [ ] **Step 3: Зарегистрировать в app.ts**

```typescript
import { bookingsRoutes } from './routes/bookings.js';
// ...в buildApp:
app.register(bookingsRoutes);
```

- [ ] **Step 4: Запустить тесты**

```bash
cd backend && npx vitest run tests/bookings.test.ts
```

Ожидаемый результат: все 8 тестов пройдены.

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: Bookings API with slot conflict detection (409) and denormalization"
```

---

## Task 9: Backend — Admin bookings

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
    app = buildApp();
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

  it('GET /api/admin/bookings returns bookings sorted by startTime', async () => {
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

- [ ] **Step 2: Создать backend/src/routes/admin.ts**

```typescript
import { FastifyInstance } from 'fastify';
import type { Store } from '../store.js';

export const adminRoutes = async (app: FastifyInstance) => {
  const { store } = app as any as { store: Store };

  app.get('/api/admin/bookings', async () => {
    return Array.from(store.bookings.values())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  });
};
```

- [ ] **Step 3: Зарегистрировать в app.ts**

```typescript
import { adminRoutes } from './routes/admin.js';
// ...в buildApp:
app.register(adminRoutes);
```

- [ ] **Step 4: Запустить все бэкенд тесты**

```bash
cd backend && npx vitest run
```

Ожидаемый результат: все тесты пройдены (store + event-types + slots + bookings + admin).

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: Admin bookings API sorted by startTime"
```

---

## Task 10: Vite proxy + переключение фронта на бэкенд

**Files:**
- Modify: `frontend/vite.config.ts`

> Фронтенд до этого работал с Prism mock-сервером. Теперь переключаем на реальный бэкенд
> через Vite proxy — без CORS.

- [ ] **Step 1: Добавить proxy в frontend/vite.config.ts**

```typescript
// В defineConfig → server:
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
},
```

- [ ] **Step 2: Проверить интеграцию**

Запустить бэкенд и фронтенд одновременно:

```bash
# Терминал 1:
make dev-backend

# Терминал 2:
make dev-frontend
```

Открыть фронтенд, проверить что:
- Каталог типов событий загружает данные из JSONL seed
- Слоты отображаются с учётом занятых из seed-бронирований
- Можно создать новое бронирование
- Админка показывает предстоящие встречи

- [ ] **Step 3: Commit**

```bash
git add frontend/
git commit -m "feat: Vite proxy to backend, switch from Prism mock"
```
