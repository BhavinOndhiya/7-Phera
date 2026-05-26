/**
 * Resolves the canonical absolute origin (e.g. `https://example.com`) for
 * building outbound URLs — RSVP links in emails, QR codes, invite-accept
 * links, password reset redirects.
 *
 * Precedence:
 *   1. `NEXT_PUBLIC_APP_URL` — only when it is an absolute `https?://` URL
 *      AND does NOT contain `localhost` / `127.0.0.1` / `0.0.0.0`. Lets you
 *      override with a custom domain (e.g. `https://saathphere.com`) once
 *      DNS is hooked up.
 *   2. Vercel build (`process.env.VERCEL === '1'`) → hardcoded production
 *      origin. This is intentional: env-var changes on Vercel only apply
 *      to *future* builds, so a stale or unset value used to leak a
 *      localhost URL into emails. With this hardcode, deployed emails
 *      ALWAYS link to the right host regardless of env-var state.
 *   3. `request.url` origin — local dev / self-hosted. Trust the actual
 *      host the request came in on (e.g. `http://localhost:3000`).
 *   4. `NEXT_PUBLIC_APP_URL` as-is — last resort when no `Request` is
 *      available (server actions, background jobs).
 *   5. `http://localhost:3000` — final fallback so the function never
 *      returns an empty string.
 *
 * To move to a custom domain later: set `NEXT_PUBLIC_APP_URL` on Vercel to
 * `https://your-domain.com` and step 1 will win over step 2. No code change.
 */
const PRODUCTION_ORIGIN = 'https://7-phera.vercel.app';

export function resolveAppOrigin(request?: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const looksAbsolute = (url: string) => /^https?:\/\//i.test(url);
  const looksLocal = (url: string) =>
    /(?:^|\/\/)(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::|\/|$)/i.test(url);

  if (fromEnv && looksAbsolute(fromEnv) && !looksLocal(fromEnv)) {
    return stripTrailingSlash(fromEnv);
  }

  if (process.env.VERCEL === '1' || process.env.VERCEL === 'true') {
    return PRODUCTION_ORIGIN;
  }

  if (request) {
    return new URL(request.url).origin;
  }

  if (fromEnv) {
    return stripTrailingSlash(fromEnv);
  }

  return 'http://localhost:3000';
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}
