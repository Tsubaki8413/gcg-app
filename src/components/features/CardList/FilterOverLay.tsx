import type { FilterState } from '../../../types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
};

// 選択肢定義
const COLORS = ['Red', 'Blue', 'White', 'Green', 'Purple'];
const TYPES = ['UNIT', 'PILOT', 'BASE', 'COMMAND', 'UNIT TOKEN'];
const ZONES = ['宇宙', '地球'];
const NUMBERS = ['0','1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const FilterOverLay = ({ isOpen, onClose, filters, setFilters }: Props) => {
  if (!isOpen) return null;

  // 選択状態を切り替える関数
  const toggleFilter = (key: keyof FilterState, value: string) => {
    const currentList = filters[key] as string[];
    const newList = currentList.includes(value)
      ? currentList.filter((v) => v !== value) // 削除
      : [...currentList, value]; // 追加
    setFilters({ ...filters, [key]: newList });
  };

  // ボタン群を描画する関数
  const renderSection = (title: string, key: keyof FilterState, options: string[]) => {
    const currentList = filters[key] as string[];
    return (
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>{title}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {options.map((option) => {
            const isActive = currentList.includes(option);
            return (
              <button
                key={option}
                onClick={() => toggleFilter(key, option)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: '1px solid',
                  fontSize: '14px',
                  cursor: 'pointer',
                  borderColor: isActive ? '#0056D2' : '#ddd',
                  backgroundColor: isActive ? '#e3f2fd' : 'white',
                  color: isActive ? '#0056D2' : '#333',
                  fontWeight: isActive ? 'bold' : 'normal',
                }}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    /* ▼ 1. 画面全体を覆う背景 (Backdrop) を追加 */
    <div
      onClick={onClose} // ここをクリックしたら閉じる
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // 暗い背景
        zIndex: 200,
        display: 'flex',
        justifyContent: 'flex-end', // 右寄せにする
      }}
    >
      {/* ▼ 2. フィルターメニュー本体 (既存のdiv) */}
      <div
        onClick={(e) => e.stopPropagation()} // 中身のクリックで閉じないようにイベント伝播を止める
        style={{
          width: '85%',
          maxWidth: '320px',
          height: '100%',
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
          // position: 'fixed' 等は親の Flexbox で制御するため削除
        }}
      >
        {/* ヘッダー */}
        <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Filters</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        {/* スクロールエリア */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {renderSection('COLOR', 'colors', COLORS)}
          {renderSection('TYPE', 'types', TYPES)}
          {renderSection('LEVEL', 'levels', NUMBERS)}
          {renderSection('COST', 'costs', NUMBERS)}
          {renderSection('ZONE', 'zones', ZONES)}
          {renderSection('AP', 'aps', NUMBERS)}
          {renderSection('HP', 'hps', NUMBERS)}

          {/* リセットボタン */}
          <button
            onClick={() => setFilters({
              colors: [], types: [], costs: [], levels: [], rarities: [],
              expansion_sets: [], zones: [], aps: [], hps: [], text: filters.text
            })}
            style={{ width: '100%', padding: '10px', marginTop: '20px', border: '1px solid #d32f2f', color: '#d32f2f', background: 'white', borderRadius: '6px', cursor: 'pointer' }}
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};