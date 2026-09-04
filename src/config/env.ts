import { loadEnvFile } from 'node:process';

loadEnvFile();

const baseUrl = process.env.BASE_URL;

if (!baseUrl) {
  throw new Error('BASE_URL environment variable is required');
}

const port = process.env.PORT;

if (!port) {
  throw new Error('PORT environment variable is required');
}

export const env = { baseUrl, port };
