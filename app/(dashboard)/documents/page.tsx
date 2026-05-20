'use client';

import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { useEvents } from '@/lib/hooks/useEvents';
import { formatDate } from '@/lib/utils/formatting';

export default function AllDocumentsPage() {
  const { events } = useEvents();

  if (events.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold">
          Documents
        </h1>
        <EmptyState
          icon={FileText}
          title="No events yet"
          description="Documents are organised per event."
          action={
            <Button asChild className="bg-rose-500 hover:bg-rose-600">
              <Link href="/events/new">Create event</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold">
          Documents
        </h1>
        <p className="text-muted-foreground mt-1">
          Pick an event to view its files.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}/documents`}
            className="group flex items-center justify-between p-4 rounded-xl border bg-card hover:border-rose-200 hover:shadow-sm transition-all"
          >
            <div>
              <p className="font-medium">{event.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(event.event_date)}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-rose-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
