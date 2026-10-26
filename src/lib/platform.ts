export type Platform = 'pc' | 'mobile';

export const PLATFORMS: Platform[] = ['pc', 'mobile'];

export const PLATFORM_LABEL: Record<Platform, string> = {
  pc: 'PC',
  mobile: 'Mobile',
};

export const DEFAULT_PLATFORM: Platform = 'pc';

// Accepts anything (query string, JSON field) and falls back to PC.
export function parsePlatform(value: unknown): Platform {
  const v = Array.isArray(value) ? value[0] : value;
  return v === 'mobile' ? 'mobile' : 'pc';
}

export function isPlatform(value: unknown): value is Platform {
  return value === 'pc' || value === 'mobile';
}

// Keeps ?platform= in the address bar in sync without reloading the page.
// PC is the default, so it is omitted from the URL.
export function syncPlatformToUrl(platform: Platform): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (platform === DEFAULT_PLATFORM) url.searchParams.delete('platform');
  else url.searchParams.set('platform', platform);
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}
