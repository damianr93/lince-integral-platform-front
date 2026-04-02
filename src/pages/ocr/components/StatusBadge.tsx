import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { DocumentStatus } from '@/types/ocr.types';

const CONFIG: Record<DocumentStatus, { label: string; className: string; icon: React.ReactNode }> = {
  PENDIENTE:          { label: 'Pendiente',    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',   icon: <Clock className="h-3 w-3" /> },
  PROCESANDO:         { label: 'Procesando',   className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',            icon: <Clock className="h-3 w-3 animate-spin" /> },
  VALIDO:             { label: 'Válido',        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',       icon: <CheckCircle className="h-3 w-3" /> },
  CON_ERRORES:        { label: 'Con errores',   className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',              icon: <AlertTriangle className="h-3 w-3" /> },
  REVISION_PENDIENTE: { label: 'En revisión',   className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',  icon: <Clock className="h-3 w-3" /> },
  REVISADO:           { label: 'Revisado',      className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',  icon: <CheckCircle className="h-3 w-3" /> },
  APROBADO:           { label: 'Aprobado',      className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',      icon: <CheckCircle className="h-3 w-3" /> },
  RECHAZADO:          { label: 'Rechazado',     className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',              icon: <XCircle className="h-3 w-3" /> },
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const c = CONFIG[status] ?? CONFIG.PROCESANDO;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
      {c.icon} {c.label}
    </span>
  );
}
