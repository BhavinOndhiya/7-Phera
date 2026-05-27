import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveAppOrigin } from '@/lib/utils/appUrl';

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/dashboard';
  }
  return next;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const base = resolveAppOrigin(request);
  const next = safeNextPath(searchParams.get('next'));

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${base}${next}`);
    }
  }

  return NextResponse.redirect(
    `${base}/login?message=${encodeURIComponent('Could not authenticate')}`
  );
}
