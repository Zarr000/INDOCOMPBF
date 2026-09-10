-- Tighten admin mutations to users with app_metadata.role = 'admin'.
-- Set this in Supabase Auth user app_metadata before using admin CRUD.

DROP POLICY IF EXISTS "Authenticated can insert players" ON public.players;
DROP POLICY IF EXISTS "Authenticated can update players" ON public.players;
DROP POLICY IF EXISTS "Authenticated can delete players" ON public.players;
DROP POLICY IF EXISTS "Authenticated can insert talents" ON public.talents;
DROP POLICY IF EXISTS "Authenticated can update talents" ON public.talents;
DROP POLICY IF EXISTS "Authenticated can delete talents" ON public.talents;

CREATE POLICY "Admins can insert players" ON public.players FOR INSERT
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admins can update players" ON public.players FOR UPDATE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admins can delete players" ON public.players FOR DELETE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can insert talents" ON public.talents FOR INSERT
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admins can update talents" ON public.talents FOR UPDATE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admins can delete talents" ON public.talents FOR DELETE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Authenticated upload player-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update player-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete player-images" ON storage.objects;

CREATE POLICY "Admins upload player-images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'player-images' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admins update player-images" ON storage.objects FOR UPDATE
  USING (bucket_id = 'player-images' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admins delete player-images" ON storage.objects FOR DELETE
  USING (bucket_id = 'player-images' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
