import { db } from '../../src/database/connection.js';
import { initDatabase } from '../../src/database/init.js';

export function clearDatabase() {
  initDatabase();
  db.exec('DELETE FROM links');
}
