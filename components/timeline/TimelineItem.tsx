'use client';

import {
  Clock,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatTime, formatDate } from '@/lib/utils/formatting';
import type { TimelineItem as TimelineItemType } from '@/lib/types/database.types';

interface TimelineItemProps {
  item: TimelineItemType;
  onEdit?: () => void;
  onDelete?: () => void;
  showDate?: boolean;
}

export function TimelineItem({
  item,
  onEdit,
  onDelete,
  showDate,
}: TimelineItemProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="rounded-full bg-rose-500 text-white h-10 w-10 flex items-center justify-center flex-shrink-0">
          <Clock className="h-4 w-4" />
        </div>
        <div className="flex-1 w-px bg-border my-2" />
      </div>

      <Card className="flex-1 p-4 mb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-rose-600 tabular-nums">
              {showDate
                ? `${formatDate(item.start_time)} · ${formatTime(item.start_time)}`
                : formatTime(item.start_time)}
              {item.end_time && (
                <> &mdash; {formatTime(item.end_time)}</>
              )}
            </p>
            <h4 className="font-medium mt-1">{item.title}</h4>
            {item.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {item.description}
              </p>
            )}
            {item.location && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                <MapPin className="h-3 w-3" />
                {item.location}
              </div>
            )}
          </div>
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1 -mt-1">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </Card>
    </div>
  );
}
