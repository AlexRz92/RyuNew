import { X } from 'lucide-react';
import { TrackOrder } from './TrackOrder';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrackOrderModal({ isOpen, onClose }: TrackOrderModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-bg-elevated border border-line rounded-xl w-full max-w-3xl my-8 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-line">
          <h2 className="text-2xl font-bold text-content">Rastrear Pedido</h2>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content transition-colors p-2 hover:bg-surface rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <TrackOrder />
        </div>
      </div>
    </div>
  );
}
