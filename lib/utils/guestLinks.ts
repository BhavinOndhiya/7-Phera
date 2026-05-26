/**
 * Canonical guest-facing URLs for invitations, RSVP, and venue entry passes.
 */

export function buildGuestRsvpUrl(
  origin: string,
  eventId: string,
  guestId: string
): string {
  const base = origin.replace(/\/+$/, '');
  return `${base}/rsvp/${eventId}?guest=${guestId}`;
}

/** Encoded in email QR / printed passes — scanned at the door by `/scan`. */
export function buildGuestPassUrl(
  origin: string,
  eventId: string,
  guestId: string
): string {
  const base = origin.replace(/\/+$/, '');
  return `${base}/checkin/${eventId}?guest=${guestId}`;
}

export function parseGuestLinkUrl(raw: string): {
  eventId: string;
  guestId: string;
} | null {
  try {
    const url = raw.includes('://')
      ? new URL(raw)
      : new URL(raw, 'https://example.com');
    const match = url.pathname.match(/\/(?:rsvp|checkin)\/([^/]+)/);
    const eventId = match?.[1];
    const guestId = url.searchParams.get('guest');
    if (!eventId || !guestId) return null;
    return { eventId, guestId };
  } catch {
    return null;
  }
}
