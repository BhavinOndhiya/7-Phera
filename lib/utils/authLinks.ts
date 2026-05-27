import { buildAppUrl, sanitizeOutboundUrl } from '@/lib/utils/appUrl';

/**
 * Supabase `action_link` often embeds the project's Site URL (localhost).
 * Rewrite every query param and the full string to the canonical app origin.
 */
export function rewriteAuthActionLink(
  actionLink: string,
  request?: Request
): string {
  let result = sanitizeOutboundUrl(actionLink, request);

  try {
    const url = new URL(result);
    const keys = [...url.searchParams.keys()];
    for (const key of keys) {
      const value = url.searchParams.get(key);
      if (
        value &&
        (value.includes('localhost') ||
          value.includes('127.0.0.1') ||
          value.includes('0.0.0.0'))
      ) {
        url.searchParams.set(key, sanitizeOutboundUrl(value, request));
      }
    }
    result = url.toString();
  } catch {
    // keep sanitized full-string result
  }

  return sanitizeOutboundUrl(result, request);
}

export function authCallbackUrl(nextPath: string, request?: Request): string {
  const next = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
  return buildAppUrl(
    `/auth/callback?next=${encodeURIComponent(next)}`,
    request
  );
}

/** After sanitizing, ensure redirect_to matches our app origin (belt + suspenders). */
export function prepareAuthEmailLink(
  rawLink: string,
  request?: Request
): string {
  return rewriteAuthActionLink(rawLink, request);
}
