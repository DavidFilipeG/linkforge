import Database from 'better-sqlite3';

const databasePath = process.env.NODE_ENV === 'test' ? ':memory:' : 'linkforge.db';

export const db = new Database(databasePath);
