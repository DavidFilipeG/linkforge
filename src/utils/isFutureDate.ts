export function isFutureDate(date: string) {
  return new Date(date).getTime() > Date.now();
}
