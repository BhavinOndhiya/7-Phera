/**
 * Brand tokens for every email we send (Resend + Supabase auth).
 *
 * Mirrors tailwind.config.ts (rose-50..800 + gold-50..600) and app/globals.css
 * so emails feel like a continuation of the in-app experience. Plain primitives
 * only — no React, no Next imports — so the constants can be used by the
 * static Supabase HTML templates and by node scripts.
 */
export const brand = {
  name: 'Saath Phere',
  tagline: 'Wedding moments, beautifully planned',
  supportEmail: 'hello@saathphere.com',

  primary: '#fb2e63',
  primaryHover: '#e91553',
  primaryDark: '#9f1239',
  primaryDarker: '#c50a47',
  primaryAccent: '#be185d',

  roseLight: '#ffe1e6',
  border: '#ffc7d1',
  borderLight: '#fce7eb',

  goldStart: '#fdf9ed',
  goldAccent: '#d8901e',
  goldGradientEnd: '#eaaf36',

  gradientStart: '#fff1f3',
  gradientMid: '#ffffff',
  gradientEnd: '#fdf9ed',

  boldHeaderStart: '#fb2e63',
  boldHeaderMid: '#ff6485',
  boldHeaderEnd: '#eaaf36',

  surface: '#ffffff',
  surfaceMuted: '#fff7f9',
  pageBg: '#f5f0f2',

  textBody: '#1f2937',
  textMuted: '#6f6a6c',
  textFaint: '#9ca3af',

  fontHeading:
    "'Playfair Display', Georgia, 'Times New Roman', serif",
  fontBody:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontButton:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
} as const;

export type Brand = typeof brand;
