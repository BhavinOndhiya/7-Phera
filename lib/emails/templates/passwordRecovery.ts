import { brand } from '../theme';
import { brandLayout, brandMutedLink, escapeHtml } from '../components';

export interface PasswordRecoveryProps {
  email: string;
  resetUrl: string;
}

export function passwordRecovery({
  email,
  resetUrl,
}: PasswordRecoveryProps): string {
  const body = `
    <p style="margin:0 0 14px;">Hi,</p>
    <p style="margin:0 0 14px;">We received a request to reset the password for <strong>${escapeHtml(email)}</strong> on ${escapeHtml(brand.name)}.</p>
    <p style="margin:0 0 14px;color:#6f6a6c;font-size:14px;">This link expires soon. If you didn't ask for a reset, ignore this email.</p>
  `;

  return brandLayout({
    variant: 'soft',
    preheader: `Reset your ${brand.name} password`,
    eyebrow: 'Password reset',
    headline: 'Reset your password',
    sub: 'Choose a new password to sign back in',
    bodyHtml: body,
    ctaText: 'Reset password',
    ctaUrl: resetUrl,
    secondaryNoteHtml: `If the button doesn't work, copy this link:<br/>${brandMutedLink(resetUrl)}`,
  });
}
