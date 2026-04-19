import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';

describe('Slots API', () => {
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
    const slot0900 = slots.find((s: { startTime: string }) => s.startTime.includes('09:00'));
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
    const slot1000 = slots.find((s: { startTime: string }) => s.startTime.includes('10:00'));
    expect(slot1000.available).toBe(false);
  });

  it('returns 400 if date or eventTypeId missing', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/slots' });
    expect(res.statusCode).toBe(400);
  });
});
