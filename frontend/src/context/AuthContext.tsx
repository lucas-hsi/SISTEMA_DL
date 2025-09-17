'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api, { login as apiLogin, logout as apiLogout } from '@/services/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  company_id: number;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  hasRole: (role: string) => boolean;
  companyId: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // ESTADOS
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // COMPUTED STATE
  const isAuthenticated = !!user;

  // FUNÇÕES ESTÁVEIS (useCallback)
  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    setUser(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await apiLogin(credentials.email, credentials.password);
      const { access_token, refresh_token, ...userData } = response;
      
      // Salvar tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      // IMPORTANTE: Salvar dados do usuário
      const userInfo = {
        id: userData.user_id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        company_id: userData.company_id
      };
      
      localStorage.setItem('user_data', JSON.stringify(userInfo));
      
      setUser(userInfo);
    } catch (error) {
      throw error;
    }
  }, []);

  const hasRole = useCallback((role: string): boolean => {
    return user?.role === role;
  }, [user?.role]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem('refresh_token');
      if (!refreshTokenValue) {
        logout();
        return false;
      }

      const response = await api.post('/refresh', { refresh_token: refreshTokenValue });
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      
      return true;
    } catch (error) {
      logout();
      return false;
    }
  }, [logout]);

  // HIDRATAÇÃO - EXECUTAR APENAS UMA VEZ (SEM CHAMADA API)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user_data');
        
        if (token && userData) {
          // Usar dados do localStorage sem chamar API
          const user = JSON.parse(userData);
          setUser(user);
          
          console.log('✅ Sessão recuperada:', user.email);
        } else {
          console.log('ℹ️ Nenhuma sessão para recuperar');
        }
      } catch (error) {
        console.error('❌ Erro ao recuperar sessão:', error);
        // Limpar dados corrompidos
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []); // IMPORTANTE: array vazio - executar só uma vez

  // AUTO-REFRESH (separado da hidratação)
  useEffect(() => {
    if (!isAuthenticated) return;

    const startAutoRefresh = () => {
      // Renovar a cada 1h45min
      timerRef.current = setTimeout(async () => {
        try {
          const refreshTokenValue = localStorage.getItem('refresh_token');
          if (refreshTokenValue) {
            const response = await api.post('/refresh', { refresh_token: refreshTokenValue });
            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('refresh_token', response.data.refresh_token);
          }
        } catch (error) {
          logout();
        }
      }, 6300000); // 1h45min
    };

    startAutoRefresh();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAuthenticated, logout]); // ← Dependências corretas

  // CONTEXT VALUE
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
    hasRole,
    companyId: user?.company_id || null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;