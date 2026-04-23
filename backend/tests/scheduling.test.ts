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
  });

  describe('Booking + EventType Interaction', () => {
    it('deleting eventType does not delete its bookings (denormalization)', async () => {
      const { body: booking } = await createBooking({ app, eventTypeId, startTime: '2026-04-20T09:00:00.000Z' });
      await app.inject({ method: 'DELETE', url: `/api/event-types/${eventTypeId}` });

      const res = await app.inject({ method: 'GET', url: `/api/bookings/${booking.id}` });
      expect(res.statusCode).toBe(200);
      expect(res.json().eventTypeName).toBe('Call');
    });
  });
});
