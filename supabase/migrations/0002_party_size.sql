-- Adds party_size to guests so a single row can represent a family / group.
-- Default 1 preserves existing single-person behaviour.

ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS party_size INTEGER NOT NULL DEFAULT 1
  CHECK (party_size BETWEEN 1 AND 50);

COMMENT ON COLUMN public.guests.party_size IS
  'Number of attendees represented by this row. 1 = individual guest. >1 = family/group.';
