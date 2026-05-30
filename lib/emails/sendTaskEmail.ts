import { Resend } from 'resend';
import { brand } from './theme';
import { taskAssigned } from './templates/taskAssigned';
import {
  taskDueReminder,
  type TaskReminderItem,
} from './templates/taskDueReminder';

export type TaskEmailResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

function resendFromAddress(): string {
  return process.env.RESEND_FROM ?? `${brand.name} <onboarding@resend.dev>`;
}

function resendReplyTo(): string | undefined {
  const v = process.env.RESEND_REPLY_TO?.trim();
  return v || undefined;
}

export async function sendTaskAssignedEmail(opts: {
  to: string;
  assigneeName: string;
  assignerName: string;
  taskTitle: string;
  eventName: string;
  priority: string;
  dueDateLabel: string | null;
  taskUrl: string;
}): Promise<TaskEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: 'RESEND_API_KEY is not set' };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const replyTo = resendReplyTo();
    const { data, error } = await resend.emails.send({
      from: resendFromAddress(),
      to: opts.to,
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject: `Task assigned: ${opts.taskTitle} · ${brand.name}`,
      html: taskAssigned({
        assigneeName: opts.assigneeName,
        assignerName: opts.assignerName,
        taskTitle: opts.taskTitle,
        eventName: opts.eventName,
        priority: opts.priority,
        dueDateLabel: opts.dueDateLabel,
        taskUrl: opts.taskUrl,
      }),
    });

    if (error) {
      console.error('[sendTaskEmail] assignment rejected', { to: opts.to, error });
      return { ok: false, error: `${error.name}: ${error.message}` };
    }

    console.log('[sendTaskEmail] assignment sent', { to: opts.to, id: data?.id });
    return { ok: true, id: data?.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to send email';
    console.error('[sendTaskEmail] assignment failed', e);
    return { ok: false, error: message };
  }
}

export async function sendTaskDueReminderEmail(opts: {
  to: string;
  memberName: string;
  workspaceName: string;
  reminderLabel: string;
  tasks: TaskReminderItem[];
  tasksUrl: string;
}): Promise<TaskEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: 'RESEND_API_KEY is not set' };
  }
  if (opts.tasks.length === 0) {
    return { ok: true };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const replyTo = resendReplyTo();
    const { data, error } = await resend.emails.send({
      from: resendFromAddress(),
      to: opts.to,
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject: `Task reminder: ${opts.reminderLabel} · ${brand.name}`,
      html: taskDueReminder({
        memberName: opts.memberName,
        workspaceName: opts.workspaceName,
        reminderLabel: opts.reminderLabel,
        tasks: opts.tasks,
        tasksUrl: opts.tasksUrl,
      }),
    });

    if (error) {
      console.error('[sendTaskEmail] reminder rejected', { to: opts.to, error });
      return { ok: false, error: `${error.name}: ${error.message}` };
    }

    return { ok: true, id: data?.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to send email';
    console.error('[sendTaskEmail] reminder failed', e);
    return { ok: false, error: message };
  }
}
