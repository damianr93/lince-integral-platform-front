import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { GlobalRole } from '@/types';
import { useAppSelector } from '@/store';
import { enabledToolNavEntries } from '@/modules/registry';

const ROLE_LABEL: Record<GlobalRole, string> = {
  [GlobalRole.SUPERADMIN]: 'Super Admin',
  [GlobalRole.ADMIN]: 'Admin',
  [GlobalRole.USER]: 'Usuario',
};

export function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return null;

  const shortcuts = enabledToolNavEntries(user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bienvenido, {user.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {ROLE_LABEL[user.globalRole]} · {user.email}
        </p>
      </div>

      {shortcuts.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Accesos rápidos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {shortcuts.map((entry) => {
              const perm = user.modules[entry.requiresModule];
              return (
                <Link
                  key={entry.key}
                  to={entry.path}
                  className="group flex items-center justify-between bg-card border border-border rounded-lg p-4 hover:border-primary/40 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <entry.Icon className="h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0 text-left">
                      <p className="font-medium text-foreground">{entry.label}</p>
                      <p className="text-xs text-muted-foreground truncate">Rol: {perm?.role ?? '—'}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-muted rounded-lg p-6 text-center text-muted-foreground text-sm">
          No tenés módulos habilitados. Contactá al administrador.
        </div>
      )}
    </div>
  );
}
