import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { resolveAppOrigin } from '@/lib/utils/appUrl';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const email = String(body?.email ?? '').trim();
  const role = (body?.role ?? 'editor') as 'owner' | 'editor' | 'viewer';
  const eventId = body?.eventId ? String(body.eventId) : null;

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        error:
          'Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local to enable invites.',
      },
      { status: 500 }
    );
  }

  const admin = createServiceRoleClient();
  const origin = resolveAppOrigin(request);

  const { data: invite, error: inviteError } = await admin.auth.admin
    .inviteUserByEmail(email, {
      redirectTo: `${origin}/dashboard`,
    });

  if (inviteError && !inviteError.message.includes('already')) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  if (eventId) {
    const userId = invite?.user?.id;
    if (userId) {
      await supabase
        .from('event_collaborators')
        .upsert(
          {
            event_id: eventId,
            user_id: userId,
            role,
          },
          { onConflict: 'event_id,user_id' }
        );
    }
  }

  return NextResponse.json({ ok: true });
}
