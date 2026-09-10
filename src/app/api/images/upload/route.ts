import { NextResponse } from 'next/server';
import { createClientWithToken } from '@/lib/supabase/server';

const BUCKET = 'player-images';
const ALLOWED: Record<string, string[]> = {
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  webp: ['image/webp'],
  gif: ['image/gif'],
  mp4: ['video/mp4'],
  webm: ['video/webm'],
};

function tokenFrom(request: Request): string | null {
  const auth = request.headers.get('authorization') ?? '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

export async function POST(request: Request) {
  const token = tokenFrom(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClientWithToken(token);
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || userData?.user?.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload' }, { status: 400 });
  }
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Invalid upload' }, { status: 400 });
  }

  const originalExt = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mimeTypes = ALLOWED[originalExt];
  if (!mimeTypes || !mimeTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }
  if (file.size <= 0 || file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 });
  }

  const safeExt = originalExt === 'jpeg' ? 'jpg' : originalExt;
  const rawPlayerName = formData.get('playerName');
  const baseName = typeof rawPlayerName === 'string' && rawPlayerName.trim()
    ? rawPlayerName
    : file.name.replace(/\.[^.]+$/, '');
  const slug = baseName.normalize('NFKD').replace(/[^\w\s-]/g, '').trim().toLowerCase().replace(/[\s_-]+/g, '-').slice(0, 80) || 'player';
  const fileName = `players/${slug}-${crypto.randomUUID().slice(0, 8)}.${safeExt}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
      metadata: { original_name: file.name.slice(0, 255) },
    });

  if (error) {
    console.error('player image upload failed', error.message);
    return NextResponse.json({ error: 'Upload failed' }, { status: 400 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return NextResponse.json({ url: data.publicUrl });
}
