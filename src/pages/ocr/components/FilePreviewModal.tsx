/**
 * FilePreviewModal — visor de archivos a pantalla completa.
 * Soporta imágenes y PDFs (via <iframe>).
 * Se abre sobre el DocumentDetailModal (z-60).
 */
import { useEffect } from 'react';
import { X, FileText } from 'lucide-react';

interface Props {
  url:      string;
  isPdf:    boolean;
  onClose:  () => void;
}

export function FilePreviewModal({ url, isPdf, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black/90"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Barra superior */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 text-white/70 text-sm">
          <FileText className="h-4 w-4" />
          {isPdf ? 'Documento PDF' : 'Imagen del documento'}
        </div>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white p-1 rounded transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-hidden px-4 pb-4">
        {isPdf ? (
          <iframe
            src={url}
            className="w-full h-full rounded-lg border border-white/10"
            title="Vista previa del documento"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={url}
              alt="Documento original"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}
