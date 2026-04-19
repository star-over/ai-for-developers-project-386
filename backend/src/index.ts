import { buildApp } from './app.js';

const app = buildApp({ seed: true });

const port = Number(process.env.PORT) || 3000;

app.listen({ port, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});
