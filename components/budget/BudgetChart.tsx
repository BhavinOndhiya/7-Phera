'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatINR, formatINRShort } from '@/lib/utils/formatting';
import { calculateCategoryBreakdown } from '@/lib/utils/calculations';
import type { BudgetItem, BudgetCategory } from '@/lib/types/database.types';

const COLORS = [
  '#fb2e63',
  '#eaaf36',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
];

interface BudgetChartProps {
  items: BudgetItem[];
  categories: BudgetCategory[];
}

export function BudgetChart({ items, categories }: BudgetChartProps) {
  const data = calculateCategoryBreakdown(items, categories);

  if (data.length === 0) return null;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Budget allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="budget"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={100}
                paddingAngle={2}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatINR(value)}
                contentStyle={{
                  borderRadius: '0.5rem',
                  border: '1px solid hsl(var(--border))',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Spending progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
          {data.map((cat, idx) => {
            const colour = COLORS[idx % COLORS.length];
            return (
              <div key={cat.categoryId}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: colour }}
                    />
                    {cat.name}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatINRShort(cat.spent)} / {formatINRShort(cat.budget)}
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${cat.percent}%`,
                      backgroundColor: colour,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
