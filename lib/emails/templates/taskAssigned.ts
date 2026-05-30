import { brand } from '../theme';
import { brandLayout, brandMutedLink, escapeHtml } from '../components';

export interface TaskAssignedProps {
  assigneeName: string;
  assignerName: string;
  taskTitle: string;
  eventName: string;
  priority: string;
  dueDateLabel: string | null;
  taskUrl: string;
}

export function taskAssigned({
  assigneeName,
  assignerName,
  taskTitle,
  eventName,
  priority,
  dueDateLabel,
  taskUrl,
}: TaskAssignedProps): string {
  const dueLine = dueDateLabel
    ? `<p style="margin:0 0 14px;"><strong>Due:</strong> ${escapeHtml(dueDateLabel)}</p>`
    : '';

  const body = `
    <p style="margin:0 0 14px;">Hi ${escapeHtml(assigneeName)},</p>
    <p style="margin:0 0 14px;"><strong>${escapeHtml(assignerName)}</strong> assigned you a task for <strong>${escapeHtml(eventName)}</strong>.</p>
    <p style="margin:0 0 14px;padding:14px 16px;background:#fff5f7;border:1px solid #fecdd3;border-radius:10px;">
      <strong style="font-size:16px;color:#9f1239;">${escapeHtml(taskTitle)}</strong><br/>
      <span style="font-size:13px;color:#6f6a6c;">Priority: ${escapeHtml(priority)}</span>
    </p>
    ${dueLine}
    <p style="margin:0 0 14px;color:#6f6a6c;font-size:14px;">Open the task board to update status or add notes.</p>
  `;

  return brandLayout({
    variant: 'soft',
    preheader: `${assignerName} assigned you: ${taskTitle}`,
    eyebrow: 'Task assigned',
    headline: 'You have a new task',
    sub: eventName,
    bodyHtml: body,
    ctaText: 'View task',
    ctaUrl: taskUrl,
    secondaryNoteHtml: `If the button doesn't work, copy this link:<br/>${brandMutedLink(taskUrl)}`,
  });
}
