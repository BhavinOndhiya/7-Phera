'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  CalendarHeart,
  CheckCircle2,
  HelpCircle,
  Loader2,
  MapPin,
  QrCode,
  UserX,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateLong } from '@/lib/utils/formatting';
import type { RsvpStatus } from '@/lib/types/database.types';

interface RsvpLookup {
  event: {
    id: string;
    name: string;
    event_date: string;
    venue: string | null;
  };
  guest: {
    id: string;
    full_name: string;
    side: string;
    relation: string | null;
    party_size: number;
    rsvp_status: RsvpStatus;
    rsvp_date: string | null;
  };
}

interface RsvpClientProps {
  eventId: string;
  guestId: string;
}

const CHOICE_CONFIG: {
  status: RsvpStatus;
  label: string;
  sublabel: string;
  icon: typeof CheckCircle2;
  className: string;
}[] = [
  {
    status: 'accepted',
    label: "Yes, I'll be there",
    sublabel: 'We cannot wait to celebrate with you',
    icon: CheckCircle2,
    className:
      'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900',
  },
  {
    status: 'tentative',
    label: 'Maybe',
    sublabel: "I'll confirm closer to the date",
    icon: HelpCircle,
    className: 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900',
  },
  {
    status: 'declined',
    label: "Sorry, can't make it",
    sublabel: 'We will miss you',
    icon: UserX,
    className: 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-900',
  },
];

function statusMessage(status: RsvpStatus): string {
  switch (status) {
    case 'accepted':
      return "You're on the list — we can't wait to see you!";
    case 'declined':
      return "We've noted that you can't join us. Thank you for letting us know.";
    case 'tentative':
      return "We've noted that you might join. Please update us when you can.";
    default:
      return 'Please choose an option below.';
  }
}

export function RsvpClient({ eventId, guestId }: RsvpClientProps) {
  const [data, setData] = useState<RsvpLookup | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    if (!guestId) {
      setLoadError('This invitation link is incomplete. Open the full link from your email.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(
        `/api/rsvp/lookup?eventId=${encodeURIComponent(eventId)}&guestId=${encodeURIComponent(guestId)}`,
        { cache: 'no-store' }
      );
      const json = await res.json();
      if (!res.ok) {
        setLoadError(json.error ?? 'Could not load your invitation');
        setData(null);
        return;
      }
      setData(json);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Network error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [eventId, guestId]);

  useEffect(() => {
    load();
  }, [load]);

  function submitRsvp(rsvpStatus: RsvpStatus) {
    startTransition(async () => {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, guestId, rsvpStatus }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? 'Could not save your RSVP');
        return;
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              guest: {
                ...prev.guest,
                rsvp_status: json.guest.rsvp_status,
                rsvp_date: json.guest.rsvp_date,
              },
            }
          : prev
      );
      toast.success('Thank you — your RSVP is saved');
    });
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          <p>Loading your invitation…</p>
        </CardContent>
      </Card>
    );
  }

  if (loadError || !data) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <p className="font-medium text-rose-900">Invitation not found</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {loadError ??
              'The link may have expired or the guest is not on this event list.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { event, guest } = data;
  const hasResponded =
    guest.rsvp_status === 'accepted' ||
    guest.rsvp_status === 'declined' ||
    guest.rsvp_status === 'tentative';

  return (
    <div className="space-y-5 pb-[env(safe-area-inset-bottom)]">
      <div className="text-center space-y-2">
        <p className="text-[11px] uppercase tracking-[0.3em] text-rose-600 font-semibold">
          You&apos;re invited
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-rose-950">
          {event.name}
        </h1>
        <p className="text-muted-foreground">
          Dear <span className="font-medium text-foreground">{guest.full_name}</span>
        </p>
      </div>

      <Card className="border-rose-100 overflow-hidden">
        <div className="bg-gradient-to-br from-rose-50 via-white to-gold-50 px-5 py-4 space-y-3 border-b border-rose-100">
          <div className="flex items-start gap-3 text-sm">
            <CalendarHeart className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">When</p>
              <p className="text-muted-foreground">
                {formatDateLong(event.event_date)}
              </p>
            </div>
          </div>
          {event.venue && (
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Where</p>
                <p className="text-muted-foreground">{event.venue}</p>
              </div>
            </div>
          )}
          {guest.party_size > 1 && (
            <div className="flex items-center gap-2 text-sm text-rose-700 font-medium">
              <Users className="h-4 w-4" />
              Party of {guest.party_size}
            </div>
          )}
        </div>

        <CardContent className="p-5 space-y-4">
          {hasResponded ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-4 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-600" />
              <p className="font-medium text-emerald-900 capitalize">
                RSVP: {guest.rsvp_status.replace('_', ' ')}
              </p>
              <p className="text-sm text-emerald-800">
                {statusMessage(guest.rsvp_status)}
              </p>
              {guest.rsvp_date && (
                <p className="text-xs text-emerald-700/80">
                  Saved{' '}
                  {new Date(guest.rsvp_date).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              )}
              <p className="text-xs text-muted-foreground pt-2">
                Changed your mind? Pick a new option below.
              </p>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Please let us know if you can join — it helps us plan seating and
              catering.
            </p>
          )}

          <div className="space-y-2">
            {CHOICE_CONFIG.map(
              ({ status, label, sublabel, icon: Icon, className }) => (
                <button
                  key={status}
                  type="button"
                  disabled={isPending}
                  onClick={() => submitRsvp(status)}
                  className={`w-full flex items-center gap-4 rounded-xl border-2 px-4 py-4 text-left transition-colors disabled:opacity-60 ${className} ${
                    guest.rsvp_status === status
                      ? 'ring-2 ring-offset-2 ring-rose-400'
                      : ''
                  }`}
                >
                  <Icon className="h-6 w-6 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{label}</p>
                    <p className="text-xs opacity-80 mt-0.5">{sublabel}</p>
                  </div>
                  {guest.rsvp_status === status && (
                    <Badge className="bg-white/80 text-inherit border-0 shrink-0">
                      Current
                    </Badge>
                  )}
                </button>
              )
            )}
          </div>

          {isPending && (
            <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </p>
          )}
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
        asChild
      >
        <Link href={`/checkin/${eventId}?guest=${guestId}`}>
          <QrCode className="h-4 w-4 mr-2" />
          View your entry pass
        </Link>
      </Button>

      <p className="text-center text-xs text-muted-foreground px-4 leading-relaxed">
        On the day of the event, open your entry pass and show the QR at the
        entrance.
      </p>
    </div>
  );
}
