import Link from 'next/link';
import { Plus, Calendar } from 'lucide-react';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/events/EventCard';
import { EmptyState } from '@/components/shared/EmptyState';

export const metadata: Metadata = { title: 'Events' };

export default async function EventsPage() {
  const supabase = createClient();
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  const now = new Date().toISOString().split('T')[0];
  const upcoming = events?.filter((e) => e.event_date >= now) ?? [];
  const past = events?.filter((e) => e.event_date < now) ?? [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold">
            Your events
          </h1>
          <p className="text-muted-foreground mt-1">
            {events?.length ?? 0} {events?.length === 1 ? 'event' : 'events'} planned.
          </p>
        </div>
        <Button asChild className="bg-rose-500 hover:bg-rose-600">
          <Link href="/events/new">
            <Plus className="h-4 w-4 mr-2" /> New event
          </Link>
        </Button>
      </div>

      {(!events || events.length === 0) && (
        <EmptyState
          icon={Calendar}
          title="No events yet"
          description="Start by creating your first event — engagement, mehendi, sangeet, wedding, or reception."
          action={
            <Button asChild className="bg-rose-500 hover:bg-rose-600">
              <Link href="/events/new">
                <Plus className="h-4 w-4 mr-2" /> Create first event
              </Link>
            </Button>
          }
        />
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-semibold mb-4">Upcoming</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-semibold mb-4 text-muted-foreground">
            Past events
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-75">
            {past.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
