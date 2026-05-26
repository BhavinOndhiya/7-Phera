/**
 * Event date + optional Postgres TIME fields (HH:mm or HH:mm:ss).
 */

export type EventScheduleFields = {
  name: string;
  event_date: string;
  start_time?: string | null;
  end_time?: string | null;
  venue?: string | null;
  venue_address?: string | null;
};

/** "18:30:00" → "18:30" */
export function normalizeTime(time: string): string {
  const parts = time.trim().split(':');
  const h = parts[0]?.padStart(2, '0') ?? '00';
  const m = (parts[1] ?? '00').padStart(2, '0');
  return `${h}:${m}`;
}

export function formatTime12h(time: string | null | undefined): string {
  if (!time) return '';
  const [hStr, mStr] = normalizeTime(time).split(':');
  let h = parseInt(hStr, 10);
  const m = mStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

export function formatEventWhen(
  eventDate: string,
  startTime?: string | null,
  endTime?: string | null
): string {
  const dateOnly = eventDate.slice(0, 10);
  const d = new Date(`${dateOnly}T12:00:00`);
  const dateLabel = d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  if (!startTime) return dateLabel;
  const startLabel = formatTime12h(startTime);
  if (endTime) {
    return `${dateLabel} · ${startLabel} – ${formatTime12h(endTime)}`;
  }
  return `${dateLabel} · ${startLabel}`;
}

/** Local Date for countdowns (browser timezone). */
export function eventStartDateTime(
  eventDate: string,
  startTime?: string | null
): Date {
  const [y, m, d] = eventDate.slice(0, 10).split('-').map(Number);
  if (!startTime) {
    return new Date(y, m - 1, d, 9, 0, 0);
  }
  const [hh, mm] = normalizeTime(startTime).split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0);
}

function addHoursToTime(date: string, time: string, hours: number): string {
  const start = eventStartDateTime(date, time);
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
  const y = end.getFullYear();
  const mo = String(end.getMonth() + 1).padStart(2, '0');
  const da = String(end.getDate()).padStart(2, '0');
  const hh = String(end.getHours()).padStart(2, '0');
  const mm = String(end.getMinutes()).padStart(2, '0');
  return `${y}${mo}${da}T${hh}${mm}00`;
}

function dateToYmd(eventDate: string): string {
  return eventDate.slice(0, 10).replace(/-/g, '');
}

function timeToStamp(eventDate: string, time: string): string {
  const ymd = dateToYmd(eventDate);
  const [hh, mm] = normalizeTime(time).split(':');
  return `${ymd}T${hh}${mm}00`;
}

function nextDayYmd(eventDate: string): string {
  const d = new Date(`${eventDate.slice(0, 10)}T12:00:00`);
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

export function buildGoogleCalendarUrl(event: EventScheduleFields): string {
  const params = new URLSearchParams();
  params.set('action', 'TEMPLATE');
  params.set('text', event.name);

  const location = [event.venue, event.venue_address]
    .filter(Boolean)
    .join(', ');
  if (location) params.set('location', location);

  const date = event.event_date.slice(0, 10);

  if (!event.start_time) {
    params.set('dates', `${dateToYmd(date)}/${nextDayYmd(date)}`);
  } else {
    const startStamp = timeToStamp(date, event.start_time);
    const endStamp = event.end_time
      ? timeToStamp(date, event.end_time)
      : addHoursToTime(date, event.start_time, 3);
    params.set('dates', `${startStamp}/${endStamp}`);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function canAddToCalendar(rsvpStatus: string): boolean {
  return rsvpStatus === 'accepted' || rsvpStatus === 'tentative';
}
