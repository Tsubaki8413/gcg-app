import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  // モーダルが開いている間は背景スクロールを禁止
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  // React Portalを使ってbody直下に描画（z-index管理のため）
  return createPortal(
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose} // 背景クリックで閉じる
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          padding: '20px'
        }}
        onClick={e => e.stopPropagation()} // 中身クリックでは閉じない
      >
        {/* 閉じるボタン */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '0', right: '10px',
            background: 'none', border: 'none', fontSize: '60px', cursor: 'pointer', color: '#666'
          }}
        >
          ×
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
};