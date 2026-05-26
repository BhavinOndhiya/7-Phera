'use client';

import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useOptionalWorkspace } from '@/lib/hooks/useWorkspace';
import type {
  Task,
  Priority,
  TaskStatus,
} from '@/lib/types/database.types';

interface TaskFormProps {
  eventId: string;
  initial?: Task;
  onDone?: () => void;
}

export function TaskForm({ eventId, initial, onDone }: TaskFormProps) {
  const supabase = createClient();
  const ws = useOptionalWorkspace();
  const workspaceId = ws?.activeWorkspaceId ?? null;
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    category: initial?.category ?? '',
    due_date: initial?.due_date ?? '',
    priority: (initial?.priority ?? 'medium') as Priority,
    status: (initial?.status ?? 'todo') as TaskStatus,
    assigned_to: initial?.assigned_to ?? '',
  });

  const [members, setMembers] = useState<
    { id: string; full_name: string | null }[]
  >([]);

  useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      const { data: rows } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspaceId);
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
  }, [supabase, workspaceId]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    startTransition(async () => {
      const payload = {
        event_id: eventId,
        title: form.title.trim(),
        description: form.description || null,
        category: form.category || null,
        due_date: form.due_date || null,
        priority: form.priority,
        status: form.status,
        assigned_to: form.assigned_to || null,
        completed_at:
          form.status === 'completed' ? new Date().toISOString() : null,
      };
      if (initial) {
        const { error } = await supabase
          .from('tasks')
          .update(payload)
          .eq('id', initial.id);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success('Task updated');
      } else {
        if (!workspaceId) {
          toast.error('Pick a workspace first');
          return;
        }
        const { error } = await supabase
          .from('tasks')
          .insert({ ...payload, workspace_id: workspaceId });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success('Task added');
      }
      onDone?.();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. Book wedding venue"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Venue, Catering"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date">Due date</Label>
          <Input
            id="due_date"
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={form.priority}
            onValueChange={(v) => setForm({ ...form, priority: v as Priority })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm({ ...form, status: v as TaskStatus })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To do</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Assign to</Label>
          <Select
            value={form.assigned_to || 'unassigned'}
            onValueChange={(v) =>
              setForm({
                ...form,
                assigned_to: v === 'unassigned' ? '' : v,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.full_name ?? m.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        {onDone && (
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isPending}
          className="bg-rose-500 hover:bg-rose-600"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initial ? 'Save task' : 'Add task'}
        </Button>
      </div>
    </form>
  );
}
