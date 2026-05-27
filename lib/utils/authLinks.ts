import { resolveAppOrigin } from '@/lib/utils/appUrl';

const LOCAL_HOST =
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i;

/**
 * Supabase `action_link` values often use the project's Site URL (e.g. localhost)
 * even when we pass a production `redirectTo`. Rewrite redirect_to to our app origin.
 */
export function rewriteAuthActionLink(actionLink: string): string {
  const origin = resolveAppOrigin().replace(/\/+$/, '');

  try {
    const url = new URL(actionLink);
    const redirectTo = url.searchParams.get('redirect_to');
    if (redirectTo) {
      url.searchParams.set('redirect_to', replaceLocalOrigin(redirectTo, origin));
    }
    return url.toString();
  } catch {
    return actionLink;
  }
}

function replaceLocalOrigin(target: string, origin: string): string {
  try {
    const u = new URL(target);
    if (LOCAL_HOST.test(u.hostname)) {
      return `${origin}${u.pathname}${u.search}${u.hash}`;
    }
    return target;
  } catch {
    return target;
  }
}

export function authCallbackUrl(nextPath: string): string {
  const origin = resolveAppOrigin().replace(/\/+$/, '');
  const next = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}
