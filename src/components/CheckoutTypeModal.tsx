import { X, UserCircle, LogIn } from 'lucide-react';
import { useEffect } from 'react';

interface CheckoutTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuestCheckout: () => void;
  onLoginCheckout: () => void;
}

export function CheckoutTypeModal({ isOpen, onClose, onGuestCheckout, onLoginCheckout }: CheckoutTypeModalProps) {
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
          <h2 className="text-2xl font-bold text-white">¿Cómo deseas continuar?</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <button
            onClick={onGuestCheckout}
            className="w-full bg-slate-700/50 hover:bg-slate-700 border border-amber-500/30 hover:border-amber-500/50 rounded-xl p-6 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-amber-500/10 p-3 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                <UserCircle className="w-8 h-8 text-amber-400" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-white font-bold text-lg mb-1">Comprar como invitado</h3>
                <p className="text-slate-400 text-sm">Continuar sin crear una cuenta</p>
              </div>
            </div>
          </button>

          <button
            onClick={onLoginCheckout}
            className="w-full bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/50 hover:border-orange-500/70 rounded-xl p-6 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-orange-500/20 p-3 rounded-lg group-hover:bg-orange-500/30 transition-colors">
                <LogIn className="w-8 h-8 text-orange-400" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-white font-bold text-lg mb-1">Iniciar sesión</h3>
                <p className="text-slate-400 text-sm">Accede a tu cuenta para ver tu historial</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
