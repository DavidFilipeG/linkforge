import { db } from '../connection.js';

export function addLinkClickCount() {
  db.exec(`
    ALTER TABLE links
    ADD COLUMN click_count INTEGER NOT NULL DEFAULT 0;
  `);
}
