import { NavLink, Outlet } from 'react-router-dom';
import { Camera, FileText, LayoutDashboard, Settings } from 'lucide-react';
import { useAppSelector } from '@/store';
import { GlobalRole } from '@/types';

export function OcrLayout() {
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.globalRole === GlobalRole.ADMIN || user?.globalRole === GlobalRole.SUPERADMIN;
  const isAdminOrAdministrativo = isAdmin || user?.modules?.ocr?.role === 'ADMINISTRATIVO';

  const navClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
    ].join(' ');

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-6 py-2 flex items-center gap-1">
        {isAdmin && (
          <NavLink to="/ocr" end className={navClass}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </NavLink>
        )}
        <NavLink to="/ocr/remitos" className={navClass}>
          <Camera className="h-4 w-4" />
          Remitos
        </NavLink>
        {isAdminOrAdministrativo && (
          <NavLink to="/ocr/facturas" className={navClass}>
            <FileText className="h-4 w-4" />
            Facturas
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/ocr/configuracion" className={navClass}>
            <Settings className="h-4 w-4" />
            Configuración
          </NavLink>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
