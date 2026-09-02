import { db } from '../../database/connection.js';
import { Link } from './links.types.js';

export function createLink(code: string, originalUrl: string) {
  const statement = db.prepare(`
    INSERT INTO links (code, original_url)
    VALUES (?, ?)
  `);

  statement.run(code, originalUrl);
}

export function getLink(code: string): Link | undefined {
  const statement = db.prepare(`
    SELECT
      code,
      original_url AS originalUrl
    FROM links
    WHERE code = ?
  `);

  return statement.get(code) as Link | undefined;
}

export function codeExists(code: string): boolean {
  return Boolean(getLink(code));
}
