'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginSchema, signupSchema } from '@/lib/utils/validation';

export type ActionResult =
  | { ok: true; redirectTo?: string }
  | { ok: false; error: string };

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  return { ok: true, redirectTo: '/dashboard' };
}

export async function signupAction(formData: FormData): Promise<ActionResult> {
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
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
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

  if (data.session) {
    revalidatePath('/', 'layout');
    return { ok: true, redirectTo: '/dashboard' };
  }

  return {
    ok: true,
    redirectTo: '/login?message=Check your email to confirm your account',
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
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
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
