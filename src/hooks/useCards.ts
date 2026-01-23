import { useState, useEffect, useCallback } from 'react';
import type { Card, FilterState } from '../types';

// 初期状態: デフォルトはID順の昇順
const initialFilterState: FilterState = {
  colors: [],
  types: [],
  costs: [],
  levels: [],
  rarities: [],
  expansion_sets: [],
  zones: [],
  aps: [],
  hps: [],
  text: '',
  sort: 'id',
  order: 'asc',
};

export const useCards = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // APIからデータを取得する関数
  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();

      // 1. 単一値のパラメータ
      if (filters.text) params.append('search', filters.text);
      params.append('sort', filters.sort);
      params.append('order', filters.order);

      // 2. 配列パラメータ (PHP側で colors[], types[] 等として受け取る形式)
      // get_cards.php の仕様に合わせてキー名をマッピング
      const arrayMap: { key: keyof FilterState; paramName: string }[] = [
        { key: 'colors', paramName: 'colors[]' },
        { key: 'types', paramName: 'types[]' },
        { key: 'costs', paramName: 'costs[]' }, // PHP側はOR一致
        { key: 'levels', paramName: 'levels[]' },
        { key: 'aps', paramName: 'aps[]' },
        { key: 'hps', paramName: 'hps[]' },
        // levelsはPHP側に実装がないようですが、ある場合はここで追加
        { key: 'rarities', paramName: 'rarities[]' },
        { key: 'expansion_sets', paramName: 'sets[]' }, // PHP側は sets
        { key: 'zones', paramName: 'zones[]' },
      ];

      arrayMap.forEach(({ key, paramName }) => {
        const values = filters[key];
        if (Array.isArray(values) && values.length > 0) {
          values.forEach((val) => params.append(paramName, String(val)));
        }
      });

      // ※注意: aps, hps (1-9選択) について
      // get_cards.php は ap_min/ap_max (範囲) しか受け付けないため、
      // 複数の数字選択（例: 4と6）を正確にAPIに渡すのは困難です。
      // 必要であればここで "4" -> min:4000, max:4999 のように変換ロジックを入れますが、
      // 複数選択時はAPI側の改修が必要になるため、一旦ここでは除外するか、
      // もしPHP側が traits 等で対応していればそちらを使います。
      
      const res = await fetch(`/api/get_cards.php?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch cards: ${res.statusText}`);
      
      const data = await res.json();
      setCards(data);

    } catch (err) {
      setError('カードデータの取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // フィルタ状態が変わるたびに再取得 (Debounceが必要なら別途実装)
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  return { cards, filters, setFilters, loading, error, fetchCards };
};