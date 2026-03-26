/**
 * Panel ADMINISTRATIVO — Carga y corrección de facturas
 * Maquetado — Pendiente de integración con backend OCR
 */

import { useState } from 'react';
import { Upload, FileText, Edit2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const MOCK_FACTURAS = [
  {
    id: '1', preview: 'Factura #5678', status: 'CON_ERRORES', date: '25/03/2026',
    fields: { numero: '5678', fecha: '2026-03-25', proveedor: 'Proveedor XYZ', monto: '', cuit: '20-12345678-9' },
    errors: ['Monto no detectado'],
  },
  {
    id: '2', preview: 'Factura #5677', status: 'VALIDO', date: '24/03/2026',
    fields: { numero: '5677', fecha: '2026-03-24', proveedor: 'Proveedor ABC', monto: '$45.200', cuit: '30-87654321-0' },
    errors: [],
  },
  {
    id: '3', preview: 'Factura #5676', status: 'APROBADO', date: '23/03/2026',
    fields: { numero: '5676', fecha: '2026-03-23', proveedor: 'Distribuidora LA', monto: '$12.500', cuit: '27-11111111-1' },
    errors: [],
  },
];

type Factura = typeof MOCK_FACTURAS[0];

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    VALIDO: { label: 'Válido', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle className="h-3 w-3" /> },
    CON_ERRORES: { label: 'Con errores', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <AlertTriangle className="h-3 w-3" /> },
    APROBADO: { label: 'Aprobado', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle className="h-3 w-3" /> },
    REVISION_PENDIENTE: { label: 'En revisión', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: <Clock className="h-3 w-3" /> },
    PROCESANDO: { label: 'Procesando', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <Clock className="h-3 w-3" /> },
  };
  const c = config[status] ?? config.PROCESANDO;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
      {c.icon} {c.label}
    </span>
  );
}

function DetailPanel({ factura, onClose }: { factura: Factura; onClose: () => void }) {
  const [fields, setFields] = useState(factura.fields);
  const canEdit = factura.status === 'CON_ERRORES' || factura.status === 'VALIDO';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-lg w-full max-w-xl shadow-xl my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{factura.preview}</h2>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Image placeholder */}
          <div className="bg-muted/40 rounded-lg h-40 flex items-center justify-center border border-border">
            <div className="text-center">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Imagen del documento</p>
              <p className="text-xs text-muted-foreground opacity-60">(S3 presigned URL)</p>
            </div>
          </div>

          {/* Error alerts */}
          {factura.errors.length > 0 && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
              <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Campos con errores OCR:</p>
              {factura.errors.map((e) => (
                <p key={e} className="text-xs text-red-600 dark:text-red-400">• {e}</p>
              ))}
            </div>
          )}

          {/* Editable fields */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campos extraídos por OCR</p>
            {Object.entries(fields).map(([key, value]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-foreground mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                <input
                  type="text"
                  value={value}
                  disabled={!canEdit}
                  onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
                  className={[
                    'w-full rounded-md border px-3 py-2 text-sm',
                    !value && factura.errors.length > 0
                      ? 'border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-700'
                      : 'border-border bg-background',
                    !canEdit ? 'opacity-60 cursor-not-allowed' : '',
                  ].join(' ')}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md text-muted-foreground hover:bg-accent">
            Cerrar
          </button>
          {canEdit && (
            <button className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2">
              <Edit2 className="h-3.5 w-3.5" />
              Guardar correcciones
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function OcrFacturasPage() {
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Mis Facturas</h1>
        <p className="text-sm text-muted-foreground mt-1">Cargá facturas y corregí los campos extraídos por OCR</p>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs">
          <Clock className="h-3.5 w-3.5" />
          Módulo en desarrollo — Datos de ejemplo
        </div>
      </div>

      {/* Upload area */}
      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-semibold text-foreground">Subir factura</p>
        <p className="text-xs text-muted-foreground mt-1">PDF o imagen · El sistema extrae los campos automáticamente con OCR</p>
        <button className="mt-4 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
          Seleccionar archivo
        </button>
      </div>

      {/* Facturas list */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Facturas cargadas</h2>
          <p className="text-xs text-muted-foreground">{MOCK_FACTURAS.length} facturas</p>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[400px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Factura</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Estado OCR</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Fecha</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Monto</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {MOCK_FACTURAS.map((f) => (
              <tr key={f.id} className="hover:bg-muted/50">
                <td className="px-4 py-2.5 font-medium text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {f.preview}
                </td>
                <td className="px-4 py-2.5"><StatusBadge status={f.status} /></td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{f.date}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{f.fields.monto || '—'}</td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => setSelectedFactura(f)}
                    className="px-2 py-1 text-xs rounded bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1"
                  >
                    {f.status === 'CON_ERRORES' ? <><Edit2 className="h-3 w-3" /> Corregir</> : 'Ver detalle'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">Nota sobre corrección</p>
        <p className="text-xs text-blue-600 dark:text-blue-400">
          Podés corregir campos mal extraídos en facturas con estado "Con errores". La aprobación final siempre la realiza el equipo ADMIN.
        </p>
      </div>

      {selectedFactura && (
        <DetailPanel factura={selectedFactura} onClose={() => setSelectedFactura(null)} />
      )}
    </div>
  );
}
