// Chaves para localStorage
const ACCESS_TOKEN_KEY = 'dl_access_token';
const REFRESH_TOKEN_KEY = 'dl_refresh_token';

export class TokenService {
  // Obter token de acesso
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  // Obter refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  // Definir tokens
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  // Limpar tokens
  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  // Verificar se o token está expirado
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Obter dados do payload do token
  getTokenPayload(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      return null;
    }
  }

  // Verificar se precisa renovar o token (expira em menos de 5 minutos)
  shouldRefreshToken(token: string): boolean {
    try {
      const payload = this.getTokenPayload(token);
      if (!payload) return true;
      
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - currentTime;
      
      // Renovar se expira em menos de 5 minutos (300 segundos)
      return timeUntilExpiry < 300;
    } catch (error) {
      return true;
    }
  }
}

// Instância singleton
export const tokenService = new TokenService();