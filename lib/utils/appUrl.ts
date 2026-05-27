/**
 * Every email, auth link, QR code, and invite URL uses this origin.
 * Hardcoded so Supabase Site URL (often localhost) can never leak into Resend emails.
 *
 * Local dev only: set USE_LOCAL_EMAIL_LINKS=true in .env.local to use localhost in emails.
 */
export const APP_ORIGIN = 'https://7-phera.vercel.app';

const LOCAL_ORIGIN_IN_TEXT =
  /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?/gi;

const ENCODED_LOCALHOST =
  /https?%3A%2F%2F(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?/gi;

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

/** @deprecated use APP_ORIGIN */
export const PRODUCTION_ORIGIN = APP_ORIGIN;

function allowLocalEmailLinks(): boolean {
  return process.env.USE_LOCAL_EMAIL_LINKS === 'true';
}

/**
 * Origin for all outbound links. Defaults to https://7-phera.vercel.app always.
 */
export function resolveAppOrigin(_request?: Request): string {
  if (allowLocalEmailLinks()) {
    const local =
      process.env.LOCAL_APP_ORIGIN?.trim() || 'http://localhost:3000';
    return stripTrailingSlash(local);
  }

  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (
    fromEnv &&
    /^https?:\/\//i.test(fromEnv) &&
    !/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(fromEnv)
  ) {
    return stripTrailingSlash(fromEnv);
  }

  return APP_ORIGIN;
}

/**
 * Force production origin into any string (Supabase action_link, email HTML, etc.).
 */
export function sanitizeOutboundUrl(url: string, _request?: Request): string {
  if (allowLocalEmailLinks()) {
    return url;
  }

  const canonical = APP_ORIGIN;
  let result = url;

  for (let pass = 0; pass < 3; pass++) {
    result = result.replace(LOCAL_ORIGIN_IN_TEXT, canonical);
    result = result.replace(ENCODED_LOCALHOST, encodeURIComponent(canonical));
    try {
      const decoded = decodeURIComponent(result);
      if (decoded === result) break;
      result = decoded;
    } catch {
      break;
    }
  }

  result = result.replace(LOCAL_ORIGIN_IN_TEXT, canonical);

  try {
    const parsed = new URL(result);
    const redirectTo = parsed.searchParams.get('redirect_to');
    if (redirectTo && /localhost|127\.0\.0\.1/i.test(redirectTo)) {
      try {
        const inner = new URL(redirectTo);
        parsed.searchParams.set(
          'redirect_to',
          `${APP_ORIGIN}${inner.pathname}${inner.search}${inner.hash}`
        );
      } catch {
        parsed.searchParams.set(
          'redirect_to',
          redirectTo.replace(LOCAL_ORIGIN_IN_TEXT, canonical)
        );
      }
      result = parsed.toString();
    }
  } catch {
    // not a valid URL — string replace above is enough
  }

  return result.replace(LOCAL_ORIGIN_IN_TEXT, canonical);
}

export function buildAppUrl(path: string, _request?: Request): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return sanitizeOutboundUrl(`${resolveAppOrigin()}${p}`);
}
