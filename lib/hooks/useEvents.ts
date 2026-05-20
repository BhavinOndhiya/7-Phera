'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type {
  Event,
  InsertTables,
  UpdateTables,
} from '@/lib/types/database.types';

export function useEvents() {
  const supabase = createClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });
    if (error) toast.error(`Failed to load events: ${error.message}`);
    else setEvents(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchEvents();
    const channel = supabase
      .channel(`events-changes-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => fetchEvents()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchEvents]);

  async function addEvent(event: InsertTables<'events'>) {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return null;
    }
    toast.success('Event created');
    return data;
  }

  async function updateEvent(id: string, updates: UpdateTables<'events'>) {
    const { error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success('Event updated');
    return true;
  }

  async function deleteEvent(id: string) {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success('Event deleted');
    return true;
  }

  return { events, loading, addEvent, updateEvent, deleteEvent, refresh: fetchEvents };
}

export function useEvent(id: string | null) {
  const supabase = createClient();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (mounted) {
        if (error) toast.error(error.message);
        else setEvent(data);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, supabase]);

  return { event, loading };
}
