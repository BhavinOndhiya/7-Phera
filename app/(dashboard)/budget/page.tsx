'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  CheckCircle2,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { BudgetTable } from '@/components/budget/BudgetTable';
import { Skeleton } from '@/components/ui/skeleton';

const BudgetChart = dynamic(
  () => import('@/components/budget/BudgetChart').then((m) => m.BudgetChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full rounded-xl" />,
  }
);
import { EmptyState } from '@/components/shared/EmptyState';
import { useBudget } from '@/lib/hooks/useBudget';
import { useEvents } from '@/lib/hooks/useEvents';
import { calculateBudgetSummary } from '@/lib/utils/calculations';
import { formatINRShort } from '@/lib/utils/formatting';
import { formatDate } from '@/lib/utils/formatting';

export default function OverallBudgetPage() {
  const { events } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const eventId = selectedEventId === 'all' ? undefined : selectedEventId;
  const { budgetItems, categories } = useBudget(eventId);
  const summary = useMemo(
    () => calculateBudgetSummary(budgetItems),
    [budgetItems]
  );

  if (events.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold">Budget</h1>
        <EmptyState
          icon={Calendar}
          title="Create an event first"
          description="You need at least one event before tracking a budget."
          action={
            <Button asChild className="bg-rose-500 hover:bg-rose-600">
              <Link href="/events/new">
                Create event <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold">Budget</h1>
          <p className="text-muted-foreground mt-1">
            Track expenses across all events.
          </p>
        </div>
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="w-[260px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name} · {formatDate(e.event_date)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total budget"
          value={formatINRShort(summary.totalEstimated)}
          icon={Wallet}
          accent="rose"
        />
        <StatsCard
          title="Total spent"
          value={formatINRShort(summary.totalPaid)}
          icon={TrendingUp}
          description={`${summary.percentSpent.toFixed(0)}% used`}
          accent="emerald"
        />
        <StatsCard
          title="Remaining"
          value={formatINRShort(summary.totalRemaining)}
          icon={Wallet}
          accent="gold"
        />
        <StatsCard
          title="Items paid"
          value={`${summary.paidItemsCount} / ${summary.itemsCount}`}
          icon={CheckCircle2}
          accent="blue"
        />
      </div>

      {budgetItems.length > 0 && (
        <BudgetChart items={budgetItems} categories={categories} />
      )}

      {selectedEventId === 'all' ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Select a specific event to add or edit budget items.
          </CardContent>
        </Card>
      ) : (
        <BudgetTable eventId={selectedEventId} />
      )}
    </div>
  );
}
