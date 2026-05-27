'use client';

import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExpenseForm } from './ExpenseForm';
import { PaymentTracker } from './PaymentTracker';
import { useBudget } from '@/lib/hooks/useBudget';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { formatINR, formatINRShort } from '@/lib/utils/formatting';
import { PAYMENT_STATUSES, PRIORITIES } from '@/lib/constants';
import { calculateCategoryBreakdown } from '@/lib/utils/calculations';
import type { BudgetItem } from '@/lib/types/database.types';

export function BudgetTable({ eventId }: { eventId: string }) {
  const { budgetItems, categories, vendors, deleteItem } = useBudget(eventId);
  const { confirm } = useConfirm();
  const { can } = useWorkspace();
  const canCreate = can('create_budget');
  const canEdit = can('edit_budget');
  const canDelete = can('delete_budget');
  const [addOpen, setAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  const grouped = useMemo(() => {
    return categories.map((cat) => ({
      category: cat,
      items: budgetItems.filter((i) => i.category_id === cat.id),
    }));
  }, [budgetItems, categories]);

  const uncategorised = budgetItems.filter((i) => !i.category_id);
  const breakdown = calculateCategoryBreakdown(budgetItems, categories);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold">Budget items</h2>
        {canCreate && (
          <Button
            className="bg-rose-500 hover:bg-rose-600"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> Add item
          </Button>
        )}
      </div>

      {budgetItems.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No budget items yet.</p>
            {canCreate && (
              <Button
                className="mt-4 bg-rose-500 hover:bg-rose-600"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" /> Add your first item
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {grouped.map(({ category, items }) => {
        if (items.length === 0) return null;
        const breakdownData = breakdown.find((b) => b.categoryId === category.id);
        return (
          <Card key={category.id}>
            <CardContent className="p-0">
              <div className="p-4 border-b bg-muted/30">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium">{category.name}</h3>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {formatINRShort(breakdownData?.spent ?? 0)} /{' '}
                    {formatINRShort(breakdownData?.budget ?? 0)}
                  </span>
                </div>
                {breakdownData && (
                  <Progress
                    value={breakdownData.percent}
                    className="h-1.5 mt-2"
                    indicatorClassName="bg-rose-500"
                  />
                )}
              </div>
              <div className="divide-y">
                {items.map((item) => (
                  <BudgetRow
                    key={item.id}
                    item={item}
                    vendorName={
                      vendors.find((v) => v.id === item.vendor_id)?.name
                    }
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onEdit={() => setEditingItem(item)}
                    onDelete={async () => {
                      const ok = await confirm({
                        title: 'Delete expense',
                        description: `Delete "${item.item_name}"? This cannot be undone.`,
                        confirmLabel: 'Delete',
                        variant: 'destructive',
                      });
                      if (ok) await deleteItem(item.id);
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {uncategorised.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b bg-muted/30">
              <h3 className="font-medium">Uncategorised</h3>
            </div>
            <div className="divide-y">
              {uncategorised.map((item) => (
                <BudgetRow
                  key={item.id}
                  item={item}
                  vendorName={
                    vendors.find((v) => v.id === item.vendor_id)?.name
                  }
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={() => setEditingItem(item)}
                  onDelete={async () => {
                    const ok = await confirm({
                      title: 'Delete expense',
                      description: `Delete "${item.item_name}"? This cannot be undone.`,
                      confirmLabel: 'Delete',
                      variant: 'destructive',
                    });
                    if (ok) await deleteItem(item.id);
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add budget item</DialogTitle>
          </DialogHeader>
          <ExpenseForm
            eventId={eventId}
            categories={categories}
            vendors={vendors}
            onDone={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingItem)}
        onOpenChange={(o) => !o && setEditingItem(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit budget item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <ExpenseForm
              eventId={eventId}
              categories={categories}
              vendors={vendors}
              initial={editingItem}
              onDone={() => setEditingItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BudgetRow({
  item,
  vendorName,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  item: BudgetItem;
  vendorName?: string;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = PAYMENT_STATUSES.find((s) => s.value === item.payment_status);
  const priority = PRIORITIES.find((p) => p.value === item.priority);
  const cost = Number(item.actual_cost ?? item.estimated_cost ?? 0);

  return (
    <div className="flex items-center justify-between p-4 gap-3 hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.item_name}</p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {priority && (
            <Badge variant="outline" className={priority.color}>
              {priority.label}
            </Badge>
          )}
          {status && (
            <Badge variant="outline" className={status.color}>
              {status.label}
            </Badge>
          )}
          {vendorName && (
            <span className="text-xs text-muted-foreground truncate">
              {vendorName}
            </span>
          )}
        </div>
      </div>

      <div className="text-right">
        <p className="font-medium tabular-nums">{formatINR(cost)}</p>
        {Number(item.paid_amount ?? 0) > 0 && (
          <p className="text-xs text-emerald-600 tabular-nums">
            {formatINR(Number(item.paid_amount))} paid
          </p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <PaymentTracker item={item} />
        {(canEdit || canDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
