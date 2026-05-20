'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { COOKIE_LOCALE, LOCALES, type Locale } from '@/i18n/config';

export async function setLocaleAction(locale: string) {
  if (!(LOCALES as readonly string[]).includes(locale)) return;
  const cookieStore = cookies();
  cookieStore.set(COOKIE_LOCALE, locale as Locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  revalidatePath('/', 'layout');
}
