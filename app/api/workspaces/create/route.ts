import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
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
  const name = String(body?.name ?? '').trim();
  const partnerEmail = body?.partner_email
    ? String(body.partner_email).trim().toLowerCase()
    : null;

  if (name.length < 2) {
    return NextResponse.json(
      { error: 'Workspace name must be at least 2 characters' },
      { status: 400 }
    );
  }

  const admin = createServiceRoleClient();

  const { data: ws, error: wsErr } = await admin
    .from('workspaces')
    .insert({ name, created_by: user.id })
    .select('id')
    .single();

  if (wsErr || !ws) {
    return NextResponse.json(
      { error: wsErr?.message ?? 'Failed to create workspace' },
      { status: 500 }
    );
  }

  const { error: memberErr } = await admin.from('workspace_members').insert({
    workspace_id: ws.id,
    user_id: user.id,
    role: 'owner',
    invited_by: user.id,
  });

  if (memberErr) {
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  let invitation: { token: string; id: string } | null = null;
  if (partnerEmail) {
    const token = randomBytes(24).toString('base64url');
    const { data, error } = await admin
      .from('workspace_invitations')
      .insert({
        workspace_id: ws.id,
        email: partnerEmail,
        role: 'owner',
        token,
        invited_by: user.id,
      })
      .select('id, token')
      .single();
    if (!error && data) invitation = data;
  }

  return NextResponse.json({
    workspaceId: ws.id,
    invitation,
  });
}
