import { useState } from 'react';
import { useCards } from '../../../hooks/useCards';
import { FilterOverLay } from './FilterOverLay';
import { CardDetailModal } from '../../CardDetail/CardDetailModal';
import type { Card, SortField } from '../../../types'; // SortFieldの型定義を利用

// アイコン: フィルタ
const FilterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
);

// アイコン: 昇順 (Asc) - 低い方から高い方へ (A->Z, 0->9)
const SortAscIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5h10M11 9h7M11 13h4" />
    <path d="M3 17l3 3 3-3" />
    <path d="M6 18V4" />
  </svg>
);

// アイコン: 降順 (Desc) - 高い方から低い方へ (Z->A, 9->0)
const SortDescIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5h4M11 9h7M11 13h10" />
    <path d="M3 7l3-3 3 3" />
    <path d="M6 6v14" />
  </svg>
);

export const CardGrid = () => {
  const { cards, filters, setFilters, loading, error } = useCards();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 1. 画像のプリロード用関数
  const preloadImage = (url: string) => {
    const img = new Image();
    img.src = url;
  };

  // 2. 前後のカード移動用ロジック
  const currentIndex = selectedCard 
    ? cards.findIndex((c) => c.id === selectedCard.id) 
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < cards.length - 1;

  const handlePrev = () => { if (hasPrev) setSelectedCard(cards[currentIndex - 1]); };
  const handleNext = () => { if (hasNext) setSelectedCard(cards[currentIndex + 1]); };

  // 3. フィルタがアクティブかどうかの判定
  const isFilterActive = Object.entries(filters).some(([key, value]) => 
    key !== 'text' && key !== 'sort' && key !== 'order' && Array.isArray(value) && value.length > 0
  );

  // 4. ソート順序の切り替えハンドラ
  const toggleOrder = () => {
    setFilters(prev => ({ ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' }));
  };

  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* ヘッダーエリア: 検索 + ソート(項目) + ソート(順序) + フィルタ */}
      <div
        className="header-row"
        style={{ 
          display: 'flex', gap: '10px', marginBottom: '20px',
          
          // Stickyの設定
          position: 'sticky',
          top: '60px',
          zIndex: 10,
          flexWrap: 'wrap',
          
          backgroundColor: '#F5F7FA', 
          
          paddingTop: '10px',
          paddingBottom: '10px',
          margin: '-10px -20px 20px -20px', // 左右の余白を相殺
          paddingLeft: '20px',
          paddingRight: '20px'
        }}
      >
        {/* 1. フリーワード検索 */}
        <input 
          type="text" 
          placeholder="Search..." 
          value={filters.text}
          onChange={(e) => setFilters(prev => ({ ...prev, text: e.target.value }))}
          style={{ 
            flex: 1, minWidth: '120px', padding: '12px 16px', fontSize: '16px', borderRadius: '30px', 
            border: '1px solid #ddd', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        />

        {/* 2. ソート項目選択 (Separated) */}
        <div style={{ position: 'relative' }}>
          <select
            value={filters.sort}
            onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value as SortField }))}
            style={{
              appearance: 'none', padding: '0 30px 0 16px', height: '48px', borderRadius: '24px',
              border: '1px solid #ddd', background: 'white', fontSize: '14px', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)', minWidth: '100px'
            }}
          >
            <option value="id">No.</option>
            <option value="level">Level</option>
            <option value="cost">Cost</option>
            <option value="ap">AP</option>
            <option value="hp">HP</option>
            <option value="rarity">Rarity</option>
          </select>
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '10px' }}>▼</div>
        </div>

        {/* 3. 昇順/降順 切り替えボタン (New) */}
        <button
          onClick={toggleOrder}
          title={filters.order === 'asc' ? "昇順 (クリックで降順へ)" : "降順 (クリックで昇順へ)"}
          style={{
            width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
            background: 'white', color: '#666',
            border: '1px solid #ddd', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          {filters.order === 'asc' ? <SortAscIcon /> : <SortDescIcon />}
        </button>

        {/* 4. フィルタボタン */}
        <button 
          onClick={() => setIsFilterOpen(true)}
          style={{
            width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
            background: isFilterActive ? '#42A5F5' : 'white', 
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
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr)', 
          gap: '10px', 
          paddingBottom: '80px', 
          opacity: loading ? 0.6 : 1, 
          transition: 'opacity 0.2s' 
        }}
      >
        {cards.map((card) => (
          <div 
            key={card.id} 
            onClick={() => setSelectedCard(card)}
            // 画像先読み
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