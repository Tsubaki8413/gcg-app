import { useEffect, useState, useMemo } from 'react';
// 型定義のインポート（エラーが出る場合は直書きをご利用ください）
// import { Card } from '../../../types'; 
import { CardDetailModal } from '../../CardDetail/CardDetailModal';

// ▼▼▼ 型定義 (環境差異防止のためここに記述) ▼▼▼
interface Card {
  id: string;
  name: string;
  rarity: string;
  expansion_set: string;
  level: number;
  cost: number;
  color: string;
  type: string;
  text: string;
  zone: string;
  traits: string;
  link: string;
  ap: number;
  hp: number;
  image_url: string;
  updated_at?: string;
}

// ▼▼▼ アイコン類 ▼▼▼
const FilterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
);

export const CardList = () => {
  // --- データ管理 ---
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // --- フィルターUI開閉 ---
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // --- 検索条件State ---
  const [searchText, setSearchText] = useState('');
  
  // 基本属性
  const [filterColor, setFilterColor] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterCost, setFilterCost] = useState('All');
  
  // 詳細属性 (Deep Search)
  const [filterRarity, setFilterRarity] = useState('All');
  const [filterSet, setFilterSet] = useState('All');
  const [filterLevel, setFilterLevel] = useState('All');
  const [filterZone, setFilterZone] = useState('All');
  const [filterApMin, setFilterApMin] = useState(''); // 下限値入力
  const [filterHpMin, setFilterHpMin] = useState(''); // 下限値入力

  // --- データ取得 ---
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

  // --- 動的な選択肢の生成 ---
  // 読み込んだカードデータから、存在する「収録弾(Set)」と「レアリティ」のリストを自動生成
  const availableSets = useMemo(() => {
    const sets = new Set(cards.map(c => c.expansion_set).filter(Boolean));
    return Array.from(sets).sort();
  }, [cards]);

  const availableRarities = useMemo(() => {
    const r = new Set(cards.map(c => c.rarity).filter(Boolean));
    return Array.from(r).sort(); // 必要であればカスタムソートに変更
  }, [cards]);

  // --- フィルタリングロジック ---
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      // 1. テキスト検索
      const searchTarget = `${card.name} ${card.traits} ${card.id} ${card.text}`.toLowerCase();
      if (searchText && !searchTarget.includes(searchText.toLowerCase())) return false;

      // 2. 基本フィルター
      if (filterColor !== 'All' && card.color !== filterColor) return false;
      if (filterType !== 'All' && card.type !== filterType) return false;
      if (filterCost !== 'All' && card.cost !== parseInt(filterCost)) return false;

      // 3. 詳細フィルター (Deep Search)
      if (filterRarity !== 'All' && card.rarity !== filterRarity) return false;
      if (filterSet !== 'All' && card.expansion_set !== filterSet) return false;
      if (filterLevel !== 'All' && card.level !== parseInt(filterLevel)) return false;
      if (filterZone !== 'All' && (!card.zone || !card.zone.includes(filterZone))) return false;

      // 4. 数値範囲 (AP/HP)
      if (filterApMin !== '' && card.ap < parseInt(filterApMin)) return false;
      if (filterHpMin !== '' && card.hp < parseInt(filterHpMin)) return false;

      return true;
    });
  }, [
    cards, searchText, 
    filterColor, filterType, filterCost, 
    filterRarity, filterSet, filterLevel, filterZone, 
    filterApMin, filterHpMin
  ]);

  // --- フィルターがアクティブか判定 (アイコンの色用) ---
  const isFilterActive = 
    filterColor !== 'All' || filterType !== 'All' || filterCost !== 'All' ||
    filterRarity !== 'All' || filterSet !== 'All' || filterLevel !== 'All' ||
    filterZone !== 'All' || filterApMin !== '' || filterHpMin !== '';

  if (loading) return <div className="p-4 text-center">読み込み中...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* ヘッダーエリア */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', position: 'sticky', top: '10px', zIndex: 10 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input 
            type="text" 
            placeholder="フリーワード検索" 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ 
              width: '100%', padding: '12px 16px', fontSize: '16px', borderRadius: '30px', 
              border: '1px solid #ddd', boxSizing: 'border-box', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', outline: 'none'
            }}
          />
        </div>
        
        <button 
          onClick={() => setIsFilterOpen(true)}
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

      <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666', paddingLeft: '8px' }}>
        Result: <strong>{filteredCards.length}</strong> Cards
      </div>
      
      {/* カードリスト */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px', paddingBottom: '80px' }}>
        {filteredCards.map((card) => (
          <div 
            key={card.id} 
            onClick={() => setSelectedCard(card)}
            style={{ 
              aspectRatio: '2.5 / 3.5', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'transform 0.15s',
              background: '#e0e0e0', position: 'relative'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.zIndex = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.zIndex = 'auto'; }}
          >
            {card.image_url ? (
              <img src={`/images/${card.image_url}`} alt={card.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '10px' }}>
                <span>No Image</span><span>{card.id}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />

      {/* ★詳細フィルターオーバーレイ */}
      {isFilterOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#F5F7FA', zIndex: 2000,
          display: 'flex', flexDirection: 'column'
        }}>
          {/* ヘッダー */}
          <div style={{ padding: '20px', background: 'white', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>詳細検索</h2>
            <button onClick={() => setIsFilterOpen(false)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
          </div>

          {/* コンテンツ (スクロール) */}
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
            
            {/* Color */}
            <SectionTitle title="COLOR" />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {['All', 'Red', 'Blue', 'White', 'Green', 'Purple'].map(c => (
                <FilterButton key={c} label={c} active={filterColor === c} onClick={() => setFilterColor(c)} />
              ))}
            </div>

            {/* Type */}
            <SectionTitle title="TYPE" />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {['All', 'UNIT', 'PILOT', 'BASE', 'COMMAND'].map(t => (
                <FilterButton key={t} label={t} active={filterType === t} onClick={() => setFilterType(t)} />
              ))}
            </div>

            {/* Cost & Level (並列配置) */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{ flex: 1 }}>
                <SectionTitle title="LEVEL" />
                <SelectBox value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} options={['All', ...[...Array(10)].map((_, i) => i.toString())]} />
              </div>
              <div style={{ flex: 1 }}>
                <SectionTitle title="COST" />
                <SelectBox value={filterCost} onChange={(e) => setFilterCost(e.target.value)} options={['All', ...[...Array(10)].map((_, i) => i.toString())]} />
              </div>
            </div>

            {/* AP / HP (Min値入力) */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{ flex: 1 }}>
                <SectionTitle title="MIN AP" />
                <input type="number" value={filterApMin} onChange={(e) => setFilterApMin(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <SectionTitle title="MIN HP" />
                <input type="number" value={filterHpMin} onChange={(e) => setFilterHpMin(e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* Set & Rarity */}
            <div style={{ marginBottom: '24px' }}>
              <SectionTitle title="EXPANSION SET" />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <FilterButton label="All" active={filterSet === 'All'} onClick={() => setFilterSet('All')} />
                {availableSets.map(s => (
                  <FilterButton key={s} label={s} active={filterSet === s} onClick={() => setFilterSet(s)} />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <SectionTitle title="RARITY" />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <FilterButton label="All" active={filterRarity === 'All'} onClick={() => setFilterRarity('All')} />
                {availableRarities.map(r => (
                  <FilterButton key={r} label={r} active={filterRarity === r} onClick={() => setFilterRarity(r)} />
                ))}
              </div>
            </div>

            {/* Zone */}
            <div style={{ marginBottom: '24px' }}>
              <SectionTitle title="ZONE" />
              <SelectBox value={filterZone} onChange={(e) => setFilterZone(e.target.value)} options={['All', 'Space', 'Earth']} />
            </div>

            {/* Reset */}
            <button 
              onClick={() => {
                setFilterColor('All'); setFilterType('All'); setFilterCost('All');
                setFilterRarity('All'); setFilterSet('All'); setFilterLevel('All');
                setFilterZone('All'); setFilterApMin(''); setFilterHpMin('');
                setSearchText('');
              }}
              style={{ width: '100%', padding: '12px', border: '1px solid #d32f2f', color: '#d32f2f', background: 'white', borderRadius: '8px', cursor: 'pointer', marginTop: '20px' }}
            >
              リセット
            </button>
          </div>

          {/* フッター */}
          <div style={{ padding: '20px', background: 'white', borderTop: '1px solid #eee' }}>
            <button onClick={() => setIsFilterOpen(false)} style={{ width: '100%', padding: '14px', background: '#0056D2', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              Show {filteredCards.length} Cards
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- スタイル用サブコンポーネント ---
const SectionTitle = ({ title }: { title: string }) => (
  <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '8px', letterSpacing: '0.5px' }}>{title}</h3>
);

const FilterButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} style={{
    padding: '6px 12px', borderRadius: '16px', border: '1px solid', fontSize: '14px',
    borderColor: active ? '#0056D2' : '#ddd',
    backgroundColor: active ? '#e3f2fd' : 'white',
    color: active ? '#0056D2' : '#333',
    cursor: 'pointer', fontWeight: active ? 'bold' : 'normal',
    marginBottom: '4px'
  }}>
    {label}
  </button>
);

const SelectBox = ({ value, onChange, options }: { value: string, onChange: (e: any) => void, options: string[] }) => (
  <select value={value} onChange={onChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: 'white' }}>
    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
  </select>
);

const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' as const };