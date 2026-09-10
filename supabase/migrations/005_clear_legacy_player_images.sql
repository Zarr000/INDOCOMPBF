-- Clear only legacy local player-media references.
-- Preserves player rows, IDs, ranking, tier, and all non-image fields.
UPDATE public.players
SET image = ''
WHERE image LIKE '/players/%';
