import Fastify from 'fastify';
import { linksRoutes } from './modules/links/links.routes.js';
import { initDatabase } from './database/init.js';

export function buildApp() {
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

  return app;
}
