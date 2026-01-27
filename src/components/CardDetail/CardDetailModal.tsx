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
      const modalContent = document.querySelector('.base-modal-content');
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    }
  }, [card]);

  // リンク可能なパイロットを抽出
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
          if (c.name.includes(name)) return true;
          if (c.text && c.text.includes(name)) return true;
          return false;
        });
      }
      return false;
    });
  }, [card, allCards]);

  // 表示用パイロット名を決定する関数
  const getDisplayPilotName = (pilot: Card) => {
    if (pilot.text && pilot.text.includes('【パイロット】')) {
      const match = pilot.text.match(/[「『](.+?)[」』]/);
      if (match) {
        return match[1];
      }
    }
    return pilot.name;
  };

  if (!card) return null;

  // --- ステータス表示のロジック ---
  const isPilot = card.type === 'PILOT' || (card.text && card.text.includes('【パイロット】'));

  /**
   * ステータスの数値を整形して返す
   * @param value 表示する値
   * @param isBuff AP/HPなどパイロット時にプラス補正がかかる項目かどうか
   */
  const formatStatus = (value: number | string | undefined, isBuff: boolean = false) => {
    if (value === undefined || value === null) return '-';

    // パイロットかつバフ項目(AP/HP)なら "+" をつける
    if (isPilot && isBuff) {
      return `+${value}`;
    }

    // それ以外で 0 なら "-" にする
    if (value == 0 || value === '0') {
      return '-';
    }

    return value;
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

      <div>
        <div className="card-detail-image-container">
          {card.image_url ? (
            <img src={`/images/${card.image_url}`} alt={card.name} className="card-detail-image" loading="eager" fetchPriority="high" />
          ) : (
            <div className="card-detail-no-image">No Image</div>
          )}
        </div>

        <h2 className="card-detail-title">{card.name}</h2>

        <div className="card-detail-info-box">
          <div className="card-stats-grid">
            <div className="card-stat-row">
              <span className="stat-label">Color:</span>
              <span className="stat-value">{card.color}</span>
            </div>
            <div className="card-stat-row">
              <span className="stat-label">Type:</span>
              <span className="stat-value">{card.type}</span>
            </div>
            
            <div className="card-stat-row">
              <span className="stat-label">Level:</span>
              {/* Levelはバフではないので isBuff=false (0なら-になる) */}
              <span className="stat-value">{formatStatus(card.level, false)}</span>
            </div>
            <div className="card-stat-row">
              <span className="stat-label">Cost:</span>
              {/* Costもバフではない (0なら-になる) */}
              <span className="stat-value">{formatStatus(card.cost, false)}</span>
            </div>

            <div className="card-stat-row">
              <span className="stat-label">AP:</span>
              {/* APはパイロット時にバフ扱い (0なら-、パイロットなら+数値) */}
              <span className="stat-value">{formatStatus(card.ap, true)}</span>
            </div>
            <div className="card-stat-row">
              <span className="stat-label">HP:</span>
              {/* HPも同様 */}
              <span className="stat-value">{formatStatus(card.hp, true)}</span>
            </div>
          </div>

          <div className="card-info-row">
            <span className="stat-label">Trait:</span>
            <span>{card.traits}</span>
          </div>
          <div className="card-info-row">
            <span className="stat-label">Zone:</span>
            <span>{(card as any).zone}</span>
          </div>
          <div className="card-info-row">
            <span className="stat-label">Link:</span>
            <span>{(card as any).link}</span>
          </div>
          
          <div className="card-text-body">{card.text || 'No text available.'}</div>
        </div>

        {/* リンク可能パイロット表示 */}
        {linkablePilots.length > 0 && (
          <div className="linkable-pilots-section">
            <h3 className="linkable-pilots-title">
              Linkable Pilots ({linkablePilots.length})
            </h3>
            <div className="linkable-pilots-grid">
              {linkablePilots.map((pilot) => (
                <div 
                  key={pilot.id}
                  className="linkable-pilot-item"
                  onClick={() => onSelectCard && onSelectCard(pilot)}
                >
                  <div className="linkable-pilot-img-wrapper">
                    {pilot.image_url ? (
                       <img 
                         src={`/images/${pilot.image_url}`} 
                         alt={pilot.name} 
                         className="linkable-pilot-img"
                       />
                    ) : (
                      <div className="linkable-pilot-no-img">
                        {pilot.name}
                      </div>
                    )}
                  </div>
                  
                  <div className="linkable-pilot-name">
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