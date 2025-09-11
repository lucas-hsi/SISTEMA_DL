// Tipos de perfil de usuário
export enum UserRole {
  GESTOR = 'gestor',
  VENDEDOR = 'vendedor',
  ANUNCIOS = 'anuncios'
}

// Interface do usuário
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenant_id: string;
  is_active: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Dados de login
export interface LoginCredentials {
  email: string;
  password: string;
}

// Resposta de login
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
  requires_2fa?: boolean;
  temp_token?: string;
}

// Dados do 2FA
export interface TwoFactorData {
  temp_token: string;
  code: string;
}

// Resposta do 2FA
export interface TwoFactorResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// Estado de autenticação
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requires2FA: boolean;
  tempToken: string | null;
}

// Ações de autenticação
export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  verify2FA: (data: TwoFactorData) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  clearError: () => void;
  resetPassword: (email: string) => Promise<void>;
}

// Dados de recuperação de senha
export interface PasswordResetData {
  email: string;
  method: 'email' | 'whatsapp';
}

// Resposta de erro da API
export interface ApiError {
  detail: string;
  code?: string;
  field?: string;
}

// Configurações de tema
export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
}

// Cores por perfil
export const ROLE_COLORS = {
  [UserRole.GESTOR]: {
    primary: '#3B82F6', // Azul
    secondary: '#1E40AF',
    light: '#DBEAFE',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)'
  },
  [UserRole.VENDEDOR]: {
    primary: '#10B981', // Verde
    secondary: '#047857',
    light: '#D1FAE5',
    gradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)'
  },
  [UserRole.ANUNCIOS]: {
    primary: '#F59E0B', // Laranja
    secondary: '#D97706',
    light: '#FEF3C7',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
  }
};

// Rotas por perfil
export const ROLE_ROUTES = {
  [UserRole.GESTOR]: '/gestor/dashboard',
  [UserRole.VENDEDOR]: '/vendedor/dashboard',
  [UserRole.ANUNCIOS]: '/anuncios/dashboard'
};