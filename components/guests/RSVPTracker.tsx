'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Users,
} from 'lucide-react';
import type { Guest } from '@/lib/types/database.types';
import { calculateRsvpStats } from '@/lib/utils/calculations';

export function RSVPTracker({ guests }: { guests: Guest[] }) {
  const stats = calculateRsvpStats(guests);

  const items = [
    {
      label:
        stats.parties !== stats.total
          ? `Total invited (${stats.parties} entries)`
          : 'Total invited',
      value: stats.total,
      icon: Users,
      color: 'text-foreground',
      bg: 'bg-muted',
    },
    {
      label: 'Accepted',
      value: stats.accepted,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Declined',
      value: stats.declined,
      icon: XCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    {
      label: 'Tentative',
      value: stats.tentative,
      icon: HelpCircle,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  ];

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`${item.bg} rounded-xl p-4 text-center`}
              >
                <Icon className={`h-5 w-5 mx-auto ${item.color}`} />
                <p className="text-2xl font-bold mt-2">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
              </div>
            );
          })}
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">RSVP acceptance rate</span>
            <span className="font-medium">
              {stats.acceptedPercent.toFixed(0)}%
            </span>
          </div>
          <Progress
            value={stats.acceptedPercent}
            indicatorClassName="bg-gradient-to-r from-emerald-500 to-emerald-600"
          />
        </div>
      </CardContent>
    </Card>
  );
}
