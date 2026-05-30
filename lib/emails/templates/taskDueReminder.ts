import { brand } from '../theme';
import { brandLayout, brandMutedLink, escapeHtml } from '../components';

export type TaskReminderItem = {
  title: string;
  eventName: string;
  dueDateLabel: string;
  assigneeName: string | null;
  priority: string;
};

export interface TaskDueReminderProps {
  memberName: string;
  workspaceName: string;
  reminderLabel: string;
  tasks: TaskReminderItem[];
  tasksUrl: string;
}

function taskListHtml(tasks: TaskReminderItem[]): string {
  if (tasks.length === 0) return '';
  const rows = tasks
    .map(
      (t) => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f3e8eb;font-size:14px;">
        <strong>${escapeHtml(t.title)}</strong><br/>
        <span style="color:#6f6a6c;font-size:12px;">${escapeHtml(t.eventName)} · Due ${escapeHtml(t.dueDateLabel)}</span>
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #f3e8eb;font-size:12px;color:#6f6a6c;white-space:nowrap;">
        ${escapeHtml(t.assigneeName ?? 'Unassigned')}<br/>
        ${escapeHtml(t.priority)}
      </td>
    </tr>`
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #f3e8eb;border-radius:10px;overflow:hidden;">
      <thead>
        <tr style="background:#fff5f7;">
          <th style="padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#9f1239;">Task</th>
          <th style="padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#9f1239;">Assignee</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

export function taskDueReminder({
  memberName,
  workspaceName,
  reminderLabel,
  tasks,
  tasksUrl,
}: TaskDueReminderProps): string {
  const body = `
    <p style="margin:0 0 14px;">Hi ${escapeHtml(memberName)},</p>
    <p style="margin:0 0 14px;">Here are open tasks in <strong>${escapeHtml(workspaceName)}</strong> ${escapeHtml(reminderLabel)}:</p>
    ${taskListHtml(tasks)}
    <p style="margin:0 0 14px;color:#6f6a6c;font-size:14px;">Please review and complete them on time.</p>
  `;

  return brandLayout({
    variant: 'soft',
    preheader: `${tasks.length} task${tasks.length === 1 ? '' : 's'} ${reminderLabel}`,
    eyebrow: 'Task reminder',
    headline: reminderLabel,
    sub: workspaceName,
    bodyHtml: body,
    ctaText: 'Open tasks',
    ctaUrl: tasksUrl,
    secondaryNoteHtml: `If the button doesn't work, copy this link:<br/>${brandMutedLink(tasksUrl)}`,
  });
}
