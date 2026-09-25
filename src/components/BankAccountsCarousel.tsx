import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Copy, Check, AlertCircle } from 'lucide-react';
import { getActiveBankAccounts } from '../services/bankAccounts';
import type { BankAccount } from '../lib/types';

export function BankAccountsCarousel() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getActiveBankAccounts()
      .then((data) => {
        if (active) setAccounts(data);
      })
      .catch(() => {
        if (active) setError('No se pudieron cargar las cuentas bancarias');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-bg-subtle border border-line rounded-lg p-6">
        <p className="text-content-muted text-center">Cargando cuentas bancarias...</p>
      </div>
    );
  }

  if (!accounts.length) {
    return null;
  }

  if (error) {
    return (
      <div className="bg-bg-subtle border border-line rounded-lg p-6">
        <div className="flex items-center gap-2 text-accent mb-2">
          <AlertCircle className="w-5 h-5" />
          <p className="font-semibold">Aviso</p>
        </div>
        <p className="text-content-soft text-sm">{error}</p>
      </div>
    );
  }

  const currentAccount = accounts[currentIndex];

  function copyToClipboard(text: string, fieldName: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function goToPrevious() {
    setCurrentIndex((prev) => (prev === 0 ? accounts.length - 1 : prev - 1));
  }

  function goToNext() {
    setCurrentIndex((prev) => (prev === accounts.length - 1 ? 0 : prev + 1));
  }

  return (
    <div className="bg-bg-subtle border border-line rounded-lg p-6">
      <h3 className="text-content font-semibold text-lg mb-4">Datos para Transferir</h3>

      <div className="relative">
        {accounts.length > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 bg-surface-hover hover:bg-surface-hover text-content p-2 rounded-lg transition-colors z-10"
              aria-label="Cuenta anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 bg-surface-hover hover:bg-surface-hover text-content p-2 rounded-lg transition-colors z-10"
              aria-label="Siguiente cuenta"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        <div className="bg-gradient-to-br bg-surface border border-line rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-accent font-semibold">{currentAccount.label}</h4>
            {accounts.length > 1 && (
              <span className="text-sm text-content-muted">
                {currentIndex + 1} de {accounts.length}
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-content-muted text-sm mb-1">Banco</p>
              <p className="text-content font-medium">{currentAccount.bank_name}</p>
            </div>

            <div>
              <p className="text-content-muted text-sm mb-1">Titular</p>
              <div className="flex items-center justify-between">
                <p className="text-content font-medium">{currentAccount.account_holder}</p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(currentAccount.account_holder, 'holder')}
                  className="text-accent hover:text-accent-hover transition-colors p-1"
                  title="Copiar"
                >
                  {copiedField === 'holder' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <p className="text-content-muted text-sm mb-1">Cédula/RIF</p>
              <div className="flex items-center justify-between">
                <p className="text-content font-medium font-mono">{currentAccount.document_id}</p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(currentAccount.document_id, 'document')}
                  className="text-accent hover:text-accent-hover transition-colors p-1"
                  title="Copiar"
                >
                  {copiedField === 'document' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <p className="text-content-muted text-sm mb-1">
                {currentAccount.bank_name.toLowerCase().includes('pago') ? 'Número de Teléfono' : 'Número de Cuenta'}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-content font-medium font-mono text-lg">{currentAccount.account_number}</p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(currentAccount.account_number, 'account')}
                  className="text-accent hover:text-accent-hover transition-colors p-1"
                  title="Copiar"
                >
                  {copiedField === 'account' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {currentAccount.account_type && (
              <div>
                <p className="text-content-muted text-sm mb-1">Tipo</p>
                <p className="text-content font-medium capitalize">{currentAccount.account_type}</p>
              </div>
            )}

            {currentAccount.notes && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-3">
                <p className="text-blue-300 text-sm">{currentAccount.notes}</p>
              </div>
            )}
          </div>
        </div>

        {accounts.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {accounts.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-brand w-6' : 'bg-line'
                }`}
                aria-label={`Ir a cuenta ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <p className="text-content-muted text-xs mt-4 text-center">
        Haz clic en los iconos para copiar los datos al portapapeles
      </p>
    </div>
  );
}
