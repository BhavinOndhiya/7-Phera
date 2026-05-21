import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { brand, guestInvitation } from '@/lib/emails';
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
  const origin = resolveAppOrigin(request);
  const fromAddress =
    process.env.RESEND_FROM ?? `${brand.name} <invitations@resend.dev>`;
  const replyTo = process.env.RESEND_REPLY_TO?.trim() || undefined;

  const sent: string[] = [];
  const failed: { guestId: string; reason: string }[] = [];

  for (const guest of guests ?? []) {
    if (!guest.email) {
      failed.push({ guestId: guest.id, reason: 'No email' });
      continue;
    }
    try {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: guest.email,
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject: `You're invited: ${event.name}`,
        html: guestInvitation({
          guestName: guest.full_name,
          eventName: event.name,
          eventDate: new Date(event.event_date).toLocaleDateString('en-IN', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }),
          venue: event.venue,
          rsvpUrl: `${origin}/checkin/${eventId}?guest=${guest.id}`,
        }),
      });

      if (error) {
        console.error('[invitations/send] Resend rejected', {
          guestId: guest.id,
          from: fromAddress,
          to: guest.email,
          error,
        });
        failed.push({
          guestId: guest.id,
          reason: `${error.name}: ${error.message}`,
        });
        continue;
      }

      await supabase
        .from('guests')
        .update({ invitation_status: 'sent' })
        .eq('id', guest.id);
      sent.push(guest.id);
      console.log('[invitations/send] sent', {
        guestId: guest.id,
        to: guest.email,
        resendId: data?.id,
      });
    } catch (e) {
      console.error('[invitations/send] network error', {
        guestId: guest.id,
        error: e,
      });
      failed.push({
        guestId: guest.id,
        reason: e instanceof Error ? e.message : 'unknown',
      });
    }
  }

  return NextResponse.json({ sent, failed });
}
