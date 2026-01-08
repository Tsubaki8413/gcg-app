// import { Card } from '../../types'; // ←もしパスエラーが出たら '../types' か直接定義で対応
import { Modal } from '../common/Modal';

interface CardDetailModalProps {
  card: Card | null;
  onClose: () => void;
}

export const CardDetailModal = ({ card, onClose }: CardDetailModalProps) => {
  if (!card) return null;

  return (
    <Modal isOpen={!!card} onClose={onClose}>
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