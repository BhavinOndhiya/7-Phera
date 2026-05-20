'use client';

import { useState, useTransition } from 'react';
import { Mail, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Guest, Event } from '@/lib/types/database.types';
import { formatDateLong } from '@/lib/utils/formatting';

interface InvitationActionsProps {
  event: Event;
  guests: Guest[];
}

export function InvitationActions({ event, guests }: InvitationActionsProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const guestsWithEmail = guests.filter((g) => g.email);
  const guestsWithPhone = guests.filter((g) => g.phone);

  function sendEmail() {
    if (guestsWithEmail.length === 0) {
      toast.error('No guests with email addresses');
      return;
    }
    startTransition(async () => {
      const res = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          guestIds: guestsWithEmail.map((g) => g.id),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to send invitations');
        return;
      }
      toast.success(
        `Sent ${data.sent.length} invitations${
          data.failed.length > 0 ? `, ${data.failed.length} failed` : ''
        }`
      );
      setOpen(false);
    });
  }

  function whatsappShare() {
    const message = `🎉 You're invited to ${event.name}!\n\n📅 ${formatDateLong(
      event.event_date
    )}\n${event.venue ? `📍 ${event.venue}\n` : ''}\nLooking forward to celebrating with you!`;
    const encoded = encodeURIComponent(message);

    if (guestsWithPhone.length === 1) {
      const phone = guestsWithPhone[0].phone!.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
      toast.info(
        'WhatsApp opened with invitation text. Pick contacts from the chat.'
      );
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Mail className="h-4 w-4 mr-2" /> Send invitations
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send invitations</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send invitations for <strong>{event.name}</strong>.
            </p>

            <div className="space-y-2">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-rose-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Email via Resend</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {guestsWithEmail.length} of {guests.length} guests have
                      email addresses
                    </p>
                  </div>
                  <Button
                    onClick={sendEmail}
                    disabled={isPending || guestsWithEmail.length === 0}
                    size="sm"
                    className="bg-rose-500 hover:bg-rose-600"
                  >
                    {isPending && (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    )}
                    Send all
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires RESEND_API_KEY in .env.local.
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">WhatsApp share</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Open WhatsApp with a pre-filled invitation message
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={whatsappShare}
                    size="sm"
                  >
                    Open WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
