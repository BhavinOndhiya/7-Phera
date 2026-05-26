'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GiftList } from '@/components/gifts/GiftList';
import { useEvent } from '@/lib/hooks/useEvents';

export default function GiftsPage({
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
          Gift registry {event ? `· ${event.name}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">
          Curate a wishlist guests can browse. Share the public link:{' '}
          <a
            href={`/registry/${resolved.id}`}
            target="_blank"
            rel="noreferrer"
            className="text-rose-600 hover:underline"
          >
            /registry/{resolved.id.slice(0, 8)}…
          </a>
        </p>
      </div>

      <GiftList eventId={resolved.id} />
    </div>
  );
}
