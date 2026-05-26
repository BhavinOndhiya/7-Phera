'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { QrCode, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Event, Guest } from '@/lib/types/database.types';

interface GuestQRCardProps {
  guest: Guest;
  eventId?: string;
  eventName?: string;
  workspaceEvents?: Event[];
  triggerLabel?: string;
}

export function GuestQRCard({
  guest,
  eventId: eventIdProp,
  eventName: eventNameProp,
  workspaceEvents,
  triggerLabel,
}: GuestQRCardProps) {
  const [open, setOpen] = useState(false);
  const [pickedEventId, setPickedEventId] = useState('');

  const effectiveEventId = eventIdProp ?? pickedEventId;
  const effectiveEventName =
    eventNameProp ??
    workspaceEvents?.find((e) => e.id === effectiveEventId)?.name;

  const qrUrl = effectiveEventId
    ? `/api/qr/${guest.id}?eventId=${effectiveEventId}`
    : '';

  const needsEventPick = !eventIdProp && (workspaceEvents?.length ?? 0) > 0;

  function downloadPng() {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `qr-${guest.full_name.replace(/\s+/g, '-')}.png`;
    a.click();
  }

  function printQR() {
    if (!qrUrl) return;
    const printable = window.open('', '_blank');
    if (!printable) return;
    printable.document.write(`
      <html>
        <head>
          <title>${guest.full_name} - Invitation QR</title>
          <style>
            body { font-family: system-ui; text-align: center; padding: 40px; }
            h1 { font-family: Georgia, serif; color: #fb2e63; }
            img { width: 300px; margin: 20px auto; }
            .name { font-size: 24px; font-weight: bold; margin: 16px 0 4px; }
            .relation { color: #666; }
            .footer { color: #888; font-size: 12px; margin-top: 24px; }
          </style>
        </head>
        <body>
          <h1>${effectiveEventName ?? 'Wedding Invitation'}</h1>
          <img src="${window.location.origin}${qrUrl}" />
          <div class="name">${guest.full_name}</div>
          <div class="relation">${guest.relation}</div>
          <div class="footer">Scan QR at the venue to check in</div>
        </body>
      </html>
    `);
    printable.document.close();
    setTimeout(() => {
      printable.print();
    }, 500);
  }

  const canShowQr = Boolean(effectiveEventId);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-xs"
      >
        <QrCode className="h-3 w-3 mr-1.5" /> {triggerLabel ?? 'QR'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR entry pass</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            {needsEventPick && (
              <div className="text-left space-y-2">
                <p className="text-sm font-medium">Event</p>
                <Select value={pickedEventId} onValueChange={setPickedEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick an event…" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaceEvents!.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!needsEventPick && !eventIdProp && !workspaceEvents?.length && (
              <p className="text-sm text-muted-foreground">
                Add this guest to an event first to generate a QR pass.
              </p>
            )}

            {canShowQr ? (
              <>
                <div className="inline-block p-4 bg-white rounded-xl shadow-sm border">
                  <Image
                    src={qrUrl}
                    alt={`QR code for ${guest.full_name}`}
                    width={256}
                    height={256}
                    unoptimized
                  />
                </div>
                <div>
                  <p className="font-medium text-lg">{guest.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {guest.relation} ·{' '}
                    {guest.side === 'bride' ? "Bride's side" : "Groom's side"}
                  </p>
                  {effectiveEventName && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {effectiveEventName}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Print or share digitally. Staff scan this at the door.
                </p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={downloadPng}>
                    <Download className="h-4 w-4 mr-2" /> Download
                  </Button>
                  <Button
                    onClick={printQR}
                    className="bg-rose-500 hover:bg-rose-600"
                  >
                    <Printer className="h-4 w-4 mr-2" /> Print
                  </Button>
                </div>
              </>
            ) : needsEventPick && !pickedEventId ? (
              <p className="text-sm text-muted-foreground">
                Select an event to generate the QR code.
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
