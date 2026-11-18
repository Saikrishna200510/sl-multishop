import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from 'react-i18next';
import { Store, Globe, LogOut, ShieldCheck, User } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, activeShop, availableShops, switchShop, logout, language, setLanguage } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Active Store */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
          SL
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900 tracking-tight text-base">SL MultiShop</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
              SaaS POS
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">SL IT SOLUTIONS</div>
        </div>

        {/* Shop Switcher */}
        {activeShop && (
          <div className="hidden md:flex items-center ml-6 pl-6 border-l border-slate-200">
            <Store className="w-4 h-4 text-slate-500 mr-2" />
            {availableShops.length > 1 ? (
              <select
                className="text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                value={activeShop.id}
                onChange={(e) => switchShop(e.target.value)}
              >
                {availableShops.map((s) => {
                  const sId = s.id || s.shopId || '';
                  const sName = s.name || s.shopName || '';
                  return (
                    <option key={sId} value={sId}>
                      {sName} ({s.roleName || 'Member'})
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="text-sm font-semibold text-slate-800">
                {activeShop.name}
                <span className="ml-2 text-xs font-normal text-slate-500">
                  [{activeShop.roleName || activeShop.businessType}]
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Action Icons: Language Toggle, User Menu, Logout */}
      <div className="flex items-center space-x-3">
        {/* Bilingual Language Switcher */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'te' : 'en')}
          className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition"
          title="Switch Language (English / Telugu)"
        >
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
        </button>

        {/* User Info */}
        {user && (
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              {user.isSuperAdmin ? <ShieldCheck className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4" />}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-800">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-[10px] text-slate-500">
                {user.isSuperAdmin ? 'Super Administrator' : user.email}
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
              title={t('common.logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
