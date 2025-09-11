import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, AuthActions, LoginCredentials, TwoFactorData, User } from '../types';
import { authService } from '../services/authService';
import { tokenService } from '../services/tokenService';

// Tipos de ação do reducer
type AuthActionType =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_TOKENS'; payload: { token: string; refreshToken: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_2FA_REQUIRED'; payload: { required: boolean; tempToken?: string } }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// Estado inicial
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  requires2FA: false,
  tempToken: null
};

// Reducer
const authReducer = (state: AuthState, action: AuthActionType): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        requires2FA: false,
        tempToken: null
      };
    
    case 'SET_TOKENS':
      return {
        ...state,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case 'SET_2FA_REQUIRED':
      return {
        ...state,
        requires2FA: action.payload.required,
        tempToken: action.payload.tempToken || null,
        isLoading: false,
        error: null
      };
    
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false
      };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

// Context
const AuthContext = createContext<(AuthState & AuthActions) | null>(null);

// Provider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar token ao inicializar
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = tokenService.getAccessToken();
        const refreshToken = tokenService.getRefreshToken();
        
        if (token && refreshToken) {
          // Verificar se o token é válido
          const user = await authService.getCurrentUser();
          if (user) {
            dispatch({ type: 'SET_USER', payload: user });
            dispatch({ type: 'SET_TOKENS', payload: { token, refreshToken } });
          } else {
            // Token inválido, limpar
            tokenService.clearTokens();
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        tokenService.clearTokens();
        dispatch({ type: 'LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  // Ações
  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const response = await authService.login(credentials);
      
      if (response.requires_2fa && response.temp_token) {
        dispatch({
          type: 'SET_2FA_REQUIRED',
          payload: { required: true, tempToken: response.temp_token }
        });
      } else {
        // Login completo
        tokenService.setTokens(response.access_token, response.refresh_token);
        dispatch({ type: 'SET_USER', payload: response.user });
        dispatch({
          type: 'SET_TOKENS',
          payload: {
            token: response.access_token,
            refreshToken: response.refresh_token
          }
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Erro ao fazer login';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  const verify2FA = async (data: TwoFactorData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const response = await authService.verify2FA(data);
      
      tokenService.setTokens(response.access_token, response.refresh_token);
      dispatch({ type: 'SET_USER', payload: response.user });
      dispatch({
        type: 'SET_TOKENS',
        payload: {
          token: response.access_token,
          refreshToken: response.refresh_token
        }
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Código 2FA inválido';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  const logout = () => {
    tokenService.clearTokens();
    dispatch({ type: 'LOGOUT' });
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = tokenService.getRefreshToken();
      if (!refreshToken) {
        throw new Error('Refresh token não encontrado');
      }
      
      const response = await authService.refreshToken(refreshToken);
      
      tokenService.setTokens(response.access_token, response.refresh_token);
      dispatch({
        type: 'SET_TOKENS',
        payload: {
          token: response.access_token,
          refreshToken: response.refresh_token
        }
      });
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      logout();
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const resetPassword = async (email: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      await authService.resetPassword(email);
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Erro ao solicitar recuperação de senha';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  const value = {
    ...state,
    login,
    verify2FA,
    logout,
    refreshAccessToken,
    clearError,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};