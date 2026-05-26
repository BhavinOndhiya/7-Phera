'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
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

export function NotificationBell() {
  const ws = useOptionalWorkspace();
  const workspaceId = ws?.activeWorkspaceId ?? null;
  const [pendingGuests, setPendingGuests] = useState(0);
  const [openTasks, setOpenTasks] = useState(0);

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

  const total = pendingGuests + openTasks;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {total > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {total > 9 ? '9+' : total}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Quick alerts</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/guests">
            {pendingGuests} guest{pendingGuests === 1 ? '' : 's'} RSVP pending
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/tasks">
            {openTasks} open task{openTasks === 1 ? '' : 's'}
          </Link>
        </DropdownMenuItem>
        {total === 0 && (
          <DropdownMenuItem disabled>All caught up</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
