import type { TaskStatus, UpdateTables } from '@/lib/types/database.types';

/**
 * Apply status-specific timestamps when a task moves between columns.
 */
export function statusTimestampUpdates(
  newStatus: TaskStatus,
  existing?: {
    in_progress_at?: string | null;
    completed_at?: string | null;
    cancelled_at?: string | null;
  } | null
): Pick<
  UpdateTables<'tasks'>,
  'in_progress_at' | 'completed_at' | 'cancelled_at'
> {
  const now = new Date().toISOString();

  switch (newStatus) {
    case 'todo':
      return {
        in_progress_at: null,
        completed_at: null,
        cancelled_at: null,
      };
    case 'in_progress':
      return {
        in_progress_at: existing?.in_progress_at ?? now,
        completed_at: null,
        cancelled_at: null,
      };
    case 'completed':
      return {
        in_progress_at: existing?.in_progress_at ?? null,
        completed_at: now,
        cancelled_at: null,
      };
    case 'cancelled':
      return {
        in_progress_at: existing?.in_progress_at ?? null,
        completed_at: null,
        cancelled_at: now,
      };
    default:
      return {};
  }
}

export function buildStatusPayload(
  newStatus: TaskStatus,
  existing?: {
    in_progress_at?: string | null;
    completed_at?: string | null;
    cancelled_at?: string | null;
  } | null
): Pick<
  UpdateTables<'tasks'>,
  'status' | 'in_progress_at' | 'completed_at' | 'cancelled_at'
> {
  return {
    status: newStatus,
    ...statusTimestampUpdates(newStatus, existing),
  };
}
