'use client';

import { GuestTable } from '@/components/guests/GuestTable';
import { RSVPTracker } from '@/components/guests/RSVPTracker';
import { useGuests } from '@/lib/hooks/useGuests';

export default function AllGuestsPage() {
  const { guests } = useGuests();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold">All guests</h1>
        <p className="text-muted-foreground mt-1">
          Manage your entire guest list across all events.
        </p>
      </div>

      <RSVPTracker guests={guests} />

      <GuestTable />
    </div>
  );
}
