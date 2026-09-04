import { db } from '../../database/connection.js';
import { Link } from './links.types.js';

export function createLink(code: string, originalUrl: string, expiresAt: string | null): Link {
  const statement = db.prepare(`
    INSERT INTO links (code, original_url, expires_at)
    VALUES (?, ?, ?)
  `);

  statement.run(code, originalUrl, expiresAt);

  const link = getLink(code);

  if (!link) {
    throw new Error('Failed to retrieve created link');
  }

  return link;
}

export function getLink(code: string): Link | undefined {
  const statement = db.prepare(`
    SELECT
      code,
      original_url AS originalUrl,
      expires_at as expiresAt
    FROM links
    WHERE code = ?
  `);

  return statement.get(code) as Link | undefined;
}

export function codeExists(code: string): boolean {
  return Boolean(getLink(code));
}
