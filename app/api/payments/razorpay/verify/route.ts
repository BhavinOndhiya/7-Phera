import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json(
      { error: 'Razorpay secret missing in environment' },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const orderId = String(body?.razorpay_order_id ?? '');
  const paymentId = String(body?.razorpay_payment_id ?? '');
  const signature = String(body?.razorpay_signature ?? '');
  const budgetItemId = body?.budgetItemId ? String(body.budgetItemId) : null;
  const amount = Number(body?.amount ?? 0);

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (expected !== signature) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  if (budgetItemId && amount > 0) {
    const { error } = await supabase.from('payments').insert({
      budget_item_id: budgetItemId,
      amount,
      payment_date: new Date().toISOString(),
      payment_method: 'razorpay',
      transaction_id: paymentId,
      created_by: user.id,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, paymentId });
}
