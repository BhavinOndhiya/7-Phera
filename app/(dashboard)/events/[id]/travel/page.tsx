'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plane, Hotel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { TravelInfoForm } from '@/components/guests/TravelInfoForm';
import { useGuests } from '@/lib/hooks/useGuests';
import { useEvent } from '@/lib/hooks/useEvents';
import { formatDate } from '@/lib/utils/formatting';

export default function TravelPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = params instanceof Promise ? use(params) : params;
  const { event } = useEvent(resolved.id);
  const { guests, loading } = useGuests({ eventId: resolved.id });
  const [_filter, _setFilter] = useState<'all' | 'arriving'>('all');

  useEffect(() => {
    /* placeholder for future filter UX */
  }, []);

  const guestsWithTravel = guests.filter(
    (g) => g.arrival_date || g.hotel_name || g.hotel_address
  );
  const guestsWithoutTravel = guests.filter(
    (g) => !g.arrival_date && !g.hotel_name && !g.hotel_address
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3">
          <Link href={`/events/${resolved.id}`}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to event
          </Link>
        </Button>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold">
          Travel & stay {event ? `· ${event.name}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">
          Track arrival times and hotel bookings for out-of-town guests.
        </p>
      </div>

      {loading && (
        <p className="text-center text-muted-foreground py-6">Loading…</p>
      )}

      {!loading && guests.length === 0 && (
        <EmptyState
          icon={Plane}
          title="No guests yet"
          description="Add guests first, then record their travel details here."
        />
      )}

      {guestsWithTravel.length > 0 && (
        <div>
          <h2 className="font-serif text-xl font-semibold mb-3">
            Travel arranged ({guestsWithTravel.length})
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {guestsWithTravel.map((g) => (
              <Card key={g.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{g.full_name}</p>
                      <Badge variant="secondary" className="text-xs capitalize mt-1">
                        {g.side}
                      </Badge>
                    </div>
                    <TravelInfoForm guest={g} />
                  </div>
                  {g.arrival_date && (
                    <p className="text-sm flex items-center gap-2 text-muted-foreground">
                      <Plane className="h-3.5 w-3.5" /> Arrives{' '}
                      {formatDate(g.arrival_date)}
                    </p>
                  )}
                  {g.hotel_name && (
                    <div className="text-sm">
                      <p className="flex items-center gap-2">
                        <Hotel className="h-3.5 w-3.5 text-muted-foreground" />
                        {g.hotel_name}
                      </p>
                      {g.hotel_address && (
                        <p className="text-xs text-muted-foreground ml-5">
                          {g.hotel_address}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {guestsWithoutTravel.length > 0 && (
        <div>
          <h2 className="font-serif text-xl font-semibold mb-3">
            Needs travel info ({guestsWithoutTravel.length})
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {guestsWithoutTravel.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div>
                  <p className="font-medium text-sm">{g.full_name}</p>
                  <p className="text-xs text-muted-foreground">{g.relation}</p>
                </div>
                <TravelInfoForm guest={g} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
