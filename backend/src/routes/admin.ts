import { FastifyInstance } from 'fastify';

export const adminRoutes = async (app: FastifyInstance) => {
  const { store } = app;

  app.get('/api/admin/bookings', async () => {
    return Array.from(store.bookings.values())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  });
};
