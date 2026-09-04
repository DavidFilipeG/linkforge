import { FastifyInstance } from 'fastify';
import { generateCode } from '../../utils/generateCode.js';
import { isValidUrl } from '../../utils/isValidUrl.js';
import { codeExists, createLink, getLink } from './links.repository.js';
import { env } from '../../config/env.js';
import { isValidAlias } from '../../utils/isValidAlias.js';
import { RESERVED_ALIASES } from './links.constants.js';
import { isValidDate } from '../../utils/isValidDate.js';
import { isFutureDate } from '../../utils/isFutureDate.js';

export async function linksRoutes(app: FastifyInstance) {
  app.post<{
    Body: {
      url: string;
      alias?: string;
      expiresAt?: string;
    };
  }>('/links', async (request, reply) => {
    const { url, alias, expiresAt } = request.body;

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

    if (expiresAt) {
      if (!isValidDate(expiresAt)) {
        return reply.code(400).send({
          error: 'Bad request',
          message: 'The expiresAt is invalid date',
          statusCode: 400,
        });
      }

      if (!isFutureDate(expiresAt)) {
        return reply.code(400).send({
          error: 'Bad request',
          message: 'The expiresAt value cannot be in the past.',
          statusCode: 400,
        });
      }
    }

    let code: string;

    if (alias) {
      if (!isValidAlias(alias)) {
        return reply.code(400).send({
          error: 'Bad request',
          message:
            'Alias must be 3 to 30 characters and contain only letters, numbers, hyphens or underscores',
          statusCode: 400,
        });
      }

      const normalizedAlias = alias.toLowerCase();

      if (RESERVED_ALIASES.includes(normalizedAlias)) {
        return reply.code(400).send({
          error: 'Bad request',
          message: 'This alias is reserved',
          statusCode: 400,
        });
      }

      if (codeExists(normalizedAlias)) {
        return reply.code(409).send({
          error: 'Conflict',
          message: 'Alias already in use',
          statusCode: 409,
        });
      }

      code = normalizedAlias;
    } else {
      do {
        code = generateCode();
      } while (codeExists(code));
    }

    const normalizedExpiresAt = expiresAt ? new Date(expiresAt).toISOString() : null;

    const link = createLink(code, url, normalizedExpiresAt);

    return reply.code(201).send({
      ...link,
      shortUrl: `${env.baseUrl}/${link.code}`,
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

    if (link.expiresAt && new Date(link.expiresAt) <= new Date()) {
      return reply.code(410).send({
        error: 'Gone',
        message: 'Link has expired',
        statusCode: 410,
      });
    }

    return reply.redirect(link.originalUrl);
  });
}
