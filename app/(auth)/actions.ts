'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import {
  sendAccountConfirmationEmail,
  sendPasswordRecoveryEmail,
} from '@/lib/emails/sendAuthEmail';
import { loginSchema, signupSchema } from '@/lib/utils/validation';
import { authCallbackUrl, rewriteAuthActionLink } from '@/lib/utils/authLinks';

export type ActionResult =
  | { ok: true; redirectTo?: string; needsEmailConfirmation?: boolean; message?: string }
  | { ok: false; error: string; hint?: 'resend_confirmation' };

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
    const msg = error.message;
    const needsConfirmation =
      /email not confirmed|confirm your email|email_not_confirmed/i.test(msg);
    if (needsConfirmation) {
      return {
        ok: false,
        error:
          'Please confirm your email first. Check your inbox (and spam), or resend the confirmation link below.',
        hint: 'resend_confirmation',
      };
    }
    if (/invalid login credentials/i.test(msg)) {
      return {
        ok: false,
        error:
          'Invalid email or password. If you just signed up, confirm your email first (or resend below).',
        hint: 'resend_confirmation',
      };
    }
    return { ok: false, error: msg };
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

/** Resend signup confirmation via Resend (fresh link; old links may have expired). */
export async function resendConfirmationAction(
  formData: FormData
): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Enter a valid email address' };
  }

  const admin = createServiceRoleClient();
  const redirectTo = authCallbackUrl('/dashboard');

  // magiclink works for existing unconfirmed users (signup type needs password again).
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  });

  if (linkError) {
    const msg = linkError.message.toLowerCase();
    if (msg.includes('not found') || msg.includes('no user')) {
      return {
        ok: true,
        message:
          'If an account exists for that email, we sent a new confirmation link.',
      };
    }
    return { ok: false, error: linkError.message };
  }

  const user = linkData.user;
  if (user?.email_confirmed_at) {
    return {
      ok: false,
      error:
        'This email is already confirmed. Try signing in with your password.',
    };
  }

  const rawUrl = linkData.properties?.action_link;
  if (!rawUrl) {
    return { ok: false, error: 'Could not create a confirmation link. Try again.' };
  }

  const confirmUrl = rewriteAuthActionLink(rawUrl);
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ??
    email.split('@')[0];

  const emailResult = await sendAccountConfirmationEmail({
    to: email,
    fullName,
    confirmUrl,
    isResend: true,
  });

  if (!emailResult.ok) {
    return { ok: false, error: emailResult.error };
  }

  return {
    ok: true,
    message:
      'A new confirmation email was sent. Use the latest email — older links expire.',
  };
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

  const admin = createServiceRoleClient();
  const nextAfterConfirm = inviteToken
    ? `/invite/accept?token=${encodeURIComponent(inviteToken)}`
    : '/dashboard';
  const redirectTo = authCallbackUrl(nextAfterConfirm);

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'signup',
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      redirectTo,
      data: {
        full_name: parsed.data.full_name,
        role: parsed.data.role,
        phone: parsed.data.phone ?? null,
      },
    },
  });

  if (linkError) {
    const msg = linkError.message.toLowerCase();
    if (msg.includes('already') || msg.includes('registered')) {
      return {
        ok: false,
        error:
          'An account with this email already exists. Sign in or reset your password.',
      };
    }
    return { ok: false, error: linkError.message };
  }

  const rawConfirmUrl = linkData.properties?.action_link;
  if (!rawConfirmUrl) {
    return {
      ok: false,
      error: 'Could not create your verification link. Please try again.',
    };
  }
  const confirmUrl = rewriteAuthActionLink(rawConfirmUrl);

  const user = linkData.user;
  if (user) {
    try {
      await bootstrapUser({
        userId: user.id,
        email: parsed.data.email,
        fullName: parsed.data.full_name,
      });
    } catch (e) {
      console.error('[signupAction] bootstrap failed', e);
    }
  }

  const emailResult = await sendAccountConfirmationEmail({
    to: parsed.data.email,
    fullName: parsed.data.full_name,
    confirmUrl,
  });

  if (!emailResult.ok) {
    return { ok: false, error: emailResult.error };
  }

  const confirmMsg =
    'We sent a confirmation email from Saath Phere (via Resend). Open the link, then sign in.' +
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

  const admin = createServiceRoleClient();
  const redirectTo = authCallbackUrl('/reset-password');

  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    });

  if (linkError) {
    return { ok: false, error: linkError.message };
  }

  const rawResetUrl = linkData.properties?.action_link;
  if (!rawResetUrl) {
    return { ok: false, error: 'Could not create password reset link.' };
  }
  const resetUrl = rewriteAuthActionLink(rawResetUrl);

  const emailResult = await sendPasswordRecoveryEmail({ to: email, resetUrl });
  if (!emailResult.ok) {
    return { ok: false, error: emailResult.error };
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
