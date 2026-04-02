/**
 * Modal de detalle de documento OCR.
 * Muestra imagen/preview, campos extraídos, errores y acciones de aprobación.
 *
 * DEMO-OCR-MOCK: previewOnlyDocument + parseProductosJson + FIELD_LABELS — eliminar al quitar demo.
 */
import { useEffect, useMemo } from 'react';
import { FileText, AlertTriangle } from 'lucide-react';
import { useAppSelector } from '@/store';
import { DocumentStatus } from '@/types/ocr.types';
import type { OcrDocument } from '@/types/ocr.types';
import { StatusBadge } from './StatusBadge';

const FIELD_LABELS: Record<string, string> = {
  numero: 'Número',
  fecha: 'Fecha',
  proveedor: 'Proveedor',
  destinatario: 'Destinatario',
  total: 'Total',
  cuit: 'CUIT',
  neto: 'Neto gravado',
  iva: 'IVA',
  tipo: 'Tipo comprobante',
  observaciones: 'Observaciones',
  productos: 'Ítems / productos',
};

function parseProductosJson(raw: string): Array<Record<string, string | number>> | null {
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return null;
    return v as Array<Record<string, string | number>>;
  } catch {
    return null;
  }
}

interface Props {
  documentId: string;
  /** DEMO-OCR-MOCK: documento local sin fetch API */
  previewOnlyDocument?: OcrDocument | null;
  onClose:    () => void;
  onApprove:  (id: string) => void;
  onReject:   (id: string) => void;
  submitting: boolean;
}

const APPROVABLE = [
  DocumentStatus.VALIDO,
  DocumentStatus.REVISADO,
  DocumentStatus.REVISION_PENDIENTE,
  DocumentStatus.CON_ERRORES,
];

export function DocumentDetailModal({
  documentId,
  previewOnlyDocument,
  onClose,
  onApprove,
  onReject,
  submitting,
}: Props) {
  const current = useAppSelector((s) => s.ocrDocuments.current);
  const doc =
    previewOnlyDocument && previewOnlyDocument.id === documentId
      ? previewOnlyDocument
      : current?.id === documentId
        ? current
        : null;

  const productosRows = useMemo(() => {
    const raw = doc?.extractedData?.productos;
    if (!raw || typeof raw !== 'string') return null;
    return parseProductosJson(raw);
  }, [doc?.extractedData?.productos]);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-lg w-full max-w-xl shadow-xl my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">
              {doc ? `${doc.type} — ${doc.id.slice(0, 8)}…` : 'Cargando…'}
            </h2>
            {doc && <StatusBadge status={doc.status} />}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
        </div>

        {!doc ? (
          <div className="px-6 py-12 text-center text-muted-foreground text-sm">Cargando detalle…</div>
        ) : (
          <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Preview del documento */}
            {doc.viewUrl ? (
              doc.s3Key.endsWith('.pdf')
                ? (
                  <div className="bg-muted/40 rounded-lg h-40 flex items-center justify-center border border-border">
                    <a
                      href={doc.viewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-2"
                    >
                      <FileText className="h-5 w-5" />
                      Abrir PDF original
                    </a>
                  </div>
                ) : (
                  <img
                    src={doc.viewUrl}
                    alt="Documento original"
                    className="w-full rounded-lg border border-border object-contain max-h-60"
                  />
                )
            ) : (
              <div className="bg-muted/40 rounded-lg h-40 flex items-center justify-center border border-border">
                <p className="text-xs text-muted-foreground">Vista previa no disponible</p>
              </div>
            )}

            {/* Errores OCR */}
            {doc.validationErrors && doc.validationErrors.length > 0 && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">Errores de validación OCR</p>
                </div>
                {doc.validationErrors.map((e, i) => (
                  <p key={i} className="text-xs text-red-600 dark:text-red-400">• {e}</p>
                ))}
              </div>
            )}

            {/* Campos extraídos */}
            {doc.extractedData && Object.keys(doc.extractedData).length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Campos extraídos por OCR
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(doc.extractedData)
                    .filter(([key]) => key !== 'productos')
                    .map(([key, val]) => (
                      <div key={key} className="bg-muted/30 rounded p-2">
                        <p className="text-xs text-muted-foreground">
                          {FIELD_LABELS[key] ?? key}
                        </p>
                        <p className="text-sm text-foreground font-medium break-words">{val || '—'}</p>
                      </div>
                    ))}
                </div>
                {productosRows && productosRows.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {FIELD_LABELS.productos}
                    </p>
                    <div className="overflow-x-auto rounded-md border border-border">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border text-left">
                            <th className="px-2 py-1.5 font-medium">Código</th>
                            <th className="px-2 py-1.5 font-medium">Descripción</th>
                            <th className="px-2 py-1.5 font-medium text-right">Cant.</th>
                            <th className="px-2 py-1.5 font-medium">U.</th>
                            <th className="px-2 py-1.5 font-medium text-right">P. unit.</th>
                            <th className="px-2 py-1.5 font-medium text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {productosRows.map((row, i) => (
                            <tr key={i} className="hover:bg-muted/30">
                              <td className="px-2 py-1.5 font-mono">{String(row.codigo ?? '—')}</td>
                              <td className="px-2 py-1.5 max-w-[200px]">{String(row.descripcion ?? '—')}</td>
                              <td className="px-2 py-1.5 text-right">{String(row.cantidad ?? '—')}</td>
                              <td className="px-2 py-1.5">{String(row.u ?? '—')}</td>
                              <td className="px-2 py-1.5 text-right whitespace-nowrap">{String(row.precioUnit ?? '—')}</td>
                              <td className="px-2 py-1.5 text-right whitespace-nowrap">{String(row.subtotal ?? '—')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay campos extraídos</p>
            )}

            {/* Metadatos */}
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
              <p>Subido: {new Date(doc.createdAt).toLocaleString('es-AR')}</p>
              {doc.correctedAt && (
                <p>Corregido: {new Date(doc.correctedAt).toLocaleString('es-AR')}</p>
              )}
              {doc.approvedAt && (
                <p>{doc.status === DocumentStatus.RECHAZADO ? 'Rechazado' : 'Aprobado'}: {new Date(doc.approvedAt).toLocaleString('es-AR')}</p>
              )}
              {doc.rejectReason && (
                <p className="text-red-600 dark:text-red-400">Motivo rechazo: {doc.rejectReason}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md text-muted-foreground hover:bg-accent">
            Cerrar
          </button>
          {doc && APPROVABLE.includes(doc.status) && (
            <>
              <button
                onClick={() => onReject(doc.id)}
                disabled={submitting}
                className="px-4 py-2 text-sm rounded-md bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 disabled:opacity-50"
              >
                Rechazar
              </button>
              <button
                onClick={() => { onApprove(doc.id); onClose(); }}
                disabled={submitting}
                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Aprobar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
