-- ============================================================
-- Storage Buckets Setup (run in Supabase SQL Editor after main migration)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('event-documents', 'event-documents', true),
  ('event-photos', 'event-photos', true),
  ('avatars', 'avatars', true),
  ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to event-documents
DROP POLICY IF EXISTS "Authenticated upload event-documents" ON storage.objects;
CREATE POLICY "Authenticated upload event-documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('event-documents', 'event-photos', 'avatars', 'contracts'));

DROP POLICY IF EXISTS "Authenticated read event-documents" ON storage.objects;
CREATE POLICY "Authenticated read event-documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id IN ('event-documents', 'event-photos', 'avatars', 'contracts'));

DROP POLICY IF EXISTS "Public read public buckets" ON storage.objects;
CREATE POLICY "Public read public buckets" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id IN ('event-photos', 'avatars'));

DROP POLICY IF EXISTS "Authenticated delete own uploads" ON storage.objects;
CREATE POLICY "Authenticated delete own uploads" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('event-documents', 'event-photos', 'avatars', 'contracts'));
