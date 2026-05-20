import { Suspense } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { CheckinClient } from './CheckinClient';

export const metadata = { title: 'Guest check-in' };

export default function CheckinPage({
  params,
  searchParams,
}: {
  params: { eventId: string };
  searchParams: { guest?: string };
}) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-gold-50">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
            <span className="font-serif text-xl font-semibold">Saath Phere</span>
          </Link>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Guest check-in
          </p>
        </div>
      </header>
      <div className="container py-10">
        <Suspense fallback={<div className="text-center">Loading…</div>}>
          <CheckinClient
            eventId={params.eventId}
            initialGuestId={searchParams.guest}
          />
        </Suspense>
      </div>
    </main>
  );
}
