import QRCode from 'qrcode';
import { brand } from './theme';

/**
 * Generates a PNG QR code for an email attachment. The QR encodes the
 * guest's venue entry-pass URL (`/checkin/...?guest=`), so the scanner
 * single URL and routes straight to that guest's record.
 *
 * Returned as a base64 string (no data: prefix) ready to be passed to
 * Resend's `attachments[].content` field. The companion HTML references
 * it via `<img src="cid:{contentId}">` and Gmail/Apple Mail/Outlook all
 * render it inline without the "show images" prompt.
 *
 * Colors are pure black-on-white intentionally — branded fill colors
 * lower contrast and can confuse some scanners under poor lighting.
 */
export async function generateRsvpQrBase64(url: string): Promise<string> {
  const buffer = await QRCode.toBuffer(url, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' },
  });
  return buffer.toString('base64');
}

/**
 * Renders an HTML block that displays the QR with a soft rose-gold border
 * frame matching the email's detail tiles, plus a small caption asking
 * the guest to show this at the door.
 */
export function brandQrBlock(contentId: string): string {
  return `
    <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 24px;">
      <tr>
        <td style="background:${brand.surface};border:1px solid ${brand.roseLight};border-radius:18px;padding:18px 18px 14px;text-align:center;">
          <p style="margin:0 0 10px;font-family:${brand.fontButton};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${brand.primaryHover};font-weight:700;">Your entry pass</p>
          <img src="cid:${contentId}" alt="RSVP QR code" width="220" height="220" style="display:block;margin:0 auto;border-radius:8px;width:220px;height:220px;" />
          <p style="margin:12px 0 0;font-family:${brand.fontButton};font-size:12px;color:${brand.textMuted};line-height:1.5;">Show this at the door on the day — our team will scan you in.<br/>Use the <strong>RSVP now</strong> button above to reply before the event.</p>
        </td>
      </tr>
    </table>
  `;
}
