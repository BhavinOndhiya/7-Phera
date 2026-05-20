'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type {
  TimelineItem,
  InsertTables,
  UpdateTables,
} from '@/lib/types/database.types';

export function useTimeline(eventId?: string) {
  const supabase = createClient();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    const query = eventId
      ? supabase
          .from('timeline_items')
          .select('*')
          .eq('event_id', eventId)
          .order('start_time', { ascending: true })
      : supabase
          .from('timeline_items')
          .select('*')
          .order('start_time', { ascending: true });
    const { data, error } = await query;
    if (error) toast.error(error.message);
    else setItems(data ?? []);
    setLoading(false);
  }, [supabase, eventId]);

  useEffect(() => {
    fetchItems();
    const channel = supabase
      .channel(`timeline-changes-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'timeline_items' },
        () => fetchItems()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchItems]);

  async function addItem(item: InsertTables<'timeline_items'>) {
    const { data, error } = await supabase
      .from('timeline_items')
      .insert(item)
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return null;
    }
    toast.success('Timeline item added');
    return data;
  }

  async function updateItem(id: string, updates: UpdateTables<'timeline_items'>) {
    const { error } = await supabase
      .from('timeline_items')
      .update(updates)
      .eq('id', id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success('Timeline updated');
    return true;
  }

  async function deleteItem(id: string) {
    const { error } = await supabase
      .from('timeline_items')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success('Timeline item deleted');
    return true;
  }

  return { items, loading, addItem, updateItem, deleteItem, refresh: fetchItems };
}
