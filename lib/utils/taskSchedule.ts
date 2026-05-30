export type TaskCalendarFields = {
  title: string;
  description?: string | null;
  dueDate: string;
  eventName?: string | null;
};

function dateToYmd(date: string): string {
  return date.slice(0, 10).replace(/-/g, '');
}

function nextDayYmd(date: string): string {
  const d = new Date(`${date.slice(0, 10)}T12:00:00`);
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

/** All-day Google Calendar event on the task due date. */
export function buildTaskCalendarUrl(task: TaskCalendarFields): string {
  const params = new URLSearchParams();
  params.set('action', 'TEMPLATE');
  params.set('text', task.title);

  const details = [
    task.description?.trim(),
    task.eventName ? `Event: ${task.eventName}` : null,
  ]
    .filter(Boolean)
    .join('\n\n');
  if (details) params.set('details', details);

  const date = task.dueDate.slice(0, 10);
  params.set('dates', `${dateToYmd(date)}/${nextDayYmd(date)}`);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function canAddTaskToCalendar(dueDate: string | null | undefined): boolean {
  return Boolean(dueDate?.trim());
}
