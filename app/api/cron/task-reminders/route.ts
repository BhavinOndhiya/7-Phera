import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  sendTaskDueReminderEmail,
} from '@/lib/emails/sendTaskEmail';
import type { TaskReminderItem } from '@/lib/emails/templates/taskDueReminder';
import { buildAppUrl } from '@/lib/utils/appUrl';

export const runtime = 'nodejs';

type ReminderType = 'due_in_7_days' | 'due_in_1_day';

function utcDateOffset(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

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

function formatDueLabel(dueDate: string): string {
  const d = new Date(`${dueDate.slice(0, 10)}T12:00:00`);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function reminderMeta(type: ReminderType): {
  label: string;
  offsetDays: number;
} {
  if (type === 'due_in_7_days') {
    return { label: 'due in 1 week', offsetDays: 7 };
  }
  return { label: 'due tomorrow', offsetDays: 1 };
}

async function processReminderType(
  admin: ReturnType<typeof createServiceRoleClient>,
  type: ReminderType
) {
  const { label, offsetDays } = reminderMeta(type);
  const targetDate = utcDateOffset(offsetDays);

  const { data: tasks, error } = await admin
    .from('tasks')
    .select(
      'id, title, priority, due_date, workspace_id, event_id, assigned_to, status'
    )
    .in('status', ['todo', 'in_progress'])
    .eq('due_date', targetDate);

  if (error) {
    console.error('[cron/task-reminders] query failed', type, error.message);
    return { type, sent: 0, tasks: 0 };
  }

  if (!tasks?.length) {
    return { type, sent: 0, tasks: 0 };
  }

  const { data: alreadySent } = await admin
    .from('task_reminder_sent')
    .select('task_id')
    .eq('reminder_type', type)
    .in(
      'task_id',
      tasks.map((t) => t.id)
    );

  const sentSet = new Set((alreadySent ?? []).map((r) => r.task_id));
  const pending = tasks.filter((t) => !sentSet.has(t.id) && t.workspace_id);

  if (pending.length === 0) {
    return { type, sent: 0, tasks: 0 };
  }

  const eventIds = [...new Set(pending.map((t) => t.event_id))];
  const assigneeIds = [
    ...new Set(
      pending.map((t) => t.assigned_to).filter(Boolean) as string[]
    ),
  ];

  const [{ data: events }, { data: assignees }] = await Promise.all([
    admin.from('events').select('id, name').in('id', eventIds),
    assigneeIds.length
      ? admin.from('users').select('id, full_name').in('id', assigneeIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
  ]);

  const eventNameById = new Map((events ?? []).map((e) => [e.id, e.name]));
  const assigneeNameById = new Map(
    (assignees ?? []).map((u) => [u.id, u.full_name])
  );

  const byWorkspace = new Map<string, typeof pending>();
  for (const task of pending) {
    const wsId = task.workspace_id!;
    const list = byWorkspace.get(wsId) ?? [];
    list.push(task);
    byWorkspace.set(wsId, list);
  }

  let emailsSent = 0;
  const taskIdsToMark: string[] = [];

  for (const [workspaceId, wsTasks] of byWorkspace) {
    const { data: workspace } = await admin
      .from('workspaces')
      .select('name')
      .eq('id', workspaceId)
      .maybeSingle();

    const { data: members } = await admin
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId);

    const memberIds = (members ?? []).map((m) => m.user_id);
    if (memberIds.length === 0) continue;

    const { data: users } = await admin
      .from('users')
      .select('id, email, full_name')
      .in('id', memberIds);

    const reminderItems: TaskReminderItem[] = wsTasks.map((t) => ({
      title: t.title,
      eventName: eventNameById.get(t.event_id) ?? 'Event',
      dueDateLabel: formatDueLabel(t.due_date!),
      assigneeName: t.assigned_to
        ? assigneeNameById.get(t.assigned_to) ?? null
        : null,
      priority: priorityLabel(t.priority),
    }));

    const tasksUrl = buildAppUrl('/tasks');
    let workspaceOk = false;

    for (const member of users ?? []) {
      if (!member.email) continue;
      const result = await sendTaskDueReminderEmail({
        to: member.email,
        memberName: member.full_name ?? member.email,
        workspaceName: workspace?.name ?? 'Your workspace',
        reminderLabel: label,
        tasks: reminderItems,
        tasksUrl,
      });
      if (result.ok) {
        emailsSent++;
        workspaceOk = true;
      } else {
        console.error('[cron/task-reminders] send failed', {
          type,
          workspaceId,
          to: member.email,
          error: result.error,
        });
      }
    }

    if (workspaceOk) {
      taskIdsToMark.push(...wsTasks.map((t) => t.id));
    }
  }

  if (taskIdsToMark.length > 0) {
    await admin.from('task_reminder_sent').upsert(
      taskIdsToMark.map((task_id) => ({ task_id, reminder_type: type })),
      { onConflict: 'task_id,reminder_type' }
    );
  }

  return { type, sent: emailsSent, tasks: taskIdsToMark.length };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    console.error('[cron/task-reminders] CRON_SECRET not configured');
    return NextResponse.json({ error: 'Cron not configured' }, { status: 503 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createServiceRoleClient();

  const results = await Promise.all([
    processReminderType(admin, 'due_in_7_days'),
    processReminderType(admin, 'due_in_1_day'),
  ]);

  return NextResponse.json({ ok: true, results });
}
