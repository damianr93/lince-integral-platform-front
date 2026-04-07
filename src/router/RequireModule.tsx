import { Navigate, Outlet } from 'react-router-dom';
import { GlobalRole, ModuleKey } from '@/types';
import { useAppSelector } from '@/store';

interface RequireModuleProps {
  moduleKey: ModuleKey;
}

export function RequireModule({ moduleKey }: RequireModuleProps) {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return null;
  // SUPERADMIN accede a todo (igual que el backend)
  if (user.globalRole === GlobalRole.SUPERADMIN) return <Outlet />;
  const isTag = user.area?.toUpperCase() === 'TAG';
  if (isTag) {
    if (moduleKey === ModuleKey.OCR) return <Outlet />;
    return <Navigate to="/ocr/remitos" replace />;
  }
  if (moduleKey === ModuleKey.SOPORTE_IT) return <Outlet />;
  if (user.modules[moduleKey]?.enabled !== true) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
