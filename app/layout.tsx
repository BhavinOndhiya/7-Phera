import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { Toaster } from '@/components/ui/sonner';
import { AppProviders } from '@/components/providers/AppProviders';
import { ServiceWorkerRegister } from '@/components/shared/ServiceWorkerRegister';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Saath Phere — Wedding Planner',
    template: '%s · Saath Phere',
  },
  description:
    'Plan your perfect wedding — manage events, guests, budget, vendors, and more in one beautiful place.',
  keywords: [
    'wedding planner',
    'indian wedding',
    'guest list',
    'budget',
    'rsvp',
    'sangeet',
    'mehendi',
  ],
  manifest: '/manifest.json',
  applicationName: 'Saath Phere',
  appleWebApp: {
    capable: true,
    title: 'Saath Phere',
    statusBarStyle: 'default',
  },
  openGraph: {
    title: 'Saath Phere — Wedding Planner',
    description:
      'Plan your perfect wedding — manage events, guests, budget, vendors, and more.',
    type: 'website',
    siteName: 'Saath Phere',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Saath Phere — Wedding Planner',
    description:
      'Plan your perfect wedding — manage events, guests, budget, vendors, and more.',
  },
};

export const viewport: Viewport = {
  themeColor: '#fb2e63',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders>
            {children}
            <Toaster position="top-right" richColors closeButton />
            <ServiceWorkerRegister />
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
