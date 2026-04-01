-- Public bucket for property photos/videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-media', 'property-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view property media"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-media');

CREATE POLICY "Authenticated users can upload property media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-media');

CREATE POLICY "Authenticated users can update property media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'property-media')
WITH CHECK (bucket_id = 'property-media');

CREATE POLICY "Authenticated users can delete property media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-media');
