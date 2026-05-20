'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { budgetItemSchema } from '@/lib/utils/validation';
import type {
  BudgetItem,
  BudgetCategory,
  Vendor,
  Priority,
} from '@/lib/types/database.types';

interface ExpenseFormProps {
  eventId: string;
  categories: BudgetCategory[];
  vendors: Vendor[];
  initial?: BudgetItem;
  onDone?: () => void;
}

export function ExpenseForm({
  eventId,
  categories,
  vendors,
  initial,
  onDone,
}: ExpenseFormProps) {
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    category_id: initial?.category_id ?? '',
    item_name: initial?.item_name ?? '',
    description: initial?.description ?? '',
    estimated_cost: initial?.estimated_cost?.toString() ?? '',
    actual_cost: initial?.actual_cost?.toString() ?? '',
    priority: (initial?.priority ?? 'medium') as Priority,
    vendor_id: initial?.vendor_id ?? '',
    notes: initial?.notes ?? '',
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = budgetItemSchema.safeParse({
      event_id: eventId,
      category_id: form.category_id || null,
      item_name: form.item_name,
      description: form.description || null,
      estimated_cost: Number(form.estimated_cost) || 0,
      actual_cost: form.actual_cost ? Number(form.actual_cost) : null,
      priority: form.priority,
      vendor_id: form.vendor_id || null,
      notes: form.notes || null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid form');
      return;
    }

    startTransition(async () => {
      if (initial) {
        const { error } = await supabase
          .from('budget_items')
          .update(parsed.data)
          .eq('id', initial.id);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success('Item updated');
      } else {
        const { error } = await supabase.from('budget_items').insert(parsed.data);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success('Item added to budget');
      }
      onDone?.();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="item_name">
            Item name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="item_name"
            value={form.item_name}
            onChange={(e) => setForm({ ...form, item_name: e.target.value })}
            placeholder="e.g. Wedding venue rental"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={form.category_id}
            onValueChange={(v) => setForm({ ...form, category_id: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={form.priority}
            onValueChange={(v) => setForm({ ...form, priority: v as Priority })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated_cost">
            Estimated cost (₹) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="estimated_cost"
            type="number"
            min="0"
            step="0.01"
            value={form.estimated_cost}
            onChange={(e) =>
              setForm({ ...form, estimated_cost: e.target.value })
            }
            required
            placeholder="50000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="actual_cost">Actual cost (₹)</Label>
          <Input
            id="actual_cost"
            type="number"
            min="0"
            step="0.01"
            value={form.actual_cost}
            onChange={(e) => setForm({ ...form, actual_cost: e.target.value })}
            placeholder="If known"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Vendor</Label>
          <Select
            value={form.vendor_id || 'none'}
            onValueChange={(v) =>
              setForm({ ...form, vendor_id: v === 'none' ? '' : v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Link to vendor (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No vendor</SelectItem>
              {vendors.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name} <span className="text-muted-foreground">· {v.category}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        {onDone && (
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isPending}
          className="bg-rose-500 hover:bg-rose-600"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initial ? 'Save changes' : 'Add to budget'}
        </Button>
      </div>
    </form>
  );
}
