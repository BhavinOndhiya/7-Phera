import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import {
  DEFAULT_LOCALE,
  COOKIE_LOCALE,
  isLocale,
  type Locale,
} from './i18n/config';

export async function readLocale(): Promise<Locale> {
  const cookieStore = cookies();
  const c = cookieStore.get(COOKIE_LOCALE)?.value;
  return isLocale(c) ? c : DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const locale = await readLocale();
  const messages = (await import(`./messages/${locale}.json`)).default;
  return { locale, messages };
});
