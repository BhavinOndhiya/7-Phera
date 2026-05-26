import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const checks = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    resend: Boolean(process.env.RESEND_API_KEY),
    resendFrom: Boolean(process.env.RESEND_FROM?.trim()),
    appUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim()),
    guestLinkSecret: Boolean(process.env.GUEST_LINK_SECRET?.trim()),
    razorpay: Boolean(
      process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ),
    openai: Boolean(process.env.OPENAI_API_KEY),
  };

  const requiredOk =
    checks.supabaseUrl && checks.supabaseAnon && checks.supabaseServiceRole;

  return NextResponse.json(
    {
      ok: requiredOk,
      checks,
      notes: [
        'supabaseServiceRole is required for RSVP, check-in, and workspace bootstrap.',
        'resend + resendFrom are required for guest email invitations.',
        'guestLinkSecret enables signed RSVP/pass URLs (recommended in production).',
      ],
    },
    { status: requiredOk ? 200 : 503 }
  );
}
