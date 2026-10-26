import type { Platform } from '@/lib/platform';

export type Tier = 'HT1' | 'LT1' | 'HT2' | 'LT2' | 'HT3' | 'LT3' | 'HT4' | 'LT4' | 'HT5' | 'LT5';

export type PlayerFruit = string;

export interface Player {
  id: string;
  legacy_id: string;
  name: string;
  tier: Tier;
  country: string;
  image: string;
  fruit?: PlayerFruit;
  discord?: string;
  youtube?: string;
  tiktok?: string;
  platform: Platform;
  created_at?: string;
  updated_at?: string;
}

export type PlayerPayload = {
  legacy_id?: string;
  name: string;
  tier: Tier;
  country: string;
  image: string;
  fruit?: PlayerFruit;
  discord?: string;
  youtube?: string;
  tiktok?: string;
  platform?: Platform;
};

