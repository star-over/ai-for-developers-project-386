# Test Restructuring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize all project tests by business domains, extract shared helpers, and close edge-case coverage gaps — one file at a time, tests green after every step.

**Architecture:** Backend tests regroup from 6 resource-oriented files into 4 domain files + 1 helper module. Frontend tests split from 1 `pure.test.ts` into `utils.test.ts` + `validation.test.ts`. Each task is a single commit; old files are deleted only after new ones pass.

**Tech Stack:** Vitest, Fastify `app.inject()`, Zod `safeParse()`, shared constants from `shared/constants.js`

---

## Task 1: Create backend test helpers

**Files:**
- Create: `backend/tests/helpers.ts`

- [ ] **Step 1: Create `backend/tests/helpers.ts`**

```typescript
import { buildApp } from '../src/app.js';

export const createTestApp = async () => {
  const app = buildApp();
  await app.ready();
  return app;
};

export const createEventType = async ({
  app,
  name = 'Call',
  duration = 30,
}: {
  app: ReturnType<typeof buildApp>;
  name?: string;
  duration?: number;
}) => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/event-types',
    payload: { name, duration },
  });
  return res.json();
};

export const createBooking = async ({
  app,
  eventTypeId,
  guestName = 'Alice',
  guestEmail = 'alice@test.com',
  startTime,
}: {
  app: ReturnType<typeof buildApp>;
  eventTypeId: string;
  guestName?: string;
  guestEmail?: string;
  startTime: string;
}) => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/bookings',
    payload: { eventTypeId, guestName, guestEmail, startTime },
  });
  return { res, body: res.json() };
};
```

- [ ] **Step 2: Verify helpers compile**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors related to `tests/helpers.ts`

- [ ] **Step 3: Run existing tests to confirm no regression**

Run: `make test-backend`
Expected: all tests pass (no change to existing test files yet)

- [ ] **Step 4: Commit**

```bash
git add backend/tests/helpers.ts
git commit -m "test(backend): add shared test helpers (createTestApp, createEventType, createBooking)"
```

---

## Task 2: Create `data-integrity.test.ts` and remove old files

Merges `store.test.ts` + `seed-data.test.ts` into one domain file. No new test cases — pure migration.

**Files:**
- Create: `backend/tests/data-integrity.test.ts`
- Delete: `backend/tests/store.test.ts`
- Delete: `backend/tests/seed-data.test.ts`

- [ ] **Step 1: Create `backend/tests/data-integrity.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { createStore } from '../src/store.js';
import { EventTypeRecordSchema, BookingRecordSchema } from '../src/validation.js';

type EventTypeRecord = z.infer<typeof EventTypeRecordSchema>;
type BookingRecord = z.infer<typeof BookingRecordSchema>;

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '..', 'data');

const loadJsonl = <T>({ filePath }: { filePath: string }): T[] => {
  const lines = readFileSync(filePath, 'utf-8').trim().split('\n');
  return lines.filter((l) => l.trim()).map((l) => JSON.parse(l) as T);
};

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
    store.eventTypes.set('f47ac10b-58cc-4372-a567-0e02b2c3d479', {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'Test',
      duration: 30,
      createdAt: new Date().toISOString(),
    });
    expect(store.eventTypes.get('f47ac10b-58cc-4372-a567-0e02b2c3d479')?.name).toBe('Test');
    store.eventTypes.delete('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    expect(store.eventTypes.has('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(false);
  });
});

describe('Seed data integrity', () => {
  const rawEventTypes = loadJsonl<EventTypeRecord>({
    filePath: resolve(dataDir, 'event-types.jsonl'),
  });
  const rawBookings = loadJsonl<BookingRecord>({
    filePath: resolve(dataDir, 'bookings.jsonl'),
  });

  describe('event-types.jsonl', () => {
    it('has at least one event type', () => {
      expect(rawEventTypes.length).toBeGreaterThan(0);
    });

    it('every record passes EventTypeRecordSchema', () => {
      for (const raw of rawEventTypes) {
        const result = EventTypeRecordSchema.safeParse(raw);
        expect(result.success, `invalid event type: ${JSON.stringify(result.error?.issues)}`).toBe(true);
      }
    });

    it('all IDs are unique', () => {
      const ids = rawEventTypes.map((et) => et.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('bookings.jsonl', () => {
    it('has at least one booking', () => {
      expect(rawBookings.length).toBeGreaterThan(0);
    });

    it('every record passes BookingRecordSchema', () => {
      for (const raw of rawBookings) {
        const result = BookingRecordSchema.safeParse(raw);
        expect(result.success, `invalid booking: ${JSON.stringify(result.error?.issues)}`).toBe(true);
      }
    });

    it('all IDs are unique', () => {
      const ids = rawBookings.map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('all eventTypeIds reference existing event types', () => {
      const eventTypeIds = new Set(rawEventTypes.map((et) => et.id));
      for (const b of rawBookings) {
        expect(
          eventTypeIds.has(b.eventTypeId),
          `booking "${b.guestName}" references non-existent eventTypeId "${b.eventTypeId}"`,
        ).toBe(true);
      }
    });

    it('denormalized fields match referenced event type', () => {
      const byId = new Map(rawEventTypes.map((et) => [et.id, et]));
      for (const b of rawBookings) {
        const et = byId.get(b.eventTypeId);
        expect(b.eventTypeName, `booking "${b.guestName}" eventTypeName mismatch`).toBe(et?.name);
        expect(b.duration, `booking "${b.guestName}" duration mismatch`).toBe(et?.duration);
      }
    });
  });
});
```

- [ ] **Step 2: Run new file to verify it passes**

Run: `cd backend && npx vitest run tests/data-integrity.test.ts --reporter=dot`
Expected: 9 tests pass

- [ ] **Step 3: Delete old files**

```bash
rm backend/tests/store.test.ts backend/tests/seed-data.test.ts
```

- [ ] **Step 4: Run full backend tests to confirm no regression**

Run: `make test-backend`
Expected: all tests pass (same count minus 0 — tests moved, not removed)

- [ ] **Step 5: Commit**

```bash
git add backend/tests/data-integrity.test.ts
git add backend/tests/store.test.ts backend/tests/seed-data.test.ts
git commit -m "test(backend): merge store + seed-data tests into data-integrity.test.ts"
```

---

## Task 3: Create `scheduling.test.ts` and remove old files

Merges `bookings.test.ts` + `slots.test.ts` into one domain file, rewritten on helpers. No new test cases yet — pure migration.

**Files:**
- Create: `backend/tests/scheduling.test.ts`
- Delete: `backend/tests/bookings.test.ts`
- Delete: `backend/tests/slots.test.ts`

- [ ] **Step 1: Create `backend/tests/scheduling.test.ts` with migrated tests**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../src/app.js';
import { createTestApp, createEventType, createBooking } from './helpers.js';

describe('Scheduling', () => {
  let app: ReturnType<typeof buildApp>;
  let eventTypeId: string;

  beforeEach(async () => {
    app = await createTestApp();
    ({ id: eventTypeId } = await createEventType({ app }));
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Booking CRUD', () => {
    it('POST /api/bookings creates booking with denormalized fields', async () => {
      const { res } = await createBooking({ app, eventTypeId, startTime: '2026-04-20T09:00:00.000Z' });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.guestName).toBe('Alice');
      expect(body.eventTypeName).toBe('Call');
      expect(body.duration).toBe(30);
      expect(body.endTime).toBe('2026-04-20T09:30:00.000Z');
    });

    it('POST /api/bookings sets endTime based on eventType.duration', async () => {
      const shortType = await createEventType({ app, name: 'Quick Call', duration: 15 });
      const { res } = await createBooking({ app, eventTypeId: shortType.id, startTime: '2026-04-20T09:00:00.000Z' });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.duration).toBe(15);
      expect(body.endTime).toBe('2026-04-20T09:15:00.000Z');
    });

    it('GET /api/bookings/:id returns booking', async () => {
      const { body: created } = await createBooking({ app, eventTypeId, startTime: '2026-04-20T09:00:00.000Z' });
      const res = await app.inject({ method: 'GET', url: `/api/bookings/${created.id}` });
      expect(res.statusCode).toBe(200);
      expect(res.json().guestName).toBe('Alice');
    });

    it('DELETE /api/bookings/:id removes booking physically', async () => {
      const { body: created } = await createBooking({ app, eventTypeId, startTime: '2026-04-20T09:00:00.000Z' });
      const del = await app.inject({ method: 'DELETE', url: `/api/bookings/${created.id}` });
      expect(del.statusCode).toBe(204);
      const get = await app.inject({ method: 'GET', url: `/api/bookings/${created.id}` });
      expect(get.statusCode).toBe(404);
    });
  });

  describe('Booking Validation', () => {
    it('rejects duplicate startTime (409)', async () => {
      await createBooking({ app, eventTypeId, startTime: '2026-04-20T09:00:00.000Z' });
      const { res } = await createBooking({ app, eventTypeId, guestName: 'Bob', guestEmail: 'bob@test.com', startTime: '2026-04-20T09:00:00.000Z' });
      expect(res.statusCode).toBe(409);
    });

    it('returns 404 if eventType not found', async () => {
      const { res } = await createBooking({ app, eventTypeId: '00000000-0000-0000-0000-000000000000', startTime: '2026-04-20T09:00:00.000Z' });
      expect(res.statusCode).toBe(404);
    });

    it('validates startTime is on 30-min boundary', async () => {
      const { res } = await createBooking({ app, eventTypeId, startTime: '2026-04-20T09:15:00.000Z' });
      expect(res.statusCode).toBe(400);
    });

    it('validates startTime within work hours', async () => {
      const { res } = await createBooking({ app, eventTypeId, startTime: '2026-04-20T18:00:00.000Z' });
      expect(res.statusCode).toBe(400);
    });

    it('validates required fields', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/bookings',
        payload: { eventTypeId, guestName: '', guestEmail: '' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid UUID in eventTypeId', async () => {
      const { res } = await createBooking({ app, eventTypeId: 'not-a-uuid', startTime: '2026-04-20T09:00:00.000Z' });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid email', async () => {
      const { res } = await createBooking({ app, eventTypeId, guestEmail: 'not-an-email', startTime: '2026-04-20T09:00:00.000Z' });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid startTime format', async () => {
      const { res } = await createBooking({ app, eventTypeId, startTime: 'not-a-date' });
      expect(res.statusCode).toBe(400);
    });

    it('GET /api/bookings/:id returns 400 for invalid UUID', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/bookings/not-a-uuid' });
      expect(res.statusCode).toBe(400);
    });

    it('DELETE /api/bookings/:id returns 404 for non-existent id', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/api/bookings/00000000-0000-0000-0000-000000000000' });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('Slot Generation', () => {
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
      expect(slots.every((s: { available: boolean }) => s.available === true)).toBe(true);
    });

    it('returns 400 if date or eventTypeId missing', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/slots' });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 for non-existent eventTypeId', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/slots?date=2026-04-20&eventTypeId=00000000-0000-0000-0000-000000000000',
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 for invalid date format', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/slots?date=20-04-2026&eventTypeId=${eventTypeId}`,
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 for invalid UUID in eventTypeId', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/slots?date=2026-04-20&eventTypeId=not-a-uuid',
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Slot Availability', () => {
    it('booked slot shows as unavailable', async () => {
      await createBooking({ app, eventTypeId, startTime: '2026-04-20T09:00:00.000Z' });
      const res = await app.inject({
        method: 'GET',
        url: `/api/slots?date=2026-04-20&eventTypeId=${eventTypeId}`,
      });
      const slots = res.json();
      const slot0900 = slots.find((s: { startTime: string }) => s.startTime.includes('09:00'));
      expect(slot0900.available).toBe(false);
    });

    it('slot booked by different event type is also unavailable (global)', async () => {
      const otherType = await createEventType({ app, name: 'Short Call', duration: 15 });
      await createBooking({ app, eventTypeId: otherType.id, guestName: 'Bob', guestEmail: 'bob@test.com', startTime: '2026-04-20T10:00:00.000Z' });
      const res = await app.inject({
        method: 'GET',
        url: `/api/slots?date=2026-04-20&eventTypeId=${eventTypeId}`,
      });
      const slots = res.json();
      const slot1000 = slots.find((s: { startTime: string }) => s.startTime.includes('10:00'));
      expect(slot1000.available).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run new file to verify it passes**

Run: `cd backend && npx vitest run tests/scheduling.test.ts --reporter=dot`
Expected: 17 tests pass

- [ ] **Step 3: Delete old files**

```bash
rm backend/tests/bookings.test.ts backend/tests/slots.test.ts
```

- [ ] **Step 4: Run full backend tests to confirm no regression**

Run: `make test-backend`
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add backend/tests/scheduling.test.ts
git add backend/tests/bookings.test.ts backend/tests/slots.test.ts
git commit -m "test(backend): merge bookings + slots tests into scheduling.test.ts, use helpers"
```

---

## Task 4: Rewrite `event-types.test.ts` on helpers

Same file, same tests — just rewritten to use `createTestApp` + `createEventType` + `afterEach`.

**Files:**
- Modify: `backend/tests/event-types.test.ts`

- [ ] **Step 1: Rewrite `backend/tests/event-types.test.ts`**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../src/app.js';
import { createTestApp, createEventType } from './helpers.js';

describe('Health Endpoint', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/health returns 200 with status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });
});

describe('Event Types API', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('CRUD', () => {
    it('GET /api/event-types returns empty list', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/event-types' });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual([]);
    });

    it('POST /api/event-types creates event type', async () => {
      const body = await createEventType({ app, name: 'Quick Call', duration: 15 });
      expect(body.name).toBe('Quick Call');
      expect(body.duration).toBe(15);
      expect(body.id).toBeDefined();
      expect(body.createdAt).toBeDefined();
    });

    it('PATCH /api/event-types/:id updates event type', async () => {
      const created = await createEventType({ app });
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/event-types/${created.id}`,
        payload: { name: 'Updated Call' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().name).toBe('Updated Call');
    });

    it('DELETE /api/event-types/:id removes event type', async () => {
      const created = await createEventType({ app });
      const del = await app.inject({ method: 'DELETE', url: `/api/event-types/${created.id}` });
      expect(del.statusCode).toBe(204);
      const list = await app.inject({ method: 'GET', url: '/api/event-types' });
      expect(list.json()).toEqual([]);
    });
  });

  describe('Validation', () => {
    it('POST /api/event-types validates duration enum', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/event-types',
        payload: { name: 'Bad', duration: 25 },
      });
      expect(res.statusCode).toBe(400);
    });

    it('DELETE /api/event-types/:id returns 404 for unknown id', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/api/event-types/00000000-0000-0000-0000-000000000000' });
      expect(res.statusCode).toBe(404);
    });

    it('POST /api/event-types rejects empty name', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/event-types',
        payload: { name: '', duration: 30 },
      });
      expect(res.statusCode).toBe(400);
    });

    it('PATCH /api/event-types/:id returns 404 for non-existent id', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/event-types/00000000-0000-0000-0000-000000000000',
        payload: { name: 'Updated' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('PATCH /api/event-types/:id returns 400 for invalid UUID', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/event-types/not-a-uuid',
        payload: { name: 'Updated' },
      });
      expect(res.statusCode).toBe(400);
    });
  });
});
```

- [ ] **Step 2: Run to verify all tests pass**

Run: `cd backend && npx vitest run tests/event-types.test.ts --reporter=dot`
Expected: 9 tests pass (same count as before)

- [ ] **Step 3: Run full backend tests**

Run: `make test-backend`
Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add backend/tests/event-types.test.ts
git commit -m "test(backend): rewrite event-types tests on shared helpers, add afterEach cleanup"
```

---

## Task 5: Rewrite `admin.test.ts` on helpers

Same file, same tests — rewritten with helpers.

**Files:**
- Modify: `backend/tests/admin.test.ts`

- [ ] **Step 1: Rewrite `backend/tests/admin.test.ts`**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../src/app.js';
import { createTestApp, createEventType, createBooking } from './helpers.js';

describe('Admin Bookings API', () => {
  let app: ReturnType<typeof buildApp>;
  let eventTypeId: string;

  beforeEach(async () => {
    app = await createTestApp();
    ({ id: eventTypeId } = await createEventType({ app }));
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/admin/bookings returns empty list', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/admin/bookings' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('GET /api/admin/bookings returns bookings sorted by startTime', async () => {
    await createBooking({ app, eventTypeId, guestName: 'Bob', guestEmail: 'bob@test.com', startTime: '2026-04-21T10:00:00.000Z' });
    await createBooking({ app, eventTypeId, startTime: '2026-04-20T09:00:00.000Z' });

    const res = await app.inject({ method: 'GET', url: '/api/admin/bookings' });
    const bookings = res.json();
    expect(bookings).toHaveLength(2);
    expect(bookings[0].guestName).toBe('Alice');
    expect(bookings[1].guestName).toBe('Bob');
  });
});
```

- [ ] **Step 2: Run to verify tests pass**

Run: `cd backend && npx vitest run tests/admin.test.ts --reporter=dot`
Expected: 2 tests pass

- [ ] **Step 3: Run full backend tests**

Run: `make test-backend`
Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add backend/tests/admin.test.ts
git commit -m "test(backend): rewrite admin tests on shared helpers, add afterEach cleanup"
```

---

## Task 6: Add edge cases to `scheduling.test.ts`

New test cases only — no changes to existing tests. Appended to existing describe blocks.

**Files:**
- Modify: `backend/tests/scheduling.test.ts`

- [ ] **Step 1: Add new Booking Validation cases**

Add these tests inside `describe('Booking Validation')` after the existing tests:

```typescript
    it('rejects startTime before work hours (08:30)', async () => {
      const { res } = await createBooking({ app, eventTypeId, startTime: '2026-04-20T08:30:00.000Z' });
      expect(res.statusCode).toBe(400);
    });

    it('rejects startTime at WORK_END_HOUR boundary (17:00)', async () => {
      const { res } = await createBooking({ app, eventTypeId, startTime: '2026-04-20T17:00:00.000Z' });
      expect(res.statusCode).toBe(400);
    });

    it('rejects missing startTime in payload', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/bookings',
        payload: { eventTypeId, guestName: 'Alice', guestEmail: 'alice@test.com' },
      });
      expect(res.statusCode).toBe(400);
    });
```

- [ ] **Step 2: Run to verify new tests pass**

Run: `cd backend && npx vitest run tests/scheduling.test.ts --reporter=dot`
Expected: 20 tests pass (17 migrated + 3 new)

- [ ] **Step 3: Add new Slot Availability cases**

Add these tests inside `describe('Slot Availability')` after the existing tests:

```typescript
    it('deleted booking frees the slot', async () => {
      const { body: created } = await createBooking({ app, eventTypeId, startTime: '2026-04-20T09:00:00.000Z' });
      await app.inject({ method: 'DELETE', url: `/api/bookings/${created.id}` });

      const res = await app.inject({
        method: 'GET',
        url: `/api/slots?date=2026-04-20&eventTypeId=${eventTypeId}`,
      });
      const slots = res.json();
      const slot0900 = slots.find((s: { startTime: string }) => s.startTime.includes('09:00'));
      expect(slot0900.available).toBe(true);
    });

    it('fully booked day shows all slots as unavailable', async () => {
      const slotTimes = Array.from({ length: 16 }, (_, i) => {
        const hour = 9 + Math.floor(i / 2);
        const min = (i % 2) * 30;
        return `2026-04-20T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00.000Z`;
      });

      for (let i = 0; i < slotTimes.length; i++) {
        await createBooking({
          app,
          eventTypeId,
          guestName: `Guest${i}`,
          guestEmail: `guest${i}@test.com`,
          startTime: slotTimes[i],
        });
      }

      const res = await app.inject({
        method: 'GET',
        url: `/api/slots?date=2026-04-20&eventTypeId=${eventTypeId}`,
      });
      const slots = res.json();
      expect(slots).toHaveLength(16);
      expect(slots.every((s: { available: boolean }) => s.available === false)).toBe(true);
    });
```

- [ ] **Step 4: Add Booking + EventType Interaction block**

Add this new describe block at the end of the top-level `describe('Scheduling')`, after `describe('Slot Availability')`:

```typescript
  describe('Booking + EventType Interaction', () => {
    it('deleting eventType does not delete its bookings (denormalization)', async () => {
      const { body: booking } = await createBooking({ app, eventTypeId, startTime: '2026-04-20T09:00:00.000Z' });
      await app.inject({ method: 'DELETE', url: `/api/event-types/${eventTypeId}` });

      const res = await app.inject({ method: 'GET', url: `/api/bookings/${booking.id}` });
      expect(res.statusCode).toBe(200);
      expect(res.json().eventTypeName).toBe('Call');
    });
  });
```

- [ ] **Step 5: Run full scheduling tests**

Run: `cd backend && npx vitest run tests/scheduling.test.ts --reporter=dot`
Expected: 23 tests pass (17 migrated + 6 new)

- [ ] **Step 6: Run full backend tests**

Run: `make test-backend`
Expected: all tests pass

- [ ] **Step 7: Commit**

```bash
git add backend/tests/scheduling.test.ts
git commit -m "test(backend): add scheduling edge cases (boundary hours, freed slots, full day, denorm)"
```

---

## Task 7: Add edge cases to `event-types.test.ts`

New test cases only — appended to existing `describe('Validation')`.

**Files:**
- Modify: `backend/tests/event-types.test.ts`

- [ ] **Step 1: Add new validation cases**

Add these tests inside `describe('Validation')` after the existing tests:

```typescript
    it('PATCH /api/event-types/:id rejects invalid duration', async () => {
      const created = await createEventType({ app });
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/event-types/${created.id}`,
        payload: { duration: 25 },
      });
      expect(res.statusCode).toBe(400);
    });

    it('PATCH /api/event-types/:id with empty payload returns 200 unchanged', async () => {
      const created = await createEventType({ app });
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/event-types/${created.id}`,
        payload: {},
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().name).toBe('Call');
      expect(res.json().duration).toBe(30);
    });

    it('POST /api/event-types rejects empty payload', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/event-types',
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });
```

- [ ] **Step 2: Run to verify tests pass**

Run: `cd backend && npx vitest run tests/event-types.test.ts --reporter=dot`
Expected: 12 tests pass (9 existing + 3 new)

- [ ] **Step 3: Run full backend tests**

Run: `make test-backend`
Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add backend/tests/event-types.test.ts
git commit -m "test(backend): add event-types edge cases (PATCH invalid duration, empty payload)"
```

---

## Task 8: Add edge cases to `admin.test.ts`

New test cases only — appended to existing describe block.

**Files:**
- Modify: `backend/tests/admin.test.ts`

- [ ] **Step 1: Add new admin test cases**

Add these tests after the existing tests inside `describe('Admin Bookings API')`:

```typescript
  it('response contains denormalized fields', async () => {
    await createBooking({ app, eventTypeId, startTime: '2026-04-20T09:00:00.000Z' });
    const res = await app.inject({ method: 'GET', url: '/api/admin/bookings' });
    const booking = res.json()[0];
    expect(booking.eventTypeName).toBe('Call');
    expect(booking.duration).toBe(30);
    expect(booking.endTime).toBe('2026-04-20T09:30:00.000Z');
  });

  it('deleted booking does not appear in admin list', async () => {
    const { body: created } = await createBooking({ app, eventTypeId, startTime: '2026-04-20T09:00:00.000Z' });
    await app.inject({ method: 'DELETE', url: `/api/bookings/${created.id}` });
    const res = await app.inject({ method: 'GET', url: '/api/admin/bookings' });
    expect(res.json()).toEqual([]);
  });

  it('bookings from different event types appear in combined list', async () => {
    const otherType = await createEventType({ app, name: 'Short Call', duration: 15 });
    await createBooking({ app, eventTypeId, startTime: '2026-04-20T09:00:00.000Z' });
    await createBooking({ app, eventTypeId: otherType.id, guestName: 'Bob', guestEmail: 'bob@test.com', startTime: '2026-04-20T10:00:00.000Z' });

    const res = await app.inject({ method: 'GET', url: '/api/admin/bookings' });
    const bookings = res.json();
    expect(bookings).toHaveLength(2);
    expect(bookings[0].eventTypeName).toBe('Call');
    expect(bookings[1].eventTypeName).toBe('Short Call');
  });
```

- [ ] **Step 2: Run to verify tests pass**

Run: `cd backend && npx vitest run tests/admin.test.ts --reporter=dot`
Expected: 5 tests pass (2 existing + 3 new)

- [ ] **Step 3: Run full backend tests**

Run: `make test-backend`
Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add backend/tests/admin.test.ts
git commit -m "test(backend): add admin edge cases (denorm fields, deletion, multi-eventType)"
```

---

## Task 9: Create frontend `utils.test.ts`

Migrates `getDurationColors` tests from `pure.test.ts` and adds new `formatDate`/`formatTime` tests.

**Files:**
- Create: `frontend/src/lib/__tests__/utils.test.ts`

- [ ] **Step 1: Create `frontend/src/lib/__tests__/utils.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { getDurationColors, formatDate, formatTime } from '../utils.js';

describe('getDurationColors', () => {
  it('returns sky colors for duration 10 (minimum)', () => {
    const result = getDurationColors({ duration: 10 });
    expect(result.badge).toContain('sky');
    expect(result.border).toContain('sky');
  });

  it('returns sky colors for duration 15', () => {
    const result = getDurationColors({ duration: 15 });
    expect(result.badge).toContain('sky');
    expect(result.border).toContain('sky');
  });

  it('returns emerald colors for duration 20', () => {
    const result = getDurationColors({ duration: 20 });
    expect(result.badge).toContain('emerald');
    expect(result.border).toContain('emerald');
  });

  it('returns amber colors for duration 30', () => {
    const result = getDurationColors({ duration: 30 });
    expect(result.badge).toContain('amber');
    expect(result.border).toContain('amber');
  });

  it('returns violet colors for duration > 30', () => {
    const result = getDurationColors({ duration: 60 });
    expect(result.badge).toContain('violet');
    expect(result.border).toContain('violet');
  });
});

describe('formatDate', () => {
  it('formats a regular date in Russian locale', () => {
    const result = formatDate({ isoStr: '2026-04-20T09:00:00.000Z' });
    expect(result).toContain('20');
    expect(result).toMatch(/апрел/i);
    expect(result).toContain('2026');
  });

  it('formats start of year', () => {
    const result = formatDate({ isoStr: '2026-01-01T00:00:00.000Z' });
    expect(result).toContain('1');
    expect(result).toMatch(/январ/i);
    expect(result).toContain('2026');
  });

  it('formats end of year', () => {
    const result = formatDate({ isoStr: '2026-12-31T23:59:59.000Z' });
    expect(result).toMatch(/декабр/i);
    expect(result).toContain('2026');
  });
});

describe('formatTime', () => {
  it('formats morning time', () => {
    const result = formatTime({ isoStr: '2026-04-20T09:00:00.000Z' });
    expect(result).toMatch(/09:00|12:00/);
  });

  it('formats afternoon time', () => {
    const result = formatTime({ isoStr: '2026-04-20T16:30:00.000Z' });
    expect(result).toMatch(/16:30|19:30/);
  });

  it('formats midnight', () => {
    const result = formatTime({ isoStr: '2026-04-20T00:00:00.000Z' });
    expect(result).toMatch(/00:00|03:00/);
  });
});
```

Note: `formatDate` and `formatTime` use `toLocaleDateString`/`toLocaleTimeString` which depend on the system timezone. The regex matchers account for possible timezone offsets (UTC vs local). If tests fail due to timezone differences, adjust the expected values to match the CI/local environment timezone.

- [ ] **Step 2: Run to verify tests pass**

Run: `cd frontend && npx vitest run src/lib/__tests__/utils.test.ts --reporter=dot`
Expected: 11 tests pass

- [ ] **Step 3: Run full frontend tests to check no conflict with pure.test.ts**

Run: `make test-frontend`
Expected: all tests pass (both utils.test.ts and pure.test.ts run)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/__tests__/utils.test.ts
git commit -m "test(frontend): add utils.test.ts with getDurationColors, formatDate, formatTime"
```

---

## Task 10: Create frontend `validation.test.ts` and remove `pure.test.ts`

Migrates validation tests from `pure.test.ts`, adds edge cases, then deletes `pure.test.ts`.

**Files:**
- Create: `frontend/src/lib/__tests__/validation.test.ts`
- Delete: `frontend/src/lib/__tests__/pure.test.ts`

- [ ] **Step 1: Create `frontend/src/lib/__tests__/validation.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { bookingSchema, eventTypeSchema } from '../validation/schemas.js';
import { VALID_DURATIONS } from '../../../../shared/constants.js';

describe('bookingSchema', () => {
  it('accepts valid input', () => {
    const result = bookingSchema.safeParse({ guestName: 'Alice', guestEmail: 'alice@test.com' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = bookingSchema.safeParse({ guestName: '', guestEmail: 'alice@test.com' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = bookingSchema.safeParse({ guestName: 'Alice', guestEmail: 'not-email' });
    expect(result.success).toBe(false);
  });

  it('whitespace-only name passes min(1) — documents current behavior', () => {
    const result = bookingSchema.safeParse({ guestName: '   ', guestEmail: 'alice@test.com' });
    // min(1) checks length, not content — '   '.length === 3 > 1
    expect(result.success).toBe(true);
  });

  it('rejects email without domain', () => {
    const result = bookingSchema.safeParse({ guestName: 'Alice', guestEmail: 'alice@' });
    expect(result.success).toBe(false);
  });

  it('accepts very long name — documents no maxLength', () => {
    const longName = 'A'.repeat(500);
    const result = bookingSchema.safeParse({ guestName: longName, guestEmail: 'alice@test.com' });
    expect(result.success).toBe(true);
  });
});

describe('eventTypeSchema', () => {
  it('accepts valid input', () => {
    const result = eventTypeSchema.safeParse({ name: 'Call', duration: 30 });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = eventTypeSchema.safeParse({ name: '', duration: 30 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid duration', () => {
    const result = eventTypeSchema.safeParse({ name: 'Call', duration: 25 });
    expect(result.success).toBe(false);
  });

  it.each(
    VALID_DURATIONS.map((d) => [d]),
  )('accepts valid duration %i', (duration) => {
    const result = eventTypeSchema.safeParse({ name: 'Call', duration });
    expect(result.success).toBe(true);
  });

  it('rejects zero duration', () => {
    const result = eventTypeSchema.safeParse({ name: 'Call', duration: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative duration', () => {
    const result = eventTypeSchema.safeParse({ name: 'Call', duration: -15 });
    expect(result.success).toBe(false);
  });

  it('rejects string duration', () => {
    const result = eventTypeSchema.safeParse({ name: 'Call', duration: '30' });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run new file to verify tests pass**

Run: `cd frontend && npx vitest run src/lib/__tests__/validation.test.ts --reporter=dot`
Expected: 13 tests pass (6 migrated + 4 parameterized VALID_DURATIONS + 3 new edge cases)

- [ ] **Step 3: Delete `pure.test.ts`**

```bash
rm frontend/src/lib/__tests__/pure.test.ts
```

- [ ] **Step 4: Run full frontend tests**

Run: `make test-frontend`
Expected: all tests pass (utils.test.ts + validation.test.ts, no pure.test.ts)

- [ ] **Step 5: Run full test suite**

Run: `make test`
Expected: all backend + frontend + e2e tests pass

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/__tests__/validation.test.ts
git add frontend/src/lib/__tests__/pure.test.ts
git commit -m "test(frontend): add validation.test.ts with edge cases, remove pure.test.ts"
```

---

## Task 11: Fix production code if needed

If any tests from Tasks 6–10 revealed unexpected behavior (e.g., whitespace-only names passing validation), fix the production code here. Each fix is a separate commit.

**Files:**
- Potentially modify: `frontend/src/lib/validation/schemas.ts`
- Potentially modify: `backend/src/validation.ts`

- [ ] **Step 1: Review test results from Tasks 6–10**

Check if any tests documented unexpected behavior (look for comments like "documents current behavior"). Decide which behaviors need fixing.

Known candidate: `bookingSchema` accepts whitespace-only names (`'   '`) because `.min(1)` checks string length, not trimmed content.

- [ ] **Step 2: If whitespace name needs fixing — update frontend schema**

In `frontend/src/lib/validation/schemas.ts`, change:
```typescript
// Before:
  guestName: z
    .string()
    .min(1, 'Имя обязательно')
```
to:
```typescript
// After:
  guestName: z
    .string()
    .trim()
    .min(1, 'Имя обязательно')
```

- [ ] **Step 3: If frontend schema changed — update the validation test**

In `frontend/src/lib/__tests__/validation.test.ts`, update the whitespace test:

```typescript
  it('rejects whitespace-only name', () => {
    const result = bookingSchema.safeParse({ guestName: '   ', guestEmail: 'alice@test.com' });
    expect(result.success).toBe(false);
  });
```

- [ ] **Step 4: If backend schema also needs `.trim()` — update**

In `backend/src/validation.ts`, in `CreateBookingSchema`, change:
```typescript
// Before:
  guestName: z.string().min(1, 'Name must not be empty')
```
to:
```typescript
// After:
  guestName: z.string().trim().min(1, 'Name must not be empty')
```

- [ ] **Step 5: Run all tests**

Run: `make test`
Expected: all tests pass

- [ ] **Step 6: Commit if changes were made**

```bash
git add frontend/src/lib/validation/schemas.ts frontend/src/lib/__tests__/validation.test.ts backend/src/validation.ts
git commit -m "fix: add .trim() to guestName validation to reject whitespace-only names"
```

- [ ] **Step 7: If no production fixes needed — skip this task**

If all "documents current behavior" tests show acceptable behavior, this task is a no-op. Move on.
