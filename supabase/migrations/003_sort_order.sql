-- Adds persistent per-tier ordering (sort_order).
-- Safe for existing data. No table drop. No PL/pgSQL row loops.

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_players_tier_sort ON public.players(tier, sort_order);

-- Seed from numeric legacy_id only (skip NULL/empty/non-numeric).
UPDATE public.players
SET sort_order = CASE
  WHEN legacy_id ~ '^[0-9]+$' THEN legacy_id::int
  ELSE sort_order
END
WHERE sort_order = 0;

-- Contiguous 0..N-1 per tier.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tier
      ORDER BY sort_order ASC, id ASC
    ) - 1 AS new_order
  FROM public.players
)
UPDATE public.players p
SET sort_order = ranked.new_order
FROM ranked
WHERE p.id = ranked.id;
