import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';

describe('Event Types API', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(async () => {
    app = buildApp();
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
