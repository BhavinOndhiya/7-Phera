/** Normalized key for duplicate guest name checks (case/space insensitive). */
export function normalizeGuestNameKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}
