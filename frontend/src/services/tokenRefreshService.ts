'use client';

import { getTokens, saveTokens, clearTokens } from './api';

// Tipos
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

// Configurações
const REFRESH_BUFFER_TIME = 15 * 60 * 1000; // 15 minutos em ms
const STORAGE_KEY_PREFIX = 'dl_token_';
const MULTI_TAB_EVENT = 'token_refreshed';

// Variáveis globais para sistema de notificações
let globalNotificationSystem: any = null;

// Função para registrar sistema de notificações
export const registerNotificationSystem = (notificationSystem: any) => {
  globalNotificationSystem = notificationSystem;
  console.log('📢 Sistema de notificações registrado no tokenRefreshService');
};

// Função para mostrar notificação
const showNotification = (type: string, title: string, message: string, duration?: number) => {
  if (globalNotificationSystem) {
    if (type === 'tokenRefreshWarning') {
      globalNotificationSystem.showTokenRefreshWarning(duration || 0);
    } else if (type === 'tokenRefreshSuccess') {
      globalNotificationSystem.showTokenRefreshSuccess();
    } else {
      globalNotificationSystem.showNotification({ type, title, message, duration });
    }
  }
};

// Variáveis de controle
let refreshTimer: NodeJS.Timeout | null = null;
let isPreventiveRefreshing = false;

// Função para calcular tempo restante do token
const getTokenExpiryTime = (): number | null => {
  const tokenExpiry = localStorage.getItem(`${STORAGE_KEY_PREFIX}expires_at`);
  return tokenExpiry ? parseInt(tokenExpiry) : null;
};

// Função para salvar tempo de expiração
const saveTokenExpiryTime = (expiresIn: number): void => {
  const expiryTime = Date.now() + (expiresIn * 1000);
  localStorage.setItem(`${STORAGE_KEY_PREFIX}expires_at`, expiryTime.toString());
};

// Função para renovação preventiva
const performPreventiveRefresh = async (): Promise<boolean> => {
  if (isPreventiveRefreshing) {
    console.log('⏳ Renovação preventiva já em andamento...');
    return false;
  }

  const { refreshToken } = getTokens();
  if (!refreshToken) {
    console.warn('⚠️ Refresh token não encontrado para renovação preventiva');
    return false;
  }

  isPreventiveRefreshing = true;

  try {
    console.log('🔄 Iniciando renovação preventiva do token...');
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${API_BASE_URL}/api/v1/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error(`Erro na renovação: ${response.status}`);
    }

    const tokenData: TokenResponse = await response.json();
    
    // Salva novos tokens
    saveTokens(tokenData);
    saveTokenExpiryTime(tokenData.expires_in);
    
    // Notifica outras abas
    notifyOtherTabs(tokenData);
    
    // Agenda próxima renovação
    scheduleNextRefresh(tokenData.expires_in);
    
    // Mostrar notificação de sucesso
    showNotification('tokenRefreshSuccess', '', '', 0);
    
    console.log('✅ Renovação preventiva concluída com sucesso');
    return true;
    
  } catch (error) {
    console.error('❌ Erro na renovação preventiva:', error);
    
    // Se falhar, agenda nova tentativa em 5 minutos
    scheduleNextRefresh(300); // 5 minutos
    return false;
    
  } finally {
    isPreventiveRefreshing = false;
  }
};

// Função principal para verificar e renovar token
const checkAndRefreshToken = async (): Promise<void> => {
  try {
    const expiryTime = getTokenExpiryTime();
    
    if (!expiryTime) {
      console.log('⚠️ Tempo de expiração não encontrado, parando serviço');
      stopTokenRefreshService();
      return;
    }
    
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;
    
    console.log(`⏰ Token expira em: ${Math.round(timeUntilExpiry / 60000)} minutos`);
    
    // Se o token está próximo de expirar
    if (timeUntilExpiry <= REFRESH_BUFFER_TIME && timeUntilExpiry > 0) {
      console.log('🔄 Token próximo do vencimento, iniciando renovação preventiva...');
      
      // Mostrar notificação de aviso
      showNotification('tokenRefreshWarning', '', '', timeUntilExpiry);
      
      await performPreventiveRefresh();
    }
    // Se o token já expirou
    else if (timeUntilExpiry <= 0) {
      console.log('⚠️ Token já expirou, tentando renovação de emergência...');
      
      await performPreventiveRefresh();
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação de token:', error);
    
    // Em caso de erro, tentar novamente após um delay
    setTimeout(() => {
      if (refreshTimer) {
        checkAndRefreshToken();
      }
    }, 60000); // 1 minuto de delay
  }
};

// Função para agendar próxima renovação
const scheduleNextRefresh = (expiresIn: number): void => {
  // Limpa timer anterior
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  // Calcula tempo para renovação (15 min antes de expirar)
  const refreshTime = (expiresIn * 1000) - REFRESH_BUFFER_TIME;
  
  // Garante que não seja negativo
  const timeUntilRefresh = Math.max(refreshTime, 60000); // Mínimo 1 minuto
  
  console.log(`⏰ Próxima renovação agendada em ${Math.round(timeUntilRefresh / 60000)} minutos`);
  
  refreshTimer = setTimeout(() => {
    performPreventiveRefresh();
  }, timeUntilRefresh);
};

// Função para notificar outras abas
const notifyOtherTabs = (tokenData: TokenResponse): void => {
  const event = {
    type: MULTI_TAB_EVENT,
    data: {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      user_id: tokenData.user_id,
      company_id: tokenData.company_id,
      email: tokenData.email,
      full_name: tokenData.full_name,
      role: tokenData.role,
      timestamp: Date.now(),
    },
  };
  
  localStorage.setItem('token_sync_event', JSON.stringify(event));
  localStorage.removeItem('token_sync_event'); // Trigger event
};

// Listener para sincronização entre abas
const setupMultiTabSync = (): void => {
  window.addEventListener('storage', (event) => {
    if (event.key === 'token_sync_event' && event.newValue) {
      try {
        const syncEvent = JSON.parse(event.newValue);
        
        if (syncEvent.type === MULTI_TAB_EVENT) {
          console.log('🔄 Sincronizando token de outra aba...');
          
          const { data } = syncEvent;
          
          // Atualiza tokens localmente
          saveTokens({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            token_type: data.token_type,
            expires_in: data.expires_in,
            user_id: data.user_id,
            company_id: data.company_id,
            email: data.email,
            full_name: data.full_name,
            role: data.role
          });
          
          saveTokenExpiryTime(data.expires_in);
          
          // Reagenda renovação
          scheduleNextRefresh(data.expires_in);
          
          console.log('✅ Token sincronizado entre abas');
        }
      } catch (error) {
        console.error('❌ Erro na sincronização entre abas:', error);
      }
    }
  });
};

// Função para inicializar o serviço
const initializeTokenRefreshService = (): void => {
  console.log('🚀 Inicializando serviço de renovação preventiva...');
  
  // Configura sincronização entre abas
  setupMultiTabSync();
  
  // Verifica se há token válido
  const expiryTime = getTokenExpiryTime();
  
  if (expiryTime) {
    const timeUntilExpiry = expiryTime - Date.now();
    const expiresInSeconds = Math.floor(timeUntilExpiry / 1000);
    
    if (expiresInSeconds > 0) {
      console.log(`⏰ Token expira em ${Math.round(expiresInSeconds / 60)} minutos`);
      scheduleNextRefresh(expiresInSeconds);
    } else {
      console.log('⚠️ Token já expirado, renovação necessária');
      performPreventiveRefresh();
    }
  }
};

// Função para parar o serviço
const stopTokenRefreshService = (): void => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  
  console.log('🛑 Serviço de renovação preventiva parado');
};

// Função para forçar renovação manual
const forceTokenRefresh = async (): Promise<boolean> => {
  return await performPreventiveRefresh();
};

// Função para verificar se token precisa ser renovado
const shouldRefreshToken = (): boolean => {
  const expiryTime = getTokenExpiryTime();
  
  if (!expiryTime) return false;
  
  const timeUntilExpiry = expiryTime - Date.now();
  return timeUntilExpiry <= REFRESH_BUFFER_TIME;
};

export {
  initializeTokenRefreshService,
  stopTokenRefreshService,
  forceTokenRefresh,
  shouldRefreshToken,
  saveTokenExpiryTime,
  scheduleNextRefresh,
};