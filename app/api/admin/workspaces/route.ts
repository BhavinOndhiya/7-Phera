import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { logAdminAction, requireSuperadmin } from '@/lib/utils/audit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const gate = await requireSuperadmin(user?.id ?? null);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body?.action ?? '');
  const workspaceId = String(body?.workspaceId ?? '');

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  if (action === 'delete') {
    const { data: ws } = await admin
      .from('workspaces')
      .select('name')
      .eq('id', workspaceId)
      .maybeSingle();
    const { error } = await admin
      .from('workspaces')
      .delete()
      .eq('id', workspaceId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await logAdminAction({
      actorId: user!.id,
      action: 'workspace.delete',
      targetType: 'workspace',
      targetId: workspaceId,
      metadata: { name: ws?.name ?? null },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
