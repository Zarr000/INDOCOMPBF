export const VALID_TIERS = [
  'HT1', 'LT1', 'HT2', 'LT2', 'HT3', 'LT3', 'HT4', 'LT4', 'HT5', 'LT5',
] as const;

export const VALID_FRUITS = [
  'Kitsune', 'Portal', 'Dough', 'Control', 'Sound', 'Gas', 'Ghost', 'Diamond', 'Flame',
] as const;

const MAX_NAME = 80;
const MAX_COUNTRY = 80;
const MAX_URL = 500;
const MAX_IMAGE = 800;

export type SafeError = { error: string; status: number };

export function clientError(message: string, status = 400): SafeError {
  return { error: message, status };
}

function str(v: unknown, max: number): string | null {
  if (v === undefined || v === null) return '';
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (t.length > max) return null;
  return t;
}

export function isSafeHttpUrl(value: string): boolean {
  if (!value) return true;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function sanitizeHref(url: string | undefined): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const t = url.trim();
  if (!t) return undefined;
  if (!isSafeHttpUrl(t)) return undefined;
  return t;
}

export function normalizeDiscord(value: string): string | null | undefined {
  const input = value.trim();
  if (!input) return null;
  const urlMatch = input.match(/^https?:\/\/discord\.com\/users\/(\d+)\/?$/i);
  const id = urlMatch ? urlMatch[1] : input;
  if (!/^\d+$/.test(id)) return undefined;
  return `https://discord.com/users/${id}`;
}

export function discordDisplay(value: string | undefined): string {
  if (!value) return '';
  const match = value.match(/^https?:\/\/discord\.com\/users\/(\d+)\/?$/i);
  return match ? match[1] : value;
}

export function normalizeTikTok(value: string): string | null | undefined {
  let input = value.trim();
  if (!input) return null;
  const urlMatch = input.match(/^https?:\/\/(?:www\.)?tiktok\.com\/@([A-Za-z0-9._-]+)\/?$/i);
  if (urlMatch) input = urlMatch[1];
  input = input.replace(/^@+/, '');
  if (!/^[A-Za-z0-9._-]{1,50}$/.test(input)) return undefined;
  return `https://tiktok.com/@${input}`;
}

export function tikTokDisplay(value: string | undefined): string {
  if (!value) return '';
  const match = value.match(/^https?:\/\/(?:www\.)?tiktok\.com\/@([A-Za-z0-9._-]+)\/?$/i);
  return match ? match[1] : value.replace(/^@+/, '');
}

export type PlayerInput = {
  name: string;
  tier: string;
  country: string;
  image: string;
  fruit: string | null;
  discord: string | null;
  youtube: string | null;
  tiktok: string | null;
};

export function parsePlayerBody(raw: unknown): PlayerInput | SafeError {
  if (!raw || typeof raw !== 'object') {
    return clientError('Invalid request');
  }
  const src = raw as Record<string, unknown>;
  const player = (src.player && typeof src.player === 'object'
    ? src.player
    : src) as Record<string, unknown>;

  const name = str(player.name, MAX_NAME);
  if (!name) return clientError('Player name is required');

  const tier = str(player.tier, 8);
  if (!tier || !VALID_TIERS.includes(tier as (typeof VALID_TIERS)[number])) {
    return clientError('Invalid tier');
  }

  const country = str(player.country, MAX_COUNTRY);
  if (country === null) return clientError('Invalid country');

  const image = str(player.image, MAX_IMAGE);
  if (image === null) return clientError('Invalid image');

  const fruitRaw = str(player.fruit, 40);
  if (fruitRaw === null) return clientError('Invalid fruit');
  const fruit = fruitRaw === '' ? null : fruitRaw;
  if (fruit && !VALID_FRUITS.includes(fruit as (typeof VALID_FRUITS)[number])) {
    return clientError('Invalid fruit');
  }

  const discordRaw = str(player.discord, MAX_URL);
  const youtube = str(player.youtube, MAX_URL);
  const tiktokRaw = str(player.tiktok, MAX_URL);
  if (discordRaw === null || youtube === null || tiktokRaw === null || !isSafeHttpUrl(youtube)) {
    return clientError('Invalid URL');
  }
  const discord = normalizeDiscord(discordRaw);
  const tiktok = normalizeTikTok(tiktokRaw);
  if (discord === undefined || tiktok === undefined) return clientError('Invalid social profile');

  return {
    name,
    tier,
    country: country || 'Indonesia',
    image: image || '',
    fruit,
    discord,
    youtube: youtube || null,
    tiktok,
  };
}

export function isSafeError(v: unknown): v is SafeError {
  return Boolean(v && typeof v === 'object' && 'error' in v && 'status' in v);
}

export function parsePlayerId(id: string): number | null {
  if (!/^\d+$/.test(id)) return null;
  const n = Number(id);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
}
