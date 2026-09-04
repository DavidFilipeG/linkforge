import { db } from '../connection.js';
import { addLinkExpiration } from './001-add-link-expiration.js';
import { addLinkClickCount } from './002-add-link-click-count.js';

const migrations = [
  {
    name: '001-add-link-expiration',
    run: addLinkExpiration,
  },
  {
    name: '002-add-link-click-count',
    run: addLinkClickCount,
  },
];

export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const findMigration = db.prepare(`
    SELECT name
    FROM migrations
    WHERE name = ?
  `);

  const insertMigration = db.prepare(`
    INSERT INTO migrations (name)
    VALUES (?)
  `);

  for (const migration of migrations) {
    const executed = findMigration.get(migration.name);

    if (executed) {
      continue;
    }

    migration.run();

    insertMigration.run(migration.name);
  }
}
