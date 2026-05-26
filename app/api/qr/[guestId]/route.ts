import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { resolveAppOrigin } from '@/lib/utils/appUrl';
import { buildGuestPassUrl } from '@/lib/utils/guestLinks';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { guestId: string } }
) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');
  const origin = resolveAppOrigin(request);

  if (!eventId) {
    return NextResponse.json(
      { error: 'eventId query parameter is required' },
      { status: 400 }
    );
  }

  const checkInUrl = buildGuestPassUrl(origin, eventId, params.guestId);

  try {
    const png = await QRCode.toBuffer(checkInUrl, {
      width: 512,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });
    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'QR generation failed' },
      { status: 500 }
    );
  }
}
