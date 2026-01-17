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
    // 1. 数字項目かどうか判定
    const isNumeric = ['levels', 'costs', 'aps', 'hps'].includes(key);

    // 2. データの型に合わせて変換（数値ならNumber型にする）
    // カードデータが数値で管理されているため、ここで変換しないと一致しません
    const convertedValue = isNumeric ? Number(value) : value;

    const currentList = (filters[key] || []) as any[];
    
    // 3. 追加・削除ロジック
    const newList = currentList.includes(convertedValue)
      ? currentList.filter((v: any) => v !== convertedValue)
      : [...currentList, convertedValue];
    
    setFilters({ ...filters, [key]: newList });
  };

  // ボタン群を描画する関数
  const renderSection = (title: string, key: keyof FilterState, options: string[]) => {
    const currentList = (filters[key] || []) as any[];
    const isNumericSection = ['levels', 'costs', 'aps', 'hps'].includes(key);

    return (
      <div className="filter-section">
        <h3>{title}</h3>
        <div className="filter-options">
          {options.map((option) => {
            // 判定時も型を合わせる（データ内の数値と比較するため、optionを数値化してチェック）
            const checkValue = isNumericSection ? Number(option) : option;
            const isSelected = currentList.includes(checkValue);

            return (
              <button
                key={option}
                className={`filter-btn ${isSelected ? 'selected' : ''} ${isNumericSection ? 'circle-btn' : ''}`}
                onClick={() => toggleFilter(key, option)}
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
    <div className="filter-overlay" onClick={onClose}>
      <div className="filter-content" onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className="filter-header">
          <h2>Filters</h2>
          <button onClick={onClose}>×</button>
        </div>

        {/* スクロールエリア */}
        <div className="filter-body">
          {/* PC用グリッドコンテナ */}
          <div className="filter-grid-container">
            {renderSection('COLOR', 'colors', COLORS)}
            {renderSection('TYPE', 'types', TYPES)}
            {renderSection('LEVEL', 'levels', NUMBERS)}
            {renderSection('COST', 'costs', NUMBERS)}
            {renderSection('AP', 'aps', NUMBERS)}
            {renderSection('HP', 'hps', NUMBERS)}
            {renderSection('ZONE', 'zones', ZONES)}
          </div>

          {/* リセットボタン */}
          <button
            className="filter-reset-btn"
            onClick={() => setFilters({
              ...filters,
              colors: [], types: [], costs: [], levels: [], rarities: [],
              expansion_sets: [], zones: [], aps: [], hps: [], text: filters.text
            })}
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  );
};