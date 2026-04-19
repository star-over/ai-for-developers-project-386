import Fastify from 'fastify';
import { createStore, Store } from './store.js';

declare module 'fastify' {
  interface FastifyInstance {
    store: Store;
  }
}
import { eventTypesRoutes } from './routes/event-types.js';
import { slotsRoutes } from './routes/slots.js';
import { bookingsRoutes } from './routes/bookings.js';
import { adminRoutes } from './routes/admin.js';

interface AppOptions {
  seed?: boolean;
}

export const buildApp = ({ seed = false }: AppOptions = {}) => {
  const app = Fastify({ logger: seed });
  const store = createStore({ seed });

  app.decorate('store', store);

  app.get('/api/health', async () => ({ status: 'ok' }));

  app.register(eventTypesRoutes);
  app.register(slotsRoutes);
  app.register(bookingsRoutes);
  app.register(adminRoutes);

  return app;
};
