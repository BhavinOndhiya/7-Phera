'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import {
  Crown,
  Loader2,
  Mail,
  Pencil,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useConfirm } from '@/components/ui/confirm-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { EmptyState } from '@/components/shared/EmptyState';
import { roleDescription, roleLabel } from '@/lib/utils/permissions';
import { buildAppUrl } from '@/lib/utils/appUrl';
import type {
  UserProfile,
  WorkspaceInvitation,
  WorkspaceMember,
  WorkspaceRole,
} from '@/lib/types/database.types';

interface MemberRow {
  member: WorkspaceMember;
  profile: UserProfile | null;
}

export default function CollaboratorsPage() {
  const supabase = createClient();
  const { confirm } = useConfirm();
  const { activeWorkspace, activeWorkspaceId, can, isSuperadmin } = useWorkspace();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('editor');
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const canManage = can('manage_members');

  useEffect(() => {
    if (!activeWorkspaceId) {
      setMembers([]);
      setInvitations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const [{ data: m }, { data: inv }] = await Promise.all([
        supabase
          .from('workspace_members')
          .select('*')
          .eq('workspace_id', activeWorkspaceId),
        supabase
          .from('workspace_invitations')
          .select('*')
          .eq('workspace_id', activeWorkspaceId)
          .is('accepted_at', null),
      ]);

      const userIds = (m ?? []).map((row) => row.user_id);
      const { data: profiles } = userIds.length
        ? await supabase.from('users').select('*').in('id', userIds)
        : { data: [] };

      const memberRows: MemberRow[] = (m ?? []).map((row) => ({
        member: row,
        profile: profiles?.find((p) => p.id === row.user_id) ?? null,
      }));
      setMembers(memberRows);

      const memberEmails = new Set(
        memberRows
          .map((r) => r.profile?.email?.toLowerCase())
          .filter((e): e is string => Boolean(e))
      );

      const staleIds = (inv ?? [])
        .filter(
          (i) =>
            !i.accepted_at && memberEmails.has(i.email.toLowerCase())
        )
        .map((i) => i.id);

      if (staleIds.length > 0 && canManage) {
        const now = new Date().toISOString();
        await Promise.all(
          staleIds.map((id) =>
            supabase
              .from('workspace_invitations')
              .update({ accepted_at: now })
              .eq('id', id)
          )
        );
      }

      setInvitations(
        (inv ?? []).filter(
          (i) =>
            !i.accepted_at &&
            !memberEmails.has(i.email.toLowerCase())
        )
      );
      setLoading(false);
    })();
  }, [supabase, activeWorkspaceId, canManage]);

  function invite() {
    if (!activeWorkspaceId) {
      toast.error('No workspace selected');
      return;
    }
    if (!email) {
      toast.error('Email is required');
      return;
    }
    startTransition(async () => {
      const res = await fetch('/api/workspaces/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          email,
          role,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? 'Invite failed');
        return;
      }
      if (json.alreadyMember) {
        toast.info(
          json.message ?? `${email} is already in this workspace — not pending.`
        );
      } else {
        toast.success(
          json.emailSent
            ? `Invitation emailed to ${email}`
            : `Invitation created — copy the link and send it to them.`
        );
      }
      setEmail('');
      const { data: inv } = await supabase
        .from('workspace_invitations')
        .select('*')
        .eq('workspace_id', activeWorkspaceId)
        .is('accepted_at', null);
      setInvitations(inv ?? []);
    });
  }

  async function changeRole(userId: string, newRole: WorkspaceRole) {
    if (!activeWorkspaceId) return;
    const { error } = await supabase
      .from('workspace_members')
      .update({ role: newRole })
      .eq('workspace_id', activeWorkspaceId)
      .eq('user_id', userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMembers((prev) =>
      prev.map((r) =>
        r.member.user_id === userId
          ? { ...r, member: { ...r.member, role: newRole } }
          : r
      )
    );
    toast.success('Role updated');
  }

  async function removeMember(userId: string) {
    if (!activeWorkspaceId) return;
    const ok = await confirm({
      title: 'Remove member',
      description: 'Remove this member from the workspace? They will lose access immediately.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (!ok) return;
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', activeWorkspaceId)
      .eq('user_id', userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMembers((prev) => prev.filter((r) => r.member.user_id !== userId));
    toast.success('Member removed');
  }

  async function cancelInvite(id: string) {
    const { error } = await supabase
      .from('workspace_invitations')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setInvitations((prev) => prev.filter((i) => i.id !== id));
    toast.success('Invitation cancelled');
  }

  function copyInviteLink(token: string) {
    const url = buildAppUrl(`/invite/accept?token=${token}`);
    navigator.clipboard.writeText(url);
    toast.success('Invite link copied to clipboard');
  }

  if (!activeWorkspace) {
    return (
      <EmptyState
        icon={Users}
        title="Pick a workspace first"
        description="Use the workspace switcher in the header to choose a wedding to manage."
      />
    );
  }

  const ownerCount = members.filter((r) => r.member.role === 'owner').length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to settings
        </Link>
        <h1 className="font-serif text-3xl font-semibold">Members & roles</h1>
        <p className="text-muted-foreground mt-1">
          Manage who can access <strong>{activeWorkspace.name}</strong>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-rose-500" /> Invite someone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canManage && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
              Only workspace owners can invite or manage members.
            </div>
          )}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="family@example.com"
                  disabled={!canManage}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as WorkspaceRole)}
                disabled={!canManage}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner (co-own)</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer (read-only)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {roleDescription(role)}
              </p>
            </div>
          </div>
          <Button
            onClick={invite}
            disabled={isPending || !canManage}
            className="bg-rose-500 hover:bg-rose-600"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send invitation
          </Button>
          <p className="text-xs text-muted-foreground">
            We email a join link via Resend. Set <code>RESEND_API_KEY</code> and{' '}
            <code>NEXT_PUBLIC_APP_URL</code> in env to enable email delivery; without
            it you&apos;ll just copy the invite link.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-rose-500" /> Members
            <Badge variant="secondary">{members.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : members.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No members yet"
              description="Invite people above to share planning."
            />
          ) : (
            <div className="divide-y -m-6">
              {members.map(({ member, profile }) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-4 gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {profile?.full_name ?? 'Unknown'}
                      {member.role === 'owner' && (
                        <Crown className="inline h-3.5 w-3.5 text-amber-500 ml-1 -mt-0.5" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {profile?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canManage ? (
                      <Select
                        value={member.role}
                        onValueChange={(v) =>
                          changeRole(member.user_id, v as WorkspaceRole)
                        }
                        disabled={member.role === 'owner' && ownerCount === 1}
                      >
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="capitalize">
                        {roleLabel(member.role)}
                      </Badge>
                    )}
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive h-8 w-8"
                        onClick={() => removeMember(member.user_id)}
                        disabled={member.role === 'owner' && ownerCount === 1}
                        title={
                          member.role === 'owner' && ownerCount === 1
                            ? "Can't remove the only owner"
                            : 'Remove'
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-rose-500" /> Pending invitations
              <Badge variant="secondary">{invitations.length}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground font-normal mt-2">
              Pending means they have <strong>not opened the invite link</strong> and
              clicked <strong>Accept invitation</strong> while signed in as that email.
              Signing up alone does not join your workspace.
            </p>
          </CardHeader>
          <CardContent>
            <div className="divide-y -m-6">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-4 gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited as {inv.role} · expires{' '}
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyInviteLink(inv.token)}
                    >
                      <Pencil className="h-3 w-3 mr-1" /> Copy link
                    </Button>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive h-8 w-8"
                        onClick={() => cancelInvite(inv.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isSuperadmin && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
          <strong>Superadmin note:</strong> You can manage any workspace from the{' '}
          <a href="/admin/workspaces" className="underline">
            admin panel
          </a>
          .
        </div>
      )}
    </div>
  );
}
