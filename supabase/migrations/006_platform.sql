-- Dua platform: PC dan Mobile.
-- Jalankan sekali di Supabase SQL Editor (setelah migration 001 - 005).

-- 1) Kolom platform di players dan talents. Data lama otomatis jadi 'pc'.
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'pc';
ALTER TABLE public.talents
  ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'pc';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'players_platform_check') THEN
    ALTER TABLE public.players
      ADD CONSTRAINT players_platform_check CHECK (platform IN ('pc', 'mobile'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'talents_platform_check') THEN
    ALTER TABLE public.talents
      ADD CONSTRAINT talents_platform_check CHECK (platform IN ('pc', 'mobile'));
  END IF;
END $$;

-- 2) Index supaya query per platform tetap cepat.
CREATE INDEX IF NOT EXISTS idx_players_platform_tier_sort
  ON public.players (platform, tier, sort_order);
CREATE INDEX IF NOT EXISTS idx_talents_platform
  ON public.talents (platform);

-- 3) Talent Mobile: salin daftar talent PC (nama dan ikon sama),
--    pemegangnya kosong. Aman dijalankan ulang (tidak menggandakan).
INSERT INTO public.talents (name, category, holder_id, icon, platform)
SELECT t.name, t.category, NULL, t.icon, 'mobile'
FROM public.talents t
WHERE t.platform = 'pc'
  AND NOT EXISTS (
    SELECT 1 FROM public.talents m
    WHERE m.platform = 'mobile'
      AND m.name = t.name
      AND m.category = t.category
  );
