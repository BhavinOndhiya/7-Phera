-- Per-event RSVP on event_guests (guests can have different RSVP per ceremony)

ALTER TABLE public.event_guests
  ADD COLUMN IF NOT EXISTS rsvp_status TEXT
    CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'tentative'))
    DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rsvp_date TIMESTAMPTZ;

UPDATE public.event_guests eg
SET
  rsvp_status = COALESCE(g.rsvp_status, 'pending'),
  rsvp_date = g.rsvp_date
FROM public.guests g
WHERE g.id = eg.guest_id
  AND (eg.rsvp_status IS NULL OR eg.rsvp_status = 'pending');

CREATE INDEX IF NOT EXISTS idx_event_guests_rsvp ON public.event_guests(rsvp_status);
