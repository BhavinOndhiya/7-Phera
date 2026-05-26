'use client';

import { CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  buildGoogleCalendarUrl,
  type EventScheduleFields,
} from '@/lib/utils/eventSchedule';

interface AddToGoogleCalendarButtonProps {
  event: EventScheduleFields;
  className?: string;
  fullWidth?: boolean;
}

export function AddToGoogleCalendarButton({
  event,
  className,
  fullWidth,
}: AddToGoogleCalendarButtonProps) {
  const href = buildGoogleCalendarUrl(event);

  return (
    <Button
      variant="outline"
      className={`border-emerald-200 text-emerald-800 hover:bg-emerald-50 ${fullWidth ? 'w-full' : ''} ${className ?? ''}`}
      asChild
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        <CalendarPlus className="h-4 w-4 mr-2" />
        Add to Google Calendar
      </a>
    </Button>
  );
}
