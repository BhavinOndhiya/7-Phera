import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { WorkspaceRole } from '@/lib/types/database.types';

export const runtime = 'nodejs';

function renderInviteEmail({
  inviterName,
  workspaceName,
  role,
  acceptUrl,
}: {
  inviterName: string;
  workspaceName: string;
  role: string;
  acceptUrl: string;
}) {
  return `
  <div style="font-family: Georgia, serif; max-width: 560px; margin: auto; color: #1f2937;">
    <div style="background: linear-gradient(135deg, #fff1f2 0%, #fdf6e3 100%); padding: 32px; text-align: center; border-radius: 16px;">
      <p style="color: #be185d; letter-spacing: 4px; text-transform: uppercase; font-size: 12px; margin: 0;">You're invited</p>
      <h1 style="font-size: 30px; margin: 12px 0 6px; color: #9f1239;">${workspaceName}</h1>
      <p style="color: #6b7280; margin: 0;">${inviterName} wants you to help plan their wedding</p>
    </div>
    <div style="padding: 28px 4px;">
      <p>Hi there,</p>
      <p>${inviterName} has invited you to join <strong>${workspaceName}</strong> on 7-Phera as a <strong>${role}</strong>.</p>
      <p style="text-align: center; margin: 28px 0;">
        <a href="${acceptUrl}" style="display: inline-block; background: #fb2e63; color: white; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-family: sans-serif; font-weight: 600;">Accept invitation</a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">If the button doesn't work, copy this link:<br/>
        <a href="${acceptUrl}" style="color: #be185d; word-break: break-all;">${acceptUrl}</a>
      </p>
      <p style="color: #9ca3af; font-size: 12px;">This invitation expires in 14 days.</p>
    </div>
  </div>`;
}

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
        process.env.RESEND_FROM ?? '7-Phera <invitations@resend.dev>';
      await resend.emails.send({
        from: fromAddress,
        to: email,
        subject: `${profile?.full_name ?? 'Someone'} invited you to ${workspace.name}`,
        html: renderInviteEmail({
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
