import { useState } from 'react';
import { useCards } from '../../../hooks/useCards';
import { FilterOverLay } from './FilterOverLay';
import { CardDetailModal } from '../../CardDetail/CardDetailModal';
import type { Card, SortField, SortOrder } from '../../../types';

// アイコン
const FilterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
);

export const CardGrid = () => {
  const { cards, filters, setFilters, loading, error } = useCards();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 前後のカード移動用ロジック
  const currentIndex = selectedCard 
    ? cards.findIndex((c) => c.id === selectedCard.id) 
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < cards.length - 1;

  const handlePrev = () => {
    if (hasPrev) setSelectedCard(cards[currentIndex - 1]);
  };
  const handleNext = () => {
    if (hasNext) setSelectedCard(cards[currentIndex + 1]);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const [sort, order] = value.split('_') as [SortField, SortOrder];
    
    setFilters((prev) => ({
      ...prev,
      sort,
      order,
    }));
  };

  // 1. 画像のプリロード用関数を作る
  const preloadImage = (url: string) => {
    const img = new Image();
    img.src = url;
  };

  const isFilterActive = 
    Object.entries(filters).some(([key, value]) => 
      key !== 'text' && key !== 'sort' && key !== 'order' && Array.isArray(value) && value.length > 0
    );

  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* ヘッダーエリア: 検索 + ソート + フィルタ */}
      <div
        className="header-row"
        style={{ 
          display: 'flex', gap: '10px', marginBottom: '20px',
          
          // ▼▼▼ 修正箇所: stickyの設定を強化 ▼▼▼
          position: 'sticky',     // 標準
          top: '60px',            // ヘッダー(60px)
          zIndex: 10,
          flexWrap: 'wrap',
          
          // 背景色を指定しないと、スクロール時に後ろのカードが透けて見えてしまい
          // stickyが効いていないように見えます。背景色をページ色に合わせます。
          backgroundColor: '#F5F7FA', 
          
          // sticky時の上下の余白を少し調整（パディングをつけるときれいです）
          paddingTop: '10px',
          paddingBottom: '10px',
          // マイナスマージンで左右のパディングを相殺して画面端まで広げるテクニック（任意）
          margin: '-10px -20px 20px -20px',
          paddingLeft: '20px',
          paddingRight: '20px'
        }}
      >
        {/* フリーワード検索 */}
        <input 
          type="text" 
          placeholder="Search..." 
          value={filters.text}
          onChange={(e) => setFilters(prev => ({ ...prev, text: e.target.value }))}
          style={{ 
            flex: 1, minWidth: '150px', padding: '12px 16px', fontSize: '16px', borderRadius: '30px', 
            border: '1px solid #ddd', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        />

        {/* ソート選択プルダウン */}
        <div style={{ position: 'relative' }}>
          <select
            value={`${filters.sort}_${filters.order}`}
            onChange={handleSortChange}
            style={{
              appearance: 'none', padding: '0 30px 0 16px', height: '48px', borderRadius: '24px',
              border: '1px solid #ddd', background: 'white', fontSize: '14px', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)', minWidth: '140px'
            }}
          >
            <option value="id_asc">No.順 (昇順)</option>
            <option value="id_desc">No.順 (降順)</option>
            <option value="level_asc">レベル (昇順)</option>
            <option value="level_desc">レベル (降順)</option>
            <option value="cost_asc">コスト (昇順)</option>
            <option value="cost_desc">コスト (降順)</option>
            <option value="ap_desc">AP (降順)</option>
            <option value="hp_desc">HP (降順)</option>
            <option value="rarity_desc">レアリティ (降順)</option>
          </select>
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '10px' }}>▼</div>
        </div>

        {/* フィルタボタン */}
        <button 
          onClick={() => setIsFilterOpen(true)}
          style={{
            width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
            background: isFilterActive ? '#42A5F5' : 'white', // ここも色合わせ
            color: isFilterActive ? 'white' : '#666',
            border: '1px solid #ddd', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <FilterIcon />
        </button>
      </div>

      <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>Result: <strong>{cards.length}</strong> Cards</div>
        {loading && <div style={{ fontSize: '12px', color: '#42A5F5' }}>Updating...</div>}
      </div>
      
      {/* カード一覧グリッド */}
      <div 
        className="mobile-5-columns"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr)', gap: '10px', paddingBottom: '80px', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}
      >
        {cards.map((card) => (
          <div 
            key={card.id} 
            onClick={() => setSelectedCard(card)}
            // ▼ 追加: マウスが乗った瞬間に裏で画像を読み込み開始
            onMouseEnter={() => card.image_url && preloadImage(`/images/${card.image_url}`)}
            style={{ 
              aspectRatio: '2.5 / 3.5', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)', background: '#e0e0e0', position: 'relative'
            }}
          >
            {card.image_url ? (
              <img src={`/images/${card.image_url}`} alt={card.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ padding: '10px', fontSize: '12px', textAlign: 'center' }}>No Image<br/>{card.name}</div>
            )}
          </div>
        ))}
      </div>

      <CardDetailModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
        onPrev={handlePrev}
        onNext={handleNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />

      <FilterOverLay 
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
};