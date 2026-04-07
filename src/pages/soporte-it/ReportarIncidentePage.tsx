import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMisEquipos } from '@/store/soporte-it/equiposSlice';
import { createIncidente } from '@/store/soporte-it/incidentesSlice';
import type { UrgenciaIncidente, CreateIncidentePayload } from '@/types/soporte-it.types';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';

export function ReportarIncidentePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const equipos = useAppSelector((s) => s.equipos.items);

  const [form, setForm] = useState<CreateIncidentePayload>({
    equipoId: searchParams.get('equipoId') ?? '',
    descripcion: '',
    urgencia: 'media',
    aplicacionesAfectadas: '',
    accionesPrevias: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void dispatch(fetchMisEquipos());
  }, [dispatch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.equipoId) {
      toast.error('Seleccioná un equipo');
      return;
    }
    if (form.descripcion.trim().length < 10) {
      toast.error('La descripción debe tener al menos 10 caracteres');
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(createIncidente(form)).unwrap();
      toast.success('Incidente reportado. El equipo de IT lo revisará pronto.');
      navigate('/soporte-it/mis-incidentes');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold mb-6">Reportar un incidente</h1>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        <div>
          <Label>Equipo afectado *</Label>
          <Select
            value={form.equipoId}
            onChange={(e) => setForm((f) => ({ ...f, equipoId: e.target.value }))}
            required
          >
            <option value="">Seleccioná un equipo</option>
            {equipos.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.hostname ?? eq.modelo ?? eq.id}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label>Descripción del problema *</Label>
          <textarea
            className="w-full min-h-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
            required
            placeholder="Describí el problema con el mayor detalle posible: qué pasó, cuándo, qué estabas haciendo..."
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          />
        </div>

        <div>
          <Label>Urgencia percibida</Label>
          <Select
            value={form.urgencia}
            onChange={(e) =>
              setForm((f) => ({ ...f, urgencia: e.target.value as UrgenciaIncidente }))
            }
          >
            <option value="baja">Baja — No afecta mi trabajo</option>
            <option value="media">Media — Afecta parcialmente</option>
            <option value="alta">Alta — No puedo trabajar</option>
          </Select>
        </div>

        <div>
          <Label>Aplicaciones afectadas (opcional)</Label>
          <input
            type="text"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
            placeholder="Ej: Chrome, Excel, TeamViewer"
            value={form.aplicacionesAfectadas ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, aplicacionesAfectadas: e.target.value }))
            }
          />
        </div>

        <div>
          <Label>¿Ya hiciste algo al respecto? (opcional)</Label>
          <textarea
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
            placeholder="Ej: Reinicié el equipo, cerré y abrí la aplicación..."
            value={form.accionesPrevias ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, accionesPrevias: e.target.value }))
            }
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar reporte'}
          </Button>
        </div>
      </form>
    </div>
  );
}
