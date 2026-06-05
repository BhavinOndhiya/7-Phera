'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import { useOptionalWorkspace } from '@/lib/hooks/useWorkspace';

type NotificationReadState = {
  pendingGuests: number;
  openTasks: number;
  readAt: number;
};

function readStorageKey(workspaceId: string) {
  return `mp-notifications-read-${workspaceId}`;
}

function loadReadState(workspaceId: string): NotificationReadState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(readStorageKey(workspaceId));
    if (!raw) return null;
    return JSON.parse(raw) as NotificationReadState;
  } catch {
    return null;
  }
}

export function NotificationBell() {
  const ws = useOptionalWorkspace();
  const workspaceId = ws?.activeWorkspaceId ?? null;
  const [pendingGuests, setPendingGuests] = useState(0);
  const [openTasks, setOpenTasks] = useState(0);
  const [readState, setReadState] = useState<NotificationReadState | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setReadState(null);
      return;
    }
    setReadState(loadReadState(workspaceId));
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) {
      setPendingGuests(0);
      setOpenTasks(0);
      return;
    }

    const supabase = createClient();

    async function load() {
      const wsId = workspaceId;
      if (!wsId) return;
      const [{ count: guestCount }, { count: taskCount }] = await Promise.all([
        supabase
          .from('guests')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', wsId)
          .eq('rsvp_status', 'pending'),
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', wsId)
          .in('status', ['todo', 'in_progress']),
      ]);
      setPendingGuests(guestCount ?? 0);
      setOpenTasks(taskCount ?? 0);
    }

    load();
  }, [workspaceId]);

  const unreadGuests = readState
    ? Math.max(0, pendingGuests - readState.pendingGuests)
    : pendingGuests;
  const unreadTasks = readState
    ? Math.max(0, openTasks - readState.openTasks)
    : openTasks;
  const hasUnread = unreadGuests > 0 || unreadTasks > 0;

  const markAllRead = useCallback(() => {
    if (!workspaceId) return;
    const next: NotificationReadState = {
      pendingGuests,
      openTasks,
      readAt: Date.now(),
    };
    localStorage.setItem(readStorageKey(workspaceId), JSON.stringify(next));
    setReadState(next);
  }, [workspaceId, pendingGuests, openTasks]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Quick alerts</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hasUnread ? (
          <>
            {unreadGuests > 0 && (
              <DropdownMenuItem asChild>
                <Link href="/guests">
                  {unreadGuests} guest{unreadGuests === 1 ? '' : 's'} RSVP pending
                </Link>
              </DropdownMenuItem>
            )}
            {unreadTasks > 0 && (
              <DropdownMenuItem asChild>
                <Link href="/tasks">
                  {unreadTasks} open task{unreadTasks === 1 ? '' : 's'}
                </Link>
              </DropdownMenuItem>
            )}
          </>
        ) : (
          <DropdownMenuItem disabled>All caught up</DropdownMenuItem>
        )}
        {(pendingGuests > 0 || openTasks > 0) && hasUnread && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                markAllRead();
              }}
              className="text-rose-600 focus:text-rose-600"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
