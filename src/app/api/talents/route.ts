import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Tier } from '@/types/player';
import { isPlatform, type Platform } from '@/lib/platform';

export async function GET(request: Request) {
  const supabase = await createClient();
  const platformParam = new URL(request.url).searchParams.get('platform');
  let query = supabase
    .from('talents')
    .select('*, players(id, legacy_id, name, image, tier, country, fruit, platform)')
    .order('id');
  if (isPlatform(platformParam)) query = query.eq('platform', platformParam);
  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const talents = (data ?? []).map((t) => {
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

  return NextResponse.json({ talents });
}
