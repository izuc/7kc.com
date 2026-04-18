import { useEffect } from 'react';
import { Icon } from './Icon';

export function Modal({
  children,
  onClose,
  small,
  title,
  eyebrow,
}: {
  children: React.ReactNode;
  onClose: () => void;
  small?: boolean;
  title?: string;
  eyebrow?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${small ? 'modal-sm' : ''}`} onClick={(e) => e.stopPropagation()}>
        {(title || eyebrow) && (
          <div className="modal-head">
            <div>
              {eyebrow && <div className="eyebrow">{eyebrow}</div>}
              {title && <h2>{title}</h2>}
            </div>
            <button className="x" onClick={onClose} aria-label="close">
              <Icon name="x" size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
