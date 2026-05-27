'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useOptionalWorkspace } from '@/lib/hooks/useWorkspace';
import type {
  Guest,
  GuestContribution,
  InsertTables,
  UpdateTables,
} from '@/lib/types/database.types';

export type GuestContributionRow = GuestContribution & {
  guest: Pick<Guest, 'id' | 'full_name' | 'side' | 'relation' | 'phone' | 'email'>;
};

export function useGuestContributions(eventId: string) {
  const supabase = createClient();
  const ws = useOptionalWorkspace();
  const workspaceId = ws?.activeWorkspaceId ?? null;
  const [rows, setRows] = useState<GuestContributionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!eventId) return;
    const { data, error } = await supabase
      .from('guest_contributions')
      .select(
        '*, guest:guests(id, full_name, side, relation, phone, email)'
      )
      .eq('event_id', eventId)
      .order('amount_inr', { ascending: false });

    if (error) {
      toast.error(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as GuestContributionRow[]);
    }
    setLoading(false);
  }, [supabase, eventId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function upsertContribution(
    input: Omit<InsertTables<'guest_contributions'>, 'workspace_id'>
  ) {
    if (!workspaceId) {
      toast.error('Pick a workspace first');
      return false;
    }
    const { error } = await supabase.from('guest_contributions').upsert(
      { ...input, workspace_id: workspaceId },
      { onConflict: 'event_id,guest_id' }
    );
    if (error) {
      toast.error(error.message);
      return false;
    }
    await refresh();
    return true;
  }

  async function updateContribution(
    id: string,
    updates: UpdateTables<'guest_contributions'>
  ) {
    const { error } = await supabase
      .from('guest_contributions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    await refresh();
    return true;
  }

  async function deleteContribution(id: string) {
    const { error } = await supabase
      .from('guest_contributions')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success('Entry removed');
    await refresh();
    return true;
  }

  const totalInr = rows.reduce((sum, r) => sum + Number(r.amount_inr), 0);

  return {
    rows,
    loading,
    totalInr,
    upsertContribution,
    updateContribution,
    deleteContribution,
    refresh,
  };
}
