import { httpClient } from './httpClient';
import {
  LoginCredentials,
  LoginResponse,
  TwoFactorData,
  TwoFactorResponse,
  User
} from '../types';

class AuthService {
  // Login
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return httpClient.post<LoginResponse>('/api/v1/auth/login', credentials);
  }

  // Verificar 2FA
  async verify2FA(data: TwoFactorData): Promise<TwoFactorResponse> {
    return httpClient.post<TwoFactorResponse>('/api/v1/auth/verify-2fa', data);
  }

  // Renovar token
  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    return httpClient.post<LoginResponse>('/api/v1/auth/refresh', {
      refresh_token: refreshToken
    });
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await httpClient.post('/api/v1/auth/logout');
    } catch (error) {
      // Ignorar erros de logout (token pode já estar inválido)
      console.warn('Erro ao fazer logout:', error);
    }
  }

  // Obter usuário atual
  async getCurrentUser(): Promise<User> {
    return httpClient.get<User>('/api/v1/auth/me');
  }

  // Recuperar senha
  async resetPassword(email: string): Promise<void> {
    return httpClient.post('/api/v1/auth/reset-password', { email });
  }

  // Confirmar recuperação de senha
  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    return httpClient.post('/api/v1/auth/confirm-reset-password', {
      token,
      new_password: newPassword
    });
  }

  // Alterar senha
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return httpClient.post('/api/v1/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
  }

  // Habilitar 2FA
  async enable2FA(): Promise<{ qr_code: string; secret: string }> {
    return httpClient.post('/api/v1/auth/enable-2fa');
  }

  // Confirmar habilitação do 2FA
  async confirm2FA(code: string): Promise<{ backup_codes: string[] }> {
    return httpClient.post('/api/v1/auth/confirm-2fa', { code });
  }

  // Desabilitar 2FA
  async disable2FA(code: string): Promise<void> {
    return httpClient.post('/api/v1/auth/disable-2fa', { code });
  }

  // Gerar novos códigos de backup
  async generateBackupCodes(): Promise<{ backup_codes: string[] }> {
    return httpClient.post('/api/v1/auth/generate-backup-codes');
  }

  // Verificar se email existe
  async checkEmailExists(email: string): Promise<{ exists: boolean }> {
    return httpClient.post('/api/v1/auth/check-email', { email });
  }

  // Validar token de recuperação
  async validateResetToken(token: string): Promise<{ valid: boolean }> {
    return httpClient.post('/api/v1/auth/validate-reset-token', { token });
  }
}

// Instância singleton
export const authService = new AuthService();