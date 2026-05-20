import type { BudgetItem, BudgetCategory } from '@/lib/types/database.types';

export interface BudgetSummary {
  totalEstimated: number;
  totalActual: number;
  totalPaid: number;
  totalRemaining: number;
  percentSpent: number;
  itemsCount: number;
  paidItemsCount: number;
}

export function calculateBudgetSummary(items: BudgetItem[]): BudgetSummary {
  const totalEstimated = items.reduce(
    (sum, i) => sum + Number(i.estimated_cost ?? 0),
    0
  );
  const totalActual = items.reduce(
    (sum, i) => sum + Number(i.actual_cost ?? i.estimated_cost ?? 0),
    0
  );
  const totalPaid = items.reduce(
    (sum, i) => sum + Number(i.paid_amount ?? 0),
    0
  );
  const totalRemaining = Math.max(totalActual - totalPaid, 0);
  const percentSpent =
    totalActual > 0 ? Math.min((totalPaid / totalActual) * 100, 100) : 0;
  const paidItemsCount = items.filter((i) => i.payment_status === 'paid').length;
  return {
    totalEstimated,
    totalActual,
    totalPaid,
    totalRemaining,
    percentSpent,
    itemsCount: items.length,
    paidItemsCount,
  };
}

export interface CategoryBreakdown {
  categoryId: string;
  name: string;
  budget: number;
  spent: number;
  remaining: number;
  percent: number;
  itemsCount: number;
}

export function calculateCategoryBreakdown(
  items: BudgetItem[],
  categories: BudgetCategory[]
): CategoryBreakdown[] {
  return categories
    .map((category) => {
      const catItems = items.filter((i) => i.category_id === category.id);
      const budget = catItems.reduce(
        (sum, i) => sum + Number(i.estimated_cost ?? 0),
        0
      );
      const spent = catItems.reduce(
        (sum, i) => sum + Number(i.paid_amount ?? 0),
        0
      );
      return {
        categoryId: category.id,
        name: category.name,
        budget,
        spent,
        remaining: Math.max(budget - spent, 0),
        percent: budget > 0 ? Math.min((spent / budget) * 100, 100) : 0,
        itemsCount: catItems.length,
      };
    })
    .filter((c) => c.itemsCount > 0 || c.budget > 0);
}

export interface RsvpStats {
  total: number;
  accepted: number;
  declined: number;
  pending: number;
  tentative: number;
  acceptedPercent: number;
  parties: number;
}

function size(g: { party_size?: number | null }) {
  return Math.max(1, Number(g.party_size ?? 1));
}

export function calculateRsvpStats(
  guests: Array<{ rsvp_status: string; party_size?: number | null }>
): RsvpStats {
  const sumWhere = (predicate: (s: string) => boolean) =>
    guests.filter((g) => predicate(g.rsvp_status)).reduce((s, g) => s + size(g), 0);

  const total = guests.reduce((s, g) => s + size(g), 0);
  const accepted = sumWhere((s) => s === 'accepted');
  const declined = sumWhere((s) => s === 'declined');
  const pending = sumWhere((s) => s === 'pending');
  const tentative = sumWhere((s) => s === 'tentative');
  return {
    total,
    accepted,
    declined,
    pending,
    tentative,
    acceptedPercent: total > 0 ? (accepted / total) * 100 : 0,
    parties: guests.length,
  };
}
