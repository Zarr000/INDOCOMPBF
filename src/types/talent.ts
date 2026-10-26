import { Player } from './player';
import type { Platform } from '@/lib/platform';

export interface Talent {
  id: string;
  name: string;
  category: 'fruit' | 'sword';
  holder_id: string | null;
  icon: string;
  platform: Platform;
  holder: string;
  holderPlayer?: Player | null;
  created_at?: string;
  updated_at?: string;
}

export type TalentPayload = Omit<Talent, 'id' | 'created_at' | 'updated_at' | 'holder'>;

export interface TalentCategory {
  label: string;
  key: 'fruit' | 'sword';
  talents: Talent[];
}
