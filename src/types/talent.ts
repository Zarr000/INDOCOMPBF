import { Player } from './player';

export interface Talent {
  id: string;
  name: string;
  category: 'fruit' | 'sword';
  holder_id: string | null;
  icon: string;
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
