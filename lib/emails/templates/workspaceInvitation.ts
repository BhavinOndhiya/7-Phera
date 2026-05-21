import { brand } from '../theme';
import { brandLayout, brandMutedLink, escapeHtml } from '../components';

export interface WorkspaceInvitationProps {
  inviterName: string;
  workspaceName: string;
  role: string;
  acceptUrl: string;
}

export function workspaceInvitation({
  inviterName,
  workspaceName,
  role,
  acceptUrl,
}: WorkspaceInvitationProps): string {
  const body = `
    <p style="margin:0 0 14px;">Hi there,</p>
    <p style="margin:0 0 14px;"><strong>${escapeHtml(inviterName)}</strong> has invited you to help plan <strong>${escapeHtml(workspaceName)}</strong> on ${brand.name} as a <strong>${escapeHtml(role)}</strong>.</p>
    <p style="margin:0 0 14px;">You'll be able to manage guests, vendors, the timeline, and more — together, in one shared space.</p>
  `;

  return brandLayout({
    variant: 'bold',
    preheader: `${inviterName} invited you to ${workspaceName} on ${brand.name}`,
    eyebrow: "You're invited",
    headline: workspaceName,
    sub: `${inviterName} wants you to help plan their wedding`,
    bodyHtml: body,
    ctaText: 'Accept invitation',
    ctaUrl: acceptUrl,
    secondaryNoteHtml: `If the button doesn't work, copy this link:<br/>${brandMutedLink(acceptUrl)}`,
    footerExtraHtml: 'This invitation expires in 14 days.',
  });
}
