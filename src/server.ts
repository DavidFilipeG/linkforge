import Fastify from 'fastify';
import { linksRoutes } from './modules/links/links.routes.js';
import { initDatabase } from './database/init.js';

const app = Fastify({
  logger: true,
});

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
      port: 3000,
      host: '0.0.0.0',
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
