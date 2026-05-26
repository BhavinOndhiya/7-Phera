'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Camera,
  AlertTriangle,
  RotateCcw,
  Users,
  Ticket,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateLong } from '@/lib/utils/formatting';
import { parseGuestLinkUrl } from '@/lib/utils/guestLinks';

interface LookupResponse {
  event: {
    id: string;
    name: string;
    event_date: string;
    venue: string | null;
  };
  guest: {
    id: string;
    full_name: string;
    side: string;
    relation: string | null;
    party_size: number;
    invitation_status: string;
    rsvp_status: string;
  };
  alreadyAttended: boolean;
  checkedInAt: string | null;
}

type Mode = 'idle' | 'scanning' | 'looking_up' | 'result' | 'checking_in' | 'error';

export function ScanClient() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<unknown>(null);
  const [mode, setMode] = useState<Mode>('idle');
  const [lookup, setLookup] = useState<LookupResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const stopScanner = useCallback(async () => {
    const s = scannerRef.current as { stop?: () => Promise<void> } | null;
    if (s?.stop) {
      try {
        await s.stop();
      } catch {
        /* ignore */
      }
    }
    scannerRef.current = null;
  }, []);

  const handleDecoded = useCallback(
    async (raw: string) => {
      const parsed = parseGuestLinkUrl(raw);
      if (!parsed) {
        toast.error("That QR doesn't look like a Saath Phere invitation");
        return;
      }
      await stopScanner();
      setMode('looking_up');
      try {
        const res = await fetch(
          `/api/checkin/lookup?eventId=${encodeURIComponent(parsed.eventId)}&guestId=${encodeURIComponent(parsed.guestId)}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error ?? 'Lookup failed');
          setMode('error');
          return;
        }
        setLookup(data);
        setMode('result');
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : 'Network error');
        setMode('error');
      }
    },
    [stopScanner]
  );

  const startScanning = useCallback(async () => {
    setErrorMsg('');
    setLookup(null);
    setMode('scanning');
    try {
      const { default: QrScanner } = await import('qr-scanner');
      if (!videoRef.current) return;
      const s = new QrScanner(
        videoRef.current,
        (result) => {
          handleDecoded(result.data);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
          returnDetailedScanResult: true,
        }
      );
      scannerRef.current = s;
      await s.start();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Camera unavailable';
      setErrorMsg(
        msg.includes('Permission')
          ? 'Camera permission denied. Allow camera access and try again.'
          : msg
      );
      setMode('error');
    }
  }, [handleDecoded]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const checkIn = useCallback(async () => {
    if (!lookup) return;
    setMode('checking_in');
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: lookup.event.id,
          guestId: lookup.guest.id,
          attended: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Check-in failed');
        setMode('result');
        return;
      }
      toast.success(`${lookup.guest.full_name} checked in`);
      setLookup({ ...lookup, alreadyAttended: true });
      setMode('result');
      window.setTimeout(() => {
        startScanning();
      }, 1500);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Network error');
      setMode('result');
    }
  }, [lookup, startScanning]);

  if (mode === 'idle') {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 mb-2">
            <Camera className="h-8 w-8 text-rose-500" />
          </div>
          <h1 className="font-serif text-2xl font-semibold">Venue scanner</h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Scan the QR code on a guest&apos;s invitation to look them up and check
            them in at the door.
          </p>
          <Button
            onClick={startScanning}
            size="lg"
            className="bg-rose-500 hover:bg-rose-600 h-12 px-8 mt-2"
          >
            <Camera className="h-5 w-5 mr-2" />
            Start scanning
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (mode === 'scanning' || mode === 'looking_up') {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative bg-black aspect-square">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {mode === 'looking_up' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                Looking up guest…
              </div>
            )}
          </div>
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Point your camera at the QR on the guest&apos;s invitation
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                stopScanner();
                setMode('idle');
              }}
              className="mt-3"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mode === 'error') {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
            <AlertTriangle className="h-8 w-8 text-rose-600" />
          </div>
          <h2 className="font-serif text-xl font-semibold">Couldn&apos;t scan</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {errorMsg || 'Something went wrong.'}
          </p>
          <Button
            onClick={startScanning}
            size="lg"
            className="bg-rose-500 hover:bg-rose-600 h-12 px-8"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if ((mode === 'result' || mode === 'checking_in') && lookup) {
    const { guest, event, alreadyAttended } = lookup;
    return (
      <div className="space-y-4">
        <Card className="overflow-hidden border-rose-200">
          <div className="bg-gradient-to-br from-rose-50 via-white to-gold-50 px-6 py-6 text-center border-b border-rose-100">
            <p className="text-[11px] uppercase tracking-[0.3em] text-rose-600 font-semibold">
              Guest pass
            </p>
            <h2 className="font-serif text-3xl font-semibold mt-2 text-rose-900">
              {guest.full_name}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className="capitalize">
                {guest.side}
              </Badge>
              {guest.relation && (
                <span className="text-xs text-muted-foreground">
                  {guest.relation}
                </span>
              )}
            </div>
          </div>

          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white border border-rose-100 p-4 text-center">
                <Users className="h-4 w-4 mx-auto text-rose-500" />
                <p className="font-serif text-3xl font-bold text-rose-700 mt-1">
                  {guest.party_size}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                  Party of
                </p>
              </div>
              <div className="rounded-xl bg-white border border-rose-100 p-4 text-center">
                <Ticket className="h-4 w-4 mx-auto text-rose-500" />
                <p className="font-medium text-sm mt-2 capitalize">
                  {guest.rsvp_status.replace('_', ' ')}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                  RSVP
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
              <p className="font-medium">{event.name}</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {formatDateLong(event.event_date)}
                {event.venue ? ` · ${event.venue}` : ''}
              </p>
            </div>

            {guest.rsvp_status === 'declined' && !alreadyAttended && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-center">
                <p className="text-sm font-medium text-amber-900">
                  RSVP: Declined
                </p>
                <p className="text-xs text-amber-800 mt-0.5">
                  They said they cannot attend — check in only if they came
                  anyway.
                </p>
              </div>
            )}

            {alreadyAttended ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-4 text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-600" />
                <p className="font-medium text-emerald-900 mt-2">
                  Already checked in
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  This guest is already inside.
                </p>
              </div>
            ) : (
              <Button
                onClick={checkIn}
                disabled={mode === 'checking_in'}
                size="lg"
                className="w-full bg-rose-500 hover:bg-rose-600 h-14 text-base"
              >
                {mode === 'checking_in' ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Checking in…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Check in {guest.full_name.split(' ')[0]}
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        <Button
          variant="outline"
          size="lg"
          onClick={startScanning}
          className="w-full h-12"
        >
          <Camera className="h-5 w-5 mr-2" />
          Scan next guest
        </Button>
      </div>
    );
  }

  return null;
}
