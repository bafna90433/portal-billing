import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, ShieldCheck, ShieldX } from 'lucide-react';

interface ActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data?: string) => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'primary' | 'danger' | 'success';
  showInput?: boolean;
  inputPlaceholder?: string;
  icon?: 'approve' | 'reject' | 'alert';
}

const ActionConfirmModal: React.FC<ActionConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'primary',
  showInput = false,
  inputPlaceholder = 'Enter details...',
  icon = 'alert'
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  const handleConfirm = () => {
    if (showInput && !inputValue.trim()) return;
    onConfirm(showInput ? inputValue : undefined);
    handleClose();
  };

  if (!isOpen && !isClosing) return null;

  const getIcon = () => {
    switch (icon) {
      case 'approve': return <ShieldCheck size={32} color="#10B981" />;
      case 'reject': return <ShieldX size={32} color="#EF4444" />;
      default: return <AlertCircle size={32} color="#6366F1" />;
    }
  };

  const getBtnClass = () => {
    switch (confirmVariant) {
      case 'danger': return 'btn-danger';
      case 'success': return 'btn-success';
      default: return 'btn-primary';
    }
  };

  return (
    <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className={`modal-content ${isClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', padding: 0, overflow: 'hidden' }}>
        
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ 
            width: 70, height: 70, borderRadius: '50%', 
            background: 'var(--bg3)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 1.25rem' 
          }}>
            {getIcon()}
          </div>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text)' }}>{title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: showInput ? '1.5rem' : '2rem' }}>
            {message}
          </p>

          {showInput && (
            <div className="form-group" style={{ textAlign: 'left', marginBottom: '2rem' }}>
              <textarea 
                className="form-control"
                placeholder={inputPlaceholder}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                style={{ minHeight: '100px', resize: 'none', paddingTop: '0.75rem' }}
                autoFocus
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={handleClose} style={{ height: 46, fontWeight: 700 }}>
              Cancel
            </button>
            <button 
              className={`btn ${getBtnClass()}`} 
              onClick={handleConfirm}
              disabled={showInput && !inputValue.trim()}
              style={{ height: 46, fontWeight: 700, gap: '0.5rem' }}
            >
              {confirmText}
            </button>
          </div>
        </div>

        <button 
          onClick={handleClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 4 }}
        >
          <X size={20} />
        </button>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          animation: fadeIn 0.2s ease-out;
        }
        .modal-overlay.closing { animation: fadeOut 0.2s ease-in forwards; }
        
        .modal-content {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 24px;
          width: 90%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }
        .modal-content.closing { animation: slideDown 0.2s ease-in forwards; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        
        @keyframes slideUp { 
          from { transform: translateY(20px) scale(0.95); opacity: 0; } 
          to { transform: translateY(0) scale(1); opacity: 1; } 
        }
        @keyframes slideDown { 
          from { transform: translateY(0) scale(1); opacity: 1; } 
          to { transform: translateY(20px) scale(0.95); opacity: 0; } 
        }

        .btn-success {
          background: #10B981;
          color: white;
          border: none;
        }
        .btn-success:hover {
          background: #059669;
          transform: translateY(-1px);
        }
        .btn-success:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </div>
  );
};

export default ActionConfirmModal;
