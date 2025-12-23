export interface Card {
  id: string;          // ST01-001 (PK)
  name: string;
  rarity: string;
  expansion_set: string;
  level: number;
  cost: number;
  color: string;
  type: string;        // UNIT, PILOT, etc.
  text: string;
  zone: string;
  traits: string;
  link: string;        // リンク条件
  ap: number;
  hp: number;
  image_url: string;   // .webp
  updated_at?: string;
}

export interface Deck {
  id: string;
  user_id: string;
  title: string;
  cards: Record<string, number>; // {"ST01-001": 4, ...}
  thumbnail_id: string | null;
  created_at: string;
  updated_at: string;
}

// 検索フィルタ用
export interface CardFilters {
  q?: string;
  color?: string;
  type?: string;
  cost?: number;
  level?: number;
  rarity?: string;
  expansion_set?: string;
}