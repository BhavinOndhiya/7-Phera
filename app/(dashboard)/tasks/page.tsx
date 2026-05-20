'use client';

import Link from 'next/link';
import { ArrowRight, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { useEvents } from '@/lib/hooks/useEvents';
import { useTasks } from '@/lib/hooks/useTasks';
import { formatDate, daysUntil } from '@/lib/utils/formatting';

export default function AllTasksPage() {
  const { events } = useEvents();
  const { tasks } = useTasks();

  if (events.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold">Tasks</h1>
        <EmptyState
          icon={ListChecks}
          title="Create an event first"
          description="Tasks are organised per event."
          action={
            <Button asChild className="bg-rose-500 hover:bg-rose-600">
              <Link href="/events/new">Create event</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const upcoming = tasks
    .filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
    .slice(0, 20);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold">Tasks</h1>
        <p className="text-muted-foreground mt-1">
          All open tasks across your events.
        </p>
      </div>

      {upcoming.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="You're all caught up!"
          description="No open tasks across your events."
        />
      ) : (
        <Card>
          <CardContent className="p-0 divide-y">
            {upcoming.map((task) => {
              const event = events.find((e) => e.id === task.event_id);
              const days = task.due_date ? daysUntil(task.due_date) : null;
              const overdue = days !== null && days < 0;
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{task.title}</p>
                    {event && (
                      <Link
                        href={`/events/${event.id}`}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {event.name}
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {task.due_date && (
                      <Badge
                        variant={overdue ? 'destructive' : 'outline'}
                        className="text-xs"
                      >
                        {overdue
                          ? `${Math.abs(days!)}d overdue`
                          : formatDate(task.due_date)}
                      </Badge>
                    )}
                    {event && (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/events/${event.id}/tasks`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="font-serif text-xl font-semibold mb-3">By event</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}/tasks`}
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
    </div>
  );
}
