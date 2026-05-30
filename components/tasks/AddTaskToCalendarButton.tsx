'use client';

import { CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  buildTaskCalendarUrl,
  type TaskCalendarFields,
} from '@/lib/utils/taskSchedule';

interface AddTaskToCalendarButtonProps {
  task: TaskCalendarFields;
  compact?: boolean;
  className?: string;
}

export function AddTaskToCalendarButton({
  task,
  compact,
  className,
}: AddTaskToCalendarButtonProps) {
  const href = buildTaskCalendarUrl(task);

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 px-2 text-xs text-emerald-800 hover:bg-emerald-50 ${className ?? ''}`}
        asChild
      >
        <a href={href} target="_blank" rel="noopener noreferrer">
          <CalendarPlus className="h-3 w-3 mr-1" />
          Calendar
        </a>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={`border-emerald-200 text-emerald-800 hover:bg-emerald-50 ${className ?? ''}`}
      asChild
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        <CalendarPlus className="h-4 w-4 mr-2" />
        Add to Google Calendar
      </a>
    </Button>
  );
}
