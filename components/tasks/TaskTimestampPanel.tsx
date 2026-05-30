import { formatDateTime } from '@/lib/utils/formatting';
import type { Task } from '@/lib/types/database.types';

export function TaskTimestampPanel({ task }: { task: Task }) {
  const rows: { label: string; value: string | null | undefined }[] = [
    { label: 'Created', value: task.created_at },
    { label: 'In progress', value: task.in_progress_at },
    { label: 'Completed', value: task.completed_at },
    { label: 'Cancelled', value: task.cancelled_at },
    { label: 'Last updated', value: task.updated_at },
  ];

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-xs">
      <p className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">
        Timeline
      </p>
      {rows.map(({ label, value }) => (
        <div key={label} className="flex justify-between gap-4">
          <span className="text-muted-foreground">{label}</span>
          <span className="tabular-nums text-right">
            {value ? formatDateTime(value) : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}
