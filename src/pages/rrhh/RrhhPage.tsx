import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { asistenciaApi } from '@/api/asistencia';
import type { EmpleadoAsistencia, FichajeAsistencia, Planta } from '@/types';

type EstadoOption = '' | '0' | '1';

interface RowDraft {
  estado: EstadoOption;
  empleadoId: string;
}

const VILLA_NUEVA_BASE: { pin: string; firstName: string; lastName: string }[] = [
  { pin: '3', firstName: 'Ramiro', lastName: 'Alaniz' },
  { pin: '11', firstName: 'Maria Celeste', lastName: 'Almada' },
  { pin: '7', firstName: 'Julieta', lastName: 'Calderon' },
  { pin: '21', firstName: 'Antonella Lucia', lastName: 'Corna' },
  { pin: '6', firstName: 'Dalia', lastName: 'Duriavichi' },
  { pin: '17', firstName: 'Ezequiel', lastName: 'Fassi' },
  { pin: '9', firstName: 'Gabriel', lastName: 'Fernandez' },
  { pin: '2', firstName: 'Leila', lastName: 'Gasull' },
  { pin: '10', firstName: 'Luis', lastName: 'Haedo' },
  { pin: '12', firstName: 'Luis', lastName: 'Lujan' },
  { pin: '15', firstName: 'Florencia', lastName: 'Micelli' },
  { pin: '1', firstName: 'Micaela', lastName: 'Negro' },
  { pin: '16', firstName: 'Omar', lastName: 'Paviglianti' },
  { pin: '14', firstName: 'Jose', lastName: 'Paz' },
  { pin: '5', firstName: 'Luciana', lastName: 'Rivera' },
  { pin: '19', firstName: 'Damian', lastName: 'Rodriguez' },
  { pin: '8', firstName: 'Simon', lastName: 'Santa' },
  { pin: '18', firstName: 'Juan Cruz', lastName: 'Sarmo Finelli' },
  { pin: '13', firstName: 'Pablo', lastName: 'Segura' },
  { pin: '20', firstName: 'Yoana Maricel', lastName: 'Serrano' },
  { pin: '4', firstName: 'Florencia', lastName: 'Vottero' },
];

export function RrhhPage() {
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [items, setItems] = useState<FichajeAsistencia[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoAsistencia[]>([]);
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pin, setPin] = useState('');
  const [estado, setEstado] = useState<EstadoOption>('');
  const [planta, setPlanta] = useState<'' | Planta>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [fichajesPage, empleadosData] = await Promise.all([
        asistenciaApi.getFichajes({
          page,
          limit: 20,
          pin: pin || undefined,
          estado,
          planta: planta || undefined,
        }),
        asistenciaApi.getEmpleados(planta || undefined),
      ]);
      setItems(fichajesPage.items);
      setPages(fichajesPage.pages);
      setTotal(fichajesPage.total);
      setEmpleados(empleadosData);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [page, estado, planta]);

  const onRefresh = async () => {
    await loadData();
  };

  const empleadosByPin = useMemo(() => {
    const map = new Map<string, EmpleadoAsistencia[]>();
    for (const emp of empleados) {
      const arr = map.get(emp.pin) ?? [];
      arr.push(emp);
      map.set(emp.pin, arr);
    }
    return map;
  }, [empleados]);

  const draftFor = (row: FichajeAsistencia): RowDraft => {
    const existing = drafts[row.id];
    if (existing) return existing;
    return {
      estado: String(row.estado) as EstadoOption,
      empleadoId: row.empleadoId ?? '',
    };
  };

  const updateDraft = (id: string, patch: Partial<RowDraft>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } as RowDraft }));
  };

  const saveRow = async (row: FichajeAsistencia) => {
    const draft = draftFor(row);
    setSavingId(row.id);
    try {
      await asistenciaApi.updateFichaje(row.id, {
        estado: Number(draft.estado) as 0 | 1,
        empleadoId: draft.empleadoId || undefined,
      });
      toast.success('Fichaje actualizado');
      await loadData();
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const syncVillaNueva = async () => {
    setSyncing(true);
    try {
      const freshEmpleados = await asistenciaApi.getEmpleados(undefined);
      const byPin = new Map(freshEmpleados.map((e) => [e.pin, e]));
      let created = 0;
      let skipped = 0;
      for (const base of VILLA_NUEVA_BASE) {
        if (byPin.has(base.pin)) { skipped++; continue; }
        try {
          await asistenciaApi.createEmpleado({
            firstName: base.firstName,
            lastName: base.lastName,
            pin: base.pin,
            planta: 'villa_nueva',
            activo: true,
          });
          created++;
        } catch {
          skipped++;
        }
      }
      toast.success(`Sync completado: ${created} nuevos, ${skipped} ya existían`);
      const result = await asistenciaApi.reconcileUnmatched(10000);
      if (result.matched > 0) toast.success(`${result.matched} fichajes asociados automáticamente`);
      await loadData();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const reconcileUnmatched = async () => {
    setReconciling(true);
    try {
      const result = await asistenciaApi.reconcileUnmatched(5000);
      toast.success(`Reconciliacion completa: ${result.matched}/${result.scanned} fichajes asociados`);
      await loadData();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setReconciling(false);
    }
  };

  const unmatched = items.filter((f) => !f.empleadoId).length;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-lg font-semibold text-foreground">RRHH · Fichajes del reloj</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={reconcileUnmatched}
            disabled={reconciling}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent disabled:opacity-50"
          >
            {reconciling ? 'Reconciliando…' : 'Reconciliar sin empleado'}
          </button>
          <button
            onClick={syncVillaNueva}
            disabled={syncing}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent disabled:opacity-50"
          >
            {syncing ? 'Sincronizando…' : 'Sincronizar empleados Villa Nueva'}
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase">Total</p>
          <p className="text-2xl font-semibold">{total}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase">Sin empleado asociado</p>
          <p className="text-2xl font-semibold text-amber-600">{unmatched}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase">Página</p>
          <p className="text-2xl font-semibold">{page}/{pages}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Filtrar por PIN"
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        />
        <button
          onClick={() => { setPage(1); void loadData(); }}
          className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent"
        >
          Buscar
        </button>
        <select
          value={estado}
          onChange={(e) => { setEstado(e.target.value as EstadoOption); setPage(1); }}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">Entrada y salida</option>
          <option value="0">Solo entradas</option>
          <option value="1">Solo salidas</option>
        </select>
        <select
          value={planta}
          onChange={(e) => { setPlanta(e.target.value as '' | Planta); setPage(1); }}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">Todas las plantas</option>
          <option value="villa_nueva">Villa Nueva</option>
          <option value="tucuman">Tucuman</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-2 text-left text-xs text-muted-foreground">Fecha/hora</th>
                <th className="px-3 py-2 text-left text-xs text-muted-foreground">PIN</th>
                <th className="px-3 py-2 text-left text-xs text-muted-foreground">Empleado</th>
                <th className="px-3 py-2 text-left text-xs text-muted-foreground">Estado</th>
                <th className="px-3 py-2 text-left text-xs text-muted-foreground">Planta</th>
                <th className="px-3 py-2 text-left text-xs text-muted-foreground">Dispositivo</th>
                <th className="px-3 py-2 text-right text-xs text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((row) => {
                const draft = draftFor(row);
                const options = empleadosByPin.get(row.pin) ?? empleados;
                return (
                  <tr key={row.id} className="hover:bg-muted/40">
                    <td className="px-3 py-2">{new Date(row.tiempo).toLocaleString('es-AR')}</td>
                    <td className="px-3 py-2 font-mono">{row.pin}</td>
                    <td className="px-3 py-2">
                      <select
                        value={draft.empleadoId}
                        onChange={(e) => updateDraft(row.id, { empleadoId: e.target.value })}
                        className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                      >
                        <option value="">Sin asociar</option>
                        {options.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={draft.estado}
                        onChange={(e) => updateDraft(row.id, { estado: e.target.value as EstadoOption })}
                        className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      >
                        <option value="0">Entrada</option>
                        <option value="1">Salida</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">{row.planta ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.deviceSn ?? '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => void saveRow(row)}
                        disabled={savingId === row.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Guardar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No hay fichajes con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">Página {page} de {pages}</p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded border border-border hover:bg-accent disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="p-1.5 rounded border border-border hover:bg-accent disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
