'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useOptionalWorkspace } from '@/lib/hooks/useWorkspace';
import type {
  Vendor,
  InsertTables,
  UpdateTables,
} from '@/lib/types/database.types';

export function useVendors() {
  const supabase = createClient();
  const ws = useOptionalWorkspace();
  const workspaceId = ws?.activeWorkspaceId ?? null;
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVendors = useCallback(async () => {
    if (!workspaceId) {
      setVendors([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name');
    if (error) toast.error(`Failed to load vendors: ${error.message}`);
    else setVendors(data ?? []);
    setLoading(false);
  }, [supabase, workspaceId]);

  useEffect(() => {
    fetchVendors();
    const channel = supabase
      .channel(`vendors-changes-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vendors' },
        () => fetchVendors()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchVendors]);

  async function addVendor(vendor: InsertTables<'vendors'>) {
    if (!workspaceId) {
      toast.error('Pick a workspace first');
      return null;
    }
    const { data, error } = await supabase
      .from('vendors')
      .insert({ ...vendor, workspace_id: workspaceId })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return null;
    }
    toast.success(`${data?.name} added`);
    return data;
  }

  async function updateVendor(id: string, updates: UpdateTables<'vendors'>) {
    const { error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success('Vendor updated');
    return true;
  }

  async function deleteVendor(id: string) {
    const { error } = await supabase.from('vendors').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success('Vendor removed');
    return true;
  }

  return {
    vendors,
    loading,
    workspaceId,
    addVendor,
    updateVendor,
    deleteVendor,
    refresh: fetchVendors,
  };
}
