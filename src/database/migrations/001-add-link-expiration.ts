import { db } from '../connection.js';

export function addLinkExpiration() {
  db.exec(`
    ALTER TABLE links
    ADD COLUMN expires_at TEXT;
  `);
}
