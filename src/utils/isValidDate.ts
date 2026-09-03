export function isValidDate(value: string): boolean {
  const hasTimezone = /(Z|[+-]\d{2}:\d{2})$/i.test(value);

  if (!hasTimezone) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}
