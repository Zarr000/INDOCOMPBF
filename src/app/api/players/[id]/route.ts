import { NextResponse } from 'next/server';
import { createClientWithToken } from '@/lib/supabase/server';
import { movePlayerTier } from '@/lib/player-order';
import { parsePlayerBody, isSafeError, parsePlayerId } from '@/lib/validate';

function getToken(request: Request): string | null {
  const auth = request.headers.get('authorization') ?? '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parsePlayerId(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid player id' }, { status: 400 });
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

  // Read current row (for old tier + sort_order preservation)
  const { data: oldRow, error: fetchErr } = await supabase
    .from('players')
    .select('tier, sort_order')
    .eq('id', id)
    .single();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 404 });

  const oldTier = oldRow!.tier;
  const newTier = parsed.tier;
  const updates: Record<string, unknown> = { ...parsed };

  if (newTier !== oldTier) {
    // Preserve position only when tier unchanged; let movePlayerTier handle sort_order.
    delete (updates as { sort_order?: unknown }).sort_order;
  }

  const { data, error } = await supabase
    .from('players')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Apply tier-ordering rules (skipped when same tier → position unchanged).
  try {
    await movePlayerTier(supabase, id, oldTier, newTier);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'reindex failed' },
      { status: 400 }
    );
  }

  return NextResponse.json({ player: { id: String(data.id), ...data } });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parsePlayerId(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid player id' }, { status: 400 });
  const supabase = createClientWithToken(token);
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || userData?.user?.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Need the tier to reindex after deletion.
  const { data: row } = await supabase
    .from('players')
    .select('tier')
    .eq('id', id)
    .single();
  const tier = row?.tier;

  const { error } = await supabase
    .from('players')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Reindex remaining players in the same tier (preserves relative order, recalculates ranks).
  if (tier) {
    const { data: rest, error: reErr } = await supabase
      .from('players')
      .select('id, sort_order')
      .eq('tier', tier)
      .order('sort_order', { ascending: true });
    if (!reErr) {
      for (let i = 0; i < rest.length; i++) {
        await supabase
          .from('players')
          .update({ sort_order: i })
          .eq('id', (rest[i] as { id: number }).id);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
