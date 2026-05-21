/**
 * Resolves the canonical absolute origin (e.g. `https://example.com`) for
 * building outbound URLs — RSVP links in emails, QR codes, invite-accept
 * links, password reset redirects.
 *
 * Precedence:
 *   1. `NEXT_PUBLIC_APP_URL` — only when it is an absolute `http(s)://` URL
 *      AND does NOT contain `localhost` / `127.0.0.1` / `0.0.0.0`. This
 *      stops a committed `.env` localhost value from leaking into a
 *      deployed environment.
 *   2. `VERCEL_PROJECT_PRODUCTION_URL` — Vercel's stable production
 *      hostname (e.g. `7-phera.vercel.app`). Auto-injected on Vercel.
 *   3. `VERCEL_URL` — Vercel's per-deployment hostname. Useful so preview
 *      deploys produce preview-host links instead of production links.
 *   4. `request.url` origin — local dev / self-hosted. Trust the actual
 *      host the request came in on.
 *   5. `NEXT_PUBLIC_APP_URL` as-is — last resort when no `Request` is
 *      available (server actions, background jobs).
 *   6. `http://localhost:3000` — final fallback so the function never
 *      returns an empty string.
 */
export function resolveAppOrigin(request?: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const looksAbsolute = (url: string) => /^https?:\/\//i.test(url);
  const looksLocal = (url: string) =>
    /(?:^|\/\/)(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::|\/|$)/i.test(url);

  if (fromEnv && looksAbsolute(fromEnv) && !looksLocal(fromEnv)) {
    return stripTrailingSlash(fromEnv);
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
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
