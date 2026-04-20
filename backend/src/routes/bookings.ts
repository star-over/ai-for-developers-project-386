import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { CreateBookingSchema, parseIdParam } from '../validation.js';
import { SLOT_DURATION, WORK_START_HOUR, WORK_END_HOUR } from '../constants.js';
import type { Booking } from '../store.js';

export const bookingsRoutes = async (app: FastifyInstance) => {
  const { store } = app;

  app.post('/api/bookings', async (request, reply) => {
    const parsed = CreateBookingSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.issues[0].message });
    }

    const { eventTypeId, guestName, guestEmail, startTime } = parsed.data;

    const eventType = store.eventTypes.get(eventTypeId);
    if (!eventType) {
      return reply.status(404).send({ message: 'Event type not found' });
    }

    const start = new Date(startTime);
    const minutes = start.getUTCMinutes();
    const hours = start.getUTCHours();

    if (minutes % SLOT_DURATION !== 0) {
      return reply.status(400).send({ message: 'startTime must be on 30-minute boundary' });
    }

    if (hours < WORK_START_HOUR || hours >= WORK_END_HOUR) {
      return reply.status(400).send({ message: 'startTime must be within work hours (09:00–16:30)' });
    }

    const startIso = start.toISOString();
    for (const booking of store.bookings.values()) {
      if (booking.startTime === startIso) {
        return reply.status(409).send({ message: 'Slot already taken' });
      }
    }

    const endTime = new Date(start.getTime() + eventType.duration * 60 * 1000).toISOString();

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
    const id = await parseIdParam({ params: request.params, reply });
    if (!id) return;
    const booking = store.bookings.get(id);
    if (!booking) {
      return reply.status(404).send({ message: 'Not found' });
    }
    return booking;
  });

  app.delete('/api/bookings/:id', async (request, reply) => {
    const id = await parseIdParam({ params: request.params, reply });
    if (!id) return;
    if (!store.bookings.has(id)) {
      return reply.status(404).send({ message: 'Not found' });
    }
    store.bookings.delete(id);
    return reply.status(204).send();
  });
};
