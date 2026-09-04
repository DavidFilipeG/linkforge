import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.js';
import { clearDatabase } from './helpers/database.js';

let app: ReturnType<typeof buildApp>;

beforeEach(() => {
  app = buildApp();
  clearDatabase();
});

afterEach(async () => {
  vi.useRealTimers();
  await app.close();
});

describe('POST /links', () => {
  it('should create a short link for a valid URL', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {
        url: 'https://github.com',
      },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json();

    expect(body.originalUrl).toBe('https://github.com');
    expect(body.code).toBeDefined();
    expect(body.shortUrl).toBeDefined();
    expect(body.expiresAt).toBeNull();
  });

  it('should return 400 when URL is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {},
    });

    expect(response.statusCode).toBe(400);

    const body = response.json();

    expect(body.message).toBe('The URL field is mandatory');
  });

  it('should return 400 when URL is invalid', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {
        url: 'this-is-not-a-url',
      },
    });

    expect(response.statusCode).toBe(400);

    const body = response.json();

    expect(body.message).toBe('The URL must be valid and use http:// or https://');
  });

  it('should create a short link with a custom alias', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {
        url: 'https://github.com',
        alias: 'GitHub',
      },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json();

    expect(body.originalUrl).toBe('https://github.com');
    expect(body.code).toBe('github');
    expect(body.shortUrl).toBeDefined();
  });

  it('should return 409 when alias is already in use', async () => {
    const firstResponse = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {
        url: 'https://github.com',
        alias: 'github',
      },
    });

    expect(firstResponse.statusCode).toBe(201);

    const secondResponse = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {
        url: 'https://google.com',
        alias: 'github',
      },
    });

    expect(secondResponse.statusCode).toBe(409);

    const body = secondResponse.json();

    expect(body.message).toBe('Alias already in use');
  });

  it('should return 400 when alias is invalid', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {
        url: 'https://github.com',
        alias: 'my alias',
      },
    });

    expect(response.statusCode).toBe(400);

    const body = response.json();

    expect(body.message).toBe(
      'Alias must be 3 to 30 characters and contain only letters, numbers, hyphens or underscores',
    );
  });

  it('should return 400 when alias is reserved', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {
        url: 'https://github.com',
        alias: 'api',
      },
    });

    expect(response.statusCode).toBe(400);

    const body = response.json();

    expect(body.message).toBe('This alias is reserved');
  });

  it('should create a short link with an expiration date', async () => {
    vi.useFakeTimers({
      toFake: ['Date'],
    });

    vi.setSystemTime(new Date('2026-09-04T10:00:00.000Z'));

    const response = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {
        url: 'https://github.com',
        expiresAt: '2026-09-04T11:00:00.000Z',
      },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json();

    expect(body.originalUrl).toBe('https://github.com');
    expect(body.expiresAt).toBe('2026-09-04T11:00:00.000Z');
    expect(body.code).toBeDefined();
    expect(body.shortUrl).toBeDefined();
  });

  it('should return 400 when expiration date is invalid', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {
        url: 'https://github.com',
        expiresAt: 'invalid-date',
      },
    });

    expect(response.statusCode).toBe(400);

    const body = response.json();

    expect(body.message).toBe('The expiresAt is invalid date');
  });

  it('should return 400 when expiration date is in the past', async () => {
    vi.useFakeTimers({
      toFake: ['Date'],
    });

    vi.setSystemTime(new Date('2026-09-04T10:00:00.000Z'));

    const response = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {
        url: 'https://github.com',
        expiresAt: '2026-09-04T09:00:00.000Z',
      },
    });

    expect(response.statusCode).toBe(400);

    const body = response.json();

    expect(body.message).toBe('The expiresAt value cannot be in the past.');
  });
});

describe('GET /:code', () => {
  it('should redirect to the original URL when code exists', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {
        url: 'https://github.com',
        alias: 'github',
      },
    });

    expect(createResponse.statusCode).toBe(201);

    const createdLink = createResponse.json();

    const response = await app.inject({
      method: 'GET',
      url: `/${createdLink.code}`,
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('https://github.com');
  });

  it('should return 404 when code does not exist', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/does-not-exist',
    });

    expect(response.statusCode).toBe(404);

    const body = response.json();

    expect(body.message).toBe('Link not found');
  });

  it('should redirect when link has not expired', async () => {
    vi.useFakeTimers({
      toFake: ['Date'],
    });

    vi.setSystemTime(new Date('2026-09-04T10:00:00.000Z'));

    const createResponse = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {
        url: 'https://github.com',
        alias: 'future-link',
        expiresAt: '2026-09-04T11:00:00.000Z',
      },
    });

    expect(createResponse.statusCode).toBe(201);

    const response = await app.inject({
      method: 'GET',
      url: '/future-link',
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('https://github.com');
  });

  it('should return 410 when link has expired', async () => {
    vi.useFakeTimers({
      toFake: ['Date'],
    });

    vi.setSystemTime(new Date('2026-09-04T10:00:00.000Z'));

    const createResponse = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {
        url: 'https://github.com',
        alias: 'expired-link',
        expiresAt: '2026-09-04T11:00:00.000Z',
      },
    });

    expect(createResponse.statusCode).toBe(201);

    vi.setSystemTime(new Date('2026-09-04T12:00:00.000Z'));

    const response = await app.inject({
      method: 'GET',
      url: '/expired-link',
    });

    expect(response.statusCode).toBe(410);

    const body = response.json();

    expect(body.message).toBe('Link has expired');
  });
});

describe('GET /links/:code', () => {
  it('should return link details', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {
        url: 'https://github.com',
        alias: 'github',
      },
    });

    expect(createResponse.statusCode).toBe(201);

    const response = await app.inject({
      method: 'GET',
      url: '/links/github',
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body.code).toBe('github');
    expect(body.originalUrl).toBe('https://github.com');
    expect(body.shortUrl).toBeDefined();
    expect(body.expiresAt).toBeNull();
    expect(body.clickCount).toBe(0);
  });

  it('should return 404 when link does not exist', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/links/does-not-exist',
    });

    expect(response.statusCode).toBe(404);

    const body = response.json();

    expect(body.message).toBe('Link not found');
  });

  it('should increment click count when link is accessed', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {
        url: 'https://github.com',
        alias: 'github',
      },
    });

    expect(createResponse.statusCode).toBe(201);

    const redirectResponse = await app.inject({
      method: 'GET',
      url: '/github',
    });

    expect(redirectResponse.statusCode).toBe(302);

    const statsResponse = await app.inject({
      method: 'GET',
      url: '/links/github',
    });

    expect(statsResponse.statusCode).toBe(200);

    const body = statsResponse.json();

    expect(body.clickCount).toBe(1);
  });

  it('should increment click count on every redirect', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {
        url: 'https://github.com',
        alias: 'github',
      },
    });

    expect(createResponse.statusCode).toBe(201);

    for (let i = 0; i < 3; i += 1) {
      const redirectResponse = await app.inject({
        method: 'GET',
        url: '/github',
      });

      expect(redirectResponse.statusCode).toBe(302);
    }

    const statsResponse = await app.inject({
      method: 'GET',
      url: '/links/github',
    });

    expect(statsResponse.statusCode).toBe(200);

    const body = statsResponse.json();

    expect(body.clickCount).toBe(3);
  });

  it('should not increment click count when link has expired', async () => {
    vi.useFakeTimers({
      toFake: ['Date'],
    });

    vi.setSystemTime(new Date('2026-09-04T10:00:00.000Z'));

    const createResponse = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {
        url: 'https://github.com',
        alias: 'expired-link',
        expiresAt: '2026-09-04T11:00:00.000Z',
      },
    });

    expect(createResponse.statusCode).toBe(201);

    vi.setSystemTime(new Date('2026-09-04T12:00:00.000Z'));

    const redirectResponse = await app.inject({
      method: 'GET',
      url: '/expired-link',
    });

    expect(redirectResponse.statusCode).toBe(410);

    const statsResponse = await app.inject({
      method: 'GET',
      url: '/links/expired-link',
    });

    expect(statsResponse.statusCode).toBe(200);

    const body = statsResponse.json();

    expect(body.clickCount).toBe(0);
  });
});
