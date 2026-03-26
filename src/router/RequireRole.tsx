import { Navigate, Outlet } from 'react-router-dom';
import { GlobalRole } from '@/types';
import { useAppSelector } from '@/store';

interface RequireRoleProps {
  role: GlobalRole;
}

export function RequireRole({ role }: RequireRoleProps) {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return null;
  if (user.globalRole !== role) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
