import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

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
  const token = String(body?.token ?? '').trim();
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  const { data: invite } = await admin
    .from('workspace_invitations')
    .select('id, workspace_id, email, role, expires_at, accepted_at')
    .eq('token', token)
    .maybeSingle();

  if (!invite) {
    return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
  }
  if (invite.accepted_at) {
    return NextResponse.json(
      { error: 'This invitation has already been used' },
      { status: 409 }
    );
  }
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json(
      { error: 'This invitation has expired' },
      { status: 410 }
    );
  }

  const userEmail = (user.email ?? '').toLowerCase();
  if (userEmail && invite.email.toLowerCase() !== userEmail) {
    return NextResponse.json(
      { error: `This invitation was sent to ${invite.email}` },
      { status: 403 }
    );
  }

  const { error: memberErr } = await admin
    .from('workspace_members')
    .upsert(
      {
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: invite.role,
        invited_by: null,
      },
      { onConflict: 'workspace_id,user_id' }
    );

  if (memberErr) {
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  await admin
    .from('workspace_invitations')
    .update({
      accepted_at: new Date().toISOString(),
      accepted_by: user.id,
    })
    .eq('id', invite.id);

  return NextResponse.json({
    ok: true,
    workspaceId: invite.workspace_id,
    role: invite.role,
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const { data: invite } = await admin
    .from('workspace_invitations')
    .select('email, role, workspace_id, expires_at, accepted_at')
    .eq('token', token)
    .maybeSingle();

  if (!invite) {
    return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
  }

  const { data: workspace } = await admin
    .from('workspaces')
    .select('name')
    .eq('id', invite.workspace_id)
    .maybeSingle();

  return NextResponse.json({
    email: invite.email,
    role: invite.role,
    workspaceId: invite.workspace_id,
    workspaceName: workspace?.name ?? 'Workspace',
    expiresAt: invite.expires_at,
    accepted: !!invite.accepted_at,
  });
}
