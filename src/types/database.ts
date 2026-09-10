export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: number;
          legacy_id: string;
          name: string;
          tier: string;
          country: string;
          image: string;
          fruit: string | null;
          discord: string | null;
          youtube: string | null;
          tiktok: string | null;
          created_at: string;
          updated_at: string;
          sort_order: number;
        };
        Insert: {
          id?: number;
          legacy_id: string;
          name: string;
          tier: string;
          country?: string;
          image?: string;
          fruit?: string | null;
          discord?: string | null;
          youtube?: string | null;
          tiktok?: string | null;
          sort_order?: number;
        };
        Update: {
          legacy_id?: string;
          name?: string;
          tier?: string;
          country?: string;
          image?: string;
          fruit?: string | null;
          discord?: string | null;
          youtube?: string | null;
          tiktok?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      talents: {
        Row: {
          id: number;
          name: string;
          category: string;
          holder_id: number | null;
          icon: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          category: string;
          holder_id?: number | null;
          icon: string;
        };
        Update: {
          name?: string;
          category?: string;
          holder_id?: number | null;
          icon?: string;
        };
        Relationships: [];
      };
    };
  };
}
