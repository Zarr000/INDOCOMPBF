-- INDOCOMP Storage
-- Creates the player-images bucket with:
--   - public read (images referenced by players.image / public URL)
--   - authenticated (admin) write only
-- Public URLs are generated in-app via getPublicUrl.

INSERT INTO storage.buckets (id, name, public)
VALUES ('player-images', 'player-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read: any authenticated or anonymous user can view images
CREATE POLICY "Public read player-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'player-images');

-- Authenticated (admin) can upload
CREATE POLICY "Authenticated upload player-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'player-images' AND auth.role() = 'authenticated');

-- Authenticated (admin) can update/delete
CREATE POLICY "Authenticated update player-images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'player-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete player-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'player-images' AND auth.role() = 'authenticated');
