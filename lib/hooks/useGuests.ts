'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useOptionalWorkspace } from '@/lib/hooks/useWorkspace';
import { emitDataChanged, onDataChanged } from '@/lib/utils/dataEvents';
import type {
  Guest,
  InsertTables,
  UpdateTables,
} from '@/lib/types/database.types';

const LIVE_POLL_MS = 15_000;

export type GuestAttendance = {
  attended: boolean;
  checked_in_at: string | null;
};

type EventGuestRow = {
  guest_id: string;
  rsvp_status: string | null;
  rsvp_date: string | null;
  attended: boolean | null;
  checked_in_at: string | null;
};

function attendanceFromRows(
  rows: Pick<EventGuestRow, 'guest_id' | 'attended' | 'checked_in_at'>[]
): Record<string, GuestAttendance> {
  const map: Record<string, GuestAttendance> = {};
  for (const r of rows) {
    map[r.guest_id] = {
      attended: Boolean(r.attended),
      checked_in_at: r.checked_in_at ?? null,
    };
  }
  return map;
}

interface UseGuestsOptions {
  eventId?: string;
}

export function useGuests({ eventId }: UseGuestsOptions = {}) {
  const supabase = createClient();
  const ws = useOptionalWorkspace();
  const workspaceId = ws?.activeWorkspaceId ?? null;
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestEvents, setGuestEvents] = useState<Record<string, string[]>>({});
  const [attendance, setAttendance] = useState<Record<string, GuestAttendance>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  const fetchGuests = useCallback(async () => {
    if (eventId) {
      const { data: eventGuestRows, error: eventGuestErr } = await supabase
        .from('event_guests')
        .select('guest_id, rsvp_status, rsvp_date, attended, checked_in_at')
        .eq('event_id', eventId);
      if (eventGuestErr) {
        toast.error(`Failed to load guests: ${eventGuestErr.message}`);
        setLoading(false);
        return;
      }
      const rows = (eventGuestRows ?? []) as EventGuestRow[];
      setAttendance(attendanceFromRows(rows));
      const ids = rows.map((r) => r.guest_id);
      if (ids.length === 0) {
        setGuests([]);
        setGuestEvents({});
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .in('id', ids)
        .order('full_name');
      if (error) toast.error(`Failed to load guests: ${error.message}`);
      else {
        const rsvpByGuest = new Map(
          rows.map((r) => [
            r.guest_id,
            { rsvp_status: r.rsvp_status, rsvp_date: r.rsvp_date },
          ])
        );
        setGuests(
          (data ?? []).map((g) => {
            const eg = rsvpByGuest.get(g.id);
            if (!eg?.rsvp_status) return g;
            return {
              ...g,
              rsvp_status: eg.rsvp_status as Guest['rsvp_status'],
              rsvp_date: eg.rsvp_date,
            };
          })
        );
      }
      const map: Record<string, string[]> = {};
      for (const id of ids) map[id] = [eventId];
      setGuestEvents(map);
    } else {
      setAttendance({});
      if (!workspaceId) {
        setGuests([]);
        setGuestEvents({});
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('full_name');
      if (error) {
        toast.error(`Failed to load guests: ${error.message}`);
      } else {
        setGuests(data ?? []);
        const guestIds = (data ?? []).map((g) => g.id);
        if (guestIds.length === 0) {
          setGuestEvents({});
        } else {
          const { data: links, error: linksErr } = await supabase
            .from('event_guests')
            .select('guest_id, event_id')
            .in('guest_id', guestIds);
          if (linksErr) {
            setGuestEvents({});
          } else {
            const map: Record<string, string[]> = {};
            for (const row of links ?? []) {
              if (!map[row.guest_id]) map[row.guest_id] = [];
              map[row.guest_id].push(row.event_id);
            }
            setGuestEvents(map);
          }
        }
      }
    }
    setLoading(false);
  }, [supabase, eventId, workspaceId]);

  useEffect(() => {
    setLoading(true);
    fetchGuests();
    const channel = supabase
      .channel(`guests-changes-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guests' },
        () => fetchGuests()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_guests' },
        () => fetchGuests()
      )
      .subscribe();
    const offBus = onDataChanged(
      ['guests:changed', 'event_guests:changed'],
      () => fetchGuests()
    );
    const onFocus = () => fetchGuests();
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchGuests();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') fetchGuests();
    }, LIVE_POLL_MS);
    return () => {
      supabase.removeChannel(channel);
      offBus();
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [supabase, fetchGuests]);

  async function addGuest(
    guest: InsertTables<'guests'>,
    options?: { eventId?: string }
  ) {
    if (!workspaceId) {
      toast.error('Pick a workspace first');
      return null;
    }
    const { data, error } = await supabase
      .from('guests')
      .insert({ ...guest, workspace_id: workspaceId })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return null;
    }
    if (options?.eventId && data) {
      await supabase
        .from('event_guests')
        .insert({ event_id: options.eventId, guest_id: data.id });
      emitDataChanged('event_guests:changed');
    }
    emitDataChanged('guests:changed');
    toast.success(`${data?.full_name ?? 'Guest'} added`);
    return data;
  }

  async function updateGuest(id: string, updates: UpdateTables<'guests'>) {
    const { error } = await supabase
      .from('guests')
      .update(updates)
      .eq('id', id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    emitDataChanged('guests:changed');
    toast.success('Guest updated');
    return true;
  }

  async function deleteGuest(id: string) {
    const { error } = await supabase.from('guests').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    emitDataChanged('guests:changed');
    toast.success('Guest removed');
    return true;
  }

  async function updateRsvp(id: string, rsvp_status: Guest['rsvp_status']) {
    const now = new Date().toISOString();
    const previousGuests = guests;
    setGuests((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, rsvp_status, rsvp_date: now } : g
      )
    );

    if (eventId) {
      const { error: egError } = await supabase
        .from('event_guests')
        .update({ rsvp_status, rsvp_date: now })
        .eq('event_id', eventId)
        .eq('guest_id', id);
      if (egError) {
        setGuests(previousGuests);
        toast.error(egError.message);
        return false;
      }
    }
    const { error } = await supabase
      .from('guests')
      .update({ rsvp_status, rsvp_date: now })
      .eq('id', id);
    if (error) {
      setGuests(previousGuests);
      toast.error(error.message);
      return false;
    }
    emitDataChanged('guests:changed');
    emitDataChanged('event_guests:changed');
    return true;
  }

  async function inviteToEvent(guestId: string, targetEventId: string) {
    const { error } = await supabase
      .from('event_guests')
      .insert({ event_id: targetEventId, guest_id: guestId });
    if (error && !error.message.includes('duplicate')) {
      toast.error(error.message);
      return false;
    }
    emitDataChanged('event_guests:changed');
    return true;
  }

  async function inviteManyToEvent(guestIds: string[], targetEventId: string) {
    if (guestIds.length === 0) return true;
    const rows = guestIds.map((guest_id) => ({
      guest_id,
      event_id: targetEventId,
    }));
    const { error } = await supabase
      .from('event_guests')
      .upsert(rows, { onConflict: 'event_id,guest_id', ignoreDuplicates: true });
    if (error) {
      toast.error(error.message);
      return false;
    }
    emitDataChanged('event_guests:changed');
    toast.success(
      `Invited ${guestIds.length} guest${guestIds.length === 1 ? '' : 's'}`
    );
    return true;
  }

  async function removeFromEvent(guestId: string, targetEventId: string) {
    const { error } = await supabase
      .from('event_guests')
      .delete()
      .eq('event_id', targetEventId)
      .eq('guest_id', guestId);
    if (error) {
      toast.error(error.message);
      return false;
    }
    emitDataChanged('event_guests:changed');
    toast.success('Removed from event');
    return true;
  }

  return {
    guests,
    guestEvents,
    attendance,
    loading,
    workspaceId,
    addGuest,
    updateGuest,
    deleteGuest,
    updateRsvp,
    inviteToEvent,
    inviteManyToEvent,
    removeFromEvent,
    refresh: fetchGuests,
  };
}
