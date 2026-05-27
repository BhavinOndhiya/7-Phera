import { APP_ORIGIN, sanitizeOutboundUrl } from '@/lib/utils/appUrl';

export type GenerateLinkProperties = {
  action_link?: string;
  hashed_token?: string;
  verification_type?: string;
};

type GenerateLinkPayload = GenerateLinkProperties & {
  properties?: GenerateLinkProperties | null;
};

function pickString(
  obj: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

/** Normalize admin.generateLink() response (shape varies by Supabase version). */
export function normalizeGenerateLinkProps(
  linkData: GenerateLinkPayload | null | undefined
): GenerateLinkProperties {
  if (!linkData || typeof linkData !== 'object') {
    return {};
  }

  const nested = linkData.properties;
  if (nested && typeof nested === 'object') {
    return {
      action_link: nested.action_link,
      hashed_token: nested.hashed_token,
      verification_type: nested.verification_type,
    };
  }

  const flat = linkData as Record<string, unknown>;
  return {
    action_link: pickString(flat, 'action_link', 'actionLink'),
    hashed_token: pickString(flat, 'hashed_token', 'hashedToken'),
    verification_type: pickString(flat, 'verification_type', 'verificationType'),
  };
}

function tokenFromActionLink(actionLink: string): {
  tokenHash: string;
  type: string;
} | null {
  try {
    const parsed = new URL(actionLink);
    const tokenHash =
      parsed.searchParams.get('token_hash') ??
      parsed.searchParams.get('token');
    const type = parsed.searchParams.get('type');
    if (tokenHash) {
      return { tokenHash, type: type ?? 'recovery' };
    }
  } catch {
    // ignore
  }
  return null;
}

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

/**
 * Build email link from generateLink response.
 * @param forcedType — e.g. "recovery" when verification_type is missing
 */
export function emailLinkFromGenerateLink(
  linkData: GenerateLinkPayload | null | undefined,
  nextPath: string,
  forcedType?: string
): string | null {
  const properties = normalizeGenerateLinkProps(linkData);
  const type = properties.verification_type ?? forcedType;
  let tokenHash = properties.hashed_token;

  if (!tokenHash && properties.action_link) {
    const fromAction = tokenFromActionLink(properties.action_link);
    if (fromAction) {
      tokenHash = fromAction.tokenHash;
    }
  }

  if (tokenHash && type) {
    return buildAuthConfirmUrl({ tokenHash, type, nextPath });
  }

  const raw = properties.action_link;
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
