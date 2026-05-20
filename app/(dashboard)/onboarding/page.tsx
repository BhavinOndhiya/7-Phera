'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Heart, Loader2, Mail, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useWorkspace } from '@/lib/hooks/useWorkspace';

interface PendingInvite {
  id: string;
  workspace_id: string;
  workspace_name: string;
  role: string;
  token: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const search = useSearchParams();
  const supabase = createClient();
  const { memberships, refresh, switchWorkspace, loading } = useWorkspace();
  const [name, setName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? null);
      const { data } = await supabase
        .from('workspace_invitations')
        .select('id, workspace_id, role, token')
        .eq('email', user.email ?? '')
        .is('accepted_at', null);
      const wsIds = (data ?? []).map((d) => d.workspace_id);
      const { data: wsRows } = wsIds.length
        ? await supabase.from('workspaces').select('id, name').in('id', wsIds)
        : { data: [] };
      const nameById = new Map(
        (wsRows ?? []).map((w) => [w.id, w.name])
      );
      const rows: PendingInvite[] = (data ?? []).map((r) => ({
        id: r.id,
        workspace_id: r.workspace_id,
        role: r.role,
        token: r.token,
        workspace_name: nameById.get(r.workspace_id) ?? 'Workspace',
      }));
      setInvites(rows);
    })();
  }, [supabase]);

  useEffect(() => {
    if (!loading && memberships.length > 0 && !search.get('force')) {
      router.replace('/dashboard');
    }
  }, [loading, memberships, router, search]);

  function createWorkspace() {
    if (!name.trim()) {
      toast.error('Please give your wedding a name');
      return;
    }
    startTransition(async () => {
      const res = await fetch('/api/workspaces/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          partner_email: partnerName.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? 'Failed to create workspace');
        return;
      }
      toast.success('Workspace created');
      await refresh();
      if (json.workspaceId) await switchWorkspace(json.workspaceId);
      router.replace('/dashboard');
    });
  }

  function acceptInvite(invite: PendingInvite) {
    startTransition(async () => {
      const res = await fetch('/api/workspaces/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: invite.token }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? 'Could not join workspace');
        return;
      }
      toast.success(`Joined ${invite.workspace_name}`);
      await refresh();
      if (json.workspaceId) await switchWorkspace(json.workspaceId);
      router.replace('/dashboard');
    });
  }

  return (
    <div className="max-w-3xl mx-auto py-8 animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-100 mb-4">
          <Heart className="h-7 w-7 text-rose-500" />
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold">
          Welcome to 7-Phera
        </h1>
        <p className="text-muted-foreground mt-2">
          Let&apos;s set up your wedding workspace.
        </p>
        {email && (
          <p className="text-xs text-muted-foreground mt-1">Signed in as {email}</p>
        )}
      </div>

      {invites.length > 0 && (
        <Card className="mb-6 border-rose-200 bg-rose-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-900">
              <Mail className="h-5 w-5" /> You have {invites.length} pending invitation
              {invites.length > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white border"
              >
                <div>
                  <p className="font-medium">{inv.workspace_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    Invited as {inv.role}
                  </p>
                </div>
                <Button
                  onClick={() => acceptInvite(inv)}
                  disabled={isPending}
                  className="bg-rose-500 hover:bg-rose-600"
                >
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Join
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-rose-500" /> Create your wedding workspace
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ws_name">
              Wedding name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ws_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bhavin & Riya's Wedding"
            />
            <p className="text-xs text-muted-foreground">
              You can change this any time in settings.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="partner_email">Partner&apos;s email (optional)</Label>
            <Input
              id="partner_email"
              type="email"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="partner@example.com"
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll send them an invite to co-own the workspace.
            </p>
          </div>
          <Button
            onClick={createWorkspace}
            disabled={isPending}
            className="w-full bg-rose-500 hover:bg-rose-600"
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create workspace
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
