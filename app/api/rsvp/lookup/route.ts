import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Public read for the guest RSVP page (`/rsvp/{eventId}?guest=...`).
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
      .select(
        'id, full_name, side, relation, party_size, rsvp_status, rsvp_date, invitation_status'
      )
      .eq('id', guestId)
      .maybeSingle(),
    admin
      .from('event_guests')
      .select('event_id, guest_id')
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

  return NextResponse.json({ event, guest });
}
