import Link from 'next/link';
import {
  Calendar,
  Users,
  Wallet,
  Store,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  CircleAlert,
} from 'lucide-react';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { LiveCountdown } from '@/components/dashboard/LiveCountdown';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatINRShort, formatDate, daysUntil } from '@/lib/utils/formatting';
import { calculateBudgetSummary, calculateRsvpStats } from '@/lib/utils/calculations';
import type { Event, Task, BudgetItem } from '@/lib/types/database.types';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const supabase = createClient();

  const [eventsResult, guestsResult, budgetResult, tasksResult, vendorsResult] =
    await Promise.all([
      supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true }),
      supabase.from('guests').select('rsvp_status, party_size'),
      supabase.from('budget_items').select('*'),
      supabase
        .from('tasks')
        .select('*')
        .neq('status', 'completed')
        .order('due_date', { ascending: true })
        .limit(5),
      supabase.from('vendors').select('id'),
    ]);

  const events = (eventsResult.data ?? []) as Event[];
  const guests = guestsResult.data ?? [];
  const budgetItems = (budgetResult.data ?? []) as BudgetItem[];
  const tasks = (tasksResult.data ?? []) as Task[];
  const vendors = vendorsResult.data ?? [];

  const summary = calculateBudgetSummary(budgetItems);
  const guestStats = calculateRsvpStats(guests);

  const upcomingEvents = events.filter((e) => new Date(e.event_date) >= new Date());
  const nextEvent = upcomingEvents[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold">
            Your Wedding Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s a snapshot of everything happening.
          </p>
        </div>
        <Button asChild className="bg-rose-500 hover:bg-rose-600">
          <Link href="/events/new">
            <Plus className="h-4 w-4 mr-2" /> New event
          </Link>
        </Button>
      </div>

      {nextEvent && (
        <LiveCountdown
          targetDate={nextEvent.event_date}
          startTime={nextEvent.start_time}
          eventName={nextEvent.name}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Events"
          value={events.length}
          icon={Calendar}
          description={`${upcomingEvents.length} upcoming`}
          accent="rose"
        />
        <StatsCard
          title="Guests"
          value={guestStats.total}
          icon={Users}
          description={`${guestStats.accepted} confirmed`}
          accent="gold"
        />
        <StatsCard
          title="Budget"
          value={formatINRShort(summary.totalEstimated)}
          icon={Wallet}
          description={`${formatINRShort(summary.totalPaid)} paid`}
          accent="emerald"
        />
        <StatsCard
          title="Vendors"
          value={vendors.length}
          icon={Store}
          description="Booked so far"
          accent="blue"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Upcoming events</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/events">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No upcoming events"
                description="Create your first event to get started."
                action={
                  <Button asChild>
                    <Link href="/events/new">
                      <Plus className="h-4 w-4 mr-2" /> New event
                    </Link>
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 5).map((event) => {
                  const days = daysUntil(event.event_date);
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:border-rose-200 hover:bg-rose-50/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{event.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(event.event_date)}
                            {event.venue && ` • ${event.venue}`}
                          </p>
                        </div>
                      </div>
                      <Badge variant={days <= 7 ? 'default' : 'secondary'} className={days <= 7 ? 'bg-rose-500' : ''}>
                        {days === 0 ? 'Today' : `${days}d`}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Spent</span>
                <span className="font-medium">
                  {formatINRShort(summary.totalPaid)} / {formatINRShort(summary.totalEstimated)}
                </span>
              </div>
              <Progress
                value={summary.percentSpent}
                indicatorClassName="bg-gradient-to-r from-rose-500 to-gold-500"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {summary.percentSpent.toFixed(0)}% of your budget used
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Items</p>
                <p className="text-xl font-semibold">{summary.itemsCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fully paid</p>
                <p className="text-xl font-semibold">{summary.paidItemsCount}</p>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/budget">
                Open budget <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Tasks to do</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/tasks">
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All caught up!"
              description="You have no pending tasks. Great work."
            />
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const due = task.due_date ? daysUntil(task.due_date) : null;
                const overdue = due !== null && due < 0;
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {overdue ? (
                        <CircleAlert className="h-4 w-4 text-rose-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{task.title}</span>
                    </div>
                    {task.due_date && (
                      <Badge variant={overdue ? 'destructive' : 'outline'}>
                        {overdue
                          ? `${Math.abs(due!)}d overdue`
                          : due === 0
                            ? 'Today'
                            : `${due}d`}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
