import { NextResponse } from 'next/server';
import { createClientWithToken } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = createClientWithToken(token);
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || userData?.user?.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { holder } = await request.json();

  // A talent can only be held by a player of the same platform.
  const { data: talent, error: tErr } = await supabase
    .from('talents')
    .select('id, platform')
    .eq('id', Number(params.id))
    .maybeSingle();
  if (tErr || !talent) {
    return NextResponse.json({ error: 'Talent not found' }, { status: 404 });
  }

  let holderId: number | null = null;
  if (holder && String(holder).trim().toLowerCase() !== 'example') {
    const { data: pd, error: pErr } = await supabase
      .from('players')
      .select('id')
      .eq('platform', talent.platform)
      .ilike('name', holder.trim())
      .maybeSingle();
    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 400 });
    }
    holderId = pd ? pd.id : null;
  }

  const { error } = await supabase
    .from('talents')
    .update({ holder_id: holderId })
    .eq('id', Number(params.id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
