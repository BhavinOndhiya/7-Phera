import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EventForm } from '@/components/events/EventForm';

export const metadata: Metadata = { title: 'Edit event' };

export default async function EditEventPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!event) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3">
          <Link href={`/events/${event.id}`}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to event
          </Link>
        </Button>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold">
          Edit event
        </h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <EventForm initial={event} />
        </CardContent>
      </Card>
    </div>
  );
}
