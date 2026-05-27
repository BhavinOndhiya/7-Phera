import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { resolveAppOrigin } from '@/lib/utils/appUrl';

const VALID_OTP_TYPES = new Set<string>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]);

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/dashboard';
  }
  return next;
}

/**
 * Confirms signup / recovery / magiclink without hitting supabase.co/auth/v1/verify
 * (which redirects using Supabase Site URL — often localhost).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const base = resolveAppOrigin(request);
  const next = safeNextPath(searchParams.get('next'));

  const loginWithMessage = (message: string) =>
    NextResponse.redirect(
      `${base}/login?message=${encodeURIComponent(message)}`
    );

  if (!tokenHash || !type || !VALID_OTP_TYPES.has(type)) {
    return loginWithMessage(
      'Invalid or expired link. Request a new confirmation email from the login page.'
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType,
  });

  if (error) {
    console.error('[auth/confirm] verifyOtp failed:', error.message);
    return loginWithMessage(
      'This link has expired or was already used. Request a new email from the login page.'
    );
  }

  return NextResponse.redirect(`${base}${next}`);
}
