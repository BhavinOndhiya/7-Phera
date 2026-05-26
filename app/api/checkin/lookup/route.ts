import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Public read endpoint used by the venue scanner (`/scan` page and the
 * Capacitor mobile app). Anonymous — anyone scanning a QR off a printed
 * invitation should be able to look it up.
 *
 * Returns guest + event basics plus whether they've already been
 * checked in, so the scanner UI can show "Already inside" instead of
 * letting staff double-check-in the same guest.
 *
 * Query: ?eventId=...&guestId=...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId') ?? '';
  const guestId = searchParams.get('guestId') ?? '';

  if (!eventId || !guestId) {
    return NextResponse.json(
      { error: 'eventId and guestId are required' },
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

  const [{ data: event }, { data: guest }, { data: eg }] = await Promise.all([
    admin
      .from('events')
      .select('id, name, event_date, venue')
      .eq('id', eventId)
      .maybeSingle(),
    admin
      .from('guests')
      .select('id, full_name, side, relation, party_size, invitation_status, rsvp_status')
      .eq('id', guestId)
      .maybeSingle(),
    admin
      .from('event_guests')
      .select('attended, checked_in_at, rsvp_status, rsvp_date')
      .eq('event_id', eventId)
      .eq('guest_id', guestId)
      .maybeSingle(),
  ]);

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }
  if (!guest) {
    return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
  }
  if (!eg) {
    return NextResponse.json(
      { error: 'This guest is not invited to this event' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    event,
    guest: {
      ...guest,
      rsvp_status: eg.rsvp_status ?? guest.rsvp_status,
    },
    alreadyAttended: Boolean(eg.attended),
    checkedInAt: eg.checked_in_at,
  });
}
