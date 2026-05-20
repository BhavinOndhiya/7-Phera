import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

function renderEmail({
  guestName,
  eventName,
  eventDate,
  venue,
  rsvpUrl,
}: {
  guestName: string;
  eventName: string;
  eventDate: string;
  venue: string;
  rsvpUrl: string;
}) {
  return `
  <div style="font-family: Georgia, serif; max-width: 560px; margin: auto; color: #1f2937;">
    <div style="background: linear-gradient(135deg, #fff1f2 0%, #fdf6e3 100%); padding: 32px; text-align: center; border-radius: 16px;">
      <p style="color: #be185d; letter-spacing: 4px; text-transform: uppercase; font-size: 12px; margin: 0;">You're invited</p>
      <h1 style="font-size: 36px; margin: 12px 0 6px; color: #9f1239;">${eventName}</h1>
      <p style="color: #6b7280; margin: 0;">${eventDate}</p>
      ${venue ? `<p style="color: #6b7280; margin: 4px 0 0;">${venue}</p>` : ''}
    </div>
    <div style="padding: 28px 4px;">
      <p>Dear ${guestName},</p>
      <p>We would be honoured by your presence on this special day.</p>
      <p>Please let us know if you can join us:</p>
      <p style="text-align: center; margin: 28px 0;">
        <a href="${rsvpUrl}" style="display: inline-block; background: #fb2e63; color: white; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-family: sans-serif; font-weight: 600;">RSVP now</a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">With love,<br/>The wedding family</p>
    </div>
  </div>`;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Missing RESEND_API_KEY in environment' },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const eventId = String(body?.eventId ?? '');
  const guestIds: string[] = Array.isArray(body?.guestIds) ? body.guestIds : [];

  if (!eventId || guestIds.length === 0) {
    return NextResponse.json(
      { error: 'eventId and guestIds[] required' },
      { status: 400 }
    );
  }

  const [{ data: event }, { data: guests }] = await Promise.all([
    supabase
      .from('events')
      .select('name, event_date, venue')
      .eq('id', eventId)
      .maybeSingle(),
    supabase
      .from('guests')
      .select('id, full_name, email')
      .in('id', guestIds),
  ]);

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const fromAddress =
    process.env.RESEND_FROM ?? 'Saath Phere <invitations@resend.dev>';

  const sent: string[] = [];
  const failed: { guestId: string; reason: string }[] = [];

  for (const guest of guests ?? []) {
    if (!guest.email) {
      failed.push({ guestId: guest.id, reason: 'No email' });
      continue;
    }
    try {
      await resend.emails.send({
        from: fromAddress,
        to: guest.email,
        subject: `You're invited: ${event.name}`,
        html: renderEmail({
          guestName: guest.full_name,
          eventName: event.name,
          eventDate: new Date(event.event_date).toLocaleDateString('en-IN', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }),
          venue: event.venue ?? '',
          rsvpUrl: `${origin}/checkin/${eventId}?guest=${guest.id}`,
        }),
      });
      await supabase
        .from('guests')
        .update({ invitation_status: 'sent' })
        .eq('id', guest.id);
      sent.push(guest.id);
    } catch (e) {
      failed.push({
        guestId: guest.id,
        reason: e instanceof Error ? e.message : 'unknown',
      });
    }
  }

  return NextResponse.json({ sent, failed });
}
