import { db } from '../connection.js';
import { addLinkExpiration } from './001-add-link-expiration.js';

export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrationName = '001-add-link-expiration';

  const migration = db.prepare('SELECT name FROM migrations WHERE name = ?').get(migrationName);

  if (!migration) {
    addLinkExpiration();

    db.prepare(
      `
      INSERT INTO migrations (name)
      VALUES (?)
    `,
    ).run(migrationName);
  }
}
