import { FastifyInstance } from 'fastify';
import type { Store } from '../store.js';

export const adminRoutes = async (app: FastifyInstance) => {
  const { store } = app as any as { store: Store };

  app.get('/api/admin/bookings', async () => {
    return Array.from(store.bookings.values())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  });
};
