import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { brand, workspaceInvitation } from '@/lib/emails';
import type { WorkspaceRole } from '@/lib/types/database.types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const workspaceId = String(body?.workspaceId ?? '');
  const email = String(body?.email ?? '').trim().toLowerCase();
  const role = (String(body?.role ?? 'editor') as WorkspaceRole) ?? 'editor';

  if (!workspaceId || !email) {
    return NextResponse.json(
      { error: 'workspaceId and email required' },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }
  if (!['owner', 'editor', 'viewer'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const { data: caller } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, is_superadmin')
    .eq('id', user.id)
    .maybeSingle();

  if (caller?.role !== 'owner' && !profile?.is_superadmin) {
    return NextResponse.json(
      { error: 'Only workspace owners can invite members' },
      { status: 403 }
    );
  }

  const admin = createServiceRoleClient();

  const { data: workspace } = await admin
    .from('workspaces')
    .select('name')
    .eq('id', workspaceId)
    .maybeSingle();
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const token = randomBytes(24).toString('base64url');
  const { data: invitation, error: inviteErr } = await admin
    .from('workspace_invitations')
    .upsert(
      {
        workspace_id: workspaceId,
        email,
        role,
        token,
        invited_by: user.id,
        accepted_at: null,
        accepted_by: null,
        expires_at: new Date(Date.now() + 14 * 86400 * 1000).toISOString(),
      },
      { onConflict: 'workspace_id,email' }
    )
    .select('id, token')
    .single();

  if (inviteErr || !invitation) {
    return NextResponse.json(
      { error: inviteErr?.message ?? 'Failed to create invitation' },
      { status: 500 }
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const acceptUrl = `${origin}/invite/accept?token=${invitation.token}`;

  let emailSent = false;
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromAddress =
        process.env.RESEND_FROM ?? `${brand.name} <invitations@resend.dev>`;
      await resend.emails.send({
        from: fromAddress,
        to: email,
        subject: `${profile?.full_name ?? 'Someone'} invited you to ${workspace.name}`,
        html: workspaceInvitation({
          inviterName: profile?.full_name ?? 'A friend',
          workspaceName: workspace.name,
          role,
          acceptUrl,
        }),
      });
      emailSent = true;
    } catch (e) {
      console.error('[invite] email send failed', e);
    }
  }

  return NextResponse.json({
    ok: true,
    invitation: { id: invitation.id, token: invitation.token },
    acceptUrl,
    emailSent,
  });
}
