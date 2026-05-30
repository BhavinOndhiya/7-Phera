'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  CalendarClock,
  Filter,
  User,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TaskForm } from './TaskForm';
import { AddTaskToCalendarButton } from './AddTaskToCalendarButton';
import { useTasks } from '@/lib/hooks/useTasks';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { useEvent } from '@/lib/hooks/useEvents';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatDateTime, daysUntil } from '@/lib/utils/formatting';
import { PRIORITIES } from '@/lib/constants';
import type {
  Priority,
  TaskStatus,
  TaskWithAssignee,
} from '@/lib/types/database.types';

const COLUMNS: {
  key: TaskStatus;
  label: string;
  icon: typeof Circle;
  color: string;
}[] = [
  { key: 'todo', label: 'To do', icon: Circle, color: 'text-slate-500' },
  {
    key: 'in_progress',
    label: 'In progress',
    icon: Clock,
    color: 'text-amber-500',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-emerald-500',
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-slate-400',
  },
];

export function TasksKanban({ eventId }: { eventId: string }) {
  const supabase = createClient();
  const { tasks, deleteTask, toggleStatus } = useTasks(eventId);
  const { event } = useEvent(eventId);
  const { confirm } = useConfirm();
  const { can, activeWorkspaceId } = useWorkspace();
  const canCreate = can('create_task');
  const canEdit = can('edit_task');
  const canDelete = can('delete_task');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<TaskWithAssignee | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [members, setMembers] = useState<
    { id: string; full_name: string | null }[]
  >([]);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    void (async () => {
      const { data: rows } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', activeWorkspaceId);
      const ids = (rows ?? []).map((r) => r.user_id);
      if (ids.length === 0) {
        setMembers([]);
        return;
      }
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', ids);
      setMembers(users ?? []);
    })();
  }, [supabase, activeWorkspaceId]);

  const categoryOptions = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const t of tasks) {
      const label = t.category?.trim();
      if (!label) continue;
      const key = label.toLowerCase();
      const prev = counts.get(key);
      if (prev) prev.count++;
      else counts.set(key, { label, count: 1 });
    }
    return [...counts.values()].sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
    );
  }, [tasks]);

  const assigneeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    let unassigned = 0;
    for (const t of tasks) {
      if (t.assigned_to) {
        counts.set(t.assigned_to, (counts.get(t.assigned_to) ?? 0) + 1);
      } else {
        unassigned++;
      }
    }
    return { counts, unassigned };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesAssignee =
        assigneeFilter === 'all' ||
        (assigneeFilter === 'unassigned'
          ? !t.assigned_to
          : t.assigned_to === assigneeFilter);
      const matchesCategory =
        categoryFilter === 'all' ||
        (t.category?.trim().toLowerCase() ?? '') === categoryFilter;
      const matchesPriority =
        priorityFilter === 'all' || t.priority === priorityFilter;
      return matchesAssignee && matchesCategory && matchesPriority;
    });
  }, [tasks, assigneeFilter, categoryFilter, priorityFilter]);

  const grouped = useMemo(() => {
    const byStatus: Record<TaskStatus, TaskWithAssignee[]> = {
      todo: [],
      in_progress: [],
      completed: [],
      cancelled: [],
    };
    for (const t of filteredTasks) byStatus[t.status].push(t);
    return byStatus;
  }, [filteredTasks]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="font-serif text-xl font-semibold">
          {filteredTasks.length} of {tasks.length}{' '}
          {tasks.length === 1 ? 'task' : 'tasks'}
        </h2>
        {canCreate && (
          <Button
            className="bg-rose-500 hover:bg-rose-600"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> Add task
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-[180px]">
            <User className="h-3 w-3 mr-1.5 opacity-50" />
            <SelectValue placeholder="All assignees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assignees</SelectItem>
            {assigneeCounts.unassigned > 0 && (
              <SelectItem value="unassigned">
                Unassigned ({assigneeCounts.unassigned})
              </SelectItem>
            )}
            {members.map((m) => {
              const count = assigneeCounts.counts.get(m.id) ?? 0;
              if (count === 0) return null;
              return (
                <SelectItem key={m.id} value={m.id}>
                  {m.full_name ?? 'Member'} ({count})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {categoryOptions.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <Tag className="h-3 w-3 mr-1.5 opacity-50" />
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categoryOptions.map(({ label, count }) => (
                <SelectItem key={label.toLowerCase()} value={label.toLowerCase()}>
                  {label} ({count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={priorityFilter}
          onValueChange={(v) => setPriorityFilter(v as Priority | 'all')}
        >
          <SelectTrigger className="w-[140px]">
            <Filter className="h-3 w-3 mr-1.5 opacity-50" />
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const Icon = col.icon;
          const colTasks = grouped[col.key];
          return (
            <div key={col.key} className="space-y-3 min-w-0">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${col.color}`} />
                <h3 className="font-medium text-sm">{col.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {colTasks.length}
                </Badge>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    eventName={event?.name}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onEdit={() => setEditing(task)}
                    onDelete={async () => {
                      const ok = await confirm({
                        title: 'Delete task',
                        description: `Delete "${task.title}"? This cannot be undone.`,
                        confirmLabel: 'Delete',
                        variant: 'destructive',
                      });
                      if (ok) await deleteTask(task.id);
                    }}
                    onStatusChange={(newStatus) =>
                      toggleStatus(task.id, newStatus)
                    }
                  />
                ))}
                {colTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No tasks
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add task</DialogTitle>
          </DialogHeader>
          <TaskForm eventId={eventId} onDone={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
          </DialogHeader>
          {editing && (
            <TaskForm
              eventId={eventId}
              initial={editing}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskCard({
  task,
  eventName,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  task: TaskWithAssignee;
  eventName?: string;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
}) {
  const priority = PRIORITIES.find((p) => p.value === task.priority);
  const days = task.due_date ? daysUntil(task.due_date) : null;
  const overdue =
    days !== null && days < 0 && task.status !== 'completed' && task.status !== 'cancelled';
  const assigneeLabel = task.assignee?.full_name ?? 'Unassigned';

  return (
    <Card className="p-3 space-y-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm leading-snug flex-1 min-w-0">
          {task.title}
        </p>
        {(canEdit || canDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-1 -mt-1"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
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

      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {task.category && (
          <Badge variant="secondary" className="text-xs">
            {task.category}
          </Badge>
        )}
        {priority && (
          <Badge variant="outline" className={`text-xs ${priority.color}`}>
            {priority.label}
          </Badge>
        )}
        {task.due_date && (
          <span
            className={`inline-flex items-center gap-1 text-xs ${
              overdue ? 'text-rose-600 font-medium' : 'text-muted-foreground'
            }`}
          >
            <CalendarClock className="h-3 w-3" />
            {overdue ? `${Math.abs(days!)}d overdue` : formatDate(task.due_date)}
          </span>
        )}
      </div>

      <div className="space-y-0.5 text-[11px] text-muted-foreground border-t pt-2">
        <p>
          <span className="text-foreground/70">Assigned:</span> {assigneeLabel}
        </p>
        <p>
          <span className="text-foreground/70">Created:</span>{' '}
          {formatDateTime(task.created_at)}
        </p>
        {task.in_progress_at && (
          <p>
            <span className="text-foreground/70">Started:</span>{' '}
            {formatDateTime(task.in_progress_at)}
          </p>
        )}
        {task.completed_at && (
          <p>
            <span className="text-foreground/70">Completed:</span>{' '}
            {formatDateTime(task.completed_at)}
          </p>
        )}
      </div>

      {task.due_date && (
        <AddTaskToCalendarButton
          compact
          task={{
            title: task.title,
            description: task.description,
            dueDate: task.due_date,
            eventName,
          }}
        />
      )}

      <Select
        value={task.status}
        onValueChange={(v) => onStatusChange(v as TaskStatus)}
        disabled={!canEdit}
      >
        <SelectTrigger className="h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todo">To do</SelectItem>
          <SelectItem value="in_progress">In progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </Card>
  );
}
