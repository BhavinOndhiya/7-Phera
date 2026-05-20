-- ============================================================
-- Wedding Planner — Initial Schema Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS (mirrors auth.users with profile + role)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('bride', 'groom', 'family', 'planner')) DEFAULT 'family',
  phone TEXT,
  avatar_url TEXT,
  preferred_locale TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  event_type TEXT CHECK (event_type IN ('engagement', 'wedding', 'reception', 'sangeet', 'mehendi', 'haldi', 'other')),
  event_date DATE NOT NULL,
  venue TEXT,
  venue_address TEXT,
  theme_name TEXT,
  theme_colors TEXT[],
  theme_description TEXT,
  estimated_guests INTEGER DEFAULT 0,
  notes TEXT,
  seating_layout JSONB,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. GUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  side TEXT CHECK (side IN ('bride', 'groom')),
  relation TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  age_group TEXT CHECK (age_group IN ('child', 'adult', 'senior')) DEFAULT 'adult',
  dietary_restrictions TEXT[],
  plus_one BOOLEAN DEFAULT FALSE,
  invitation_status TEXT CHECK (invitation_status IN ('not_sent', 'sent', 'delivered', 'opened')) DEFAULT 'not_sent',
  rsvp_status TEXT CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'tentative')) DEFAULT 'pending',
  rsvp_date TIMESTAMPTZ,
  qr_code TEXT,
  arrival_date DATE,
  hotel_name TEXT,
  hotel_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. EVENT_GUESTS (M2M)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.event_guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE,
  invited BOOLEAN DEFAULT TRUE,
  attended BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  table_number INTEGER,
  UNIQUE(event_id, guest_id)
);

-- ============================================================
-- 5. BUDGET_CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.budget_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_category_id UUID REFERENCES public.budget_categories(id),
  icon TEXT,
  sort_order INTEGER DEFAULT 0
);

INSERT INTO public.budget_categories (name, description, icon, sort_order) VALUES
('Venue & Catering', 'Venue rental, catering, food, beverages', 'utensils', 1),
('Photography & Videography', 'Photographers, videographers, albums', 'camera', 2),
('Decor & Flowers', 'Floral arrangements, stage decor, lighting', 'flower', 3),
('Attire & Jewelry', 'Bride/groom outfits, jewelry, accessories', 'shirt', 4),
('Entertainment', 'DJ, band, performers, sound system', 'music', 5),
('Invitations & Stationery', 'Cards, printing, postage', 'mail', 6),
('Transportation', 'Guest transport, wedding car, parking', 'car', 7),
('Accommodation', 'Hotel bookings for guests', 'hotel', 8),
('Makeup & Beauty', 'Bridal makeup, mehendi, spa', 'sparkles', 9),
('Gifts & Favors', 'Return gifts, guest favors', 'gift', 10),
('Miscellaneous', 'Other expenses', 'more-horizontal', 99)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 7. VENDORS (defined before budget_items because of FK)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  website TEXT,
  rating DECIMAL(2, 1) CHECK (rating >= 0 AND rating <= 5),
  price_range TEXT,
  notes TEXT,
  contract_signed BOOLEAN DEFAULT FALSE,
  contract_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. BUDGET_ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.budget_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.budget_categories(id),
  item_name TEXT NOT NULL,
  description TEXT,
  estimated_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
  actual_cost DECIMAL(12, 2),
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  payment_status TEXT CHECK (payment_status IN ('unpaid', 'partial', 'paid')) DEFAULT 'unpaid',
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_item_id UUID REFERENCES public.budget_items(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer', 'cheque', 'razorpay')),
  transaction_id TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. TASKS / CHECKLIST
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  due_date DATE,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')) DEFAULT 'todo',
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. DOCUMENTS / FILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT,
  file_type TEXT,
  file_size INTEGER,
  category TEXT CHECK (category IN ('contract', 'invoice', 'inspiration', 'guest_list', 'photo', 'other')) DEFAULT 'other',
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. TIMELINE / SCHEDULE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.timeline_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location TEXT,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. VENDOR_REVIEWS (Phase 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vendor_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. GIFTS (Phase 2)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12, 2),
  url TEXT,
  image_url TEXT,
  claimed_by UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. EVENT_COLLABORATORS (Phase 2: multi-user)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.event_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'editor', 'viewer')) DEFAULT 'editor',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(event_id, user_id)
);

-- ============================================================
-- INDEXES (per plan.md performance section)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_guests_side ON public.guests(side);
CREATE INDEX IF NOT EXISTS idx_guests_rsvp ON public.guests(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_budget_event ON public.budget_items(event_id);
CREATE INDEX IF NOT EXISTS idx_budget_category ON public.budget_items(category_id);
CREATE INDEX IF NOT EXISTS idx_event_guests_event ON public.event_guests(event_id);
CREATE INDEX IF NOT EXISTS idx_event_guests_guest ON public.event_guests(guest_id);
CREATE INDEX IF NOT EXISTS idx_tasks_event ON public.tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_timeline_event ON public.timeline_items(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_item ON public.payments(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_documents_event ON public.documents(event_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY['events', 'guests', 'budget_items', 'vendors', 'tasks'])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();',
      t, t
    );
  END LOOP;
END $$;

-- ============================================================
-- AUTO-CREATE PUBLIC USERS ROW ON AUTH SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'family'),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- AUTO-UPDATE BUDGET ITEM PAYMENT STATUS ON PAYMENT INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION public.recalc_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  total_paid DECIMAL(12,2);
  item_cost DECIMAL(12,2);
  target_id UUID;
BEGIN
  target_id := COALESCE(NEW.budget_item_id, OLD.budget_item_id);
  SELECT COALESCE(SUM(amount), 0) INTO total_paid FROM public.payments WHERE budget_item_id = target_id;
  SELECT COALESCE(actual_cost, estimated_cost) INTO item_cost FROM public.budget_items WHERE id = target_id;

  UPDATE public.budget_items
  SET paid_amount = total_paid,
      payment_status = CASE
        WHEN total_paid >= COALESCE(item_cost, 0) AND total_paid > 0 THEN 'paid'
        WHEN total_paid > 0 THEN 'partial'
        ELSE 'unpaid'
      END
  WHERE id = target_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payments_recalc ON public.payments;
CREATE TRIGGER payments_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.recalc_payment_status();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_collaborators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated can view all users" ON public.users;
CREATE POLICY "Authenticated can view all users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated full access events" ON public.events;
CREATE POLICY "Authenticated full access events" ON public.events
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated full access guests" ON public.guests;
CREATE POLICY "Authenticated full access guests" ON public.guests
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated full access event_guests" ON public.event_guests;
CREATE POLICY "Authenticated full access event_guests" ON public.event_guests
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated read categories" ON public.budget_categories;
CREATE POLICY "Authenticated read categories" ON public.budget_categories
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated full access budget_items" ON public.budget_items;
CREATE POLICY "Authenticated full access budget_items" ON public.budget_items
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated full access vendors" ON public.vendors;
CREATE POLICY "Authenticated full access vendors" ON public.vendors
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated full access payments" ON public.payments;
CREATE POLICY "Authenticated full access payments" ON public.payments
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated full access tasks" ON public.tasks;
CREATE POLICY "Authenticated full access tasks" ON public.tasks
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated full access documents" ON public.documents;
CREATE POLICY "Authenticated full access documents" ON public.documents
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated full access timeline" ON public.timeline_items;
CREATE POLICY "Authenticated full access timeline" ON public.timeline_items
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated full access reviews" ON public.vendor_reviews;
CREATE POLICY "Authenticated full access reviews" ON public.vendor_reviews
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated full access gifts" ON public.gifts;
CREATE POLICY "Authenticated full access gifts" ON public.gifts
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated full access collaborators" ON public.event_collaborators;
CREATE POLICY "Authenticated full access collaborators" ON public.event_collaborators
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- ENABLE REALTIME ON KEY TABLES
-- (Also enable in Dashboard: Database > Replication)
-- ============================================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['events', 'guests', 'budget_items', 'tasks', 'payments'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
