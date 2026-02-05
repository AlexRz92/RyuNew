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

      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/20 p-2 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Confirmar Reemplazo</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <p className="text-slate-300 text-center">
              Tu carrito ya tiene <span className="text-orange-400 font-bold">{currentCartCount}</span> {currentCartCount === 1 ? 'producto' : 'productos'}.
            </p>
            <p className="text-slate-300 text-center mt-2">
              ¿Deseas reemplazarlo con los productos de esta compra?
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-orange-500/50"
            >
              Reemplazar carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
