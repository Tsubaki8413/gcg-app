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

  const hasValue = (val: any) => val !== undefined && val !== null && val !== '';

  // ★修正: PILOTまたはテキストに【パイロット】が含まれる場合は「+」強制、それ以外は0を「-」にする
  const formatStat = (val: number | string | null | undefined, type: string, text: string) => {
    // 1. 値がない、または「-」の場合はそのまま「-」
    if (val === null || val === undefined || val === '' || val === '-') {
      return '-';
    }

    const strVal = String(val);

    // 既に "+" が付いている場合はそのまま返す
    if (strVal.startsWith('+')) {
      return strVal;
    }

    const num = Number(val);
    if (isNaN(num)) return strVal;

    // 2. 判定条件: カードタイプがPILOT、またはテキストに「【パイロット】」が含まれるか
    // (テキストが undefined の可能性も考慮して空文字結合で安全にチェック)
    const isPilotLike = type === 'PILOT' || (text || '').includes('【パイロット】');

    if (isPilotLike) {
      // PILOT系: 0以上なら常に「+」をつける (0 -> "+0", 1 -> "+1")
      return num >= 0 ? `+${num}` : `${num}`;
    } else {
      // それ以外 (UNIT等): 0なら「-」、それ以外は数値をそのまま ("3000"など)
      return num === 0 ? '-' : strVal;
    }
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

          {/* typeとtextを渡して判定します */}
          <span className="card-tag">AP: {formatStat(card.ap, card.type, card.text)}</span>
          <span className="card-tag">HP: {formatStat(card.hp, card.type, card.text)}</span>
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
