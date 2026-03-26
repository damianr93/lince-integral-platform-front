import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, ChevronRight, Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchCampaigns,
  fetchTemplates,
  fetchFilterOptions,
  createCampaign,
  executeCampaign,
  deleteCampaign,
} from '@/store/marketing/campaignsSlice';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { ExecuteConfirmModal } from './ExecuteConfirmModal';
import { SendSingleModal } from './SendSingleModal';
import type { Campaign, YCloudTemplate, CreateCampaignPayload } from '@/types/marketing.types';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  QUEUED: 'En cola',
  RUNNING: 'Ejecutando',
  COMPLETED: 'Completada',
  FAILED: 'Fallida',
};

const STATUS_CLASSES: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  QUEUED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  RUNNING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const ADVISORS = ['EZEQUIEL', 'DENIS', 'MARTIN'];
const ESTADOS = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'NO_CONTESTO', label: 'No contestó' },
  { value: 'SE_COTIZO_Y_PENDIENTE', label: 'Cotizado pendiente' },
  { value: 'SE_COTIZO_Y_NO_INTERESO', label: 'No interesó' },
  { value: 'COMPRO', label: 'Compró' },
  { value: 'DERIVADO_A_DISTRIBUIDOR', label: 'Derivado a distribuidor' },
];

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[status] ?? 'bg-muted text-muted-foreground'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// ─── Wizard de nueva campaña ─────────────────────────────────────────────────

interface WizardProps {
  templates: YCloudTemplate[];
  loadingTemplates: boolean;
  productos: string[];
  submitting: boolean;
  onSubmit: (payload: CreateCampaignPayload) => void;
  onClose: () => void;
}

function NewCampaignWizard({ templates, loadingTemplates, productos, submitting, onSubmit, onClose }: WizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<YCloudTemplate | null>(null);
  const [filterAdvisors, setFilterAdvisors] = useState<string[]>([]);
  const [filterEstados, setFilterEstados] = useState<string[]>([]);
  const [filterProductos, setFilterProductos] = useState<string[]>([]);

  const inputClass =
    'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  function toggleAdvisor(a: string) {
    setFilterAdvisors((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );
  }

  function toggleEstado(e: string) {
    setFilterEstados((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
    );
  }

  function toggleProducto(p: string) {
    setFilterProductos((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  function handleSubmit() {
    if (!name.trim() || !selectedTemplate) return;
    onSubmit({
      name: name.trim(),
      templateName: selectedTemplate.name,
      templateLanguage: selectedTemplate.language,
      recipientFilter: {
        siguiendo: filterAdvisors.length > 0 ? filterAdvisors : undefined,
        estado: filterEstados.length > 0 ? filterEstados : undefined,
        producto: filterProductos.length > 0 ? filterProductos : undefined,
      },
    });
  }

  const canGoToStep2 = name.trim().length > 0 && selectedTemplate !== null;
  const canSubmit = canGoToStep2;

  return (
    <Dialog open onClose={onClose} title="Nueva campaña">
      {/* Indicador de pasos */}
      <div className="flex items-center gap-2 mb-6">
        {([1, 2, 3] as const).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={[
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                step === s
                  ? 'bg-primary text-primary-foreground'
                  : step > s
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground',
              ].join(' ')}
            >
              {s}
            </div>
            {s < 3 && <div className={`h-px w-8 ${step > s ? 'bg-primary/40' : 'bg-border'}`} />}
          </div>
        ))}
        <span className="text-xs text-muted-foreground ml-2">
          {step === 1 ? 'Plantilla' : step === 2 ? 'Destinatarios' : 'Confirmar'}
        </span>
      </div>

      {/* Paso 1 — Nombre + plantilla */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Nombre de la campaña
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Campaña reactivación mayo"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Plantilla aprobada en YCloud
            </label>
            {loadingTemplates ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse bg-muted rounded-md" />
                ))}
              </div>
            ) : templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay plantillas aprobadas en YCloud.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplate(t)}
                    className={[
                      'w-full text-left rounded-md border p-3 transition-colors',
                      selectedTemplate?.id === t.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{t.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{t.language} · {t.category}</span>
                    </div>
                    {t.content && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{t.content}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button size="sm" disabled={!canGoToStep2} onClick={() => setStep(2)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Paso 2 — Filtros de destinatarios */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Filtrá los destinatarios. Si no seleccionás nada, se incluyen todos los clientes con teléfono y asesor configurado.
          </p>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Asesores</label>
            <div className="flex flex-wrap gap-2">
              {ADVISORS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAdvisor(a)}
                  className={[
                    'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                    filterAdvisors.includes(a)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50',
                  ].join(' ')}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Estado del cliente</label>
            <div className="flex flex-wrap gap-2">
              {ESTADOS.map((e) => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => toggleEstado(e.value)}
                  className={[
                    'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                    filterEstados.includes(e.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50',
                  ].join(' ')}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {productos.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Producto consultado</label>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                {productos.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleProducto(p)}
                    className={[
                      'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                      filterProductos.includes(p)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50',
                    ].join(' ')}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setStep(1)}>Atrás</Button>
            <Button size="sm" onClick={() => setStep(3)}>Siguiente</Button>
          </div>
        </div>
      )}

      {/* Paso 3 — Revisión y confirmación */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium text-foreground">{name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plantilla</span>
              <span className="font-medium text-foreground">{selectedTemplate?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Idioma</span>
              <span className="font-medium text-foreground">{selectedTemplate?.language}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Asesores</span>
              <span className="font-medium text-foreground">
                {filterAdvisors.length > 0 ? filterAdvisors.join(', ') : 'Todos'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estados</span>
              <span className="font-medium text-foreground text-right max-w-[200px]">
                {filterEstados.length > 0
                  ? filterEstados.map((e) => ESTADOS.find((x) => x.value === e)?.label ?? e).join(', ')
                  : 'Todos'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Productos</span>
              <span className="font-medium text-foreground text-right max-w-[200px]">
                {filterProductos.length > 0 ? filterProductos.join(', ') : 'Todos'}
              </span>
            </div>
          </div>

          {selectedTemplate?.content && (
            <div className="rounded-md border border-border p-3">
              <p className="text-xs text-muted-foreground mb-1">Vista previa del mensaje</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{selectedTemplate.content}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            La campaña se creará como borrador. Podrás ejecutarla desde el panel de campañas.
          </p>

          <div className="flex justify-between gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setStep(2)}>Atrás</Button>
            <Button size="sm" loading={submitting} disabled={!canSubmit} onClick={handleSubmit}>
              Crear campaña
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

export function CampaignsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { campaigns, templates, filterOptions, loadingCampaigns, loadingTemplates, submitting } =
    useAppSelector((s) => s.marketing);

  const [showWizard, setShowWizard] = useState(false);
  const [showSendSingle, setShowSendSingle] = useState(false);
  const [confirmCampaign, setConfirmCampaign] = useState<Campaign | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(fetchCampaigns());
  }, [dispatch]);

  useEffect(() => {
    if ((showWizard || showSendSingle) && templates.length === 0) {
      void dispatch(fetchTemplates());
    }
    if (showWizard && filterOptions.productos.length === 0) {
      void dispatch(fetchFilterOptions());
    }
  }, [dispatch, showWizard, showSendSingle, templates.length, filterOptions.productos.length]);

  async function handleCreate(payload: CreateCampaignPayload) {
    try {
      const result = await dispatch(createCampaign(payload)).unwrap();
      toast.success('Campaña creada');
      setShowWizard(false);
      navigate(`/marketing/campaigns/${result.id}`);
    } catch {
      toast.error('Error al crear la campaña');
    }
  }

  async function handleExecute() {
    if (!confirmCampaign) return;
    const id = confirmCampaign.id;
    setExecutingId(id);
    try {
      await dispatch(executeCampaign(id)).unwrap();
      toast.success('Campaña iniciada');
      setConfirmCampaign(null);
      navigate(`/marketing/campaigns/${id}`);
    } catch {
      toast.error('Error al ejecutar la campaña');
    } finally {
      setExecutingId(null);
    }
  }

  async function handleDelete(campaign: Campaign) {
    if (!window.confirm(`¿Eliminar la campaña "${campaign.name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(campaign.id);
    try {
      await dispatch(deleteCampaign(campaign.id)).unwrap();
      toast.success('Campaña eliminada');
    } catch {
      toast.error('Error al eliminar la campaña');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-foreground">Campañas</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSendSingle(true)}>
            <Send className="h-4 w-4 mr-1.5" />
            Envío rápido
          </Button>
          <Button size="sm" onClick={() => setShowWizard(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva campaña
          </Button>
        </div>
      </div>

      {/* KPIs */}
      {!loadingCampaigns && campaigns.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: campaigns.length },
            { label: 'Ejecutando', value: campaigns.filter((c) => c.status === 'RUNNING').length },
            { label: 'Completadas', value: campaigns.filter((c) => c.status === 'COMPLETED').length },
            {
              label: 'Enviados (total)',
              value: campaigns.reduce((acc, c) => acc + c.sentCount, 0),
            },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{kpi.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Lista */}
      {loadingCampaigns ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse bg-muted rounded-lg" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center">
          <p className="text-sm text-muted-foreground mb-3">No hay campañas todavía.</p>
          <Button size="sm" onClick={() => setShowWizard(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Crear primera campaña
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Plantilla</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Estado</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Enviados</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Fallidos</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Creada</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/marketing/campaigns/${c.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.templateName}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-right text-foreground hidden sm:table-cell">{c.sentCount}</td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      {c.failedCount > 0 ? (
                        <span className="text-destructive">{c.failedCount}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {c.status === 'DRAFT' && (
                          <>
                            <button
                              disabled={executingId === c.id}
                              onClick={() => setConfirmCampaign(c)}
                              className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
                            >
                              <Play className="h-3 w-3" />
                              <span className="hidden sm:inline">Ejecutar</span>
                            </button>
                            <button
                              disabled={deletingId === c.id}
                              onClick={() => void handleDelete(c)}
                              className="p-1 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                              title="Eliminar borrador"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => navigate(`/marketing/campaigns/${c.id}`)}
                          className="p-1 rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showWizard && (
        <NewCampaignWizard
          templates={templates}
          loadingTemplates={loadingTemplates}
          productos={filterOptions.productos}
          submitting={submitting}
          onSubmit={(p) => void handleCreate(p)}
          onClose={() => setShowWizard(false)}
        />
      )}

      {confirmCampaign && (
        <ExecuteConfirmModal
          campaign={confirmCampaign}
          submitting={submitting}
          onConfirm={() => void handleExecute()}
          onClose={() => setConfirmCampaign(null)}
        />
      )}

      {showSendSingle && (
        <SendSingleModal
          templates={templates}
          loadingTemplates={loadingTemplates}
          onClose={() => setShowSendSingle(false)}
        />
      )}
    </div>
  );
}
