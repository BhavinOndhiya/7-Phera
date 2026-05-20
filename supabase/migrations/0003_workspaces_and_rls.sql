-- ============================================================
-- Wedding Planner — Multi-tenant Workspaces + Superadmin Migration
-- Run AFTER 0001_initial_schema.sql, 0002_storage_setup.sql, 0002_party_size.sql
--
-- Adds:
--   1. workspaces, workspace_members, workspace_invitations, admin_audit_log tables
--   2. is_superadmin / is_suspended columns on users
--   3. workspace_id columns on every workspace-scoped table
--   4. SQL helper functions: is_superadmin(), can_view_workspace(), can_edit_workspace()
--   5. Backfill from events.created_by
--   6. Replaces the blanket "Authenticated full access" RLS with workspace-scoped policies
-- ============================================================

BEGIN;

-- ============================================================
-- 1. NEW TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')) DEFAULT 'editor',
  invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')) DEFAULT 'editor',
  token TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, email)
);

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON public.workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON public.workspace_invitations(email);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.admin_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.admin_audit_log(created_at DESC);

-- ============================================================
-- 2. USER FLAGS (superadmin / suspended)
-- ============================================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- 3. workspace_id COLUMNS (nullable; we set NOT NULL via app code after backfill is safe)
-- ============================================================
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.budget_categories
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.budget_items
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.timeline_items
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.gifts
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_events_workspace ON public.events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_guests_workspace ON public.guests(workspace_id);
CREATE INDEX IF NOT EXISTS idx_vendors_workspace ON public.vendors(workspace_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_workspace ON public.budget_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON public.tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_timeline_workspace ON public.timeline_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_workspace ON public.documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_gifts_workspace ON public.gifts(workspace_id);

-- updated_at trigger for workspaces
DROP TRIGGER IF EXISTS set_updated_at ON public.workspaces;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 4. HELPER FUNCTIONS (SECURITY DEFINER so they can bypass RLS on workspace_members)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_superadmin FROM public.users WHERE id = auth.uid()),
    FALSE
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_workspace(ws UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    ws IS NOT NULL
    AND (
      public.is_superadmin()
      OR EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = ws AND user_id = auth.uid()
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_workspace(ws UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    ws IS NOT NULL
    AND (
      public.is_superadmin()
      OR EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = ws AND user_id = auth.uid()
          AND role IN ('owner', 'editor')
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_admin_workspace(ws UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    ws IS NOT NULL
    AND (
      public.is_superadmin()
      OR EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = ws AND user_id = auth.uid()
          AND role = 'owner'
      )
    );
$$;

-- ============================================================
-- 5. BACKFILL: create one workspace per existing event creator
-- ============================================================
DO $$
DECLARE
  rec RECORD;
  new_ws_id UUID;
  fallback_ws_id UUID;
  fallback_user_id UUID;
BEGIN
  -- Create a workspace for each user who has ever created an event
  FOR rec IN
    SELECT DISTINCT u.id AS user_id, u.full_name
    FROM public.users u
    JOIN public.events e ON e.created_by = u.id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.workspace_members wm WHERE wm.user_id = u.id
    )
  LOOP
    INSERT INTO public.workspaces (name, created_by)
    VALUES (COALESCE(rec.full_name, 'My') || '''s Wedding', rec.user_id)
    RETURNING id INTO new_ws_id;

    INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by)
    VALUES (new_ws_id, rec.user_id, 'owner', rec.user_id);

    UPDATE public.events
    SET workspace_id = new_ws_id
    WHERE created_by = rec.user_id AND workspace_id IS NULL;
  END LOOP;

  -- Handle orphan events (no created_by) by assigning to the first workspace if one exists
  SELECT id INTO fallback_ws_id FROM public.workspaces ORDER BY created_at LIMIT 1;
  IF fallback_ws_id IS NOT NULL THEN
    UPDATE public.events SET workspace_id = fallback_ws_id WHERE workspace_id IS NULL;
  END IF;

  -- Cascade workspace_id from events down to all child tables
  UPDATE public.budget_items bi
  SET workspace_id = e.workspace_id
  FROM public.events e
  WHERE bi.event_id = e.id AND bi.workspace_id IS NULL AND e.workspace_id IS NOT NULL;

  UPDATE public.tasks t
  SET workspace_id = e.workspace_id
  FROM public.events e
  WHERE t.event_id = e.id AND t.workspace_id IS NULL AND e.workspace_id IS NOT NULL;

  UPDATE public.timeline_items ti
  SET workspace_id = e.workspace_id
  FROM public.events e
  WHERE ti.event_id = e.id AND ti.workspace_id IS NULL AND e.workspace_id IS NOT NULL;

  UPDATE public.documents d
  SET workspace_id = e.workspace_id
  FROM public.events e
  WHERE d.event_id = e.id AND d.workspace_id IS NULL AND e.workspace_id IS NOT NULL;

  UPDATE public.gifts g
  SET workspace_id = e.workspace_id
  FROM public.events e
  WHERE g.event_id = e.id AND g.workspace_id IS NULL AND e.workspace_id IS NOT NULL;

  -- Guests: pick the workspace of the first event they're linked to
  UPDATE public.guests g
  SET workspace_id = sub.workspace_id
  FROM (
    SELECT DISTINCT ON (eg.guest_id) eg.guest_id, e.workspace_id
    FROM public.event_guests eg
    JOIN public.events e ON e.id = eg.event_id
    WHERE e.workspace_id IS NOT NULL
    ORDER BY eg.guest_id, eg.id
  ) sub
  WHERE g.id = sub.guest_id AND g.workspace_id IS NULL;

  -- Vendors: best-effort, attach orphans to the fallback workspace
  IF fallback_ws_id IS NOT NULL THEN
    UPDATE public.vendors SET workspace_id = fallback_ws_id WHERE workspace_id IS NULL;
  END IF;

  -- Custom budget categories (workspace-specific). Seed categories stay NULL = platform-wide defaults.
END $$;

-- ============================================================
-- 6. RLS — drop old broad policies, install workspace-scoped ones
-- ============================================================
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- WORKSPACES
DROP POLICY IF EXISTS "workspaces_select" ON public.workspaces;
CREATE POLICY "workspaces_select" ON public.workspaces
  FOR SELECT USING (public.can_view_workspace(id));

DROP POLICY IF EXISTS "workspaces_insert" ON public.workspaces;
CREATE POLICY "workspaces_insert" ON public.workspaces
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "workspaces_update" ON public.workspaces;
CREATE POLICY "workspaces_update" ON public.workspaces
  FOR UPDATE USING (public.can_admin_workspace(id));

DROP POLICY IF EXISTS "workspaces_delete" ON public.workspaces;
CREATE POLICY "workspaces_delete" ON public.workspaces
  FOR DELETE USING (public.can_admin_workspace(id));

-- WORKSPACE_MEMBERS
DROP POLICY IF EXISTS "members_select" ON public.workspace_members;
CREATE POLICY "members_select" ON public.workspace_members
  FOR SELECT USING (public.can_view_workspace(workspace_id));

DROP POLICY IF EXISTS "members_insert" ON public.workspace_members;
CREATE POLICY "members_insert" ON public.workspace_members
  FOR INSERT WITH CHECK (
    public.can_admin_workspace(workspace_id)
    OR (user_id = auth.uid() AND public.is_superadmin())
  );

DROP POLICY IF EXISTS "members_update" ON public.workspace_members;
CREATE POLICY "members_update" ON public.workspace_members
  FOR UPDATE USING (public.can_admin_workspace(workspace_id));

DROP POLICY IF EXISTS "members_delete" ON public.workspace_members;
CREATE POLICY "members_delete" ON public.workspace_members
  FOR DELETE USING (
    public.can_admin_workspace(workspace_id)
    OR user_id = auth.uid()
  );

-- WORKSPACE_INVITATIONS
DROP POLICY IF EXISTS "invitations_select" ON public.workspace_invitations;
CREATE POLICY "invitations_select" ON public.workspace_invitations
  FOR SELECT USING (
    public.can_admin_workspace(workspace_id)
    OR public.is_superadmin()
  );

DROP POLICY IF EXISTS "invitations_insert" ON public.workspace_invitations;
CREATE POLICY "invitations_insert" ON public.workspace_invitations
  FOR INSERT WITH CHECK (public.can_admin_workspace(workspace_id));

DROP POLICY IF EXISTS "invitations_update" ON public.workspace_invitations;
CREATE POLICY "invitations_update" ON public.workspace_invitations
  FOR UPDATE USING (
    public.can_admin_workspace(workspace_id) OR public.is_superadmin()
  );

DROP POLICY IF EXISTS "invitations_delete" ON public.workspace_invitations;
CREATE POLICY "invitations_delete" ON public.workspace_invitations
  FOR DELETE USING (
    public.can_admin_workspace(workspace_id) OR public.is_superadmin()
  );

-- ADMIN_AUDIT_LOG (superadmin-only)
DROP POLICY IF EXISTS "audit_select" ON public.admin_audit_log;
CREATE POLICY "audit_select" ON public.admin_audit_log
  FOR SELECT USING (public.is_superadmin());

DROP POLICY IF EXISTS "audit_insert" ON public.admin_audit_log;
CREATE POLICY "audit_insert" ON public.admin_audit_log
  FOR INSERT WITH CHECK (public.is_superadmin());

-- ============================================================
-- 7. Replace broad RLS on existing tables with workspace-scoped policies
-- ============================================================

-- USERS: tighten "everyone sees everyone" to "see self + superadmin + members of shared workspaces"
DROP POLICY IF EXISTS "Authenticated can view all users" ON public.users;
DROP POLICY IF EXISTS "users_select_self_or_shared" ON public.users;
CREATE POLICY "users_select_self_or_shared" ON public.users
  FOR SELECT USING (
    auth.uid() = id
    OR public.is_superadmin()
    OR EXISTS (
      SELECT 1
      FROM public.workspace_members me
      JOIN public.workspace_members them ON them.workspace_id = me.workspace_id
      WHERE me.user_id = auth.uid() AND them.user_id = public.users.id
    )
  );

DROP POLICY IF EXISTS "users_update_superadmin" ON public.users;
CREATE POLICY "users_update_superadmin" ON public.users
  FOR UPDATE USING (public.is_superadmin());

-- EVENTS
DROP POLICY IF EXISTS "Authenticated full access events" ON public.events;
DROP POLICY IF EXISTS "events_select" ON public.events;
DROP POLICY IF EXISTS "events_insert" ON public.events;
DROP POLICY IF EXISTS "events_update" ON public.events;
DROP POLICY IF EXISTS "events_delete" ON public.events;
CREATE POLICY "events_select" ON public.events
  FOR SELECT USING (public.can_view_workspace(workspace_id));
CREATE POLICY "events_insert" ON public.events
  FOR INSERT WITH CHECK (public.can_edit_workspace(workspace_id));
CREATE POLICY "events_update" ON public.events
  FOR UPDATE USING (public.can_edit_workspace(workspace_id));
CREATE POLICY "events_delete" ON public.events
  FOR DELETE USING (public.can_edit_workspace(workspace_id));

-- GUESTS
DROP POLICY IF EXISTS "Authenticated full access guests" ON public.guests;
DROP POLICY IF EXISTS "guests_select" ON public.guests;
DROP POLICY IF EXISTS "guests_insert" ON public.guests;
DROP POLICY IF EXISTS "guests_update" ON public.guests;
DROP POLICY IF EXISTS "guests_delete" ON public.guests;
CREATE POLICY "guests_select" ON public.guests
  FOR SELECT USING (public.can_view_workspace(workspace_id));
CREATE POLICY "guests_insert" ON public.guests
  FOR INSERT WITH CHECK (public.can_edit_workspace(workspace_id));
CREATE POLICY "guests_update" ON public.guests
  FOR UPDATE USING (public.can_edit_workspace(workspace_id));
CREATE POLICY "guests_delete" ON public.guests
  FOR DELETE USING (public.can_edit_workspace(workspace_id));

-- EVENT_GUESTS (inherits via parent event)
DROP POLICY IF EXISTS "Authenticated full access event_guests" ON public.event_guests;
DROP POLICY IF EXISTS "event_guests_select" ON public.event_guests;
DROP POLICY IF EXISTS "event_guests_modify" ON public.event_guests;
CREATE POLICY "event_guests_select" ON public.event_guests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND public.can_view_workspace(e.workspace_id))
  );
CREATE POLICY "event_guests_modify" ON public.event_guests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND public.can_edit_workspace(e.workspace_id))
  );

-- BUDGET_CATEGORIES: platform defaults (workspace_id NULL) visible to all auth; custom ones workspace-scoped
DROP POLICY IF EXISTS "Authenticated read categories" ON public.budget_categories;
DROP POLICY IF EXISTS "budget_categories_select" ON public.budget_categories;
DROP POLICY IF EXISTS "budget_categories_modify" ON public.budget_categories;
CREATE POLICY "budget_categories_select" ON public.budget_categories
  FOR SELECT USING (
    workspace_id IS NULL
    OR public.can_view_workspace(workspace_id)
  );
CREATE POLICY "budget_categories_modify" ON public.budget_categories
  FOR ALL USING (
    workspace_id IS NOT NULL
    AND public.can_edit_workspace(workspace_id)
  );

-- BUDGET_ITEMS
DROP POLICY IF EXISTS "Authenticated full access budget_items" ON public.budget_items;
DROP POLICY IF EXISTS "budget_items_select" ON public.budget_items;
DROP POLICY IF EXISTS "budget_items_insert" ON public.budget_items;
DROP POLICY IF EXISTS "budget_items_update" ON public.budget_items;
DROP POLICY IF EXISTS "budget_items_delete" ON public.budget_items;
CREATE POLICY "budget_items_select" ON public.budget_items
  FOR SELECT USING (public.can_view_workspace(workspace_id));
CREATE POLICY "budget_items_insert" ON public.budget_items
  FOR INSERT WITH CHECK (public.can_edit_workspace(workspace_id));
CREATE POLICY "budget_items_update" ON public.budget_items
  FOR UPDATE USING (public.can_edit_workspace(workspace_id));
CREATE POLICY "budget_items_delete" ON public.budget_items
  FOR DELETE USING (public.can_edit_workspace(workspace_id));

-- VENDORS
DROP POLICY IF EXISTS "Authenticated full access vendors" ON public.vendors;
DROP POLICY IF EXISTS "vendors_select" ON public.vendors;
DROP POLICY IF EXISTS "vendors_insert" ON public.vendors;
DROP POLICY IF EXISTS "vendors_update" ON public.vendors;
DROP POLICY IF EXISTS "vendors_delete" ON public.vendors;
CREATE POLICY "vendors_select" ON public.vendors
  FOR SELECT USING (public.can_view_workspace(workspace_id));
CREATE POLICY "vendors_insert" ON public.vendors
  FOR INSERT WITH CHECK (public.can_edit_workspace(workspace_id));
CREATE POLICY "vendors_update" ON public.vendors
  FOR UPDATE USING (public.can_edit_workspace(workspace_id));
CREATE POLICY "vendors_delete" ON public.vendors
  FOR DELETE USING (public.can_edit_workspace(workspace_id));

-- PAYMENTS (inherits via budget_item -> event)
DROP POLICY IF EXISTS "Authenticated full access payments" ON public.payments;
DROP POLICY IF EXISTS "payments_select" ON public.payments;
DROP POLICY IF EXISTS "payments_modify" ON public.payments;
CREATE POLICY "payments_select" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.budget_items bi
      WHERE bi.id = budget_item_id AND public.can_view_workspace(bi.workspace_id)
    )
  );
CREATE POLICY "payments_modify" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.budget_items bi
      WHERE bi.id = budget_item_id AND public.can_edit_workspace(bi.workspace_id)
    )
  );

-- TASKS
DROP POLICY IF EXISTS "Authenticated full access tasks" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;
CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT USING (public.can_view_workspace(workspace_id));
CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT WITH CHECK (public.can_edit_workspace(workspace_id));
CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE USING (public.can_edit_workspace(workspace_id));
CREATE POLICY "tasks_delete" ON public.tasks
  FOR DELETE USING (public.can_edit_workspace(workspace_id));

-- DOCUMENTS
DROP POLICY IF EXISTS "Authenticated full access documents" ON public.documents;
DROP POLICY IF EXISTS "documents_select" ON public.documents;
DROP POLICY IF EXISTS "documents_insert" ON public.documents;
DROP POLICY IF EXISTS "documents_update" ON public.documents;
DROP POLICY IF EXISTS "documents_delete" ON public.documents;
CREATE POLICY "documents_select" ON public.documents
  FOR SELECT USING (public.can_view_workspace(workspace_id));
CREATE POLICY "documents_insert" ON public.documents
  FOR INSERT WITH CHECK (public.can_edit_workspace(workspace_id));
CREATE POLICY "documents_update" ON public.documents
  FOR UPDATE USING (public.can_edit_workspace(workspace_id));
CREATE POLICY "documents_delete" ON public.documents
  FOR DELETE USING (public.can_edit_workspace(workspace_id));

-- TIMELINE
DROP POLICY IF EXISTS "Authenticated full access timeline" ON public.timeline_items;
DROP POLICY IF EXISTS "timeline_select" ON public.timeline_items;
DROP POLICY IF EXISTS "timeline_insert" ON public.timeline_items;
DROP POLICY IF EXISTS "timeline_update" ON public.timeline_items;
DROP POLICY IF EXISTS "timeline_delete" ON public.timeline_items;
CREATE POLICY "timeline_select" ON public.timeline_items
  FOR SELECT USING (public.can_view_workspace(workspace_id));
CREATE POLICY "timeline_insert" ON public.timeline_items
  FOR INSERT WITH CHECK (public.can_edit_workspace(workspace_id));
CREATE POLICY "timeline_update" ON public.timeline_items
  FOR UPDATE USING (public.can_edit_workspace(workspace_id));
CREATE POLICY "timeline_delete" ON public.timeline_items
  FOR DELETE USING (public.can_edit_workspace(workspace_id));

-- VENDOR_REVIEWS: keep platform-readable so couples can read all reviews of a vendor they're considering;
-- write only by the reviewer themselves (or superadmin).
DROP POLICY IF EXISTS "Authenticated full access reviews" ON public.vendor_reviews;
DROP POLICY IF EXISTS "reviews_select" ON public.vendor_reviews;
DROP POLICY IF EXISTS "reviews_insert" ON public.vendor_reviews;
DROP POLICY IF EXISTS "reviews_update" ON public.vendor_reviews;
DROP POLICY IF EXISTS "reviews_delete" ON public.vendor_reviews;
CREATE POLICY "reviews_select" ON public.vendor_reviews
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "reviews_insert" ON public.vendor_reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "reviews_update" ON public.vendor_reviews
  FOR UPDATE USING (reviewer_id = auth.uid() OR public.is_superadmin());
CREATE POLICY "reviews_delete" ON public.vendor_reviews
  FOR DELETE USING (reviewer_id = auth.uid() OR public.is_superadmin());

-- GIFTS
DROP POLICY IF EXISTS "Authenticated full access gifts" ON public.gifts;
DROP POLICY IF EXISTS "gifts_select" ON public.gifts;
DROP POLICY IF EXISTS "gifts_insert" ON public.gifts;
DROP POLICY IF EXISTS "gifts_update" ON public.gifts;
DROP POLICY IF EXISTS "gifts_delete" ON public.gifts;
CREATE POLICY "gifts_select" ON public.gifts
  FOR SELECT USING (public.can_view_workspace(workspace_id));
CREATE POLICY "gifts_insert" ON public.gifts
  FOR INSERT WITH CHECK (public.can_edit_workspace(workspace_id));
CREATE POLICY "gifts_update" ON public.gifts
  FOR UPDATE USING (public.can_edit_workspace(workspace_id));
CREATE POLICY "gifts_delete" ON public.gifts
  FOR DELETE USING (public.can_edit_workspace(workspace_id));

-- EVENT_COLLABORATORS (legacy: superseded by workspace_members; keep readable for now)
DROP POLICY IF EXISTS "Authenticated full access collaborators" ON public.event_collaborators;
DROP POLICY IF EXISTS "event_collaborators_select" ON public.event_collaborators;
CREATE POLICY "event_collaborators_select" ON public.event_collaborators
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND public.can_view_workspace(e.workspace_id))
    OR public.is_superadmin()
  );

-- ============================================================
-- 8. ENABLE REALTIME ON NEW TABLES
-- ============================================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['workspaces', 'workspace_members', 'workspace_invitations'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
    END IF;
  END LOOP;
END $$;

COMMIT;
