import Link from 'next/link';
import { Heart } from 'lucide-react';
import { resolveGuestFromSearchParams } from '@/lib/utils/guestLinks';
import { RsvpClient } from './RsvpClient';

export const metadata = { title: 'RSVP' };

export const dynamic = 'force-dynamic';

export default function RsvpPage({
  params,
  searchParams,
}: {
  params: { eventId: string };
  searchParams: { guest?: string; token?: string };
}) {
  const guestParams = new URLSearchParams();
  if (searchParams.guest) guestParams.set('guest', searchParams.guest);
  if (searchParams.token) guestParams.set('token', searchParams.token);
  const resolved = resolveGuestFromSearchParams(params.eventId, guestParams);
  const guestId = resolved?.guestId ?? '';

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-gold-50">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
            <span className="font-serif text-xl font-semibold">Saath Phere</span>
          </Link>
          <p className="text-sm text-muted-foreground hidden sm:block">RSVP</p>
        </div>
      </header>
      <div className="container py-8 sm:py-10 max-w-lg mx-auto">
        <RsvpClient eventId={params.eventId} guestId={guestId} />
      </div>
    </main>
  );
}
