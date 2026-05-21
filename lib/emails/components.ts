import { brand } from './theme';

/**
 * Tiny HTML helpers shared by every Saath Phere email. We use plain HTML
 * strings (no React, no Tailwind) because email clients only render a
 * subset of CSS reliably. All styles are inlined and we use <table> for
 * the few pieces Outlook desktop needs (monogram row, tile row, divider).
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Heart-in-circle + serif wordmark, used at the top of every email. */
export function brandMonogram(): string {
  return `
    <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 24px;">
      <tr>
        <td style="vertical-align:middle;">
          <div style="width:44px;height:44px;background:${brand.roseLight};border-radius:50%;text-align:center;font-size:22px;line-height:44px;color:${brand.primary};font-family:${brand.fontButton};">&#x2665;</div>
        </td>
        <td style="vertical-align:middle;padding-left:12px;font-family:${brand.fontHeading};font-size:22px;font-weight:600;color:${brand.primaryDark};letter-spacing:0.3px;">${brand.name}</td>
      </tr>
    </table>
  `;
}

/** Soft tri-stop pastel hero card — used on guest invites, recovery, magic link. */
function softHeroCard(
  headline: string,
  eyebrow?: string,
  sub?: string,
  subAlt?: string
): string {
  return `
    <div style="background:linear-gradient(135deg, ${brand.gradientStart} 0%, ${brand.gradientMid} 50%, ${brand.gradientEnd} 100%);border:1px solid ${brand.border};padding:44px 28px 38px;text-align:center;border-radius:18px;">
      ${
        eyebrow
          ? `<p style="color:${brand.primaryHover};letter-spacing:4px;text-transform:uppercase;font-size:11px;margin:0;font-family:${brand.fontButton};font-weight:700;">${escapeHtml(eyebrow)}</p>`
          : ''
      }
      <h1 style="font-family:${brand.fontHeading};font-size:42px;font-weight:700;margin:${eyebrow ? '14px' : '0'} 0 6px;color:${brand.primaryDark};line-height:1.1;">${escapeHtml(headline)}</h1>
      ${sub ? `<p style="color:${brand.textMuted};margin:12px 0 0;font-size:15px;font-family:${brand.fontButton};">${escapeHtml(sub)}</p>` : ''}
      ${subAlt ? `<p style="color:${brand.textMuted};margin:4px 0 0;font-size:13px;font-family:${brand.fontButton};">${escapeHtml(subAlt)}</p>` : ''}
    </div>
  `;
}

/** Bold rose→gold hero — mirrors the auth-page left panel, used for confirm/invite/welcome. */
function boldHeroCard(
  headline: string,
  eyebrow?: string,
  sub?: string,
  subAlt?: string
): string {
  return `
    <div style="background:linear-gradient(135deg, ${brand.boldHeaderStart} 0%, ${brand.boldHeaderMid} 55%, ${brand.boldHeaderEnd} 100%);padding:48px 32px;text-align:center;border-radius:18px;color:#ffffff;">
      ${
        eyebrow
          ? `<p style="color:rgba(255,255,255,0.92);letter-spacing:4px;text-transform:uppercase;font-size:11px;margin:0;font-family:${brand.fontButton};font-weight:700;">${escapeHtml(eyebrow)}</p>`
          : ''
      }
      <h1 style="font-family:${brand.fontHeading};font-size:38px;font-weight:700;margin:${eyebrow ? '14px' : '0'} 0 8px;color:#ffffff;line-height:1.1;">${escapeHtml(headline)}</h1>
      ${sub ? `<p style="color:rgba(255,255,255,0.92);margin:10px 0 0;font-size:15px;font-family:${brand.fontButton};">${escapeHtml(sub)}</p>` : ''}
      ${subAlt ? `<p style="color:rgba(255,255,255,0.82);margin:4px 0 0;font-size:13px;font-family:${brand.fontButton};">${escapeHtml(subAlt)}</p>` : ''}
    </div>
  `;
}

export interface BrandDetailTile {
  label: string;
  value: string;
}

/** White detail tiles rendered side-by-side — date / venue, current / new email, etc. */
export function brandDetailTiles(tiles: BrandDetailTile[]): string {
  if (tiles.length === 0) return '';
  const cells = tiles
    .map(
      (tile) => `
      <td style="width:${100 / tiles.length}%;padding:0 6px;vertical-align:top;">
        <div style="background:${brand.surface};border:1px solid ${brand.roseLight};border-radius:14px;padding:16px 12px;text-align:center;">
          <p style="margin:0 0 6px;font-family:${brand.fontButton};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${brand.primaryHover};font-weight:700;">${escapeHtml(tile.label)}</p>
          <p style="margin:0;font-family:${brand.fontHeading};font-size:17px;color:${brand.primaryDark};font-weight:600;line-height:1.3;">${escapeHtml(tile.value)}</p>
        </div>
      </td>`
    )
    .join('');
  return `
    <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:18px 0 0;">
      <tr>${cells}</tr>
    </table>
  `;
}

/** Decorative section break: thin rose line ♥ thin rose line. */
export function brandHeartDivider(): string {
  return `
    <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 8px;">
      <tr>
        <td style="width:80px;">
          <div style="height:1px;background:${brand.border};font-size:0;line-height:0;">&nbsp;</div>
        </td>
        <td style="padding:0 14px;font-size:15px;color:${brand.primary};font-family:${brand.fontButton};line-height:1;vertical-align:middle;">&#x2665;</td>
        <td style="width:80px;">
          <div style="height:1px;background:${brand.border};font-size:0;line-height:0;">&nbsp;</div>
        </td>
      </tr>
    </table>
  `;
}

export function brandButton(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:${brand.primary};color:#ffffff;padding:16px 36px;border-radius:999px;text-decoration:none;font-family:${brand.fontButton};font-weight:600;font-size:15px;letter-spacing:0.2px;box-shadow:0 6px 20px rgba(251,46,99,0.25);">${escapeHtml(label)}</a>`;
}

export function brandMutedLink(url: string): string {
  return `<a href="${url}" style="color:${brand.primaryAccent};word-break:break-all;text-decoration:underline;">${escapeHtml(url)}</a>`;
}

export function brandOtpBlock(token: string): string {
  return `<div style="margin:24px 0;padding:22px;background:${brand.surfaceMuted};border:1px solid ${brand.border};border-radius:14px;text-align:center;font-family:${brand.fontButton};font-size:30px;letter-spacing:10px;color:${brand.primaryDark};font-weight:700;">${escapeHtml(token)}</div>`;
}

export function brandFooter(extraHtml?: string): string {
  return `
    <div style="margin-top:36px;padding-top:24px;border-top:1px solid ${brand.borderLight};color:${brand.textFaint};font-size:12px;font-family:${brand.fontButton};text-align:center;line-height:1.6;">
      ${extraHtml ? `<p style="margin:0 0 10px;color:${brand.textMuted};">${extraHtml}</p>` : ''}
      <p style="margin:0;">Sent with love by <strong style="color:${brand.primaryAccent};font-family:${brand.fontHeading};font-size:13px;">${brand.name}</strong></p>
      <p style="margin:4px 0 0;color:${brand.textFaint};font-size:11px;letter-spacing:0.4px;">${brand.tagline}</p>
    </div>
  `;
}

export interface BrandLayoutOptions {
  /** `'soft'` (pastel) = invites, recovery, magic link. `'bold'` (rose→gold) = welcome, confirm, workspace invite. */
  variant?: 'soft' | 'bold';
  /** Show heart monogram above the hero. Defaults to true. */
  showMonogram?: boolean;
  /** Small uppercase label above the headline, e.g. "You're invited". */
  eyebrow?: string;
  /** Big heading inside the hero card. */
  headline: string;
  /** Optional subtitle under the heading. */
  sub?: string;
  /** Optional second muted line under the subtitle. */
  subAlt?: string;
  /** Optional row of detail tiles rendered immediately under the hero. */
  tiles?: BrandDetailTile[];
  /** Render the ♥ divider between hero/tiles and body. Defaults to true. */
  showDivider?: boolean;
  /** Body HTML between the divider and the CTA. */
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
    variant = 'soft',
    showMonogram = true,
    eyebrow,
    headline,
    sub,
    subAlt,
    tiles,
    showDivider = true,
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

  const monogram = showMonogram ? brandMonogram() : '';
  const hero =
    variant === 'bold'
      ? boldHeroCard(headline, eyebrow, sub, subAlt)
      : softHeroCard(headline, eyebrow, sub, subAlt);
  const tilesHtml = tiles && tiles.length > 0 ? brandDetailTiles(tiles) : '';
  const divider = showDivider ? brandHeartDivider() : '';
  const cta =
    ctaText && ctaUrl
      ? `<p style="text-align:center;margin:24px 0 8px;">${brandButton(ctaText, ctaUrl)}</p>`
      : '';
  const secondary = secondaryNoteHtml
    ? `<p style="color:${brand.textMuted};font-size:13px;line-height:1.6;font-family:${brand.fontButton};">${secondaryNoteHtml}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>${escapeHtml(headline)}</title>
</head>
<body style="margin:0;padding:0;background:${brand.pageBg};font-family:${brand.fontBody};color:${brand.textBody};">
  ${preheaderHtml}
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="background:${brand.surface};border-radius:24px;padding:32px 28px;box-shadow:0 8px 32px rgba(159,18,57,0.08);border:1px solid ${brand.borderLight};">
      ${monogram}
      ${hero}
      ${tilesHtml}
      ${divider}
      <div style="padding:4px 4px 8px;font-size:16px;line-height:1.7;color:${brand.textBody};font-family:${brand.fontBody};">
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
