-- Optional local start/end times for events (date stays on event_date).
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME;

COMMENT ON COLUMN public.events.start_time IS 'Local ceremony/start time';
COMMENT ON COLUMN public.events.end_time IS 'Local end time (optional)';
