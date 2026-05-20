'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useOptionalWorkspace } from '@/lib/hooks/useWorkspace';
import type {
  Guest,
  InsertTables,
  UpdateTables,
} from '@/lib/types/database.types';

interface UseGuestsOptions {
  eventId?: string;
}

export function useGuests({ eventId }: UseGuestsOptions = {}) {
  const supabase = createClient();
  const ws = useOptionalWorkspace();
  const workspaceId = ws?.activeWorkspaceId ?? null;
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGuests = useCallback(async () => {
    if (eventId) {
      const { data: eventGuestRows, error: eventGuestErr } = await supabase
        .from('event_guests')
        .select('guest_id')
        .eq('event_id', eventId);
      if (eventGuestErr) {
        toast.error(`Failed to load guests: ${eventGuestErr.message}`);
        setLoading(false);
        return;
      }
      const ids = (eventGuestRows ?? []).map((r) => r.guest_id);
      if (ids.length === 0) {
        setGuests([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .in('id', ids)
        .order('full_name');
      if (error) toast.error(`Failed to load guests: ${error.message}`);
      else setGuests(data ?? []);
    } else {
      if (!workspaceId) {
        setGuests([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('full_name');
      if (error) toast.error(`Failed to load guests: ${error.message}`);
      else setGuests(data ?? []);
    }
    setLoading(false);
  }, [supabase, eventId, workspaceId]);

  useEffect(() => {
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
    return () => {
      supabase.removeChannel(channel);
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
    }
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
    toast.success('Guest updated');
    return true;
  }

  async function deleteGuest(id: string) {
    const { error } = await supabase.from('guests').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success('Guest removed');
    return true;
  }

  async function updateRsvp(id: string, rsvp_status: Guest['rsvp_status']) {
    const { error } = await supabase
      .from('guests')
      .update({ rsvp_status, rsvp_date: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    return true;
  }

  return {
    guests,
    loading,
    workspaceId,
    addGuest,
    updateGuest,
    deleteGuest,
    updateRsvp,
    refresh: fetchGuests,
  };
}
