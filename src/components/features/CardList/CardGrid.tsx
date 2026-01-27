import { useState, useMemo, useEffect } from 'react';
import { useCards } from '../../../hooks/useCards';
import { FilterOverLay } from './FilterOverLay';
import { CardDetailModal } from '../../CardDetail/CardDetailModal';
import type { Card, SortField } from '../../../types';

/* --- Icons --- */
const FilterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const SortAscIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5h10M11 9h7M11 13h4" />
    <path d="M3 17l3 3 3-3" />
    <path d="M6 18V4" />
  </svg>
);

const SortDescIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5h4M11 9h7M11 13h10" />
    <path d="M3 7l3-3 3 3" />
    <path d="M6 6v14" />
  </svg>
);

/* --- Component --- */
export const CardGrid = () => {
  const { cards, filters, setFilters, loading, error } = useCards();
  const { cards: allCards } = useCards();

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (isFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isFilterOpen]);

  const preloadImage = (url: string) => {
    const img = new Image();
    img.src = url;
  };

  const filteredCards = useMemo(() => {
    if (!searchText) return cards;

    const normalizedSearch = searchText.toLowerCase().replace(/　/g, ' ').trim();
    if (!normalizedSearch) return cards;

    const terms = normalizedSearch.split(/\s+/);

    return cards.filter((card) => {
      const targetText = [
        card.name,
        card.id,
        card.text,
        card.traits,
        card.type,
        card.color,
        String(card.level ?? ''),
        String(card.cost ?? ''),
        String(card.ap ?? ''),
        String(card.hp ?? ''),
        String(card.rarity ?? '')
      ].join(' ').toLowerCase();

      return terms.every(term => {
        if (term.startsWith('-') && term.length > 1) {
          const excludeTerm = term.slice(1);
          return !targetText.includes(excludeTerm);
        }
        return targetText.includes(term);
      });
    });
  }, [cards, searchText]);

  const currentIndex = selectedCard 
    ? filteredCards.findIndex((c) => c.id === selectedCard.id) 
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < filteredCards.length - 1;

  const handlePrev = () => { if (hasPrev) setSelectedCard(filteredCards[currentIndex - 1]); };
  const handleNext = () => { if (hasNext) setSelectedCard(filteredCards[currentIndex + 1]); };

  const isFilterActive = Object.entries(filters).some(([key, value]) => 
    key !== 'text' && key !== 'sort' && key !== 'order' && Array.isArray(value) && value.length > 0
  );

  const toggleOrder = () => {
    setFilters(prev => ({ ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' }));
  };

  if (error) {
    return <div className="cg-error-message">{error}</div>;
  }

  return (
    <div className="cg-container">
      
      {/* Header Area */}
      <div className="cg-header">
        {/* Search Input */}
        <input 
          type="text" 
          placeholder="Search..." 
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="cg-search-input"
          aria-label="Search cards"
        />

        {/* Sort Select */}
        <div className="cg-select-wrapper">
          <select
            value={filters.sort}
            onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value as SortField }))}
            className="cg-sort-select"
            aria-label="Sort cards by" 
          >
            <option value="id">No.</option>
            <option value="level">Level</option>
            <option value="cost">Cost</option>
            <option value="ap">AP</option>
            <option value="hp">HP</option>
            <option value="rarity">Rarity</option>
          </select>
          <div className="cg-select-arrow">▼</div>
        </div>

        {/* Sort Order Button */}
        <button
          type="button" 
          onClick={toggleOrder}
          title={filters.order === 'asc' ? "Sort Ascending" : "Sort Descending"}
          aria-label={filters.order === 'asc' ? "Sort Ascending" : "Sort Descending"} 
          className="cg-icon-btn"
        >
          {filters.order === 'asc' ? <SortAscIcon /> : <SortDescIcon />}
        </button>

        {/* Filter Toggle Button */}
        <button 
          type="button" 
          onClick={() => setIsFilterOpen(true)}
          className={`cg-icon-btn ${isFilterActive ? 'active' : ''}`}
          aria-label="Open Filters" 
        >
          <FilterIcon />
        </button>
      </div>

      {/* Results Count */}
      <div className="cg-results-row">
        <div>Result: <strong>{filteredCards.length}</strong> Cards</div>
        {loading && <div className="cg-loading-text">Updating...</div>}
      </div>
      
      {/* Card Grid */}
      <div className={`cg-grid mobile-5-columns ${loading ? 'loading' : ''}`}>
        {filteredCards.map((card) => (
          <div 
            key={card.id} 
            onClick={() => setSelectedCard(card)}
            onMouseEnter={() => card.image_url && preloadImage(`/images/${card.image_url}`)}
            className="cg-card"
            role="button" 
            tabIndex={0}
            aria-label={`View details for ${card.name}`}
          >
            {card.image_url ? (
              <img 
                src={`/images/${card.image_url}`} 
                alt={card.name} 
                loading="lazy" 
                className="cg-card-img"
              />
            ) : (
              <div className="cg-card-no-img">No Image<br/>{card.name}</div>
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
        allCards={allCards}
        onSelectCard={setSelectedCard}
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