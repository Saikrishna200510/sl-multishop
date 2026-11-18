import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  FileText,
  Users,
  Truck,
  Receipt,
  BarChart3,
  Settings,
  ShieldAlert
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const links = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/pos', label: t('nav.pos'), icon: ShoppingCart, highlight: true },
    { to: '/products', label: t('nav.products'), icon: Package },
    { to: '/inventory', label: t('nav.inventory'), icon: Layers },
    { to: '/invoices', label: t('nav.invoices'), icon: FileText },
    { to: '/customers', label: t('nav.customers'), icon: Users },
    { to: '/suppliers', label: t('nav.suppliers'), icon: Truck },
    { to: '/expenses', label: t('nav.expenses'), icon: Receipt },
    { to: '/reports', label: t('nav.reports'), icon: BarChart3 },
    { to: '/settings', label: t('nav.settings'), icon: Settings }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <nav className="flex-1 p-3 space-y-1">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600'
                    : item.highlight
                    ? 'bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Super Admin Section */}
        {user?.isSuperAdmin && (
          <div className="pt-4 mt-4 border-t border-slate-200">
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Platform Admin
            </div>
            <NavLink
              to="/super-admin"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 font-semibold border-l-4 border-purple-600'
                    : 'text-slate-600 hover:bg-purple-50 hover:text-purple-700'
                }`
              }
            >
              <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
              <span>{t('nav.superAdmin')}</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium text-slate-700">Database & RLS Active</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1">SL MultiShop v1.0.0</div>
      </div>
    </aside>
  );
};
