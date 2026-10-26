'use client';

import { createBrowserSupabase } from '@/lib/supabase/browser';
import type { Player, PlayerPayload, Tier } from '@/types/player';
import type { Talent, TalentPayload } from '@/types/talent';
import type { Platform } from '@/lib/platform';

const API_BASE = '/api';

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.error && typeof body.error === 'string' && body.error.length < 120) message = body.error;
    } catch {

    }
    throw new Error(message || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

async function authHeaders(): Promise<Record<string, string>> {
  const supabase = createBrowserSupabase();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}


export async function getPlayers(platform?: Platform): Promise<Player[]> {
  const query = platform ? `?platform=${platform}` : '';
  const res = await fetch(`${API_BASE}/players${query}`, { cache: 'no-store' });
  const data = await handle<{ players: Player[] }>(res);
  return data.players;
}

export async function getTalents(platform?: Platform): Promise<Talent[]> {
  const query = platform ? `?platform=${platform}` : '';
  const res = await fetch(`${API_BASE}/talents${query}`, { cache: 'no-store' });
  const data = await handle<{ talents: Talent[] }>(res);
  return data.talents;
}

const supabase = createBrowserSupabase();

export async function adminLogin(email: string, password: string): Promise<void> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || data.user?.app_metadata?.role !== 'admin') {
    if (!error) await supabase.auth.signOut();
    throw new Error('Invalid credentials or insufficient permissions.');
  }
}

export async function adminLogout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message || 'Logout failed');
}

export async function adminMe(): Promise<{ user: { email?: string } | null }> {
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user || user.app_metadata?.role !== 'admin') return { user: null };
  return { user: { email: user.email ?? undefined } };
}

export async function createPlayer(payload: PlayerPayload): Promise<Player> {
  const res = await fetch(`${API_BASE}/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ player: payload }),
  });
  return handle<{ player: Player }>(res).then((d) => d.player);
}

export async function updatePlayer(id: string, payload: Partial<PlayerPayload>): Promise<Player> {
  const res = await fetch(`${API_BASE}/players/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ player: payload }),
  });
  return handle<{ player: Player }>(res).then((d) => d.player);
}

export async function deletePlayer(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/players/${id}`, {
    method: 'DELETE',
    headers: { ...(await authHeaders()) },
  });
  await handle<{ ok: boolean }>(res);
}


// holderValue: a player name to assign, or null/'Example' to release.
export async function updateTalentHolder(talentId: string | number, holderValue: string | null): Promise<void> {
  const release = !holderValue || holderValue.toLowerCase() === 'example';
  const body: { holder: string | null } = release ? { holder: null } : { holder: holderValue };
  const res = await fetch(`${API_BASE}/talents/${talentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(body),
  });
  await handle<{ ok: boolean }>(res);
}


export interface PlayerMedia {
  name: string;
  displayName?: string;
  storagePath?: string;
  url: string;
  created_at?: string;
  content_type?: string;
}

export async function getPlayerImages(): Promise<PlayerMedia[]> {
  const res = await fetch(`${API_BASE}/images`, {
    cache: 'no-store',
    headers: { ...(await authHeaders()) },
  });
  const data = await handle<{ images: PlayerMedia[] }>(res);
  return data.images;
}

export async function uploadPlayerImage(file: File, playerName?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  if (playerName) formData.append('playerName', playerName);
  const res = await fetch(`${API_BASE}/images/upload`, {
    method: 'POST',
    headers: { ...(await authHeaders()) },
    body: formData,
  });
  const data = await handle<{ url: string }>(res);
  return data.url;
}

export function playerImageSrc(image: string): string {
  return image || '';
}

export type { Player, PlayerPayload, Talent, TalentPayload, Tier };
