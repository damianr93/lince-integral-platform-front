import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { conciliacionesApi } from '@/api/conciliaciones';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import type { ReconciliationRun } from '@/types/conciliaciones.types';

export function ConciliacionesDashboardPage() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState<ReconciliationRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    conciliacionesApi.listRuns()
      .then(setRuns)
      .catch(() => toast.error('No se pudieron cargar las conciliaciones'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e: React.MouseEvent, runId: string) => {
    e.stopPropagation();
    if (!confirm('¿Borrar esta conciliación? No se puede deshacer.')) return;
    try {
      await conciliacionesApi.deleteRun(runId);
      setRuns((prev) => prev.filter((r) => r.id !== runId));
      toast.success('Conciliación borrada');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al borrar');
    }
  };

  const thisMonth = runs.filter((r) => {
    const date = new Date(r.createdAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conciliaciones Bancarias</h1>
          <p className="text-muted-foreground">Gestiona tus conciliaciones bancarias</p>
        </div>
        <Button onClick={() => navigate('/conciliaciones/nueva')}>
          <Plus className="mr-2 h-4 w-4" />Nueva Conciliación
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Total Conciliaciones</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{runs.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Este Mes</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{thisMonth}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Última Actualización</CardTitle></CardHeader>
          <CardContent><div className="text-sm font-medium">{runs[0] ? new Date(runs[0].createdAt).toLocaleDateString() : '-'}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conciliaciones Recientes</CardTitle>
          <CardDescription>Historial de conciliaciones realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Cargando...</div>
          ) : runs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No hay conciliaciones aún. Crea una nueva para comenzar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead><TableHead>Fecha</TableHead><TableHead>Banco</TableHead>
                  <TableHead>Estado</TableHead><TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id} className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20" onClick={() => navigate(`/conciliaciones/run/${run.id}`)}>
                    <TableCell className="font-medium">{run.title || 'Sin título'}</TableCell>
                    <TableCell>{new Date(run.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{run.bankName || '-'}</TableCell>
                    <TableCell>
                      <Badge className={run.status === 'CLOSED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'}>
                        {run.status === 'CLOSED' ? 'Cerrada' : 'Abierta'}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/conciliaciones/run/${run.id}`); }}>Ver Detalle</Button>
                      {run.status === 'OPEN' && (
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={(e) => void handleDelete(e, run.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
