-- Create storage bucket for lesson descriptions (admin image uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-images',
  'lesson-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- Public read access
DROP POLICY IF EXISTS "Public read lesson images" ON storage.objects;
CREATE POLICY "Public read lesson images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lesson-images');

-- Only admins can upload
DROP POLICY IF EXISTS "Admins upload lesson images" ON storage.objects;
CREATE POLICY "Admins upload lesson images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lesson-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can delete
DROP POLICY IF EXISTS "Admins delete lesson images" ON storage.objects;
CREATE POLICY "Admins delete lesson images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'lesson-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
