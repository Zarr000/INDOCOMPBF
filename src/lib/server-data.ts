import { createClient } from '@/lib/supabase/server';
import type { Player, Tier } from '@/types/player';
import type { Talent } from '@/types/talent';
import { tierPriority } from '@/lib/player-order';
import type { Platform } from '@/lib/platform';

// Without a platform, both PC and Mobile players are returned (each has a `platform` field).
export async function getPlayers(platform?: Platform): Promise<Player[]> {
  const supabase = await createClient();
  let query = supabase
    .from('players')
    .select('*')
    .order('sort_order', { ascending: true });
  if (platform) query = query.eq('platform', platform);
  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .sort((a, b) => {
      const pa = tierPriority(a.tier);
      const pb = tierPriority(b.tier);
      if (pa !== pb) return pa - pb;
      return a.sort_order - b.sort_order;
    })
    .map((p) => ({
      id: String(p.id),
      legacy_id: p.legacy_id,
      name: p.name,
      tier: p.tier,
      country: p.country,
      image: p.image,
      fruit: p.fruit ?? undefined,
      discord: p.discord ?? undefined,
      youtube: p.youtube ?? undefined,
      tiktok: p.tiktok ?? undefined,
      platform: p.platform,
    }));
}

export async function getTalents(platform?: Platform): Promise<Talent[]> {
  const supabase = await createClient();
  let query = supabase
    .from('talents')
    .select('*, players(id, legacy_id, name, image, tier, country, fruit, platform)')
    .order('id');
  if (platform) query = query.eq('platform', platform);
  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((t) => {
    const holder = t.players as {
      id: number; legacy_id: string; name: string; image: string;
      tier: string; country: string; fruit: string | null; platform: Platform;
    } | null;

    return {
      id: String(t.id),
      name: t.name,
      category: t.category,
      holder_id: t.holder_id === null ? null : String(t.holder_id),
      icon: t.icon,
      platform: t.platform,
      holder: holder ? holder.name : 'Example',
      holderPlayer: holder
        ? {
            id: String(holder.id),
            legacy_id: holder.legacy_id,
            name: holder.name,
            tier: holder.tier as Tier,
            country: holder.country,
            image: holder.image,
            fruit: holder.fruit ?? undefined,
            platform: holder.platform,
          }
        : null,
    };
  });
}
