'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { BudgetItem } from '@/lib/types/database.types';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: () => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject();
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load Razorpay'));
    document.body.appendChild(s);
  });
}

export function RazorpayCheckout({
  item,
  amountRupee,
  onPaid,
}: {
  item: BudgetItem;
  amountRupee: number;
  onPaid?: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function pay() {
    if (amountRupee <= 0) {
      toast.error('Nothing left to pay on this item');
      return;
    }
    startTransition(async () => {
      try {
        await loadRazorpayScript();
        const orderRes = await fetch('/api/payments/razorpay/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amountRupee,
            budgetItemId: item.id,
          }),
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) {
          toast.error(orderData.error ?? 'Could not create order');
          return;
        }

        const keyId =
          orderData.keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!keyId) {
          toast.error('Razorpay key is not configured');
          return;
        }

        const rzp = new window.Razorpay!({
          key: keyId,
          amount: orderData.amount,
          currency: orderData.currency ?? 'INR',
          name: 'Saath Phere',
          description: item.item_name,
          order_id: orderData.orderId,
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            const verifyRes = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                budgetItemId: item.id,
                amount: amountRupee,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              toast.error(verifyData.error ?? 'Payment verification failed');
              return;
            }
            toast.success('Payment recorded via Razorpay');
            onPaid?.();
          },
          theme: { color: '#fb2e63' },
        });
        rzp.open();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Razorpay failed');
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={pay}
      disabled={isPending || amountRupee <= 0}
      className="border-rose-200 text-rose-700"
    >
      {isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
      Pay {amountRupee > 0 ? `₹${amountRupee.toLocaleString('en-IN')}` : ''} via Razorpay
    </Button>
  );
}
