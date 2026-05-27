'use client';

import { useMemo, useState } from 'react';
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
import { useTasks } from '@/lib/hooks/useTasks';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { formatDate, daysUntil } from '@/lib/utils/formatting';
import { PRIORITIES } from '@/lib/constants';
import type { Task, TaskStatus } from '@/lib/types/database.types';

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
  const { tasks, deleteTask, toggleStatus } = useTasks(eventId);
  const { confirm } = useConfirm();
  const { can } = useWorkspace();
  const canCreate = can('create_task');
  const canEdit = can('edit_task');
  const canDelete = can('delete_task');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const grouped = useMemo(() => {
    const byStatus: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      completed: [],
      cancelled: [],
    };
    for (const t of tasks) byStatus[t.status].push(t);
    return byStatus;
  }, [tasks]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-serif text-xl font-semibold">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add task</DialogTitle>
          </DialogHeader>
          <TaskForm eventId={eventId} onDone={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl">
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
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  task: Task;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
}) {
  const priority = PRIORITIES.find((p) => p.value === task.priority);
  const days = task.due_date ? daysUntil(task.due_date) : null;
  const overdue = days !== null && days < 0 && task.status !== 'completed';

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
