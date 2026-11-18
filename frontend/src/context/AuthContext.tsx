import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';
import i18n from '../i18n.js';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin: boolean;
}

export interface Shop {
  id: string;
  name: string;
  shopId?: string;
  shopName?: string;
  slug?: string;
  businessType: string;
  roleName?: string;
  branchId?: string;
  branchName?: string;
}

interface AuthContextType {
  user: User | null;
  activeShop: Shop | null;
  availableShops: Shop[];
  isAuthenticated: boolean;
  isLoading: boolean;
  language: string;
  setLanguage: (lang: string) => void;
  login: (tokens: { accessToken: string; refreshToken: string }, user: User, shop?: Shop, available?: Shop[]) => void;
  logout: () => void;
  switchShop: (shopId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeShop, setActiveShop] = useState<Shop | null>(null);
  const [availableShops, setAvailableShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLangState] = useState(localStorage.getItem('sl_lang') || 'en');

  const setLanguage = (lang: string) => {
    localStorage.setItem('sl_lang', lang);
    i18n.changeLanguage(lang);
    setLangState(lang);
  };

  useEffect(() => {
    async function loadSession() {
      const token = localStorage.getItem('sl_access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get<any>('/auth/profile');
        if (res.data?.user) {
          setUser({
            id: res.data.user.id,
            email: res.data.user.email,
            firstName: res.data.user.first_name,
            lastName: res.data.user.last_name,
            isSuperAdmin: res.data.user.is_super_admin
          });

          if (res.data.activeShop) {
            setActiveShop({
              id: res.data.activeShop.id,
              name: res.data.activeShop.name,
              slug: res.data.activeShop.slug,
              businessType: res.data.activeShop.business_type,
              roleName: res.data.role?.name
            });
            localStorage.setItem('sl_active_shop_id', res.data.activeShop.id);
          }
        }
      } catch (err) {
        console.error('Session load failed:', err);
        localStorage.removeItem('sl_access_token');
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, []);

  const login = (
    tokens: { accessToken: string; refreshToken: string },
    userData: User,
    shop?: Shop,
    available: Shop[] = []
  ) => {
    localStorage.setItem('sl_access_token', tokens.accessToken);
    localStorage.setItem('sl_refresh_token', tokens.refreshToken);
    setUser(userData);

    if (shop) {
      setActiveShop(shop);
      localStorage.setItem('sl_active_shop_id', shop.id);
    }
    setAvailableShops(available);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('sl_refresh_token');
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    localStorage.removeItem('sl_access_token');
    localStorage.removeItem('sl_refresh_token');
    localStorage.removeItem('sl_active_shop_id');
    setUser(null);
    setActiveShop(null);
    setAvailableShops([]);
    window.location.href = '/login';
  };

  const switchShop = async (shopId: string) => {
    try {
      const res = await api.post<any>('/auth/switch-shop', { shopId });
      if (res.data?.accessToken) {
        localStorage.setItem('sl_access_token', res.data.accessToken);
        localStorage.setItem('sl_active_shop_id', res.data.activeShop.id);
        setActiveShop(res.data.activeShop);
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to switch shop:', err);
      alert('Could not switch shop. Please try again.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeShop,
        availableShops,
        isAuthenticated: !!user,
        isLoading,
        language,
        setLanguage,
        login,
        logout,
        switchShop
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
