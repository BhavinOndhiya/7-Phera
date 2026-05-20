import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
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

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json(
      { error: 'Razorpay keys missing in environment' },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const amount = Number(body?.amount ?? 0);
  const budgetItemId: string | null = body?.budgetItemId ?? null;

  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: 'amount (in rupees) required' },
      { status: 400 }
    );
  }

  try {
    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const order = await rzp.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        budgetItemId: budgetItemId ?? '',
        userId: user.id,
      },
    });
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Order failed' },
      { status: 500 }
    );
  }
}
