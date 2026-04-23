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
