import { useState, useEffect, useMemo } from 'react';
import type { Card, FilterState } from '../types';

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
};

export const useCards = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. データをAPIから取得（元のCardGridにあった処理を復活）
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const res = await fetch('/api/get_cards.php');
        if (!res.ok) throw new Error('Failed to fetch cards');
        const data = await res.json();
        setCards(data);
      } catch (err) {
        setError('カードデータの取得に失敗しました');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, []);

  // 2. フィルタリングロジック（複数選択対応）
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // テキスト検索
      const searchTarget = `${card.name} ${card.traits} ${card.id} ${card.text}`.toLowerCase();
      if (filters.text && !searchTarget.includes(filters.text.toLowerCase())) return false;

      // 各種フィルター（配列が空なら無視、入っていれば含まれるかチェック）
      if (filters.colors.length > 0 && !filters.colors.includes(card.color)) return false;
      if (filters.types.length > 0 && !filters.types.includes(card.type)) return false;
      if (filters.costs.length > 0 && !filters.costs.includes(String(card.cost))) return false;
      if (filters.levels.length > 0 && !filters.levels.includes(String(card.level))) return false;
      if (filters.rarities.length > 0 && !filters.rarities.includes(card.rarity)) return false;
      if (filters.expansion_sets.length > 0 && !filters.expansion_sets.includes(card.expansion_set)) return false;
      if (filters.zones.length > 0 && !filters.zones.includes(card.zone)) return false;
      
      // AP/HP (1-9の選択肢として扱う場合)
      // ※もしAPが4000とかなら、ここを「範囲」にするか、UI側を4000,5000にする必要があります。
      // いったん「1-9の数字で選ぶ」という要望に合わせて文字列比較します
      if (filters.aps.length > 0 && !filters.aps.includes(String(card.ap)[0])) return false; // 先頭の数字で判定など工夫が必要かも
      if (filters.hps.length > 0 && !filters.hps.includes(String(card.hp)[0])) return false;

      return true;
    });
  }, [cards, filters]);

  return { cards: filteredCards, filters, setFilters, loading, error };
};