import Link from 'next/link';
import { Heart } from 'lucide-react';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Event, Guest } from '@/lib/types/database.types';
import { CheckinClient } from './CheckinClient';
import { EntryPassClient } from './EntryPassClient';

export const metadata = { title: 'Guest check-in' };

export const dynamic = 'force-dynamic';

interface AttendanceRow {
  guest_id: string;
  attended: boolean;
  checked_in_at: string | null;
}

async function loadCheckinData(eventId: string): Promise<{
  event: Event | null;
  guests: Guest[];
  attendance: AttendanceRow[];
}> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { event: null, guests: [], attendance: [] };
  }

  const admin = createServiceRoleClient();

  const { data: event } = await admin
    .from('events')
    .select('*')
    .eq('id', eventId)
    .maybeSingle();

  if (!event) {
    return { event: null, guests: [], attendance: [] };
  }

  const { data: eg } = await admin
    .from('event_guests')
    .select('guest_id, attended, checked_in_at')
    .eq('event_id', eventId);

  const guestIds = (eg ?? []).map((r) => r.guest_id);
  let guests: Guest[] = [];
  if (guestIds.length > 0) {
    const { data: g } = await admin
      .from('guests')
      .select('*')
      .in('id', guestIds)
      .order('full_name');
    guests = g ?? [];
  }

  return {
    event,
    guests,
    attendance: (eg ?? []) as AttendanceRow[],
  };
}

export default async function CheckinPage({
  params,
  searchParams,
}: {
  params: { eventId: string };
  searchParams: { guest?: string };
}) {
  const guestId = searchParams.guest?.trim();

  if (guestId) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-gold-50">
        <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
              <span className="font-serif text-xl font-semibold">Saath Phere</span>
            </Link>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Entry pass
            </p>
          </div>
        </header>
        <div className="container py-10">
          <EntryPassClient eventId={params.eventId} guestId={guestId} />
        </div>
      </main>
    );
  }

  const { event, guests, attendance } = await loadCheckinData(params.eventId);

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-gold-50">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
            <span className="font-serif text-xl font-semibold">Saath Phere</span>
          </Link>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Staff check-in
          </p>
        </div>
      </header>
      <div className="container py-10">
        <CheckinClient
          eventId={params.eventId}
          event={event}
          guests={guests}
          attendance={attendance}
        />
      </div>
    </main>
  );
}
