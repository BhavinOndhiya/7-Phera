'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Users, UserMinus } from 'lucide-react';
import type { GuestAttendance } from '@/lib/hooks/useGuests';

export function AttendanceTracker({
  guests,
  attendance,
}: {
  guests: { id: string; party_size?: number | null }[];
  attendance: Record<string, GuestAttendance>;
}) {
  const checkedInPeople = guests.reduce((s, g) => {
    if (!attendance[g.id]?.attended) return s;
    return s + Math.max(1, g.party_size ?? 1);
  }, 0);
  const checkedInEntries = guests.filter((g) => attendance[g.id]?.attended).length;
  const pendingEntries = guests.length - checkedInEntries;
  const pct = guests.length > 0 ? (checkedInEntries / guests.length) * 100 : 0;

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-muted rounded-xl p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-foreground" />
            <p className="text-2xl font-bold mt-2">{guests.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Invited entries</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-600" />
            <p className="text-2xl font-bold mt-2 text-emerald-700">
              {checkedInEntries}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Checked in</p>
          </div>
          <div className="bg-rose-50 rounded-xl p-4 text-center">
            <UserMinus className="h-5 w-5 mx-auto text-rose-600" />
            <p className="text-2xl font-bold mt-2 text-rose-700">
              {pendingEntries}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Not yet in</p>
          </div>
          <div className="bg-muted rounded-xl p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-emerald-600" />
            <p className="text-2xl font-bold mt-2">{checkedInPeople}</p>
            <p className="text-xs text-muted-foreground mt-1">People inside</p>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Check-in progress</span>
            <span className="font-medium">{pct.toFixed(0)}%</span>
          </div>
          <Progress
            value={pct}
            indicatorClassName="bg-gradient-to-r from-rose-500 to-emerald-500"
          />
        </div>
      </CardContent>
    </Card>
  );
}
