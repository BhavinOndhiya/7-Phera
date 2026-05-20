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
  const userId = String(body?.userId ?? '');
  const value = !!body?.value;

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  if (action === 'toggle_superadmin') {
    if (user!.id === userId && value === false) {
      return NextResponse.json(
        { error: 'You cannot revoke your own superadmin flag' },
        { status: 400 }
      );
    }
    const { error } = await admin
      .from('users')
      .update({ is_superadmin: value })
      .eq('id', userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await logAdminAction({
      actorId: user!.id,
      action: value ? 'user.grant_superadmin' : 'user.revoke_superadmin',
      targetType: 'user',
      targetId: userId,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'toggle_suspend') {
    if (user!.id === userId && value === true) {
      return NextResponse.json(
        { error: 'You cannot suspend yourself' },
        { status: 400 }
      );
    }
    const { error } = await admin
      .from('users')
      .update({ is_suspended: value })
      .eq('id', userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await logAdminAction({
      actorId: user!.id,
      action: value ? 'user.suspend' : 'user.unsuspend',
      targetType: 'user',
      targetId: userId,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
