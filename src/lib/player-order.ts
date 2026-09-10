import type { SupabaseClient } from '@supabase/supabase-js';
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

// Re-index a tier to a contiguous 0..N-1 sort_order based on current order.
export async function reindexTier(
  supabase: SupabaseClient,
  tier: string
): Promise<void> {
  const { data, error } = await supabase
    .from('players')
    .select('id')
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

// Insert a new player at the BOTTOM of its tier.
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

// Move an existing player between tiers following the rules:
//  - moved UP (new tier higher priority):  bottom of destination
//  - moved DOWN (new tier lower priority): top of destination
//  - same tier: preserve current position
export async function movePlayerTier(
  supabase: SupabaseClient,
  playerId: number,
  oldTier: string,
  newTier: string
): Promise<void> {
  if (oldTier === newTier) {
    return; // preserve position (caller must not touch sort_order)
  }

  // Detach from old tier: clear gap (reindex old tier contiguously).
  await reindexTier(supabase, oldTier);

  // Fetch the destination tier players ordered by sort_order asc.
  const { data: existing, error: listErr } = await supabase
    .from('players')
    .select('id, sort_order')
    .eq('tier', newTier)
    .order('sort_order', { ascending: true });
  if (listErr) throw listErr;

  const movingUp = tierPriority(newTier) < tierPriority(oldTier);

  let orderedIds: number[];
  if (movingUp) {
    // BOTTOM of destination tier
    orderedIds = [...existing.map((p) => (p as { id: number }).id), playerId];
  } else {
    // MOVED DOWN -> TOP of destination tier
    orderedIds = [playerId, ...existing.map((p) => (p as { id: number }).id)];
  }

  // Reassign sort_order = index
  for (let i = 0; i < orderedIds.length; i++) {
    const { error: updErr } = await supabase
      .from('players')
      .update({ sort_order: i })
      .eq('id', orderedIds[i]);
    if (updErr) throw updErr;
  }
}
