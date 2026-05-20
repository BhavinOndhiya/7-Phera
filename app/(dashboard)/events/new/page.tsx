import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EventForm } from '@/components/events/EventForm';

export const metadata: Metadata = { title: 'New event' };

export default function NewEventPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3">
          <Link href="/events">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to events
          </Link>
        </Button>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold">
          Create a new event
        </h1>
        <p className="text-muted-foreground mt-1">
          Add details, pick a theme, and start planning.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <EventForm />
        </CardContent>
      </Card>
    </div>
  );
}
