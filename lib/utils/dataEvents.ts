/**
 * Tiny client-side event bus so a component that mutates a table can tell
 * every live `useX` hook instance to refetch — without depending on Supabase
 * Realtime being enabled. Realtime keeps working alongside this; this just
 * removes the manual page-reload need when Realtime is off or laggy.
 *
 * Usage:
 *   emitDataChanged('guests:changed');   // after a successful insert / update / delete
 *   const off = onDataChanged('guests:changed', refetch);
 *   return off;                            // in useEffect cleanup
 */
export type DataChannel =
  | 'guests:changed'
  | 'events:changed'
  | 'event_guests:changed';

export function emitDataChanged(channel: DataChannel): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(channel));
}

export function onDataChanged(
  channels: DataChannel | DataChannel[],
  callback: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const list = Array.isArray(channels) ? channels : [channels];
  const handler = () => callback();
  for (const ch of list) window.addEventListener(ch, handler);
  return () => {
    for (const ch of list) window.removeEventListener(ch, handler);
  };
}
