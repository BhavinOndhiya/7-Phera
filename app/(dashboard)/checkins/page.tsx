'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ScanLine, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckinGuestList } from '@/components/guests/CheckinGuestList';
import { AttendanceTracker } from '@/components/guests/AttendanceTracker';
import { useEvents } from '@/lib/hooks/useEvents';
import { useGuests } from '@/lib/hooks/useGuests';

export default function CheckinsPage() {
  const searchParams = useSearchParams();
  const { events, loading: eventsLoading } = useEvents();
  const [eventId, setEventId] = useState<string>('');

  useEffect(() => {
    const fromUrl = searchParams.get('event');
    if (fromUrl) setEventId(fromUrl);
  }, [searchParams]);

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) =>
          new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      ),
    [events]
  );

  const effectiveEventId = eventId || sortedEvents[0]?.id || '';
  const { guests, attendance } = useGuests({
    eventId: effectiveEventId || undefined,
  });

  const selectedEvent = sortedEvents.find((e) => e.id === effectiveEventId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold flex items-center gap-2">
            <UserCheck className="h-8 w-8 text-rose-500" />
            Check-ins
          </h1>
          <p className="text-muted-foreground mt-1">
            Live list of guests who have arrived — updates without refreshing.
          </p>
        </div>
        <Button
          asChild
          className="bg-rose-500 hover:bg-rose-600 shrink-0"
        >
          <Link href="/scan">
            <ScanLine className="h-4 w-4 mr-2" />
            Open scanner
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5 min-w-[220px]">
          <label className="text-sm font-medium">Event</label>
          <Select
            value={effectiveEventId}
            onValueChange={setEventId}
            disabled={eventsLoading || sortedEvents.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select event…" />
            </SelectTrigger>
            <SelectContent>
              {sortedEvents.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedEvent && (
          <p className="text-sm text-muted-foreground pb-2">
            {selectedEvent.venue ? `${selectedEvent.venue} · ` : ''}
            {new Date(selectedEvent.event_date).toLocaleDateString('en-IN', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
      </div>

      {sortedEvents.length === 0 && !eventsLoading ? (
        <p className="text-muted-foreground">
          Create an event first, then check guests in at the door.
        </p>
      ) : effectiveEventId ? (
        <>
          <AttendanceTracker guests={guests} attendance={attendance} />
          <CheckinGuestList eventId={effectiveEventId} />
        </>
      ) : null}
    </div>
  );
}
