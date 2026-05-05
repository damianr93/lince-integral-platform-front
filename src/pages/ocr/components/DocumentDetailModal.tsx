/**
 * Modal de detalle de documento OCR.
 * Muestra imagen/preview, campos extraídos, errores y acciones de aprobación.
 * ADMIN / SUPERADMIN pueden editar todos los campos directamente desde aquí.
 */
import { useEffect, useMemo, useState } from 'react';
import { FileText, AlertTriangle, Loader2, Maximize2, Pencil, X, Save } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateDocumentFields } from '@/store/ocr/documentsSlice';
import { DocumentStatus } from '@/types/ocr.types';
import { getDocumentViewUrl } from '@/api/ocr';
import { toast } from 'sonner';
import { StatusBadge } from './StatusBadge';
import { FilePreviewModal } from './FilePreviewModal';

const FIELD_LABELS: Record<string, string> = {
  // Factura
  numero:    'Número',
  fecha:     'Fecha',
  proveedor: 'Proveedor',
  cuit:      'CUIT',
  neto:      'Neto gravado',
  iva:       'IVA',
  total:     'Total',
  tipo:      'Tipo (A/B/C/M/E)',
  // Remito
  ptoVenta:               'Pto. de venta',
  nroRemito:              'Nro. remito',
  cliente:                'Cliente',
  cuitCliente:            'CUIT cliente',
  domicilioCliente:       'Domicilio cliente',
  lugarEntrega:           'Lugar de entrega',
  toneladas:              'Toneladas',
  producto:               'Producto',
  nroMercaderia:          'Nro. mercadería',
  firmado:                'Firmado',
  chofer:                 'Chofer',
  camion:                 'Camión',
  batea:                  'Batea',
  cuitTransportista:      'CUIT transportista',
  domicilioTransportista: 'Domicilio transportista',
  // Retención SI.CO.RE.
  cuitEmisor:   'CUIT Agente de Retención',
  tipoImpuesto: 'Tipo de impuesto',
  provincia:    'Provincia / jurisdicción IIBB',
  monto:        'Monto de la retención',
  // Genérico
  destinatario:  'Destinatario',
  observaciones: 'Observaciones',
  productos:     'Ítems / productos',
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
  onClose,
  onApprove,
  onReject,
  submitting,
}: Props) {
  const dispatch = useAppDispatch();
  const current  = useAppSelector((s) => s.ocrDocuments.current);
  const doc      = current?.id === documentId ? current : null;

  // viewUrl — pedida fresca al abrir el modal para no depender del estado
  const [viewUrl, setViewUrl]       = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Modo edición
  const [editing, setEditing]     = useState(false);
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    if (!documentId) return;
    if (current?.id === documentId && current.viewUrl) {
      setViewUrl(current.viewUrl);
      return;
    }
    setLoadingUrl(true);
    getDocumentViewUrl(documentId)
      .then(({ viewUrl: url }) => setViewUrl(url))
      .catch(() => setViewUrl(null))
      .finally(() => setLoadingUrl(false));
  }, [documentId, current?.viewUrl]);

  // Al entrar en modo edición, clonar los campos actuales
  const startEditing = () => {
    setEditFields({ ...(doc?.extractedData ?? {}) });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditFields({});
  };

  const handleSave = async () => {
    if (!doc) return;
    setSaving(true);
    const result = await dispatch(updateDocumentFields({ id: doc.id, fields: editFields }));
    setSaving(false);
    if (updateDocumentFields.fulfilled.match(result)) {
      toast.success('Campos actualizados');
      setEditing(false);
      setEditFields({});
    } else {
      toast.error(String(result.error?.message ?? 'Error al guardar'));
    }
  };

  const productosRows = useMemo(() => {
    const raw = doc?.extractedData?.productos;
    if (!raw || typeof raw !== 'string') return null;
    return parseProductosJson(raw);
  }, [doc?.extractedData?.productos]);

  // Escape cierra edición primero, luego el modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewOpen) return; // lo maneja FilePreviewModal
        if (editing) { cancelEditing(); return; }
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, previewOpen, editing]);

  // ── Sección de campos: modo lectura o edición ─────────────────────────────

  const extractedEntries = Object.entries(doc?.extractedData ?? {}).filter(
    ([key]) => key !== 'productos',
  );

  const renderFields = () => {
    if (!doc?.extractedData || Object.keys(doc.extractedData).length === 0) {
      return <p className="text-sm text-muted-foreground">No hay campos extraídos</p>;
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Campos extraídos por OCR
          </p>
          {!editing ? (
            <button
              onClick={startEditing}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded text-primary hover:bg-primary/10 transition-colors"
            >
              <Pencil className="h-3 w-3" />
              Editar
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={cancelEditing}
                disabled={saving}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                <X className="h-3 w-3" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <Save className="h-3 w-3" />}
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {extractedEntries.map(([key]) => (
            <div key={key} className="space-y-0.5">
              <p className="text-xs text-muted-foreground">
                {FIELD_LABELS[key] ?? key}
              </p>
              {editing ? (
                <input
                  type="text"
                  value={editFields[key] ?? ''}
                  onChange={(e) =>
                    setEditFields((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ) : (
                <p className="text-sm text-foreground font-medium break-words">
                  {doc.extractedData?.[key] || '—'}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Tabla de productos (solo lectura — estructura JSON compleja) */}
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
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-lg w-full max-w-xl shadow-xl my-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">
              {doc ? `${doc.type} — ${doc.id.slice(0, 8)}…` : 'Cargando…'}
            </h2>
            {doc && <StatusBadge status={doc.status} />}
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-muted-foreground hover:text-foreground text-lg leading-none disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {!doc ? (
          <div className="px-6 py-12 text-center text-muted-foreground text-sm">Cargando detalle…</div>
        ) : (
          <div className="px-6 py-4 space-y-4 max-h-[75vh] overflow-y-auto">

            {/* Preview */}
            {loadingUrl ? (
              <div className="bg-muted/40 rounded-lg h-40 flex items-center justify-center border border-border">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : viewUrl ? (
              doc.s3Key.endsWith('.pdf') ? (
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="w-full bg-muted/40 rounded-lg h-40 flex flex-col items-center justify-center border border-border hover:bg-muted/60 transition-colors gap-2 group"
                >
                  <FileText className="h-8 w-8 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
                    <Maximize2 className="h-3.5 w-3.5" /> Ver PDF
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="w-full rounded-lg border border-border overflow-hidden hover:opacity-90 transition-opacity relative group"
                >
                  <img
                    src={viewUrl}
                    alt="Documento original"
                    className="w-full object-contain max-h-60"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <div className="bg-black/60 rounded-full p-2">
                      <Maximize2 className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </button>
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
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">Campos con errores OCR</p>
                </div>
                {doc.validationErrors.map((e, i) => (
                  <p key={i} className="text-xs text-red-600 dark:text-red-400">• {e}</p>
                ))}
              </div>
            )}

            {/* Campos */}
            {renderFields()}

            {/* Metadatos */}
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
              <p>Subido: {new Date(doc.createdAt).toLocaleString('es-AR')}</p>
              {doc.correctedAt && (
                <p>Corregido: {new Date(doc.correctedAt).toLocaleString('es-AR')}</p>
              )}
              {doc.approvedAt && (
                <p>
                  {doc.status === DocumentStatus.RECHAZADO ? 'Rechazado' : 'Aprobado'}:{' '}
                  {new Date(doc.approvedAt).toLocaleString('es-AR')}
                </p>
              )}
              {doc.rejectReason && (
                <p className="text-red-600 dark:text-red-400">Motivo rechazo: {doc.rejectReason}</p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-md text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            Cerrar
          </button>
          {doc && APPROVABLE.includes(doc.status) && !editing && (
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

      {/* Visor a pantalla completa */}
      {previewOpen && viewUrl && (
        <FilePreviewModal
          url={viewUrl}
          isPdf={doc?.s3Key.endsWith('.pdf') ?? false}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}
