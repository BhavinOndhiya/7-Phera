'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface LiveCountdownProps {
  targetDate: string;
  eventName?: string;
}

function diff(target: number) {
  const now = Date.now();
  const ms = Math.max(0, target - now);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const seconds = Math.floor((ms / 1000) % 60);
  return { ms, days, hours, minutes, seconds };
}

export function LiveCountdown({ targetDate, eventName }: LiveCountdownProps) {
  const target = new Date(targetDate).getTime();
  const [time, setTime] = useState(() => diff(target));
  const t = useTranslations('Countdown');

  useEffect(() => {
    const id = setInterval(() => setTime(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (time.ms === 0) {
    return (
      <Card className="bg-gradient-to-br from-rose-50 to-gold-50 border-rose-200">
        <CardContent className="p-6 text-center">
          <Heart className="h-10 w-10 mx-auto text-rose-500 fill-rose-500 mb-2" />
          <p className="font-serif text-2xl font-semibold text-rose-700">
            {t('big_day')}
          </p>
          {eventName && (
            <p className="text-sm text-muted-foreground mt-1">{eventName}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  const units = [
    { label: t('days'), value: time.days },
    { label: t('hours'), value: time.hours },
    { label: t('minutes'), value: time.minutes },
    { label: t('seconds'), value: time.seconds },
  ];

  return (
    <Card className="bg-gradient-to-br from-rose-50 via-white to-gold-50 border-rose-200">
      <CardContent className="p-6">
        <p className="text-center text-xs uppercase tracking-widest text-rose-600 mb-1">
          {t('counting_down')}
        </p>
        <p className="text-center font-serif text-xl font-semibold mb-4">
          {eventName ?? ''}
        </p>
        <div className="grid grid-cols-4 gap-3">
          {units.map((u) => (
            <div
              key={u.label}
              className="rounded-xl bg-white shadow-sm p-3 text-center border border-rose-100"
            >
              <p className="font-serif text-3xl md:text-4xl font-bold text-rose-600 tabular-nums">
                {String(u.value).padStart(2, '0')}
              </p>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
                {u.label}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
