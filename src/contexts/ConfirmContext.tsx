import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** 'danger' pinta el botón de confirmar en rojo (acciones destructivas). */
  variant?: 'danger' | 'default';
}

interface ConfirmContextType {
  /** Abre un diálogo de confirmación y resuelve a true/false según la elección. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

interface DialogState extends ConfirmOptions {
  open: boolean;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>({ open: false, message: '' });
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setState({ ...options, open: true });
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    setState((s) => ({ ...s, open: false }));
    resolver.current?.(result);
    resolver.current = null;
  }, []);

  const isDanger = state.variant === 'danger';

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => close(false)} />
          <div className="relative bg-bg-elevated border border-line rounded-2xl w-full max-w-sm shadow-card-hover animate-[toastIn_.2s_ease]">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${
                    isDanger ? 'bg-red-500/10' : 'bg-brand-soft'
                  }`}
                >
                  <AlertTriangle className={`w-6 h-6 ${isDanger ? 'text-red-500' : 'text-brand'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-content font-bold text-lg">{state.title ?? 'Confirmar'}</h3>
                  <p className="text-content-soft text-sm mt-1">{state.message}</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => close(false)}
                  className="flex-1 bg-surface hover:bg-surface-hover border border-line text-content font-semibold py-2.5 rounded-full transition-colors"
                >
                  {state.cancelText ?? 'Cancelar'}
                </button>
                <button
                  onClick={() => close(true)}
                  className={`flex-1 font-semibold py-2.5 rounded-full transition-colors text-white ${
                    isDanger ? 'bg-red-600 hover:bg-red-500' : 'bg-brand hover:bg-brand-hover text-brand-contrast'
                  }`}
                >
                  {state.confirmText ?? 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (context === undefined) {
    throw new Error('useConfirm debe ser usado dentro de ConfirmProvider');
  }
  return context.confirm;
}
