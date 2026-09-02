import { FastifyInstance } from 'fastify';
import { generateCode } from '../../utils/generateCode.js';
import { isValidUrl } from '../../utils/isValidUrl.js';

type Link = {
  originalUrl: string;
  code: string;
};

const links: Link[] = [];

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
    } while (links.some((link) => link.code === code));

    const link: Link = {
      code: code,
      originalUrl: url,
    };

    links.push(link);

    return reply.code(201).send(link);
  });

  app.get<{ Params: { code: string } }>('/:code', async (request, reply) => {
    const code = request.params.code;

    const link = links.find((link) => link.code === code);

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
