import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { saveTokenExpiryTime, scheduleNextRefresh } from './tokenRefreshService';

// Tipos para sistema de notificações
type AuthErrorType = 'token_expired' | 'refresh_failed' | 'network_error' | 'unauthorized';

// Interface para sistema de notificações
interface NotificationSystem {
  showNotification: (notification: {
    type: string;
    title: string;
    message: string;
    duration?: number;
  }) => void;
}

// Variáveis globais para sistema de notificações (serão definidas pelo AuthErrorProvider)
let globalAuthErrorReporter: ((type: AuthErrorType, message: string) => void) | null = null;
let globalNotificationSystem: NotificationSystem | null = null;

// Função para registrar sistema de notificações
export const registerAuthErrorSystem = (errorReporter: (type: AuthErrorType, message: string) => void, notificationSystem: NotificationSystem) => {
  globalAuthErrorReporter = errorReporter;
  globalNotificationSystem = notificationSystem;
  console.log('📡 Sistema de notificações de autenticação registrado');
};

// Função para reportar erro de autenticação
const reportAuthError = (type: AuthErrorType, message: string) => {
  if (globalAuthErrorReporter) {
    globalAuthErrorReporter(type, message);
  } else {
    console.warn('⚠️ Sistema de notificações não registrado:', { type, message });
  }
};

// Função para mostrar notificação
const showNotification = (type: string, title: string, message: string, duration?: number) => {
  if (globalNotificationSystem) {
    globalNotificationSystem.showNotification({ type, title, message, duration });
  }
};

// Tipos para tokens
interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user_id: number;
  company_id: number;
  email: string;
  full_name: string;
  role: string;
}

interface RefreshTokenRequest {
  refresh_token: string;
}

// Configuração base da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Criar instância do Axios
const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variáveis para controle de renovação
let isRefreshing = false;
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 3;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: Error) => void;
}> = [];

// Função para processar fila de requisições pendentes
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  
  failedQueue = [];
};

// Função para renovar token
const refreshTokens = async (): Promise<string> => {
  const { refreshToken: storedRefreshToken } = getTokens();
  
  if (!storedRefreshToken) {
    throw new Error('Refresh token não encontrado');
  }
  
  try {
    console.log('🔄 Renovando token automaticamente...');
    
    const response = await axios.post<TokenResponse>(
      `${API_BASE_URL}/api/v1/refresh`,
      { refresh_token: storedRefreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const tokenData = response.data;
    saveTokens(tokenData);
    
    console.log('✅ Token renovado com sucesso');
    refreshAttempts = 0; // Reset contador de tentativas
    
    return tokenData.access_token;
  } catch (error) {
    console.error('❌ Erro ao renovar token:', error);
    refreshAttempts++;
    
    if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
      console.error('🚫 Máximo de tentativas de renovação atingido');
      clearTokens();
      window.location.href = '/login';
    }
    
    throw error;
  }
};



// Função para obter tokens do localStorage
const getTokens = () => {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  const expiresAt = localStorage.getItem('token_expires_at');
  
  return { accessToken, refreshToken, expiresAt };
};

// Função para salvar tokens no localStorage
const saveTokens = (tokenData: TokenResponse) => {
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
  
  localStorage.setItem('access_token', tokenData.access_token);
  localStorage.setItem('refresh_token', tokenData.refresh_token);
  localStorage.setItem('token_expires_at', expiresAt);
  localStorage.setItem('user_id', tokenData.user_id.toString());
  localStorage.setItem('company_id', tokenData.company_id.toString());
  localStorage.setItem('user_email', tokenData.email);
  localStorage.setItem('user_name', tokenData.full_name);
  localStorage.setItem('user_role', tokenData.role);
  
  // Integração com renovação preventiva
  if (tokenData.expires_in) {
    saveTokenExpiryTime(tokenData.expires_in);
    scheduleNextRefresh(tokenData.expires_in);
  }
};

// Função para limpar tokens do localStorage
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token_expires_at');
  localStorage.removeItem('user_id');
  localStorage.removeItem('company_id');
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_name');
  localStorage.removeItem('user_role');
};

// Função para verificar se o token está próximo do vencimento (5 minutos antes)
const isTokenNearExpiry = (expiresAt: string): boolean => {
  const expiryTime = new Date(expiresAt).getTime();
  const currentTime = Date.now();
  const fiveMinutes = 5 * 60 * 1000; // 5 minutos em millisegundos
  
  return (expiryTime - currentTime) <= fiveMinutes;
};



// Interceptador de requisição
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { accessToken, expiresAt } = getTokens();
    
    // Se há token e está próximo do vencimento, renovar preventivamente
    if (accessToken && expiresAt && isTokenNearExpiry(expiresAt)) {
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          const newToken = await refreshTokens();
          processQueue(null, newToken);
          if (!config.headers) {
            config.headers = {} as any;
          }
          config.headers.Authorization = `Bearer ${newToken}`;
        } catch (error) {
          processQueue(error as Error, null);
          throw error;
        } finally {
          isRefreshing = false;
        }
      } else {
        // Se já está renovando, aguardar na fila
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (!config.headers) {
                config.headers = {} as any;
              }
              config.headers.Authorization = `Bearer ${token}`;
              resolve(config);
            },
            reject,
          });
        });
      }
    } else if (accessToken) {
      // Token válido, adicionar ao header
      if (!config.headers) {
        config.headers = {} as any;
      }
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador de resposta inteligente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Detectar diferentes tipos de erro
    const status = error.response?.status;
    const isNetworkError = !error.response && error.code === 'NETWORK_ERROR';
    const isTimeoutError = error.code === 'ECONNABORTED';
    
    // Tratar erros de rede
    if (isNetworkError || isTimeoutError) {
      reportAuthError('network_error', 'Erro de conexão com o servidor');
      showNotification('error', 'Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique sua conexão.', 8000);
      return Promise.reject(error);
    }
    
    // Detecta token expirado (401) e evita loops infinitos
    if (status === 401 && !originalRequest._retry) {
      // Reportar erro de token expirado
      reportAuthError('token_expired', 'Token de acesso expirado');
      
      // Se já está renovando, adiciona à fila de espera
      if (isRefreshing) {
        console.log('⏳ Adicionando requisição à fila de espera...');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      // Marca como tentativa de renovação para evitar loops
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        console.log('🔄 Iniciando renovação automática do token...');
        
        // Mostrar notificação de renovação em andamento
        showNotification('info', 'Renovando Sessão', 'Renovando sua sessão automaticamente...', 3000);
        
        const newToken = await refreshTokens();
        
        // Processa todas as requisições na fila
        processQueue(null, newToken);
        
        // Mostrar notificação de sucesso
        showNotification('success', 'Sessão Renovada', 'Sua sessão foi renovada com sucesso.', 3000);
        
        // Reenvia a requisição original com novo token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        console.log('🔁 Reenviando requisição original...');
        
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Falha na renovação automática:', refreshError);
        
        // Reportar falha na renovação
        reportAuthError('refresh_failed', 'Falha ao renovar token de acesso');
        
        // Falha todas as requisições na fila
        processQueue(refreshError as Error, null);
        
        // Fallback: redireciona para login apenas após esgotar tentativas
        if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
          console.log('🚪 Máximo de tentativas atingido, abrindo modal de reautenticação...');
          
          // Em vez de redirecionar diretamente, reportar erro para abrir modal
          reportAuthError('refresh_failed', 'Múltiplas falhas na renovação do token');
          showNotification('error', 'Sessão Expirada', 'Sua sessão expirou. Por favor, faça login novamente.', 0);
          
          // Limpar tokens mas não redirecionar (deixar o modal cuidar disso)
          clearTokens();
        } else {
          // Mostrar notificação de tentativa
          showNotification('warning', 'Erro na Renovação', `Tentativa ${refreshAttempts}/${MAX_REFRESH_ATTEMPTS} falhou. Tentando novamente...`, 5000);
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Tratar outros erros de autorização
    if (status === 403) {
      reportAuthError('unauthorized', 'Acesso negado - permissões insuficientes');
      showNotification('error', 'Acesso Negado', 'Você não tem permissão para realizar esta ação.', 5000);
    }
    
    // Tratar erros de servidor
    if (status && status >= 500) {
      reportAuthError('network_error', 'Erro interno do servidor');
      showNotification('error', 'Erro do Servidor', 'Ocorreu um erro interno. Tente novamente em alguns instantes.', 8000);
    }
    
    return Promise.reject(error);
  }
);

// Função para login
export const login = async (email: string, password: string): Promise<TokenResponse> => {
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);
  
  const response = await axios.post<TokenResponse>(
    `${API_BASE_URL}/api/v1/login`,
    formData,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  
  const tokenData = response.data;
  saveTokens(tokenData);
  
  return tokenData;
};

// Função para logout
export const logout = () => {
  clearTokens();
  window.location.href = '/login';
};

// Função para verificar se está autenticado
export const isAuthenticated = (): boolean => {
  const { accessToken, expiresAt } = getTokens();
  
  if (!accessToken || !expiresAt) {
    return false;
  }
  
  const expiryTime = new Date(expiresAt).getTime();
  const currentTime = Date.now();
  
  return currentTime < expiryTime;
};

// Função para obter dados do usuário do localStorage
export const getUserData = () => {
  return {
    id: localStorage.getItem('user_id'),
    email: localStorage.getItem('user_email'),
    name: localStorage.getItem('user_name'),
    role: localStorage.getItem('user_role'),
    companyId: localStorage.getItem('company_id'),
  };
};

// Exportar funções utilitárias para uso em outros módulos
export { getTokens, saveTokens, clearTokens };

export default api;