'use client';

import { useEffect, useState, useTransition, useMemo } from 'react';
import {
  CheckCircle2,
  Search,
  Loader2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { formatDateLong } from '@/lib/utils/formatting';
import type { Event, Guest } from '@/lib/types/database.types';

interface CheckinClientProps {
  eventId: string;
  initialGuestId?: string;
}

export function CheckinClient({ eventId, initialGuestId }: CheckinClientProps) {
  const supabase = createClient();
  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [attendedIds, setAttendedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ data: ev }, { data: eg }] = await Promise.all([
        supabase.from('events').select('*').eq('id', eventId).maybeSingle(),
        supabase
          .from('event_guests')
          .select('guest_id, attended')
          .eq('event_id', eventId),
      ]);
      if (!mounted) return;
      setEvent(ev);
      const ids = (eg ?? []).map((r) => r.guest_id);
      const attended = new Set(
        (eg ?? []).filter((r) => r.attended).map((r) => r.guest_id)
      );
      setAttendedIds(attended);

      if (ids.length > 0) {
        const { data: g } = await supabase
          .from('guests')
          .select('*')
          .in('id', ids)
          .order('full_name');
        if (mounted) setGuests(g ?? []);
      }
      setLoading(false);

      if (initialGuestId) {
        const found = (eg ?? []).find((r) => r.guest_id === initialGuestId);
        if (found && !found.attended) {
          checkIn(initialGuestId, false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, initialGuestId, supabase]);

  function checkIn(guestId: string, showToast = true) {
    startTransition(async () => {
      const { error } = await supabase
        .from('event_guests')
        .update({
          attended: true,
          checked_in_at: new Date().toISOString(),
        })
        .eq('event_id', eventId)
        .eq('guest_id', guestId);
      if (error) {
        toast.error(error.message);
        return;
      }
      setAttendedIds((prev) => new Set(prev).add(guestId));
      if (showToast) toast.success('Checked in');
    });
  }

  function uncheck(guestId: string) {
    startTransition(async () => {
      const { error } = await supabase
        .from('event_guests')
        .update({ attended: false, checked_in_at: null })
        .eq('event_id', eventId)
        .eq('guest_id', guestId);
      if (error) {
        toast.error(error.message);
        return;
      }
      setAttendedIds((prev) => {
        const next = new Set(prev);
        next.delete(guestId);
        return next;
      });
      toast.success('Check-in undone');
    });
  }

  const filtered = useMemo(() => {
    if (!search) return guests;
    return guests.filter((g) =>
      g.full_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [guests, search]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-rose-500" />
      </div>
    );
  }

  if (!event) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-10 text-center">
          <p>Event not found.</p>
        </CardContent>
      </Card>
    );
  }

  const total = guests.length;
  const present = attendedIds.size;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold">
          {event.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          {formatDateLong(event.event_date)}
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-muted p-3">
              <Users className="h-4 w-4 mx-auto" />
              <p className="text-2xl font-bold mt-1">{total}</p>
              <p className="text-xs text-muted-foreground">Invited</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3">
              <CheckCircle2 className="h-4 w-4 mx-auto text-emerald-600" />
              <p className="text-2xl font-bold text-emerald-700 mt-1">{present}</p>
              <p className="text-xs text-muted-foreground">Checked in</p>
            </div>
            <div className="rounded-lg bg-rose-50 p-3">
              <Users className="h-4 w-4 mx-auto text-rose-600" />
              <p className="text-2xl font-bold text-rose-700 mt-1">
                {total - present}
              </p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Find guest</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="pl-9"
            />
          </div>

          <div className="mt-4 max-h-[60vh] overflow-y-auto divide-y -mx-4">
            {filtered.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                {search ? 'No guests match your search.' : 'No guests for this event.'}
              </p>
            )}
            {filtered.map((g) => {
              const isCheckedIn = attendedIds.has(g.id);
              return (
                <div
                  key={g.id}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <p className="font-medium">{g.full_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {g.relation}
                      </span>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {g.side}
                      </Badge>
                    </div>
                  </div>
                  {isCheckedIn ? (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> In
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => uncheck(g.id)}
                        disabled={isPending}
                        className="text-xs"
                      >
                        Undo
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => checkIn(g.id)}
                      disabled={isPending}
                      size="sm"
                      className="bg-rose-500 hover:bg-rose-600"
                    >
                      Check in
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
