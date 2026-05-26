'use client';

import { useState, useTransition, useMemo } from 'react';
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
import { formatDateLong } from '@/lib/utils/formatting';
import type { Event, Guest } from '@/lib/types/database.types';

interface AttendanceRow {
  guest_id: string;
  attended: boolean;
  checked_in_at: string | null;
}

interface CheckinClientProps {
  eventId: string;
  event: Event | null;
  guests: Guest[];
  attendance: AttendanceRow[];
}

export function CheckinClient({
  eventId,
  event,
  guests,
  attendance,
}: CheckinClientProps) {
  const [attendedIds, setAttendedIds] = useState<Set<string>>(
    () => new Set(attendance.filter((r) => r.attended).map((r) => r.guest_id))
  );
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  async function setAttendance(guestId: string, attended: boolean): Promise<boolean> {
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ eventId, guestId, attended }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to update check-in');
      return false;
    }
    return true;
  }

  function checkIn(guestId: string) {
    startTransition(async () => {
      const ok = await setAttendance(guestId, true);
      if (!ok) return;
      setAttendedIds((prev) => new Set(prev).add(guestId));
      toast.success('Checked in');
    });
  }

  function uncheck(guestId: string) {
    startTransition(async () => {
      const ok = await setAttendance(guestId, false);
      if (!ok) return;
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
    <div
      className="max-w-2xl mx-auto space-y-4 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="text-center">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold">
          {event.name}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          {formatDateLong(event.event_date)}
        </p>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div className="rounded-lg bg-muted p-3">
              <Users className="h-4 w-4 mx-auto" />
              <p className="text-xl sm:text-2xl font-bold mt-1">{total}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
                Invited
              </p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3">
              <CheckCircle2 className="h-4 w-4 mx-auto text-emerald-600" />
              <p className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">
                {present}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
                Checked in
              </p>
            </div>
            <div className="rounded-lg bg-rose-50 p-3">
              <Users className="h-4 w-4 mx-auto text-rose-600" />
              <p className="text-xl sm:text-2xl font-bold text-rose-700 mt-1">
                {total - present}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
                Pending
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="sticky top-16 z-10 bg-background/95 backdrop-blur border-b py-3 sm:py-4 sm:static sm:bg-transparent sm:backdrop-blur-0 sm:border-b-0">
          <CardTitle className="text-base sm:text-lg flex items-center justify-between gap-2">
            <span>Find guest</span>
            <span className="text-xs font-normal text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? 'match' : 'matches'}
            </span>
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="pl-9 h-12 text-base"
              inputMode="search"
              autoCapitalize="words"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="divide-y">
            {filtered.length === 0 && (
              <p className="text-center py-10 text-muted-foreground">
                {search
                  ? 'No guests match your search.'
                  : 'No guests for this event.'}
              </p>
            )}
            {filtered.map((g) => {
              const isCheckedIn = attendedIds.has(g.id);
              return (
                <div
                  key={g.id}
                  className="flex items-center justify-between gap-3 p-4 min-h-[72px]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{g.full_name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {g.relation && (
                        <span className="text-xs text-muted-foreground">
                          {g.relation}
                        </span>
                      )}
                      <Badge variant="secondary" className="text-xs capitalize">
                        {g.side}
                      </Badge>
                      {g.party_size > 1 && (
                        <span className="text-xs text-rose-600 font-medium">
                          Party of {g.party_size}
                        </span>
                      )}
                    </div>
                  </div>
                  {isCheckedIn ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge className="bg-emerald-500 h-7">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> In
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => uncheck(g.id)}
                        disabled={isPending}
                        className="text-xs h-9"
                      >
                        Undo
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => checkIn(g.id)}
                      disabled={isPending}
                      className="bg-rose-500 hover:bg-rose-600 h-12 px-5 shrink-0"
                    >
                      {isPending && (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      )}
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
