import { brand } from './theme';

/**
 * Tiny HTML helpers shared by every Saath Phere email. We use plain HTML
 * strings (no React, no Tailwind) because email clients only render a
 * subset of CSS reliably. All styles are inlined.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function brandButton(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:${brand.primary};color:#ffffff;padding:14px 32px;border-radius:999px;text-decoration:none;font-family:${brand.fontButton};font-weight:600;font-size:15px;letter-spacing:0.2px;">${escapeHtml(label)}</a>`;
}

export function brandMutedLink(url: string): string {
  return `<a href="${url}" style="color:${brand.primaryAccent};word-break:break-all;">${escapeHtml(url)}</a>`;
}

export function brandOtpBlock(token: string): string {
  return `<div style="margin:24px 0;padding:20px;background:${brand.surfaceMuted};border:1px solid ${brand.border};border-radius:12px;text-align:center;font-family:${brand.fontButton};font-size:32px;letter-spacing:8px;color:${brand.primaryDark};font-weight:600;">${escapeHtml(token)}</div>`;
}

export function brandFooter(extraHtml?: string): string {
  return `
  <div style="margin-top:32px;padding-top:20px;border-top:1px solid ${brand.border};color:${brand.textFaint};font-size:12px;font-family:${brand.fontButton};text-align:center;">
    ${extraHtml ? `<p style="margin:0 0 8px;color:${brand.textMuted};">${extraHtml}</p>` : ''}
    <p style="margin:0;">Sent with love by <strong style="color:${brand.primaryAccent};">${brand.name}</strong> · ${brand.tagline}</p>
  </div>`;
}

export interface BrandLayoutOptions {
  /** Small uppercase label above the headline, e.g. "You're invited". */
  eyebrow?: string;
  /** Big heading inside the gradient card. */
  headline: string;
  /** Optional subtitle under the heading (e.g. event date). */
  sub?: string;
  /** Optional second muted line under the subtitle (e.g. venue). */
  subAlt?: string;
  /** Body HTML between the gradient card and the CTA. */
  bodyHtml: string;
  /** CTA button label. Omit to render no button (e.g. OTP-only emails). */
  ctaText?: string;
  /** CTA button target URL. */
  ctaUrl?: string;
  /** Small text shown under the button (e.g. "If the button doesn't work…"). */
  secondaryNoteHtml?: string;
  /** Extra footer line above the standard signature. */
  footerExtraHtml?: string;
  /** Preheader (hidden preview text shown in inbox lists). */
  preheader?: string;
}

export function brandLayout(opts: BrandLayoutOptions): string {
  const {
    eyebrow,
    headline,
    sub,
    subAlt,
    bodyHtml,
    ctaText,
    ctaUrl,
    secondaryNoteHtml,
    footerExtraHtml,
    preheader,
  } = opts;

  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;">${escapeHtml(preheader)}</div>`
    : '';

  const headerCard = `
  <div style="background:linear-gradient(135deg, ${brand.gradientStart} 0%, ${brand.gradientEnd} 100%);padding:36px 28px;text-align:center;border-radius:16px;">
    ${
      eyebrow
        ? `<p style="color:${brand.primaryAccent};letter-spacing:4px;text-transform:uppercase;font-size:11px;margin:0;font-family:${brand.fontButton};font-weight:600;">${escapeHtml(eyebrow)}</p>`
        : ''
    }
    <h1 style="font-family:${brand.fontHeading};font-size:34px;margin:${eyebrow ? '12px' : '0'} 0 6px;color:${brand.primaryDark};line-height:1.15;">${escapeHtml(headline)}</h1>
    ${sub ? `<p style="color:${brand.textMuted};margin:6px 0 0;font-size:14px;">${escapeHtml(sub)}</p>` : ''}
    ${subAlt ? `<p style="color:${brand.textMuted};margin:4px 0 0;font-size:13px;">${escapeHtml(subAlt)}</p>` : ''}
  </div>`;

  const cta =
    ctaText && ctaUrl
      ? `<p style="text-align:center;margin:32px 0 8px;">${brandButton(ctaText, ctaUrl)}</p>`
      : '';

  const secondary = secondaryNoteHtml
    ? `<p style="color:${brand.textMuted};font-size:13px;line-height:1.5;">${secondaryNoteHtml}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>${escapeHtml(headline)}</title>
</head>
<body style="margin:0;padding:0;background:#f9f4f6;font-family:${brand.fontBody};color:${brand.textBody};">
  ${preheaderHtml}
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="background:${brand.surface};border-radius:20px;padding:24px;box-shadow:0 4px 24px rgba(159, 18, 57, 0.06);">
      ${headerCard}
      <div style="padding:28px 8px 8px;font-size:15px;line-height:1.6;color:${brand.textBody};">
        ${bodyHtml}
        ${cta}
        ${secondary}
      </div>
      ${brandFooter(footerExtraHtml)}
    </div>
  </div>
</body>
</html>`;
}

export { escapeHtml };
