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
