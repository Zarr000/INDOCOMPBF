import { NextResponse } from 'next/server';
import { createClient, createClientWithToken } from '@/lib/supabase/server';
import { insertAtBottom, tierPriority } from '@/lib/player-order';
import { parsePlayerBody, isSafeError } from '@/lib/validate';
import { isPlatform, type Platform } from '@/lib/platform';

export async function GET(request: Request) {
  const supabase = await createClient();
  const platformParam = new URL(request.url).searchParams.get('platform');
  let query = supabase
    .from('players')
    .select('*')
    .order('sort_order', { ascending: true });
  if (isPlatform(platformParam)) query = query.eq('platform', platformParam);
  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const players = (data ?? [])
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

  return NextResponse.json({ players });
}

export async function POST(request: Request) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClientWithToken(token);
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || userData?.user?.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const parsed = parsePlayerBody(raw);
  if (isSafeError(parsed)) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const body = raw as { player?: { legacy_id?: unknown } };
  const legacyId = typeof body.player?.legacy_id === 'string' && body.player.legacy_id.trim()
    ? body.player.legacy_id.trim().slice(0, 80)
    : crypto.randomUUID();

  try {
    const row = await insertAtBottom(supabase, {
      legacy_id: legacyId,
      ...parsed,
      sort_order: 0,
    });
    return NextResponse.json({ player: sanitize(row) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed' },
      { status: 400 }
    );
  }
}

function getToken(request: Request): string | null {
  const auth = request.headers.get('authorization') ?? '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

function sanitize(row: {
  id: number; legacy_id: string; name: string; tier: string;
  country: string; image: string; fruit: string | null;
  discord: string | null; youtube: string | null; tiktok: string | null;
  platform: Platform;
}) {
  return {
    id: String(row.id),
    legacy_id: row.legacy_id,
    name: row.name,
    tier: row.tier,
    country: row.country,
    image: row.image,
    fruit: row.fruit ?? undefined,
    discord: row.discord ?? undefined,
    youtube: row.youtube ?? undefined,
    tiktok: row.tiktok ?? undefined,
    platform: row.platform,
  };
}
