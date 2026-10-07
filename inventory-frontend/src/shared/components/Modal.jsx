/** @module shared/components/Modal */

import { useEffect } from 'react';
import { HiX } from 'react-icons/hi';

const Modal = ({ isOpen, onClose, children, title }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="modal"
      className="modal-overlay animate-[fadeIn_0.2s_ease]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-content w-[min(600px,100%)] max-h-[min(90dvh,90vh)] animate-[slideUp_0.3s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal-header">
            <h3 className="modal-title">{title}</h3>
            <button
              type="button"
              className="btn-icon !border-none !shadow-none w-9 h-9"
              onClick={onClose}
              aria-label="Close modal"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
