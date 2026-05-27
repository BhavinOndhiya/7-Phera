/**
 * Canonical origin for every link in emails, QR codes, and auth redirects.
 * Production must never leak localhost — Supabase Site URL is often still local.
 */
export const PRODUCTION_ORIGIN = 'https://7-phera.vercel.app';

const LOCAL_HOSTNAME =
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i;

/** Matches http://localhost:3000 and similar anywhere in a string */
const LOCAL_ORIGIN_IN_TEXT =
  /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?/gi;

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function isLocalHostname(hostname: string): boolean {
  return LOCAL_HOSTNAME.test(hostname);
}

export function isLocalOrigin(url: string): boolean {
  try {
    return isLocalHostname(new URL(url).hostname);
  } catch {
    return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(url);
  }
}

function isDeployedRuntime(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.VERCEL_URL ||
      process.env.VERCEL_ENV === 'production' ||
      process.env.VERCEL_ENV === 'preview' ||
      process.env.NODE_ENV === 'production'
  );
}

function productionOriginFromEnv(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv && /^https?:\/\//i.test(fromEnv) && !isLocalOrigin(fromEnv)) {
    return stripTrailingSlash(fromEnv);
  }
  return PRODUCTION_ORIGIN;
}

export function resolveAppOrigin(request?: Request): string {
  const production = productionOriginFromEnv();

  if (isDeployedRuntime()) {
    return production;
  }

  if (request) {
    const origin = new URL(request.url).origin;
    if (!isLocalOrigin(origin)) return origin;
    if (process.env.NODE_ENV === 'development') return origin;
  }

  if (fromEnvNonLocal()) return productionOriginFromEnv();

  return 'http://localhost:3000';
}

function fromEnvNonLocal(): boolean {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return Boolean(
    fromEnv && /^https?:\/\//i.test(fromEnv) && !isLocalOrigin(fromEnv)
  );
}

/**
 * Replace any localhost URL embedded in emails or Supabase action links.
 */
export function sanitizeOutboundUrl(url: string, request?: Request): string {
  const canonical = resolveAppOrigin(request).replace(/\/+$/, '');
  if (isLocalOrigin(canonical)) {
    return url;
  }
  return url.replace(LOCAL_ORIGIN_IN_TEXT, canonical);
}

export function buildAppUrl(path: string, request?: Request): string {
  const origin = resolveAppOrigin(request).replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${p}`;
}
