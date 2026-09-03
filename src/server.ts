import Fastify from 'fastify';
import { linksRoutes } from './modules/links/links.routes.js';
import { initDatabase } from './database/init.js';
import { env } from './config/env.js';

const app = Fastify({
  logger: true,
});

const port = Number(env.port);

initDatabase();

app.get('/health', async () => {
  return {
    status: 'ok',
  };
});

app.register(linksRoutes);

const start = async () => {
  try {
    await app.listen({
      port: port,
      host: '0.0.0.0',
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
