import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Wallet,
  Store,
  ListChecks,
  Clock,
  FileText,
  Edit,
  Armchair,
  QrCode,
  Image as ImageIcon,
  Gift,
  Plane,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LiveCountdown } from '@/components/dashboard/LiveCountdown';
import { ShareButtons } from '@/components/shared/ShareButtons';
import {
  formatDateLong,
  formatINRShort,
  daysUntil,
} from '@/lib/utils/formatting';
import { EVENT_TYPES } from '@/lib/constants';
import { calculateBudgetSummary, calculateRsvpStats } from '@/lib/utils/calculations';
import { DeleteEventButton } from './DeleteEventButton';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from('events')
    .select('name')
    .eq('id', params.id)
    .maybeSingle();
  return { title: data?.name ?? 'Event' };
}

export default async function EventDetailPage({
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

  const [budgetResult, eventGuestsResult, tasksResult] = await Promise.all([
    supabase.from('budget_items').select('*').eq('event_id', event.id),
    supabase
      .from('event_guests')
      .select('guest_id')
      .eq('event_id', event.id),
    supabase.from('tasks').select('id, status').eq('event_id', event.id),
  ]);

  const budgetItems = budgetResult.data ?? [];
  const budgetSummary = calculateBudgetSummary(budgetItems);

  const guestIds = (eventGuestsResult.data ?? []).map((g) => g.guest_id);
  const { data: guestsForEvent } =
    guestIds.length > 0
      ? await supabase
          .from('guests')
          .select('rsvp_status')
          .in('id', guestIds)
      : { data: [] as { rsvp_status: string }[] };
  const rsvpStats = calculateRsvpStats(guestsForEvent ?? []);

  const tasks = tasksResult.data ?? [];
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;

  const days = daysUntil(event.event_date);
  const eventType = EVENT_TYPES.find((t) => t.value === event.event_type);

  const SECTIONS = [
    {
      href: `/events/${event.id}/guests`,
      label: 'Guests',
      icon: Users,
      desc: `${rsvpStats.total} added, ${rsvpStats.accepted} confirmed`,
      accent: 'bg-rose-100 text-rose-600',
    },
    {
      href: `/events/${event.id}/budget`,
      label: 'Budget',
      icon: Wallet,
      desc: `${formatINRShort(budgetSummary.totalPaid)} of ${formatINRShort(budgetSummary.totalEstimated)} spent`,
      accent: 'bg-emerald-100 text-emerald-600',
    },
    {
      href: `/events/${event.id}/vendors`,
      label: 'Vendors',
      icon: Store,
      desc: 'Manage booked vendors',
      accent: 'bg-blue-100 text-blue-600',
    },
    {
      href: `/events/${event.id}/tasks`,
      label: 'Tasks',
      icon: ListChecks,
      desc: `${completedTasks} of ${tasks.length} completed`,
      accent: 'bg-gold-100 text-gold-700',
    },
    {
      href: `/events/${event.id}/timeline`,
      label: 'Timeline',
      icon: Clock,
      desc: 'Day-of schedule',
      accent: 'bg-purple-100 text-purple-600',
    },
    {
      href: `/events/${event.id}/documents`,
      label: 'Documents',
      icon: FileText,
      desc: 'Contracts, invoices, files',
      accent: 'bg-slate-100 text-slate-700',
    },
    {
      href: `/events/${event.id}/seating`,
      label: 'Seating',
      icon: Armchair,
      desc: 'Plan tables & seating',
      accent: 'bg-amber-100 text-amber-700',
    },
    {
      href: `/events/${event.id}/gallery`,
      label: 'Gallery',
      icon: ImageIcon,
      desc: 'Photos & memories',
      accent: 'bg-pink-100 text-pink-700',
    },
    {
      href: `/events/${event.id}/gifts`,
      label: 'Gifts',
      icon: Gift,
      desc: 'Wishlist & claims',
      accent: 'bg-indigo-100 text-indigo-700',
    },
    {
      href: `/events/${event.id}/travel`,
      label: 'Travel & stay',
      icon: Plane,
      desc: 'Arrivals and hotels',
      accent: 'bg-cyan-100 text-cyan-700',
    },
    {
      href: '/scan',
      label: 'QR scanner',
      icon: QrCode,
      desc: 'Open check-in page',
      accent: 'bg-teal-100 text-teal-700',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3">
          <Link href="/events">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to events
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {eventType && (
                <Badge variant="secondary" className="capitalize">
                  {eventType.label}
                </Badge>
              )}
              {days >= 0 && days <= 30 && (
                <Badge className="bg-rose-500">{days === 0 ? 'Today' : `${days} days to go`}</Badge>
              )}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold">
              {event.name}
            </h1>
            {event.theme_name && (
              <p className="text-muted-foreground mt-1">
                Theme: {event.theme_name}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/events/${event.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Link>
              </Button>
              <DeleteEventButton id={event.id} />
            </div>
            <ShareButtons
              url={`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/events/${event.id}`}
              title={event.name}
              text={`You're invited to ${event.name}!`}
            />
          </div>
        </div>
      </div>

      {days >= 0 && (
        <LiveCountdown targetDate={event.event_date} eventName={event.name} />
      )}

      <Card>
        <CardContent className="p-6 grid sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-rose-500 mt-0.5" />
              <div>
                <p className="font-medium">When</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateLong(event.event_date)}
                </p>
              </div>
            </div>
            {event.venue && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-rose-500 mt-0.5" />
                <div>
                  <p className="font-medium">{event.venue}</p>
                  {event.venue_address && (
                    <p className="text-sm text-muted-foreground">
                      {event.venue_address}
                    </p>
                  )}
                </div>
              </div>
            )}
            {event.estimated_guests ? (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-rose-500 mt-0.5" />
                <div>
                  <p className="font-medium">Estimated guests</p>
                  <p className="text-sm text-muted-foreground">
                    {event.estimated_guests}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {event.theme_colors && event.theme_colors.length > 0 && (
            <div>
              <p className="font-medium mb-3">Theme palette</p>
              <div className="flex gap-2">
                {event.theme_colors.map((color, i) => (
                  <div key={i} className="text-center">
                    <div
                      className="h-14 w-14 rounded-lg ring-1 ring-black/5 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {color}
                    </p>
                  </div>
                ))}
              </div>
              {event.theme_description && (
                <p className="text-sm text-muted-foreground mt-3">
                  {event.theme_description}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {event.notes && (
        <Card>
          <CardContent className="p-6">
            <p className="font-medium mb-2">Notes</p>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {event.notes}
            </p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="font-serif text-xl font-semibold mb-4">Manage</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="group flex items-start gap-4 p-5 rounded-xl border bg-card hover:border-rose-200 hover:shadow-md transition-all"
              >
                <div className={`rounded-xl p-3 ${section.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium group-hover:text-rose-600 transition-colors">
                    {section.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {section.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
