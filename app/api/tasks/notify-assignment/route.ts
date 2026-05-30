import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { sendTaskAssignedEmail } from '@/lib/emails/sendTaskEmail';
import { buildAppUrl } from '@/lib/utils/appUrl';
import { can } from '@/lib/utils/permissions';
import type { WorkspaceRole } from '@/lib/types/database.types';

export const runtime = 'nodejs';

function priorityLabel(priority: string): string {
  switch (priority) {
    case 'high':
      return 'High';
    case 'low':
      return 'Low';
    default:
      return 'Medium';
  }
}

function formatDueLabel(dueDate: string | null): string | null {
  if (!dueDate) return null;
  const d = new Date(`${dueDate.slice(0, 10)}T12:00:00`);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const taskId = String(body?.taskId ?? '').trim();
  if (!taskId) {
    return NextResponse.json({ error: 'taskId required' }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  const { data: task, error: taskError } = await admin
    .from('tasks')
    .select('id, title, priority, due_date, assigned_to, event_id, workspace_id, status')
    .eq('id', taskId)
    .maybeSingle();

  if (taskError || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (!task.workspace_id) {
    return NextResponse.json({ error: 'Task has no workspace' }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', task.workspace_id)
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, is_superadmin')
    .eq('id', user.id)
    .maybeSingle();

  if (
    !can(membership?.role as WorkspaceRole | null, 'edit_task', {
      isSuperadmin: profile?.is_superadmin,
    })
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!task.assigned_to) {
    return NextResponse.json({ ok: true, skipped: 'no_assignee' });
  }

  if (task.assigned_to === user.id) {
    return NextResponse.json({ ok: true, skipped: 'self_assigned' });
  }

  if (task.status === 'completed' || task.status === 'cancelled') {
    return NextResponse.json({ ok: true, skipped: 'closed_task' });
  }

  const [{ data: assignee }, { data: event }] = await Promise.all([
    admin
      .from('users')
      .select('id, email, full_name')
      .eq('id', task.assigned_to)
      .maybeSingle(),
    admin.from('events').select('name').eq('id', task.event_id).maybeSingle(),
  ]);

  if (!assignee?.email) {
    return NextResponse.json({ ok: true, skipped: 'no_assignee_email' });
  }

  const assignerName = profile?.full_name ?? user.email ?? 'Someone';
  const taskUrl = buildAppUrl(`/events/${task.event_id}/tasks`);

  const result = await sendTaskAssignedEmail({
    to: assignee.email,
    assigneeName: assignee.full_name ?? assignee.email,
    assignerName,
    taskTitle: task.title,
    eventName: event?.name ?? 'Your event',
    priority: priorityLabel(task.priority),
    dueDateLabel: formatDueLabel(task.due_date),
    taskUrl,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true, sentTo: assignee.email, id: result.id });
}
