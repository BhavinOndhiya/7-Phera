import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { RsvpStatus } from '@/lib/types/database.types';
import { clientIp, rateLimit } from '@/lib/utils/rateLimit';

export const runtime = 'nodejs';

const ALLOWED: RsvpStatus[] = ['accepted', 'declined', 'tentative'];

/**
 * Public RSVP submission from `/rsvp/{eventId}?guest=...`.
 * Updates per-event RSVP on `event_guests` (and syncs `guests` for legacy views).
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = rateLimit(`rsvp-post:${ip}`, 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Try again shortly.' },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const eventId = typeof body?.eventId === 'string' ? body.eventId : '';
  const guestId = typeof body?.guestId === 'string' ? body.guestId : '';
  const rsvpStatus = body?.rsvpStatus as RsvpStatus | undefined;

  if (!eventId || !guestId || !rsvpStatus) {
    return NextResponse.json(
      { error: 'eventId, guestId and rsvpStatus are required' },
      { status: 400 }
    );
  }

  if (!ALLOWED.includes(rsvpStatus)) {
    return NextResponse.json(
      { error: 'rsvpStatus must be accepted, declined, or tentative' },
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

  const { data: eg } = await admin
    .from('event_guests')
    .select('event_id')
    .eq('event_id', eventId)
    .eq('guest_id', guestId)
    .maybeSingle();

  if (!eg) {
    return NextResponse.json(
      { error: 'This guest is not invited to this event' },
      { status: 404 }
    );
  }

  const now = new Date().toISOString();

  const { error: egError } = await admin
    .from('event_guests')
    .update({ rsvp_status: rsvpStatus, rsvp_date: now })
    .eq('event_id', eventId)
    .eq('guest_id', guestId);

  if (egError) {
    console.error('[rsvp] event_guests update failed', { eventId, guestId, egError });
    return NextResponse.json({ error: egError.message }, { status: 500 });
  }

  const { data: guest, error } = await admin
    .from('guests')
    .update({ rsvp_status: rsvpStatus, rsvp_date: now })
    .eq('id', guestId)
    .select('id, full_name, rsvp_status, rsvp_date')
    .maybeSingle();

  if (error) {
    console.error('[rsvp] guests sync failed', { eventId, guestId, error });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!guest) {
    return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    guest: { ...guest, rsvp_status: rsvpStatus, rsvp_date: now },
  });
}
