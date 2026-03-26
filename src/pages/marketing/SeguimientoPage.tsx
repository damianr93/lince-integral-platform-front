import { FollowUpEventsWidget } from '@/components/crm/FollowUpEventsWidget';

export function SeguimientoPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-lg font-semibold text-foreground">Seguimiento de clientes</h1>
      <FollowUpEventsWidget />
    </div>
  );
}
