'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface UserProfile {
  access_token: string;
  selectedRole: string;
  company_id?: number;
  user_id?: number;
  email: string;
  role: string;
  [key: string]: any;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
  profile: 'GESTOR' | 'VENDEDOR' | 'ANÚNCIOS';
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });
  const router = useRouter();

  // Carregar dados do usuário do localStorage na inicialização
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const userProfileString = localStorage.getItem('userProfile');
        
        if (userProfileString) {
          const userProfile = JSON.parse(userProfileString);
          setAuthState({
            user: userProfile,
            isAuthenticated: true,
            isLoading: false
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        // Limpar dados corrompidos
        localStorage.removeItem('userProfile');
        localStorage.removeItem('access_token');
        localStorage.removeItem('selectedRole');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    };

    loadUserFromStorage();
  }, []);

  // Função de login
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Preparar dados no formato application/x-www-form-urlencoded
      const formData = new URLSearchParams();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);

      const response = await api.post('/api/v1/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Criar objeto de perfil do usuário
      const userProfile: UserProfile = {
        access_token: response.data.access_token,
        selectedRole: credentials.profile,
        company_id: response.data.company_id || null,
        user_id: response.data.user_id || null,
        email: credentials.email,
        role: credentials.profile.toLowerCase(),
        ...response.data
      };

      // Salvar no localStorage
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('selectedRole', credentials.profile);

      // Atualizar estado
      setAuthState({
        user: userProfile,
        isAuthenticated: true,
        isLoading: false
      });

      // Redirecionamento baseado no perfil
      switch (credentials.profile) {
        case 'GESTOR':
          router.push('/gestor/dashboard');
          break;
        case 'VENDEDOR':
          router.push('/vendedor/dashboard');
          break;
        case 'ANÚNCIOS':
          router.push('/anuncios/dashboard');
          break;
        default:
          router.push('/gestor/dashboard');
      }

      return { success: true };
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      let errorMessage = 'Erro ao fazer login. Tente novamente.';
      
      if (error.response?.status === 404) {
        errorMessage = 'Serviço de autenticação não encontrado.';
      } else if (error.response?.status === 401) {
        errorMessage = 'E-mail ou senha incorretos.';
      } else if (error.response?.status === 422) {
        errorMessage = 'Dados inválidos. Verifique o formato do e-mail e senha.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      return { success: false, error: errorMessage };
    }
  }, [router]);

  // Função de logout
  const logout = useCallback(() => {
    // Limpar localStorage
    localStorage.removeItem('userProfile');
    localStorage.removeItem('access_token');
    localStorage.removeItem('selectedRole');

    // Atualizar estado
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });

    // Redirecionar para login
    router.push('/login');
  }, [router]);

  // Função para obter dados específicos do usuário
  const getUserData = useCallback((key?: keyof UserProfile) => {
    if (!authState.user) return null;
    return key ? authState.user[key] : authState.user;
  }, [authState.user]);

  // Função para verificar se o usuário tem um perfil específico
  const hasRole = useCallback((role: string) => {
    return authState.user?.selectedRole?.toLowerCase() === role.toLowerCase();
  }, [authState.user]);

  return {
    // Estado
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    
    // Funções
    login,
    logout,
    getUserData,
    hasRole,
    
    // Dados específicos para compatibilidade
    token: authState.user?.access_token,
    companyId: authState.user?.company_id,
    selectedRole: authState.user?.selectedRole,
    email: authState.user?.email
  };
};

export default useAuth;