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

// ナビゲーションボタンの共通スタイル
const navButtonStyle: React.CSSProperties = {
  position: 'fixed', // 画面に対して固定 (モーダルの中身ではなく画面端に置くため)
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'rgba(255, 255, 255, 0.8)',
  border: '1px solid #ddd',
  borderRadius: '50%',
  width: '48px',
  height: '48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  zIndex: 1100, // モーダルのz-index(1000)より上
  userSelect: 'none',
  outline: 'none',
};

export const CardDetailModal = ({
  card, onClose, onPrev, onNext, hasPrev = false, hasNext = false
}: CardDetailModalProps) => {
  // キーボード操作対応
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

  return (
    <Modal isOpen={!!card} onClose={onClose}>
      {/* ▼ ナビゲーションボタン (PC/タブレット/スマホ対応) */}
      {hasPrev && (
        <button 
          onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
          style={{ ...navButtonStyle, left: 'max(10px, calc(50% - 310px))' }} // 左端
          aria-label="Previous Card"
        >
          ‹
        </button>
      )}

      {hasNext && (
        <button 
          onClick={(e) => { e.stopPropagation(); onNext?.(); }}
          style={{ ...navButtonStyle, right: 'max(10px, calc(50% - 310px))' }} // 右端
          aria-label="Next Card"
        >
          ›
        </button>
      )}

      <div style={{ textAlign: 'center' }}>
        {/* 拡大画像 */}
        <div style={{ marginBottom: '16px' }}>
          {card.image_url ? (
            <img 
              src={`/images/${card.image_url}`} 
              alt={card.name} 
              style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain', borderRadius: '8px' }}
            />
          ) : (
            <div style={{ height: '300px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              No Image
            </div>
          )}
        </div>

        {/* カード情報 */}
        <h2 style={{ margin: '0 0 10px 0', fontSize: '19px' }}>{card.name}</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ background: '#eee', padding: '4px 8px', borderRadius: '4px' }}>{card.color}</span>
            <span style={{ background: '#eee', padding: '4px 8px', borderRadius: '4px' }}>{card.type}</span>
            <span style={{ background: '#eee', padding: '4px 8px', borderRadius: '4px' }}>Level: {card.level}</span>
            <span style={{ background: '#eee', padding: '4px 8px', borderRadius: '4px' }}>Cost: {card.cost}</span>
            <span style={{ background: '#eee', padding: '4px 8px', borderRadius: '4px' }}>AP: {card.ap}</span>
            <span style={{ background: '#eee', padding: '4px 8px', borderRadius: '4px' }}>HP: {card.hp}</span>
        </div>

        {/* テキストエリア */}
        <div style={{ textAlign: 'left', background: '#f9f9f9', padding: '12px', borderRadius: '8px', fontSize: '14px' }}>
            <div style={{ marginBottom: '8px' }}><strong>Trait:</strong> {card.traits}</div>
            <div style={{ marginBottom: '8px' }}><strong>Zone:</strong> {card.zone}</div>
            <div style={{ marginBottom: '8px' }}><strong>Link:</strong> {card.link}</div>
            <hr />
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{card.text}</div>
        </div>
      </div>
    </Modal>
  );
};