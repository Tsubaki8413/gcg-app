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

  // --------------------------------------------------------------------------
  // Helper: 表示用パイロット名を決定する関数
  // --------------------------------------------------------------------------
  const getDisplayPilotName = (pilot: Card) => {
    if (pilot.text && pilot.text.includes('【パイロット】')) {
      // 【パイロット】より後ろにある最初の「」または『』の中身を取得
      const keywordIndex = pilot.text.indexOf('【パイロット】');
      if (keywordIndex !== -1) {
        const textAfterKeyword = pilot.text.slice(keywordIndex);
        const match = textAfterKeyword.match(/[「『](.+?)[」』]/);
        if (match) {
          return match[1];
        }
      }
    }
    return pilot.name;
  };

  // --------------------------------------------------------------------------
  // Helper: 「としても扱う」別名を取得する関数
  // --------------------------------------------------------------------------
  const getAliasName = (text: string | undefined) => {
    if (!text) return null;
    const match = text.match(/このカードのカード名は「([^」]+)」としても扱う/);
    return match ? match[1] : null;
  };

  // --------------------------------------------------------------------------
  // タイトル表示用ロジック
  // --------------------------------------------------------------------------
  const titleDisplay = useMemo(() => {
    if (!card) return '';
    
    // テキストに【パイロット】が含まれる場合、後ろの名前を抽出して連結
    if (card.text && card.text.includes('【パイロット】')) {
      const keywordIndex = card.text.indexOf('【パイロット】');
      if (keywordIndex !== -1) {
        const textAfterKeyword = card.text.slice(keywordIndex);
        const match = textAfterKeyword.match(/[「『](.+?)[」』]/);
        if (match) {
          // 例: "深い愛情／ルクレツィア・ノイン"
          return `${card.name}／${match[1]}`;
        }
      }
    }
    
    return card.name;
  }, [card]);

  // --------------------------------------------------------------------------
  // 1. リンク可能なパイロットを抽出 (Unit -> Pilot)
  // --------------------------------------------------------------------------
  const linkablePilots = useMemo(() => {
    if (!card || !allCards || allCards.length === 0) return [];
    if (card.type?.toUpperCase() !== 'UNIT') return [];
    
    const rawLink = (card as any).link;
    if (!rawLink || rawLink === '-' || rawLink === '') return [];

    const targetNames: string[] = [];
    const targetTraits: string[] = [];

    // 1. 特徴の抽出 (プレフィックスなしで抽出)
    const traitRegex = /(?:〔|\[|【)(.+?)(?:〕|\]|】)/g;
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

    // 3. フォールバック
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

      // A. 特徴マッチング (完全一致)
      if (targetTraits.length > 0 && c.traits) {
        const pilotTraits: string[] = [];
        const ptRegex = /(?:〔|\[|【)(.+?)(?:〕|\]|】)/g;
        let ptMatch;
        while ((ptMatch = ptRegex.exec(c.traits)) !== null) {
          pilotTraits.push(ptMatch[1]);
        }
        if (targetTraits.some(target => pilotTraits.includes(target))) return true;
      }

      // B. 名前マッチング (部分一致)
      if (targetNames.length > 0) {
        return targetNames.some(name => {
          // 1. カード名
          if (c.name.includes(name)) return true;
          
          // 2. 【パイロット】表記名
          const displayName = getDisplayPilotName(c);
          if (displayName !== c.name && displayName.includes(name)) return true;

          // 3. 「としても扱う」別名 (NEW)
          const aliasName = getAliasName(c.text);
          if (aliasName && aliasName.includes(name)) return true;

          return false;
        });
      }
      return false;
    });
  }, [card, allCards]);

  // --------------------------------------------------------------------------
  // 2. リンク可能なユニットを抽出 (Pilot -> Unit)
  // --------------------------------------------------------------------------
  const linkableUnits = useMemo(() => {
    const isPilot = card && (card.type === 'PILOT' || (card.text && card.text.includes('【パイロット】')));
    if (!isPilot || !allCards || allCards.length === 0) return [];

    // 自分の情報を準備
    const myName = card.name;
    const myTextName = getDisplayPilotName(card);
    const hasTextName = myTextName !== myName;
    const myAliasName = getAliasName(card.text); // (NEW)

    // 自分の特徴リストを作成
    const myTraits: string[] = [];
    if (card.traits) {
      const myTraitRegex = /(?:〔|\[|【)(.+?)(?:〕|\]|】)/g;
      let mMatch;
      while ((mMatch = myTraitRegex.exec(card.traits)) !== null) {
        myTraits.push(mMatch[1]);
      }
    }

    return allCards.filter(unit => {
      if (unit.type?.toUpperCase() !== 'UNIT') return false;
      
      const linkText = (unit as any).link;
      if (!linkText || linkText === '-' || linkText === '') return false;

      const targetNames: string[] = [];
      const targetTraits: string[] = [];

      // 1. 特徴条件の抽出
      const unitTraitRegex = /(?:〔|\[|【)(.+?)(?:〕|\]|】)/g;
      let tMatch;
      while ((tMatch = unitTraitRegex.exec(linkText)) !== null) {
        targetTraits.push(tMatch[1]);
      }

      // 2. 名前条件の抽出
      const unitNameRegex = /[「『](.+?)[」』]/g;
      let nMatch;
      let hasNameBrackets = false;
      while ((nMatch = unitNameRegex.exec(linkText)) !== null) {
        hasNameBrackets = true;
        targetNames.push(nMatch[1]);
      }

      // 3. フォールバック
      if (!hasNameBrackets && targetTraits.length === 0) {
        const parts = linkText.split('/');
        parts.forEach((p: string) => {
          const clean = p.trim();
          if (clean) targetNames.push(clean);
        });
      }

      // --- 判定ロジック ---

      // A. 特徴マッチング (完全一致)
      if (targetTraits.length > 0) {
        const traitMatch = targetTraits.some(target => myTraits.includes(target));
        if (traitMatch) return true;
      }

      // B. 名前マッチング (部分一致)
      if (targetNames.length > 0) {
        const nameMatch = targetNames.some(target => {
          return myName.includes(target) || 
                 (hasTextName && myTextName.includes(target)) ||
                 (myAliasName && myAliasName.includes(target)); // (NEW)
        });
        if (nameMatch) return true;
      }

      return false;
    });
  }, [card, allCards]);


  if (!card) return null;

  // --- ステータス表示のロジック ---
  const isPilot = card.type === 'PILOT' || (card.text && card.text.includes('【パイロット】'));

  const formatStatus = (value: number | string | undefined, isBuff: boolean = false) => {
    if (value === undefined || value === null) return '-';
    if (isPilot && isBuff) {
      return `+${value}`;
    }
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

        <h2 className="card-detail-title">{titleDisplay}</h2>

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
              <span className="stat-value">{formatStatus(card.level, false)}</span>
            </div>
            <div className="card-stat-row">
              <span className="stat-label">Cost:</span>
              <span className="stat-value">{formatStatus(card.cost, false)}</span>
            </div>

            <div className="card-stat-row">
              <span className="stat-label">AP:</span>
              <span className="stat-value">{formatStatus(card.ap, true)}</span>
            </div>
            <div className="card-stat-row">
              <span className="stat-label">HP:</span>
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

        {/* Unit -> Pilot */}
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

        {/* Pilot -> Unit */}
        {linkableUnits.length > 0 && (
          <div className="linkable-pilots-section">
            <h3 className="linkable-pilots-title">
              Linkable Units ({linkableUnits.length})
            </h3>
            <div className="linkable-pilots-grid">
              {linkableUnits.map((unit) => (
                <div 
                  key={unit.id}
                  className="linkable-pilot-item"
                  onClick={() => onSelectCard && onSelectCard(unit)}
                >
                  <div className="linkable-pilot-img-wrapper">
                    {unit.image_url ? (
                       <img 
                         src={`/images/${unit.image_url}`} 
                         alt={unit.name} 
                         className="linkable-pilot-img"
                       />
                    ) : (
                      <div className="linkable-pilot-no-img">
                        {unit.name}
                      </div>
                    )}
                  </div>
                  <div className="linkable-pilot-name">
                    {unit.name}
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