import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { canStaffManageEvent, requireStaffSession } from '@/lib/auth/staffAccess';

export const runtime = 'nodejs';

/** Staff-only check-in toggle for venue scanner and staff check-in UI. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const eventId = typeof body?.eventId === 'string' ? body.eventId : '';
  const guestId = typeof body?.guestId === 'string' ? body.guestId : '';
  const attended =
    typeof body?.attended === 'boolean' ? body.attended : undefined;

  if (!eventId || !guestId || attended === undefined) {
    return NextResponse.json(
      { error: 'eventId, guestId and attended are required' },
      { status: 400 }
    );
  }

  const session = await requireStaffSession();
  if ('error' in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const allowed = await canStaffManageEvent(session.userId, eventId);
  if (!allowed) {
    return NextResponse.json({ error: 'Not allowed for this event' }, { status: 403 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    );
  }

  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from('event_guests')
    .update({
      attended,
      checked_in_at: attended ? new Date().toISOString() : null,
    })
    .eq('event_id', eventId)
    .eq('guest_id', guestId)
    .select('event_id, guest_id, attended, checked_in_at')
    .maybeSingle();

  if (error) {
    console.error('[checkin] update failed', { eventId, guestId, error });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Guest is not invited to this event' },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, eventGuest: data });
}
