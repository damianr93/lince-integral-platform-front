/**
 * Panel ADMIN — Vista unificada de todos los documentos (REMITOS + FACTURAS)
 * Maquetado — Pendiente de integración con backend OCR
 */

import { FileText, Camera, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';

const MOCK_DOCS = [
  { id: '1', type: 'REMITO', status: 'VALIDO', uploadedBy: 'OPERADOR_CAMPO', date: '2026-03-25', preview: 'Remito #1234' },
  { id: '2', type: 'FACTURA', status: 'CON_ERRORES', uploadedBy: 'ADMINISTRATIVO', date: '2026-03-25', preview: 'Factura #5678' },
  { id: '3', type: 'REMITO', status: 'PENDIENTE', uploadedBy: 'OPERADOR_CAMPO', date: '2026-03-24', preview: 'Remito #1233' },
  { id: '4', type: 'FACTURA', status: 'APROBADO', uploadedBy: 'ADMINISTRATIVO', date: '2026-03-24', preview: 'Factura #5677' },
  { id: '5', type: 'REMITO', status: 'REVISION_PENDIENTE', uploadedBy: 'OPERADOR_CAMPO', date: '2026-03-23', preview: 'Remito #1232' },
];

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  PENDIENTE: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <Clock className="h-3 w-3" /> },
  PROCESANDO: { label: 'Procesando', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <Clock className="h-3 w-3" /> },
  VALIDO: { label: 'Válido', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle className="h-3 w-3" /> },
  CON_ERRORES: { label: 'Con errores', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <AlertTriangle className="h-3 w-3" /> },
  REVISION_PENDIENTE: { label: 'En revisión', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: <Clock className="h-3 w-3" /> },
  REVISADO: { label: 'Revisado', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: <CheckCircle className="h-3 w-3" /> },
  APROBADO: { label: 'Aprobado', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle className="h-3 w-3" /> },
  RECHAZADO: { label: 'Rechazado', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle className="h-3 w-3" /> },
};

export function OcrDashboardPage() {
  const totalDocs = MOCK_DOCS.length;
  const pending = MOCK_DOCS.filter((d) => d.status === 'REVISION_PENDIENTE' || d.status === 'CON_ERRORES').length;
  const approved = MOCK_DOCS.filter((d) => d.status === 'APROBADO').length;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Gestión de Documentos — OCR</h1>
        <p className="text-sm text-muted-foreground mt-1">Vista unificada · REMITOS + FACTURAS</p>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs">
          <Clock className="h-3.5 w-3.5" />
          Módulo en desarrollo — Datos de ejemplo
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total documentos</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{totalDocs}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Pendientes de revisión</p>
          <p className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">{pending}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Aprobados hoy</p>
          <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{approved}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <select className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Todos los tipos</option>
          <option value="REMITO">Remitos</option>
          <option value="FACTURA">Facturas</option>
        </select>
        <select className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <input
          type="date"
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Desde"
        />
      </div>

      {/* Documents table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Tipo</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Descripción</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Estado</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Subido por</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Fecha</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {MOCK_DOCS.map((doc) => {
              const st = STATUS_CONFIG[doc.status];
              return (
                <tr key={doc.id} className="hover:bg-muted/50 cursor-pointer">
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-1.5">
                      {doc.type === 'REMITO' ? <Camera className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-xs font-medium text-muted-foreground">{doc.type}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-foreground font-medium">{doc.preview}</td>
                  <td className="px-4 py-2.5">
                    {st && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.className}`}>
                        {st.icon}
                        {st.label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{doc.uploadedBy}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{doc.date}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button className="px-2 py-1 text-xs rounded bg-primary/10 text-primary hover:bg-primary/20">Ver detalle</button>
                      {(doc.status === 'REVISION_PENDIENTE' || doc.status === 'CON_ERRORES') && (
                        <>
                          <button className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400">Aprobar</button>
                          <button className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400">Rechazar</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
