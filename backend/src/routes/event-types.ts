import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { CreateEventTypeSchema, UpdateEventTypeSchema } from '../validation.js';
import type { EventType, Store } from '../store.js';

export const eventTypesRoutes = async (app: FastifyInstance) => {
  const { store } = app as any as { store: Store };

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
