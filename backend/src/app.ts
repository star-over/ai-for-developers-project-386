import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
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

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const publicDir = resolve(__dirname, '..', 'public');

  if (existsSync(publicDir)) {
    app.register(fastifyStatic, {
      root: publicDir,
      wildcard: false,
    });

    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api/')) {
        return reply.code(404).send({ error: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
};
