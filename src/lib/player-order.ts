import type { SupabaseClient } from '@supabase/supabase-js';
import type { Platform } from '@/lib/platform';
type Row = {
  id: number;
  legacy_id: string;
  name: string;
  tier: string;
  country: string;
  image: string;
  fruit: string | null;
  discord: string | null;
  youtube: string | null;
  tiktok: string | null;
  platform: Platform;
  created_at: string;
  updated_at: string;
  sort_order: number;
};

export const TIER_PRIORITY: Record<string, number> = {
  HT1: 0,
  LT1: 1,
  HT2: 2,
  LT2: 3,
  HT3: 4,
  LT3: 5,
  HT4: 6,
  LT4: 7,
  HT5: 8,
  LT5: 9,
};

export function tierPriority(tier: string): number {
  return TIER_PRIORITY[tier] ?? 99;
}

// Every ordering function works inside ONE platform, so PC and Mobile never
// shift each other's positions.
export async function reindexTier(
  supabase: SupabaseClient,
  tier: string,
  platform: Platform
): Promise<void> {
  const { data, error } = await supabase
    .from('players')
    .select('id')
    .eq('platform', platform)
    .eq('tier', tier)
    .order('sort_order', { ascending: true });
  if (error) throw error;

  for (let i = 0; i < data.length; i++) {
    await supabase
      .from('players')
      .update({ sort_order: i })
      .eq('id', (data[i] as { id: number }).id);
  }
}

export async function insertAtBottom(
  supabase: SupabaseClient,
  payload: Omit<Row, 'id' | 'created_at' | 'updated_at'> & {
    created_at?: string;
    updated_at?: string;
  }
): Promise<Row> {
  const { data: maxRow, error: maxErr } = await supabase
    .from('players')
    .select('sort_order')
    .eq('platform', payload.platform)
    .eq('tier', payload.tier)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxErr) throw maxErr;

  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('players')
    .insert({ ...payload, sort_order: nextOrder })
    .select()
    .single();

  if (error) throw error;
  return data as Row;
}

export async function movePlayerTier(
  supabase: SupabaseClient,
  playerId: number,
  oldTier: string,
  newTier: string,
  platform: Platform
): Promise<void> {
  if (oldTier === newTier) {
    return; 
  }

  await reindexTier(supabase, oldTier, platform);

  const { data: existing, error: listErr } = await supabase
    .from('players')
    .select('id, sort_order')
    .eq('platform', platform)
    .eq('tier', newTier)
    .order('sort_order', { ascending: true });
  if (listErr) throw listErr;

  const movingUp = tierPriority(newTier) < tierPriority(oldTier);

  let orderedIds: number[];
  if (movingUp) {
    orderedIds = [...existing.map((p) => (p as { id: number }).id), playerId];
  } else {
    orderedIds = [playerId, ...existing.map((p) => (p as { id: number }).id)];
  }

  for (let i = 0; i < orderedIds.length; i++) {
    const { error: updErr } = await supabase
      .from('players')
      .update({ sort_order: i })
      .eq('id', orderedIds[i]);
    if (updErr) throw updErr;
  }
}
