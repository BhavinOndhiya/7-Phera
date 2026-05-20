'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePayments } from '@/lib/hooks/useBudget';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatINR } from '@/lib/utils/formatting';
import type { BudgetItem, PaymentMethod } from '@/lib/types/database.types';

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'razorpay', label: 'Razorpay' },
];

export function PaymentTracker({ item }: { item: BudgetItem }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="text-xs"
      >
        <Receipt className="h-3 w-3 mr-1.5" /> Payments
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payments · {item.item_name}</DialogTitle>
          </DialogHeader>
          <PaymentList item={item} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function PaymentList({ item }: { item: BudgetItem }) {
  const supabase = createClient();
  const { payments, loading } = usePayments(item.id);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'upi' as PaymentMethod,
    transaction_id: '',
    notes: '',
  });

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCost = Number(item.actual_cost ?? item.estimated_cost ?? 0);
  const remaining = Math.max(totalCost - totalPaid, 0);

  function addPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Enter a positive amount');
      return;
    }
    startTransition(async () => {
      const { error } = await supabase.from('payments').insert({
        budget_item_id: item.id,
        amount: Number(form.amount),
        payment_date: form.payment_date,
        payment_method: form.payment_method,
        transaction_id: form.transaction_id || null,
        notes: form.notes || null,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Payment recorded');
      setForm({ ...form, amount: '', transaction_id: '', notes: '' });
    });
  }

  async function deletePayment(id: string) {
    if (!confirm('Delete this payment record?')) return;
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) toast.error(error.message);
    else toast.success('Payment deleted');
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">Total cost</p>
          <p className="font-bold tabular-nums">{formatINR(totalCost)}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-xs text-emerald-700">Paid</p>
          <p className="font-bold tabular-nums text-emerald-700">
            {formatINR(totalPaid)}
          </p>
        </div>
        <div className="rounded-lg bg-rose-50 p-3">
          <p className="text-xs text-rose-700">Remaining</p>
          <p className="font-bold tabular-nums text-rose-700">
            {formatINR(remaining)}
          </p>
        </div>
      </div>

      <form
        onSubmit={addPayment}
        className="space-y-3 rounded-xl border bg-muted/30 p-4"
      >
        <p className="font-medium text-sm">Record a payment</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="amount" className="text-xs">
              Amount (Rs) *
            </Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="payment_date" className="text-xs">
              Date *
            </Label>
            <Input
              id="payment_date"
              type="date"
              value={form.payment_date}
              onChange={(e) =>
                setForm({ ...form, payment_date: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Method</Label>
            <Select
              value={form.payment_method}
              onValueChange={(v) =>
                setForm({ ...form, payment_method: v as PaymentMethod })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="txn" className="text-xs">
              Transaction ID
            </Label>
            <Input
              id="txn"
              value={form.transaction_id}
              onChange={(e) =>
                setForm({ ...form, transaction_id: e.target.value })
              }
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="notes" className="text-xs">
              Notes
            </Label>
            <Textarea
              id="notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <Button
          type="submit"
          className="bg-rose-500 hover:bg-rose-600"
          disabled={isPending}
          size="sm"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Plus className="h-3 w-3 mr-1.5" /> Add payment
        </Button>
      </form>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        <p className="font-medium text-sm">Payment history</p>
        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!loading && payments.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No payments recorded yet.
          </p>
        )}
        {payments.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card"
          >
            <div>
              <p className="font-medium tabular-nums">
                {formatINR(Number(p.amount))}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{formatDate(p.payment_date)}</span>
                {p.payment_method && (
                  <Badge variant="secondary" className="capitalize">
                    {p.payment_method}
                  </Badge>
                )}
              </div>
              {p.notes && (
                <p className="text-xs text-muted-foreground mt-1">{p.notes}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => deletePayment(p.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
