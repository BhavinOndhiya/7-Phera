'use client';

import { useMemo, useState, useTransition } from 'react';
import { Mail, MessageCircle, Loader2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
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
import type { Guest, Event } from '@/lib/types/database.types';
import { formatDateLong } from '@/lib/utils/formatting';
import { emitDataChanged } from '@/lib/utils/dataEvents';

interface InvitationActionsProps {
  event?: Event;
  guests: Guest[];
  workspaceEvents?: Event[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSent?: () => void;
}

export function InvitationActions({
  event,
  guests,
  workspaceEvents,
  open: controlledOpen,
  onOpenChange,
  onSent,
}: InvitationActionsProps) {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (isControlled) onOpenChange?.(next);
    else setUncontrolledOpen(next);
  };

  const [isPending, startTransition] = useTransition();
  const [pickedEventId, setPickedEventId] = useState<string>('');

  const guestsWithEmail = useMemo(
    () => guests.filter((g) => g.email),
    [guests]
  );
  const guestsWithPhone = useMemo(
    () => guests.filter((g) => g.phone),
    [guests]
  );

  const effectiveEvent: Event | undefined =
    event ?? workspaceEvents?.find((e) => e.id === pickedEventId);
  const needsEventPicker = !event;
  const hasEvents = (workspaceEvents?.length ?? 0) > 0;

  function sendEmail() {
    if (!effectiveEvent) {
      toast.error('Pick an event first');
      return;
    }
    if (guestsWithEmail.length === 0) {
      toast.error('None of the selected guests have email addresses');
      return;
    }
    startTransition(async () => {
      const res = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: effectiveEvent.id,
          guestIds: guestsWithEmail.map((g) => g.id),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to send invitations');
        return;
      }
      if (data.sent?.length > 0) emitDataChanged('guests:changed');
      toast.success(
        `Sent ${data.sent.length} invitation${data.sent.length === 1 ? '' : 's'}${
          data.failed.length > 0 ? `, ${data.failed.length} failed` : ''
        }`
      );
      setOpen(false);
      onSent?.();
    });
  }

  function whatsappShare() {
    if (!effectiveEvent) {
      toast.error('Pick an event first');
      return;
    }
    const message = `You're invited to ${effectiveEvent.name}!\n\nDate: ${formatDateLong(
      effectiveEvent.event_date
    )}\n${effectiveEvent.venue ? `Venue: ${effectiveEvent.venue}\n` : ''}\nLooking forward to celebrating with you!`;
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
      {!isControlled && (
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Mail className="h-4 w-4 mr-2" /> Send invitations
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send invitations</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {effectiveEvent ? (
              <p className="text-sm text-muted-foreground">
                Send invitations for <strong>{effectiveEvent.name}</strong> to{' '}
                {guests.length} guest{guests.length === 1 ? '' : 's'}.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {guests.length} guest{guests.length === 1 ? '' : 's'} selected.
                Pick which event to invite them to.
              </p>
            )}

            {needsEventPicker && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Event
                </label>
                {hasEvents ? (
                  <Select
                    value={pickedEventId}
                    onValueChange={setPickedEventId}
                  >
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
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    You need to create an event first.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Each guest gets a personalised RSVP link for this event. If
                  someone isn&apos;t yet attached to the event, they will be added
                  automatically when they RSVP.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-rose-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Email via Resend</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {guestsWithEmail.length} of {guests.length} guest
                      {guests.length === 1 ? '' : 's'} have email addresses
                    </p>
                  </div>
                  <Button
                    onClick={sendEmail}
                    disabled={
                      isPending ||
                      guestsWithEmail.length === 0 ||
                      !effectiveEvent
                    }
                    size="sm"
                    className="bg-rose-500 hover:bg-rose-600"
                  >
                    {isPending && (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    )}
                    Send {guestsWithEmail.length > 0 ? guestsWithEmail.length : ''}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires <code>RESEND_API_KEY</code> in your environment.
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">WhatsApp share</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {guestsWithPhone.length === 1
                        ? `Opens WhatsApp chat with ${guestsWithPhone[0].full_name}`
                        : 'Open WhatsApp with a pre-filled invitation message'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={whatsappShare}
                    size="sm"
                    disabled={!effectiveEvent}
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
