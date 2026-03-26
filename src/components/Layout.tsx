import { LogOut } from 'lucide-react';
import type { AuthUser } from '@/types';
import { DarkModeToggle } from './ui/DarkModeToggle';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  user: AuthUser;
  onLogout: () => void;
  children: React.ReactNode;
}

export function Layout({ user, onLogout, children }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-4 h-14 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight text-primary">Lince</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">Plataforma</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:block">{user.name}</span>
          <DarkModeToggle />
          <button
            onClick={onLogout}
            aria-label="Cerrar sesión"
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar user={user} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
