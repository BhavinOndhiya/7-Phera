import { APP_ORIGIN, sanitizeOutboundUrl } from '@/lib/utils/appUrl';

export type GenerateLinkProperties = {
  action_link?: string;
  hashed_token?: string;
  verification_type?: string;
};

/**
 * Direct link to our app — never supabase.co/auth/v1/verify (avoids localhost Site URL redirect).
 */
export function buildAuthConfirmUrl(params: {
  tokenHash: string;
  type: string;
  nextPath: string;
}): string {
  const next = params.nextPath.startsWith('/') ? params.nextPath : `/${params.nextPath}`;
  const url = new URL(`${APP_ORIGIN}/auth/confirm`);
  url.searchParams.set('token_hash', params.tokenHash);
  url.searchParams.set('type', params.type);
  url.searchParams.set('next', next);
  return url.toString();
}

/** Prefer hashed_token flow; fall back to sanitized Supabase action_link. */
export function emailLinkFromGenerateLink(
  properties: GenerateLinkProperties | null | undefined,
  nextPath: string
): string | null {
  const tokenHash = properties?.hashed_token?.trim();
  const type = properties?.verification_type?.trim();
  if (tokenHash && type) {
    return buildAuthConfirmUrl({ tokenHash, type, nextPath });
  }
  const raw = properties?.action_link;
  if (!raw) return null;
  return sanitizeOutboundUrl(raw);
}

export function authCallbackUrl(nextPath: string): string {
  const next = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
  return `${APP_ORIGIN}/auth/callback?next=${encodeURIComponent(next)}`;
}

/** @deprecated use emailLinkFromGenerateLink */
export function prepareAuthEmailLink(rawLink: string): string {
  return sanitizeOutboundUrl(rawLink);
}
