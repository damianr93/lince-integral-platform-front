import { useState } from 'react';
import { X } from 'lucide-react';
import { downloadLocationReportPdf } from '@/api/crm';

interface ReportFiltersModalProps {
  onClose: () => void;
}

export function ReportFiltersModal({ onClose }: ReportFiltersModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [provincias, setProvincias] = useState('');
  const [paises, setPaises] = useState('');
  const [zonas, setZonas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setLoading(true);
    setError('');
    try {
      await downloadLocationReportPdf({ startDate, endDate, provincias, paises, zonas });
      onClose();
    } catch {
      setError('Error al descargar el PDF. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-lg w-full max-w-lg mx-4 shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Reporte PDF de Ubicaciones</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Fecha inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Fecha fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Provincias <span className="text-muted-foreground font-normal">(separadas por coma)</span>
            </label>
            <input
              type="text"
              value={provincias}
              onChange={(e) => setProvincias(e.target.value)}
              placeholder="Ej: Buenos Aires, Córdoba"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Países <span className="text-muted-foreground font-normal">(separados por coma)</span>
            </label>
            <input
              type="text"
              value={paises}
              onChange={(e) => setPaises(e.target.value)}
              placeholder="Ej: Argentina, Uruguay"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Zonas <span className="text-muted-foreground font-normal">(separadas por coma)</span>
            </label>
            <input
              type="text"
              value={zonas}
              onChange={(e) => setZonas(e.target.value)}
              placeholder="Ej: NOA, Pampeana"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={() => void handleDownload()}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Descargando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
