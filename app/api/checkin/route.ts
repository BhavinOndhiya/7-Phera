import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Public check-in endpoint used by the guest-facing `/checkin/{eventId}`
 * page. The page is reached by anonymous guests clicking RSVP links from
 * their invitation emails, so this route intentionally does NOT require
 * an authenticated session.
 *
 * Security:
 * - We only ever toggle `attended` / `checked_in_at` on an EXISTING
 *   `event_guests` row matching the provided `(event_id, guest_id)` pair.
 *   No inserts. No edits to other columns. No cross-event leakage.
 * - The `event_guests` row must already exist, which means the planner
 *   explicitly attached this guest to this event. Random UUID guesses
 *   update 0 rows and return 404.
 */
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
