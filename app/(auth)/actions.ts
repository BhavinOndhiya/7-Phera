'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { loginSchema, signupSchema } from '@/lib/utils/validation';
import { resolveAppOrigin } from '@/lib/utils/appUrl';

export type ActionResult =
  | { ok: true; redirectTo?: string; needsEmailConfirmation?: boolean }
  | { ok: false; error: string };

function parseSuperadminEmails(): Set<string> {
  return new Set(
    (process.env.SUPERADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Ensure user has at least one workspace; create personal one if not.
 * Also seeds is_superadmin from SUPERADMIN_EMAILS env var (idempotent).
 * Uses the service role so it works even before email confirmation.
 */
async function bootstrapUser(opts: {
  userId: string;
  email: string;
  fullName: string;
}) {
  const admin = createServiceRoleClient();

  const superadminEmails = parseSuperadminEmails();
  if (superadminEmails.has(opts.email.toLowerCase())) {
    await admin
      .from('users')
      .update({ is_superadmin: true })
      .eq('id', opts.userId);
  }

  const { data: existing } = await admin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', opts.userId)
    .limit(1);

  if (existing && existing.length > 0) return;

  const { data: ws, error: wsErr } = await admin
    .from('workspaces')
    .insert({
      name: `${opts.fullName || 'My'}'s Wedding`,
      created_by: opts.userId,
    })
    .select('id')
    .single();

  if (wsErr || !ws) {
    console.error('[bootstrapUser] workspace create failed', wsErr);
    return;
  }

  await admin.from('workspace_members').insert({
    workspace_id: ws.id,
    user_id: opts.userId,
    role: 'owner',
    invited_by: opts.userId,
  });
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, error: error.message };
  }

  if (data.user) {
    try {
      await bootstrapUser({
        userId: data.user.id,
        email: data.user.email ?? parsed.data.email,
        fullName:
          (data.user.user_metadata?.full_name as string | undefined) ??
          parsed.data.email.split('@')[0],
      });
    } catch (e) {
      console.error('[loginAction] bootstrap failed', e);
    }
  }

  revalidatePath('/', 'layout');
  return { ok: true, redirectTo: '/dashboard' };
}

export async function signupAction(formData: FormData): Promise<ActionResult> {
  const inviteToken = String(formData.get('invite_token') ?? '').trim() || null;
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    full_name: formData.get('full_name'),
    role: formData.get('role'),
    phone: formData.get('phone') || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = createClient();
  const origin = resolveAppOrigin();
  const nextAfterConfirm = inviteToken
    ? `/invite/accept?token=${encodeURIComponent(inviteToken)}`
    : '/dashboard';
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextAfterConfirm)}`,
      data: {
        full_name: parsed.data.full_name,
        role: parsed.data.role,
        phone: parsed.data.phone ?? null,
      },
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (data.user) {
    try {
      await bootstrapUser({
        userId: data.user.id,
        email: parsed.data.email,
        fullName: parsed.data.full_name,
      });
    } catch (e) {
      console.error('[signupAction] bootstrap failed', e);
    }
  }

  if (data.session) {
    revalidatePath('/', 'layout');
    if (inviteToken) {
      return { ok: true, redirectTo: `/invite/accept?token=${inviteToken}` };
    }
    return { ok: true, redirectTo: '/dashboard' };
  }

  const confirmMsg =
    'We sent a confirmation link to your email. Open it (check spam), then sign in.' +
    (inviteToken ? ' Your workspace invite will work after that.' : '');
  return {
    ok: true,
    needsEmailConfirmation: true,
    redirectTo: `/login?message=${encodeURIComponent(confirmMsg)}${
      inviteToken ? `&invite=${inviteToken}` : ''
    }`,
  };
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function forgotPasswordAction(
  formData: FormData
): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '');
  if (!email) return { ok: false, error: 'Email required' };

  const supabase = createClient();
  const origin = resolveAppOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function resetPasswordAction(
  formData: FormData
): Promise<ActionResult> {
  const password = String(formData.get('password') ?? '');
  if (password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath('/', 'layout');
  return { ok: true, redirectTo: '/dashboard' };
}
