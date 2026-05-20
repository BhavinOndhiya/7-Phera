'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useOptionalWorkspace } from '@/lib/hooks/useWorkspace';
import type {
  BudgetItem,
  BudgetCategory,
  Vendor,
  Payment,
  InsertTables,
  UpdateTables,
} from '@/lib/types/database.types';

export function useBudget(eventId?: string) {
  const supabase = createClient();
  const ws = useOptionalWorkspace();
  const workspaceId = ws?.activeWorkspaceId ?? null;
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!workspaceId && !eventId) {
      setBudgetItems([]);
      setCategories([]);
      setVendors([]);
      setLoading(false);
      return;
    }
    let itemsQuery;
    if (eventId) {
      itemsQuery = supabase.from('budget_items').select('*').eq('event_id', eventId);
    } else if (workspaceId) {
      itemsQuery = supabase
        .from('budget_items')
        .select('*')
        .eq('workspace_id', workspaceId);
    } else {
      itemsQuery = supabase.from('budget_items').select('*').eq('id', '__none__');
    }

    const vendorsQuery = workspaceId
      ? supabase
          .from('vendors')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('name')
      : supabase.from('vendors').select('*').order('name');

    const [itemsResult, catResult, vendorResult] = await Promise.all([
      itemsQuery,
      supabase
        .from('budget_categories')
        .select('*')
        .order('sort_order'),
      vendorsQuery,
    ]);

    if (itemsResult.error) toast.error(itemsResult.error.message);
    else setBudgetItems(itemsResult.data ?? []);

    if (catResult.error) toast.error(catResult.error.message);
    else setCategories(catResult.data ?? []);

    if (vendorResult.error) toast.error(vendorResult.error.message);
    else setVendors(vendorResult.data ?? []);

    setLoading(false);
  }, [supabase, eventId, workspaceId]);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel(`budget-changes-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budget_items' },
        () => fetchAll()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => fetchAll()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchAll]);

  async function addItem(item: InsertTables<'budget_items'>) {
    if (!workspaceId) {
      toast.error('Pick a workspace first');
      return null;
    }
    const { data, error } = await supabase
      .from('budget_items')
      .insert({ ...item, workspace_id: workspaceId })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return null;
    }
    toast.success('Item added');
    return data;
  }

  async function updateItem(id: string, updates: UpdateTables<'budget_items'>) {
    const { error } = await supabase
      .from('budget_items')
      .update(updates)
      .eq('id', id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success('Item updated');
    return true;
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from('budget_items').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success('Item deleted');
    return true;
  }

  async function addPayment(payment: InsertTables<'payments'>) {
    const { data, error } = await supabase
      .from('payments')
      .insert(payment)
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return null;
    }
    toast.success('Payment recorded');
    return data;
  }

  return {
    budgetItems,
    categories,
    vendors,
    loading,
    workspaceId,
    addItem,
    updateItem,
    deleteItem,
    addPayment,
    refresh: fetchAll,
  };
}

export function usePayments(budgetItemId: string | null) {
  const supabase = createClient();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!budgetItemId) {
      setPayments([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('budget_item_id', budgetItemId)
      .order('payment_date', { ascending: false });
    if (error) toast.error(error.message);
    else setPayments(data ?? []);
    setLoading(false);
  }, [supabase, budgetItemId]);

  useEffect(() => {
    fetch();
    if (!budgetItemId) return;
    const channel = supabase
      .channel(`payments-${budgetItemId}-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `budget_item_id=eq.${budgetItemId}`,
        },
        () => fetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [budgetItemId, supabase, fetch]);

  return { payments, loading, refresh: fetch };
}
