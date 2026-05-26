'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGuests } from '@/lib/hooks/useGuests';

function formatCheckInTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CheckinGuestList({ eventId }: { eventId: string }) {
  const { guests, attendance, loading } = useGuests({ eventId });

  const checkedIn = useMemo(() => {
    return guests
      .filter((g) => attendance[g.id]?.attended)
      .sort((a, b) => {
        const ta = attendance[a.id]?.checked_in_at ?? '';
        const tb = attendance[b.id]?.checked_in_at ?? '';
        return tb.localeCompare(ta);
      });
  }, [guests, attendance]);

  const notIn = guests.length - checkedIn.length;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          <span className="font-medium text-emerald-700">{checkedIn.length}</span>{' '}
          checked in ·{' '}
          <span className="font-medium text-foreground">{notIn}</span> still outside
        </span>
        <span className="text-xs">Updates automatically every few seconds</span>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Checked in ({checkedIn.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {checkedIn.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 px-4">
              No guests checked in yet. Use{' '}
              <Link href="/scan" className="text-rose-600 hover:underline">
                QR scanner
              </Link>{' '}
              at the door.
            </p>
          ) : (
            <ul className="divide-y">
              {checkedIn.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 min-h-[56px]"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{g.full_name}</p>
                    <div className="flex flex-wrap gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span className="capitalize">{g.side}</span>
                      {g.relation && <span>{g.relation}</span>}
                      {g.party_size > 1 && (
                        <span className="text-rose-600 font-medium">
                          Party of {g.party_size}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge className="bg-emerald-500 mb-1">In</Badge>
                    <p className="text-[11px] text-muted-foreground">
                      {formatCheckInTime(attendance[g.id]?.checked_in_at ?? null)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Button variant="outline" asChild className="w-full sm:w-auto">
        <Link href={`/events/${eventId}/guests`}>View all guests & RSVPs</Link>
      </Button>
    </div>
  );
}
