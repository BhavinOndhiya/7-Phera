import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Append an entry to admin_audit_log. Silently swallows errors so that audit
 * logging never breaks the parent request.
 */
export async function logAdminAction(opts: {
  actorId: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  try {
    const admin = createServiceRoleClient();
    await admin.from('admin_audit_log').insert({
      actor_id: opts.actorId,
      action: opts.action,
      target_type: opts.targetType ?? null,
      target_id: opts.targetId ?? null,
      metadata: (opts.metadata ?? null) as never,
    });
  } catch (e) {
    console.error('[audit] log failed', e);
  }
}

export async function requireSuperadmin(userId: string | null): Promise<{
  ok: true;
} | {
  ok: false;
  status: number;
  error: string;
}> {
  if (!userId) {
    return { ok: false, status: 401, error: 'Not authenticated' };
  }
  const admin = createServiceRoleClient();
  const { data: profile } = await admin
    .from('users')
    .select('is_superadmin')
    .eq('id', userId)
    .maybeSingle();
  if (!profile?.is_superadmin) {
    return { ok: false, status: 403, error: 'Superadmin only' };
  }
  return { ok: true };
}
