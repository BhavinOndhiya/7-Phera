import Link from 'next/link';
import { Heart } from 'lucide-react';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { formatINR } from '@/lib/utils/formatting';

export const metadata = { title: 'Gift registry' };

export const dynamic = 'force-dynamic';

export default async function RegistryPage({
  params,
}: {
  params: { eventId: string };
}) {
  let eventName = 'Our celebration';
  let gifts: {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    image_url: string | null;
    claimed: boolean;
  }[] = [];

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createServiceRoleClient();
    const { data: event } = await admin
      .from('events')
      .select('name')
      .eq('id', params.eventId)
      .maybeSingle();
    if (event) eventName = event.name;

    const { data } = await admin
      .from('gifts')
      .select('id, name, description, price, image_url, claimed_by')
      .eq('event_id', params.eventId)
      .order('created_at', { ascending: false });
    gifts = (data ?? []).map((g) => ({
      ...g,
      claimed: Boolean(g.claimed_by),
    }));
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-gold-50">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center gap-2">
          <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
          <span className="font-serif text-xl font-semibold">Gift registry</span>
        </div>
      </header>
      <div className="container py-10 max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-semibold">{eventName}</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            A wishlist curated by the family. Contact the hosts to reserve a gift.
          </p>
        </div>

        {gifts.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No registry items yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {gifts.map((g) => (
              <li
                key={g.id}
                className="rounded-xl border bg-card p-4 flex gap-4 items-start"
              >
                {g.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={g.image_url}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{g.name}</p>
                  {g.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {g.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2 text-sm">
                    {g.price != null && (
                      <span className="text-rose-700 font-medium">
                        {formatINR(g.price)}
                      </span>
                    )}
                    <span
                      className={
                        g.claimed
                          ? 'text-emerald-700'
                          : 'text-muted-foreground'
                      }
                    >
                      {g.claimed ? 'Reserved' : 'Available'}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="text-rose-600 hover:underline">
            Saath Phere
          </Link>
        </p>
      </div>
    </main>
  );
}
