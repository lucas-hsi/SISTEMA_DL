import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { TokenService } from './tokenService';
import { ApiError } from '../types';

// Instância do serviço de tokens
const tokenService = new TokenService();

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class HttpClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Interceptador de requisição
    this.client.interceptors.request.use(
      (config) => {
        const token = tokenService.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptador de resposta
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Se o erro é 401 e não é uma tentativa de refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Se já está renovando, adicionar à fila
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = tokenService.getRefreshToken();
            if (!refreshToken) {
              throw new Error('Refresh token não encontrado');
            }

            // Tentar renovar o token
            const response = await this.client.post('/api/v1/auth/refresh', {
              refresh_token: refreshToken
            });

            const { access_token, refresh_token } = response.data;
            tokenService.setTokens(access_token, refresh_token);

            // Processar fila de requisições falhadas
            this.processQueue(null, access_token);

            // Repetir requisição original
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Falha ao renovar token, fazer logout
            this.processQueue(refreshError, null);
            tokenService.clearTokens();
            
            // Redirecionar para login
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  private handleError(error: any): ApiError {
    if (error.response) {
      // Erro da API
      return {
        detail: error.response.data?.detail || 'Erro do servidor',
        code: error.response.data?.code,
        field: error.response.data?.field
      };
    } else if (error.request) {
      // Erro de rede
      return {
        detail: 'Erro de conexão. Verifique sua internet.',
        code: 'NETWORK_ERROR'
      };
    } else {
      // Erro desconhecido
      return {
        detail: error.message || 'Erro desconhecido',
        code: 'UNKNOWN_ERROR'
      };
    }
  }

  // Métodos HTTP
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Upload de arquivos
  async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    const response = await this.client.post<T>(url, formData, config);
    return response.data;
  }
}

// Instância singleton
export const httpClient = new HttpClient();