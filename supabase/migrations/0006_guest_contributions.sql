-- Cash / shagun amounts received from each guest (per event)
CREATE TABLE IF NOT EXISTS public.guest_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  amount_inr DECIMAL(12, 2) NOT NULL CHECK (amount_inr >= 0),
  notes TEXT,
  received_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, guest_id)
);

CREATE INDEX IF NOT EXISTS idx_guest_contributions_event
  ON public.guest_contributions(event_id);
CREATE INDEX IF NOT EXISTS idx_guest_contributions_workspace
  ON public.guest_contributions(workspace_id);

ALTER TABLE public.guest_contributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guest_contributions_select" ON public.guest_contributions;
DROP POLICY IF EXISTS "guest_contributions_insert" ON public.guest_contributions;
DROP POLICY IF EXISTS "guest_contributions_update" ON public.guest_contributions;
DROP POLICY IF EXISTS "guest_contributions_delete" ON public.guest_contributions;

CREATE POLICY "guest_contributions_select" ON public.guest_contributions
  FOR SELECT USING (public.can_view_workspace(workspace_id));
CREATE POLICY "guest_contributions_insert" ON public.guest_contributions
  FOR INSERT WITH CHECK (public.can_edit_workspace(workspace_id));
CREATE POLICY "guest_contributions_update" ON public.guest_contributions
  FOR UPDATE USING (public.can_edit_workspace(workspace_id));
CREATE POLICY "guest_contributions_delete" ON public.guest_contributions
  FOR DELETE USING (public.can_edit_workspace(workspace_id));
