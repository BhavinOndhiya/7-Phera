'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { can as canDo, type WorkspaceAction } from '@/lib/utils/permissions';
import type {
  Workspace,
  WorkspaceRole,
} from '@/lib/types/database.types';

export interface WorkspaceMembership {
  workspace: Workspace;
  role: WorkspaceRole;
}

interface WorkspaceContextValue {
  activeWorkspaceId: string | null;
  activeWorkspace: Workspace | null;
  activeRole: WorkspaceRole | null;
  isSuperadmin: boolean;
  memberships: WorkspaceMembership[];
  loading: boolean;
  refresh: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  can: (action: WorkspaceAction) => boolean;
}

const COOKIE_KEY = 'active_workspace_id';
const COOKIE_DAYS = 365;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + COOKIE_DAYS * 86400 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const router = useRouter();
  const [memberships, setMemberships] = useState<WorkspaceMembership[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMemberships([]);
      setActiveWorkspaceId(null);
      setIsSuperadmin(false);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('users')
      .select('is_superadmin')
      .eq('id', user.id)
      .maybeSingle();
    setIsSuperadmin(profile?.is_superadmin ?? false);

    const { data: members } = await supabase
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', user.id);

    if (!members || members.length === 0) {
      setMemberships([]);
      setActiveWorkspaceId(null);
      setLoading(false);
      return;
    }

    const ids = members.map((m) => m.workspace_id);
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('*')
      .in('id', ids);

    const rows: WorkspaceMembership[] = (workspaces ?? [])
      .map((w) => {
        const m = members.find((mm) => mm.workspace_id === w.id);
        return m ? { workspace: w, role: m.role as WorkspaceRole } : null;
      })
      .filter((x): x is WorkspaceMembership => x !== null)
      .sort((a, b) => a.workspace.name.localeCompare(b.workspace.name));

    setMemberships(rows);

    const cookieId = readCookie(COOKIE_KEY);
    const selectedId =
      (cookieId && rows.some((r) => r.workspace.id === cookieId)
        ? cookieId
        : null) ?? rows[0]?.workspace.id ?? null;

    if (selectedId) {
      writeCookie(COOKIE_KEY, selectedId);
      setActiveWorkspaceId(selectedId);
    } else {
      setActiveWorkspaceId(null);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!mounted) return;
      if (!session) {
        setMemberships([]);
        setActiveWorkspaceId(null);
        setIsSuperadmin(false);
      } else {
        load();
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [load, supabase]);

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      const found = memberships.find((m) => m.workspace.id === workspaceId);
      if (!found && !isSuperadmin) {
        toast.error('You are not a member of that workspace');
        return;
      }
      writeCookie(COOKIE_KEY, workspaceId);
      setActiveWorkspaceId(workspaceId);
      router.refresh();
    },
    [memberships, isSuperadmin, router]
  );

  const activeWorkspace = useMemo(
    () =>
      memberships.find((m) => m.workspace.id === activeWorkspaceId)?.workspace ??
      null,
    [memberships, activeWorkspaceId]
  );

  const activeRole = useMemo(
    () =>
      memberships.find((m) => m.workspace.id === activeWorkspaceId)?.role ?? null,
    [memberships, activeWorkspaceId]
  );

  const can = useCallback(
    (action: WorkspaceAction) => canDo(activeRole, action, { isSuperadmin }),
    [activeRole, isSuperadmin]
  );

  const value: WorkspaceContextValue = {
    activeWorkspaceId,
    activeWorkspace,
    activeRole,
    isSuperadmin,
    memberships,
    loading,
    refresh: load,
    switchWorkspace,
    can,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used inside WorkspaceProvider');
  }
  return ctx;
}

export function useOptionalWorkspace(): WorkspaceContextValue | null {
  return useContext(WorkspaceContext);
}
