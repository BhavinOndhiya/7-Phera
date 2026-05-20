'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useOptionalWorkspace } from '@/lib/hooks/useWorkspace';
import type { Gift, InsertTables, UpdateTables } from '@/lib/types/database.types';

export function useGifts(eventId?: string) {
  const supabase = createClient();
  const ws = useOptionalWorkspace();
  const workspaceId = ws?.activeWorkspaceId ?? null;
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!eventId) return;
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    else setGifts(data ?? []);
    setLoading(false);
  }, [supabase, eventId]);

  useEffect(() => {
    refresh();
    if (!eventId) return;
    const channel = supabase
      .channel(`gifts-${eventId}-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gifts' },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, refresh, eventId]);

  async function createGift(input: InsertTables<'gifts'>) {
    if (!workspaceId) {
      toast.error('Pick a workspace first');
      return null;
    }
    const { data, error } = await supabase
      .from('gifts')
      .insert({ ...input, workspace_id: workspaceId })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return null;
    }
    toast.success('Gift added');
    return data;
  }

  async function updateGift(id: string, updates: UpdateTables<'gifts'>) {
    const { error } = await supabase.from('gifts').update(updates).eq('id', id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    return true;
  }

  async function deleteGift(id: string) {
    const { error } = await supabase.from('gifts').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success('Gift removed');
    return true;
  }

  async function toggleClaim(gift: Gift) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (gift.claimed_by) {
      return updateGift(gift.id, { claimed_by: null, claimed_at: null });
    }
    return updateGift(gift.id, {
      claimed_by: user?.id ?? null,
      claimed_at: new Date().toISOString(),
    });
  }

  return { gifts, loading, createGift, updateGift, deleteGift, toggleClaim, refresh };
}
