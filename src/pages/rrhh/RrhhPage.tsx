import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Clock, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { asistenciaApi } from '@/api/asistencia';
import type { EmpleadoAsistencia, FichajeAsistencia, Planta } from '@/types';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

type EstadoOption = '' | '0' | '1';

interface RowDraft {
  estado: EstadoOption;
  empleadoId: string;
}

const AR_TZ = 'America/Argentina/Buenos_Aires';
const MS_8_HORAS = 8 * 60 * 60 * 1000;

const fmtFichajeTiempo = new Intl.DateTimeFormat('es-AR', {
  timeZone: AR_TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const fmtSoloHora = new Intl.DateTimeFormat('es-AR', {
  timeZone: AR_TZ,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function formatFichajeHora(iso: string): string {
  return fmtFichajeTiempo.format(new Date(iso));
}

function formatSoloHora(iso: string): string {
  return fmtSoloHora.format(new Date(iso));
}

function formatDuracion(ms: number): string {
  if (ms < 0) return '—';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min`;
  return '< 1 min';
}

function duracionTotalClass(totalMs: number, tieneIntervalosValidos: boolean): string {
  if (!tieneIntervalosValidos) {
    return 'bg-muted/40 text-muted-foreground';
  }
  if (totalMs >= MS_8_HORAS) {
    return 'bg-emerald-500/25 text-emerald-900 dark:text-emerald-100 font-semibold ring-1 ring-emerald-500/30';
  }
  return 'bg-red-500/25 text-red-900 dark:text-red-100 font-semibold ring-1 ring-red-500/30';
}

function todayYmdAr(): string {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: AR_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function tiempoYmdEnAr(iso: string): string {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: AR_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

function tiempoHmsEnAr(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: AR_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const g = (t: Intl.DateTimeFormatPartTypes) =>
    (parts.find((p) => p.type === t)?.value ?? '0').padStart(2, '0');
  return `${g('hour')}:${g('minute')}:${g('second')}`;
}

function arFechaYHoraToIso(fechaYmd: string, horaHms: string): string {
  const hms = horaHms.length === 5 ? `${horaHms}:00` : horaHms;
  const parsed = new Date(`${fechaYmd}T${hms}-03:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Fecha u hora inválida');
  }
  return parsed.toISOString();
}

function fichajeEmpleadoLabel(f: FichajeAsistencia): string {
  if (f.empleado) {
    return `${f.empleado.firstName} ${f.empleado.lastName}`;
  }
  return `PIN ${f.pin}`;
}

function addDaysYmdAr(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split('-').map((s) => parseInt(s, 10));
  const refUtc = Date.UTC(y, m - 1, d, 12, 0, 0);
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: AR_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(refUtc + delta * 86400000));
}

function formatDayHeading(dayKey: string): string {
  const [y, mo, da] = dayKey.split('-').map((s) => parseInt(s, 10));
  const refUtc = Date.UTC(y, mo - 1, da, 12, 0, 0);
  return new Date(refUtc).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: AR_TZ,
  });
}

function employeeKey(f: FichajeAsistencia): string {
  return f.empleadoId ? `id:${f.empleadoId}` : `pin:${f.pin}`;
}

interface EmployeeDayAgg {
  key: string;
  fichajes: FichajeAsistencia[];
  pairs: { entrada: FichajeAsistencia; salida: FichajeAsistencia; ms: number }[];
  orphanEntradas: FichajeAsistencia[];
  orphanSalidas: FichajeAsistencia[];
  totalMs: number;
}

function buildEmployeeDayAggregates(items: FichajeAsistencia[]): EmployeeDayAgg[] {
  const byEmp = new Map<string, FichajeAsistencia[]>();
  for (const r of items) {
    const k = employeeKey(r);
    const arr = byEmp.get(k) ?? [];
    arr.push(r);
    byEmp.set(k, arr);
  }

  const aggs: EmployeeDayAgg[] = [];

  for (const [key, evs] of byEmp) {
    const sorted = [...evs].sort(
      (a, b) => new Date(a.tiempo).getTime() - new Date(b.tiempo).getTime(),
    );
    const pairs: { entrada: FichajeAsistencia; salida: FichajeAsistencia; ms: number }[] = [];
    const orphanEntradas: FichajeAsistencia[] = [];
    const orphanSalidas: FichajeAsistencia[] = [];
    const openEntradas: FichajeAsistencia[] = [];

    for (const ev of sorted) {
      if (ev.estado === 0) {
        openEntradas.push(ev);
      } else {
        const salidaMs = new Date(ev.tiempo).getTime();
        while (
          openEntradas.length > 0 &&
          new Date(openEntradas[0].tiempo).getTime() >= salidaMs
        ) {
          orphanEntradas.push(openEntradas.shift()!);
        }
        const entrada = openEntradas.shift();
        if (entrada) {
          const ms = salidaMs - new Date(entrada.tiempo).getTime();
          if (ms >= 0) {
            pairs.push({ entrada, salida: ev, ms });
          } else {
            orphanSalidas.push(ev);
            openEntradas.unshift(entrada);
          }
        } else {
          orphanSalidas.push(ev);
        }
      }
    }
    orphanEntradas.push(...openEntradas);

    let totalMs = 0;
    for (const p of pairs) {
      totalMs += p.ms;
    }

    const fichajesMap = new Map<string, FichajeAsistencia>();
    for (const p of pairs) {
      fichajesMap.set(p.entrada.id, p.entrada);
      fichajesMap.set(p.salida.id, p.salida);
    }
    for (const f of orphanEntradas) fichajesMap.set(f.id, f);
    for (const f of orphanSalidas) fichajesMap.set(f.id, f);
    const fichajes = [...fichajesMap.values()].sort(
      (a, b) => new Date(a.tiempo).getTime() - new Date(b.tiempo).getTime(),
    );

    aggs.push({
      key,
      fichajes,
      pairs,
      orphanEntradas,
      orphanSalidas,
      totalMs,
    });
  }

  aggs.sort((a, b) => {
    const t = (x: EmployeeDayAgg) =>
      Math.max(...x.fichajes.map((f) => new Date(f.tiempo).getTime()), 0);
    return t(b) - t(a);
  });

  return aggs;
}

function employeeDisplayLabel(agg: EmployeeDayAgg): string {
  const withEmp = agg.fichajes.find((f) => f.empleado);
  if (withEmp?.empleado) {
    return `${withEmp.empleado.firstName} ${withEmp.empleado.lastName}`;
  }
  return 'Sin empleado asociado';
}

function plantasLabel(agg: EmployeeDayAgg): string {
  const set = new Set<string>();
  for (const f of agg.fichajes) {
    if (f.planta) set.add(f.planta);
  }
  if (set.size === 0) return '—';
  return [...set].join(', ');
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
  const [diaFecha, setDiaFecha] = useState(todayYmdAr);
  const [total, setTotal] = useState(0);
  const [pin, setPin] = useState('');
  const [nombre, setNombre] = useState('');
  const [estado, setEstado] = useState<EstadoOption>('');
  const [planta, setPlanta] = useState<'' | Planta>('');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());
  const [editHorariosOpen, setEditHorariosOpen] = useState(false);
  const [horarioEdits, setHorarioEdits] = useState<Record<string, { fecha: string; hora: string }>>(
    {},
  );
  const [savingHorarios, setSavingHorarios] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fichajesPage, empleadosData] = await Promise.all([
        asistenciaApi.getFichajes({
          fecha: diaFecha,
          pin: pin || undefined,
          nombre: nombre.trim() || undefined,
          estado,
          planta: planta || undefined,
        }),
        asistenciaApi.getEmpleados(planta || undefined),
      ]);
      setItems(fichajesPage.items);
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
  }, [diaFecha, estado, planta]);

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

  const itemsMismoDiaAr = useMemo(
    () => items.filter((f) => tiempoYmdEnAr(f.tiempo) === diaFecha),
    [items, diaFecha],
  );
  const registrosFueraDelDia = items.length - itemsMismoDiaAr.length;

  const aggregates = useMemo(
    () => buildEmployeeDayAggregates(itemsMismoDiaAr),
    [itemsMismoDiaAr],
  );

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

  const aplicarEmpleadoGrupo = async (agg: EmployeeDayAgg, empleadoId: string) => {
    const payload = empleadoId || undefined;
    try {
      await Promise.all(
        agg.fichajes.map((f) =>
          asistenciaApi.updateFichaje(f.id, { empleadoId: payload }),
        ),
      );
      toast.success('Empleado actualizado en todos los fichajes del día');
      await loadData();
      setDrafts((prev) => {
        const next = { ...prev };
        for (const f of agg.fichajes) delete next[f.id];
        return next;
      });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
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

  const unmatched = itemsMismoDiaAr.filter((f) => !f.empleadoId).length;
  const hoyYmd = todayYmdAr();
  const puedeDiaSiguiente = diaFecha < hoyYmd;

  const applySearch = () => {
    void loadData();
  };

  const openEditHorariosModal = () => {
    const next: Record<string, { fecha: string; hora: string }> = {};
    for (const f of itemsMismoDiaAr) {
      next[f.id] = {
        fecha: tiempoYmdEnAr(f.tiempo),
        hora: tiempoHmsEnAr(f.tiempo),
      };
    }
    setHorarioEdits(next);
    setEditHorariosOpen(true);
  };

  const saveHorariosModal = async () => {
    setSavingHorarios(true);
    try {
      const toPatch: { id: string; tiempo: string }[] = [];
      for (const f of itemsMismoDiaAr) {
        const ed = horarioEdits[f.id];
        if (!ed) continue;
        const newIso = arFechaYHoraToIso(ed.fecha, ed.hora);
        if (new Date(newIso).getTime() !== new Date(f.tiempo).getTime()) {
          toPatch.push({ id: f.id, tiempo: newIso });
        }
      }
      if (toPatch.length === 0) {
        toast.message('No hay cambios de horario para guardar');
        setEditHorariosOpen(false);
        return;
      }
      await Promise.all(
        toPatch.map((u) => asistenciaApi.updateFichaje(u.id, { tiempo: u.tiempo })),
      );
      toast.success(`${toPatch.length} horario(s) actualizado(s)`);
      setEditHorariosOpen(false);
      await loadData();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSavingHorarios(false);
    }
  };

  const fichajesModalSorted = useMemo(
    () =>
      [...itemsMismoDiaAr].sort(
        (a, b) => new Date(a.tiempo).getTime() - new Date(b.tiempo).getTime(),
      ),
    [itemsMismoDiaAr],
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">RRHH · Jornada del día</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reconcileUnmatched}
            disabled={reconciling}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent disabled:opacity-50"
          >
            {reconciling ? 'Reconciliando…' : 'Reconciliar sin empleado'}
          </button>
          <button
            type="button"
            onClick={syncVillaNueva}
            disabled={syncing}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent disabled:opacity-50"
          >
            {syncing ? 'Sincronizando…' : 'Sincronizar empleados Villa Nueva'}
          </button>
          <button
            type="button"
            onClick={openEditHorariosModal}
            disabled={loading || itemsMismoDiaAr.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent disabled:opacity-50"
          >
            <Clock className="h-3.5 w-3.5" />
            Editar horarios
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      <Dialog
        open={editHorariosOpen}
        onClose={() => !savingHorarios && setEditHorariosOpen(false)}
        title="Editar horarios de fichajes"
        description={`${formatDayHeading(diaFecha)} · hora en Argentina (−03:00). Se guardan solo las filas que cambien.`}
        panelClassName="max-w-3xl"
      >
        <div className="max-h-[min(70vh,520px)] overflow-y-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                  Persona
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-[5.5rem]">
                  Tipo
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                  Fecha
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                  Hora
                </th>
              </tr>
            </thead>
            <tbody>
              {fichajesModalSorted.map((f) => {
                const ed = horarioEdits[f.id] ?? {
                  fecha: tiempoYmdEnAr(f.tiempo),
                  hora: tiempoHmsEnAr(f.tiempo),
                };
                return (
                  <tr key={f.id} className="border-b border-border/80 last:border-0">
                    <td className="px-3 py-2 align-middle">
                      <span className="font-medium text-foreground leading-snug">
                        {fichajeEmpleadoLabel(f)}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-middle text-xs text-muted-foreground">
                      {f.estado === 0 ? 'Entrada' : 'Salida'}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <input
                        type="date"
                        value={ed.fecha}
                        onChange={(e) =>
                          setHorarioEdits((prev) => {
                            const cur = prev[f.id] ?? {
                              fecha: tiempoYmdEnAr(f.tiempo),
                              hora: tiempoHmsEnAr(f.tiempo),
                            };
                            return { ...prev, [f.id]: { ...cur, fecha: e.target.value } };
                          })
                        }
                        className="w-full min-w-[9.5rem] rounded-md border border-border bg-background px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <input
                        type="time"
                        step={1}
                        value={ed.hora}
                        onChange={(e) =>
                          setHorarioEdits((prev) => {
                            const cur = prev[f.id] ?? {
                              fecha: tiempoYmdEnAr(f.tiempo),
                              hora: tiempoHmsEnAr(f.tiempo),
                            };
                            return { ...prev, [f.id]: { ...cur, hora: e.target.value } };
                          })
                        }
                        className="w-full min-w-[7.5rem] rounded-md border border-border bg-background px-2 py-1 text-xs tabular-nums"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditHorariosOpen(false)}
            disabled={savingHorarios}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={() => void saveHorariosModal()} disabled={savingHorarios}>
            {savingHorarios ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </Dialog>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Registros del día</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{itemsMismoDiaAr.length}</p>
          {registrosFueraDelDia > 0 && (
            <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
              {total} recibidos · {registrosFueraDelDia} otro día AR
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sin empleado</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-600">{unmatched}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fecha (Argentina)</p>
          <p className="mt-1 text-base font-semibold capitalize leading-snug">{formatDayHeading(diaFecha)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap rounded-xl border border-border bg-card/50 p-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Día
          <input
            type="date"
            value={diaFecha}
            max={hoyYmd}
            onChange={(e) => setDiaFecha(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
          />
        </label>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN"
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm w-24"
        />
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre empleado"
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm min-w-[180px] flex-1 max-w-xs"
        />
        <button
          type="button"
          onClick={() => { applySearch(); }}
          className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background hover:bg-accent"
        >
          Buscar
        </button>
        <select
          value={estado}
          onChange={(e) => { setEstado(e.target.value as EstadoOption); }}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">Entrada y salida</option>
          <option value="0">Solo entradas</option>
          <option value="1">Solo salidas</option>
        </select>
        <select
          value={planta}
          onChange={(e) => { setPlanta(e.target.value as '' | Planta); }}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">Todas las plantas</option>
          <option value="villa_nueva">Villa Nueva</option>
          <option value="tucuman">Tucuman</option>
        </select>
      </div>

      {registrosFueraDelDia > 0 && (
        <p className="text-sm rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-950 dark:text-amber-100">
          {registrosFueraDelDia} registro(s) llegaron de la API con hora en otro día (Argentina) y no se mezclan en esta tabla. Revisá datos o el filtro en backend.
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        Por empleado se suman todos los tramos entrada → salida del día. El total en verde si acumula 8 h o más; en rojo si menos. Desplegá «Fichajes» para corregir estado o guardar.
      </p>

      <div className="rounded-xl border border-border overflow-hidden shadow-sm bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide w-[22%]">
                  Empleado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Tramos en planta
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide w-[12%]">
                  Planta
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide w-[20%]">
                  Total del día
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide w-[10%]">
                  Detalle
                </th>
              </tr>
            </thead>
            {aggregates.map((agg) => {
              const first = agg.fichajes[0];
              const options = first ? (empleadosByPin.get(first.pin) ?? empleados) : empleados;
              const draftMain = first ? draftFor(first) : { empleadoId: '', estado: '0' as EstadoOption };
              const tieneValidos = agg.pairs.length > 0;
              const expanded = expandedKeys.has(agg.key);

              return (
                <tbody key={agg.key} className="border-b border-border last:border-0">
                  <tr className="hover:bg-muted/20 align-top">
                    <td className="px-4 py-4">
                      <p className="font-medium text-foreground leading-snug">{employeeDisplayLabel(agg)}</p>
                      {first && (
                        <select
                          value={draftMain.empleadoId}
                          onChange={(e) => {
                            void aplicarEmpleadoGrupo(agg, e.target.value);
                          }}
                          className="mt-2 w-full max-w-[220px] rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                        >
                          <option value="">Sin asociar</option>
                          {options.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.firstName} {emp.lastName}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        {agg.pairs.map((p) => (
                          <div
                            key={`${p.entrada.id}-${p.salida.id}`}
                            className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-xs"
                          >
                            <span className="font-mono tabular-nums" title={formatFichajeHora(p.entrada.tiempo)}>
                              {formatSoloHora(p.entrada.tiempo)}
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-mono tabular-nums" title={formatFichajeHora(p.salida.tiempo)}>
                              {formatSoloHora(p.salida.tiempo)}
                            </span>
                            <span className="ml-auto font-medium tabular-nums text-foreground">
                              {formatDuracion(p.ms)}
                            </span>
                          </div>
                        ))}
                        {agg.orphanEntradas.map((f) => (
                          <div
                            key={f.id}
                            className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100"
                          >
                            Entrada sin salida emparejada ·{' '}
                            <span className="font-mono">{formatSoloHora(f.tiempo)}</span>
                          </div>
                        ))}
                        {agg.orphanSalidas.map((f) => (
                          <div
                            key={f.id}
                            className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100"
                          >
                            Salida sin entrada emparejada ·{' '}
                            <span className="font-mono">{formatSoloHora(f.tiempo)}</span>
                          </div>
                        ))}
                        {agg.pairs.length === 0 &&
                          agg.orphanEntradas.length === 0 &&
                          agg.orphanSalidas.length === 0 && (
                          <span className="text-muted-foreground text-xs">Sin movimientos</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground align-middle capitalize">
                      {plantasLabel(agg)}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div
                        className={`inline-flex flex-col rounded-lg px-4 py-3 text-center min-w-[8.5rem] ${duracionTotalClass(agg.totalMs, tieneValidos)}`}
                        title={
                          tieneValidos
                            ? `${(agg.totalMs / 3600000).toLocaleString('es-AR', { maximumFractionDigits: 2 })} h totales`
                            : 'Suma solo tramos entrada→salida válidos'
                        }
                      >
                        <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">
                          En planta
                        </span>
                        <span className="text-lg tabular-nums leading-tight mt-0.5">
                          {tieneValidos ? formatDuracion(agg.totalMs) : '—'}
                        </span>
                        {tieneValidos && (
                          <span className="text-[10px] opacity-70 mt-1">
                            {agg.totalMs >= MS_8_HORAS ? '≥ 8 h' : '< 8 h'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right align-middle">
                      <button
                        type="button"
                        onClick={() => toggleExpand(agg.key)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-accent"
                      >
                        Fichajes
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="bg-muted/15">
                      <td colSpan={5} className="px-4 py-3 border-t border-border/60">
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {agg.fichajes.map((f) => {
                            const d = draftFor(f);
                            return (
                              <div
                                key={f.id}
                                className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-2"
                              >
                                <span className="font-mono text-xs tabular-nums shrink-0">
                                  {formatSoloHora(f.tiempo)}
                                </span>
                                <select
                                  value={d.estado}
                                  onChange={(e) =>
                                    updateDraft(f.id, { estado: e.target.value as EstadoOption })
                                  }
                                  className="rounded-md border border-border bg-background px-2 py-1 text-xs flex-1 min-w-[5rem]"
                                >
                                  <option value="0">Entrada</option>
                                  <option value="1">Salida</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() => void saveRow(f)}
                                  disabled={savingId === f.id}
                                  className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-primary-foreground text-xs hover:bg-primary/90 disabled:opacity-50"
                                >
                                  <Save className="h-3 w-3" />
                                  Guardar
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
          </table>
        </div>
        {!loading && itemsMismoDiaAr.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No hay fichajes en este día con esos filtros.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between text-sm flex-wrap gap-3 pt-2">
        <p className="text-muted-foreground capitalize">{formatDayHeading(diaFecha)}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDiaFecha((d) => addDaysYmdAr(d, -1))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
            Día anterior
          </button>
          <button
            type="button"
            onClick={() => setDiaFecha((d) => addDaysYmdAr(d, 1))}
            disabled={!puedeDiaSiguiente}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-40"
          >
            Día siguiente
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
