import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchCampaign,
  fetchRecipients,
  executeCampaign,
  clearCurrentCampaign,
} from '@/store/marketing/campaignsSlice';
import { Button } from '@/components/ui/Button';
import { ExecuteConfirmModal } from './ExecuteConfirmModal';
import type { CampaignRecipient } from '@/types/marketing.types';

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

const REC_STATUS_CLASSES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  SENT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SKIPPED: 'bg-muted text-muted-foreground',
};

const REC_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  SENT: 'Enviado',
  FAILED: 'Fallido',
  SKIPPED: 'Omitido',
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentCampaign, recipients, loadingCurrent, loadingRecipients, submitting } =
    useAppSelector((s) => s.marketing);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    void dispatch(fetchCampaign(id));
    void dispatch(fetchRecipients(id));
    return () => { dispatch(clearCurrentCampaign()); };
  }, [dispatch, id]);

  async function handleExecute() {
    if (!id) return;
    try {
      await dispatch(executeCampaign(id)).unwrap();
      toast.success('Campaña iniciada');
      setShowConfirm(false);
      void dispatch(fetchRecipients(id));
    } catch {
      toast.error('Error al ejecutar la campaña');
    }
  }

  async function handleRefresh() {
    if (!id) return;
    void dispatch(fetchCampaign(id));
    void dispatch(fetchRecipients(id));
  }

  if (loadingCurrent || !currentCampaign) {
    return (
      <div className="p-4 sm:p-6">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const c = currentCampaign;
  const isRunning = c.status === 'RUNNING';
  const isCompleted = c.status === 'COMPLETED';

  // Agrupar recipients por estado para el resumen
  const byStatus = recipients.reduce<Record<string, CampaignRecipient[]>>((acc, r) => {
    acc[r.status] = acc[r.status] ?? [];
    acc[r.status].push(r);
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/marketing/campaigns')}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{c.name}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Plantilla: {c.templateName} · {c.templateLanguage}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[c.status] ?? ''}`}>
            {STATUS_LABELS[c.status] ?? c.status}
          </span>

          {(isRunning || isCompleted) && (
            <button
              onClick={() => void handleRefresh()}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              title="Actualizar"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}

          {c.status === 'DRAFT' && (
            <Button size="sm" onClick={() => setShowConfirm(true)}>
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Ejecutar
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: c.totalRecipients },
          { label: 'Enviados', value: c.sentCount, positive: true },
          { label: 'Fallidos', value: c.failedCount, negative: true },
          { label: 'Omitidos', value: c.skippedCount },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{kpi.label}</p>
            <p className={[
              'mt-1 text-2xl font-bold',
              kpi.positive && kpi.value > 0 ? 'text-green-600 dark:text-green-400' : '',
              kpi.negative && kpi.value > 0 ? 'text-destructive' : '',
              !kpi.positive && !kpi.negative ? 'text-foreground' : '',
            ].filter(Boolean).join(' ')}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Progreso */}
      {c.totalRecipients > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-foreground">Progreso</span>
            <span className="text-muted-foreground">{c.sentCount + c.failedCount + c.skippedCount} / {c.totalRecipients}</span>
          </div>
          <ProgressBar value={c.sentCount + c.failedCount + c.skippedCount} max={c.totalRecipients} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground pt-1">
            <span>Creada: {formatDate(c.createdAt)}</span>
            {c.startedAt && <span>Iniciada: {formatDate(c.startedAt)}</span>}
            {c.completedAt && <span>Completada: {formatDate(c.completedAt)}</span>}
            {c.pendingCount > 0 && (
              <span className="text-yellow-600 dark:text-yellow-400">{c.pendingCount} pendientes</span>
            )}
          </div>
        </div>
      )}

      {showConfirm && (
        <ExecuteConfirmModal
          campaign={c}
          submitting={submitting}
          onConfirm={() => void handleExecute()}
          onClose={() => setShowConfirm(false)}
        />
      )}

      {/* Informe de destinatarios */}
      {recipients.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">
              Destinatarios
              <span className="ml-2 text-muted-foreground font-normal">({recipients.length})</span>
            </h3>
            {/* Leyenda rápida de estados */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(byStatus).map(([status, list]) => (
                <span key={status} className={`px-2 py-0.5 rounded-full text-xs font-medium ${REC_STATUS_CLASSES[status] ?? ''}`}>
                  {REC_STATUS_LABELS[status] ?? status}: {list.length}
                </span>
              ))}
            </div>
          </div>

          {loadingRecipients ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse bg-muted rounded" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[540px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Teléfono</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Asesor</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Estado</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Detalle</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Enviado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recipients.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/50">
                      <td className="px-4 py-2.5 text-foreground">
                        {r.customerName || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{r.customerPhone}</td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{r.siguiendo}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${REC_STATUS_CLASSES[r.status] ?? ''}`}>
                          {REC_STATUS_LABELS[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground max-w-[200px] hidden md:table-cell">
                        {r.skipReason && (
                          <span className="text-xs">{r.skipReason}</span>
                        )}
                        {r.errorMessage && !r.skipReason && (
                          <span className="text-xs text-destructive" title={r.errorMessage}>
                            {r.errorMessage.length > 40 ? `${r.errorMessage.slice(0, 40)}…` : r.errorMessage}
                          </span>
                        )}
                        {r.yCloudMessageId && (
                          <span className="text-xs font-mono">{r.yCloudMessageId}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                        {r.sentAt ? formatDate(r.sentAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
