'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useOptionalWorkspace } from '@/lib/hooks/useWorkspace';
import type {
  Task,
  InsertTables,
  UpdateTables,
} from '@/lib/types/database.types';

export function useTasks(eventId?: string) {
  const supabase = createClient();
  const ws = useOptionalWorkspace();
  const workspaceId = ws?.activeWorkspaceId ?? null;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!eventId && !workspaceId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    const query = eventId
      ? supabase
          .from('tasks')
          .select('*')
          .eq('event_id', eventId)
          .order('due_date', { ascending: true, nullsFirst: false })
      : supabase
          .from('tasks')
          .select('*')
          .eq('workspace_id', workspaceId!)
          .order('due_date', { ascending: true, nullsFirst: false });
    const { data, error } = await query;
    if (error) toast.error(`Failed to load tasks: ${error.message}`);
    else setTasks(data ?? []);
    setLoading(false);
  }, [supabase, eventId, workspaceId]);

  useEffect(() => {
    fetchTasks();
    const channel = supabase
      .channel(`tasks-changes-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchTasks()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchTasks]);

  async function addTask(task: InsertTables<'tasks'>) {
    if (!workspaceId) {
      toast.error('Pick a workspace first');
      return null;
    }
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, workspace_id: workspaceId })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return null;
    }
    toast.success('Task added');
    return data;
  }

  async function updateTask(id: string, updates: UpdateTables<'tasks'>) {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    return true;
  }

  async function deleteTask(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success('Task deleted');
    return true;
  }

  async function toggleStatus(id: string, status: Task['status']) {
    const updates: UpdateTables<'tasks'> = {
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    };
    return updateTask(id, updates);
  }

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    toggleStatus,
    refresh: fetchTasks,
  };
}
