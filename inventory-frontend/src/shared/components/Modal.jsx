/** @module shared/components/Modal */

import { useEffect } from 'react';

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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-6 animate-[fadeIn_0.2s_ease]"
      onClick={onClose}
      role="dialog" 
      aria-modal="true"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-[600px] w-full max-h-[90vh] overflow-y-auto animate-[slideUp_0.3s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 m-0">{title}</h3>
            <button 
              className="bg-transparent border-none text-2xl text-gray-400 cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100 hover:text-gray-900"
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
