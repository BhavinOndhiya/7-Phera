import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

interface Recommendation {
  category: string;
  percent: number;
  amount: number;
  rationale: string;
}

const FALLBACK: Record<string, { percent: number; rationale: string }[]> = {
  wedding: [
    { percent: 35, rationale: 'Venue & catering for the main reception' },
    { percent: 12, rationale: 'Photography & videography to capture memories' },
    { percent: 15, rationale: 'Outfits and jewellery for bride & groom' },
    { percent: 8, rationale: 'Decor, mandap and floral arrangements' },
    { percent: 8, rationale: 'Wedding planner / coordinator' },
    { percent: 6, rationale: 'Music, DJ and entertainment' },
    { percent: 5, rationale: 'Transportation for family and guests' },
    { percent: 4, rationale: 'Invitations and printed stationery' },
    { percent: 4, rationale: 'Mehendi, beauty and hair services' },
    { percent: 3, rationale: 'Buffer & miscellaneous extras' },
  ],
};

function fallback(eventType: string, totalBudget: number): Recommendation[] {
  const breakdown = FALLBACK[eventType] ?? FALLBACK.wedding;
  return breakdown.map((b) => ({
    category: b.rationale.split(' ')[0],
    percent: b.percent,
    amount: Math.round((totalBudget * b.percent) / 100),
    rationale: b.rationale,
  }));
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const eventType: string = body?.eventType ?? 'wedding';
  const totalBudget: number = Number(body?.totalBudget ?? 0);
  const guestCount: number = Number(body?.guestCount ?? 100);

  if (!totalBudget || totalBudget <= 0) {
    return NextResponse.json(
      { error: 'totalBudget must be > 0' },
      { status: 400 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      recommendations: fallback(eventType, totalBudget),
      source: 'fallback',
    });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an Indian wedding budget consultant. Respond ONLY with valid JSON: an object with key "recommendations" (array of 8-12 items). Each item has: category (string, like "Venue & Catering"), percent (number 0-100, all should sum ~100), amount (number rupees), rationale (short string, 1 line).',
        },
        {
          role: 'user',
          content: `Event type: ${eventType}. Total budget: ₹${totalBudget.toLocaleString('en-IN')}. Estimated guests: ${guestCount}. Suggest a category-wise allocation appropriate for an Indian wedding context.`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);
    const recommendations = (parsed.recommendations ?? []) as Recommendation[];
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      throw new Error('Empty response');
    }
    return NextResponse.json({ recommendations, source: 'openai' });
  } catch (e) {
    return NextResponse.json({
      recommendations: fallback(eventType, totalBudget),
      source: 'fallback',
      error: e instanceof Error ? e.message : 'AI failed',
    });
  }
}
