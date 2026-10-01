import { useEffect } from 'react';

export default function Modal({ open, onClose, children, maxWidth, variant }) {
  useEffect(() => {
    if (!open) return;
    const onEsc = e => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`modal-backdrop ${variant ? `variant-${variant}` : ''}`}
      onMouseDown={e => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className={`modal ${variant ? `variant-${variant}` : ''}`}
        style={maxWidth ? { maxWidth } : undefined}
      >
        {children}
      </div>
    </div>
  );
}