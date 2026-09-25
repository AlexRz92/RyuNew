import { X, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

interface ReplaceCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentCartCount: number;
}

export function ReplaceCartModal({ isOpen, onClose, onConfirm, currentCartCount }: ReplaceCartModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-bg-elevated border border-line rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="bg-brand-soft p-2 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-brand" />
            </div>
            <h2 className="text-xl font-bold text-content">Confirmar Reemplazo</h2>
          </div>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content transition-colors p-2 hover:bg-surface rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-brand-soft border border-brand/30 rounded-lg p-4">
            <p className="text-content-soft text-center">
              Tu carrito ya tiene <span className="text-brand font-bold">{currentCartCount}</span> {currentCartCount === 1 ? 'producto' : 'productos'}.
            </p>
            <p className="text-content-soft text-center mt-2">
              ¿Deseas reemplazarlo con los productos de esta compra?
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-surface-hover hover:bg-surface-hover text-content font-semibold py-3 rounded-lg transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 bg-brand hover:bg-brand-hover text-brand-contrast font-bold py-3 rounded-lg transition-all shadow-lg "
            >
              Reemplazar carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
