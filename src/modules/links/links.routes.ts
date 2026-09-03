import { FastifyInstance } from 'fastify';
import { generateCode } from '../../utils/generateCode.js';
import { isValidUrl } from '../../utils/isValidUrl.js';
import { codeExists, createLink, getLink } from './links.repository.js';
import { env } from '../../config/env.js';

export async function linksRoutes(app: FastifyInstance) {
  app.post<{ Body: { url: string } }>('/links', async (request, reply) => {
    const body = request.body;
    const url = body.url;

    if (!url) {
      return reply.code(400).send({
        error: 'Bad request',
        message: 'The URL field is mandatory',
        statusCode: 400,
      });
    }

    if (!isValidUrl(url)) {
      return reply.code(400).send({
        error: 'Bad request',
        message: 'The URL must be valid and use http:// or https://',
        statusCode: 400,
      });
    }

    let code: string;

    do {
      code = generateCode();
    } while (codeExists(code));

    const link = createLink(code, url);

    return reply.code(201).send({
      ...link,
      shortUrl: `${env.baseUrl}${link.code}`,
    });
  });

  app.get<{ Params: { code: string } }>('/:code', async (request, reply) => {
    const code = request.params.code;

    const link = getLink(code);

    if (!link) {
      return reply.code(404).send({
        error: 'Not found',
        message: 'Link not found',
        statusCode: 404,
      });
    }

    return reply.redirect(link.originalUrl);
  });
}
