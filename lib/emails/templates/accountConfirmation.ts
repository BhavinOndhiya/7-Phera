import { brand } from '../theme';
import { brandLayout, brandMutedLink, escapeHtml } from '../components';

export interface AccountConfirmationProps {
  fullName: string;
  email: string;
  confirmUrl: string;
}

export function accountConfirmation({
  fullName,
  email,
  confirmUrl,
}: AccountConfirmationProps): string {
  const greeting = fullName.trim() ? escapeHtml(fullName.split(' ')[0]) : 'there';

  const body = `
    <p style="margin:0 0 14px;">Hi ${greeting},</p>
    <p style="margin:0 0 14px;">Welcome to <strong>${escapeHtml(brand.name)}</strong>. Please confirm <strong>${escapeHtml(email)}</strong> so we can keep your wedding plans safe and yours alone.</p>
    <p style="margin:0 0 14px;color:#6f6a6c;font-size:14px;">After confirming, sign in with the password you chose when you signed up.</p>
  `;

  return brandLayout({
    variant: 'bold',
    preheader: `Confirm your ${brand.name} account`,
    eyebrow: 'Welcome',
    headline: 'Confirm your email',
    sub: 'One quick step to activate your account',
    bodyHtml: body,
    ctaText: 'Confirm your email',
    ctaUrl: confirmUrl,
    secondaryNoteHtml: `If the button doesn't work, copy this link:<br/>${brandMutedLink(confirmUrl)}`,
    footerExtraHtml: "Didn't sign up? You can safely ignore this email.",
  });
}
