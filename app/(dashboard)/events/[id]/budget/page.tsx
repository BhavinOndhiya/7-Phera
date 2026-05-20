'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  CheckCircle2,
  FileDown,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { BudgetTable } from '@/components/budget/BudgetTable';
import { AIRecommendations } from '@/components/budget/AIRecommendations';
import { Skeleton } from '@/components/ui/skeleton';

const BudgetChart = dynamic(
  () => import('@/components/budget/BudgetChart').then((m) => m.BudgetChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full rounded-xl" />,
  }
);
import { useBudget } from '@/lib/hooks/useBudget';
import { useEvent } from '@/lib/hooks/useEvents';
import { useBudgetAlerts } from '@/lib/hooks/useBudgetAlerts';
import { calculateBudgetSummary } from '@/lib/utils/calculations';
import { formatINRShort } from '@/lib/utils/formatting';

export default function EventBudgetPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = params instanceof Promise ? use(params) : params;
  const { event } = useEvent(resolved.id);
  const { budgetItems, categories } = useBudget(resolved.id);
  const summary = calculateBudgetSummary(budgetItems);
  useBudgetAlerts({ items: budgetItems, categories });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3">
            <Link href={`/events/${resolved.id}`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to event
            </Link>
          </Button>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold">
            Budget {event ? `· ${event.name}` : ''}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {event && <AIRecommendations event={event} />}
          <Button asChild variant="outline">
            <a
              href={`/api/export/budget?eventId=${resolved.id}`}
              target="_blank"
              rel="noreferrer"
            >
              <FileDown className="h-4 w-4 mr-2" /> Export PDF
            </a>
          </Button>
        </div>
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
          title="Items fully paid"
          value={`${summary.paidItemsCount} / ${summary.itemsCount}`}
          icon={CheckCircle2}
          accent="blue"
        />
      </div>

      <BudgetChart items={budgetItems} categories={categories} />

      <BudgetTable eventId={resolved.id} />
    </div>
  );
}
