/**
 * Canonical guest-facing URLs for invitations, RSVP, and venue entry passes.
 */

import { sanitizeOutboundUrl } from '@/lib/utils/appUrl';
import { signGuestLink, verifyGuestLinkToken } from './guestLinkToken';

function base(origin: string) {
  return origin.replace(/\/+$/, '');
}

function guestQuery(eventId: string, guestId: string): string {
  const token = signGuestLink(eventId, guestId);
  if (token) return `token=${encodeURIComponent(token)}`;
  return `guest=${encodeURIComponent(guestId)}`;
}

export function buildGuestRsvpUrl(
  origin: string,
  eventId: string,
  guestId: string
): string {
  return sanitizeOutboundUrl(
    `${base(origin)}/rsvp/${eventId}?${guestQuery(eventId, guestId)}`
  );
}

/** Encoded in email QR / printed passes — scanned at the door by `/scan`. */
export function buildGuestPassUrl(
  origin: string,
  eventId: string,
  guestId: string
): string {
  return sanitizeOutboundUrl(
    `${base(origin)}/checkin/${eventId}?${guestQuery(eventId, guestId)}`
  );
}

export function resolveGuestFromSearchParams(
  eventIdFromPath: string,
  searchParams: URLSearchParams
): { eventId: string; guestId: string } | null {
  const token = searchParams.get('token');
  if (token) {
    const payload = verifyGuestLinkToken(token);
    if (!payload || payload.eventId !== eventIdFromPath) return null;
    return { eventId: payload.eventId, guestId: payload.guestId };
  }

  const guestId = searchParams.get('guest');
  if (guestId) return { eventId: eventIdFromPath, guestId };

  return null;
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
    if (!eventId) return null;
    return resolveGuestFromSearchParams(eventId, url.searchParams);
  } catch {
    return null;
  }
}
