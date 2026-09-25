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

      <div className="relative bg-bg-elevated border border-line rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-line">
          <h2 className="text-2xl font-bold text-content">¿Cómo deseas continuar?</h2>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content transition-colors p-2 hover:bg-surface rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <button
            onClick={onGuestCheckout}
            className="w-full bg-surface-hover hover:bg-surface-hover border border-line hover:border-brand/50 rounded-xl p-6 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-brand-soft p-3 rounded-lg group-hover:bg-brand-soft transition-colors">
                <UserCircle className="w-8 h-8 text-accent" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-content font-bold text-lg mb-1">Comprar como invitado</h3>
                <p className="text-content-muted text-sm">Continuar sin crear una cuenta</p>
              </div>
            </div>
          </button>

          <button
            onClick={onLoginCheckout}
            className="w-full bg-brand/20 hover:bg-brand/30 border border-brand/40 hover:border-brand/60 rounded-xl p-6 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-brand-soft p-3 rounded-lg group-hover:bg-brand-hover/30 transition-colors">
                <LogIn className="w-8 h-8 text-brand" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-content font-bold text-lg mb-1">Iniciar sesión</h3>
                <p className="text-content-muted text-sm">Accede a tu cuenta para ver tu historial</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
