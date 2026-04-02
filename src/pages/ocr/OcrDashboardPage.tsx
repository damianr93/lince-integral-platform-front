/**
 * OcrDashboardPage — Vista unificada ADMIN / SUPERADMIN
 * Todos los documentos del sistema con filtros, aprobación y rechazo inline.
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  FileText, Camera, CheckCircle, Clock, AlertTriangle, XCircle,
  RefreshCw, ChevronLeft, ChevronRight, Trash2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchDocuments,
  approveDocument,
  rejectDocument,
  fetchDocument,
  deleteDocument,
  clearCurrent,
} from '@/store/ocr/documentsSlice';
import type { FilterDocumentsParams, OcrDocument } from '@/types/ocr.types';
import { DocumentStatus, DocumentType } from '@/types/ocr.types';
import { DocumentDetailModal } from './components/DocumentDetailModal';
import { RejectModal } from './components/RejectModal';
import { OcrDemoToolbar } from './components/OcrDemoToolbar';
import {
  OCR_DEMO_STORAGE_ADMIN,
  createDemoAdminDocuments,
  filterDemoDocuments,
  isOcrDemoDocumentId,
  paginateDemo,
} from './demo/ocrDemoMocks';

const STATUS_CONFIG: Record<DocumentStatus, { label: string; className: string; icon: React.ReactNode }> = {
  PENDIENTE:          { label: 'Pendiente',    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <Clock className="h-3 w-3" /> },
  PROCESANDO:         { label: 'Procesando',   className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',        icon: <Clock className="h-3 w-3" /> },
  VALIDO:             { label: 'Válido',        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',   icon: <CheckCircle className="h-3 w-3" /> },
  CON_ERRORES:        { label: 'Con errores',   className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',          icon: <AlertTriangle className="h-3 w-3" /> },
  REVISION_PENDIENTE: { label: 'En revisión',   className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: <Clock className="h-3 w-3" /> },
  REVISADO:           { label: 'Revisado',      className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: <CheckCircle className="h-3 w-3" /> },
  APROBADO:           { label: 'Aprobado',      className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',   icon: <CheckCircle className="h-3 w-3" /> },
  RECHAZADO:          { label: 'Rechazado',     className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',          icon: <XCircle className="h-3 w-3" /> },
};

const APPROVABLE = [
  DocumentStatus.VALIDO,
  DocumentStatus.REVISADO,
  DocumentStatus.REVISION_PENDIENTE,
  DocumentStatus.CON_ERRORES,
];

export function OcrDashboardPage() {
  const dispatch   = useAppDispatch();
  const { all, loading, submitting, error } = useAppSelector((s) => s.ocrDocuments);

  const [filters, setFilters]       = useState<FilterDocumentsParams>({ page: 1, limit: 20 });
  const [detailDoc, setDetailDoc]   = useState<OcrDocument | null>(null);
  const [rejectDoc, setRejectDoc]   = useState<OcrDocument | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);

  /* DEMO-OCR-MOCK */
  const [demoActive, setDemoActive] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem(OCR_DEMO_STORAGE_ADMIN) === '1',
  );
  const [demoDocs, setDemoDocs] = useState<OcrDocument[]>(() =>
    typeof localStorage !== 'undefined' && localStorage.getItem(OCR_DEMO_STORAGE_ADMIN) === '1'
      ? createDemoAdminDocuments()
      : [],
  );

  const setDemoMode = (on: boolean) => {
    if (on) {
      localStorage.setItem(OCR_DEMO_STORAGE_ADMIN, '1');
      setDemoDocs(createDemoAdminDocuments());
      setDemoActive(true);
    } else {
      localStorage.removeItem(OCR_DEMO_STORAGE_ADMIN);
      setDemoDocs([]);
      setDemoActive(false);
      dispatch(fetchDocuments(filters));
    }
  };

  useEffect(() => {
    if (demoActive) return;
    dispatch(fetchDocuments(filters));
  }, [dispatch, filters, demoActive]);

  const handleApprove = async (id: string) => {
    if (isOcrDemoDocumentId(id)) {
      const ts = new Date().toISOString();
      setDemoDocs((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, status: DocumentStatus.APROBADO, approvedAt: ts, rejectReason: null }
            : d,
        ),
      );
      toast.success('Documento aprobado (demo)');
      return;
    }
    const result = await dispatch(approveDocument(id));
    if (approveDocument.fulfilled.match(result)) {
      toast.success('Documento aprobado');
    } else {
      toast.error(String(result.error?.message ?? 'Error al aprobar'));
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    if (isOcrDemoDocumentId(id)) {
      const ts = new Date().toISOString();
      setDemoDocs((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, status: DocumentStatus.RECHAZADO, approvedAt: ts, rejectReason: reason ?? null }
            : d,
        ),
      );
      toast.success('Documento rechazado (demo)');
      setRejectDoc(null);
      return;
    }
    const result = await dispatch(rejectDocument({ id, reason }));
    if (rejectDocument.fulfilled.match(result)) {
      toast.success('Documento rechazado');
      setRejectDoc(null);
    } else {
      toast.error(String(result.error?.message ?? 'Error al rechazar'));
    }
  };

  const handleDelete = async (id: string) => {
    if (isOcrDemoDocumentId(id)) {
      setDemoDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success('Documento eliminado (demo)');
      setDeleteId(null);
      return;
    }
    const result = await dispatch(deleteDocument(id));
    if (deleteDocument.fulfilled.match(result)) {
      toast.success('Documento eliminado');
      setDeleteId(null);
    } else {
      toast.error(String(result.error?.message ?? 'Error al eliminar'));
    }
  };

  const openDetail = async (doc: OcrDocument) => {
    if (isOcrDemoDocumentId(doc.id)) {
      dispatch(clearCurrent());
    } else {
      await dispatch(fetchDocument(doc.id));
    }
    setDetailDoc(doc);
  };

  const demoFiltered = demoActive
    ? filterDemoDocuments(demoDocs, {
        type: filters.type,
        status: filters.status,
        dateFrom: filters.dateFrom,
      })
    : [];
  const demoPaged = demoActive
    ? paginateDemo(demoFiltered, filters.page ?? 1, filters.limit ?? 20)
    : null;

  const docs  = demoActive ? (demoPaged?.slice ?? []) : (all?.items ?? []);
  const total = demoActive ? (demoPaged?.total ?? 0) : (all?.total ?? 0);
  const page  = demoActive ? (filters.page ?? 1) : (all?.page ?? filters.page ?? 1);
  const pages = demoActive ? (demoPaged?.pages ?? 1) : (all?.pages ?? 1);
  const listLoading = demoActive ? false : loading;

  const pending  = docs.filter((d) => APPROVABLE.includes(d.status)).length;
  const approved = docs.filter((d) => d.status === DocumentStatus.APROBADO).length;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Gestión de Documentos — OCR</h1>
          <p className="text-sm text-muted-foreground mt-1">Vista unificada · REMITOS + FACTURAS</p>
        </div>
        <button
          onClick={() => (demoActive ? setDemoDocs(createDemoAdminDocuments()) : dispatch(fetchDocuments(filters)))}
          disabled={listLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${listLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* DEMO-OCR-MOCK */}
      <OcrDemoToolbar
        active={demoActive}
        onToggle={setDemoMode}
        contextLabel="Demo administración OCR"
      />

      {error && !demoActive && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total (página)</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{total}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Requieren atención</p>
          <p className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">{pending}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Aprobados (página)</p>
          <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{approved}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={filters.type ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, type: (e.target.value as DocumentType) || undefined, page: 1 }))}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos los tipos</option>
          <option value={DocumentType.REMITO}>Remitos</option>
          <option value={DocumentType.FACTURA}>Facturas</option>
        </select>
        <select
          value={filters.status ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value as DocumentStatus) || undefined, page: 1 }))}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <input
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined, page: 1 }))}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Tabla */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">ID</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Subido por</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Fecha</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {listLoading && docs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" /> Cargando...
                    </div>
                  </td>
                </tr>
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No hay documentos con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                docs.map((doc) => {
                  const st = STATUS_CONFIG[doc.status];
                  return (
                    <tr key={doc.id} className="hover:bg-muted/50">
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-1.5">
                          {doc.type === DocumentType.REMITO
                            ? <Camera className="h-4 w-4 text-muted-foreground" />
                            : <FileText className="h-4 w-4 text-muted-foreground" />}
                          <span className="text-xs font-medium text-muted-foreground">{doc.type}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">
                        {doc.id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.className}`}>
                          {st.icon} {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs font-mono">
                        {doc.uploadedBy.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">
                        {new Date(doc.createdAt).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openDetail(doc)}
                            className="px-2 py-1 text-xs rounded bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            Ver
                          </button>
                          {APPROVABLE.includes(doc.status) && (
                            <>
                              <button
                                onClick={() => handleApprove(doc.id)}
                                disabled={submitting}
                                className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 disabled:opacity-50"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => setRejectDoc(doc)}
                                disabled={submitting}
                                className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 disabled:opacity-50"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setDeleteId(doc.id)}
                            disabled={submitting}
                            title="Eliminar documento"
                            className="p-1 text-xs rounded text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Página {page} de {pages} · {total} documentos
          </p>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
              className="p-1.5 rounded border border-border hover:bg-accent disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={page >= pages}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
              className="p-1.5 rounded border border-border hover:bg-accent disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modales */}
      {detailDoc && (
        <DocumentDetailModal
          documentId={detailDoc.id}
          previewOnlyDocument={isOcrDemoDocumentId(detailDoc.id) ? detailDoc : null}
          onClose={() => setDetailDoc(null)}
          onApprove={handleApprove}
          onReject={(id) => { setDetailDoc(null); setRejectDoc(docs.find((d) => d.id === id) ?? demoDocs.find((d) => d.id === id) ?? null); }}
          submitting={submitting}
        />
      )}
      {rejectDoc && (
        <RejectModal
          documentId={rejectDoc.id}
          onConfirm={(reason) => handleReject(rejectDoc.id, reason)}
          onClose={() => setRejectDoc(null)}
          submitting={isOcrDemoDocumentId(rejectDoc.id) ? false : submitting}
        />
      )}

      {/* Confirmación de eliminación */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-semibold text-foreground mb-2">¿Eliminar documento?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Esta acción es irreversible. El documento y su archivo serán eliminados permanentemente.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                disabled={submitting}
                className="px-3 py-1.5 text-sm rounded border border-border hover:bg-accent disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={submitting}
                className="px-3 py-1.5 text-sm rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {submitting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
