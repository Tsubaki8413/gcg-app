export interface Card {
  id: string;
  name: string;
  type: string;        // UNIT, PILOT, etc.
  color: string;       // Red, Blue, etc.
  cost: number;
  source: number;      // 軽減コスト(もしあれば)
  ap: number;
  hp: number;
  rarity: string;
  expansion_set: string; // set ではなく expansion_set
  level: number;
  zone: string;        // Earth, Space
  image_url: string;   // img ではなく image_url
  text: string;
  traits: string;      // 特徴
  link: string;
}

export interface FilterState {
  colors: string[];      // 複数選択
  types: string[];       // 複数選択
  costs: string[];       // 複数選択 (1-9)
  levels: string[];      // 複数選択 (1-9)
  rarities: string[];    // 複数選択
  expansion_sets: string[]; // 複数選択
  zones: string[];       // 複数選択
  aps: string[];         // 複数選択 (1-9)
  hps: string[];         // 複数選択 (1-9)
  text: string;
}