import { useState } from 'react';
import { useCards } from '../../../hooks/useCards';
import { FilterOverLay } from './FilterOverLay';
import { CardDetailModal } from '../../CardDetail/CardDetailModal';
import type { Card } from '../../../types';

// アイコン
const FilterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
);

export const CardGrid = () => {
  const { cards, filters, setFilters, loading, error } = useCards();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 現在開いているカードがリストの何番目かを取得
  const currentIndex = selectedCard 
    ? cards.findIndex((c) => c.id === selectedCard.id) 
    : -1;

  // 前後があるか判定
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < cards.length - 1;

  // 移動関数
  const handlePrev = () => {
    if (hasPrev) setSelectedCard(cards[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) setSelectedCard(cards[currentIndex + 1]);
  };

  // フィルターが何か1つでも設定されているか
  const isFilterActive = 
    Object.entries(filters).some(([key, value]) => key !== 'text' && Array.isArray(value) && value.length > 0);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>;
  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 検索バーエリア */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', position: 'sticky', top: '10px', zIndex: 10 }}>
        <input 
          type="text" 
          placeholder="Search keywords..." 
          value={filters.text}
          onChange={(e) => setFilters({ ...filters, text: e.target.value })}
          style={{ 
            flex: 1, padding: '12px 16px', fontSize: '16px', borderRadius: '30px', 
            border: '1px solid #ddd', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        />
        <button 
          onClick={() => setIsFilterOpen(true)} aria-label="詳細を見る"
          style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: isFilterActive ? '#0056D2' : 'white',
            color: isFilterActive ? 'white' : '#666',
            border: '1px solid #ddd', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <FilterIcon />
        </button>
      </div>

      <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
        Result: <strong>{cards.length}</strong> Cards
      </div>
      
      {/* カード一覧 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px', paddingBottom: '80px' }}>
        {cards.map((card) => (
          <div 
            key={card.id} 
            onClick={() => setSelectedCard(card)}
            style={{ 
              aspectRatio: '2.5 / 3.5', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)', background: '#e0e0e0'
            }}
          >
            {/* img ではなく image_url を使う */}
            {card.image_url ? (
              <img src={`/images/${card.image_url}`} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

      {/* 新しいフィルター画面 */}
      <FilterOverLay 
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
};