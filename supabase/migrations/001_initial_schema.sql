-- INDOCOMP Database Schema
-- Run this in Supabase SQL Editor

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id BIGSERIAL PRIMARY KEY,
  legacy_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5')),
  country TEXT NOT NULL DEFAULT 'Indonesia',
  image TEXT NOT NULL DEFAULT '',
  fruit TEXT,
  discord TEXT,
  youtube TEXT,
  tiktok TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Talents table
CREATE TABLE IF NOT EXISTS talents (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('fruit','sword')),
  holder_id BIGINT REFERENCES players(id) ON DELETE SET NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_players_legacy_id ON players(legacy_id);
CREATE INDEX IF NOT EXISTS idx_players_tier ON players(tier);
CREATE INDEX IF NOT EXISTS idx_players_tier_sort ON players(tier, sort_order);
CREATE INDEX IF NOT EXISTS idx_talents_category ON talents(category);
CREATE INDEX IF NOT EXISTS idx_talents_holder_id ON talents(holder_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER talents_updated_at
  BEFORE UPDATE ON talents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE talents ENABLE ROW LEVEL SECURITY;

-- Public read access for players (landing page, talents page need this)
CREATE POLICY "Public can read players"
  ON players FOR SELECT
  USING (true);

-- Public read access for talents (landing page, talents page need this)
CREATE POLICY "Public can read talents"
  ON talents FOR SELECT
  USING (true);

-- Authenticated users can manage players (admin only)
CREATE POLICY "Authenticated can insert players"
  ON players FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update players"
  ON players FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete players"
  ON players FOR DELETE
  USING (auth.role() = 'authenticated');

-- Authenticated users can manage talents (admin only)
CREATE POLICY "Authenticated can insert talents"
  ON talents FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update talents"
  ON talents FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete talents"
  ON talents FOR DELETE
  USING (auth.role() = 'authenticated');
