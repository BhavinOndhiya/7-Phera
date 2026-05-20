'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { BudgetItem, BudgetCategory } from '@/lib/types/database.types';

interface Args {
  items: BudgetItem[];
  categories: BudgetCategory[];
  totalBudget?: number;
  enabled?: boolean;
}

export function useBudgetAlerts({
  items,
  categories,
  totalBudget,
  enabled = true,
}: Args) {
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || items.length === 0) return;

    function checkThresholds(key: string, pct: number, name: string) {
      if (pct >= 100) {
        const k = `${key}:100`;
        if (!firedRef.current.has(k)) {
          firedRef.current.add(k);
          toast.error(`${name}: budget exceeded (${pct.toFixed(0)}%)`, {
            duration: 6000,
          });
        }
      } else if (pct >= 80) {
        const k = `${key}:80`;
        if (!firedRef.current.has(k)) {
          firedRef.current.add(k);
          toast.warning(`${name}: ${pct.toFixed(0)}% spent`, { duration: 5000 });
        }
      } else {
        firedRef.current.delete(`${key}:80`);
        firedRef.current.delete(`${key}:100`);
      }
    }

    const totalPaid = items.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
    const totalEst =
      totalBudget ||
      items.reduce((s, i) => s + Number(i.estimated_cost || 0), 0);
    if (totalEst > 0) {
      checkThresholds('overall', (totalPaid / totalEst) * 100, 'Overall budget');
    }

    for (const cat of categories) {
      const catItems = items.filter((i) => i.category_id === cat.id);
      if (catItems.length === 0) continue;
      const paid = catItems.reduce(
        (s, i) => s + Number(i.paid_amount || 0),
        0
      );
      const est = catItems.reduce(
        (s, i) => s + Number(i.estimated_cost || 0),
        0
      );
      if (est === 0) continue;
      checkThresholds(cat.id, (paid / est) * 100, cat.name);
    }
  }, [items, categories, totalBudget, enabled]);
}
