import { useEffect } from 'react';
import type { Card } from '../../types';
import { Modal } from '../common/Modal';

interface CardDetailModalProps {
  card: Card | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const CardDetailModal = ({
  card, onClose, onPrev, onNext, hasPrev = false, hasNext = false
}: CardDetailModalProps) => {
  
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

  if (!card) return null;

  // 値が存在するかどうかの判定
  const hasValue = (val: any) => val !== undefined && val !== null && val !== '';

  // ★追加: 数値をCSVの表記（+付き）に戻すためのフォーマッタ
  const formatStat = (val: any, type: string) => {
    if (!hasValue(val)) return null;
    
    // PILOTなど、補正値を持つタイプの場合は符号をつける
    // (データ読み込み時に数値化されているため、ここで+を再付与します)
    // 必要なタイプがあれば条件に追加してください (例: || type === 'COMMAND')
    if (type === 'PILOT') {
      const num = Number(val);
      if (!isNaN(num) && num >= 0) {
        return `+${val}`; // 0以上なら+をつける（+0含む）
      }
    }
    return val;
  };

  return (
    <Modal isOpen={!!card} onClose={onClose}>
      {/* ナビゲーションボタン */}
      {hasPrev && (
        <button 
          className="modal-nav-btn modal-nav-prev"
          onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
          aria-label="Previous Card"
        >
          ‹
        </button>
      )}

      {hasNext && (
        <button 
          className="modal-nav-btn modal-nav-next"
          onClick={(e) => { e.stopPropagation(); onNext?.(); }}
          aria-label="Next Card"
        >
          ›
        </button>
      )}

      {/* コンテンツエリア */}
      <div>
        {/* 画像 */}
        <div className="card-detail-image-container">
          {card.image_url ? (
            <img 
              src={`/images/${card.image_url}`} 
              alt={card.name}
              className="card-detail-image"
              loading="eager"
              fetchPriority="high"
            />
          ) : (
            <div className="card-detail-no-image">
              No Image
            </div>
          )}
        </div>

        {/* タイトル */}
        <h2 className="card-detail-title">{card.name}</h2>

        {/* 詳細タグ */}
        <div className="card-detail-tags">
          {hasValue(card.color) && <span className="card-tag">{card.color}</span>}
          {hasValue(card.type) && <span className="card-tag">{card.type}</span>}
          
          {hasValue(card.level) && <span className="card-tag">Level: {card.level}</span>}
          {hasValue(card.cost) && <span className="card-tag">Cost: {card.cost}</span>}
          
          {/* ★修正: AP/HP は formatStat を通して + を付与する */}
          {hasValue(card.ap) && <span className="card-tag">AP: {formatStat(card.ap, card.type)}</span>}
          {hasValue(card.hp) && <span className="card-tag">HP: {formatStat(card.hp, card.type)}</span>}
        </div>

        {/* 詳細テキスト */}
        <div className="card-detail-info-box">
          <div className="card-info-row"><strong>Trait:</strong> {card.traits}</div>
          <div className="card-info-row"><strong>Zone:</strong> {card.zone}</div>
          <div className="card-info-row"><strong>Link:</strong> {card.link}</div>
          
          <div className="card-text-body">
            {card.text}
          </div>
        </div>
      </div>
    </Modal>
  );
};