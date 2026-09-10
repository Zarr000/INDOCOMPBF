import { NextResponse } from 'next/server';
import { createClientWithToken } from '@/lib/supabase/server';

const BUCKET = 'player-images';
const ALLOWED = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'mp4', 'webm']);

type StorageFile = { name: string; id?: string | null; created_at?: string | null; metadata?: { mimetype?: string; original_name?: string } | null };

export async function GET(request: Request) {
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createClientWithToken(token);
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || userData?.user?.app_metadata?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: root, error } = await supabase.storage.from(BUCKET).list('', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });
  if (error) { console.error('media listing failed', error.message); return NextResponse.json({ error: 'Unable to load media' }, { status: 500 }); }

  const folder = (root ?? []).find((item) => item.name === 'players' && item.id === null);
  let files: Array<{ file: StorageFile; path: string }> = (root ?? []).filter((item) => item.id !== null).map((file) => ({ file, path: file.name }));
  if (folder) {
    const { data: nested, error: nestedError } = await supabase.storage.from(BUCKET).list('players', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });
    if (nestedError) return NextResponse.json({ error: 'Unable to load media' }, { status: 500 });
    files = [...files, ...(nested ?? []).filter((file) => file.id !== null).map((file) => ({ file, path: `players/${file.name}` }))];
  }

  const images = files.filter(({ file }) => ALLOWED.has(file.name.split('.').pop()?.toLowerCase() ?? '')).map(({ file, path }) => ({
    storagePath: path,
    displayName: file.metadata?.original_name || file.name,
    name: file.metadata?.original_name || file.name,
    url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
    created_at: file.created_at ?? undefined,
    content_type: file.metadata?.mimetype ?? undefined,
  }));
  return NextResponse.json({ images });
}
