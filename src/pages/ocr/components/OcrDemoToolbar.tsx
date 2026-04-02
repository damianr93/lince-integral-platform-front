/**
 * DEMO-OCR-MOCK — Barra para activar/desactivar datos de demostración. Eliminar con ocrDemoMocks.ts.
 */

import { Sparkles, X } from 'lucide-react';

interface Props {
  active: boolean;
  onToggle: (next: boolean) => void;
  contextLabel: string;
}

export function OcrDemoToolbar({ active, onToggle, contextLabel }: Props) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30 px-3 py-2 flex flex-wrap items-center gap-2 text-sm">
      <Sparkles className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0" />
      <span className="text-amber-900 dark:text-amber-100 font-medium">{contextLabel}</span>
      <span className="text-amber-800/90 dark:text-amber-200/90 text-xs">
        Datos ficticios post-OCR para mostrar el flujo administrativo. No se guardan en el servidor.
      </span>
      <div className="flex items-center gap-2 ml-auto">
        {active ? (
          <button
            type="button"
            onClick={() => onToggle(false)}
            className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-amber-100/80 dark:border-amber-700 dark:hover:bg-amber-900/40"
          >
            <X className="h-3 w-3" />
            Salir de demo
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onToggle(true)}
            className="rounded-md bg-amber-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
          >
            Ver ejemplo post-OCR
          </button>
        )}
      </div>
    </div>
  );
}
