'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileDown, ScanLine, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GuestTable } from '@/components/guests/GuestTable';
import { RSVPTracker } from '@/components/guests/RSVPTracker';
import { AttendanceTracker } from '@/components/guests/AttendanceTracker';
import { InvitationActions } from '@/components/guests/InvitationActions';
import { useGuests } from '@/lib/hooks/useGuests';
import { useEvent } from '@/lib/hooks/useEvents';

export default function EventGuestsPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams =
    params instanceof Promise ? use(params) : params;
  const { event } = useEvent(resolvedParams.id);
  const { guests, attendance } = useGuests({ eventId: resolvedParams.id });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3">
            <Link href={`/events/${resolvedParams.id}`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to event
            </Link>
          </Button>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold">
            Guests {event ? `· ${event.name}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage who&apos;s invited to this event.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {event && <InvitationActions event={event} guests={guests} />}
          <Button asChild variant="outline">
            <Link href={`/checkins?event=${resolvedParams.id}`}>
              <UserCheck className="h-4 w-4 mr-2" />
              Who&apos;s here
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-rose-200 text-rose-700 hover:bg-rose-50"
          >
            <Link href="/scan">
              <ScanLine className="h-4 w-4 mr-2" />
              Scan at door
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a
              href={`/api/export/guests?eventId=${resolvedParams.id}`}
              target="_blank"
              rel="noreferrer"
            >
              <FileDown className="h-4 w-4 mr-2" /> Export PDF
            </a>
          </Button>
        </div>
      </div>

      <RSVPTracker guests={guests} />
      <AttendanceTracker guests={guests} attendance={attendance} />

      <GuestTable eventId={resolvedParams.id} eventName={event?.name} />
    </div>
  );
}
