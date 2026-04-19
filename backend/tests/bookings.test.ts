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
