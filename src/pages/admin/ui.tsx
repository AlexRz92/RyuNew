import { X } from 'lucide-react';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

/** Encabezado de página del admin. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold text-content">{title}</h1>
        {description && <p className="text-content-muted text-sm mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-bg-elevated border border-line rounded-xl ${className}`}>{children}</div>
  );
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}) {
  const variants = {
    primary: 'bg-brand hover:bg-brand-hover text-brand-contrast',
    secondary: 'bg-surface-hover hover:bg-surface-hover text-content',
    danger: 'bg-red-600 hover:bg-red-500 text-content',
    ghost: 'bg-transparent hover:bg-surface text-content-soft',
  };
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-bg-subtle border border-line rounded-lg px-3 py-2 text-content text-sm focus:border-brand focus:outline-none ${props.className ?? ''}`}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full bg-bg-subtle border border-line rounded-lg px-3 py-2 text-content text-sm focus:border-brand focus:outline-none resize-none ${props.className ?? ''}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full bg-bg-subtle border border-line rounded-lg px-3 py-2 text-content text-sm focus:border-brand focus:outline-none ${props.className ?? ''}`}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="block text-content-soft text-sm mb-1.5">{children}</label>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/** Modal genérico del admin. */
export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-elevated border border-line rounded-xl w-full max-w-lg my-8 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-line">
          <h2 className="text-lg font-bold text-content">{title}</h2>
          <button onClick={onClose} className="text-content-muted hover:text-content p-1" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="p-5 border-t border-line flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-400/10 text-yellow-400',
    confirmed: 'bg-blue-400/10 text-blue-400',
    completed: 'bg-green-400/10 text-green-400',
    cancelled: 'bg-red-400/10 text-red-400',
  };
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold capitalize ${
        map[status] ?? 'bg-surface-hover text-content-soft'
      }`}
    >
      {status}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="text-content-muted text-center py-12">{message}</p>;
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-3 mb-4">
      <p className="text-red-400 text-sm">{message}</p>
    </div>
  );
}
