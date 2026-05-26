import Link from 'next/link';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate, daysUntil } from '@/lib/utils/formatting';
import { formatTime12h } from '@/lib/utils/eventSchedule';
import { EVENT_TYPES } from '@/lib/constants';
import type { Event } from '@/lib/types/database.types';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const days = daysUntil(event.event_date);
  const isPast = days < 0;
  const isSoon = days >= 0 && days <= 30;
  const eventType = EVENT_TYPES.find((t) => t.value === event.event_type);
  const colors = event.theme_colors?.slice(0, 4) ?? [
    '#fb2e63',
    '#d8901e',
    '#ffffff',
  ];

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block rounded-2xl border bg-card overflow-hidden hover:border-rose-200 hover:shadow-lg transition-all"
    >
      <div className="h-24 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              colors.length >= 2
                ? `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} ${colors.length >= 3 ? '50%' : '100%'}${colors.length >= 3 ? `, ${colors[2]} 100%` : ''})`
                : colors[0] || '#fb2e63',
          }}
        />
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          {eventType && (
            <Badge className="bg-white/30 backdrop-blur text-white border-white/40 capitalize">
              {eventType.label}
            </Badge>
          )}
          {!isPast && (
            <Badge
              className={
                isSoon
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/30 backdrop-blur text-white border-white/40'
              }
            >
              {days === 0 ? 'Today' : `${days}d`}
            </Badge>
          )}
          {isPast && (
            <Badge variant="secondary" className="capitalize">
              Past
            </Badge>
          )}
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div>
          <h3 className="font-serif text-xl font-semibold leading-tight group-hover:text-rose-600 transition-colors">
            {event.name}
          </h3>
          {event.theme_name && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Theme: {event.theme_name}
            </p>
          )}
        </div>

        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {formatDate(event.event_date)}
              {event.start_time
                ? ` · ${formatTime12h(event.start_time)}`
                : ''}
            </span>
          </div>
          {event.venue && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{event.venue}</span>
            </div>
          )}
          {event.estimated_guests ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{event.estimated_guests} estimated guests</span>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
