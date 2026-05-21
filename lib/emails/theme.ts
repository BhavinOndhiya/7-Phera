/**
 * Brand tokens for every email we send (Resend + Supabase auth).
 *
 * These mirror tailwind.config.ts (rose-500/800, gold-50) so emails feel
 * like a continuation of the in-app experience. Keep this file plain
 * primitives only — no React, no Next imports — so the constants can be
 * used by the static Supabase HTML templates and by node scripts.
 */
export const brand = {
  name: 'Saath Phere',
  tagline: 'Wedding moments, beautifully planned',
  supportEmail: 'hello@saathphere.com',

  primary: '#fb2e63',
  primaryDark: '#9f1239',
  primaryAccent: '#be185d',

  gradientStart: '#fff1f3',
  gradientEnd: '#fdf9ed',

  surface: '#ffffff',
  surfaceMuted: '#fff7f9',

  textBody: '#1f2937',
  textMuted: '#6b7280',
  textFaint: '#9ca3af',

  border: '#fce7eb',

  fontHeading: 'Georgia, "Playfair Display", "Times New Roman", serif',
  fontBody: 'Georgia, "Times New Roman", serif',
  fontButton:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
} as const;

export type Brand = typeof brand;
