import { brandLayout, brandMutedLink, escapeHtml } from '../components';
import type { BrandDetailTile } from '../components';

export interface GuestInvitationProps {
  guestName: string;
  eventName: string;
  eventDate: string;
  venue?: string | null;
  rsvpUrl: string;
}

export function guestInvitation({
  guestName,
  eventName,
  eventDate,
  venue,
  rsvpUrl,
}: GuestInvitationProps): string {
  const tiles: BrandDetailTile[] = [{ label: 'When', value: eventDate }];
  if (venue) tiles.push({ label: 'Where', value: venue });

  const body = `
    <p style="margin:0 0 14px;">Dear ${escapeHtml(guestName)},</p>
    <p style="margin:0 0 14px;">We would be honoured by your presence on this very special day. Your blessings mean the world to us.</p>
    <p style="margin:0 0 14px;">Please let us know if you can join us — your reply helps us plan a celebration that feels just right.</p>
  `;

  return brandLayout({
    variant: 'soft',
    preheader: `You're invited to ${eventName} on ${eventDate}`,
    eyebrow: "You're invited",
    headline: eventName,
    tiles,
    bodyHtml: body,
    ctaText: 'RSVP now',
    ctaUrl: rsvpUrl,
    secondaryNoteHtml: `If the button doesn't work, copy this link into your browser:<br/>${brandMutedLink(rsvpUrl)}`,
    footerExtraHtml: 'With love, from the family',
  });
}
