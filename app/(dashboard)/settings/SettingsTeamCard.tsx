'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Crown, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { roleLabel } from '@/lib/utils/permissions';

export function SettingsTeamCard() {
  const supabase = createClient();
  const { activeWorkspace, activeWorkspaceId, activeRole } = useWorkspace();
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [pendingInvites, setPendingInvites] = useState(0);

  useEffect(() => {
    if (!activeWorkspaceId) {
      setMemberCount(null);
      setPendingInvites(0);
      return;
    }
    (async () => {
      const [{ count: members }, { count: invites }] = await Promise.all([
        supabase
          .from('workspace_members')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', activeWorkspaceId),
        supabase
          .from('workspace_invitations')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', activeWorkspaceId)
          .is('accepted_at', null),
      ]);
      setMemberCount(members ?? 0);
      setPendingInvites(invites ?? 0);
    })();
  }, [supabase, activeWorkspaceId]);

  if (!activeWorkspace) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Select a wedding workspace in the header to see who has access.
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href="/settings/collaborators" className="block group">
      <Card className="transition-colors hover:border-rose-200 hover:shadow-md">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6 text-rose-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">Members & access</p>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {activeWorkspace.name}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {memberCount === null ? '…' : memberCount}{' '}
                {memberCount === 1 ? 'person' : 'people'} with access
              </Badge>
              {pendingInvites > 0 && (
                <Badge variant="outline" className="text-amber-700 border-amber-200">
                  {pendingInvites} pending invite
                  {pendingInvites === 1 ? '' : 's'}
                </Badge>
              )}
              <Badge variant="outline" className="gap-1 capitalize">
                <Crown className="h-3 w-3" />
                You: {roleLabel(activeRole ?? 'viewer')}
              </Badge>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-rose-600 shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}
