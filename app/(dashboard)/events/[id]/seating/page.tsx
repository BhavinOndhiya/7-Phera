'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SeatingPlanner } from '@/components/seating/SeatingPlanner';
import { useEvent } from '@/lib/hooks/useEvents';

export default function SeatingPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = params instanceof Promise ? use(params) : params;
  const { event } = useEvent(resolved.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3">
          <Link href={`/events/${resolved.id}`}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to event
          </Link>
        </Button>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold">
          Seating planner {event ? `· ${event.name}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">
          Drag and drop guests onto tables to plan the seating arrangement.
        </p>
      </div>

      <SeatingPlanner eventId={resolved.id} />
    </div>
  );
}
