import { APP_ORIGIN, buildAppUrl, sanitizeOutboundUrl } from '@/lib/utils/appUrl';

/**
 * Supabase embeds Site URL (often localhost) in action_link — always rewrite to APP_ORIGIN.
 */
export function rewriteAuthActionLink(actionLink: string): string {
  return sanitizeOutboundUrl(actionLink);
}

export function authCallbackUrl(nextPath: string): string {
  const next = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
  return `${APP_ORIGIN}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function prepareAuthEmailLink(rawLink: string): string {
  return sanitizeOutboundUrl(rawLink);
}
