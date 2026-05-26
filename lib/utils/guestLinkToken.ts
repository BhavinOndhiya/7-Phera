import { createHmac, timingSafeEqual } from 'crypto';

const DEFAULT_TTL_DAYS = 90;

export interface GuestLinkPayload {
  eventId: string;
  guestId: string;
  exp: number;
}

function secret(): string | null {
  const s = process.env.GUEST_LINK_SECRET?.trim();
  return s && s.length >= 16 ? s : null;
}

export function signGuestLink(
  eventId: string,
  guestId: string,
  ttlDays = DEFAULT_TTL_DAYS
): string | null {
  const key = secret();
  if (!key) return null;

  const exp = Math.floor(Date.now() / 1000) + ttlDays * 86400;
  const payload = `${eventId}.${guestId}.${exp}`;
  const sig = createHmac('sha256', key).update(payload).digest('base64url');
  const token = Buffer.from(`${eventId}:${guestId}:${exp}`, 'utf8').toString(
    'base64url'
  );
  return `${token}.${sig}`;
}

export function verifyGuestLinkToken(token: string): GuestLinkPayload | null {
  const key = secret();
  if (!key) return null;

  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;

  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let decoded: string;
  try {
    decoded = Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  const parts = decoded.split(':');
  if (parts.length !== 3) return null;

  const [eventId, guestId, expStr] = parts;
  const exp = Number(expStr);
  if (!eventId || !guestId || !Number.isFinite(exp)) return null;
  if (exp < Math.floor(Date.now() / 1000)) return null;

  const payload = `${eventId}.${guestId}.${exp}`;
  const expected = createHmac('sha256', key).update(payload).digest('base64url');

  try {
    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return { eventId, guestId, exp };
}

export function guestLinksUseTokens(): boolean {
  return Boolean(secret());
}
