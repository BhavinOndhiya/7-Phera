'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Download, Loader2, QrCode, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateLong } from '@/lib/utils/formatting';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface EntryPassClientProps {
  eventId: string;
  guestId: string;
}

interface LookupData {
  event: { name: string; event_date: string; venue: string | null };
  guest: {
    full_name: string;
    side: string;
    relation: string | null;
    party_size: number;
    rsvp_status: string;
  };
}

export function EntryPassClient({ eventId, guestId }: EntryPassClientProps) {
  const [data, setData] = useState<LookupData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/checkin/lookup?eventId=${encodeURIComponent(eventId)}&guestId=${encodeURIComponent(guestId)}`,
        { cache: 'no-store' }
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Pass not found');
        return;
      }
      setData({ event: json.event, guest: json.guest });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [eventId, guestId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-14 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          {error ?? 'Invalid entry pass'}
        </CardContent>
      </Card>
    );
  }

  const { event, guest } = data;
  const qrSrc = `/api/qr/${guestId}?eventId=${encodeURIComponent(eventId)}`;
  const downloadName = `pass-${guest.full_name.replace(/\s+/g, '-')}.png`;

  return (
    <div className="max-w-md mx-auto space-y-4">
      <Card className="overflow-hidden border-rose-200 shadow-lg">
        <div className="bg-gradient-to-br from-rose-500 via-rose-400 to-gold-400 px-6 py-8 text-center text-white">
          <QrCode className="h-8 w-8 mx-auto opacity-90" />
          <p className="text-[10px] uppercase tracking-[0.35em] mt-3 font-semibold opacity-90">
            Entry pass
          </p>
          <h1 className="font-serif text-3xl font-semibold mt-2">
            {guest.full_name}
          </h1>
          <Badge className="mt-3 bg-white/20 text-white border-white/30 capitalize">
            {guest.side}
          </Badge>
        </div>
        <CardContent className="p-5 space-y-4 text-center">
          <div>
            <p className="font-medium">{event.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDateLong(event.event_date)}
            </p>
            {event.venue && (
              <p className="text-sm text-muted-foreground">{event.venue}</p>
            )}
          </div>
          {guest.party_size > 1 && (
            <p className="inline-flex items-center gap-2 text-rose-700 font-semibold">
              <Users className="h-4 w-4" />
              Party of {guest.party_size}
            </p>
          )}
          <div className="rounded-xl border border-rose-100 bg-white p-4 mx-auto max-w-[260px]">
            <p className="text-[10px] uppercase tracking-widest text-rose-600 font-semibold mb-3">
              Scan at the door
            </p>
            <Image
              src={qrSrc}
              alt="Entry pass QR code"
              width={220}
              height={220}
              className="mx-auto rounded-lg"
              unoptimized
            />
          </div>
          <Button variant="outline" size="sm" className="mt-2" asChild>
            <a href={qrSrc} download={downloadName}>
              <Download className="h-4 w-4 mr-2" />
              Save QR image
            </a>
          </Button>
          <p className="text-sm text-muted-foreground leading-relaxed pt-2">
            Show this QR at the entrance. Our team will scan you in.
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            RSVP: {guest.rsvp_status.replace('_', ' ')}
          </p>
        </CardContent>
      </Card>
      <Button variant="outline" className="w-full" asChild>
        <Link href={`/rsvp/${eventId}?guest=${guestId}`}>
          Update your RSVP
        </Link>
      </Button>
    </div>
  );
}
