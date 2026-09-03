export function isValidAlias(alias: string): boolean {
  return /^[a-zA-Z0-9_-]{3,30}$/.test(alias);
}
