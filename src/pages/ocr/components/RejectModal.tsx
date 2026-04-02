import { useState } from 'react';

interface Props {
  documentId: string;
  onConfirm:  (reason?: string) => void;
  onClose:    () => void;
  submitting: boolean;
}

export function RejectModal({ onConfirm, onClose, submitting }: Props) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-sm shadow-xl">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Rechazar documento</h2>
        </div>
        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Indicá el motivo del rechazo (opcional — se notifica al usuario).
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Ej: Imagen borrosa, datos ilegibles…"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md text-muted-foreground hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(reason.trim() || undefined)}
            disabled={submitting}
            className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? 'Rechazando…' : 'Rechazar'}
          </button>
        </div>
      </div>
    </div>
  );
}
