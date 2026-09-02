import { randomInt } from 'node:crypto';

export function generateCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  return Array.from({ length }, () => chars[randomInt(0, chars.length)]).join('');
}
