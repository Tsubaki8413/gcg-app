import { useEffect, useMemo } from 'react';
import type { Card } from '../../types';
import { Modal } from '../common/Modal';

interface CardDetailModalProps {
  card: Card | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  allCards: Card[];
  onSelectCard?: (card: Card) => void;
}

export const CardDetailModal = ({
  card,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  allCards = [],
  onSelectCard
}: CardDetailModalProps) => {

  // キーボード操作設定
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!card) return;
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [card, hasPrev, hasNext, onPrev, onNext, onClose]);

  // カードが切り替わった時にスクロール位置をトップに戻す
  useEffect(() => {
    if (card) {
      // Modalコンポーネント側のスクロール領域を取得してリセット
      const modalContent = document.querySelector('.base-modal-content');
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    }
  }, [card]);

  const linkablePilots = useMemo(() => {
    if (!card || !allCards || allCards.length === 0) return [];
    if (card.type?.toUpperCase() !== 'UNIT') return [];
    
    const rawLink = (card as any).link;
    if (!rawLink || rawLink === '-' || rawLink === '') return [];

    const targetNames: string[] = [];
    const targetTraits: string[] = [];

    // 1. 特徴の抽出
    const traitRegex = /特徴(?:〔|\[|【)(.+?)(?:〕|\]|】)/g;
    let tMatch;
    while ((tMatch = traitRegex.exec(rawLink)) !== null) {
      targetTraits.push(tMatch[1]);
    }

    // 2. 名前の抽出
    const nameRegex = /[「『](.+?)[」』]/g;
    let nMatch;
    let hasNameBrackets = false;
    while ((nMatch = nameRegex.exec(rawLink)) !== null) {
      hasNameBrackets = true;
      targetNames.push(nMatch[1]);
    }

    // 3. カッコがない場合のフォールバック
    if (!hasNameBrackets && targetTraits.length === 0) {
      const parts = rawLink.split('/');
      parts.forEach((p: string) => {
        const clean = p.trim();
        if (clean) targetNames.push(clean);
      });
    }

    return allCards.filter(c => {
      const isPilot = c.type === 'PILOT' || (c.text && c.text.includes('【パイロット】'));
      if (!isPilot) return false;

      // A. 特徴マッチング
      if (targetTraits.length > 0) {
        if (c.traits && targetTraits.some(trait => c.traits.includes(trait))) return true;
      }

      // B. 名前マッチング
      if (targetNames.length > 0) {
        return targetNames.some(name => {
          // 1. カード名に含まれているか
          if (c.name.includes(name)) return true;
          // 2. テキストに含まれているか（「～としても扱う」対応）
          if (c.text && c.text.includes(name)) return true;
          return false;
        });
      }
      return false;
    });
  }, [card, allCards]);

  // 表示用パイロット名を決定する関数
  const getDisplayPilotName = (pilot: Card) => {
    // テキストに【パイロット】があり、かつ「〇〇」が含まれている場合
    if (pilot.text && pilot.text.includes('【パイロット】')) {
      // 最初の「」または『』の中身を抽出して返す
      const match = pilot.text.match(/[「『](.+?)[」』]/);
      if (match) {
        return match[1];
      }
    }
    // なければ通常のカード名を返す
    return pilot.name;
  };

  if (!card) return null;

  const hasValue = (val: any) => val !== undefined && val !== null && val !== '';
  
  const formatStat = (val: number | string | null | undefined, type: string, text?: string) => {
    const num = Number(val);
    const t = type ? type.toUpperCase() : '';
    const isPilotLike = t === 'PILOT' || (text && text.includes('【パイロット】'));
    if (isNaN(num) || val === '' || val === null || val === undefined) return '-';
    if (isPilotLike) return num >= 0 ? `+${num}` : `${num}`;
    return num === 0 ? '-' : `${num}`;
  };

  return (
    <Modal isOpen={!!card} onClose={onClose}>
      {hasPrev && (
        <button className="modal-nav-btn modal-nav-prev" onClick={(e) => { e.stopPropagation(); onPrev && onPrev(); }}>
          ‹
        </button>
      )}
      {hasNext && (
        <button className="modal-nav-btn modal-nav-next" onClick={(e) => { e.stopPropagation(); onNext && onNext(); }}>
          ›
        </button>
      )}

      <div style={{ paddingBottom: '40px' }}>
        <div className="card-detail-image-container">
          {card.image_url ? (
            <img src={`/images/${card.image_url}`} alt={card.name} className="card-detail-image" loading="eager" fetchPriority="high" />
          ) : (
            <div className="card-detail-no-image">No Image</div>
          )}
        </div>

        <h2 className="card-detail-title">{card.name}</h2>

        <div className="card-detail-tags">
          {hasValue(card.color) && <span className="card-tag">{card.color}</span>}
          {hasValue(card.type) && <span className="card-tag">{card.type}</span>}
          {hasValue(card.level) && <span className="card-tag">Level: {card.level}</span>}
          {hasValue(card.cost) && <span className="card-tag">Cost: {card.cost}</span>}
          <span className="card-tag">AP: {formatStat(card.ap, card.type, card.text)}</span>
          <span className="card-tag">HP: {formatStat(card.hp, card.type, card.text)}</span>
        </div>

        <div className="card-detail-info-box">
          <div className="card-info-row"><strong>Trait:</strong> {card.traits}</div>
          <div className="card-info-row"><strong>Zone:</strong> {(card as any).zone}</div>
          <div className="card-info-row"><strong>Link:</strong> {(card as any).link}</div>
          <div className="card-text-body">{card.text || 'No text available.'}</div>
        </div>

        {/* リンク可能パイロット表示 */}
        {linkablePilots.length > 0 && (
          <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
              Linkable Pilots ({linkablePilots.length})
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(5, 1fr)', 
              gap: '8px',
              paddingBottom: '8px' 
            }}>
              {linkablePilots.map((pilot) => (
                <div 
                  key={pilot.id}
                  onClick={() => onSelectCard && onSelectCard(pilot)}
                  style={{ 
                    cursor: 'pointer', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center' 
                  }}
                >
                  <div style={{ 
                    width: '100%', 
                    aspectRatio: '5/7', 
                    borderRadius: '4px', 
                    border: '1px solid #eee',
                    overflow: 'hidden',
                    background: '#f9f9f9',
                    position: 'relative'
                  }}>
                    {pilot.image_url ? (
                       <img 
                         src={`/images/${pilot.image_url}`} 
                         alt={pilot.name} 
                         style={{ 
                           width: '100%', 
                           height: '100%', 
                           objectFit: 'cover',
                           display: 'block' 
                         }} 
                       />
                    ) : (
                      <div style={{ 
                        width: '100%', height: '100%', 
                        fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2px'
                      }}>
                        {pilot.name}
                      </div>
                    )}
                  </div>
                  
                  {/* ★修正: getDisplayPilotName を使用して表示名を切り替え */}
                  <div style={{ 
                    width: '100%',
                    fontSize: '10px', 
                    textAlign: 'center', 
                    marginTop: '4px', 
                    color: '#333',
                    lineHeight: '1.2',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}>
                    {getDisplayPilotName(pilot)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};