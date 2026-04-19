import { FastifyInstance } from 'fastify';
import { SlotsQuerySchema } from '../validation.js';

const SLOT_DURATION = 30;
const WORK_START_HOUR = 9;
const WORK_END_HOUR = 17;

export const slotsRoutes = async (app: FastifyInstance) => {
  const { store } = app;

  app.get('/api/slots', async (request, reply) => {
    const parsed = SlotsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.issues[0].message });
    }

    const { date, eventTypeId } = parsed.data;

    if (!store.eventTypes.has(eventTypeId)) {
      return reply.status(400).send({ message: 'Event type not found' });
    }

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
