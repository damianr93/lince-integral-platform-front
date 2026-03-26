import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/crm/analytics', label: 'Análisis' },
  { to: '/crm/clients', label: 'Clientes' },
  { to: '/crm/satisfaction', label: 'Satisfacción' },
];

export function CrmLayout() {
  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="border-b border-border bg-card">
        <nav className="flex gap-0 px-4">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                [
                  'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                ].join(' ')
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
